import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, MapPin, Phone, User, X, Check, AlertTriangle, Calendar, History } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import BillInvoice from '../../components/BillInvoice';
import ParcelTimeline from '../../components/ParcelTimeline';
import { FileText } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NEXT_STATUS = {
    'Booked': 'Assigned',
    'Assigned': 'Picked Up',
    'Picked Up': 'In Transit',
    'In Transit': 'Out for Delivery',
    'Delivery Attempt Failed': 'Out for Delivery',
    'Rescheduled': 'Out for Delivery'
};

const ADVANCE_LABEL = {
    'Booked': 'Mark as Assigned',
    'Assigned': 'Pick Up Parcel',
    'Picked Up': 'Start Transit',
    'In Transit': 'Out for Delivery',
    'Rescheduled': 'Out for Delivery'
};

const ATTEMPT_REASONS = [
    'Receiver unavailable',
    'Wrong address',
    'Phone unreachable',
    'Customer requested reschedule',
    'Other'
];

const statusColor = (status) => {
    switch (status) {
        case 'Delivered':               return 'bg-green-100 text-green-700';
        case 'In Transit':              return 'bg-blue-100 text-blue-700';
        case 'Out for Delivery':        return 'bg-blue-100 text-blue-700';
        case 'Assigned':                return 'bg-yellow-100 text-yellow-700';
        case 'Booked':                  return 'bg-purple-100 text-purple-700';
        case 'Delivery Attempt Failed': return 'bg-red-100 text-red-700';
        case 'Rescheduled':             return 'bg-orange-100 text-orange-700';
        default:                        return 'bg-slate-100 text-slate-600';
    }
};

