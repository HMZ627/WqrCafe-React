import React, { useEffect, useMemo, useState } from 'react';
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

  async function fetchOrders() {
    setLoadingOrders(true);
    setDashError('');
    try {
      const resp = await fetch('/api/admin/orders');
      if (resp.status === 401) {
        setIsAuthed(false);
        setAuthChecked(true);
        return;
      }
      const data = await resp.json();
      if (!resp.ok) {
        setDashError(data.error || 'Could not load orders.');
      } else {
        setIsAuthed(true);
        setSheetConfigured(Boolean(data.configured));
        setOrders(data.pending || []);
        setTotalDispatched(data.totalDispatched || 0);
        setSheetLink(data.sheetLink || '');
      }
    } catch {
      setDashError('Network error while loading orders.');
    } finally {
      setAuthChecked(true);
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

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
        await fetchOrders();
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
        setOrders((prev) => prev.filter((o) => o.orderNo !== orderNo));
        setTotalDispatched((prev) => prev + 1);
      }
    } catch {
      setDashError('Network error while dispatching order.');
    } finally {
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
          <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.92rem' }}>
            Pending: <strong style={{ color: 'var(--wf-gold-bright)' }}>{orders.length}</strong>
            {'  •  '}
            Dispatched: <strong style={{ color: '#8bd89b' }}>{totalDispatched}</strong>
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
          <button type="button" className="wf-btn" onClick={fetchOrders} disabled={loadingOrders}>
            {loadingOrders ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="wf-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {!sheetConfigured && (
        <div className="wf-alert-err">
          Google Sheets database is not fully configured yet. Add <strong>GSHEET_LINK</strong>,{' '}
          <strong>GOOGLE_SERVICE_ACCOUNT_EMAIL</strong>, and <strong>GOOGLE_PRIVATE_KEY</strong> in Cloudflare Secrets.
        </div>
      )}

      {dashError && <div className="wf-alert-err">{dashError}</div>}

      <div className="wf-admin-search-wrap">
        <input
          type="text"
          className="wf-input"
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
