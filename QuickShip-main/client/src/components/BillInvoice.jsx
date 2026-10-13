import { X, CheckCircle, AlertCircle } from 'lucide-react';
import TrackingQRCode from './TrackingQRCode';
import { calculateDistance } from '../utils/haversine';
import { getCostBreakdown } from '../utils/costCalculator';

const BillInvoice = ({ parcel, onClose }) => {
    if (!parcel) return null;

    let distance = 0;
    if (parcel.sourceLocation?.latitude && parcel.destinationLocation?.latitude) {
        distance = calculateDistance(
            parcel.sourceLocation.latitude, parcel.sourceLocation.longitude,
            parcel.destinationLocation.latitude, parcel.destinationLocation.longitude
        );
    }
    const codCharge = parcel.payment?.payment_method === 'COD' ? 20 : 0;
    const breakdown = getCostBreakdown(parcel.weight, distance, parcel.delivery_type, codCharge);

    return (
        <div className="modal-overlay !z-[200] print:p-0 print:bg-white flex items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center print:bg-slate-900 print:text-white flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold">INVOICE</h2>
                        <p className="opacity-70 text-xs mt-0.5">Order # {parcel.tracking_hash}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 print:hidden">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${parcel.payment?.payment_status === 'Completed' || parcel.payment?.payment_status === 'Success' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {parcel.payment?.payment_status === 'Completed' || parcel.payment?.payment_status === 'Success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <div>
                            <p className="font-bold text-sm">Payment Status: {parcel.payment?.payment_status || 'Pending'}</p>
                            <p className="text-xs">Method: {parcel.payment?.payment_method || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sender (From)</p>
                            <p className="font-bold text-slate-800 text-sm">{parcel.client?.full_name || 'N/A'}</p>
                            <p className="text-slate-600 text-xs mt-0.5">
                                {parcel.sourceLocation?.city_or_area}, {parcel.sourceLocation?.district}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receiver (To)</p>
                            <p className="font-bold text-slate-800 text-sm">{parcel.receiver_name}</p>
                            <p className="text-slate-600 text-xs mt-0.5">
                                {parcel.destinationLocation?.city_or_area}, {parcel.destinationLocation?.district}
                            </p>
                            <p className="text-slate-600 text-xs">{parcel.receiver_phone}</p>
                        </div>
                    </div>

                    <div className="admin-table-container !border-slate-100">
                        <table className="admin-table text-sm">
                            <thead className="admin-table-thead bg-slate-50">
                                <tr>
                                    <th className="admin-table-th !py-2">Description</th>
                                    <th className="admin-table-th !py-2 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr>
                                    <td className="admin-table-td !py-2">Weight</td>
                                    <td className="admin-table-td !py-2 text-right font-medium">{parcel.weight} kg</td>
                                </tr>
                                <tr>
                                    <td className="admin-table-td !py-2">Delivery Method</td>
                                    <td className="admin-table-td !py-2 text-right font-medium">{parcel.delivery_type}</td>
                                </tr>
                                <tr>
                                    <td className="admin-table-td !py-2 text-slate-500">Base Charge</td>
                                    <td className="admin-table-td !py-2 text-right text-slate-500">Rs. {breakdown.baseCharge}</td>
                                </tr>
                                <tr>
                                    <td className="admin-table-td !py-2 text-slate-500">Weight Charge</td>
                                    <td className="admin-table-td !py-2 text-right text-slate-500">Rs. {breakdown.weightCharge}</td>
                                </tr>
                                <tr>
                                    <td className="admin-table-td !py-2 text-slate-500">Distance Charge{distance > 0 ? ` (${distance.toFixed(1)} km)` : ''}</td>
                                    <td className="admin-table-td !py-2 text-right text-slate-500">Rs. {breakdown.distanceCharge}</td>
                                </tr>
                                {codCharge > 0 && (
                                    <tr>
                                        <td className="admin-table-td !py-2 text-amber-600">COD Surcharge</td>
                                        <td className="admin-table-td !py-2 text-right text-amber-600">Rs. {codCharge}</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="border-t border-slate-200">
                                <tr>
                                    <td className="py-2 px-4 font-bold text-slate-800">Total Amount</td>
                                    <td className="py-2 px-4 text-right font-bold text-blue-600">Rs. {parcel.total_cost}</td>
                                </tr>
                                <tr className="border-t border-slate-100 bg-slate-50">
                                    <td className="py-2 px-4 font-bold text-sm text-slate-700">COD Payable</td>
                                    <td className={`py-2 px-4 text-right font-bold text-sm ${parcel.payment?.payment_method === 'eSewa' || parcel.payment?.payment_status === 'Completed' || parcel.payment?.payment_status === 'Success' ? 'text-green-600' : 'text-amber-600'}`}>
                                        Rs. {parcel.payment?.payment_method === 'eSewa' || parcel.payment?.payment_status === 'Completed' || parcel.payment?.payment_status === 'Success' ? 0 : parcel.total_cost}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-center mt-5">
                        <TrackingQRCode trackingHash={parcel.tracking_hash} size={120} />
                    </div>

                    <div className="flex gap-3 print:hidden mt-4">
                        <button onClick={() => window.print()} className="btn-submit !bg-slate-800 hover:!bg-slate-700 !shadow-none !py-2 !text-sm">
                            Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillInvoice;
