import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';

const summarizeSources = (rows) => {
    const ml = rows.filter(r => r.prediction_source === 'ml').length;
    return { ml, ruleBased: rows.length - ml };
};

const formatDate = (value) => {
    if (!value) return '\u2014';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '\u2014';
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
};

const DeliveryAccuracyReport = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/delivery-prediction/accuracy-report', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setReport(res.data);
            } catch (err) {
                console.error('Failed to fetch accuracy report', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const exportCsv = () => {
        if (!report?.rows?.length) return;
        const header = ['Tracking ID', 'Customer', 'Delivered', 'Predicted (hrs)', 'Actual (hrs)', 'Difference (hrs)', 'Prediction Source'];
        const lines = report.rows.map(r => [r.tracking_hash, r.client_name, formatDate(r.delivered_at), r.predicted_hours, r.actual_hours, r.difference, r.prediction_source]);
        const csv = [header, ...lines].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'delivery_accuracy_report.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading accuracy report...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Delivery Accuracy Report</h1>
                    <p className="text-slate-500 text-sm mt-1">Comparison of estimated and actual delivery times for completed deliveries.</p>
                </div>
                {report?.rows?.length > 0 && (
                    <button onClick={exportCsv} className="btn-admin-secondary">
                        <Download size={16} /> Export CSV
                    </button>
                )}
            </div>

            {(!report || report.rows.length === 0) ? (
                <div className="report-card text-center text-slate-500 text-sm py-10">
                    No delivered parcels with a recorded prediction yet. This report fills in as parcels get delivered.
                </div>
            ) : (
                <>
                    {report.summary && (
                        <div className="admin-grid xl:grid-cols-3">
                            <div className="report-card">
                                <p className="report-stat-label mb-1">Parcels Compared</p>
                                <h3 className="report-stat-value">{report.summary.count}</h3>
                            </div>
                            <div className="report-card">
                                <p className="report-stat-label mb-1">Avg. Absolute Error (MAE)</p>
                                <h3 className="report-stat-value">{report.summary.mae} hrs</h3>
                            </div>
                            <div className="report-card">
                                <p className="report-stat-label mb-1">RMSE</p>
                                <h3 className="report-stat-value">{report.summary.rmse} hrs</h3>
                            </div>
                        </div>
                    )}

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead className="admin-table-thead">
                                <tr>
                                    <th className="admin-table-th">Tracking No.</th>
                                    <th className="admin-table-th">Customer</th>
                                    <th className="admin-table-th">Delivered</th>
                                    <th className="admin-table-th">Estimated</th>
                                    <th className="admin-table-th">Actual</th>
                                    <th className="admin-table-th">Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.rows.map((r) => {
                                    const overUnder = r.difference > 0.5 ? 'over' : r.difference < -0.5 ? 'under' : 'onTime';
                                    return (
                                        <tr key={r.parcel_id}>
                                            <td className="admin-table-td font-mono text-xs">{r.tracking_hash}</td>
                                            <td className="admin-table-td">{r.client_name}</td>
                                            <td className="admin-table-td text-slate-500">{formatDate(r.delivered_at)}</td>
                                            <td className="admin-table-td">{r.predicted_hours} hrs</td>
                                            <td className="admin-table-td">{r.actual_hours} hrs</td>
                                            <td className="admin-table-td">
                                                <span className={`inline-flex items-center gap-1 font-medium ${overUnder === 'over' ? 'text-red-500' : overUnder === 'under' ? 'text-green-600' : 'text-slate-500'}`}>
                                                    {overUnder === 'over' && <TrendingUp size={14} />}
                                                    {overUnder === 'under' && <TrendingDown size={14} />}
                                                    {overUnder === 'onTime' && <Minus size={14} />}
                                                    {r.difference > 0 ? '+' : ''}{r.difference} hrs
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <details className="report-card">
                        <summary className="text-sm font-bold text-slate-800 cursor-pointer select-none">Technical Details</summary>
                        <div className="mt-3 text-sm text-slate-600 space-y-1">
                            <p>Estimates come from the delivery prediction service: a Random Forest Regression model when trained, with a rule-based fallback otherwise.</p>
                            <p>
                                Of the {report.rows.length} parcels compared: {summarizeSources(report.rows).ml} used the Random Forest model,
                                {' '}{summarizeSources(report.rows).ruleBased} used the rule-based fallback.
                            </p>
                        </div>
                    </details>
                </>
            )}
        </div>
    );
};

export default DeliveryAccuracyReport;
