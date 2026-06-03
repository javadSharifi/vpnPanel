import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { decodeContent } from '../utils/encoding';

export default function CustomerSubPage() {
  const { gistId } = useParams<{ gistId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!gistId) {
      setError('Invalid subscription ID');
      setLoading(false);
      return;
    }

    const fetchGist = async () => {
      try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!res.ok) throw new Error('Gist not found');
        const data = await res.json();

        const subFile = Object.keys(data.files).find((f: string) => f.startsWith('sub_'));
        if (!subFile) throw new Error('No subscription file found');

        setDescription(data.description || 'VPN Subscription');

        const content = data.files[subFile].content as string;
        const rawContent = decodeContent(content);

        setUpdatedAt(data.updated_at);

        const firstLine = rawContent.split('\n').find((l: string) => l.trim().startsWith('http'));
        if (firstLine) {
          setRawUrl(firstLine.trim());
        } else {
          setRawUrl('');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [gistId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = rawUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="sub-page">
        <div className="sub-card">
          <div className="sub-loading">
            <span className="spinner" />
            <p>Loading subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sub-page">
        <div className="sub-card">
          <h1>Your VPN Subscription</h1>
          <p className="sub-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sub-page">
      <div className="sub-card">
        <h1>Your VPN Subscription</h1>
        <p className="sub-description">{description}</p>

        {rawUrl ? (
          <>
            <div className="sub-url-box">
              <span className="sub-url-text">{rawUrl}</span>
              <button className="btn btn-sm btn-primary" onClick={handleCopy}>
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>

            <div className="sub-qr">
              <QRCodeSVG value={rawUrl} size={220} />
            </div>
          </>
        ) : (
          <p className="sub-no-url">No subscription URL found in this config.</p>
        )}

        <div className="sub-instructions">
          <h3>How to use</h3>
          <ol>
            <li>Copy the link above</li>
            <li>Open your VPN app (V2rayNG, NekoBox, Streisand)</li>
            <li>Go to Subscriptions → Add → Paste link → Update</li>
          </ol>
        </div>

        {updatedAt && (
          <p className="sub-updated">Last updated: {formatDate(updatedAt)}</p>
        )}

        <p className="sub-footer">Powered by VPN Panel</p>
      </div>
    </div>
  );
}
