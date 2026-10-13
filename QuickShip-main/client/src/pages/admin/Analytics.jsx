import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Package, Users, UserCircle, Truck, PackageCheck, PackageX, CalendarClock,
    TrendingUp, TrendingDown, Minus, Clock, IndianRupee, Award,
    MapPin, Star, AlertTriangle, Printer, Download, XCircle
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import StarRating from '../../components/StarRating';
import { exportAnalyticsToCsv } from '../../utils/exportAnalyticsCsv';

const PERIODS = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }
];

const STATUS_COLORS = { Delivered: '#22c55e', Pending: '#f59e0b', Cancelled: '#ef4444', 'In Transit': '#3b82f6' };

const Analytics = () => {
    const [period, setPeriod] = useState('daily');
    const [summary, setSummary] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, reportRes] = await Promise.all([
                axios.get('http://localhost:5000/api/analytics/summary', config),
                axios.get('http://localhost:5000/api/reports/generate', { ...config, params: { period } })
            ]);
            setSummary(summaryRes.data);
            setReport(reportRes.data);
        } catch (err) {
            console.error('Failed to load analytics', err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handlePrint = () => window.print();
    const handleExportCsv = () => exportAnalyticsToCsv(summary, report);

    if (loading || !summary || !report) {
        return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
    }

    const bookingTrendChange = report.previousBooking.total > 0
        ? Math.round(((report.booking.total - report.previousBooking.total) / report.previousBooking.total) * 100)
        : null;

    const parcelOverviewCards = [
        { label: 'Total Parcels', value: report.booking.total, icon: <Package size={20} />, color: 'bg-slate-100 text-slate-600' },
        { label: 'Delivered', value: report.booking.delivered, icon: <PackageCheck size={20} />, color: 'bg-green-100 text-green-600' },
        { label: 'In Transit', value: report.booking.active, icon: <Truck size={20} />, color: 'bg-blue-100 text-blue-600' },
        { label: 'Pending', value: report.booking.pending, icon: <Clock size={20} />, color: 'bg-amber-100 text-amber-600' },
        { label: 'Delivery Attempt Failed', value: summary.failedDeliveries, icon: <PackageX size={20} />, color: 'bg-red-100 text-red-600' },
        { label: 'Rescheduled', value: summary.rescheduledDeliveries, icon: <CalendarClock size={20} />, color: 'bg-orange-100 text-orange-600' },
        { label: 'Cancelled', value: report.booking.cancelled, icon: <XCircle size={20} />, color: 'bg-slate-100 text-slate-500' },
    ];

    const deliveryPerformanceCards = [
        { label: 'Average Delivery Time', value: `${report.deliveryPerformance.avgActualDeliveryDays}d`, icon: <Clock size={20} />, color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Average ETA', value: `${report.deliveryPerformance.avgEtaDays}d`, icon: <Clock size={20} />, color: 'bg-slate-100 text-slate-600' },
        { label: 'Delivery Attempts', value: summary.deliveryAttempts, icon: <Package size={20} />, color: 'bg-slate-100 text-slate-600' },
        { label: 'Delivery Success Rate', value: `${report.deliveryPerformance.deliverySuccessRate}%`, icon: <PackageCheck size={20} />, color: 'bg-green-100 text-green-600' },
        { label: 'Delayed Deliveries', value: report.deliveryPerformance.delayedDeliveries, icon: <AlertTriangle size={20} />, color: 'bg-red-100 text-red-600' },
    ];

    return (
        <div className="space-y-8 print:p-0">
            <div className="flex flex-wrap justify-between items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
                    <p className="text-slate-500 text-sm">Delivery, payment, staff, and feedback reporting.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${period === p.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExportCsv} className="btn-admin-secondary text-xs px-3 py-1.5">
                        <Download size={14} /> CSV
                    </button>
                    <button onClick={handlePrint} className="btn-admin-secondary text-xs px-3 py-1.5">
                        <Printer size={14} /> PDF
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 print:hidden">
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                    <UserCircle size={16} className="text-slate-400" /> Total Customers: <span className="font-bold text-slate-700">{summary.totalCustomers}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                    <Users size={16} className="text-slate-400" /> Total Staff: <span className="font-bold text-slate-700">{summary.totalStaff}</span>
                </div>
            </div>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Parcel Overview</h3>
                <div className="admin-grid xl:grid-cols-4">
                    {parcelOverviewCards.map((c, i) => (
                        <div key={i} className="report-card flex items-center justify-between">
                            <div>
                                <p className="report-stat-label mb-1">{c.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800">{c.value}</h3>
                            </div>
                            <div className={`report-icon-wrapper ${c.color}`}>{c.icon}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Delivery Performance</h3>
                <div className="admin-grid xl:grid-cols-5">
                    {deliveryPerformanceCards.map((c, i) => (
                        <div key={i} className="report-card flex items-center justify-between">
                            <div>
                                <p className="report-stat-label mb-1">{c.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800">{c.value}</h3>
                            </div>
                            <div className={`report-icon-wrapper ${c.color}`}>{c.icon}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package size={18} className="text-blue-600" /> Booking Activity ({report.company.reportPeriod})</h3>
                <div className="admin-grid">
                    <div className="report-card">
                        <div className="flex justify-between items-start mb-2">
                            <p className="report-stat-label">Total Bookings</p>
                            {bookingTrendChange !== null && (
                                <span className={`flex items-center text-xs font-bold ${bookingTrendChange > 0 ? 'text-green-500' : bookingTrendChange < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {bookingTrendChange > 0 ? <TrendingUp size={14} /> : bookingTrendChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                    {bookingTrendChange !== 0 ? `${Math.abs(bookingTrendChange)}%` : ''}
                                </span>
                            )}
                        </div>
                        <h3 className="report-stat-value">{report.booking.total}</h3>
                        <p className="text-xs text-slate-400 mt-1">vs. previous period</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="report-card">
                        <h4 className="text-base font-bold text-slate-800 mb-4">Daily Booking Trend</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.businessAnalytics.dailyBookingTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip labelFormatter={(d) => new Date(`${d}T00:00:00`).toLocaleDateString()} />
                                    <Area type="monotone" dataKey="count" name="Bookings" stroke="#3b82f6" fill="#bfdbfe" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="report-card">
                        <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-blue-600" /> Top 10 Destinations</h4>
                        <div className="h-64">
                            {report.businessAnalytics.topDestinations.length === 0 ? (
                                <p className="h-full flex items-center justify-center text-center text-slate-400 text-sm">No destination data for this period.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.businessAnalytics.topDestinations} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="destination" width={110} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" name="Parcels" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Parcel Status</h3>
                <div className="report-card max-w-xl">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={report.businessAnalytics.deliveryStatusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => count > 0 ? `${status}: ${count}` : ''}>
                                    {report.businessAnalytics.deliveryStatusDistribution.map((entry, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><IndianRupee size={18} className="text-green-600" /> Financial Summary</h3>
                <div className="admin-grid">
                    <div className="report-card">
                        <p className="report-stat-label mb-1">Total Revenue</p>
                        <h3 className="report-stat-value">Rs. {report.financial.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="report-card">
                        <p className="report-stat-label mb-1">Monthly Revenue</p>
                        <h3 className="report-stat-value">Rs. {summary.monthlyRevenue}</h3>
                    </div>
                    <div className="report-card">
                        <p className="report-stat-label mb-1">Average Delivery Cost</p>
                        <h3 className="report-stat-value">Rs. {report.financial.avgCost.toFixed(0)}</h3>
                    </div>
                    <div className="report-card">
                        <p className="report-stat-label mb-1">Highest / Lowest Cost</p>
                        <h3 className="text-lg font-bold text-slate-800">Rs. {report.financial.highestCost} / Rs. {report.financial.lowestCost}</h3>
                    </div>
                </div>
                <div className="report-card">
                    <h4 className="text-base font-bold text-slate-800 mb-4">Monthly Revenue Trend (Last 12 Months)</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={report.businessAnalytics.monthlyRevenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => `Rs. ${v}`} />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600" /> Staff Performance</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        Total Staff: <span className="font-bold text-slate-700">{report.staffPerformance.totalStaff}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        Active Staff: <span className="font-bold text-slate-700">{report.staffPerformance.activeStaff}</span>
                    </div>
                    {report.staffPerformance.bestPerformingStaff && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                            <Award size={14} className="text-amber-500" /> Best Performing: <span className="font-bold text-slate-700">{report.staffPerformance.bestPerformingStaff.full_name}</span>
                            <span className="text-xs text-slate-400">({report.staffPerformance.bestPerformingStaff.completionRate}%)</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <Truck size={14} className="text-cyan-600" /> Auto-assigned: <span className="font-bold text-slate-700">{report.smartAssignment.autoAssignments}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        Manually assigned: <span className="font-bold text-slate-700">{report.smartAssignment.manualAssignments}</span>
                    </div>
                </div>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th">Staff</th>
                                <th className="admin-table-th">Assigned</th>
                                <th className="admin-table-th">Delivered</th>
                                <th className="admin-table-th">Pending</th>
                                <th className="admin-table-th">Success / Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.staffPerformance.workloadSummary.map(s => (
                                <tr key={s.full_name} className="admin-table-tr-hover">
                                    <td className="admin-table-td font-medium text-slate-700">{s.full_name}</td>
                                    <td className="admin-table-td">{s.assigned}</td>
                                    <td className="admin-table-td text-green-600">{s.completed}</td>
                                    <td className="admin-table-td text-amber-600">{s.pending}</td>
                                    <td className="admin-table-td">
                                        <div className="flex items-center gap-2">
                                            <div className="progress-bar-container w-20">
                                                <div className="progress-bar bg-green-500" style={{ width: `${s.completionRate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{s.completionRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {report.staffPerformance.workloadSummary.length === 0 && (
                                <tr><td colSpan={5} className="admin-table-td text-center text-slate-400">No staff performance data for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {report.feedback && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Star size={18} className="text-amber-500" /> Customer Feedback</h3>
                    <div className="admin-grid xl:grid-cols-4">
                        <div className="report-card">
                            <p className="report-stat-label mb-1">Average Rating</p>
                            <div className="flex items-center gap-2">
                                <h3 className="report-stat-value">{report.feedback.averageRating}</h3>
                                <StarRating value={Math.round(report.feedback.averageRating)} readOnly size={16} />
                            </div>
                        </div>
                        <div className="report-card">
                            <p className="report-stat-label mb-1">Total Reviews</p>
                            <h3 className="report-stat-value">{report.feedback.totalReviews}</h3>
                        </div>
                        <div className="report-card">
                            <p className="report-stat-label mb-1">Positive Reviews</p>
                            <h3 className="report-stat-value text-green-600">{report.feedback.positiveReviews}</h3>
                        </div>
                        <div className="report-card">
                            <p className="report-stat-label mb-1">Negative Reviews</p>
                            <h3 className="report-stat-value text-red-500">{report.feedback.negativeReviews}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="report-card">
                            <h4 className="text-base font-bold text-slate-800 mb-4">Rating Distribution</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.feedback.ratingDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="rating" tick={{ fontSize: 11 }} tickFormatter={(r) => `${r}\u2605`} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" name="Reviews" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="report-card">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm">Staff Ratings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1"><Award size={14} /> Top Rated</p>
                                    {report.feedback.topRatedStaff.length === 0 ? <p className="text-slate-400 text-xs italic">No data yet.</p> : (
                                        <div className="space-y-2">
                                            {report.feedback.topRatedStaff.map(s => (
                                                <div key={s.staff_id} className="flex justify-between text-xs">
                                                    <span className="text-slate-700 font-medium truncate">{s.full_name}</span>
                                                    <span className="text-amber-500 font-bold">{s.averageRating}\u2605</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Lowest Rated</p>
                                    {report.feedback.lowestRatedStaff.length === 0 ? <p className="text-slate-400 text-xs italic">No data yet.</p> : (
                                        <div className="space-y-2">
                                            {report.feedback.lowestRatedStaff.map(s => (
                                                <div key={s.staff_id} className="flex justify-between text-xs">
                                                    <span className="text-slate-700 font-medium truncate">{s.full_name}</span>
                                                    <span className="text-red-500 font-bold">{s.averageRating}\u2605</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="hidden print:block border-t border-slate-200 mt-8 pt-6 text-center text-slate-400 text-xs">
                Generated by QuickShip Analytics on {new Date().toLocaleString()} &middot; Period: {report.company.reportPeriod}
            </div>
        </div>
    );
};

export default Analytics;
