

const { parseLocalDate } = require('./dateUtils');

const COMPANY_NAME = 'QuickShip Courier Management System';

function resolveReportPeriod(period, dateParam) {
    const parsedAnchor = dateParam ? parseLocalDate(dateParam) : new Date();
    const anchor = isNaN(parsedAnchor.getTime()) ? new Date() : parsedAnchor;
    anchor.setHours(23, 59, 59, 999);

    let startDate, rangeKey, label, spanDays;

    switch (period) {
        case 'weekly':
            startDate = new Date(anchor);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            rangeKey = '7d';
            label = 'Weekly';
            spanDays = 7;
            break;
        case 'monthly':
            startDate = new Date(anchor);
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            rangeKey = '30d';
            label = 'Monthly';
            spanDays = 30;
            break;
        case 'daily':
        default:
            startDate = new Date(anchor);
            startDate.setHours(0, 0, 0, 0);
            rangeKey = 'today';
            label = 'Daily';
            spanDays = 1;
    }

    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - spanDays);

    return { startDate, endDate: anchor, rangeKey, label, previousStart, previousEnd };
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildCompanyInfo(period) {
    return {
        companyName: COMPANY_NAME,
        reportTitle: `${period.label} Business Report`,
        generatedDate: new Date().toISOString(),
        reportPeriod: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`
    };
}

function generateBusinessSummary(report) {
    const { company, booking, previousBooking, financial, feedback, smartAssignment } = report;
    const sentences = [];

    if (previousBooking && previousBooking.total > 0) {
        const change = booking.total - previousBooking.total;
        const pct = Math.round((Math.abs(change) / previousBooking.total) * 100);
        if (change > 0) {
            sentences.push(`During this ${company.reportTitle.toLowerCase()}, parcel bookings increased by approximately ${pct}% compared to the previous period (${booking.total} vs ${previousBooking.total}).`);
        } else if (change < 0) {
            sentences.push(`During this ${company.reportTitle.toLowerCase()}, parcel bookings decreased by approximately ${pct}% compared to the previous period (${booking.total} vs ${previousBooking.total}).`);
        } else {
            sentences.push(`During this ${company.reportTitle.toLowerCase()}, parcel bookings remained stable compared to the previous period, with ${booking.total} bookings in both.`);
        }
    } else {
        sentences.push(`During this ${company.reportTitle.toLowerCase()}, the system recorded ${booking.total} parcel booking${booking.total === 1 ? '' : 's'}.`);
    }

    sentences.push(`Total revenue for the period was Rs. ${financial.totalRevenue.toLocaleString()}, averaging Rs. ${financial.avgCost.toFixed(0)} per parcel.`);

    if (feedback.totalReviews > 0) {
        sentences.push(`Customer satisfaction averaged ${feedback.averageRating} stars across ${feedback.totalReviews} review${feedback.totalReviews === 1 ? '' : 's'}.`);
    } else {
        sentences.push('No customer feedback was recorded during this period.');
    }

    if (smartAssignment.autoAssignments + smartAssignment.manualAssignments > 0) {
        sentences.push(`Weighted Staff Assignment automatically handled ${smartAssignment.assignmentEfficiency}% of assignments this period, distributing an average active workload of ${smartAssignment.avgWorkload.toFixed(1)} parcels per staff member.`);
    }

    return sentences.join(' ');
}

function generateRecommendations(report) {
    const { booking, deliveryPerformance, feedback, smartAssignment, businessAnalytics } = report;
    const recommendations = [];

    if (booking.pending > booking.delivered) {
        recommendations.push('Consider increasing staff during this high-demand period — pending parcels currently outnumber delivered ones.');
    }

    if (deliveryPerformance.delayedDeliveries > 0) {
        recommendations.push(`Improve delivery speed for delayed routes — ${deliveryPerformance.delayedDeliveries} delivered parcel${deliveryPerformance.delayedDeliveries === 1 ? '' : 's'} exceeded ${deliveryPerformance.delayedDeliveries === 1 ? 'its' : 'their'} estimated delivery time this period.`);
    }

    if (businessAnalytics.topDestinations && businessAnalytics.topDestinations.length > 0) {
        recommendations.push(`Focus marketing on the top-performing destination this period: ${businessAnalytics.topDestinations[0].destination}.`);
    }

    if (feedback.totalReviews < booking.delivered) {
        recommendations.push('Encourage more customers to leave feedback after delivery — review volume is lower than the number of completed deliveries.');
    }

    if (feedback.totalReviews > 0 && feedback.negativeReviews > feedback.positiveReviews) {
        recommendations.push('Negative reviews currently outweigh positive ones this period — investigate recent complaints to improve service quality.');
    }

    if ((smartAssignment.autoAssignments + smartAssignment.manualAssignments) > 0 && smartAssignment.assignmentEfficiency < 70) {
        recommendations.push('A significant share of assignments required manual intervention this period — review the Weighted Staff Assignment recommendations or staff availability.');
    }

    if (recommendations.length === 0) {
        recommendations.push('No specific concerns were identified this period — overall performance is within normal parameters.');
    }

    return recommendations;
}

module.exports = {
    COMPANY_NAME,
    resolveReportPeriod,
    buildCompanyInfo,
    generateBusinessSummary,
    generateRecommendations
};
