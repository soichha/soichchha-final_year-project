const express = require('express');
const router = express.Router();
const db = require('../models') ;
const { buildTrackingQuery, normalizeTrackingInput } = require('../utils/trackingSearch');
const { verifyToken, authorize } = require('./middleware/authMiddleware');
const staffAssignmentService = require('../services/staffAssignmentService');
const notificationService = require('../services/notificationService');
const deliveryPredictionService = require('../services/deliveryPredictionService');
const { logActivity } = require('../services/activityLogService');
const { isTransitionAllowed } = require('../utils/statusTransitions');
const Parcel = db.Parcel; 
const Location = db.Location;
const User = db.User;
const TrackingHistory = db.TrackingHistory;
const Delivery = db.Delivery;
const DeliveryAttempt = db.DeliveryAttempt;

async function generateTrackingHash() {
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = 'TRK-' + Math.floor(100000 + Math.random() * 900000);
        const exists = await Parcel.findOne({ where: { tracking_hash: candidate }, attributes: ['parcel_id'] });
        if (!exists) return candidate;
    }
    return 'TRK-' + Date.now().toString().slice(-9);
}

async function getOrCreateLocation(locData) {
    if (!locData || !locData.city || !locData.district) return null;

    let location = null;
    if (locData.lat && locData.lng) {
        location = await Location.findOne({
            where: {
                latitude: locData.lat,
                longitude: locData.lng,
                full_address: locData.name || null
            }
        });
    }

    if (!location) {
        location = await Location.findOne({
            where: {
                district: locData.district,
                city_or_area: locData.city,
                full_address: locData.name || null
            }
        });
    }

    if (!location) {
        location = await Location.create({
            province: locData.province || 'Nepal',
            district: locData.district,
            city_or_area: locData.city,
            latitude: locData.lat || null,
            longitude: locData.lng || null,
            full_address: locData.name || null
        });
    }
    return location;
}

