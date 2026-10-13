

const db = require('../models');
const { Op, fn, col } = require('sequelize');
const { haversine } = require('../utils/costCalculator');
const { estimateDeliveryTime } = require('../utils/etaCalculator');
const reportUtils = require('../utils/reportUtils');

const analyticsService = require('./analyticsService');
const feedbackService = require('./feedbackService');
const staffAssignmentService = require('./staffAssignmentService');

const { Parcel, Delivery, Payment, User, Location } = db;

const DELAYED_DELIVERY_ANALYSIS_LIMIT = 2000;

async function getBookingSummary(startDate, endDate) {
    const rows = await Parcel.findAll({
        attributes: ['parcel_status', [fn('COUNT', col('parcel_id')), 'count']],
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        group: ['parcel_status'],
        raw: true
    });

    let total = 0, delivered = 0, pending = 0, cancelled = 0, active = 0;
    for (const r of rows) {
        const count = Number(r.count);
        total += count;
        if (r.parcel_status === 'Delivered') delivered += count;
        else if (r.parcel_status === 'Cancelled') cancelled += count;
        else if (r.parcel_status === 'Booked') pending += count;
        else active += count;
    }

    return { total, delivered, pending, cancelled, active };
}

async function getFinancialSummary(startDate, endDate) {
    const [revenueResult, costStats] = await Promise.all([
        Payment.sum('amount', {
            where: { payment_status: 'Completed' },
            include: [{ model: Parcel, as: 'parcel', attributes: [], where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } }, required: true }]
        }),
        Parcel.findOne({
            attributes: [
                [fn('AVG', col('total_cost')), 'avgCost'],
                [fn('MAX', col('total_cost')), 'maxCost'],
                [fn('MIN', col('total_cost')), 'minCost']
            ],
            where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
            raw: true
        })
    ]);

    return {
        totalRevenue: revenueResult || 0,
        avgCost: costStats && costStats.avgCost ? Number(costStats.avgCost) : 0,
        highestCost: costStats && costStats.maxCost ? Number(costStats.maxCost) : 0,
        lowestCost: costStats && costStats.minCost ? Number(costStats.minCost) : 0
    };
}

