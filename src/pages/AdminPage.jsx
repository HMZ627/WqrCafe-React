import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ text, query }) {
  const str = String(text ?? '');
  const q = query.trim();
  if (!q) return <>{str}</>;

  const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const parts = str.split(regex);

  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={idx} className="wf-search-highlight">
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard state
  const [orders, setOrders] = useState([]);
  const [totalDispatched, setTotalDispatched] = useState(0);
  const [sheetConfigured, setSheetConfigured] = useState(true);
  const [sheetLink, setSheetLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [dashError, setDashError] = useState('');
  const [dispatchingId, setDispatchingId] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  // Concurrency guards so background auto-refresh never clashes with Dispatch
  const fetchVersionRef = useRef(0);
  const dispatchingRef = useRef(false);
  const recentlyDispatchedRef = useRef(new Set());

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (silent && dispatchingRef.current) return;
    if (silent && document.visibilityState === 'hidden') return;

    const myVersion = ++fetchVersionRef.current;
    if (!silent) {
      setLoadingOrders(true);
      setDashError('');
    }

    try {
      const resp = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (myVersion !== fetchVersionRef.current) return;

      if (resp.status === 401) {
        setIsAuthed(false);
        setAuthChecked(true);
        return;
      }

      const data = await resp.json();
      if (myVersion !== fetchVersionRef.current) return;

      if (!resp.ok) {
        if (!silent) setDashError(data.error || 'Could not load orders.');
      } else {
        setIsAuthed(true);
        setSheetConfigured(Boolean(data.configured));
        const incoming = (data.pending || []).filter(
          (o) => !recentlyDispatchedRef.current.has(o.orderNo)
        );
        setOrders(incoming);
        setTotalDispatched(data.totalDispatched || 0);
        setSheetLink(data.sheetLink || '');
        setLastSyncedAt(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
        if (silent) setDashError('');
      }
    } catch {
      if (!silent && myVersion === fetchVersionRef.current) {
        setDashError('Network error while loading orders.');
      }
    } finally {
      if (myVersion === fetchVersionRef.current) {
        setAuthChecked(true);
        if (!silent) setLoadingOrders(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders({ silent: false });
  }, [fetchOrders]);

  useEffect(() => {
    if (!isAuthed) return undefined;

    const intervalId = setInterval(() => {
      fetchOrders({ silent: true });
    }, 4000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    let channel = null;
    try {
      channel = new BroadcastChannel('wf_orders_sync');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'new_order') {
          fetchOrders({ silent: true });
        }
      };
    } catch {
      // BroadcastChannel not supported; 4s interval still handles updates
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      if (channel) channel.close();
    };
  }, [isAuthed, fetchOrders]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setLoginError(data.error || 'Invalid credentials.');
      } else {
        setPassword('');
        setIsAuthed(true);
        await fetchOrders({ silent: false });
      }
    } catch {
      setLoginError('Unable to reach server.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setIsAuthed(false);
    setOrders([]);
    setUsername('');
    setPassword('');
  }

  async function handleDispatch(orderNo) {
    dispatchingRef.current = true;
    fetchVersionRef.current += 1;
    setDispatchingId(orderNo);
    setDashError('');

    try {
      const resp = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setDashError(data.error || 'Failed to dispatch order.');
      } else {
        recentlyDispatchedRef.current.add(orderNo);
        setTimeout(() => recentlyDispatchedRef.current.delete(orderNo), 15000);
        setOrders((prev) => prev.filter((o) => o.orderNo !== orderNo));
        setTotalDispatched((prev) => prev + 1);
      }
    } catch {
      setDashError('Network error while dispatching order.');
    } finally {
      dispatchingRef.current = false;
      setDispatchingId('');
    }
  }

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.sr, o.orderNo, o.name, o.order, o.address, o.phone, o.paymentMethod, o.status].some(
        (field) => String(field || '').toLowerCase().includes(q)
      )
    );
  }, [orders, searchQuery]);

  if (!authChecked) {
    return (
      <div className="wf-page-container" style={{ textAlign: 'center', color: 'var(--wf-cream-muted)' }}>
        Checking session...
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <motion.div
        className="wf-page-container"
        initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ maxWidth: '460px', margin: '1rem auto' }}>
          <h2 className="wf-section-title">
            Admin <span>Portal</span>
          </h2>
          <p className="wf-section-sub">Sign in to manage live Waqar Foodies orders.</p>

          {loginError && <div className="wf-alert-err">{loginError}</div>}

          <form className="wf-card" onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="wf-label">Admin Username</label>
              <input
                type="text"
                className="wf-input"
                required
                autoComplete="username"
                placeholder="Enter ADMIN_NAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label className="wf-label">Admin Password</label>
              <input
                type="password"
                className="wf-input"
                required
                autoComplete="current-password"
                placeholder="Enter ADMIN_PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="wf-btn-gold" style={{ width: '100%' }} disabled={loggingIn}>
              {loggingIn ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="wf-page-container"
      style={{ maxWidth: '1360px' }}
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="wf-admin-header">
        <div>
          <h2 className="wf-section-title" style={{ textAlign: 'left', marginBottom: '0.2rem' }}>
            Pending <span>Orders</span>
          </h2>
          <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.92rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
            <span>
              Pending: <strong style={{ color: 'var(--wf-gold-bright)' }}>{orders.length}</strong>
            </span>
            <span>•</span>
            <span>
              Dispatched: <strong style={{ color: '#8bd89b' }}>{totalDispatched}</strong>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#8bd89b', fontSize: '0.84rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8bd89b',
                  boxShadow: '0 0 8px #8bd89b',
                  display: 'inline-block',
                }}
              />
              Auto-Sync Active{lastSyncedAt ? ` (${lastSyncedAt})` : ''}
            </span>
          </div>
        </div>

        <div className="wf-admin-actions">
          {sheetLink && (
            <a
              href={sheetLink}
              target="_blank"
              rel="noreferrer"
              className="wf-btn"
            >
              Open Google Sheet
            </a>
          )}
          <button
            type="button"
            className="wf-btn"
            onClick={() => fetchOrders({ silent: false })}
            disabled={loadingOrders}
          >
            {loadingOrders ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="wf-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {!sheetConfigured && (
        <div className="wf-alert-err">
          Google Sheets database is not configured yet. Add <strong>GSHEET_LINK</strong>,{' '}
          <strong>GSHEET_SCRIPT_URL</strong>, and <strong>GSHEET_SCRIPT_SECRET</strong> in Cloudflare Secrets.
        </div>
      )}

      {dashError && <div className="wf-alert-err">{dashError}</div>}

      <div className="wf-admin-search-wrap">
        <input
          type="text"
          className="wf-input"
          maxLength={120}
          placeholder="Search orders by Order No., Name, Item, Address, Phone, or Payment method..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="wf-table-wrap">
        <table className="wf-admin-table">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Order number:</th>
              <th>Name:</th>
              <th>Order:</th>
              <th>Address:</th>
              <th>Phone:</th>
              <th>Payment method:</th>
              <th>Status:</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--wf-cream-muted)' }}>
                  {searchQuery.trim()
                    ? 'No pending orders match your search.'
                    : 'All caught up — no pending orders right now.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((row) => (
                <tr key={row.orderNo || row.sr}>
                  <td>
                    <HighlightText text={row.sr} query={searchQuery} />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--wf-gold-bright)', whiteSpace: 'nowrap' }}>
                    <HighlightText text={row.orderNo} query={searchQuery} />
                  </td>
                  <td>
                    <HighlightText text={row.name} query={searchQuery} />
                  </td>
                  <td>
                    <HighlightText text={row.order} query={searchQuery} />
                  </td>
                  <td style={{ minWidth: '180px' }}>
                    <HighlightText text={row.address} query={searchQuery} />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <HighlightText text={row.phone} query={searchQuery} />
                  </td>
                  <td>
                    <HighlightText text={row.paymentMethod} query={searchQuery} />
                  </td>
                  <td>
                    <div className="wf-status-cell">
                      <span className="wf-status-pill">
                        <HighlightText text={row.status} query={searchQuery} />
                      </span>
                      <button
                        type="button"
                        className="wf-btn-gold wf-dispatch-btn"
                        disabled={dispatchingId === row.orderNo}
                        onClick={() => handleDispatch(row.orderNo)}
                      >
                        {dispatchingId === row.orderNo ? 'Dispatching...' : 'Dispatch'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
