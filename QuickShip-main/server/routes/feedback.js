const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const feedbackService = require('../services/feedbackService');

const handleServiceError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[FEEDBACK ERROR]', err);
    return res.status(500).json({ error: 'Something went wrong with feedback.' });
};

router.post('/', verifyToken, authorize(['client']), async (req, res) => {
    try {
        const { parcelId, rating, title, comment } = req.body;
        const feedback = await feedbackService.createFeedback({
            parcelId,
            customerId: req.user.id,
            rating,
            title,
            comment
        });
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.put('/:id', verifyToken, authorize(['client']), async (req, res) => {
    try {
        const { rating, title, comment } = req.body;
        const feedback = await feedbackService.updateFeedback({
            feedbackId: req.params.id,
            customerId: req.user.id,
            rating,
            title,
            comment
        });
        res.json({ message: 'Feedback updated successfully', feedback });
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.get('/mine', verifyToken, authorize(['client']), async (req, res) => {
    try {
        const feedbacks = await feedbackService.getCustomerFeedbacks(req.user.id);
        res.json(feedbacks);
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.get('/parcel/:parcelId', verifyToken, async (req, res) => {
    try {
        const feedback = await feedbackService.getFeedbackByParcel(req.params.parcelId);
        if (!feedback) return res.status(404).json({ error: 'No feedback found for this parcel.' });

        if (req.user.role === 'client' && feedback.customer_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        if (req.user.role === 'staff' && feedback.staff_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        res.json(feedback);
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.get('/staff/me', verifyToken, authorize(['staff']), async (req, res) => {
    try {
        const summary = await feedbackService.getStaffFeedbackSummary(req.user.id);
        res.json(summary);
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.get('/admin/list', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const { staffId, rating, dateFrom, dateTo, search, page, limit } = req.query;
        const result = await feedbackService.getAdminFeedbackList({ staffId, rating, dateFrom, dateTo, search, page, limit });
        res.json(result);
    } catch (err) {
        handleServiceError(res, err);
    }
});

router.get('/admin/analytics', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const analytics = await feedbackService.getFeedbackAnalytics();
        res.json(analytics);
    } catch (err) {
        handleServiceError(res, err);
    }
});

module.exports = router;
