const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/generate', verifyToken, authorize(['admin']), reportController.generateReport);

module.exports = router;
