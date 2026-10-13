const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: process.env.EMAIL_USER ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    } : undefined
});

async function sendMail({ to, subject, html }) {
    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL SKIPPED - no EMAIL_USER configured] To: ${to} | Subject: ${subject}`);
        return { skipped: true };
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || 'QuickShip <no-reply@quickship.com>',
        to,
        subject,
        html
    });
}

module.exports = { sendMail };
