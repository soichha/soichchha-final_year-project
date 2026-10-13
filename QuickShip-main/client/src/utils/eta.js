export function estimateArrivalFromPrediction(bookingDate, predictedHours) {
    if (!bookingDate || predictedHours === null || predictedHours === undefined) {
        return null;
    }

    const estimatedArrivalDate = new Date(bookingDate);

    estimatedArrivalDate.setTime(
        estimatedArrivalDate.getTime() +
        Number(predictedHours) * 60 * 60 * 1000
    );

    return estimatedArrivalDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

export function estimateArrival(distance, method, bookingDate = new Date()) {
    let daysToAdd;

    if (method === 'Air') {
        daysToAdd = 1;
    } else if (distance < 30) {
        daysToAdd = 1;
    } else if (distance < 100) {
        daysToAdd = 2;
    } else {
        daysToAdd = 4;
    }

    const arrivalDate = new Date(bookingDate);
    arrivalDate.setHours(arrivalDate.getHours() + daysToAdd * 24);

    return arrivalDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
