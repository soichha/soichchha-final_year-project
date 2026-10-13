const db = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const { Feedback, Parcel, User, Delivery } = db;
const { parseLocalDate, localMonthKeyExpr, monthWindow } = require('../utils/dateUtils');

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function isValidRating(rating) {
    const n = Number(rating);
    return Number.isInteger(n) && n >= 1 && n <= 5;
}

class FeedbackError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

async function createFeedback({ parcelId, customerId, rating, title, comment }) {
    if (!isValidRating(rating)) {
        throw new FeedbackError('Rating must be a whole number between 1 and 5.', 400);
    }

    const parcel = await Parcel.findByPk(parcelId);
    if (!parcel) throw new FeedbackError('Parcel not found.', 404);
    if (parcel.client_id !== customerId) throw new FeedbackError('You can only review your own parcels.', 403);
    if (parcel.parcel_status !== 'Delivered') throw new FeedbackError('Feedback is only allowed after a parcel has been delivered.', 400);

    const existing = await Feedback.findOne({ where: { parcel_id: parcelId } });
    if (existing) throw new FeedbackError('Feedback has already been submitted for this parcel.', 409);

    const delivery = await Delivery.findOne({ where: { parcel_id: parcelId } });

    return Feedback.create({
        parcel_id: parcelId,
        customer_id: customerId,
        staff_id: delivery ? delivery.staff_id : null,
        rating,
        title: title || null,
        comment: comment || null
    });
}

async function updateFeedback({ feedbackId, customerId, rating, title, comment }) {
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) throw new FeedbackError('Feedback not found.', 404);
    if (feedback.customer_id !== customerId) throw new FeedbackError('You can only edit your own feedback.', 403);

    const age = Date.now() - new Date(feedback.created_at).getTime();
    if (age > EDIT_WINDOW_MS) throw new FeedbackError('Feedback can only be edited within 24 hours of submission.', 403);

    if (rating !== undefined && !isValidRating(rating)) {
        throw new FeedbackError('Rating must be a whole number between 1 and 5.', 400);
    }

    await feedback.update({
        rating: rating !== undefined ? rating : feedback.rating,
        title: title !== undefined ? title : feedback.title,
        comment: comment !== undefined ? comment : feedback.comment
    });

    return feedback;
}

async function getCustomerFeedbacks(customerId) {
    return Feedback.findAll({
        where: { customer_id: customerId },
        order: [['created_at', 'DESC']]
    });
}

async function getFeedbackByParcel(parcelId) {
    return Feedback.findOne({
        where: { parcel_id: parcelId },
        include: [
            { model: User, as: 'staff', attributes: ['user_id', 'full_name'] },
            { model: User, as: 'customer', attributes: ['user_id', 'full_name'] }
        ]
    });
}

async function getStaffFeedbackSummary(staffId) {
    const [feedbacks, completedDeliveries, avgResult] = await Promise.all([
        Feedback.findAll({
            where: { staff_id: staffId },
            include: [{ model: User, as: 'customer', attributes: ['full_name'] }],
            order: [['created_at', 'DESC']],
            limit: 20
        }),
        Parcel.count({
            where: { parcel_status: 'Delivered' },
            include: [{ model: Delivery, as: 'delivery', where: { staff_id: staffId }, required: true }]
        }),
        Feedback.findOne({
            where: { staff_id: staffId },
            attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('feedback_id')), 'count']],
            raw: true
        })
    ]);

    return {
        averageRating: avgResult && avgResult.avg ? Number(Number(avgResult.avg).toFixed(2)) : 0,
        totalReviews: avgResult ? Number(avgResult.count) : 0,
        completedDeliveries,
        recentReviews: feedbacks.map(f => ({
            feedback_id: f.feedback_id,
            rating: f.rating,
            title: f.title,
            comment: f.comment,
            customer_name: f.customer ? f.customer.full_name : 'Customer',
            created_at: f.created_at
        }))
    };
}

async function getAdminFeedbackList({ staffId, rating, dateFrom, dateTo, search, page = 1, limit = 20 }) {
    const where = {};
    if (staffId) where.staff_id = staffId;
    if (rating) where.rating = rating;
    if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at[Op.gte] = parseLocalDate(dateFrom);
        if (dateTo) {
            const end = parseLocalDate(dateTo);
            end.setHours(23, 59, 59, 999);
            where.created_at[Op.lte] = end;
        }
    }
    if (search) {
        where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { comment: { [Op.like]: `%${search}%` } }
        ];
    }

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

    const { count, rows } = await Feedback.findAndCountAll({
        where,
        include: [
            { model: User, as: 'customer', attributes: ['full_name'] },
            { model: User, as: 'staff', attributes: ['full_name'] },
            { model: Parcel, as: 'parcel', attributes: ['tracking_hash'] }
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
    });

    return { total: count, page: Number(page), limit: Number(limit), items: rows };
}

