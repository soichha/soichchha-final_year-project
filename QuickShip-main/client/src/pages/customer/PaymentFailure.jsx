import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { XCircle } from 'lucide-react';

const PaymentFailure = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const dataQuery = searchParams.get('data');
        if (!dataQuery) return;

        try {
            let cleanDataQuery = dataQuery.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
            while (cleanDataQuery.length % 4 !== 0) cleanDataQuery += '=';
            const decoded = JSON.parse(atob(cleanDataQuery));
            if (decoded.transaction_uuid) {
                axios.post('http://localhost:5000/api/payments/mark-failed', {
                    transactionUuid: decoded.transaction_uuid
                }).catch(() => {
                });
            }
        } catch (err) {
            return;
        }
    }, [searchParams]);

    return (
        <div className="status-page-overlay">
            <div className="status-page-card">
                <div className="status-icon-wrapper bg-red-100">
                    <XCircle className="text-red-600" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
                <p className="text-slate-500">The transaction was cancelled or failed.</p>
                <button onClick={() => navigate('/customer/book')} className="btn-admin-primary !mt-4">
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default PaymentFailure;
