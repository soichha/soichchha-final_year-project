

const estimateDeliveryTime = (distance, method, bookingDate = new Date()) => {
    let daysToAdd = 1;

    if (method === 'Air') {
        daysToAdd = 1;
    } else {
        if (distance < 30) {
            daysToAdd = 1;
        } else if (distance >= 30 && distance < 100) {
            daysToAdd = 2;
        } else {
            daysToAdd = 4;
        }
    }
    
    const arrivalDate = new Date(bookingDate);
    arrivalDate.setHours(arrivalDate.getHours() + (daysToAdd * 24));
    
    return {
        date: arrivalDate,
        humanReadable: arrivalDate.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }),
        totalDays: daysToAdd
    };
};

module.exports = { estimateDeliveryTime };
