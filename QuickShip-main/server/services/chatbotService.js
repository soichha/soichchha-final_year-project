
const db = require('../models');
const { Op } = require('sequelize');
const { calculateCost, haversine } = require('../utils/costCalculator');
const { estimateDeliveryTime } = require('../utils/etaCalculator');
const { buildTrackingQuery, normalizeTrackingInput } = require('../utils/trackingSearch');
const { ACTIVE_STATUSES } = require('../utils/constants');

const { Parcel, User, Payment, Delivery, TrackingHistory, Location } = db;

const money = (n) => `Rs. ${Number(n || 0).toFixed(0)}`;

const parcelToItem = (p) => {
    const data = p.toJSON ? p.toJSON() : p;
    const src = data.sourceLocation ? `${data.sourceLocation.city_or_area}` : 'N/A';
    const dst = data.destinationLocation ? `${data.destinationLocation.city_or_area}` : 'N/A';
    return {
        title: data.tracking_hash,
        subtitle: `${src} → ${dst}`,
        status: data.parcel_status,
        extra: money(data.total_cost)
    };
};

const getUserName = async (userId) => {
    const u = await User.findByPk(userId, { attributes: ['full_name'] });
    return u ? u.full_name.split(' ')[0] : null;
};

const DELIVERY_METHODS_TEXT =
    "QuickShip offers two delivery methods:\n\n" +
    "• Vehicle — road delivery, most economical, typical for shorter distances.\n" +
    "• Air — faster delivery for long distances, at a higher rate.\n\n" +
    "You choose the method when booking a parcel, and the cost & ETA are calculated automatically based on distance and weight.";

const PARCEL_STATUS_TEXT =
    "Here's what each parcel status means:\n\n" +
    "• Booked — your parcel has been registered and is waiting for staff assignment.\n" +
    "• Assigned — a staff member has been assigned to handle it.\n" +
    "• Picked Up — the parcel has been collected from the source location.\n" +
    "• In Transit — it's on its way to the destination.\n" +
    "• Out for Delivery — it's with the delivery staff for final drop-off.\n" +
    "• Delivered — successfully delivered to the receiver.\n" +
    "• Cancelled — the booking was cancelled.";

const HOW_TO_BOOK_TEXT =
    "To book a parcel:\n\n" +
    "1. Go to 'Book Parcel' from your dashboard.\n" +
    "2. Enter the receiver's name and phone number.\n" +
    "3. Select the source and destination locations.\n" +
    "4. Enter the parcel weight and choose a delivery method (Vehicle or Air).\n" +
    "5. Choose a payment method and confirm.\n\n" +
    "Your cost and estimated delivery date are calculated automatically.";

const FAQ_TEXT =
    "Frequently asked questions:\n\n" +
    "• How is the delivery charge calculated? — Ask me 'delivery charges'.\n" +
    "• How do I track my parcel? — Ask me 'track my parcel'.\n" +
    "• Can I cancel a booking? — Yes, as long as it hasn't been picked up yet, from 'My Bookings'.\n" +
    "• How do I change my profile details? — Use the Profile page from the menu.";

const PAYMENT_METHODS_TEXT =
    "QuickShip supports two payment methods:\n\n" +
    "• eSewa — pay online at checkout; the booking is confirmed once the payment succeeds.\n" +
    "• Cash on Delivery (COD) — pay the receiver's staff member in cash when the parcel arrives. A small COD handling charge is added.\n\n" +
    "You choose the method when booking, and payment status (Pending / Completed / Failed) is shown on the parcel and in 'My Bookings'.";

