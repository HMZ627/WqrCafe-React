import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const {
    cartItems,
    totalQty,
    grandTotal,
    updateQty,
    isBagOpen,
    setIsBagOpen,
    setIsCheckoutOpen,
  } = useApp();

  const bagWrapRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (isBagOpen && bagWrapRef.current && !bagWrapRef.current.contains(e.target)) {
        setIsBagOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setIsBagOpen(false);
    }
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isBagOpen, setIsBagOpen]);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/review', label: 'Review' },
    { to: '/report-a-bug', label: 'Report a bug' },
  ];

  return (
    <header className="wf-navbar">
      <div className="wf-navbar-inner">
        <Link to="/" className="wf-brand">
          <img
            src="/static/Logo.png"
            alt="Waqar Foodies Logo"
            className="wf-brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="wf-brand-name">Waqar Foodies</span>
        </Link>

        <nav className="wf-nav-links">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? 'wf-btn-gold' : 'wf-btn'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="wf-bag-wrap" ref={bagWrapRef}>
          <button
            type="button"
            className="wf-bag-btn"
            aria-label="Open order bag"
            onClick={() => setIsBagOpen((prev) => !prev)}
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F5EFE6"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 7h12l1 13H5L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            <span className="wf-bag-badge">{totalQty}</span>
          </button>

          <AnimatePresence>
            {isBagOpen && (
              <motion.div
                className="wf-bag-popover"
                initial={{ opacity: 0, scale: 0.74, x: 12, y: -14, filter: 'blur(12px)' }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.74, x: 12, y: -14, filter: 'blur(14px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h4 style={{ margin: '0 0 0.7rem 0', fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>
                  Your Order
                </h4>

                {cartItems.length === 0 ? (
                  <p style={{ color: 'var(--wf-cream-muted)', fontSize: '0.92rem', margin: '0.4rem 0' }}>
                    No items added yet.
                  </p>
                ) : (
                  <>
                    <div>
                      {cartItems.map((item) => (
                        <div key={item.id} className="wf-bag-row">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--wf-cream-muted)' }}>
                              PKR {item.price.toLocaleString()} x {item.qty}
                            </div>
                          </div>

                          <div className="wf-qty-controls">
                            <button
                              type="button"
                              className="wf-qty-btn"
                              onClick={() => updateQty(item.id, -1)}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              className="wf-qty-btn"
                              onClick={() => updateQty(item.id, 1)}
                            >
                              +
                            </button>
                          </div>

                          <div style={{ minWidth: '64px', textAlign: 'right', fontWeight: 700 }}>
                            {(item.price * item.qty).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        margin: '1rem 0',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                      }}
                    >
                      <span>Grand Total:</span>
                      <span style={{ color: 'var(--wf-gold-bright)' }}>
                        PKR {grandTotal.toLocaleString()}/-
                      </span>
                    </div>

                    <button
                      type="button"
                      className="wf-btn-gold"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setIsBagOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                    >
                      Order
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
