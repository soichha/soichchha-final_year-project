import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Phone, CheckCircle, Calendar, ExternalLink } from 'lucide-react';

const DeliveryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId || !token) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/parcels/staff/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const completed = res.data.filter(t => t.parcel_status === 'Delivered');
            setHistory(completed);
            setLoading(false);
        } catch (err) {
            console.error("History fetch failed");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Delivery History</h1>

            {history.length === 0 ? (
                <div className="staff-empty-state">
                    <CheckCircle size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No parcels have been delivered yet.</p>
                </div>
            ) : (
                <div className="staff-grid xl:grid-cols-2">
                    {history.map((parcel) => (
                        <div key={parcel.parcel_id} className="staff-card !items-start !flex-col">
                            <div className="flex justify-between items-start w-full">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{parcel.tracking_hash}</p>
                                    <h3 className="font-bold text-slate-800 text-lg">Receiver: {parcel.receiver_name}</h3>
                                </div>
                                <span className="status-badge status-delivered">
                                    <CheckCircle size={14} /> Delivered
                                </span>
                            </div>

                            <div className="space-y-2 w-full">
                                <div className="staff-info-item">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{parcel.receiver_phone}</span>
                                </div>
                                <div className="staff-info-item">
                                    <MapPin size={16} className="text-slate-400" />
                                    <div className="flex flex-col text-sm">
                                        <span>{parcel.destinationLocation?.city_or_area}, {parcel.destinationLocation?.district}</span>
                                        {parcel.destinationLocation?.latitude && parcel.destinationLocation?.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${parcel.destinationLocation.latitude},${parcel.destinationLocation.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 text-xs hover:underline flex items-center gap-1 mt-1"
                                            >
                                                View on Map <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="staff-info-item">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span>Booked: {new Date(parcel.booking_date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 w-full">
                                <span>Weight: {parcel.weight} kg</span>
                                <span className="font-bold text-slate-300 uppercase">COMPLETED</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryHistory;