async function customerTrack(user, msg) {
    const codeMatch = msg.match(/[A-Z0-9]{0,4}-?\d{4,}/i);

    if (codeMatch) {
        const input = normalizeTrackingInput(codeMatch[0]);
        const where = buildTrackingQuery(input, user);
        const parcels = await Parcel.findAll({
            where,
            include: [
                { model: Location, as: 'sourceLocation' },
                { model: Location, as: 'destinationLocation' }
            ],
            limit: 5
        });

        if (!parcels.length) {
            return { reply: `I couldn't find a parcel matching "${codeMatch[0]}" in your account. Double-check the tracking ID and try again.` };
        }

        const items = [];
        for (const p of parcels) {
            const d = p.toJSON();
            let distance = 0;
            if (d.sourceLocation?.latitude && d.destinationLocation?.latitude) {
                distance = haversine(
                    d.sourceLocation.latitude, d.sourceLocation.longitude,
                    d.destinationLocation.latitude, d.destinationLocation.longitude
                );
            }
            const eta = estimateDeliveryTime(distance, d.delivery_type, d.booking_date);
            items.push({
                title: d.tracking_hash,
                subtitle: `${d.sourceLocation?.city_or_area || 'N/A'} → ${d.destinationLocation?.city_or_area || 'N/A'}`,
                status: d.parcel_status,
                extra: d.parcel_status === 'Delivered' ? 'Delivered' : `ETA: ${eta.humanReadable}`
            });
        }

        return {
            reply: `Here's what I found for "${codeMatch[0]}":`,
            items
        };
    }

    const active = await Parcel.findAll({
        where: { client_id: user.id, parcel_status: { [Op.in]: ACTIVE_STATUSES } },
        include: [{ model: Location, as: 'sourceLocation' }, { model: Location, as: 'destinationLocation' }],
        order: [['booking_date', 'DESC']],
        limit: 5
    });

    if (!active.length) {
        return { reply: "You don't have any active parcels right now. Share a tracking ID (e.g. TRK-123456) and I'll look it up directly." };
    }

    return {
        reply: "You didn't include a tracking ID, so here are your currently active parcels. Tell me the tracking ID for full details:",
        items: active.map(parcelToItem)
    };
}

async function customerBookings(user) {
    const parcels = await Parcel.findAll({
        where: { client_id: user.id, parcel_status: { [Op.in]: ACTIVE_STATUSES } },
        include: [{ model: Location, as: 'sourceLocation' }, { model: Location, as: 'destinationLocation' }],
        order: [['booking_date', 'DESC']],
        limit: 10
    });

    if (!parcels.length) return { reply: "You have no active bookings right now." };
    return { reply: `You have ${parcels.length} active booking(s):`, items: parcels.map(parcelToItem) };
}

async function customerBookingHistory(user) {
    const parcels = await Parcel.findAll({
        where: { client_id: user.id },
        include: [{ model: Location, as: 'sourceLocation' }, { model: Location, as: 'destinationLocation' }],
        order: [['booking_date', 'DESC']],
        limit: 10
    });

    if (!parcels.length) return { reply: "You haven't booked any parcels yet." };
    return { reply: `Your ${parcels.length} most recent booking(s):`, items: parcels.map(parcelToItem) };
}

async function customerDeliveryHistory(user) {
    const parcels = await Parcel.findAll({
        where: { client_id: user.id, parcel_status: 'Delivered' },
        include: [{ model: Location, as: 'sourceLocation' }, { model: Location, as: 'destinationLocation' }],
        order: [['booking_date', 'DESC']],
        limit: 10
    });

    if (!parcels.length) return { reply: "You don't have any delivered parcels yet." };
    return { reply: `You have ${parcels.length} delivered parcel(s):`, items: parcels.map(parcelToItem) };
}

async function customerPaymentHistory(user) {
    const payments = await Payment.findAll({
        include: [{
            model: Parcel,
            as: 'parcel',
            where: { client_id: user.id },
            attributes: ['tracking_hash']
        }],
        order: [['payment_date', 'DESC']],
        limit: 10
    });

    if (!payments.length) return { reply: "No payment records found on your account yet." };

    const items = payments.map(p => ({
        title: p.parcel?.tracking_hash || `Payment #${p.payment_id}`,
        subtitle: p.payment_method,
        status: p.payment_status,
        extra: money(p.amount)
    }));

    return { reply: `Your ${payments.length} most recent payment(s):`, items };
}

async function customerDeliveryCharges() {
    const vehicleBase = calculateCost(0, 0, 'Vehicle');
    const vehicleWeightRate = calculateCost(1, 0, 'Vehicle') - vehicleBase;
    const vehicleDistanceRate = calculateCost(0, 1, 'Vehicle') - vehicleBase;

    const airBase = calculateCost(0, 0, 'Air');
    const airWeightRate = calculateCost(1, 0, 'Air') - airBase;
    const airDistanceRate = calculateCost(0, 1, 'Air') - airBase;

    return {
        reply:
            "Delivery charges are calculated automatically as: base rate + (weight × weight rate) + (distance × distance rate).\n\n" +
            `• Vehicle — base ${money(vehicleBase)}, +${money(vehicleWeightRate)}/kg, +${money(vehicleDistanceRate)}/km\n` +
            `• Air — base ${money(airBase)}, +${money(airWeightRate)}/kg, +${money(airDistanceRate)}/km\n\n` +
            "Cash on Delivery adds a small additional handling charge. The final cost is always shown before you confirm a booking."
    };
}

