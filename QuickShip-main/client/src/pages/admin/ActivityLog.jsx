import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const ActivityLog = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [role, setRole] = useState('');
    const [action, setAction] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchLog = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, pageSize: 20 };
            if (role) params.role = role;
            if (action) params.action = action;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await axios.get('http://localhost:5000/api/activity-log', { ...authHeader, params });
            setEntries(res.data.entries);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Failed to fetch activity log', err);
        } finally {
            setLoading(false);
        }
    }, [page, role, action, dateFrom, dateTo]);

    useEffect(() => {
        fetchLog();
    }, [fetchLog]);

    const formatDate = (value) => {
        if (!value) return '\u2014';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '\u2014';
        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${datePart}, ${timePart}`;
    };

    const handleFilterChange = (setter) => (e) => {
        setPage(1);
        setter(e.target.value);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList size={24} className="text-blue-600" /> Activity Log
                </h1>
                <p className="text-sm text-slate-500 mt-1">Record of important changes made in the system.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select value={role} onChange={handleFilterChange(setRole)} className="form-input">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="client">Client</option>
                </select>
                <input
                    value={action}
                    onChange={handleFilterChange(setAction)}
                    placeholder="Search action..."
                    className="form-input"
                />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={handleFilterChange(setDateFrom)}
                    className="form-input"
                    title="From date"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={handleFilterChange(setDateTo)}
                    className="form-input"
                    title="To date"
                />
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead className="admin-table-thead">
                        <tr>
                            <th className="admin-table-th">User</th>
                            <th className="admin-table-th">Role</th>
                            <th className="admin-table-th">Action</th>
                            <th className="admin-table-th">Parcel</th>
                            <th className="admin-table-th">Date/Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="admin-table-td text-center text-slate-400">Loading...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={5} className="admin-table-td text-center text-slate-400">No activity found.</td></tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id} className="admin-table-tr-hover">
                                    <td className="admin-table-td font-medium">{entry.user_name || 'System'}</td>
                                    <td className="admin-table-td capitalize text-slate-500">{entry.role || '-'}</td>
                                    <td className="admin-table-td">{entry.action}</td>
                                    <td className="admin-table-td text-slate-500">
                                        {entry.parcel ? entry.parcel.tracking_hash : '-'}
                                    </td>
                                    <td className="admin-table-td text-slate-500">{formatDate(entry.createdAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="btn-admin-secondary !py-2 !px-3 disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="btn-admin-secondary !py-2 !px-3 disabled:opacity-40"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
