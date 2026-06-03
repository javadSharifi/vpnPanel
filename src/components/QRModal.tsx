import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  url: string;
  customerName: string;
  onClose: () => void;
}

function downloadSvgAsPng(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, 440, 440);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.src = url;
}

export default function QRModal({ url, customerName, onClose }: QRModalProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>{customerName}</h3>
        <div className="qr-wrapper">
          <QRCodeSVG ref={svgRef} value={url} size={220} />
        </div>
        <p className="qr-url">{url}</p>
        <button
          className="btn btn-sm btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => downloadSvgAsPng(svgRef.current, `qrcode-${customerName}.png`)}
        >
          Download QR
        </button>
      </div>
    </div>
  );
}
