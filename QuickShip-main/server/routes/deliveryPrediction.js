const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const deliveryPredictionService = require('../services/deliveryPredictionService');

router.get('/status', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        res.json(deliveryPredictionService.getStatus());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch model status' });
    }
});

router.post('/train', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const status = await deliveryPredictionService.trainModel();
        res.json(status);
    } catch (err) {
        console.error('[ML TRAIN ERROR]', err);
        res.status(500).json({ error: 'Training failed' });
    }
});

router.post('/predict', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const { distance, weight, deliveryType, priority } = req.body;
        if (distance === undefined || weight === undefined || !deliveryType || !priority) {
            return res.status(400).json({ error: 'distance, weight, deliveryType, and priority are required' });
        }
        const result = deliveryPredictionService.predictDeliveryTime({ distance, weight, deliveryType, priority });
        res.json(result);
    } catch (err) {
        console.error('[ML PREDICT ERROR]', err);
        res.status(500).json({ error: 'Prediction failed' });
    }
});

router.get('/accuracy-report', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const report = await deliveryPredictionService.getAccuracyReport();
        res.json(report);
    } catch (err) {
        console.error('[ACCURACY REPORT ERROR]', err);
        res.status(500).json({ error: 'Failed to build accuracy report' });
    }
});

module.exports = router;
