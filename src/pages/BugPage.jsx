import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function BugPage() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (text.trim().length < 8) {
      setStatus({ type: 'err', msg: 'Please provide a clear description of the bug.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', msg: '' });

    try {
      const resp = await fetch('/api/bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), text: text.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatus({ type: 'err', msg: data.error || 'Could not send bug report right now.' });
      } else {
        setName('');
        setText('');
        setStatus({ type: 'ok', msg: 'Bug report received. Thank you for helping improve Waqar Foodies.' });
      }
    } catch {
      setStatus({ type: 'err', msg: 'Network error. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wf-page-container">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="wf-section-title">
            Report a <span>Bug</span>
          </h2>
          <p className="wf-section-sub">
            Spotted an issue on our website? Let us know and we will fix it right away.
          </p>
        </motion.div>

        {status.msg && (
          <div className={status.type === 'ok' ? 'wf-alert-ok' : 'wf-alert-err'}>{status.msg}</div>
        )}

        {/* .wf-card stays at opacity: 1 so edge distortion works instantly from 0ms */}
        <form className="wf-card" onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <label className="wf-label">Your Name (Optional)</label>
              <input
                type="text"
                className="wf-input"
                maxLength={60}
                placeholder="Anonymous"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.1rem' }}>
              <label className="wf-label">Describe the Bug</label>
              <textarea
                className="wf-textarea"
                rows={5}
                maxLength={1000}
                placeholder="What happened, which page were you on, and what device/browser are you using?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <button type="submit" className="wf-btn-gold" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