router.get('/locations', async (req, res) => {
    try {
        const locations = await Location.findAll({
            attributes: ['location_id', 'city_or_area', 'district', 'province', 'latitude', 'longitude']
        });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            receiverName, receiverPhone, description, weight: rawWeight,
            deliveryMethod, source, destination, senderId, paymentMethod, priority
        } = req.body;

        const weight = rawWeight === undefined || rawWeight === null || rawWeight === '' ? 1 : Number(rawWeight);
        if (!Number.isFinite(weight) || weight <= 0) {
            return res.status(400).json({ error: 'Weight must be a number greater than 0' });
        }
        if (!receiverName || !String(receiverName).trim() || !receiverPhone || !String(receiverPhone).trim()) {
            return res.status(400).json({ error: 'Receiver name and phone are required' });
        }
        if (String(receiverName).length > 255 || String(receiverPhone).length > 255) {
            return res.status(400).json({ error: 'Receiver name and phone must be 255 characters or fewer' });
        }
        const cleanDescription = typeof description === 'string' ? description.trim() : '';
        if (cleanDescription.length > 255) {
            return res.status(400).json({ error: 'Description must be 255 characters or fewer' });
        }
        if (deliveryMethod && !['Air', 'Vehicle'].includes(deliveryMethod)) {
            return res.status(400).json({ error: 'Invalid delivery method' });
        }
        if (priority && !['Standard', 'Express'].includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority' });
        }
        if (paymentMethod && !['COD', 'eSewa'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        if (req.user.role === 'client' && parseInt(senderId) !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized: Cannot book for another user' });
        }

        const sourceLoc = await getOrCreateLocation(source);
        const destLoc = await getOrCreateLocation(destination);

        if (!sourceLoc || !destLoc) {
            return res.status(400).json({ error: 'Invalid source or destination location' });
        }

        const { calculateCost, haversine, getCostBreakdown } = require('../utils/costCalculator');
        let distance = 0;

        if (sourceLoc.latitude && sourceLoc.longitude && destLoc.latitude && destLoc.longitude) {
            distance = haversine(sourceLoc.latitude, sourceLoc.longitude, destLoc.latitude, destLoc.longitude);
        } else {
            distance = 10;
        }

        const cost = calculateCost(weight, distance, deliveryMethod);
        const codCharge = paymentMethod === 'COD' ? 20 : 0;
        const totalAmount = cost + codCharge;

        const trackingHash = await generateTrackingHash();

        const prediction = deliveryPredictionService.predictDeliveryTime({
            distance,
            weight: weight || 1,
            deliveryType: deliveryMethod || 'Vehicle',
            priority: priority || 'Standard'
        });

        const newParcel = await Parcel.create({
            client_id: senderId,
            source_location_id: sourceLoc.location_id,
            destination_location_id: destLoc.location_id,
            weight,
            delivery_type: deliveryMethod || 'Vehicle',
            priority: priority || 'Standard',
            total_cost: totalAmount,
            parcel_status: 'Booked',
            booking_date: new Date(),
            receiver_name: receiverName,
            receiver_phone: receiverPhone,
            description: cleanDescription || null,
            tracking_hash: trackingHash,
            predicted_delivery_hours: prediction.hours,
            prediction_source: prediction.source
        });

        await TrackingHistory.create({
            parcel_id: newParcel.parcel_id,
            current_location_id: sourceLoc.location_id,
            status_message: 'Parcel Booked'
        });

        const dbPayment = require('../models').Payment;
        await dbPayment.create({
            parcel_id: newParcel.parcel_id,
            amount: totalAmount,
            payment_method: paymentMethod || 'COD',
            payment_status: 'Pending',
            transaction_reference: null
        });

        let assignment = null;
        try {
            assignment = await staffAssignmentService.autoAssignParcel(newParcel.parcel_id);
            if (assignment) {
                newParcel.parcel_status = 'Assigned';
            }
        } catch (assignErr) {
            console.error('[STAFF ASSIGNMENT ERROR]', assignErr);
        }

        const estimatedArrivalDate = new Date(newParcel.booking_date);

            estimatedArrivalDate.setTime(
            estimatedArrivalDate.getTime() + prediction.hours * 60 * 60 * 1000
);

        const estimatedArrival = estimatedArrivalDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
});

console.log('\n========== QUICKSHIP DELIVERY PREDICTION ==========');
console.log('Parcel ID          :', newParcel.parcel_id);
console.log('Tracking ID        :', trackingHash);
console.log('Booking Time       :', newParcel.booking_date.toLocaleString());
console.log('Delivery Type      :', newParcel.delivery_type);
console.log('Priority           :', newParcel.priority);
console.log('Distance           :', `${distance.toFixed(2)} km`);
console.log('Weight             :', `${newParcel.weight} kg`);
console.log('Prediction Source  :', prediction.source.toUpperCase());
console.log('Predicted Time     :', `${prediction.hours} hours`);
console.log('Estimated Arrival  :', estimatedArrival);
console.log('Total Cost         :', `Rs. ${totalAmount}`);
console.log('====================================================\n');

        try {
            const client = await db.User.findByPk(senderId);
            if (client) {
                const breakdown = getCostBreakdown(weight || 1, distance, deliveryMethod || 'Vehicle', codCharge);
                await notificationService.sendBookingConfirmation({ user: client, parcel: newParcel, breakdown, prediction });
                if (assignment) {
                    await notificationService.sendStaffAssignmentEmail({ user: client, parcel: newParcel, staffName: assignment.staff_name });
                }
            }
        } catch (emailErr) {
            console.error('[EMAIL NOTIFICATION ERROR]', emailErr);
        }

        res.status(201).json({
            message: 'Parcel booked successfully',
            parcel: { 
                ...newParcel.toJSON(), 
                trackingId: trackingHash, 
                totalAmount, 
                distance_km: distance.toFixed(2),
                estimated_arrival: estimatedArrival
            },
            prediction,
            assignment
        });

    } catch (err) {
        console.error("Booking Error:", err);
        res.status(500).json({ error: 'Failed to book parcel' });
    }
});

