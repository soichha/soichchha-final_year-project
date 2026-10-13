import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, MapPin, Edit, Trash2, X, QrCode, UserCheck } from 'lucide-react';
import ParcelDetailsModal from '../../components/ParcelDetailsModal';

const Parcels = () => {
    const [parcels, setParcels] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignMode, setAssignMode] = useState(null); 
    const [editParcel, setEditParcel] = useState(null); 
    const [editData, setEditData] = useState({}); 
    const [detailsTarget, setDetailsTarget] = useState(null); 
    const [recommendation, setRecommendation] = useState(null);
    const [recommendLoading, setRecommendLoading] = useState(false);
    const [overrideMode, setOverrideMode] = useState(false);

    const openEdit = (parcel) => {
        setEditParcel(parcel);
        setEditData({
            receiver_name: parcel.receiver_name,
            receiver_phone: parcel.receiver_phone,
            weight: parcel.weight,
            parcel_status: parcel.parcel_status,
            staff_id: parcel.delivery?.staff_id || ""
        });
    };

    const fetchData = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const [pRes, sRes] = await Promise.all([
                axios.get('http://localhost:5000/api/parcels', config),
                axios.get('http://localhost:5000/api/users/staff', config)
            ]);
            setParcels(pRes.data);
            setStaffList(sRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert("Unable to load data. Please try again.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (parcelId, staffId) => {
        if (!staffId) return;
        try {
            await axios.put(`http://localhost:5000/api/parcels/${parcelId}/assign`, { staffId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Staff Assigned Successfully');
            setAssignMode(null);
            setRecommendation(null);
            setOverrideMode(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to assign staff. Please try again.');
        }
    };

    const openAssign = async (parcelId) => {
        setAssignMode(parcelId);
        setOverrideMode(false);
        setRecommendation(null);
        setRecommendLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/parcels/${parcelId}/recommend-staff`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRecommendation(res.data);
        } catch (err) {
            setOverrideMode(true);
        } finally {
            setRecommendLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this parcel? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/parcels/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to delete this parcel. Please try again.');
        }
    };

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/parcels/${editParcel.parcel_id}`, editData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Parcel Updated Successfully!');
            setEditParcel(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to update this parcel. Please try again.');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Parcel Management</h1>
            </div>

            <div className="admin-table-container">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th">Tracking No.</th>
                                <th className="admin-table-th">Sender</th>
                                <th className="admin-table-th">Receiver</th>
                                <th className="admin-table-th">Location</th>
                                <th className="admin-table-th">Type</th>
                                <th className="admin-table-th">Status</th>
                                <th className="admin-table-th">Payment</th>
                                <th className="admin-table-th">Assigned To</th>
                                <th className="admin-table-th">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {parcels.map((parcel) => (
                                <tr key={parcel.parcel_id} className="admin-table-tr-hover">
                                    <td className="admin-table-td font-bold text-blue-600 whitespace-nowrap">{parcel.tracking_hash}</td>

                                    <td className="admin-table-td">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{parcel.client?.full_name || 'Unknown'}</span>
                                        </div>
                                    </td>

                                    <td className="admin-table-td">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{parcel.receiver_name}</span>
                                            <span className="text-xs text-slate-400">{parcel.receiver_phone}</span>
                                        </div>
                                    </td>

                                    <td className="admin-table-td">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">
                                                {parcel.destinationLocation?.city_or_area || 'N/A'}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span>{parcel.destinationLocation?.district || ''}</span>
                                                {parcel.destinationLocation?.latitude && (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${parcel.destinationLocation.latitude},${parcel.destinationLocation.longitude}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="View on Map"
                                                    >
                                                        <MapPin size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="admin-table-td">
                                        <span className={`badge-feature !mt-0 ${parcel.delivery_type === 'Air' ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {parcel.delivery_type}
                                        </span>
                                    </td>

                                    <td className="admin-table-td">
                                        <span className={`status-badge 
                                            ${parcel.parcel_status === 'Pending' ? 'status-pending' :
                                                parcel.parcel_status === 'Delivered' ? 'status-delivered' :
                                                    parcel.parcel_status === 'Delivery Attempt Failed' ? 'bg-red-100 text-red-700' :
                                                        parcel.parcel_status === 'Rescheduled' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                            {parcel.parcel_status}
                                        </span>
                                    </td>

                                    <td className="admin-table-td">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md
                                            ${parcel.payment?.payment_status === 'Completed' || parcel.payment?.payment_status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {parcel.payment?.payment_status || 'Pending'}
                                        </span>
                                    </td>

                                    <td className="admin-table-td">
                                        {parcel.delivery?.staff ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-2 text-slate-700 font-medium">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                                                    {parcel.delivery.staff.full_name}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit cursor-help ${parcel.delivery.assignment_type === 'Auto' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
                                                    title={
                                                        `${parcel.delivery.assignment_reason || 'Manually assigned'}` +
                                                        (parcel.delivery.assigned_date ? ` • ${new Date(parcel.delivery.assigned_date).toLocaleString()}` : '')
                                                    }
                                                >
                                                    {parcel.delivery.assignment_type === 'Auto' ? 'Auto-assigned' : 'Manual'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Unassigned</span>
                                        )}
                                    </td>

                                    <td className="admin-table-td flex gap-1">
                                        {assignMode === parcel.parcel_id ? (
                                            <div className="flex flex-col gap-2 min-w-[220px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                {recommendLoading && (
                                                    <p className="text-xs text-slate-400 italic">Finding the best staff...</p>
                                                )}

                                                {!recommendLoading && recommendation && !overrideMode && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase">
                                                            <UserCheck size={12} /> Recommended
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800">{recommendation.recommended.full_name}</p>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                                                            <span>Assignment Score</span>
                                                            <span className="text-indigo-600">{recommendation.score}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500" style={{ width: `${recommendation.score}%` }} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-snug">{recommendation.reason}</p>
                                                        <div className="flex gap-1 pt-1">
                                                            <button
                                                                onClick={() => handleAssign(parcel.parcel_id, recommendation.recommended.staff_id)}
                                                                className="btn-admin-primary !text-[11px] !py-1 !px-2 flex-1 justify-center">
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => setOverrideMode(true)}
                                                                className="btn-admin-secondary !text-[11px] !py-1 !px-2 flex-1 justify-center">
                                                                Override
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {!recommendLoading && (overrideMode || !recommendation) && (
                                                    <>
                                                        <select className="form-input !py-1 !text-xs" onChange={(e) => handleAssign(parcel.parcel_id, e.target.value)}>
                                                            <option value="">Select Staff...</option>
                                                            {staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                                                        </select>
                                                        {recommendation && (
                                                            <button onClick={() => setOverrideMode(false)} className="text-indigo-500 text-[10px] hover:underline px-1 text-left">← Back to recommendation</button>
                                                        )}
                                                    </>
                                                )}

                                                <button onClick={() => { setAssignMode(null); setRecommendation(null); }} className="text-red-500 text-[10px] hover:underline px-1 text-left">Cancel</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => setDetailsTarget(parcel)} className="btn-admin-edit" title="Parcel Details">
                                                    <QrCode size={16} />
                                                </button>
                                                <button onClick={() => openEdit(parcel)} className="btn-admin-edit" title="Edit Parcel">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(parcel.parcel_id)} className="btn-admin-danger" title="Delete Parcel">
                                                    <Trash2 size={16} />
                                                </button>
                                                {!parcel.delivery?.staff && (
                                                    <button onClick={() => openAssign(parcel.parcel_id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Assign Staff">
                                                        <UserPlus size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {parcels.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                                        No parcels found. Book a parcel from the Client Portal to see it here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editParcel && (
                <div className="modal-overlay">
                    <div key={editParcel.parcel_id} className="modal-container">
                        <div className="modal-header">
                            <h3 className="text-xl font-bold text-slate-800">Edit Parcel</h3>
                            <button onClick={() => setEditParcel(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="modal-body space-y-4">
                            <div className="form-group">
                                <label className="form-label">Receiver Name</label>
                                <input
                                    value={editData.receiver_name || ""}
                                    onChange={(e) => setEditData({ ...editData, receiver_name: e.target.value })}
                                    className="form-input" required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Receiver Phone</label>
                                <input
                                    value={editData.receiver_phone || ""}
                                    onChange={(e) => setEditData({ ...editData, receiver_phone: e.target.value })}
                                    className="form-input" required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weight (kg)</label>
                                <input
                                    type="number" step="0.1"
                                    value={editData.weight || ""}
                                    onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                                    className="form-input" required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    value={editData.parcel_status || ""}
                                    onChange={(e) => setEditData({ ...editData, parcel_status: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="Booked">Booked</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="Picked Up">Picked Up</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Out for Delivery">Out for Delivery</option>
                                    <option value="Delivery Attempt Failed">Delivery Attempt Failed</option>
                                    <option value="Rescheduled">Rescheduled</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Assign/Re-assign Staff</label>
                                <select
                                    value={editData.staff_id || ""}
                                    onChange={(e) => setEditData({ ...editData, staff_id: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {staffList.map(staff => (
                                        <option key={staff.user_id} value={staff.user_id}>{staff.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn-submit !mt-6">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {detailsTarget && (
                <ParcelDetailsModal
                    parcel={detailsTarget}
                    onClose={() => setDetailsTarget(null)}
                />
            )}
        </div>
    );
};

export default Parcels;
