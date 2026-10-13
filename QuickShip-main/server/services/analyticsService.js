
const db = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { ACTIVE_STATUSES, IN_PROGRESS_STATUSES } = require('../utils/constants');
const { formatLocalDate, parseLocalDate, localDayKeyExpr, localMonthKeyExpr, monthWindow } = require('../utils/dateUtils');

const { Parcel, Delivery, Payment, User, Location, sequelize } = db;

function resolveDateRange(range, from, to) {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    switch (range) {
        case 'today':
            return { startDate: startOfToday, endDate: endOfToday };
        case '7d': {
            const start = new Date(startOfToday);
            start.setDate(start.getDate() - 6);
            return { startDate: start, endDate: endOfToday };
        }
        case '12m': {
            const start = new Date(startOfToday);
            start.setMonth(start.getMonth() - 12);
            return { startDate: start, endDate: endOfToday };
        }
        case 'custom': {
            const start = from ? parseLocalDate(from) : null;
            const end = to ? parseLocalDate(to) : null;
            if (start && !isNaN(start) && end && !isNaN(end)) {
                end.setHours(23, 59, 59, 999);
                return { startDate: start, endDate: end };
            }
        }
        case '30d':
        default: {
            const start = new Date(startOfToday);
            start.setDate(start.getDate() - 29);
            return { startDate: start, endDate: endOfToday };
        }
    }
}

async function getSummaryCards() {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday); startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalCustomers,
        totalStaff,
        totalParcels,
        activeDeliveries,
        delivered,
        pending,
        cancelled,
        todaysBookings,
        todaysRevenue,
        monthlyRevenue,
        deliveryAttempts,
        failedDeliveries,
        rescheduledDeliveries
    ] = await Promise.all([
        User.count({ where: { role: 'client' } }),
        User.count({ where: { role: 'staff' } }),
        Parcel.count(),
        Parcel.count({ where: { parcel_status: { [Op.in]: IN_PROGRESS_STATUSES } } }),
        Parcel.count({ where: { parcel_status: 'Delivered' } }),
        Parcel.count({ where: { parcel_status: 'Booked' } }),
        Parcel.count({ where: { parcel_status: 'Cancelled' } }),
        Parcel.count({ where: { booking_date: { [Op.gte]: startOfToday, [Op.lt]: startOfTomorrow } } }),
        Payment.sum('amount', { where: { payment_status: 'Completed', payment_date: { [Op.gte]: startOfToday, [Op.lt]: startOfTomorrow } } }),
        Payment.sum('amount', { where: { payment_status: 'Completed', payment_date: { [Op.gte]: startOfMonth } } }),
        db.DeliveryAttempt.count(),
        Parcel.count({ where: { parcel_status: 'Delivery Attempt Failed' } }),
        Parcel.count({ where: { parcel_status: 'Rescheduled' } })
    ]);

    const finishedParcels = delivered + cancelled;
    const deliverySuccessRate = finishedParcels > 0
        ? Number(((delivered / finishedParcels) * 100).toFixed(1))
        : 0;

    return {
        totalCustomers,
        totalStaff,
        totalParcels,
        activeDeliveries,
        delivered,
        pending,
        cancelled,
        todaysBookings,
        todaysRevenue: todaysRevenue || 0,
        monthlyRevenue: monthlyRevenue || 0,
        deliveryAttempts,
        failedDeliveries,
        rescheduledDeliveries,
        deliverySuccessRate
    };
}

async function getDailyBookingTrend(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: [
            [localDayKeyExpr('booking_date'), 'date'],
            [fn('COUNT', col('parcel_id')), 'count']
        ],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        group: [localDayKeyExpr('booking_date')],
        order: [[localDayKeyExpr('booking_date'), 'ASC']],
        raw: true
    });

    const map = new Map(rows.map(r => [r.date, Number(r.count)]));
    const result = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    while (cursor <= end) {
        const key = formatLocalDate(cursor);
        result.push({ date: key, count: map.get(key) || 0 });
        cursor.setDate(cursor.getDate() + 1);
    }
    return result;
}

async function getMonthlyRevenueTrend(endDate = new Date()) {
    const { start, keys } = monthWindow(12, endDate);

    const rows = await Payment.findAll({
        attributes: [
            [localMonthKeyExpr('payment_date'), 'month'],
            [fn('SUM', col('amount')), 'revenue']
        ],
        where: { payment_status: 'Completed', payment_date: { [Op.gte]: start, [Op.lte]: endDate } },
        group: [localMonthKeyExpr('payment_date')],
        order: [[localMonthKeyExpr('payment_date'), 'ASC']],
        raw: true
    });

    const map = new Map(rows.map(r => [r.month, Number(r.revenue)]));
    return keys.map(key => ({ month: key, revenue: map.get(key) || 0 }));
}

async function getDeliveryStatusDistribution(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: ['parcel_status', [fn('COUNT', col('parcel_id')), 'count']],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        group: ['parcel_status'],
        raw: true
    });

    const buckets = { Delivered: 0, Pending: 0, Cancelled: 0, 'In Transit': 0 };
    for (const r of rows) {
        const count = Number(r.count);
        if (r.parcel_status === 'Delivered') buckets.Delivered += count;
        else if (r.parcel_status === 'Cancelled') buckets.Cancelled += count;
        else if (['Picked Up', 'In Transit', 'Out for Delivery'].includes(r.parcel_status)) buckets['In Transit'] += count;
        else buckets.Pending += count;
    }
    return Object.entries(buckets).map(([status, count]) => ({ status, count }));
}

