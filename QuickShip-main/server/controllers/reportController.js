

const reportService = require('../services/reportService');

async function generateReport(req, res) {
    try {
        const { period, date } = req.query;
        const report = await reportService.generateReport(period, date);
        res.json(report);
    } catch (err) {
        console.error('[REPORT GENERATION ERROR]', err);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
}

module.exports = { generateReport };
