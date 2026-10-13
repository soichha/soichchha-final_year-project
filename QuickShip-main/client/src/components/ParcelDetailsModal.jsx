import { X, MapPin, Package, Calendar, Clock } from 'lucide-react';
import TrackingQRCode from './TrackingQRCode';
import ParcelTimeline from './ParcelTimeline';

const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
};

const ParcelDetailsModal = ({ parcel, onClose }) => {
    if (!parcel) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-2xl">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Parcel Details</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{parcel.tracking_hash}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>

                <div className="modal-body space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2 font-bold">Delivery Timeline</p>
                        <ParcelTimeline currentStatus={parcel.parcel_status} trackingHistory={parcel.trackingHistory || []} />
                    </div>

                    {parcel.predicted_delivery_hours && (
                        <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500 flex-shrink-0" />
                            <p className="text-sm text-indigo-700">
                                <span className="font-bold">Estimated Delivery Time: ~{parcel.predicted_delivery_hours} hours</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <Package size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-xs">Receiver</p>
                                    <p className="font-medium text-slate-700">{parcel.receiver_name} ({parcel.receiver_phone})</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-xs">From</p>
                                    <p className="font-medium text-slate-700">{parcel.sourceLocation?.city_or_area}, {parcel.sourceLocation?.district}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-red-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-xs">To</p>
                                    <p className="font-medium text-slate-700">{parcel.destinationLocation?.city_or_area}, {parcel.destinationLocation?.district}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-xs">Booked On</p>
                                    <p className="font-medium text-slate-700">{formatDate(parcel.booking_date || parcel.createdAt)}</p>
                                </div>
                            </div>
                            {parcel.delivery?.staff && (
                                <div>
                                    <p className="text-slate-400 text-xs">Delivery Staff</p>
                                    <p className="font-medium text-slate-700">{parcel.delivery.staff.full_name}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <TrackingQRCode trackingHash={parcel.tracking_hash} size={140} />
                            <p className="text-xs text-slate-400 mt-2 text-center">Scan this code on the Track Parcel page to pull up this parcel instantly.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParcelDetailsModal;