async function getFeedbackAnalytics({ startDate, endDate } = {}) {
    const hasRange = Boolean(startDate && endDate);
    const rangeWhere = hasRange ? { created_at: { [Op.gte]: startDate, [Op.lte]: endDate } } : {};
    const { start: start12mo, keys: monthKeys } = monthWindow(12, hasRange ? endDate : new Date());
    const monthlyWhere = { created_at: { [Op.gte]: start12mo, ...(hasRange ? { [Op.lte]: endDate } : {}) } };

    const [
        overall,
        ratingRows,
        mostRecent,
        staffRatingRows,
        monthlyRows
    ] = await Promise.all([
        Feedback.findOne({
            attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('feedback_id')), 'count']],
            where: rangeWhere,
            raw: true
        }),
        Feedback.findAll({
            attributes: ['rating', [fn('COUNT', col('feedback_id')), 'count']],
            where: rangeWhere,
            group: ['rating'],
            raw: true
        }),
        Feedback.findAll({
            where: rangeWhere,
            include: [
                { model: User, as: 'customer', attributes: ['full_name'] },
                { model: Parcel, as: 'parcel', attributes: ['tracking_hash'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        }),
        Feedback.findAll({
            attributes: ['staff_id', [fn('AVG', col('rating')), 'avgRating'], [fn('COUNT', col('feedback_id')), 'count']],
            include: [{ model: User, as: 'staff', attributes: ['full_name'] }],
            where: { staff_id: { [Op.ne]: null }, ...rangeWhere },
            group: ['staff_id', 'staff.user_id'],
            raw: true
        }),
        Feedback.findAll({
            attributes: [
                [localMonthKeyExpr('created_at'), 'month'],
                [fn('AVG', col('rating')), 'avgRating'],
                [fn('COUNT', col('feedback_id')), 'count']
            ],
            where: monthlyWhere,
            group: [localMonthKeyExpr('created_at')],
            order: [[localMonthKeyExpr('created_at'), 'ASC']],
            raw: true
        })
    ]);

    const totalReviews = overall ? Number(overall.count) : 0;
    const averageRating = overall && overall.avg ? Number(Number(overall.avg).toFixed(2)) : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(r => {
        const found = ratingRows.find(row => Number(row.rating) === r);
        return { rating: r, count: found ? Number(found.count) : 0 };
    });

    const positiveReviews = ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0);
    const negativeReviews = ratingDistribution.filter(r => r.rating <= 2).reduce((sum, r) => sum + r.count, 0);

    const staffRatings = staffRatingRows
        .filter(r => r.count >= 1)
        .map(r => ({
            staff_id: r.staff_id,
            full_name: r['staff.full_name'],
            averageRating: Number(Number(r.avgRating).toFixed(2)),
            totalReviews: Number(r.count)
        }));

    const topRatedStaff = [...staffRatings].sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);
    const lowestRatedStaff = [...staffRatings].sort((a, b) => a.averageRating - b.averageRating).slice(0, 5);

    const monthlyMap = new Map(monthlyRows.map(r => [r.month, { avgRating: Number(r.avgRating), count: Number(r.count) }]));
    const monthlySatisfactionTrend = [];
    const feedbackCountByMonth = [];
    for (const key of monthKeys) {
        const entry = monthlyMap.get(key);
        monthlySatisfactionTrend.push({ month: key, averageRating: entry ? Number(entry.avgRating.toFixed(2)) : 0 });
        feedbackCountByMonth.push({ month: key, count: entry ? entry.count : 0 });
    }

    return {
        averageRating,
        totalReviews,
        ratingDistribution,
        positiveReviews,
        negativeReviews,
        mostRecentReviews: mostRecent.map(f => ({
            feedback_id: f.feedback_id,
            rating: f.rating,
            title: f.title,
            comment: f.comment,
            customer_name: f.customer ? f.customer.full_name : 'Customer',
            tracking_hash: f.parcel ? f.parcel.tracking_hash : null,
            created_at: f.created_at
        })),
        topRatedStaff,
        lowestRatedStaff,
        monthlySatisfactionTrend,
        feedbackCountByMonth
    };
}

module.exports = {
    FeedbackError,
    isValidRating,
    createFeedback,
    updateFeedback,
    getCustomerFeedbacks,
    getFeedbackByParcel,
    getStaffFeedbackSummary,
    getAdminFeedbackList,
    getFeedbackAnalytics
};
