import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function ConfirmationModal() {
  const { confirmedOrderId, setConfirmedOrderId } = useApp();
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(confirmedOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AnimatePresence>
      {confirmedOrderId && (
        <motion.div
          className="wf-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className="wf-modal-dialog"
            style={{ maxWidth: '460px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 34, scale: 0.97, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(10px)' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.9rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Your Order ID
            </div>

            <div
              style={{
                background: '#181714',
                border: '1px dashed var(--wf-gold)',
                borderRadius: '16px',
                padding: '1.15rem',
                margin: '0.9rem 0',
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2.3rem',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  color: 'var(--wf-gold-bright)',
                }}
              >
                {confirmedOrderId}
              </div>
            </div>

            <button type="button" className="wf-btn-gold" onClick={copyId}>
              {copied ? 'Copied to Clipboard' : 'Copy Order ID'}
            </button>

            <p style={{ color: 'var(--wf-cream)', fontSize: '1.02rem', margin: '1.1rem 0 1.3rem 0', fontWeight: 500 }}>
              You will be confirmed for your order shortly, <strong>THANK YOU!</strong>
            </p>

            <button
              type="button"
              className="wf-btn"
              style={{ width: '100%' }}
              onClick={() => setConfirmedOrderId(null)}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