async function getDeliveryPerformance(startDate, endDate) {
    const parcels = await Parcel.findAll({
        where: { booking_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
        include: [
            { model: Location, as: 'sourceLocation', attributes: ['latitude', 'longitude'] },
            { model: Location, as: 'destinationLocation', attributes: ['latitude', 'longitude'] },
            { model: Delivery, as: 'delivery', attributes: ['delivered_at'], required: false }
        ],
        limit: DELAYED_DELIVERY_ANALYSIS_LIMIT
    });

    let etaDaysSum = 0, etaCount = 0;
    let actualDaysSum = 0, actualCount = 0;
    let delayedDeliveries = 0;
    let deliveredCount = 0;

    for (const p of parcels) {
        const d = p.toJSON();
        let distance = 0;
        if (d.sourceLocation?.latitude && d.destinationLocation?.latitude) {
            distance = haversine(
                d.sourceLocation.latitude, d.sourceLocation.longitude,
                d.destinationLocation.latitude, d.destinationLocation.longitude
            );
        }
        let etaDays;
        if (d.predicted_delivery_hours !== null && d.predicted_delivery_hours !== undefined) {
            etaDays = Number(d.predicted_delivery_hours) / 24;
        } else {
            const eta = estimateDeliveryTime(distance, d.delivery_type, d.booking_date);
            etaDays = Math.max(0, (new Date(eta.date) - new Date(d.booking_date)) / 86400000);
        }
        etaDaysSum += etaDays;
        etaCount++;

        if (d.parcel_status === 'Delivered' && d.delivery?.delivered_at) {
            deliveredCount++;
            const actualDays = Math.max(0, (new Date(d.delivery.delivered_at) - new Date(d.booking_date)) / 86400000);
            actualDaysSum += actualDays;
            actualCount++;
            if (actualDays > etaDays) delayedDeliveries++;
        }
    }

    const total = parcels.length;
    return {
        avgEtaDays: etaCount > 0 ? Number((etaDaysSum / etaCount).toFixed(1)) : 0,
        avgActualDeliveryDays: actualCount > 0 ? Number((actualDaysSum / actualCount).toFixed(1)) : 0,
        deliverySuccessRate: total > 0 ? Number(((deliveredCount / total) * 100).toFixed(1)) : 0,
        delayedDeliveries
    };
}

async function getStaffPerformanceSummary(startDate, endDate, staffPerformanceFromAnalytics) {
    const [totalStaff, activeStaffRows] = await Promise.all([
        User.count({ where: { role: 'staff' } }),
        Delivery.findAll({
            attributes: ['staff_id'],
            where: { assigned_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
            group: ['staff_id'],
            raw: true
        })
    ]);

    const bestPerformingStaff = staffPerformanceFromAnalytics
        .slice()
        .sort((a, b) => b.completed - a.completed || b.completionRate - a.completionRate)[0] || null;

    return {
        totalStaff,
        activeStaff: activeStaffRows.length,
        bestPerformingStaff: bestPerformingStaff && bestPerformingStaff.assigned > 0 ? bestPerformingStaff : null,
        workloadSummary: staffPerformanceFromAnalytics.map(s => ({
            full_name: s.full_name,
            assigned: s.assigned,
            completed: s.completed,
            pending: s.pending,
            completionRate: s.completionRate
        }))
    };
}

async function getSmartAssignmentSummary(startDate, endDate) {
    const [assignmentRows, currentWorkloads] = await Promise.all([
        Delivery.findAll({
            attributes: ['assignment_type', [fn('COUNT', col('delivery_id')), 'count']],
            where: { assigned_date: { [Op.gte]: startDate, [Op.lte]: endDate } },
            group: ['assignment_type'],
            raw: true
        }),
        staffAssignmentService.getStaffWorkloads()
    ]);

    let autoAssignments = 0, manualAssignments = 0;
    for (const r of assignmentRows) {
        if (r.assignment_type === 'Auto') autoAssignments = Number(r.count);
        else if (r.assignment_type === 'Manual') manualAssignments = Number(r.count);
    }

    const totalAssignments = autoAssignments + manualAssignments;
    const avgWorkload = currentWorkloads.length > 0
        ? currentWorkloads.reduce((sum, w) => sum + w.workload, 0) / currentWorkloads.length
        : 0;

    return {
        autoAssignments,
        manualAssignments,
        avgWorkload,
        assignmentEfficiency: totalAssignments > 0 ? Number(((autoAssignments / totalAssignments) * 100).toFixed(1)) : 0
    };
}

async function generateReport(periodInput, dateParam) {
    const period = reportUtils.resolveReportPeriod(periodInput, dateParam);
    const company = reportUtils.buildCompanyInfo(period);

    const [
        booking,
        previousBooking,
        financial,
        deliveryPerformance,
        businessAnalytics,
        feedback,
        smartAssignment
    ] = await Promise.all([
        getBookingSummary(period.startDate, period.endDate),
        getBookingSummary(period.previousStart, period.previousEnd),
        getFinancialSummary(period.startDate, period.endDate),
        getDeliveryPerformance(period.startDate, period.endDate),
        analyticsService.getChartDataForRange(period.startDate, period.endDate, period.rangeKey),
        feedbackService.getFeedbackAnalytics({ startDate: period.startDate, endDate: period.endDate }),
        getSmartAssignmentSummary(period.startDate, period.endDate)
    ]);

    const staffPerformance = await getStaffPerformanceSummary(period.startDate, period.endDate, businessAnalytics.staffPerformance);

    const report = {
        company,
        period: { key: ['daily', 'weekly', 'monthly'].includes(periodInput) ? periodInput : 'daily', startDate: period.startDate, endDate: period.endDate },
        booking,
        previousBooking,
        financial,
        deliveryPerformance,
        staffPerformance,
        smartAssignment,
        businessAnalytics: {
            topDestinations: businessAnalytics.topDestinations,
            deliveryStatusDistribution: businessAnalytics.deliveryStatusDistribution,
            deliveryMethodDistribution: businessAnalytics.deliveryMethodDistribution,
            dailyBookingTrend: businessAnalytics.dailyBookingTrend,
            monthlyRevenueTrend: businessAnalytics.monthlyRevenueTrend,
            customerGrowth: businessAnalytics.customerGrowth
        },
        feedback: {
            averageRating: feedback.averageRating,
            totalReviews: feedback.totalReviews,
            ratingDistribution: feedback.ratingDistribution,
            positiveReviews: feedback.positiveReviews,
            negativeReviews: feedback.negativeReviews,
            topRatedStaff: feedback.topRatedStaff,
            lowestRatedStaff: feedback.lowestRatedStaff
        }
    };

    report.businessSummary = reportUtils.generateBusinessSummary(report);
    report.recommendations = reportUtils.generateRecommendations(report);

    return report;
}

module.exports = {
    getBookingSummary,
    getFinancialSummary,
    getDeliveryPerformance,
    getStaffPerformanceSummary,
    getSmartAssignmentSummary,
    generateReport
};
