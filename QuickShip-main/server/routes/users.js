const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models');
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const User = db.User;
const Parcel = db.Parcel;

router.get('/staff', verifyToken, authorize(['admin', 'staff']), async (req, res) => {
    try {
        const staff = await User.findAll({ where: { role: 'staff' }, attributes: { exclude: ['password'] } });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

router.get('/clients', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const clients = await User.findAll({ where: { role: 'client' }, attributes: { exclude: ['password'] } });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

router.post('/staff', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await User.create({
            full_name,
            email,
            password: hashedPassword,
            phone: phone || '0000000000',
            role: 'staff'
        });
        const { password: _pw, ...staffWithoutPassword } = newStaff.toJSON();
        res.status(201).json(staffWithoutPassword);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create staff' });
    }
});

router.put('/staff/:id', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const { full_name, email, phone } = req.body;
        await User.update({ full_name, email, phone }, { where: { user_id: req.params.id, role: 'staff' } });
        res.json({ message: 'Staff updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update staff' });
    }
});

router.delete('/staff/:id', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        await User.destroy({ where: { user_id: req.params.id, role: 'staff' } });
        res.json({ message: 'Staff deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
});

router.delete('/clients/:id', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        await User.destroy({ where: { user_id: req.params.id, role: 'client' } });
        res.json({ message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;
        const updateData = { full_name, email, phone };

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (email) {
            const existing = await User.findOne({ where: { email, user_id: { [db.Sequelize.Op.ne]: req.user.id } } });
            if (existing) return res.status(400).json({ error: 'Email already in use' });
        }

        await User.update(updateData, { where: { user_id: req.user.id } });
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
