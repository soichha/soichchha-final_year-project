const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models');
const { verifyToken } = require('./middleware/authMiddleware');
const Parcel = db.Parcel;
const Payment = db.Payment;

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const ESEWA_SECRET = process.env.ESEWA_SECRET;
const ESEWA_FORM_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

function buildSignature(fields, signedFieldNames, secret) {
    const message = signedFieldNames
        .split(',')
        .map((field) => `${field}=${fields[field]}`)
        .join(',');
    return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

router.post('/initiate-esewa', verifyToken, async (req, res) => {
    try {
        const { parcelId } = req.body;
        if (!parcelId) return res.status(400).json({ error: 'parcelId is required' });

        if (!ESEWA_SECRET) {
            return res.status(500).json({ error: 'eSewa is not configured (ESEWA_SECRET missing in server .env)' });
        }

        const parcel = await Parcel.findByPk(parcelId);
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        if (req.user.role === 'client' && parcel.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const payment = await Payment.findOne({ where: { parcel_id: parcelId } });
        if (!payment) return res.status(404).json({ error: 'Payment record not found for this parcel' });
        if (payment.payment_method !== 'eSewa') {
            return res.status(400).json({ error: 'This parcel is not set up for eSewa payment' });
        }
        if (payment.payment_status === 'Completed') {
            return res.status(400).json({ error: 'This parcel has already been paid for' });
        }

        const transaction_uuid = parcel.tracking_hash;
        const amount = payment.amount;

        const fields = {
            amount: String(amount),
            tax_amount: '0',
            total_amount: String(amount),
            transaction_uuid,
            product_code: ESEWA_PRODUCT_CODE,
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/success`,
            failure_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/failure`,
            signed_field_names: 'total_amount,transaction_uuid,product_code'
        };

        const signature = buildSignature(fields, fields.signed_field_names, ESEWA_SECRET);

        res.json({
            formUrl: ESEWA_FORM_URL,
            fields: { ...fields, signature }
        });
    } catch (err) {
        console.error('[ESEWA INITIATE ERROR]', err);
        res.status(500).json({ error: 'Failed to initiate eSewa payment' });
    }
});

router.post('/verify-esewa', async (req, res) => {
    try {
        const { decodedData } = req.body;

        if (!decodedData) {
            return res.status(400).json({ error: 'Missing decoded payload' });
        }
        if (!ESEWA_SECRET) {
            return res.status(500).json({ error: 'eSewa is not configured (ESEWA_SECRET missing in server .env)' });
        }

        const {
            status, transaction_uuid, total_amount, transaction_code,
            product_code, signed_field_names, signature
        } = decodedData;

        if (!transaction_uuid) {
            return res.status(400).json({ error: 'Missing transaction_uuid in payload' });
        }
        if (!signed_field_names || !signature) {
            return res.status(400).json({ error: 'Payload is missing signature fields - cannot verify authenticity' });
        }

        const expectedSignature = buildSignature(decodedData, signed_field_names, ESEWA_SECRET);
        if (expectedSignature !== signature) {
            return res.status(400).json({ error: 'Signature verification failed - payload may have been tampered with' });
        }

        if (status !== 'COMPLETE' && status !== 'SUCCESS') {
            return res.status(400).json({ error: `eSewa Status rejected: ${status || 'unknown'}` });
        }

        const parcel = await Parcel.findOne({ where: { tracking_hash: transaction_uuid } });
        if (!parcel) {
            return res.status(404).json({ error: `Parcel not found for ID: ${transaction_uuid}` });
        }

        const paymentRecord = await Payment.findOne({ where: { parcel_id: parcel.parcel_id } });
        if (!paymentRecord) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        const parsedTotalAmount = parseFloat(String(total_amount).replace(/,/g, ''));
        if (product_code !== 'EPAYTEST' && Math.abs(paymentRecord.amount - parsedTotalAmount) > 1) {
            return res.status(400).json({ error: `Amount mismatch: Expected ${paymentRecord.amount}, received ${parsedTotalAmount}` });
        }

        await paymentRecord.update({
            payment_status: 'Completed',
            transaction_reference: transaction_code
        });

        res.json({ message: 'Payment verified successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
});

router.post('/mark-failed', async (req, res) => {
    try {
        const { transactionUuid } = req.body;
        if (!transactionUuid) return res.status(400).json({ error: 'transactionUuid is required' });

        const parcel = await Parcel.findOne({ where: { tracking_hash: transactionUuid } });
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        const payment = await Payment.findOne({ where: { parcel_id: parcel.parcel_id } });
        if (!payment) return res.status(404).json({ error: 'Payment record not found' });

        if (payment.payment_status === 'Pending') {
            await payment.update({ payment_status: 'Failed' });
        }

        res.json({ message: 'Payment marked as failed' });
    } catch (err) {
        console.error('[ESEWA MARK FAILED ERROR]', err);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

module.exports = router;
