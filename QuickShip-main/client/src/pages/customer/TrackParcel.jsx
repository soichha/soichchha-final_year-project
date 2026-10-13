import { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, Clock, CalendarDays, ScanLine } from 'lucide-react';
import QRScanner from '../../components/QRScanner';
import ParcelTimeline from '../../components/ParcelTimeline';

const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
};

const statusColor = (status) => {
    switch (status) {
        case 'Delivered':               return 'bg-green-100 text-green-700';
        case 'In Transit':              return 'bg-blue-100 text-blue-700';
        case 'Assigned':                return 'bg-yellow-100 text-yellow-700';
        case 'Booked':                  return 'bg-purple-100 text-purple-700';
        case 'Delivery Attempt Failed': return 'bg-red-100 text-red-700';
        case 'Rescheduled':             return 'bg-orange-100 text-orange-700';
        default:                        return 'bg-slate-100 text-slate-600';
    }
};

const TrackParcel = () => {
    const [searchId, setSearchId] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const trackValue = async (value) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        setError('');
        setResults([]);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:5000/api/parcels/track/${encodeURIComponent(trimmed)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = Array.isArray(res.data) ? res.data : [res.data];
            setResults(data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('No parcels found matching that tracking ID.');
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                setError('You must be logged in to track a parcel.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = () => trackValue(searchId);

    const handleScanSuccess = (decodedText) => {
        setShowScanner(false);
        setSearchId(decodedText);
        trackValue(decodedText);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleTrack();
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-center text-slate-800">Track Your Parcel</h1>

            <div className="flex gap-2">
                <input
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter Tracking ID (e.g. TRK-123 or partial 'TRK')"
                    className="form-input !py-3"
                />
                <button
                    onClick={handleTrack}
                    disabled={loading}
                    className="btn-admin-primary flex items-center gap-2"
                >
                    <Search size={16} />
                    {loading ? 'Searching…' : 'Track'}
                </button>
                <button
                    onClick={() => setShowScanner(true)}
                    className="btn-admin-secondary flex items-center gap-2"
                    title="Scan QR Code"
                >
                    <ScanLine size={16} />
                </button>
            </div>

            {showScanner && (
                <QRScanner onScan={handleScanSuccess} onClose={() => setShowScanner(false)} />
            )}

            {error && <div className="input-error text-center">{error}</div>}

            {results.length > 1 && (
                <p className="text-sm text-slate-500 text-center">
                    Found <span className="font-semibold text-slate-700">{results.length}</span> parcels matching your search.
                </p>
            )}

            {results.map((result) => (
                <div key={result.parcel_id} className="customer-card">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b">
                        <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Tracking ID</p>
                            <h2 className="text-lg font-bold text-blue-600 font-mono">{result.tracking_hash}</h2>
                            <p className="text-slate-400 text-xs mt-1">
                                Booked: {formatDate(result.booking_date || result.createdAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`status-badge !inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColor(result.parcel_status)}`}>
                                {result.parcel_status}
                            </span>
                            <div className="mt-2 space-y-1">
                                <p className="text-slate-400 text-xs text-right">
                                    Last Update: {formatDate(result.updatedAt)}
                                </p>
                                {result.parcel_status !== 'Delivered' && result.estimated_arrival && (
                                    <p className="text-blue-600 text-xs font-bold flex items-center justify-end gap-1">
                                        <CalendarDays size={12} />
                                        Estimated Delivery: {result.estimated_arrival}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5 text-sm">
                        <div>
                            <p className="text-slate-400 text-xs">Sender</p>
                            <p className="font-medium text-slate-700">{result.client?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">Receiver</p>
                            <p className="font-medium text-slate-700">{result.receiver_name}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">From</p>
                            <p className="font-medium text-slate-700 flex items-center gap-1">
                                <MapPin size={13} className="text-blue-400" />
                                {result.sourceLocation?.city_or_area}, {result.sourceLocation?.district}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">To</p>
                            <p className="font-medium text-slate-700 flex items-center gap-1">
                                <MapPin size={13} className="text-red-400" />
                                {result.destinationLocation?.city_or_area}, {result.destinationLocation?.district}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">Service</p>
                            <p className="font-medium text-slate-700">{result.delivery_type}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">Weight</p>
                            <p className="font-medium text-slate-700">{result.weight} kg</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <ParcelTimeline currentStatus={result.parcel_status} trackingHistory={result.trackingHistory || []} />
                    </div>

                    {result.trackingHistory && result.trackingHistory.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-1">
                                <Clock size={12} /> Tracking History
                            </p>
                            <ul className="space-y-3">
                                {result.trackingHistory.map((h, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm">
                                        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className="text-slate-700 font-medium">{h.status_message}</p>
                                            {h.currentLocation && (
                                                <p className="text-slate-400 text-xs">
                                                    {h.currentLocation.city_or_area}, {h.currentLocation.district}
                                                </p>
                                            )}
                                            <p className="text-slate-400 text-xs">
                                                {formatDate(h.updated_at || h.createdAt)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TrackParcel;
