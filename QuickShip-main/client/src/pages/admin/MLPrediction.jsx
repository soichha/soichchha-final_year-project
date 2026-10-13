import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, RefreshCw, AlertTriangle, Calculator, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/delivery-prediction';

const formatDate = (value) => {
    if (!value) return '\u2014';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '\u2014';
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
};

const formatHoursMinutes = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} minute${m === 1 ? '' : 's'}`;
    if (m === 0) return `${h} hour${h === 1 ? '' : 's'}`;
    return `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}`;
};

const getStatusMeta = (status) => {
    if (!status) return { label: 'Unavailable', dot: 'bg-slate-300' };
    if (status.trained) return { label: 'Trained', dot: 'bg-green-500' };
    if (status.sampleCount < status.minRequired) return { label: 'Insufficient data', dot: 'bg-amber-500' };
    if (status.metrics) return { label: 'Not in use', dot: 'bg-amber-500' };
    return { label: 'Not trained', dot: 'bg-slate-400' };
};

const MetricTile = ({ label, value, hint }) => (
    <div className="rounded-xl border border-slate-100 p-4">
        <p className="report-stat-label mb-1">{label}</p>
        <h3 className="report-stat-value">{value}</h3>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
        <dt className="text-slate-500">{label}</dt>
        <dd className="text-slate-800 font-medium text-right">{value}</dd>
    </div>
);

const MLPrediction = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusError, setStatusError] = useState('');

    const [training, setTraining] = useState(false);
    const [trainError, setTrainError] = useState('');
    const [showRetrainConfirm, setShowRetrainConfirm] = useState(false);
    const [retrainNotice, setRetrainNotice] = useState('');

    const [showDetails, setShowDetails] = useState(false);

    const [form, setForm] = useState({ distance: '', weight: '', deliveryType: 'Vehicle', priority: 'Standard' });
    const [prediction, setPrediction] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [predictError, setPredictError] = useState('');

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchStatus = async () => {
        setStatusError('');
        try {
            const res = await axios.get(`${API_BASE}/status`, config);
            setStatus(res.data);
        } catch (err) {
            console.error('Failed to fetch model status', err);
            setStatusError('Unable to load model status. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatus(); }, []);

    const openRetrainConfirm = () => {
        setTrainError('');
        setRetrainNotice('');
        setShowRetrainConfirm(true);
    };

    const handleTrain = async () => {
        setTraining(true);
        setTrainError('');
        try {
            const res = await axios.post(`${API_BASE}/train`, {}, config);
            setStatus(res.data);
            setShowRetrainConfirm(false);
            if (res.data.trained) {
                setRetrainNotice(`Model retrained successfully. Updated: ${formatDate(res.data.trainedAt)}`);
            }
        } catch (err) {
            setTrainError(err.response?.data?.error || 'Training failed. Please try again.');
        } finally {
            setTraining(false);
        }
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setPredictError('');
        setPrediction(null);

        const distance = Number(form.distance);
        const weight = Number(form.weight);
        if (!form.distance || !form.weight || distance <= 0 || weight <= 0) {
            setPredictError('Enter a distance and weight greater than 0.');
            return;
        }

        setPredicting(true);
        try {
            const res = await axios.post(`${API_BASE}/predict`, {
                distance, weight, deliveryType: form.deliveryType, priority: form.priority
            }, config);
            setPrediction(res.data);
        } catch (err) {
            setPredictError(err.response?.data?.error || 'Estimate failed.');
        } finally {
            setPredicting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    if (statusError) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Delivery Prediction</h1>
                    <p className="text-slate-500 text-sm mt-1">Estimate delivery time using historical delivery data.</p>
                </div>
                <div className="report-card flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm text-red-600">Model status unavailable</p>
                        <p className="text-xs text-slate-500 mt-1">{statusError}</p>
                    </div>
                </div>
            </div>
        );
    }

    const statusMeta = getStatusMeta(status);
    const isPoorPerformance = status.metrics && (status.metrics.r2 === null || status.metrics.r2 < 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={22} className="text-blue-600" /> Delivery Prediction
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Estimate delivery time using historical delivery data.</p>
                </div>
                <button onClick={openRetrainConfirm} disabled={training} className="btn-admin-primary">
                    <RefreshCw size={16} className={training ? 'animate-spin' : ''} />
                    {training ? 'Retraining...' : 'Retrain Model'}
                </button>
            </div>

            {retrainNotice && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                    <span>{retrainNotice}</span>
                    <button onClick={() => setRetrainNotice('')} aria-label="Dismiss" className="text-green-600 hover:text-green-800">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="report-card">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Model Status</p>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dot}`} />
                    <span className="font-bold text-sm text-slate-800">{statusMeta.label}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                    {status.trained
                        ? `${status.sampleCount} completed deliveries used for training. Last trained: ${formatDate(status.trainedAt)}.`
                        : status.sampleCount >= status.minRequired && status.message
                            ? status.message
                            : `Only ${status.sampleCount} completed ${status.sampleCount === 1 ? 'delivery is' : 'deliveries are'} available. At least ${status.minRequired} completed deliveries are required to train the prediction model. Predictions will use the fallback estimation method until then.`}
                </p>
            </div>

            <div className="report-card">
                <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Calculator size={16} className="text-blue-600" /> Delivery Time Estimator
                </h3>
                <p className="text-xs text-slate-500 mb-4">Estimate delivery time for a parcel.</p>

                <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Distance (km)</label>
                        <input
                            type="number" min="0.1" step="0.1" value={form.distance}
                            onChange={e => setForm({ ...form, distance: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="e.g. 12.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
                        <input
                            type="number" min="0.1" step="0.1" value={form.weight}
                            onChange={e => setForm({ ...form, weight: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="e.g. 2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Delivery Type</label>
                        <select
                            value={form.deliveryType}
                            onChange={e => setForm({ ...form, deliveryType: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="Vehicle">Vehicle</option>
                            <option value="Air">Air</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                        <select
                            value={form.priority}
                            onChange={e => setForm({ ...form, priority: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="Standard">Standard</option>
                            <option value="Express">Express</option>
                        </select>
                    </div>
                    <button type="submit" disabled={predicting} className="btn-admin-primary sm:col-span-4 justify-center">
                        {predicting ? 'Calculating...' : 'Calculate Estimate'}
                    </button>
                </form>

                {predictError && <p className="text-red-500 text-sm mt-3">{predictError}</p>}

                {prediction && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated Delivery Time</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{prediction.hours} hrs</h3>
                            <p className="text-sm text-slate-500 mt-1">Approximately {formatHoursMinutes(prediction.hours)}</p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prediction Source</p>
                            <p className={`text-sm font-bold mt-1 ${prediction.source === 'ml' ? 'text-blue-600' : 'text-slate-600'}`}>
                                {prediction.source === 'ml' ? 'Machine learning model' : 'Rule-based estimate'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="report-card">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-800">Model Performance</h3>
                    <button onClick={() => setShowDetails(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                        View Model Details
                    </button>
                </div>

                {status.metrics ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <MetricTile label="MAE (Mean Absolute Error)" value={`${status.metrics.mae} hrs`} hint="Average error across evaluated predictions." />
                            <MetricTile label="RMSE (Root Mean Squared Error)" value={`${status.metrics.rmse} hrs`} hint="Penalizes larger errors more heavily." />
                            <MetricTile
                                label={'R\u00b2 Score'}
                                value={status.metrics.r2 !== null ? status.metrics.r2 : 'Not available'}
                                hint={status.metrics.r2 !== null ? 'Share of variance in delivery time explained by the model.' : 'Undefined for this evaluation set.'}
                            />
                        </div>
                        {isPoorPerformance && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span>Current model performance is below the desired level.</span>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-slate-500 mt-3">
                        {status.trained
                            ? 'Not enough data to compute evaluation metrics yet.'
                            : `No metrics yet \u2014 retrain the model once at least ${status.minRequired} deliveries have been completed.`}
                    </p>
                )}
            </div>

            {showRetrainConfirm && (
                <div className="modal-overlay">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-slate-800">Retrain Prediction Model?</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                The model will be trained using the latest completed delivery records.
                            </p>
                            <p className="text-sm font-semibold text-slate-700 mt-3">
                                Training records available: {status.sampleCount}
                            </p>

                            {training && (
                                <p className="text-sm text-blue-600 mt-4 flex items-center gap-2">
                                    <RefreshCw size={14} className="animate-spin" /> Retraining model... Please wait.
                                </p>
                            )}
                            {trainError && <p className="text-sm text-red-500 mt-4">{trainError}</p>}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowRetrainConfirm(false)}
                                    disabled={training}
                                    className="btn-admin-secondary flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button onClick={handleTrain} disabled={training} className="btn-admin-primary flex-1 justify-center">
                                    {training ? 'Retraining...' : 'Retrain Model'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && (
                <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Model Details</h2>
                                <p className="text-sm text-slate-500 mt-1">Technical information about the prediction model.</p>
                            </div>
                            <button onClick={() => setShowDetails(false)} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-2">
                            <dl className="divide-y divide-slate-100 text-sm">
                                <DetailRow label="Algorithm" value="Random Forest Regression" />
                                <DetailRow
                                    label="Training records"
                                    value={status.trained ? status.sampleCount : `${status.sampleCount} (min. ${status.minRequired} required)`}
                                />
                                <DetailRow label="Input variables" value="Distance, Weight, Delivery Type, Priority" />
                                <DetailRow label="Validation" value={status.kFolds ? `${status.kFolds}-fold cross-validation` : 'K-fold cross-validation'} />
                                <DetailRow label="Minimum training records" value={status.minRequired} />
                                <DetailRow label="Prediction target" value="Actual delivery time" />
                            </dl>
                        </div>
                        <div className="px-6 pb-6 pt-2">
                            <p className="text-xs text-slate-400">
                                Every completed delivery becomes one training example, evaluated with k-fold
                                cross-validation so each record gets a genuine out-of-sample prediction. The model
                                used for new estimates is then retrained on the full dataset.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MLPrediction;
