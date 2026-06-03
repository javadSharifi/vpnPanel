import { useState } from 'react';
import type { Customer } from '../hooks/useGist';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onQR: (customer: Customer) => void;
}

export default function CustomerCard({ customer, onEdit, onDelete, onQR }: CustomerCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customer.rawUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = customer.rawUrl;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="customer-card">
      <div className="card-header">
        <h3 className="card-title">{customer.description || 'Untitled'}</h3>
        <span className="card-slug">{customer.filename}</span>
      </div>
      <div className="card-body">
        <div className="card-url-row">
          <span className="card-url" title={customer.rawUrl}>
            {customer.rawUrl.length > 50
              ? customer.rawUrl.substring(0, 50) + '...'
              : customer.rawUrl}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <span className="card-date">Updated: {formatDate(customer.updatedAt)}</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => onQR(customer)}>QR</button>
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(customer)}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(customer)}>Delete</button>
      </div>
    </div>
  );
}
