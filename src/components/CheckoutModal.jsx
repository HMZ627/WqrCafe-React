import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CheckoutModal() {
  const navigate = useNavigate();
  const {
    cartItems,
    grandTotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    setConfirmedOrderId,
    clearCart,
    savedCustomer,
    saveCustomerSession,
  } = useApp();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [receiptFile, setReceiptFile] = useState(null);
  const [saveDetails, setSaveDetails] = useState(false); // Unchecked by default
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [jcInfo, setJcInfo] = useState({
    jazzcashNumber: '0300-0000000',
    jazzcashName: 'Waqar Foodies',
  });

  useEffect(() => {
    if (isCheckoutOpen) {
      setName(savedCustomer?.name || '');
      setAddress(savedCustomer?.address || '');
      setPhone(savedCustomer?.phone || '');
      setSaveDetails(false);
      setErrors([]);
      setReceiptFile(null);

      fetch('/api/config')
        .then((r) => r.json())
        .then((d) => {
          if (d?.jazzcashNumber) setJcInfo(d);
        })
        .catch(() => {});
    }
  }, [isCheckoutOpen, savedCustomer]);

  async function handleConfirm(e) {
    e.preventDefault();
    const errs = [];
    if (name.trim().length < 2) errs.push('Full Name is required.');
    if (address.trim().length < 8) errs.push('Complete Delivery Address is required.');
    const normPhone = phone.replace(/[\s\-()]/g, '').trim();
    if (!/^(\+92|0)?3\d{9}$/.test(normPhone) && !/^\+?\d{10,15}$/.test(normPhone)) {
      errs.push('Valid Phone Number is required (e.g. 03001234567).');
    }
    if (paymentMethod === 'Online (JazzCash)') {
      if (!receiptFile) {
        errs.push('Please upload your JazzCash payment screenshot.');
      } else if (receiptFile.size > 2 * 1024 * 1024) {
        errs.push('Payment screenshot exceeds the 2 MB maximum size limit.');
      }
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('address', address.trim());
      form.append('phone', normPhone);
      form.append('paymentMethod', paymentMethod);
      form.append(
        'items',
        JSON.stringify(cartItems.map((i) => ({ id: i.id, qty: i.qty })))
      );
      if (paymentMethod === 'Online (JazzCash)' && receiptFile) {
        form.append('receipt', receiptFile);
      }

      const resp = await fetch('/api/order', { method: 'POST', body: form });
      const data = await resp.json();

      if (!resp.ok) {
        setErrors([data.error || 'Unable to submit order right now.']);
        return;
      }

      if (saveDetails) {
        saveCustomerSession({ name: name.trim(), address: address.trim(), phone: normPhone });
      } else {
        saveCustomerSession(null);
      }

      clearCart();
      setIsCheckoutOpen(false);
      setConfirmedOrderId(data.orderId);
    } catch {
      setErrors(['Network error. Please try again shortly.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <motion.div
          className="wf-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCheckoutOpen(false);
          }}
        >
          <motion.div
            className="wf-modal-dialog"
            initial={{ opacity: 0, y: 34, scale: 0.97, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 26, scale: 0.97, filter: 'blur(10px)' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="wf-modal-close"
              aria-label="Close"
              onClick={() => setIsCheckoutOpen(false)}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 0.9rem 0', fontFamily: "'Playfair Display', serif", fontSize: '1.55rem' }}>
              Complete Your Order
            </h3>

            {cartItems.length === 0 ? (
              <div>
                <p style={{ color: 'var(--wf-cream-muted)' }}>
                  Your order bag is empty. Please add an item from the Menu first.
                </p>
                <button
                  type="button"
                  className="wf-btn-gold"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    navigate('/menu');
                  }}
                >
                  Go to Menu
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirm}>
                {errors.length > 0 && (
                  <div className="wf-alert-err">
                    <strong>Please complete all required order details:</strong>
                    <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                      {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--wf-border)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                  }}
                >
                  {cartItems.map((i) => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                      <span>
                        {i.name} x {i.qty}
                      </span>
                      <span>PKR {(i.price * i.qty).toLocaleString()}/-</span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(212,175,55,0.2)',
                      paddingTop: '0.5rem',
                      marginTop: '0.5rem',
                      fontWeight: 700,
                      color: 'var(--wf-gold-bright)',
                    }}
                  >
                    <span>Grand Total</span>
                    <span>PKR {grandTotal.toLocaleString()}/-</span>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label className="wf-label">Full Name *</label>
                  <input
                    type="text"
                    className="wf-input"
                    maxLength={80}
                    placeholder="e.g. Waqar Ahmed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label className="wf-label">Delivery Address *</label>
                  <textarea
                    className="wf-textarea"
                    rows={2}
                    maxLength={250}
                    placeholder="House #, Street, Sector / Area, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '0.95rem' }}>
                  <label className="wf-label">Phone Number *</label>
                  <input
                    type="text"
                    className="wf-input"
                    maxLength={20}
                    placeholder="03XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '0.95rem' }}>
                  <label className="wf-label">Payment Method *</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['Cash on Delivery (COD)', 'Online (JazzCash)'].map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.92rem' }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === opt}
                          onChange={() => setPaymentMethod(opt)}
                          style={{ accentColor: '#D4AF37' }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Online (JazzCash)' && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(20,19,17,0.95))',
                      border: '1px solid var(--wf-gold)',
                      borderRadius: '14px',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--wf-gold-bright)', marginBottom: '4px' }}>
                      JazzCash Transfer Details
                    </div>
                    <div style={{ fontSize: '0.95rem' }}>
                      Account Number: <strong>{jcInfo.jazzcashNumber}</strong>
                    </div>
                    <div style={{ fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                      Account Title: <strong>{jcInfo.jazzcashName}</strong>
                    </div>
                    <label className="wf-label">
                      Upload Payment Screenshot * (PNG/JPG/WEBP, Max 2 MB)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      style={{ color: 'var(--wf-cream)', fontSize: '0.88rem' }}
                    />
                  </div>
                )}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--wf-cream-muted)',
                    marginBottom: '1.1rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={saveDetails}
                    onChange={(e) => setSaveDetails(e.target.checked)}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  Save order details for future orders
                </label>

                <button type="submit" className="wf-btn-gold" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Sending Order Securely...' : 'Confirm Order'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
