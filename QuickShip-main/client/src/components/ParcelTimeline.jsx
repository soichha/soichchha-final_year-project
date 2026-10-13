import { Check } from 'lucide-react';

const buildSteps = (assignedLabel) => [
    { key: 'Booked', label: 'Booked' },
    { key: 'Assigned', label: assignedLabel },
    { key: 'Picked Up', label: 'Picked Up' },
    { key: 'In Transit', label: 'In Transit' },
    { key: 'Out for Delivery', label: 'Out For Delivery' },
    { key: 'Delivered', label: 'Delivered' }
];

const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toLocaleString();
};

const ParcelTimeline = ({ currentStatus, trackingHistory = [], assignedLabel = 'Confirmed' }) => {
    const STEPS = buildSteps(assignedLabel);

    if (currentStatus === 'Cancelled') {
        return <p className="text-sm text-red-500 font-medium">This parcel was cancelled.</p>;
    }

    const effectiveStatus = (currentStatus === 'Delivery Attempt Failed' || currentStatus === 'Rescheduled')
        ? 'Out for Delivery'
        : currentStatus;

    const currentIndex = STEPS.findIndex((s) => s.key === effectiveStatus);

    const findTimestamp = (stepKey) => {
        const entry = trackingHistory.find((h) =>
            h.status_message?.toLowerCase().includes(stepKey.toLowerCase()) ||
            (stepKey === 'Booked' && h.status_message?.toLowerCase().includes('booked'))
        );
        return entry ? formatDate(entry.updated_at || entry.createdAt) : null;
    };

    return (
        <div className="flex items-start w-full overflow-x-auto py-2">
            {STEPS.map((step, idx) => {
                const isDone = idx < currentIndex || (idx === currentIndex);
                const isCurrent = idx === currentIndex;
                const timestamp = findTimestamp(step.key);

                return (
                    <div key={step.key} className="flex items-center flex-1 min-w-[90px] last:flex-none">
                        <div className="flex flex-col items-center text-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                                ${isDone ? (isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-blue-600 text-white') : 'bg-slate-200 text-slate-400'}`}>
                                {isDone && !isCurrent ? <Check size={14} /> : <span className="text-[11px] font-bold">{idx + 1}</span>}
                            </div>
                            <span className={`text-[11px] font-medium whitespace-nowrap ${isDone ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                            {timestamp && <span className="text-[9px] text-slate-400">{timestamp}</span>}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 ${idx < currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ParcelTimeline;