const CUSTOMER_INTENTS = [
    { test: (m) => /\btrack\b/.test(m), handler: customerTrack },
    { test: (m) => /\bdelivery\s*history\b/.test(m), handler: customerDeliveryHistory },
    { test: (m) => /\bbooking\s*history\b/.test(m), handler: customerBookingHistory },
    { test: (m) => /\bpayment\s*history\b|\bmy\s*payments?\b/.test(m), handler: customerPaymentHistory },
    { test: (m) => /\b(my\s*)?bookings?\b/.test(m), handler: customerBookings },
    { test: (m) => /\bdelivery\s*(methods?|options?)\b/.test(m), handler: async () => ({ reply: DELIVERY_METHODS_TEXT }) },
    { test: (m) => /\besewa\b|\bcash on delivery\b|\bcod\b|\bpayment\s*methods?\b|\bhow.*pay\b|\bways?\s*to\s*pay\b/.test(m), handler: async () => ({ reply: PAYMENT_METHODS_TEXT }) },
    { test: (m) => /\b(delivery\s*)?charges?\b|\bcost\b|\bprice\b|\bhow much\b/.test(m), handler: customerDeliveryCharges },
    { test: (m) => /\bstatus\b.*\bmean|\bexplain.*status\b|\bwhat.*status\b/.test(m), handler: async () => ({ reply: PARCEL_STATUS_TEXT }) },
    { test: (m) => /\bhow.*book\b|\bbook.*parcel\b/.test(m), handler: async () => ({ reply: HOW_TO_BOOK_TEXT }) },
    { test: (m) => /\bfaq\b|\bfrequently asked\b|\bhelp\b/.test(m), handler: async () => ({ reply: FAQ_TEXT }) },
];

async function staffDeliveries(user, statusFilter) {
    const where = { staff_id: user.id };
    const deliveries = await Delivery.findAll({
        where,
        include: [{
            model: Parcel,
            as: 'parcel',
            include: [{ model: Location, as: 'sourceLocation' }, { model: Location, as: 'destinationLocation' }]
        }],
        order: [['assigned_date', 'DESC']],
        limit: 15
    });

    let list = deliveries.filter(d => d.parcel);
    if (statusFilter === 'pending') {
        list = list.filter(d => ACTIVE_STATUSES.includes(d.parcel.parcel_status));
    } else if (statusFilter === 'delivered') {
        list = list.filter(d => d.parcel.parcel_status === 'Delivered');
    } else if (statusFilter === 'today') {
        const today = new Date();
        list = list.filter(d => {
            const ad = new Date(d.assigned_date);
            return ad.toDateString() === today.toDateString();
        });
    }

    if (!list.length) return { reply: "No parcels match that right now." };

    return {
        reply: `Found ${list.length} matching parcel(s):`,
        items: list.map(d => parcelToItem(d.parcel))
    };
}

