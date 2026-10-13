
const db = require('../models');

async function logActivity({ user, action, parcelId = null, details = null }) {
    try {
        let userName = user?.full_name || null;
        if (!userName && user?.id) {
            const u = await db.User.findByPk(user.id, { attributes: ['full_name'] });
            userName = u ? u.full_name : null;
        }

        await db.ActivityLog.create({
            user_id: user?.id || null,
            user_name: userName,
            role: user?.role || null,
            action,
            parcel_id: parcelId,
            details
        });
    } catch (err) {
        console.error('[ACTIVITY LOG ERROR]', err);
    }
}

module.exports = { logActivity };
