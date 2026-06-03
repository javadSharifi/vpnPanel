import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGist, type Customer } from '../hooks/useGist';
import { useToast } from '../hooks/useToast';
import { extractIpsFromConfig } from '../utils/extractIps';
import { detectEncoding } from '../utils/encoding';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import ThemeToggle from '../components/ThemeToggle';
import CustomerCard from '../components/CustomerCard';
import CustomerDrawer from '../components/CustomerDrawer';
import QRModal from '../components/QRModal';
import SkeletonCard from '../components/SkeletonCard';

const IPS_KEY = 'saved_ips';

function loadIps(): string[] {
  try { return JSON.parse(localStorage.getItem(IPS_KEY) || '[]'); } catch { return []; }
}
function saveIps(ips: string[]) { localStorage.setItem(IPS_KEY, JSON.stringify(ips)); }

export default function MainPanel() {
  const navigate = useNavigate();
  const { listGists, deleteGist, getGistContent } = useGist();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGist, setEditingGist] = useState<Customer | null>(null);
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const [searchMode, setSearchMode] = useState<'name' | 'ip'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIps, setSavedIps] = useState<string[]>(loadIps);
  const [newIpInput, setNewIpInput] = useState('');
  const [customerIpMap, setCustomerIpMap] = useState<Map<string, string[]>>(new Map());
  const [searchingIps, setSearchingIps] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await listGists());
    } catch (err: any) {
      if (err.message !== 'Unauthorized' && err.message !== 'Rate limited') addToast('Failed to load customers', 'error');
    } finally { setLoading(false); }
  }, [listGists, addToast]);

  useEffect(() => {
    if (!localStorage.getItem('github_token')) { navigate('/', { replace: true }); return; }
    fetchCustomers();
  }, [navigate, fetchCustomers]);

  const fetchAllIps = useCallback(async () => {
    setSearchingIps(true);
    const map = new Map<string, string[]>();
    try {
      const results = await Promise.allSettled(customers.map(async c => {
        const content = await getGistContent(c.id, c.filename);
        return { id: c.id, ips: extractIpsFromConfig(detectEncoding(content).content) };
      }));
      results.forEach(r => { if (r.status === 'fulfilled') map.set(r.value.id, r.value.ips); });
      setCustomerIpMap(map);
    } catch { addToast('Failed to fetch IPs', 'error'); }
    finally { setSearchingIps(false); }
  }, [customers, getGistContent, addToast]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    if (searchMode === 'name') return customers.filter(c => c.description.toLowerCase().includes(q) || c.customerSlug.toLowerCase().includes(q));
    return customers.filter(c => (customerIpMap.get(c.id) || []).some(ip => ip.includes(q)));
  }, [customers, searchQuery, searchMode, customerIpMap]);

  const selectIp = (ip: string) => { setSearchMode('ip'); setSearchQuery(ip); if (!customerIpMap.size) fetchAllIps(); };
  const addIp = () => {
    const ip = newIpInput.trim();
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) { addToast('Invalid IP', 'error'); return; }
    if (savedIps.includes(ip)) { addToast('Already saved', 'info'); return; }
    const u = [...savedIps, ip]; setSavedIps(u); saveIps(u); setNewIpInput('');
  };
  const removeIp = (ip: string) => { const u = savedIps.filter(i => i !== ip); setSavedIps(u); saveIps(u); };

  const handleLogout = () => {
    localStorage.removeItem('github_token'); localStorage.removeItem('github_username');
    addToast('Logged out', 'info'); navigate('/', { replace: true });
  };
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteGist(deleteConfirm.id); addToast('Customer deleted', 'success');
      setDeleteConfirm(null); setCustomerIpMap(new Map()); fetchCustomers();
    } catch (err: any) {
      if (err.message !== 'Unauthorized' && err.message !== 'Rate limited') addToast('Failed to delete', 'error');
    }
  };
  const handleDrawerSaved = () => { setCustomerIpMap(new Map()); fetchCustomers(); };

  const lastUpdated = customers.length ? customers.reduce((l, c) => c.updatedAt > l ? c.updatedAt : l, customers[0].updatedAt) : null;
  const fmt = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="max-w-3xl mx-auto px-5 py-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">VPN Panel</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" onClick={() => { setEditingGist(null); setDrawerOpen(true); }}>+ New Customer</Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <div className="flex items-center gap-6 px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-muted-foreground mb-4">
        <span>Total: <strong className="text-foreground">{customers.length}</strong></span>
        {lastUpdated && <span>Updated: {fmt(lastUpdated)}</span>}
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={searchMode === 'name' ? 'Search by name or slug...' : 'Search by IP...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => searchMode === 'ip' && e.key === 'Enter' && (customerIpMap.size ? null : fetchAllIps())}
              className="pr-8"
            />
            {searchQuery && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer text-lg" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
            value={searchMode}
            onChange={e => setSearchMode(e.target.value as 'name' | 'ip')}
          >
            <option value="name">Name</option>
            <option value="ip">IP</option>
          </select>
          {searchMode === 'ip' && searchQuery && (
            <Button size="sm" variant="default" onClick={() => customerIpMap.size ? null : fetchAllIps()} disabled={searchingIps}>
              {searchingIps ? <span className="spinner" /> : 'Search'}
            </Button>
          )}
        </div>

        {searchMode === 'ip' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {savedIps.map(ip => (
                <span key={ip} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono border border-primary/30 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => selectIp(ip)}>
                  {ip}
                  <button className="text-primary/60 hover:text-primary bg-transparent border-none cursor-pointer text-sm leading-none p-0" onClick={e => { e.stopPropagation(); removeIp(ip); }}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add IP…" value={newIpInput} onChange={e => setNewIpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIp()} className="w-40 h-8 text-sm" />
              <Button variant="ghost" size="sm" onClick={addIp}>Add</Button>
            </div>
          </div>
        )}
      </div>

      {searchingIps && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/30 bg-primary/10 text-sm text-primary mb-3">
          <span className="spinner" /> Fetching configs and extracting IPs…
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">{searchQuery ? 'No matches.' : 'No customers yet. Add your first one.'}</p>
        ) : (
          filtered.map(c => <CustomerCard key={c.id} customer={c} onEdit={c => { setEditingGist(c); setDrawerOpen(true); }} onDelete={setDeleteConfirm} onQR={setQrCustomer} />)
        )}
      </div>

      <CustomerDrawer open={drawerOpen} editGist={editingGist} onClose={() => { setDrawerOpen(false); setEditingGist(null); }} onSaved={handleDrawerSaved} />
      {qrCustomer && <QRModal url={qrCustomer.rawUrl} customerName={qrCustomer.description} onClose={() => setQrCustomer(null)} />}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="rounded-xl border border-border bg-card p-7 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Customer</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Delete <strong className="text-foreground">{deleteConfirm.description || 'Untitled'}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
