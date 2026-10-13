

const ACTIVE_STATUSES = ['Booked', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivery Attempt Failed', 'Rescheduled'];

const IN_PROGRESS_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivery Attempt Failed', 'Rescheduled'];

module.exports = { ACTIVE_STATUSES, IN_PROGRESS_STATUSES };
