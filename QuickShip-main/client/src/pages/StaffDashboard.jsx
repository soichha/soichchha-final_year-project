import { useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList, CheckSquare, Clock } from 'lucide-react';

const StaffDashboard = () => {
    const [stats, setStats] = useState({ assigned: 0, pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            if (!userId || !token) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/parcels/staff/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const tasks = res.data;
                setStats({
                    assigned: tasks.length,
                    pending: tasks.filter(t => t.parcel_status !== 'Delivered').length,
                    completed: tasks.filter(t => t.parcel_status === 'Delivered').length
                });
                setLoading(false);
            } catch (err) {
                console.error("Stats error");
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Staff Dashboard</h1>
            <div className="staff-grid">
                <div className="staff-card">
                    <div className="staff-card-icon bg-blue-100 text-blue-600"><ClipboardList size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Total Assignments</p>
                        <h2 className="text-2xl font-bold text-slate-800">{stats.assigned}</h2>
                    </div>
                </div>

                <div className="staff-card">
                    <div className="staff-card-icon bg-amber-100 text-amber-600"><Clock size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Pending Deliveries</p>
                        <h2 className="text-2xl font-bold text-slate-800">{stats.pending}</h2>
                    </div>
                </div>

                <div className="staff-card">
                    <div className="staff-card-icon bg-green-100 text-green-600"><CheckSquare size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Completed Deliveries</p>
                        <h2 className="text-2xl font-bold text-slate-800">{stats.completed}</h2>
                    </div>
                </div>
            </div>

            <div className="staff-card !block">
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Welcome back!</h3>
                <p className="text-slate-600">You have <span className="font-bold text-blue-600">{stats.pending}</span> tasks to complete today.</p>
            </div>
        </div>
    );
};

export default StaffDashboard;
