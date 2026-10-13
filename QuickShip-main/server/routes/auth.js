const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User; 

router.post('/signup', async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) return res.status(400).json({ message: 'Phone number already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            full_name,
            email,
            password: hashedPassword,
            phone,
            role: 'client'
        });

        res.status(201).json({ message: 'User created successfully', userId: newUser.user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(400).json({ message: 'User not found' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role, name: user.full_name, id: user.user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify-account', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address.' });
        }

        res.json({ message: 'Account found. You can now choose a new password.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address.' });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