const STAFF_INTENTS = [
    { test: (m) => /\btoday'?s?\s*deliver/.test(m), handler: (u) => staffDeliveries(u, 'today') },
    { test: (m) => /\bpending\b/.test(m), handler: (u) => staffDeliveries(u, 'pending') },
    { test: (m) => /\bdelivered\b/.test(m), handler: (u) => staffDeliveries(u, 'delivered') },
    { test: (m) => /\bdelivery\s*history\b|\bhistory\b/.test(m), handler: (u) => staffDeliveries(u, 'all') },
    { test: (m) => /\bassigned\b|\bmy\s*parcels?\b/.test(m), handler: (u) => staffDeliveries(u, 'all') },
];

async function adminTotalCustomers() {
    const count = await User.count({ where: { role: 'client' } });
    return { reply: `There are currently ${count} registered customer(s).` };
}

async function adminTotalStaff() {
    const count = await User.count({ where: { role: 'staff' } });
    return { reply: `There are currently ${count} staff member(s).` };
}

async function adminTotalParcels() {
    const count = await Parcel.count();
    return { reply: `A total of ${count} parcel(s) have been booked on the platform.` };
}

async function adminRevenue() {
    const total = await Payment.sum('amount', { where: { payment_status: 'Completed' } });
    return { reply: `Total confirmed revenue so far is ${money(total || 0)}.` };
}

async function adminPendingDeliveries() {
    const count = await Parcel.count({ where: { parcel_status: { [Op.in]: ACTIVE_STATUSES } } });
    return { reply: `There are ${count} parcel(s) still pending delivery.` };
}

async function adminDeliveredParcels() {
    const count = await Parcel.count({ where: { parcel_status: 'Delivered' } });
    return { reply: `${count} parcel(s) have been successfully delivered.` };
}

async function adminCustomerInfo(user, msg) {
    const name = msg.replace(/customer(s)?|information|info|about|for/gi, '').trim();
    if (!name) {
        const count = await User.count({ where: { role: 'client' } });
        return { reply: `There are ${count} customers registered. Add a name after your question (e.g. "customer info Ram") to look up a specific one.` };
    }
    const matches = await User.findAll({
        where: { role: 'client', full_name: { [Op.like]: `%${name}%` } },
        attributes: ['full_name', 'email', 'phone'],
        limit: 5
    });
    if (!matches.length) return { reply: `No customer found matching "${name}".` };
    return {
        reply: `Found ${matches.length} customer(s) matching "${name}":`,
        items: matches.map(m => ({ title: m.full_name, subtitle: m.email, extra: m.phone || 'N/A' }))
    };
}

async function adminStaffInfo(user, msg) {
    const name = msg.replace(/staff|information|info|about|for/gi, '').trim();
    if (!name) {
        const count = await User.count({ where: { role: 'staff' } });
        return { reply: `There are ${count} staff members registered. Add a name after your question (e.g. "staff info Sita") to look up a specific one.` };
    }
    const matches = await User.findAll({
        where: { role: 'staff', full_name: { [Op.like]: `%${name}%` } },
        attributes: ['full_name', 'email', 'phone'],
        limit: 5
    });
    if (!matches.length) return { reply: `No staff member found matching "${name}".` };
    return {
        reply: `Found ${matches.length} staff member(s) matching "${name}":`,
        items: matches.map(m => ({ title: m.full_name, subtitle: m.email, extra: m.phone || 'N/A' }))
    };
}

async function adminReportsSummary() {
    const [totalParcels, delivered, pending, revenue] = await Promise.all([
        Parcel.count(),
        Parcel.count({ where: { parcel_status: 'Delivered' } }),
        Parcel.count({ where: { parcel_status: { [Op.in]: ACTIVE_STATUSES } } }),
        Payment.sum('amount', { where: { payment_status: 'Completed' } })
    ]);

    return {
        reply:
            "Quick business summary:\n\n" +
            `• Total parcels: ${totalParcels}\n` +
            `• Delivered: ${delivered}\n` +
            `• Pending: ${pending}\n` +
            `• Revenue: ${money(revenue || 0)}\n\n` +
            "For detailed daily/weekly/monthly reports and PDF export, open the Reports page."
    };
}

const ADMIN_INTENTS = [
    { test: (m) => /\btotal\s*customers?\b/.test(m), handler: adminTotalCustomers },
    { test: (m) => /\btotal\s*staff\b/.test(m), handler: adminTotalStaff },
    { test: (m) => /\btotal\s*parcels?\b/.test(m), handler: adminTotalParcels },
    { test: (m) => /\brevenue\b|\bearnings?\b|\bincome\b/.test(m), handler: adminRevenue },
    { test: (m) => /\bpending\b/.test(m), handler: adminPendingDeliveries },
    { test: (m) => /\bdelivered\b/.test(m), handler: adminDeliveredParcels },
    { test: (m) => /\bcustomer\b/.test(m), handler: adminCustomerInfo },
    { test: (m) => /\bstaff\b/.test(m), handler: adminStaffInfo },
    { test: (m) => /\breports?\b/.test(m), handler: adminReportsSummary },
];

const SUGGESTIONS = {
    client: ['Track my parcel', 'Show my bookings', 'Delivery charges', 'How to book a parcel'],
    staff: ['Assigned parcels', "Today's deliveries", 'Pending deliveries', 'Delivery history'],
    admin: ['Total parcels', 'Revenue', 'Pending deliveries', 'Reports']
};

async function getChatbotReply({ message, user }) {
    const msg = (message || '').trim();
    const lower = msg.toLowerCase();

    if (!lower || /^(hi|hello|hey|namaste)\b/.test(lower)) {
        const name = await getUserName(user.id);
        return {
            reply: `Hi${name ? ' ' + name : ''}! Here's what I can help with: ${SUGGESTIONS[user.role].join(', ')}.`,
            suggestions: SUGGESTIONS[user.role]
        };
    }

    const intents = user.role === 'admin' ? ADMIN_INTENTS : (user.role === 'staff' ? STAFF_INTENTS : CUSTOMER_INTENTS);

    for (const intent of intents) {
        if (intent.test(lower)) {
            try {
                const result = await intent.handler(user, lower);
                return { suggestions: SUGGESTIONS[user.role], ...result };
            } catch (err) {
                console.error('[CHATBOT] Handler error:', err);
                return { reply: "Something went wrong fetching that information. Please try again." };
            }
        }
    }

    return {
        reply: `I couldn't find a match for that. Try asking about: ${SUGGESTIONS[user.role].join(', ')}.`,
        suggestions: SUGGESTIONS[user.role]
    };
}

module.exports = { getChatbotReply };
