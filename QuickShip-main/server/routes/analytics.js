const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');

router.get('/summary', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const summary = await analyticsService.getSummaryCards();
        res.json(summary);
    } catch (err) {
        console.error('[ANALYTICS SUMMARY ERROR]', err);
        res.status(500).json({ error: 'Failed to load analytics summary' });
    }
});

module.exports = router;
