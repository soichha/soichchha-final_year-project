import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

const QRScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;
        let isRunning = false;

        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 220 },
            (decodedText) => {
                if (isRunning) {
                    isRunning = false;
                    scanner.stop().catch(() => {});
                    onScan(decodedText);
                }
            },
            () => {  }
        ).then(() => { isRunning = true; })
            .catch((err) => {
                console.error('Camera start failed', err);
            });

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(() => {});
            }
        };
    }, [onScan]);

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-sm">
                <div className="modal-header">
                    <h3 className="font-bold text-slate-800">Scan Tracking QR Code</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-slate-500 mb-3">Point your camera at the QR code on the invoice or booking details.</p>
                    <div id={SCANNER_ELEMENT_ID} className="rounded-lg overflow-hidden bg-slate-900" />
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
