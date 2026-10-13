const { fn, col } = require('sequelize');

const pad = (n) => String(n).padStart(2, '0');

function formatLocalDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLocalMonth(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function parseLocalDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    if (typeof value === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    return new Date(value);
}

function utcOffsetString(date = new Date()) {
    const total = -date.getTimezoneOffset();
    const sign = total >= 0 ? '+' : '-';
    const abs = Math.abs(total);
    return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function localDateTimeExpr(column) {
    return fn('CONVERT_TZ', col(column), '+00:00', utcOffsetString());
}

function localDayKeyExpr(column) {
    return fn('DATE_FORMAT', localDateTimeExpr(column), '%Y-%m-%d');
}

function localMonthKeyExpr(column) {
    return fn('DATE_FORMAT', localDateTimeExpr(column), '%Y-%m');
}

function monthWindow(count, endDate = new Date()) {
    const start = new Date(endDate.getFullYear(), endDate.getMonth() - (count - 1), 1);
    const keys = [];
    for (let i = 0; i < count; i++) {
        keys.push(formatLocalMonth(new Date(start.getFullYear(), start.getMonth() + i, 1)));
    }
    return { start, keys };
}

module.exports = {
    formatLocalDate,
    formatLocalMonth,
    parseLocalDate,
    utcOffsetString,
    localDayKeyExpr,
    localMonthKeyExpr,
    monthWindow
};
