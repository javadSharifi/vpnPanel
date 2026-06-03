import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  url: string;
  customerName: string;
  onClose: () => void;
}

export default function QRModal({ url, customerName, onClose }: QRModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>{customerName}</h3>
        <div className="qr-wrapper">
          <QRCodeSVG value={url} size={220} />
        </div>
        <p className="qr-url">{url}</p>
      </div>
    </div>
  );
}
