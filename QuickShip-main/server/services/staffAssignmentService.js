const db = require('../models');
const { Op } = require('sequelize');
const { ACTIVE_STATUSES } = require('../utils/constants');
const { haversine } = require('../utils/costCalculator');

const AVAILABILITY_THRESHOLD = 4;

const WEIGHTS = { workload: 0.35, distance: 0.25, availability: 0.15, successRate: 0.25 };

async function countActiveWorkload(staffId) {
    return db.Parcel.count({
        where: { parcel_status: { [Op.in]: ACTIVE_STATUSES } },
        include: [{
            model: db.Delivery,
            as: 'delivery',
            where: { staff_id: staffId },
            required: true
        }]
    });
}

async function getStaffWorkloads() {
    const staffMembers = await db.User.findAll({
        where: { role: 'staff' },
        attributes: ['user_id', 'full_name']
    });

    const workloads = await Promise.all(
        staffMembers.map(async (s) => ({
            staff_id: s.user_id,
            full_name: s.full_name,
            workload: await countActiveWorkload(s.user_id)
        }))
    );

    return workloads.sort((a, b) => a.workload - b.workload);
}

async function getStaffSuccessRate(staffId) {
    const totalAssigned = await db.Delivery.count({ where: { staff_id: staffId } });
    if (totalAssigned === 0) return 0.85;

    const delivered = await db.Delivery.count({
        where: { staff_id: staffId },
        include: [{ model: db.Parcel, as: 'parcel', where: { parcel_status: 'Delivered' }, required: true }]
    });

    return delivered / totalAssigned;
}

async function getStaffLastActiveDestination(staffId) {
    const activeDelivery = await db.Delivery.findOne({
        where: { staff_id: staffId },
        include: [{
            model: db.Parcel,
            as: 'parcel',
            where: { parcel_status: { [Op.in]: ACTIVE_STATUSES } },
            include: [{ model: db.Location, as: 'destinationLocation' }],
            required: true
        }],
        order: [['assigned_date', 'DESC']]
    });

    const loc = activeDelivery?.parcel?.destinationLocation;
    if (!loc || !loc.latitude || !loc.longitude) return null;
    return { latitude: loc.latitude, longitude: loc.longitude };
}

async function rankStaffForParcel(parcelId) {
    const parcel = await db.Parcel.findByPk(parcelId, {
        include: [{ model: db.Location, as: 'sourceLocation' }]
    });
    if (!parcel) return [];

    const sourceLoc = parcel.sourceLocation;
    const staffMembers = await db.User.findAll({ where: { role: 'staff' }, attributes: ['user_id', 'full_name'] });
    if (staffMembers.length === 0) return [];

    const scored = await Promise.all(staffMembers.map(async (s) => {
        const [workload, successRate, lastDestination] = await Promise.all([
            countActiveWorkload(s.user_id),
            getStaffSuccessRate(s.user_id),
            getStaffLastActiveDestination(s.user_id)
        ]);

        let distanceKm = 0;
        if (lastDestination && sourceLoc?.latitude && sourceLoc?.longitude) {
            distanceKm = haversine(lastDestination.latitude, lastDestination.longitude, sourceLoc.latitude, sourceLoc.longitude);
        }

        const isAvailable = workload < AVAILABILITY_THRESHOLD;

        const workloadScore = 1 / (1 + workload);
        const distanceScore = 1 / (1 + distanceKm / 10);
        const availabilityScore = isAvailable ? 1 : 0.3;
        const successScore = successRate;

        const weightedScore =
            workloadScore * WEIGHTS.workload +
            distanceScore * WEIGHTS.distance +
            availabilityScore * WEIGHTS.availability +
            successScore * WEIGHTS.successRate;

        return {
            staff_id: s.user_id,
            full_name: s.full_name,
            workload,
            distanceKm: lastDestination ? Number(distanceKm.toFixed(1)) : null,
            successRate: Number((successRate * 100).toFixed(0)),
            isAvailable,
            score: Math.round(weightedScore * 100)
        };
    }));

    return scored.sort((a, b) => b.score - a.score);
}

function buildRecommendationReason(top) {
    const parts = [];
    parts.push(`${top.workload} active parcel${top.workload === 1 ? '' : 's'} (lowest or near-lowest workload)`);
    parts.push(top.distanceKm !== null ? `about ${top.distanceKm} km from their last active delivery` : 'no active delivery, so available near the depot');
    parts.push(`${top.successRate}% historical delivery success rate`);
    parts.push(top.isAvailable ? 'currently available' : 'currently near capacity');
    return `Recommended because ${top.full_name} has ${parts.join(', ')}.`;
}

async function recommendStaff(parcelId) {
    const ranked = await rankStaffForParcel(parcelId);
    if (ranked.length === 0) return null;

    const top = ranked[0];

    return {
        recommended: {
            staff_id: top.staff_id,
            full_name: top.full_name
        },
        score: top.score,
        reason: buildRecommendationReason(top),
        alternatives: ranked
    };
}

async function autoAssignParcel(parcelId) {
    const recommendation = await recommendStaff(parcelId);
    if (!recommendation) return null;

    const { staff_id, full_name } = recommendation.recommended;
    const top = recommendation.alternatives[0];

    const [delivery] = await db.Delivery.findOrCreate({
        where: { parcel_id: parcelId },
        defaults: {
            staff_id,
            assigned_by: null,
            assignment_type: 'Auto',
            assignment_reason: recommendation.reason,
            workload_at_assignment: top.workload
        }
    });

    await db.Parcel.update(
        { parcel_status: 'Assigned' },
        { where: { parcel_id: parcelId, parcel_status: 'Booked' } }
    );

    return {
        staff_id,
        staff_name: full_name,
        workload_at_assignment: top.workload,
        score: recommendation.score,
        assignment_time: delivery.assigned_date,
        assignment_reason: recommendation.reason
    };
}

module.exports = {
    countActiveWorkload,
    getStaffWorkloads,
    getStaffSuccessRate,
    recommendStaff,
    autoAssignParcel
};
