import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const TrackingQRCode = ({ trackingHash, size = 140 }) => {
    const [dataUrl, setDataUrl] = useState(null);

    useEffect(() => {
        if (!trackingHash) return;
        QRCode.toDataURL(trackingHash, { width: size, margin: 1 })
            .then(setDataUrl)
            .catch((err) => console.error('QR generation failed', err));
    }, [trackingHash, size]);

    if (!dataUrl) return null;

    return (
        <div className="flex flex-col items-center gap-1">
            <img src={dataUrl} alt={`QR code for ${trackingHash}`} width={size} height={size} className="rounded-lg border border-slate-200 p-1 bg-white" />
            <span className="text-[10px] text-slate-400 font-mono">{trackingHash}</span>
        </div>
    );
};

export default TrackingQRCode;
