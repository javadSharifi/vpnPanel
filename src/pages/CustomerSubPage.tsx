import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { decodeContent } from '../utils/encoding';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

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
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  img.src = url;
}

export default function CustomerSubPage() {
  const { gistId } = useParams<{ gistId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gistId) { setError('Invalid ID'); setLoading(false); return; }
    fetch(`https://api.github.com/gists/${gistId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => {
        const f = Object.keys(data.files).find((k: string) => k.startsWith('sub_'));
        if (!f) throw new Error('No subscription file');
        setDescription(data.description || 'VPN Subscription');
        const raw = decodeContent(data.files[f].content);
        setUpdatedAt(data.updated_at);
        const first = raw.split('\n').find((l: string) => l.trim().startsWith('http'));
        setRawUrl(first ? first.trim() : '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [gistId]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(rawUrl); } catch { const ta = document.createElement('textarea'); ta.value = rawUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <div className="text-center text-muted-foreground"><span className="spinner" /><p className="mt-3">Loading subscription...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <Card className="w-full max-w-sm text-center"><CardContent className="pt-6"><p className="text-destructive">{error}</p></CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <Card className="w-full max-w-md neon-glow">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Your VPN Subscription</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          {rawUrl ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 text-left">
                <span className="text-xs font-mono text-muted-foreground break-all flex-1">{rawUrl}</span>
                <Button variant="default" size="sm" className="shrink-0" onClick={handleCopy}>{copied ? 'Copied ✓' : 'Copy'}</Button>
              </div>
              <div ref={wrapperRef} className="flex justify-center"><QRCodeSVG value={rawUrl} size={220} /></div>
              <Button variant="secondary" size="sm" onClick={() => { const el = wrapperRef.current?.querySelector('svg') as SVGSVGElement | null; downloadSvgAsPng(el, 'vpn-subscription-qr.png'); }}>Download QR</Button>
            </>
          ) : <p className="text-muted-foreground">No subscription URL found.</p>}

          <div className="text-left p-4 rounded-lg border border-border bg-muted/30 space-y-2">
            <h3 className="text-sm font-semibold">How to use</h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the link above</li>
              <li>Open your VPN app (V2rayNG, NekoBox, Streisand)</li>
              <li>Go to Subscriptions → Add → Paste link → Update</li>
            </ol>
          </div>

          {updatedAt && <p className="text-xs text-muted-foreground">Last updated: {new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}

          <p className="text-xs text-muted-foreground border-t border-border pt-4">Powered by VPN Panel</p>
        </CardContent>
      </Card>
    </div>
  );
}
