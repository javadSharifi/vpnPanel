import { useState, useEffect, useCallback } from 'react';
import { useGist, Customer } from '../hooks/useGist';
import { useToast } from '../hooks/useToast';
import { slugify, isValidSlug } from '../utils/slugify';
import { encodeContent, detectEncoding } from '../utils/encoding';
import { convertWireguardToLink } from '../utils/wireguard';

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
    if (!open) {
      resetForm();
      return;
    }

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
            const trimmed = line.trim();
            if (trimmed.startsWith('wireguard://')) {
              wg.push(trimmed);
            } else if (trimmed) {
              v2ray.push(trimmed);
            }
          });

          setV2rayConfigs(v2ray.length > 0 ? v2ray : ['']);
          setWireguardConfigs(wg.length > 0 ? wg : ['']);
        })
        .catch(() => {
          addToast('Failed to load gist content', 'error');
        })
        .finally(() => {
          setLoadingContent(false);
        });
    } else {
      setDisplayName('');
      setSlug('');
      setBase64(true);
      setV2rayConfigs(['']);
      setWireguardConfigs(['']);
    }
  }, [open, editGist, getGistContent, addToast, resetForm]);

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!isEditing) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
  };

  const addV2rayRow = () => {
    setV2rayConfigs(prev => [...prev, '']);
  };

  const removeV2rayRow = (index: number) => {
    setV2rayConfigs(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [''] : next;
    });
  };

  const updateV2rayRow = (index: number, value: string) => {
    setV2rayConfigs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addWireguardRow = () => {
    setWireguardConfigs(prev => [...prev, '']);
  };

  const removeWireguardRow = (index: number) => {
    setWireguardConfigs(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [''] : next;
    });
  };

  const updateWireguardRow = (index: number, value: string) => {
    setWireguardConfigs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!isValidSlug(slug)) {
      addToast('Invalid slug. Only letters, numbers, underscores allowed.', 'error');
      return;
    }

    setSaving(true);

    try {
      const v2rayLines = v2rayConfigs.filter(l => l.trim());

      const wgLines = wireguardConfigs
        .filter(w => w.trim())
        .map((w, i) => {
          if (w.includes('[Interface]')) {
            return convertWireguardToLink(w, `WG-${slug}-${i + 1}`);
          }
          return w.trim();
        });

      const allLines = [...v2rayLines, ...wgLines];
      const rawContent = allLines.join('\n');

      const encodedContent = base64
        ? encodeContent(rawContent, true)
        : rawContent;

      const filename = `sub_${slug}.txt`;

      if (isEditing) {
        await updateGist(
          editGist!.id,
          displayName,
          editGist!.customerSlug,
          slug,
          encodedContent,
        );
        addToast('Customer updated successfully', 'success');
      } else {
        await createGist(displayName, filename, encodedContent);
        addToast('Customer created successfully', 'success');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{isEditing ? 'Edit Customer' : 'New Customer'}</h2>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        {loadingContent ? (
          <div className="drawer-loading">
            <span className="spinner" />
            <p>Loading customer data...</p>
          </div>
        ) : (
          <div className="drawer-body">
            <div className="form-group">
              <label>Customer Display Name</label>
              <input
                type="text"
                placeholder="Ali Rezaei"
                value={displayName}
                onChange={e => handleDisplayNameChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Slug (used in filename &amp; URL)</label>
              <input
                type="text"
                placeholder="ali_rezaei"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                readOnly={isEditing}
                className={isEditing ? 'input-readonly' : ''}
              />
              {!isValidSlug(slug) && slug.length > 0 && (
                <span className="form-error">Only letters, numbers, underscores allowed</span>
              )}
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={base64}
                  onChange={e => setBase64(e.target.checked)}
                />
                <span>Encode as Base64 (for V2rayNG / NekoBox subscription)</span>
              </label>
            </div>

            <div className="form-section">
              <label>V2Ray / VLESS / Trojan / Shadowsocks Configs</label>
              {v2rayConfigs.map((cfg, i) => (
                <div key={i} className="config-row">
                  <input
                    type="text"
                    placeholder="vless://... or trojan://..."
                    value={cfg}
                    onChange={e => updateV2rayRow(i, e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-ghost remove-btn"
                    onClick={() => removeV2rayRow(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="btn btn-sm btn-ghost add-btn" onClick={addV2rayRow}>
                + Add Config
              </button>
            </div>

            <div className="form-section">
              <label>WireGuard Configs</label>
              {wireguardConfigs.map((cfg, i) => (
                <div key={i} className="config-row config-row-wg">
                  <textarea
                    rows={6}
                    placeholder="[Interface]\nPrivateKey = ...\n\n[Peer]\nPublicKey = ..."
                    value={cfg}
                    onChange={e => updateWireguardRow(i, e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-ghost remove-btn"
                    onClick={() => removeWireguardRow(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="btn btn-sm btn-ghost add-btn" onClick={addWireguardRow}>
                + Add WireGuard
              </button>
            </div>
          </div>
        )}

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loadingContent}
          >
            {saving ? <span className="spinner" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