const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const AssignedParcels = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);

    const [deliverTarget, setDeliverTarget] = useState(null);
    const [receiverName, setReceiverName] = useState('');
    const [deliverRemarks, setDeliverRemarks] = useState('');
    const [deliverError, setDeliverError] = useState('');
    const [deliverSubmitting, setDeliverSubmitting] = useState(false);

    const [attemptTarget, setAttemptTarget] = useState(null);
    const [attemptReason, setAttemptReason] = useState(ATTEMPT_REASONS[0]);
    const [attemptRemarks, setAttemptRemarks] = useState('');
    const [attemptNextDate, setAttemptNextDate] = useState('');
    const [attemptError, setAttemptError] = useState('');
    const [attemptSubmitting, setAttemptSubmitting] = useState(false);

    const fetchTasks = async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId || !token) {
            setLoading(false);
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const pRes = await axios.get(`http://localhost:5000/api/parcels/staff/${userId}`, config);
            const activeTasks = pRes.data.filter(t => t.parcel_status !== 'Delivered');
            setTasks(activeTasks);
        } catch (err) {
            console.error("Parcels fetch failed:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAdvanceStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/parcels/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to update delivery status. Please try again.');
        }
    };

    const openDeliverModal = (id) => {
        setDeliverTarget(id);
        setReceiverName('');
        setDeliverRemarks('');
        setDeliverError('');
    };

    const handleConfirmDelivery = async () => {
        if (!receiverName.trim()) {
            setDeliverError('Please enter the receiver name.');
            return;
        }
        setDeliverSubmitting(true);
        setDeliverError('');
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/parcels/${deliverTarget}/deliver`, {
                receiverName: receiverName.trim(),
                remarks: deliverRemarks.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeliverTarget(null);
            fetchTasks();
            alert('Parcel marked as delivered.');
        } catch (err) {
            setDeliverError(err.response?.data?.error || 'Could not confirm delivery. Please try again.');
        } finally {
            setDeliverSubmitting(false);
        }
    };

    const openAttemptModal = (id) => {
        setAttemptTarget(id);
        setAttemptReason(ATTEMPT_REASONS[0]);
        setAttemptRemarks('');
        setAttemptNextDate('');
        setAttemptError('');
    };

    const handleRecordAttempt = async () => {
        if (!attemptReason) {
            setAttemptError('Please select a reason.');
            return;
        }
        setAttemptSubmitting(true);
        setAttemptError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/parcels/${attemptTarget}/delivery-attempt`, {
                reason: attemptReason,
                remarks: attemptRemarks.trim(),
                nextDeliveryDate: attemptNextDate || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttemptTarget(null);
            fetchTasks();
            alert('Delivery attempt recorded.');
        } catch (err) {
            setAttemptError(err.response?.data?.error || 'Could not record the delivery attempt. Please try again.');
        } finally {
            setAttemptSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading assignments...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Assigned Parcels</h1>

            {tasks.length === 0 ? (
                <div className="staff-empty-state">
                    <Package size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No parcels assigned to you at the moment.</p>
                </div>
            ) : (
                <div className="staff-grid xl:grid-cols-2">
                    {tasks.map((parcel) => (
                        <div key={parcel.parcel_id} className="staff-card hover:shadow-md transition !items-start !flex-col">
                            <div className="flex justify-between items-start w-full">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{parcel.tracking_hash}</p>
                                    <h3 className="font-bold text-slate-800 text-lg">Receiver: {parcel.receiver_name}</h3>
                                </div>
                                <span className={`status-badge ${statusColor(parcel.parcel_status)}`}>
                                    {parcel.parcel_status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-2 w-full">
                                <div className="staff-info-item">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{parcel.receiver_phone}</span>
                                </div>
                                <div className="staff-info-item">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span>{parcel.destinationLocation?.city_or_area}, {parcel.destinationLocation?.district}</span>
                                </div>
                                <div className="staff-info-item">
                                    <User size={16} className="text-slate-400" />
                                    <span className="italic">Sender: {parcel.client?.full_name || 'Anonymous'}</span>
                                </div>
                            </div>

                            <div className="w-full pt-3 border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Progress</span>
                                <ParcelTimeline
                                    currentStatus={parcel.parcel_status}
                                    trackingHistory={parcel.trackingHistory || []}
                                    assignedLabel="Assigned"
                                />
                            </div>

                            {parcel.trackingHistory && parcel.trackingHistory.length > 0 && (
                                <details className="w-full pt-3 border-t border-slate-50">
                                    <summary className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none flex items-center gap-1">
                                        <History size={12} /> Delivery History
                                    </summary>
                                    <ul className="space-y-2 mt-2">
                                        {parcel.trackingHistory.map((h, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs">
                                                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                                <div>
                                                    <p className="text-slate-700 font-medium">{h.status_message}</p>
                                                    <p className="text-slate-400">{formatDate(h.updated_at || h.createdAt)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50 w-full">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Actions</span>
                                    {parcel.parcel_status === 'Out for Delivery' ? (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openDeliverModal(parcel.parcel_id)}
                                                className="btn-submit !py-2 !text-sm flex items-center justify-center gap-2"
                                            >
                                                <Check size={16} /> Mark as Delivered
                                            </button>
                                            <button
                                                onClick={() => openAttemptModal(parcel.parcel_id)}
                                                className="btn-admin-secondary !py-2 !text-sm flex items-center justify-center gap-2"
                                            >
                                                <AlertTriangle size={16} /> Record Delivery Attempt
                                            </button>
                                        </div>
                                    ) : parcel.parcel_status === 'Delivery Attempt Failed' ? (
                                        <button
                                            onClick={() => openAttemptModal(parcel.parcel_id)}
                                            className="btn-admin-primary !py-2 !text-sm flex items-center justify-center gap-2"
                                        >
                                            <Calendar size={16} /> Reschedule Delivery
                                        </button>
                                    ) : NEXT_STATUS[parcel.parcel_status] ? (
                                        <button
                                            onClick={() => handleAdvanceStatus(parcel.parcel_id, NEXT_STATUS[parcel.parcel_status])}
                                            className="btn-admin-primary !py-2 !text-sm !justify-center"
                                        >
                                            {ADVANCE_LABEL[parcel.parcel_status] || `Mark as ${NEXT_STATUS[parcel.parcel_status]}`}
                                        </button>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">No action available</span>
                                    )}
                                </div>

                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={() => setSelectedMap(parcel.destinationLocation)}
                                        className="btn-admin-primary !flex-1 !justify-center !text-sm"
                                    >
                                        <MapPin size={16} /> Location
                                    </button>
                                    <button
                                        onClick={() => setSelectedBill(parcel)}
                                        className="btn-admin-secondary !flex-1 !justify-center !text-sm"
                                    >
                                        <FileText size={16} /> Bill
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedMap && (
                <div className="modal-overlay">
                    <div className="modal-container max-w-4xl">
                        <div className="modal-header">
                            <h3 className="font-bold text-slate-800">Delivery Location Pin</h3>
                            <button onClick={() => setSelectedMap(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
                        </div>
                        <div className="h-[500px] w-full relative">
                            {selectedMap.latitude && selectedMap.longitude ? (
                                <MapContainer center={[selectedMap.latitude, selectedMap.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                                    <Marker position={[selectedMap.latitude, selectedMap.longitude]}>
                                        <Popup>
                                            <div className="text-sm">
                                                <p className="font-bold">{selectedMap.city_or_area}</p>
                                                <p>{selectedMap.district}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 italic">
                                    Coordinates not available for this location.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer text-xs text-slate-500 text-center">
                            Target delivery address as selected by the sender.
                        </div>
                    </div>
                </div>
            )}

            {selectedBill && (
                <BillInvoice
                    parcel={selectedBill}
                    onClose={() => setSelectedBill(null)}
                />
            )}

            {deliverTarget && (
                <div className="modal-overlay">
                    <div className="modal-container max-w-sm">
                        <div className="modal-header">
                            <h3 className="font-bold text-slate-800">Confirm Delivery</h3>
                            <button onClick={() => setDeliverTarget(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
                        </div>
                        <div className="modal-body space-y-3">
                            <div className="form-group">
                                <label className="form-label mb-1">Receiver Name</label>
                                <input
                                    value={receiverName}
                                    onChange={(e) => setReceiverName(e.target.value)}
                                    placeholder="Name of person who received the parcel"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label mb-1">Delivery Remarks (optional)</label>
                                <textarea
                                    value={deliverRemarks}
                                    onChange={(e) => setDeliverRemarks(e.target.value)}
                                    placeholder="Any notes about this delivery"
                                    className="form-input"
                                    rows={3}
                                />
                            </div>
                            {deliverError && <p className="input-error">{deliverError}</p>}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setDeliverTarget(null)}
                                    className="btn-admin-secondary !flex-1 !justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelivery}
                                    disabled={deliverSubmitting}
                                    className="btn-submit !flex-1"
                                >
                                    {deliverSubmitting ? 'Confirming...' : 'Confirm Delivery'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {attemptTarget && (
                <div className="modal-overlay">
                    <div className="modal-container max-w-sm">
                        <div className="modal-header">
                            <h3 className="font-bold text-slate-800">Delivery Attempt</h3>
                            <button onClick={() => setAttemptTarget(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
                        </div>
                        <div className="modal-body space-y-3">
                            <p className="text-sm text-slate-500 -mt-1">Why couldn&apos;t the parcel be delivered?</p>
                            <div className="form-group">
                                <label className="form-label mb-1">Reason</label>
                                <select
                                    value={attemptReason}
                                    onChange={(e) => setAttemptReason(e.target.value)}
                                    className="form-input"
                                >
                                    {ATTEMPT_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label mb-1">Remarks (optional)</label>
                                <textarea
                                    value={attemptRemarks}
                                    onChange={(e) => setAttemptRemarks(e.target.value)}
                                    placeholder="Additional details"
                                    className="form-input"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label mb-1">Next Delivery Date (optional)</label>
                                <input
                                    type="date"
                                    value={attemptNextDate}
                                    onChange={(e) => setAttemptNextDate(e.target.value)}
                                    className="form-input"
                                />
                                <p className="text-xs text-slate-400 mt-1">Leave blank if you don&apos;t have a new date yet — the parcel will be marked as a failed attempt instead of rescheduled.</p>
                            </div>
                            {attemptError && <p className="input-error">{attemptError}</p>}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setAttemptTarget(null)}
                                    className="btn-admin-secondary !flex-1 !justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordAttempt}
                                    disabled={attemptSubmitting}
                                    className="btn-submit !flex-1"
                                >
                                    {attemptSubmitting ? 'Saving...' : 'Save Attempt'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedParcels;