router.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        const reqUserId = parseInt(req.params.userId);

        if (req.user.role === 'client' && req.user.id !== reqUserId) {
            return res.status(403).json({ error: 'Access denied: You can only view your own parcels' });
        }

        const parcels = await Parcel.findAll({
            where: { client_id: req.params.userId },
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.User, as: 'client', attributes: ['user_id', 'full_name'] },
                { model: Location, as: 'sourceLocation' },
                { model: Location, as: 'destinationLocation' },
                { model: db.Payment, as: 'payment' },
                { model: TrackingHistory, as: 'trackingHistory' },
                {
                    model: db.Delivery,
                    as: 'delivery',
                    include: [{ model: db.User, as: 'staff', attributes: ['user_id', 'full_name', 'phone'] }]
                }
            ]
        });
        res.json(parcels);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

router.get('/', verifyToken, authorize(['admin', 'staff']), async (req, res) => {
    try {
        const parcels = await Parcel.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.Payment, as: 'payment' },
                { model: User, as: 'client', attributes: ['full_name'] },
                { model: Location, as: 'sourceLocation' },
                { model: Location, as: 'destinationLocation' },
                { model: TrackingHistory, as: 'trackingHistory' },
                {
                    model: db.Delivery,
                    as: 'delivery',
                    include: [{ model: db.User, as: 'staff', attributes: ['full_name'] }]
                }
            ]
        });
        res.json(parcels);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

