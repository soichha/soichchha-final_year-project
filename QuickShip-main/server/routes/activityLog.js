const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const { parseLocalDate } = require('../utils/dateUtils');

router.get('/', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);

        const where = {};
        if (req.query.role) where.role = req.query.role;
        if (req.query.action) where.action = { [Op.like]: `%${req.query.action}%` };
        if (req.query.from || req.query.to) {
            where.created_at = {};
            if (req.query.from) where.created_at[Op.gte] = parseLocalDate(req.query.from);
            if (req.query.to) {
                const end = parseLocalDate(req.query.to);
                end.setHours(23, 59, 59, 999);
                where.created_at[Op.lte] = end;
            }
        }

        const { rows, count } = await db.ActivityLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            include: [{ model: db.Parcel, as: 'parcel', attributes: ['parcel_id', 'tracking_hash'] }]
        });

        res.json({
            entries: rows,
            page,
            pageSize,
            total: count,
            totalPages: Math.ceil(count / pageSize)
        });
    } catch (err) {
        console.error('[ACTIVITY LOG FETCH ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});

module.exports = router;
