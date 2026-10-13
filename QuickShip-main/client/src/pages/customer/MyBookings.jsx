import { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Calendar, FileText, User, Phone, Edit2, Trash2, AlertCircle, Star, MessageSquarePlus, QrCode } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import BillInvoice from '../../components/BillInvoice';
import ParcelDetailsModal from '../../components/ParcelDetailsModal';
import FeedbackModal from '../../components/FeedbackModal';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailsTarget, setDetailsTarget] = useState(null);

    const [feedbackByParcel, setFeedbackByParcel] = useState({});
    const [feedbackTarget, setFeedbackTarget] = useState(null);

    const fetchMyFeedback = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/feedback/mine', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const map = {};
            res.data.forEach(f => { map[f.parcel_id] = f; });
            setFeedbackByParcel(map);
        } catch (err) {
            console.error('Failed to fetch feedback', err);
        }
    };

    const fetchBookings = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/parcels/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this booking?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/parcels/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Booking deleted successfully!");
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete booking");
        }
    };

    const handleEdit = (booking) => {
        navigate('/customer/book', { state: { editData: booking } });
    };

    useEffect(() => {
        fetchBookings();
        fetchMyFeedback();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your history...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>

            {bookings.length === 0 ? (
                <div className="booking-empty-state">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">You haven&apos;t booked any parcels yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((item) => (
                        <div key={item.parcel_id} className="booking-card">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="booking-id">#{item.tracking_hash}</span>
                                    <span className={`status-badge
                                        ${item.parcel_status === 'Delivered' ? 'status-delivered' :
                                            item.parcel_status === 'Pending' ? 'status-pending' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.parcel_status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="booking-info-label text-blue-600/70">From (Sender):</span> {item.client?.full_name || 'You'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="booking-info-label">To (Receiver):</span> {item.receiver_name} ({item.receiver_phone})
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="booking-info-label">Amount:</span> Rs. {item.total_cost || 0}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar size={12} /> {new Date(item.booking_date || item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {item.delivery?.staff && (
                                    <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> Assigned Delivery Staff
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <User size={14} className="text-blue-500" />
                                                <span className="font-medium">{item.delivery.staff.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone size={14} className="text-blue-500" />
                                                <span>{item.delivery.staff.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                {['Booked', 'Assigned', 'Pending'].includes(item.parcel_status) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="btn-admin-secondary !text-blue-600 hover:!bg-blue-50 !border-blue-100 !text-sm !py-2 justify-center flex-1 md:flex-none">
                                            <Edit2 size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.parcel_id)}
                                            className="btn-admin-secondary !text-red-500 hover:!bg-red-50 !border-red-100 !text-sm !py-2 justify-center flex-1 md:flex-none" title="Cancel Booking">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setDetailsTarget(item)}
                                    className="btn-admin-secondary !text-sm !py-2 justify-center flex-1 md:flex-none">
                                    <QrCode size={16} /> Details
                                </button>
                                <button
                                    onClick={() => setSelectedBooking(item)}
                                    className="btn-admin-secondary !text-sm !py-2 justify-center flex-1 md:flex-none">
                                    <FileText size={16} /> View Bill
                                </button>

                                {item.parcel_status === 'Delivered' && (
                                    <button
                                        onClick={() => setFeedbackTarget(item)}
                                        className="btn-admin-secondary !text-sm !py-2 justify-center flex-1 md:flex-none !text-amber-600 hover:!bg-amber-50 !border-amber-100">
                                        {feedbackByParcel[item.parcel_id] ? (
                                            <><Star size={16} /> View Feedback</>
                                        ) : (
                                            <><MessageSquarePlus size={16} /> Give Feedback</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedBooking && (
                <BillInvoice
                    parcel={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            {detailsTarget && (
                <ParcelDetailsModal
                    parcel={detailsTarget}
                    onClose={() => setDetailsTarget(null)}
                />
            )}

            {feedbackTarget && (
                <FeedbackModal
                    parcel={feedbackTarget}
                    existingFeedback={feedbackByParcel[feedbackTarget.parcel_id] || null}
                    onClose={() => setFeedbackTarget(null)}
                    onSaved={(feedback) => {
                        setFeedbackByParcel(prev => ({ ...prev, [feedbackTarget.parcel_id]: feedback }));
                    }}
                />
            )}
        </div>
    );
};

export default MyBookings;
