export const calculateParcelCost = (weight, distance, method) => {
    if (!distance || distance <= 0) return 0;

    const mass = parseFloat(weight || 0);

    let baseRate = 50;
    let weightRate = 5;
    let distanceRate = 1;

    if (method === 'Air') {
        baseRate = 150;
        weightRate = 5;
        distanceRate = 2;
    }

    const cost = baseRate + (mass * weightRate) + (distance * distanceRate);
    return Math.ceil(cost); 
};

export const getCostBreakdown = (weight, distance, method, codCharge = 0) => {
    const mass = parseFloat(weight || 0);
    let baseRate = 50;
    let weightRate = 5;
    let distanceRate = 1;

    if (method === 'Air') {
        baseRate = 150;
        weightRate = 5;
        distanceRate = 2;
    }

    const baseCharge = baseRate;
    const weightCharge = Math.round(mass * weightRate);
    const distanceCharge = Math.round((distance || 0) * distanceRate);
    const total = calculateParcelCost(weight, distance, method) + codCharge;

    return { baseCharge, weightCharge, distanceCharge, codCharge, total };
};
