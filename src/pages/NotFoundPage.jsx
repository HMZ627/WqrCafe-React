import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <motion.div
      className="wf-page-container"
      initial={{ opacity: 0, y: 32, filter: 'blur(18px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="wf-card"
        style={{
          maxWidth: '720px',
          margin: '1rem auto',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 25%, rgba(212,175,55,0.14), #151412 76%)',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(5rem, 12vw, 8.5rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            background: 'linear-gradient(180deg, #FFF5DC 0%, #D4AF37 55%, #8C6A15 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}
        >
          404
        </div>

        <h2
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            color: '#F5EFE6',
            margin: '0.2rem 0 0.8rem 0',
            fontWeight: 400,
          }}
        >
          Lost in the Darkness
        </h2>

        <div
          style={{
            display: 'inline-block',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.35)',
            borderRadius: '999px',
            padding: '0.3rem 1rem',
            fontSize: '0.85rem',
            color: '#CFC4B4',
            marginBottom: '1rem',
          }}
        >
          Requested Path: <strong style={{ color: '#F0CA5A' }}>{pathname}</strong>
        </div>

        <p style={{ color: '#CFC4B4', fontSize: '1rem', lineHeight: 1.65, maxWidth: '500px', margin: '0 auto 1.6rem auto' }}>
          The page you are looking for does not exist or may have moved. Return to Waqar Foodies or explore our signature menu.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="wf-btn-gold" onClick={() => navigate('/')}>
            Back to Home
          </button>
          <button type="button" className="wf-btn" onClick={() => navigate('/menu')}>
            Explore Menu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
