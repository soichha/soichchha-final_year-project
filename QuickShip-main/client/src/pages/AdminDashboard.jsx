import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Package, Truck, PackageCheck, ClipboardList, UserCog, BarChart3, Clock,
    CalendarClock, AlertTriangle, UserCircle, Users, Wallet
} from 'lucide-react';

const ATTENTION_STATUSES = ['Delivery Attempt Failed', 'Rescheduled'];

const statusColor = (status) => {
    switch (status) {
        case 'Delivery Attempt Failed': return 'bg-red-100 text-red-700';
        case 'Rescheduled':              return 'bg-orange-100 text-orange-700';
        case 'Booked':                   return 'bg-purple-100 text-purple-700';
        default:                         return 'bg-slate-100 text-slate-600';
    }
};

const formatDateTime = (value) => {
    if (!value) return '\u2014';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '\u2014';
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
};

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [activity, setActivity] = useState([]);
    const [attention, setAttention] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const [summaryRes, activityRes, parcelsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/analytics/summary', config),
                    axios.get('http://localhost:5000/api/activity-log', { ...config, params: { page: 1, pageSize: 6 } }),
                    axios.get('http://localhost:5000/api/parcels', config)
                ]);
                setSummary(summaryRes.data);
                setActivity(activityRes.data.entries || []);

                const needsAttention = (parcelsRes.data || []).filter(p =>
                    ATTENTION_STATUSES.includes(p.parcel_status) ||
                    (p.parcel_status === 'Booked' && !p.delivery?.staff)
                );
                setAttention(needsAttention.slice(0, 8));
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const overviewCards = summary ? [
        { label: 'Total Parcels', value: summary.totalParcels, icon: <Package size={22} />, bg: 'bg-slate-100 text-slate-600' },
        { label: 'Active Deliveries', value: summary.activeDeliveries, icon: <Truck size={22} />, bg: 'bg-blue-100 text-blue-600' },
        { label: 'Delivered', value: summary.delivered, icon: <PackageCheck size={22} />, bg: 'bg-green-100 text-green-600' },
        { label: 'Delivery Attempts', value: summary.deliveryAttempts, icon: <ClipboardList size={22} />, bg: 'bg-amber-100 text-amber-600' },
        { label: 'Rescheduled', value: summary.rescheduledDeliveries, icon: <CalendarClock size={22} />, bg: 'bg-orange-100 text-orange-600' },
    ] : [];

    const secondaryCards = summary ? [
        { label: 'Total Customers', value: summary.totalCustomers, icon: <UserCircle size={16} /> },
        { label: 'Total Staff', value: summary.totalStaff, icon: <Users size={16} /> },
        { label: 'Monthly Revenue', value: `Rs. ${summary.monthlyRevenue}`, icon: <Wallet size={16} /> },
    ] : [];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>

            <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Overview</h3>
                <div className="admin-grid xl:grid-cols-5">
                    {loading && <p className="text-slate-400 text-sm col-span-full">Loading overview...</p>}
                    {overviewCards.map((stat, idx) => (
                        <div key={idx} className="admin-card flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800">{stat.value ?? '\u2014'}</h3>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bg}`}>
                                {stat.icon}
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && secondaryCards.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-1">
                        {secondaryCards.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                                <span className="text-slate-400">{s.icon}</span>
                                <span>{s.label}:</span>
                                <span className="font-bold text-slate-700">{s.value ?? '\u2014'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="admin-card">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link to="/admin/parcels" className="flex items-center gap-2 justify-center py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold transition">
                        <ClipboardList size={18} /> Manage Parcels
                    </Link>
                    <Link to="/admin/staff" className="flex items-center gap-2 justify-center py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold transition">
                        <UserCog size={18} /> Manage Staff
                    </Link>
                    <Link to="/admin/analytics" className="flex items-center gap-2 justify-center py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition">
                        <BarChart3 size={18} /> View Analytics
                    </Link>
                    <Link to="/admin/ml-prediction" className="flex items-center gap-2 justify-center py-3 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 rounded-lg font-bold transition">
                        <Clock size={18} /> Delivery Prediction
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="admin-card !p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Recent Activity</h3>
                        <Link to="/admin/activity-log" className="text-xs font-semibold text-blue-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <p className="p-4 text-sm text-slate-400">Loading...</p>
                        ) : activity.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">No activity found.</p>
                        ) : (
                            activity.map((entry) => (
                                <div key={entry.id} className="p-4 text-sm">
                                    <p className="text-slate-700">
                                        <span className="font-semibold">{entry.user_name || 'System'}</span>{' '}
                                        <span className="text-slate-500">{entry.action}</span>
                                        {entry.parcel && (
                                            <span className="text-blue-600 font-medium"> &middot; {entry.parcel.tracking_hash}</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(entry.createdAt)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-card !p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500" /> Parcels Requiring Attention
                        </h3>
                        <Link to="/admin/parcels" className="text-xs font-semibold text-blue-600 hover:underline">Manage</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <p className="p-4 text-sm text-slate-400">Loading...</p>
                        ) : attention.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">No parcels need attention right now.</p>
                        ) : (
                            attention.map((p) => (
                                <div key={p.parcel_id} className="p-4 text-sm flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-700">{p.tracking_hash}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {p.receiver_name}
                                            {!p.delivery?.staff && p.parcel_status === 'Booked' && ' \u00b7 not yet assigned'}
                                        </p>
                                    </div>
                                    <span className={`status-badge ${statusColor(p.parcel_status)}`}>{p.parcel_status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;