router.get('/track/:trackingHash', verifyToken, async (req, res) => {
    try {
        const input = normalizeTrackingInput(req.params.trackingHash);
        if (!input) return res.status(400).json({ message: 'Invalid tracking ID' });

        const whereClause = buildTrackingQuery(input, req.user);

        const parcels = await Parcel.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.User, as: 'client', attributes: ['user_id', 'full_name'] },
                { model: Location, as: 'sourceLocation' },
                { model: Location, as: 'destinationLocation' },
                { model: TrackingHistory, as: 'trackingHistory', include: [{ model: Location, as: 'currentLocation' }] }
            ]
        });

        if (!parcels || parcels.length === 0) {
            return res.status(404).json({ message: 'No parcels found matching that tracking ID' });
        }

        const parcelsWithETA = parcels.map(p => {
    const data = p.toJSON();

    let estimatedArrival = null;

    if (
        data.predicted_delivery_hours !== null &&
        data.predicted_delivery_hours !== undefined &&
        data.booking_date
    ) {
        const estimatedArrivalDate = new Date(data.booking_date);

        estimatedArrivalDate.setTime(
            estimatedArrivalDate.getTime() +
            Number(data.predicted_delivery_hours) * 60 * 60 * 1000
        );

        estimatedArrival = estimatedArrivalDate.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    return {
        ...data,
        estimated_arrival: estimatedArrival
    };
});

    res.json(parcelsWithETA);
    } catch (err) {
        console.error('[TRACK ERROR]', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            receiver_name, receiverName,
            receiver_phone, receiverPhone,
            weight, parcel_status, staff_id, description, source, destination
        } = req.body;
        const parcelId = parseInt(req.params.id);

        const parcel = await Parcel.findByPk(parcelId);
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        if (req.user.role === 'client') {
            if (parcel.client_id !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            if (!['Booked', 'Assigned', 'Pending'].includes(parcel.parcel_status)) {
                return res.status(400).json({ error: 'Cannot edit parcel in current status' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {};
        if (receiver_name || receiverName) updateData.receiver_name = receiver_name || receiverName;
        if (receiver_phone || receiverPhone) updateData.receiver_phone = receiver_phone || receiverPhone;
        if (weight) updateData.weight = weight;
        if (description) {
            if (String(description).length > 255) {
                return res.status(400).json({ error: 'Description must be 255 characters or fewer' });
            }
            updateData.description = description;
        }
        if (parcel_status && req.user.role === 'admin') updateData.parcel_status = parcel_status;

        if (source) {
            const sLoc = await getOrCreateLocation(source);
            if (sLoc) updateData.source_location_id = sLoc.location_id;
        }
        if (destination) {
            const dLoc = await getOrCreateLocation(destination);
            if (dLoc) updateData.destination_location_id = dLoc.location_id;
        }

        if (weight || source || destination) {
            const { calculateCost, haversine } = require('../utils/costCalculator');
            const sLoc = await Location.findByPk(updateData.source_location_id || parcel.source_location_id);
            const dLoc = await Location.findByPk(updateData.destination_location_id || parcel.destination_location_id);

            let dist = 10;
            if (sLoc && dLoc && sLoc.latitude && sLoc.longitude && dLoc.latitude && dLoc.longitude) {
                dist = haversine(sLoc.latitude, sLoc.longitude, dLoc.latitude, dLoc.longitude);
            }

            const newCost = calculateCost(weight || parcel.weight, dist, parcel.delivery_type);
            updateData.total_cost = newCost;

            await db.Payment.update({ amount: newCost }, { where: { parcel_id: parcelId } });
        }

        const previousStatus = parcel.parcel_status;
        await parcel.update(updateData);

        if (updateData.parcel_status === 'Delivered') {
            await db.Payment.update(
                { payment_status: 'Completed' },
                { where: { parcel_id: parcelId, payment_status: 'Pending' } }
            );
            if (previousStatus !== 'Delivered') {
                await Delivery.update(
                    { delivery_status: 'Delivered', delivered_at: new Date() },
                    { where: { parcel_id: parcelId } }
                );
            }
        } else if (updateData.parcel_status && updateData.parcel_status !== 'Delivered') {
            await db.Payment.update(
                { payment_status: 'Pending' },
                { where: { parcel_id: parcelId, payment_method: 'COD' } }
            );
            if (previousStatus === 'Delivered') {
                await Delivery.update(
                    { delivery_status: updateData.parcel_status, delivered_at: null },
                    { where: { parcel_id: parcelId } }
                );
            }
        }

        if (req.user.role === 'admin' && typeof staff_id !== 'undefined') {
            const sid = (staff_id === "" || staff_id === null) ? null : parseInt(staff_id);

            if (sid === null || isNaN(sid)) {
                await Delivery.destroy({ where: { parcel_id: parcelId } });
                if (parcel.parcel_status === 'Assigned') {
                    await parcel.update({ parcel_status: 'Booked' });
                }
            } else {
                let [delivery, created] = await Delivery.findOrCreate({
                    where: { parcel_id: parcelId },
                    defaults: { staff_id: sid, assigned_by: req.user.id }
                });

                let workloadAtAssignment = null;
                try {
                    workloadAtAssignment = await staffAssignmentService.countActiveWorkload(sid);
                } catch (workloadErr) {
                    console.error('[UPDATE] Workload lookup failed (non-fatal):', workloadErr);
                }
                const manualReason = `Manually assigned by ${req.user.role} (user #${req.user.id}) via parcel edit. ` +
                    `Staff had ${workloadAtAssignment ?? 'an unknown number of'} active parcel(s) at the time.`;

                if (!created) {
                    await delivery.update({
                        staff_id: sid,
                        assigned_by: req.user.id,
                        assignment_type: 'Manual',
                        assignment_reason: manualReason,
                        workload_at_assignment: workloadAtAssignment
                    });
                } else {
                    await delivery.update({
                        assignment_type: 'Manual',
                        assignment_reason: manualReason,
                        workload_at_assignment: workloadAtAssignment
                    });
                }

                if (parcel.parcel_status === 'Booked') {
                    await parcel.update({ parcel_status: 'Assigned' });
                }

                try {
                    const client = await User.findByPk(parcel.client_id);
                    const staff = await User.findByPk(sid);
                    if (client && staff) {
                        await notificationService.sendStaffAssignmentEmail({ user: client, parcel, staffName: staff.full_name });
                    }
                } catch (emailErr) {
                    console.error('[EMAIL NOTIFICATION ERROR]', emailErr);
                }
            }
        }

        res.json({ message: 'Parcel updated successfully', parcel });
    } catch (err) {
        console.error('[UPDATE ERROR]', err);
        res.status(500).json({ error: 'Failed to update parcel' });
    }
});

router.get('/:id/recommend-staff', verifyToken, authorize(['admin']), async (req, res) => {
    try {
        const recommendation = await staffAssignmentService.recommendStaff(parseInt(req.params.id));
        if (!recommendation) return res.status(404).json({ error: 'No staff available to recommend' });
        res.json(recommendation);
    } catch (err) {
        console.error('[RECOMMEND STAFF ERROR]', err);
        res.status(500).json({ error: 'Failed to generate recommendation' });
    }
});

router.put('/:id/assign', verifyToken, authorize(['admin', 'staff']), async (req, res) => {
    try {
        const staffIdRaw = req.body.staffId || req.body.staff_id;
        const parcelId = parseInt(req.params.id);
        const sid = (staffIdRaw === "" || staffIdRaw === null) ? null : parseInt(staffIdRaw);

        if (sid === null || isNaN(sid)) {
            await Delivery.destroy({ where: { parcel_id: parcelId } });
            const parcel = await Parcel.findByPk(parcelId);
            if (parcel && parcel.parcel_status === 'Assigned') {
                await parcel.update({ parcel_status: 'Booked' });
            }
            return res.json({ message: 'Staff unassigned successfully' });
        }

        if (req.user.role === 'staff') {
            const currentDelivery = await Delivery.findOne({ where: { parcel_id: parcelId } });
            if (!currentDelivery || currentDelivery.staff_id !== req.user.id) {
                return res.status(403).json({ error: 'Denied' });
            }
        }

        let [delivery, created] = await Delivery.findOrCreate({
            where: { parcel_id: parcelId },
            defaults: { staff_id: sid, assigned_by: req.user.id }
        });

        let workloadAtAssignment = null;
        try {
            workloadAtAssignment = await staffAssignmentService.countActiveWorkload(sid);
        } catch (workloadErr) {
            console.error('[ASSIGN] Workload lookup failed (non-fatal):', workloadErr);
        }
        const manualReason = `Manually assigned by ${req.user.role} (user #${req.user.id}). ` +
            `Staff had ${workloadAtAssignment ?? 'an unknown number of'} active parcel(s) at the time.`;

        if (!created) {
            await delivery.update({
                staff_id: sid,
                assigned_by: req.user.id,
                assignment_type: 'Manual',
                assignment_reason: manualReason,
                workload_at_assignment: workloadAtAssignment
            });
        } else {
            await delivery.update({
                assignment_type: 'Manual',
                assignment_reason: manualReason,
                workload_at_assignment: workloadAtAssignment
            });
        }

        const parcel = await Parcel.findByPk(parcelId);
        if (parcel && parcel.parcel_status === 'Booked') {
            await parcel.update({ parcel_status: 'Assigned' });
        }

        try {
            const client = await User.findByPk(parcel.client_id);
            const staff = await User.findByPk(sid);
            if (client && staff) {
                await notificationService.sendStaffAssignmentEmail({ user: client, parcel, staffName: staff.full_name });
            }
        } catch (emailErr) {
            console.error('[EMAIL NOTIFICATION ERROR]', emailErr);
        }

        try {
            const staff = await User.findByPk(sid);
            await logActivity({
                user: req.user,
                action: `assigned parcel ${parcel.tracking_hash} to ${staff ? staff.full_name : 'staff #' + sid}`,
                parcelId
            });
        } catch (logErr) {
            console.error('[ACTIVITY LOG ERROR]', logErr);
        }

        res.json({ message: 'Staff assigned successfully' });
    } catch (err) {
        console.error('[ASSIGN ERROR]', err);
        res.status(500).json({ error: 'Assignment failed' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const parcelId = req.params.id;
        const parcel = await Parcel.findByPk(parcelId);

        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        if (req.user.role === 'client') {
            if (parcel.client_id !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            if (!['Booked', 'Assigned', 'Pending'].includes(parcel.parcel_status)) {
                return res.status(400).json({ error: 'Cannot delete parcel once it is picked up' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        await parcel.destroy();
        res.json({ message: 'Parcel deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete parcel' });
    }
});

router.get('/staff/:userId', verifyToken, authorize(['staff', 'admin']), async (req, res) => {
    try {
        const staffId = parseInt(req.params.userId);

        if (req.user.role === 'staff' && parseInt(req.user.id) !== staffId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const deliveries = await Delivery.findAll({
            where: { staff_id: staffId },
            include: [{
                model: Parcel,
                as: 'parcel',
                include: [
                    { model: db.Payment, as: 'payment' },
                    { model: Location, as: 'sourceLocation' },
                    { model: Location, as: 'destinationLocation' },
                    { model: TrackingHistory, as: 'trackingHistory' },
                    { model: User, as: 'client', attributes: ['full_name', 'phone'] }
                ]
            }]
        });

        const parcels = deliveries.map(d => {
            if (!d.parcel) {
                return null;
            }
            return {
                ...d.parcel.toJSON(),
                delivery_status: d.delivery_status
            };
        }).filter(p => p !== null);

        res.json(parcels);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

router.put('/:id/status', verifyToken, authorize(['staff', 'admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const parcelId = parseInt(req.params.id);

        const parcel = await Parcel.findByPk(parcelId);
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        const delivery = await Delivery.findOne({ where: { parcel_id: parcelId } });

        if (req.user.role === 'staff' && (!delivery || delivery.staff_id !== req.user.id)) {
            return res.status(403).json({ error: 'You are not assigned to this parcel' });
        }

        if (status === 'Delivered') {
            return res.status(400).json({ error: 'Use the Delivery Confirmation step to mark a parcel as Delivered.' });
        }
        if (status === 'Delivery Attempt Failed' || status === 'Rescheduled') {
            return res.status(400).json({ error: 'Use "Record Delivery Attempt" to report a failed or rescheduled delivery.' });
        }

        if (!isTransitionAllowed(parcel.parcel_status, status)) {
            return res.status(400).json({ error: `Cannot change status from "${parcel.parcel_status}" to "${status}"` });
        }

        const [pUpdated] = await Parcel.update({ parcel_status: status }, { where: { parcel_id: parcelId } });
        const [dUpdated] = await Delivery.update({ delivery_status: status }, { where: { parcel_id: parcelId } });

        await db.Payment.update(
            { payment_status: 'Pending' },
            { where: { parcel_id: parcelId, payment_method: 'COD' } }
        );

        await TrackingHistory.create({
            parcel_id: parcelId,
            status_message: `Status updated to ${status}`
        });

        await logActivity({
            user: req.user,
            action: `changed parcel ${parcel.tracking_hash} to ${status}`,
            parcelId
        });

        res.json({ message: 'Status updated successfully', updated: { parcel: pUpdated > 0, delivery: dUpdated > 0 } });
    } catch (err) {
        console.error("Status Update Failed:", err);
        res.status(500).json({ error: 'Update failed', detailed: err.message });
    }
});

router.put('/:id/deliver', verifyToken, authorize(['staff', 'admin']), async (req, res) => {
    try {
        const parcelId = parseInt(req.params.id);
        const receiverName = (req.body.receiverName || req.body.receiver_name || '').trim();
        const remarks = (req.body.remarks || '').trim();

        if (!receiverName) {
            return res.status(400).json({ error: 'Receiver name is required to confirm delivery' });
        }

        const parcel = await Parcel.findByPk(parcelId);
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        const delivery = await Delivery.findOne({ where: { parcel_id: parcelId } });
        if (req.user.role === 'staff' && (!delivery || delivery.staff_id !== req.user.id)) {
            return res.status(403).json({ error: 'You are not assigned to this parcel' });
        }

        if (parcel.parcel_status !== 'Out for Delivery') {
            return res.status(400).json({ error: 'Only a parcel that is Out for Delivery can be marked as Delivered' });
        }

        const deliveredAt = new Date();

        await Parcel.update({ parcel_status: 'Delivered' }, { where: { parcel_id: parcelId } });
        await Delivery.update(
            {
                delivery_status: 'Delivered',
                delivered_at: deliveredAt,
                received_by: receiverName,
                delivery_remarks: remarks || null,
                delivered_by: req.user.id
            },
            { where: { parcel_id: parcelId } }
        );

        await db.Payment.update(
            { payment_status: 'Completed' },
            { where: { parcel_id: parcelId, payment_status: 'Pending' } }
        );

        await TrackingHistory.create({
            parcel_id: parcelId,
            status_message: `Delivered to ${receiverName}`
        });

        await logActivity({
            user: req.user,
            action: `marked parcel ${parcel.tracking_hash} as Delivered`,
            parcelId,
            details: remarks || null
        });

        try {
            const client = await db.User.findByPk(parcel.client_id);
            if (client) {
                await notificationService.sendDeliveredEmail({ user: client, parcel });
            }
        } catch (emailErr) {
            console.error('[EMAIL NOTIFICATION ERROR]', emailErr);
        }

        res.json({ message: 'Delivery confirmed successfully' });
    } catch (err) {
        console.error('[DELIVER ERROR]', err);
        res.status(500).json({ error: 'Delivery confirmation failed' });
    }
});

router.post('/:id/delivery-attempt', verifyToken, authorize(['staff', 'admin']), async (req, res) => {
    try {
        const parcelId = parseInt(req.params.id);
        const { reason, remarks, nextDeliveryDate } = req.body;

        const validReasons = ['Receiver unavailable', 'Wrong address', 'Phone unreachable', 'Customer requested reschedule', 'Other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ error: 'A valid reason is required' });
        }

        const parcel = await Parcel.findByPk(parcelId);
        if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

        const delivery = await Delivery.findOne({ where: { parcel_id: parcelId } });
        if (req.user.role === 'staff' && (!delivery || delivery.staff_id !== req.user.id)) {
            return res.status(403).json({ error: 'You are not assigned to this parcel' });
        }

        if (!['Out for Delivery', 'Delivery Attempt Failed'].includes(parcel.parcel_status)) {
            return res.status(400).json({ error: 'A delivery attempt can only be recorded while the parcel is Out for Delivery' });
        }

        let nextDate = null;
        if (nextDeliveryDate) {
            const parsed = new Date(nextDeliveryDate);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({ error: 'Invalid next delivery date' });
            }
            nextDate = nextDeliveryDate;
        }

        await DeliveryAttempt.create({
            parcel_id: parcelId,
            staff_id: delivery ? delivery.staff_id : req.user.id,
            reason,
            remarks: remarks || null,
            attempted_at: new Date(),
            next_delivery_date: nextDate
        });

        const newStatus = nextDate ? 'Rescheduled' : 'Delivery Attempt Failed';

        await Parcel.update({ parcel_status: newStatus }, { where: { parcel_id: parcelId } });
        await Delivery.update(
            { delivery_status: newStatus, next_delivery_date: nextDate },
            { where: { parcel_id: parcelId } }
        );

        await TrackingHistory.create({
            parcel_id: parcelId,
            status_message: `Delivery Attempt: ${reason}`
        });

        if (nextDate) {
            await TrackingHistory.create({
                parcel_id: parcelId,
                status_message: `Rescheduled - New delivery date: ${nextDate}`
            });
        }

        await logActivity({
            user: req.user,
            action: nextDate
                ? `recorded a delivery attempt on parcel ${parcel.tracking_hash} and rescheduled it`
                : `recorded a delivery attempt on parcel ${parcel.tracking_hash}`,
            parcelId,
            details: `${reason}${remarks ? ' - ' + remarks : ''}`
        });

        res.json({ message: 'Delivery attempt recorded', parcel_status: newStatus });
    } catch (err) {
        console.error('[DELIVERY ATTEMPT ERROR]', err);
        res.status(500).json({ error: 'Failed to record delivery attempt' });
    }
});

module.exports = router;
