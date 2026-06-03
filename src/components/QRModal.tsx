import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svgEl = wrapperRef.current?.querySelector('svg') as SVGSVGElement | null;
    downloadSvgAsPng(svgEl, `qrcode-${customerName}.png`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="rounded-xl border border-border bg-card p-8 max-w-sm w-full text-center relative neon-glow"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-4 text-muted-foreground hover:text-foreground text-2xl leading-none bg-transparent border-none cursor-pointer"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-5">{customerName}</h3>
        <div className="flex justify-center mb-4" ref={wrapperRef}>
          <QRCodeSVG value={url} size={220} />
        </div>
        <p className="text-xs text-muted-foreground break-all mb-4">{url}</p>
        <Button variant="default" size="sm" onClick={handleDownload}>
          Download QR
        </Button>
      </div>
    </div>
  );
}
