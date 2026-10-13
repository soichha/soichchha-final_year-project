const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateCost = (weight, distance, deliveryMethod) => {
    let baseRate = 50;
    let weightRate = 5;
    let distanceRate = 1;

    if (deliveryMethod === 'Air') {
        baseRate = 150;
        weightRate = 5;
        distanceRate = 2;
    }

    let cost = baseRate + (weight * weightRate) + (distance * distanceRate);
    return Math.ceil(cost);
};

const getCostBreakdown = (weight, distance, deliveryMethod, codCharge = 0) => {
    let baseRate = 50;
    let weightRate = 5;
    let distanceRate = 1;

    if (deliveryMethod === 'Air') {
        baseRate = 150;
        weightRate = 5;
        distanceRate = 2;
    }

    const baseCharge = baseRate;
    const weightCharge = Math.round(weight * weightRate);
    const distanceCharge = Math.round(distance * distanceRate);
    const total = calculateCost(weight, distance, deliveryMethod) + codCharge;

    return { baseCharge, weightCharge, distanceCharge, codCharge, total };
};

module.exports = { calculateCost, getCostBreakdown, haversine };
