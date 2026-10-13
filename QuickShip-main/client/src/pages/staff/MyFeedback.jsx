import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, PackageCheck, TrendingUp } from 'lucide-react';
import StarRating from '../../components/StarRating';

const StaffMyFeedback = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/feedback/staff/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummary(res.data);
            } catch (err) {
                console.error('Failed to fetch feedback summary', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your feedback...</div>;
    if (!summary) return <div className="p-8 text-center text-red-500">Unable to load your feedback right now. Please try again.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Feedback</h1>

            <div className="staff-grid xl:grid-cols-3">
                <div className="staff-card">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-600"><Star size={22} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Average Rating</p>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-bold text-slate-800">{summary.averageRating || 0}</h3>
                            <StarRating value={Math.round(summary.averageRating)} readOnly size={16} />
                        </div>
                    </div>
                </div>
                <div className="staff-card">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600"><MessageSquare size={22} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Total Reviews</p>
                        <h3 className="text-2xl font-bold text-slate-800">{summary.totalReviews}</h3>
                    </div>
                </div>
                <div className="staff-card">
                    <div className="p-3 rounded-full bg-green-100 text-green-600"><PackageCheck size={22} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Completed Deliveries</p>
                        <h3 className="text-2xl font-bold text-slate-800">{summary.completedDeliveries}</h3>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" /> Recent Customer Comments
                </h3>
                {summary.recentReviews.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No reviews yet.</p>
                ) : (
                    <div className="space-y-4">
                        {summary.recentReviews.map(r => (
                            <div key={r.feedback_id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-slate-700">{r.customer_name}</span>
                                    <StarRating value={r.rating} readOnly size={14} />
                                </div>
                                {r.title && <p className="font-semibold text-slate-800 text-sm">{r.title}</p>}
                                {r.comment && <p className="text-slate-600 text-sm mt-1">{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffMyFeedback;
