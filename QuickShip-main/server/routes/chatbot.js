const express = require('express');
const router = express.Router();
const { verifyToken } = require('./middleware/authMiddleware');
const { getChatbotReply } = require('../services/chatbotService');

router.post('/message', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;
        const result = await getChatbotReply({ message, user: req.user });
        res.json(result);
    } catch (err) {
        console.error('[CHATBOT ROUTE ERROR]', err);
        res.status(500).json({ reply: 'Sorry, the chatbot is temporarily unavailable.' });
    }
});

module.exports = router;
