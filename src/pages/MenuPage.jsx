import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MENU_ITEMS, useApp } from '../context/AppContext';
import OrderButton from '../components/OrderButton';

export default function MenuPage() {
  const { cartItems, addToCart, setIsCheckoutOpen } = useApp();
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }

  return (
    <motion.div
      className="wf-page-container"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="wf-section-title">
        Our <span>Signature</span> Menu
      </h2>
      <p className="wf-section-sub">Handcrafted fresh after sundown. Choose your cravings below.</p>

      {toast && (
        <div
          className="wf-alert-ok"
          style={{ maxWidth: '420px', margin: '0 auto 1.4rem auto', textAlign: 'center' }}
        >
          {toast}
        </div>
      )}

      <div className="wf-menu-grid">
        {Object.values(MENU_ITEMS).map((item) => (
          <div key={item.id} className="wf-card">
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '100%', height: '230px', objectFit: 'cover', borderRadius: '14px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            <div className="wf-menu-placeholder" style={{ display: 'none' }}>
              {item.name}
            </div>

            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.65rem',
                fontWeight: 700,
                margin: '0.8rem 0 0.35rem 0',
              }}
            >
              {item.name}
            </div>

            <div
              style={{
                display: 'inline-block',
                background: 'rgba(212,175,55,0.14)',
                border: '1px solid rgba(212,175,55,0.45)',
                color: 'var(--wf-gold-bright)',
                fontWeight: 700,
                padding: '0.25rem 0.85rem',
                borderRadius: '999px',
                marginBottom: '0.7rem',
              }}
            >
              {item.price}/- PKR
            </div>

            <p
              style={{
                color: 'var(--wf-cream-muted)',
                fontSize: '0.94rem',
                lineHeight: 1.55,
                minHeight: '3.1rem',
                margin: '0 0 1.2rem 0',
              }}
            >
              {item.desc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <OrderButton
                onClick={() => {
                  const alreadyInCart = cartItems.some((c) => c.id === item.id);
                  if (!alreadyInCart) addToCart(item.id, 1);
                  setIsCheckoutOpen(true);
                }}
              >
                Order now
              </OrderButton>
              <button
                type="button"
                className="wf-btn"
                onClick={() => {
                  addToCart(item.id, 1);
                  showToast(`Added ${item.name} to your order.`);
                }}
              >
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
