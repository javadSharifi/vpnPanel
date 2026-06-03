import { useState, useEffect, useCallback } from 'react';
import { useGist, type Customer } from '../hooks/useGist';
import { useToast } from '../hooks/useToast';
import { slugify, isValidSlug } from '../utils/slugify';
import { encodeContent, detectEncoding } from '../utils/encoding';
import { convertWireguardToLink } from '../utils/wireguard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface CustomerDrawerProps {
  open: boolean;
  editGist: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerDrawer({ open, editGist, onClose, onSaved }: CustomerDrawerProps) {
  const { createGist, updateGist, getGistContent } = useGist();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [base64, setBase64] = useState(true);
  const [v2rayConfigs, setV2rayConfigs] = useState<string[]>(['']);
  const [wireguardConfigs, setWireguardConfigs] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const isEditing = Boolean(editGist);

  const resetForm = useCallback(() => {
    setDisplayName('');
    setSlug('');
    setBase64(true);
    setV2rayConfigs(['']);
    setWireguardConfigs(['']);
    setSaving(false);
    setLoadingContent(false);
  }, []);

  useEffect(() => {
    if (!open) { resetForm(); return; }
    if (editGist) {
      setDisplayName(editGist.description || '');
      setSlug(editGist.customerSlug);
      setLoadingContent(true);
      getGistContent(editGist.id, editGist.filename)
        .then(content => {
          const { isBase64, content: decoded } = detectEncoding(content);
          setBase64(isBase64);
          const lines = decoded.split('\n').filter(l => l.trim());
          const v2ray: string[] = [];
          const wg: string[] = [];
          lines.forEach(line => {
            const t = line.trim();
            if (t.startsWith('wireguard://')) wg.push(t);
            else if (t) v2ray.push(t);
          });
          setV2rayConfigs(v2ray.length > 0 ? v2ray : ['']);
          setWireguardConfigs(wg.length > 0 ? wg : ['']);
        })
        .catch(() => addToast('Failed to load gist content', 'error'))
        .finally(() => setLoadingContent(false));
    } else {
      setDisplayName(''); setSlug(''); setBase64(true);
      setV2rayConfigs(['']); setWireguardConfigs(['']);
    }
  }, [open, editGist, getGistContent, addToast, resetForm]);

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!isEditing) setSlug(slugify(value));
  };

  const addV2rayRow = () => setV2rayConfigs(p => [...p, '']);
  const removeV2rayRow = (i: number) => setV2rayConfigs(p => p.filter((_, idx) => idx !== i).length ? p.filter((_, idx) => idx !== i) : ['']);
  const updateV2rayRow = (i: number, v: string) => setV2rayConfigs(p => { const n = [...p]; n[i] = v; return n; });
  const addWgRow = () => setWireguardConfigs(p => [...p, '']);
  const removeWgRow = (i: number) => setWireguardConfigs(p => p.filter((_, idx) => idx !== i).length ? p.filter((_, idx) => idx !== i) : ['']);
  const updateWgRow = (i: number, v: string) => setWireguardConfigs(p => { const n = [...p]; n[i] = v; return n; });

  const handleSave = async () => {
    if (!isValidSlug(slug)) { addToast('Invalid slug.', 'error'); return; }
    setSaving(true);
    try {
      const v2rayLines = v2rayConfigs.filter(l => l.trim());
      const wgLines = wireguardConfigs.filter(w => w.trim()).map((w, i) =>
        w.includes('[Interface]') ? convertWireguardToLink(w, `WG-${slug}-${i + 1}`) : w.trim()
      );
      const rawJoined = [...v2rayLines, ...wgLines].join('\n');
      const encodedContent = base64 ? encodeContent(rawJoined, true) : rawJoined;
      const filename = `sub_${slug}.txt`;

      if (isEditing) {
        await updateGist(editGist!.id, displayName, editGist!.customerSlug, slug, encodedContent);
        addToast('Customer updated successfully', 'success');
      } else {
        await createGist(displayName, filename, encodedContent);
        addToast('Customer created successfully', 'success');
      }
      onSaved(); onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="drawer-overlay">
      <div className="drawer">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{isEditing ? 'Edit Customer' : 'New Customer'}</h2>
          <button className="text-muted-foreground hover:text-foreground text-2xl leading-none bg-transparent border-none cursor-pointer" onClick={onClose}>×</button>
        </div>

        {loadingContent ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="spinner" />
            <p>Loading customer data...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Customer Display Name</label>
              <Input placeholder="Ali Rezaei" value={displayName} onChange={e => handleDisplayNameChange(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Slug (used in filename &amp; URL)</label>
              <Input placeholder="ali_rezaei" value={slug} onChange={e => setSlug(e.target.value)} readOnly={isEditing} className={isEditing ? 'opacity-60 cursor-not-allowed' : ''} />
              {!isValidSlug(slug) && slug.length > 0 && <p className="text-xs text-destructive">Only letters, numbers, underscores allowed</p>}
            </div>

            <label className="flex items-center gap-3 cursor-pointer text-sm">
              <input type="checkbox" checked={base64} onChange={e => setBase64(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-muted-foreground">Encode as Base64</span>
            </label>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">V2Ray / VLESS / Trojan / Shadowsocks Configs</label>
              {v2rayConfigs.map((cfg, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="vless://..." value={cfg} onChange={e => updateV2rayRow(i, e.target.value)} />
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => removeV2rayRow(i)}>×</Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addV2rayRow}>+ Add Config</Button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">WireGuard Configs</label>
              {wireguardConfigs.map((cfg, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Textarea rows={6} placeholder="[Interface]\nPrivateKey = ..." value={cfg} onChange={e => updateWgRow(i, e.target.value)} />
                  <Button variant="ghost" size="sm" className="shrink-0 mt-1" onClick={() => removeWgRow(i)}>×</Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addWgRow}>+ Add WireGuard</Button>
            </div>
          </div>
        )}

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="default" className="flex-1" onClick={handleSave} disabled={saving || loadingContent}>
            {saving ? <span className="spinner" /> : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
