const { Op } = require('sequelize');

const buildTrackingQuery = (input, user) => {
    const sanitized = input.trim();

    const where = {
        tracking_hash: { [Op.like]: `%${sanitized}%` }
    };

    const isPrivileged = ['admin', 'staff'].includes(user.role);

    if (!isPrivileged) {
        where.client_id = user.id;
    }

    return where;
};

const normalizeTrackingInput = (raw = '') => {
    return raw
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '');
};

module.exports = { buildTrackingQuery, normalizeTrackingInput };