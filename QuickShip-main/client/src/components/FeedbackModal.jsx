import { useState } from 'react';
import axios from 'axios';
import { X, MessageSquare, Pencil } from 'lucide-react';
import StarRating from './StarRating';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const FeedbackModal = ({ parcel, existingFeedback, onClose, onSaved }) => {
    const [editing, setEditing] = useState(!existingFeedback);
    const [rating, setRating] = useState(existingFeedback?.rating || 0);
    const [title, setTitle] = useState(existingFeedback?.title || '');
    const [comment, setComment] = useState(existingFeedback?.comment || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canEdit = existingFeedback
        ? (Date.now() - new Date(existingFeedback.createdAt || existingFeedback.created_at).getTime()) <= EDIT_WINDOW_MS
        : true;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) { setError('Please select a star rating.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            let res;
            if (existingFeedback) {
                res = await axios.put(`http://localhost:5000/api/feedback/${existingFeedback.feedback_id}`, { rating, title, comment }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await axios.post('http://localhost:5000/api/feedback', { parcelId: parcel.parcel_id, rating, title, comment }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            onSaved?.(res.data.feedback);
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare size={20} /> {existingFeedback && !editing ? 'Your Feedback' : 'Give Feedback'}</h2>
                        <p className="opacity-80 text-sm mt-1">Parcel #{parcel.tracking_hash}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {existingFeedback && !editing ? (
                        <div className="space-y-4">
                            <StarRating value={existingFeedback.rating} readOnly size={24} />
                            {existingFeedback.title && <h3 className="font-bold text-slate-800 text-lg">{existingFeedback.title}</h3>}
                            {existingFeedback.comment && <p className="text-slate-600 text-sm leading-relaxed">{existingFeedback.comment}</p>}
                            <p className="text-xs text-slate-400">
                                Submitted {new Date(existingFeedback.createdAt || existingFeedback.created_at).toLocaleString()}
                            </p>

                            {canEdit ? (
                                <button onClick={() => setEditing(true)} className="btn-admin-secondary !text-sm">
                                    <Pencil size={14} /> Edit Feedback
                                </button>
                            ) : (
                                <p className="text-xs text-slate-400 italic">The 24-hour edit window for this feedback has passed.</p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Your Rating</label>
                                <StarRating value={rating} onChange={setRating} size={28} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Review Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={255}
                                    placeholder="e.g. Fast and careful delivery"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Review Comments</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    placeholder="Tell us about your delivery experience..."
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                {existingFeedback && (
                                    <button type="button" onClick={() => setEditing(false)} className="btn-admin-secondary flex-1 justify-center">
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" disabled={submitting} className="btn-admin-primary flex-1 justify-center">
                                    {submitting ? 'Submitting...' : existingFeedback ? 'Save Changes' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
