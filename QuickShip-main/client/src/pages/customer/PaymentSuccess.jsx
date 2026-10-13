import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        let redirectTimer;
        const verifyPayment = async () => {
            const dataQuery = searchParams.get('data');

            if (!dataQuery) {
                console.error('Payment verification: missing data param from eSewa redirect');
                setStatus('We couldn\u2019t confirm this payment. If the amount was deducted, check My Bookings before retrying.');
                return;
            }

            try {
                let decodedData;
                try {
                    let cleanDataQuery = dataQuery.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
                    while (cleanDataQuery.length % 4 !== 0) {
                        cleanDataQuery += '=';
                    }
                    const decodedString = atob(cleanDataQuery);
                    decodedData = JSON.parse(decodedString);
                } catch(decodeErr) {
                    console.error('Payment verification: failed to decode eSewa response', decodeErr);
                    setStatus('We couldn\u2019t confirm this payment. If the amount was deducted, check My Bookings before retrying.');
                    return;
                }
                
                await axios.post('http://localhost:5000/api/payments/verify-esewa', {
                    decodedData
                });
                
                setStatus('success');
                redirectTimer = setTimeout(() => {
                    navigate('/customer/bookings');
                }, 3000);
            } catch (err) {
                console.error("Verification failed", err);
                setStatus('We couldn\u2019t confirm this payment. If the amount was deducted, check My Bookings before retrying.');
            }
        };

        verifyPayment();

        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    }, [searchParams, navigate]);

    return (
        <div className="status-page-overlay">
            <div className="status-page-card">
                {status === 'verifying' && (
                    <>
                        <Loader className="animate-spin text-blue-600" size={48} />
                        <h2 className="text-xl font-bold text-slate-700">Verifying Payment...</h2>
                        <p className="text-slate-500">Please wait while we confirm your transaction.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="status-icon-wrapper bg-green-100">
                            <CheckCircle className="text-green-600" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
                        <p className="text-slate-500">Your parcel has been booked successfully.</p>
                        <p className="text-xs text-slate-400">Redirecting to bookings...</p>
                    </>
                )}

                {status !== 'verifying' && status !== 'success' && (
                    <>
                        <div className="status-icon-wrapper bg-red-100">
                            <XCircle className="text-red-600" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-700">Payment Verification Failed</h2>
                        <p className="text-slate-500 text-sm mt-2 p-2 bg-slate-50 rounded">{status}</p>
                        <button onClick={() => navigate('/customer/book')} className="btn-admin-primary !mt-4">
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
