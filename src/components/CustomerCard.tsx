import { useState } from 'react';
import type { Customer } from '../hooks/useGist';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
    <Card className="hover:border-ring/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-base">{customer.description || 'Untitled'}</h3>
            <Badge variant="outline" className="mt-1 font-mono text-xs">{customer.filename}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 mb-1">
          <span className="text-xs text-muted-foreground font-mono truncate flex-1" title={customer.rawUrl}>
            {customer.rawUrl.length > 50 ? customer.rawUrl.substring(0, 50) + '...' : customer.rawUrl}
          </span>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">Updated: {formatDate(customer.updatedAt)}</p>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onQR(customer)}>QR</Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(customer)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
