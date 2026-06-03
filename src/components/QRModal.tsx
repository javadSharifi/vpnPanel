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
  const pad = 40;
  const scale = 2;
  const qrSize = parseInt(svgEl.getAttribute('width') || '220');
  const totalSize = (qrSize + pad * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalSize, totalSize);

  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, pad * scale, pad * scale, qrSize * scale, qrSize * scale);
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
