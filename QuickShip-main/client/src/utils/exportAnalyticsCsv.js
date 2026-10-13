const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const rowsToCsv = (rows) => rows.map(r => r.map(escapeCsv).join(',')).join('\n');

export function exportAnalyticsToCsv(summary, report) {
    const sections = [];

    sections.push('QuickShip Analytics Export');
    sections.push(`Generated: ${new Date().toLocaleString()}`);
    if (report) sections.push(`Report Period: ${report.company.reportPeriod}`);
    sections.push('');

    if (summary) {
        sections.push('BUSINESS OVERVIEW');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Total Customers', summary.totalCustomers],
            ['Total Staff', summary.totalStaff],
            ['Total Parcels', summary.totalParcels],
            ['Active Deliveries', summary.activeDeliveries],
            ['Delivered Parcels', summary.delivered],
            ['Pending Parcels', summary.pending],
            ['Cancelled Parcels', summary.cancelled],
            ["Today's Bookings", summary.todaysBookings],
            ["Today's Revenue", summary.todaysRevenue],
            ['Monthly Revenue', summary.monthlyRevenue],
        ]));
        sections.push('');
    }

    if (report) {
        sections.push('BOOKING INFORMATION');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Total Bookings', report.booking.total],
            ['Delivered Parcels', report.booking.delivered],
            ['Pending Parcels', report.booking.pending],
            ['Cancelled Parcels', report.booking.cancelled],
            ['Active Deliveries', report.booking.active],
        ]));
        sections.push('');

        sections.push('FINANCIAL INFORMATION');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Total Revenue', report.financial.totalRevenue],
            ['Average Delivery Cost', report.financial.avgCost.toFixed(2)],
            ['Highest Delivery Cost', report.financial.highestCost],
            ['Lowest Delivery Cost', report.financial.lowestCost],
        ]));
        sections.push('');

        sections.push('DELIVERY PERFORMANCE');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Average ETA (days)', report.deliveryPerformance.avgEtaDays],
            ['Average Actual Delivery Time (days)', report.deliveryPerformance.avgActualDeliveryDays],
            ['Delivery Success Rate (%)', report.deliveryPerformance.deliverySuccessRate],
            ['Delayed Deliveries', report.deliveryPerformance.delayedDeliveries],
        ]));
        sections.push('');

        sections.push('STAFF PERFORMANCE');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Total Staff', report.staffPerformance.totalStaff],
            ['Active Staff', report.staffPerformance.activeStaff],
            ['Best Performing Staff', report.staffPerformance.bestPerformingStaff?.full_name || 'N/A'],
        ]));
        sections.push(rowsToCsv([
            ['Staff', 'Assigned', 'Completed', 'Pending', 'Completion Rate (%)'],
            ...report.staffPerformance.workloadSummary.map(s => [s.full_name, s.assigned, s.completed, s.pending, s.completionRate])
        ]));
        sections.push('');

        sections.push('WEIGHTED STAFF ASSIGNMENT');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Automatic Assignments', report.smartAssignment.autoAssignments],
            ['Manual Assignments', report.smartAssignment.manualAssignments],
            ['Average Staff Workload', report.smartAssignment.avgWorkload.toFixed(1)],
            ['Assignment Efficiency (%)', report.smartAssignment.assignmentEfficiency],
        ]));
        sections.push('');

        sections.push('TOP DESTINATIONS');
        sections.push(rowsToCsv([['Destination', 'Count'], ...report.businessAnalytics.topDestinations.map(d => [d.destination, d.count])]));
        sections.push('');

        sections.push('BUSINESS SUMMARY');
        sections.push(escapeCsv(report.businessSummary));
        sections.push('');

        sections.push('RECOMMENDATIONS');
        report.recommendations.forEach((r, i) => sections.push(`${i + 1}. ${escapeCsv(r)}`));
        sections.push('');
    }

    if (report?.feedback) {
        sections.push('CUSTOMER FEEDBACK');
        sections.push(rowsToCsv([
            ['Metric', 'Value'],
            ['Average Rating', report.feedback.averageRating],
            ['Total Reviews', report.feedback.totalReviews],
            ['Positive Reviews', report.feedback.positiveReviews],
            ['Negative Reviews', report.feedback.negativeReviews],
            ['Top Rated Staff', report.feedback.topRatedStaff[0]?.full_name || 'N/A'],
        ]));
    }

    const csvContent = sections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quickship-analytics-${new Date().toLocaleDateString('en-CA')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
