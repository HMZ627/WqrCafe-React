import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function ReviewForm() {
  const { addLiveReview } = useApp();
  const [name, setName] = useState('');
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [text, setText] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (stars < 1) {
      setStatus({ type: 'err', msg: 'Please select a star rating (1 to 5 stars).' });
      return;
    }
    if (text.trim().length < 5) {
      setStatus({ type: 'err', msg: 'Please write at least a few words in your review.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', msg: '' });

    try {
      const resp = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), stars, text: text.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatus({ type: 'err', msg: data.error || 'Could not send review right now.' });
      } else {
        addLiveReview(data.review);
        setName('');
        setStars(0);
        setText('');
        setStatus({
          type: 'ok',
          msg: 'Thank you. Your review is now featured in Voices of our Regulars.',
        });
      }
    } catch {
      setStatus({ type: 'err', msg: 'Network error. Please try again shortly.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="wf-section-title">
          Submit a <span>Review</span>
        </h2>
        <p className="wf-section-sub">
          Loved the crunch, smoke, and warmth? Your review goes live on our wall.
        </p>
      </motion.div>

      {status.msg && (
        <div className={status.type === 'ok' ? 'wf-alert-ok' : 'wf-alert-err'}>{status.msg}</div>
      )}

      <motion.form
        className="wf-card"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label className="wf-label">Your Name (Optional)</label>
          <input
            type="text"
            className="wf-input"
            maxLength={60}
            placeholder="e.g. Ali"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="wf-label">Rate Your Experience</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const active = num <= (hoverStars || stars);
              return (
                <button
                  key={num}
                  type="button"
                  aria-label={`${num} stars`}
                  onMouseEnter={() => setHoverStars(num)}
                  onMouseLeave={() => setHoverStars(0)}
                  onClick={() => setStars(num)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px',
                    transform: active ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.18s ease',
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill={active ? '#D4AF37' : 'none'}
                    stroke="#D4AF37"
                    strokeWidth="1.7"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '1.1rem' }}>
          <label className="wf-label">Your Review</label>
          <textarea
            className="wf-textarea"
            rows={4}
            maxLength={800}
            placeholder="Write your thoughts about the Tower Burger, Chicken Paratha Roll, or cafe vibe..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button type="submit" className="wf-btn-gold" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </motion.form>
    </div>
  );
}