async function getDeliveryMethodDistribution(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: ['delivery_type', [fn('COUNT', col('parcel_id')), 'count']],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        group: ['delivery_type'],
        raw: true
    });

    const buckets = { Vehicle: 0, Air: 0 };
    for (const r of rows) buckets[r.delivery_type] = Number(r.count);
    return Object.entries(buckets).map(([method, count]) => ({ method, count }));
}

async function getTopDestinations(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: [
            'destination_location_id',
            [fn('COUNT', col('Parcel.parcel_id')), 'count']
        ],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        include: [{ model: Location, as: 'destinationLocation', attributes: ['city_or_area', 'district'] }],
        group: ['destination_location_id', 'destinationLocation.location_id'],
        order: [[literal('count'), 'DESC']],
        limit: 10,
        subQuery: false
    });

    return rows.map(r => {
        const d = r.toJSON();
        return {
            destination: d.destinationLocation ? `${d.destinationLocation.city_or_area}, ${d.destinationLocation.district}` : 'Unknown',
            count: Number(d.count)
        };
    });
}

async function getStaffPerformance(startDate, endDate) {
    const staffMembers = await User.findAll({
        where: { role: 'staff' },
        attributes: ['user_id', 'full_name']
    });

    const rows = await Delivery.findAll({
        attributes: [
            'staff_id',
            [col('parcel.parcel_status'), 'status'],
            [fn('COUNT', col('Delivery.delivery_id')), 'count']
        ],
        include: [{
            model: Parcel,
            as: 'parcel',
            attributes: [],
            where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
            required: true
        }],
        group: ['staff_id', 'parcel.parcel_status'],
        raw: true
    });

    const perStaff = new Map(staffMembers.map(s => [s.user_id, { staff_id: s.user_id, full_name: s.full_name, assigned: 0, completed: 0, pending: 0 }]));

    for (const r of rows) {
        const entry = perStaff.get(r.staff_id);
        if (!entry) continue;
        const count = Number(r.count);
        entry.assigned += count;
        if (r.status === 'Delivered') entry.completed += count;
        else if (ACTIVE_STATUSES.includes(r.status)) entry.pending += count;
    }

    return Array.from(perStaff.values()).map(s => ({
        ...s,
        completionRate: s.assigned > 0 ? Number(((s.completed / s.assigned) * 100).toFixed(1)) : 0
    }));
}

async function getCustomerGrowth(endDate = new Date()) {
    const { start, keys } = monthWindow(12, endDate);

    const rows = await User.findAll({
        attributes: [
            [localMonthKeyExpr('created_at'), 'month'],
            [fn('COUNT', col('user_id')), 'count']
        ],
        where: { role: 'client', created_at: { [Op.gte]: start, [Op.lte]: endDate } },
        group: [localMonthKeyExpr('created_at')],
        order: [[localMonthKeyExpr('created_at'), 'ASC']],
        raw: true
    });

    const map = new Map(rows.map(r => [r.month, Number(r.count)]));
    return keys.map(key => ({ month: key, count: map.get(key) || 0 }));
}

const WEIGHT_BUCKET_SQL = `
    CASE
        WHEN weight <= 1 THEN '0-1 kg'
        WHEN weight <= 5 THEN '1-5 kg'
        WHEN weight <= 10 THEN '5-10 kg'
        WHEN weight <= 20 THEN '10-20 kg'
        ELSE '20+ kg'
    END
`;
const WEIGHT_BUCKET_ORDER = ['0-1 kg', '1-5 kg', '5-10 kg', '10-20 kg', '20+ kg'];

async function getWeightDistribution(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: [
            [literal(WEIGHT_BUCKET_SQL), 'bucket'],
            [fn('COUNT', col('parcel_id')), 'count']
        ],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        group: [literal(WEIGHT_BUCKET_SQL)],
        raw: true
    });

    const map = new Map(rows.map(r => [r.bucket, Number(r.count)]));
    return WEIGHT_BUCKET_ORDER.map(bucket => ({ bucket, count: map.get(bucket) || 0 }));
}

async function getChartData(range, from, to) {
    const { startDate, endDate } = resolveDateRange(range, from, to);
    return getChartDataForRange(startDate, endDate, range || '30d');
}

async function getChartDataForRange(startDate, endDate, rangeKey) {
    const [
        dailyBookingTrend,
        monthlyRevenueTrend,
        deliveryStatusDistribution,
        deliveryMethodDistribution,
        topDestinations,
        staffPerformance,
        customerGrowth,
        weightDistribution
    ] = await Promise.all([
        getDailyBookingTrend(startDate, endDate),
        getMonthlyRevenueTrend(endDate),
        getDeliveryStatusDistribution(startDate, endDate),
        getDeliveryMethodDistribution(startDate, endDate),
        getTopDestinations(startDate, endDate),
        getStaffPerformance(startDate, endDate),
        getCustomerGrowth(endDate),
        getWeightDistribution(startDate, endDate)
    ]);

    return {
        range: { key: rangeKey, startDate, endDate },
        dailyBookingTrend,
        monthlyRevenueTrend,
        deliveryStatusDistribution,
        deliveryMethodDistribution,
        topDestinations,
        staffPerformance,
        customerGrowth,
        weightDistribution
    };
}

module.exports = {
    resolveDateRange,
    getSummaryCards,
    getChartData,
    getChartDataForRange
};
