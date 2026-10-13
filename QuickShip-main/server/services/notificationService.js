

const { sendMail } = require('./emailService');

const money = (n) => `Rs. ${Number(n || 0).toFixed(0)}`;

function emailShell(title, bodyHtml) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">QuickShip</h2>
            <h3>${title}</h3>
            ${bodyHtml}
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This is an automated message from QuickShip Courier Management System.</p>
        </div>
    `;
}

async function sendBookingConfirmation({ user, parcel, breakdown, prediction }) {
    const html = emailShell('Booking Confirmed', `
        <p>Hi ${user.full_name},</p>
        <p>Your parcel has been booked successfully. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <tr><td style="padding: 4px 0;">Tracking ID</td><td style="text-align: right; font-weight: bold;">${parcel.tracking_hash}</td></tr>
            <tr><td style="padding: 4px 0;">Receiver</td><td style="text-align: right;">${parcel.receiver_name}</td></tr>
            <tr><td style="padding: 4px 0;">Weight</td><td style="text-align: right;">${parcel.weight} kg</td></tr>
            <tr><td style="padding: 4px 0;">Delivery Method</td><td style="text-align: right;">${parcel.delivery_type}</td></tr>
            ${prediction ? `<tr><td style="padding: 4px 0;">Estimated Delivery Time</td><td style="text-align: right; font-weight: bold; color: #1e3a8a;">~${prediction.hours} hours</td></tr>` : ''}
        </table>
        <p><strong>Invoice</strong></p>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0;">Base Charge</td><td style="text-align: right;">${money(breakdown.baseCharge)}</td></tr>
            <tr><td style="padding: 4px 0;">Weight Charge</td><td style="text-align: right;">${money(breakdown.weightCharge)}</td></tr>
            <tr><td style="padding: 4px 0;">Distance Charge</td><td style="text-align: right;">${money(breakdown.distanceCharge)}</td></tr>
            ${breakdown.codCharge ? `<tr><td style="padding: 4px 0;">COD Surcharge</td><td style="text-align: right;">${money(breakdown.codCharge)}</td></tr>` : ''}
            <tr style="border-top: 1px solid #cbd5e1;"><td style="padding: 6px 0; font-weight: bold;">Total</td><td style="text-align: right; font-weight: bold;">${money(breakdown.total)}</td></tr>
        </table>
        <p>You can track your parcel anytime using the tracking ID above.</p>
    `);

    return sendMail({ to: user.email, subject: `QuickShip - Booking Confirmed (${parcel.tracking_hash})`, html });
}

async function sendStaffAssignmentEmail({ user, parcel, staffName }) {
    const html = emailShell('Staff Assigned to Your Parcel', `
        <p>Hi ${user.full_name},</p>
        <p>Your parcel <strong>${parcel.tracking_hash}</strong> has been assigned to our delivery staff, <strong>${staffName}</strong>, and is being prepared for pickup.</p>
    `);

    return sendMail({ to: user.email, subject: `QuickShip - Staff Assigned (${parcel.tracking_hash})`, html });
}

async function sendDeliveredEmail({ user, parcel }) {
    const html = emailShell('Parcel Delivered', `
        <p>Hi ${user.full_name},</p>
        <p>Your parcel <strong>${parcel.tracking_hash}</strong> has been delivered successfully. Thank you for using QuickShip!</p>
        <p>We'd love to hear your feedback — you can rate this delivery from your booking history.</p>
    `);

    return sendMail({ to: user.email, subject: `QuickShip - Parcel Delivered (${parcel.tracking_hash})`, html });
}

module.exports = {
    sendBookingConfirmation,
    sendStaffAssignmentEmail,
    sendDeliveredEmail
};
