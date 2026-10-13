import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Star, MessageSquare, ThumbsUp, ThumbsDown, Award, AlertTriangle,
    Search, Filter, Calendar
} from 'lucide-react';
import StarRating from '../../components/StarRating';

const FeedbackManagement = () => {
    const [analytics, setAnalytics] = useState(null);
    const [list, setList] = useState({ items: [], total: 0 });
    const [staffOptions, setStaffOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [staffId, setStaffId] = useState('');
    const [rating, setRating] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/feedback/admin/analytics', authHeader);
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback analytics', err);
        }
    }, []);

    const fetchStaffOptions = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/staff', authHeader);
            setStaffOptions(res.data);
        } catch (err) {
            console.error('Failed to fetch staff list', err);
        }
    }, []);

    const fetchList = useCallback(async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (staffId) params.staffId = staffId;
            if (rating) params.rating = rating;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            const res = await axios.get('http://localhost:5000/api/feedback/admin/list', { ...authHeader, params });
            setList(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback list', err);
        }
    }, [search, staffId, rating, dateFrom, dateTo]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchAnalytics(), fetchStaffOptions(), fetchList()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => { fetchList(); }, 350);
        return () => clearTimeout(t);
    }, [search, staffId, rating, dateFrom, dateTo, fetchList]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading feedback analytics...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Feedback Management</h1>
                <p className="text-slate-500 text-sm">Review customer feedback and ratings.</p>
            </div>

            {analytics && (
                <>
                    <div className="admin-grid">
                        <div className="report-card">
                            <div className="flex justify-between items-start mb-4">
                                <div className="report-icon-wrapper bg-amber-100 text-amber-600"><Star size={22} /></div>
                            </div>
                            <p className="report-stat-label">Average Rating</p>
                            <h3 className="report-stat-value">{analytics.averageRating} / 5</h3>
                        </div>
                        <div className="report-card">
                            <div className="flex justify-between items-start mb-4">
                                <div className="report-icon-wrapper bg-blue-100 text-blue-600"><MessageSquare size={22} /></div>
                            </div>
                            <p className="report-stat-label">Total Reviews</p>
                            <h3 className="report-stat-value">{analytics.totalReviews}</h3>
                        </div>
                        <div className="report-card">
                            <div className="flex justify-between items-start mb-4">
                                <div className="report-icon-wrapper bg-green-100 text-green-600"><ThumbsUp size={22} /></div>
                            </div>
                            <p className="report-stat-label">Positive Reviews (4-5★)</p>
                            <h3 className="report-stat-value">{analytics.positiveReviews}</h3>
                        </div>
                        <div className="report-card">
                            <div className="flex justify-between items-start mb-4">
                                <div className="report-icon-wrapper bg-red-100 text-red-600"><ThumbsDown size={22} /></div>
                            </div>
                            <p className="report-stat-label">Negative Reviews (1-2★)</p>
                            <h3 className="report-stat-value">{analytics.negativeReviews}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="report-card lg:col-span-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Rating Distribution</h3>
                            <div className="space-y-3">
                                {analytics.ratingDistribution.slice().reverse().map(r => (
                                    <div key={r.rating} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 font-medium flex items-center gap-1">{r.rating} <Star size={12} className="text-amber-400 fill-amber-400" /></span>
                                            <span className="text-slate-800 font-bold">{r.count}</span>
                                        </div>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar bg-amber-400" style={{ width: `${analytics.totalReviews > 0 ? (r.count / analytics.totalReviews) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="report-card lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Award size={16} className="text-green-500" /> Top Rated Staff</h3>
                                    {analytics.topRatedStaff.length === 0 ? <p className="text-slate-400 text-sm italic">No rated staff yet.</p> : (
                                        <div className="space-y-3">
                                            {analytics.topRatedStaff.map(s => (
                                                <div key={s.staff_id} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-700 font-medium">{s.full_name}</span>
                                                    <span className="flex items-center gap-1 text-amber-500 font-bold">{s.averageRating} <Star size={12} className="fill-amber-400" /></span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Lowest Rated Staff</h3>
                                    {analytics.lowestRatedStaff.length === 0 ? <p className="text-slate-400 text-sm italic">No rated staff yet.</p> : (
                                        <div className="space-y-3">
                                            {analytics.lowestRatedStaff.map(s => (
                                                <div key={s.staff_id} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-700 font-medium">{s.full_name}</span>
                                                    <span className="flex items-center gap-1 text-red-500 font-bold">{s.averageRating} <Star size={12} className="fill-red-400 text-red-400" /></span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="admin-card">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Filter size={18} /> Search Reviews</h3>
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search title or comment..."
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">All Staff</option>
                        {staffOptions.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                    </select>
                    <select value={rating} onChange={(e) => setRating(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">All Ratings</option>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star</option>)}
                    </select>
                    <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1">
                        <Calendar size={14} className="text-slate-400" />
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm outline-none" />
                        <span className="text-slate-400 text-xs">to</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm outline-none" />
                    </div>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead className="admin-table-thead">
                        <tr>
                            <th className="admin-table-th">Parcel</th>
                            <th className="admin-table-th">Customer</th>
                            <th className="admin-table-th">Staff</th>
                            <th className="admin-table-th">Rating</th>
                            <th className="admin-table-th">Review</th>
                            <th className="admin-table-th">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.map(f => (
                            <tr key={f.feedback_id} className="admin-table-tr-hover">
                                <td className="admin-table-td font-medium text-slate-700">{f.parcel?.tracking_hash || '—'}</td>
                                <td className="admin-table-td">{f.customer?.full_name || '—'}</td>
                                <td className="admin-table-td">{f.staff?.full_name || '—'}</td>
                                <td className="admin-table-td"><StarRating value={f.rating} readOnly size={14} /></td>
                                <td className="admin-table-td max-w-xs">
                                    {f.title && <p className="font-semibold text-slate-700">{f.title}</p>}
                                    {f.comment && <p className="text-slate-500 text-xs truncate">{f.comment}</p>}
                                </td>
                                <td className="admin-table-td text-xs text-slate-400">{new Date(f.createdAt || f.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {list.items.length === 0 && (
                            <tr><td colSpan={6} className="admin-table-td text-center text-slate-400">No reviews match your filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeedbackManagement;
