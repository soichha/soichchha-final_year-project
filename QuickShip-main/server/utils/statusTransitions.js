

const ALLOWED_STATUS_TRANSITIONS = {
    'Booked': ['Assigned'],
    'Assigned': ['Picked Up'],
    'Picked Up': ['In Transit'],
    'In Transit': ['Out for Delivery'],
    'Out for Delivery': [],
    'Delivery Attempt Failed': ['Out for Delivery'],
    'Rescheduled': ['Out for Delivery'],
    'Delivered': [],
    'Cancelled': []
};

function isTransitionAllowed(fromStatus, toStatus) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus];
    return Array.isArray(allowed) && allowed.includes(toStatus);
}

module.exports = { ALLOWED_STATUS_TRANSITIONS, isTransitionAllowed };
