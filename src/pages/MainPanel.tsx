import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGist, Customer } from '../hooks/useGist';
import { useToast } from '../hooks/useToast';
import { extractIpsFromConfig } from '../utils/extractIps';
import { detectEncoding } from '../utils/encoding';
import CustomerCard from '../components/CustomerCard';
import CustomerDrawer from '../components/CustomerDrawer';
import QRModal from '../components/QRModal';
import SkeletonCard from '../components/SkeletonCard';

const IPS_STORAGE_KEY = 'saved_ips';

function loadSavedIps(): string[] {
  try {
    const stored = localStorage.getItem(IPS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSavedIps(ips: string[]) {
  localStorage.setItem(IPS_STORAGE_KEY, JSON.stringify(ips));
}

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
  const [savedIps, setSavedIps] = useState<string[]>(loadSavedIps);
  const [newIpInput, setNewIpInput] = useState('');
  const [customerIpMap, setCustomerIpMap] = useState<Map<string, string[]>>(new Map());
  const [searchingIps, setSearchingIps] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listGists();
      setCustomers(data);
    } catch (err: any) {
      if (err.message !== 'Unauthorized' && err.message !== 'Rate limited') {
        addToast('Failed to load customers', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [listGists, addToast]);

  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    fetchCustomers();
  }, [navigate, fetchCustomers]);

  const fetchAllCustomerIps = useCallback(async () => {
    setSearchingIps(true);
    const map = new Map<string, string[]>();
    try {
      const results = await Promise.allSettled(
        customers.map(async c => {
          const content = await getGistContent(c.id, c.filename);
          const { content: decoded } = detectEncoding(content);
          const ips = extractIpsFromConfig(decoded);
          return { id: c.id, ips };
        }),
      );
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          map.set(r.value.id, r.value.ips);
        }
      });
      setCustomerIpMap(map);
    } catch {
      addToast('Failed to fetch config IPs', 'error');
    } finally {
      setSearchingIps(false);
    }
  }, [customers, getGistContent, addToast]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;

    if (searchMode === 'name') {
      return customers.filter(c =>
        c.description.toLowerCase().includes(q) ||
        c.customerSlug.toLowerCase().includes(q),
      );
    }

    return customers.filter(c => {
      const ips = customerIpMap.get(c.id);
      if (!ips) return false;
      return ips.some(ip => ip.includes(q));
    });
  }, [customers, searchQuery, searchMode, customerIpMap]);

  const handleSearchByIp = () => {
    if (!searchQuery.trim()) return;
    if (customerIpMap.size === 0) {
      fetchAllCustomerIps();
    }
  };

  const handleIpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchByIp();
    }
  };

  const addSavedIp = () => {
    const ip = newIpInput.trim();
    if (!ip) return;
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipPattern.test(ip)) {
      addToast('Invalid IP format', 'error');
      return;
    }
    if (savedIps.includes(ip)) {
      addToast('IP already saved', 'info');
      return;
    }
    const updated = [...savedIps, ip];
    setSavedIps(updated);
    saveSavedIps(updated);
    setNewIpInput('');
  };

  const removeSavedIp = (ip: string) => {
    const updated = savedIps.filter(i => i !== ip);
    setSavedIps(updated);
    saveSavedIps(updated);
  };

  const selectSavedIp = (ip: string) => {
    setSearchMode('ip');
    setSearchQuery(ip);
    if (customerIpMap.size === 0) {
      fetchAllCustomerIps();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
    addToast('Logged out', 'info');
    navigate('/', { replace: true });
  };

  const handleNewCustomer = () => {
    setEditingGist(null);
    setDrawerOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingGist(customer);
    setDrawerOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setDeleteConfirm(customer);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteGist(deleteConfirm.id);
      addToast('Customer deleted', 'success');
      setDeleteConfirm(null);
      setCustomerIpMap(new Map());
      fetchCustomers();
    } catch (err: any) {
      if (err.message !== 'Unauthorized' && err.message !== 'Rate limited') {
        addToast('Failed to delete customer', 'error');
      }
    }
  };

  const handleDrawerSaved = () => {
    setCustomerIpMap(new Map());
    fetchCustomers();
  };

  const lastUpdated = customers.length > 0
    ? customers.reduce((latest, c) => {
        return c.updatedAt > latest ? c.updatedAt : latest;
      }, customers[0].updatedAt)
    : null;

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
    <div className="panel">
      <header className="panel-header">
        <h1 className="panel-title">VPN Panel</h1>
        <div className="panel-header-actions">
          <button className="btn btn-primary" onClick={handleNewCustomer}>
            + New Customer
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="panel-stats">
        <span>Total customers: <strong>{customers.length}</strong></span>
        {lastUpdated && (
          <span>Last updated: {formatDate(lastUpdated)}</span>
        )}
      </div>

      <div className="search-bar">
        <div className="search-row">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder={searchMode === 'name' ? 'Search by name or slug...' : 'Search by IP...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={searchMode === 'ip' ? handleIpKeyDown : undefined}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          <select
            className="search-mode-select"
            value={searchMode}
            onChange={e => setSearchMode(e.target.value as 'name' | 'ip')}
          >
            <option value="name">Name</option>
            <option value="ip">IP</option>
          </select>
          {searchMode === 'ip' && searchQuery && (
            <button className="btn btn-sm btn-primary" onClick={handleSearchByIp} disabled={searchingIps}>
              {searchingIps ? <span className="spinner" /> : 'Search'}
            </button>
          )}
        </div>

        {searchMode === 'ip' && (
          <div className="saved-ips-section">
            <div className="saved-ips-row">
              {savedIps.map(ip => (
                <span key={ip} className="ip-chip" onClick={() => selectSavedIp(ip)}>
                  {ip}
                  <button className="ip-chip-remove" onClick={e => { e.stopPropagation(); removeSavedIp(ip); }}>×</button>
                </span>
              ))}
            </div>
            <div className="add-ip-row">
              <input
                type="text"
                className="add-ip-input"
                placeholder="Add IP…"
                value={newIpInput}
                onChange={e => setNewIpInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addSavedIp(); }}
              />
              <button className="btn btn-sm btn-ghost" onClick={addSavedIp}>Add</button>
            </div>
          </div>
        )}
      </div>

      {searchingIps && (
        <div className="searching-ips-notice">
          <span className="spinner" /> Fetching configs and extracting IPs…
        </div>
      )}

      <div className="customer-list">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? 'No customers match your search.' : 'No customers yet. Add your first one.'}</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onQR={setQrCustomer}
            />
          ))
        )}
      </div>

      <CustomerDrawer
        open={drawerOpen}
        editGist={editingGist}
        onClose={() => {
          setDrawerOpen(false);
          setEditingGist(null);
        }}
        onSaved={handleDrawerSaved}
      />

      {qrCustomer && (
        <QRModal
          url={qrCustomer.rawUrl}
          customerName={qrCustomer.description}
          onClose={() => setQrCustomer(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete Customer</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.description || 'Untitled'}</strong>?
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
