import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TestimonialsBox from './TestimonialsBox';
import ReviewForm from './ReviewForm';

const ROOMS = [
  { col: 0, row: 0, title: 'Quote', dir: 'Next ↓' },
  { col: 0, row: 1, title: 'Craft', dir: '↓  |  Next →' },
  { col: 1, row: 1, title: 'Signature', dir: 'Next ↓' },
  { col: 1, row: 2, title: 'Testimonials', dir: 'Next ←' },
  { col: 0, row: 2, title: 'Review', dir: 'Back ↑' },
];

const VIDEO_SECTIONS = [
  {
    startPct: 0.0,
    endPct: 0.165,
    source: 'Sunlit Golden Wheat Fields',
    sub: 'Toasted Sesame Brioche Bun',
    body: 'Harvested from golden wheat fields and baked pillowy-soft with toasted sesame seeds, splitting open in warm millstone mist.',
    bg: 'radial-gradient(circle at 50% 48%, #4F3814 0%, #17130D 65%, #0D0C0A 100%)',
  },
  {
    startPct: 0.185,
    endPct: 0.295,
    source: 'Morning Dew Vegetable Farms',
    sub: 'Crisp Lettuce, Vine Tomatoes & Red Onions',
    body: 'Dew-fresh emerald lettuce, sun-ripened tomato slices, and sharp purple onion rings cascading straight from fertile garden soil.',
    bg: 'radial-gradient(circle at 50% 48%, #153D23 0%, #0E1711 65%, #0B0E0C 100%)',
  },
  {
    startPct: 0.315,
    endPct: 0.48,
    source: 'Lush Green Dairy Pastures',
    sub: 'Creamy Double Cheddar & Crisp Pickles',
    body: 'Wholesome pasture milk churned into two rich, velvety cheddar slices, layered generously over tangy dill pickles and greens.',
    bg: 'radial-gradient(circle at 50% 48%, #2E3F19 0%, #15170F 65%, #0C0D0A 100%)',
  },
  {
    startPct: 0.505,
    endPct: 0.685,
    source: 'Twilight Wood-Fired Grill',
    sub: 'Double Charcoal-Seared Beef Patties',
    body: 'Two thick, hand-pressed beef patties seared at dusk over roaring hardwood flames—locking in smoky char and sizzling juices.',
    bg: 'radial-gradient(circle at 50% 48%, #521A0E 0%, #180E0D 65%, #0D0A0A 100%)',
  },
  {
    startPct: 0.715,
    endPct: 0.985,
    source: 'Waqar Foodies — After Darkness',
    sub: 'The Signature Double Tower Burger',
    body: 'Crowned with crushed peppercorns, signature house burger sauce, and warm golden bokeh—crafted to come alive after darkness.',
    bg: 'radial-gradient(circle at 50% 48%, #36240B 0%, #12100D 65%, #0A0A09 100%)',
  },
];

export default function SpatialShowcase({ revealed }) {
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(0);
  const [videoStep, setVideoStep] = useState(0);

  const activeRoomRef = useRef(0);
  const videoStepRef = useRef(0);
  const isBusyRef = useRef(false);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const reviewPanelRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchTriggeredRef = useRef(false);

  activeRoomRef.current = activeRoom;
  videoStepRef.current = videoStep;

  function playPartWithSlowEaseOut(stepIdx) {
    cancelAnimationFrame(animFrameRef.current);
    const vid = videoRef.current;
    if (!vid) {
      isBusyRef.current = false;
      return;
    }

    const startPlayback = () => {
      const duration = vid.duration;
      if (!duration || Number.isNaN(duration)) {
        isBusyRef.current = false;
        return;
      }

      const s = VIDEO_SECTIONS[stepIdx];
      const startTime = Math.max(0, s.startPct * duration);
      const endTime = Math.min(duration - 0.04, s.endPct * duration);
      const span = Math.max(0.2, endTime - startTime);

      vid.style.opacity = '0.28';
      vid.pause();
      vid.currentTime = startTime;

      setTimeout(() => {
        vid.style.opacity = '0.96';
        vid.muted = true;
        vid.playbackRate = 0.85;
        vid.play().catch(() => {});

        let lastRateTick = performance.now();

        function monitor(now) {
          const cur = vid.currentTime;
          const progress = Math.max(0, Math.min(1, (cur - startTime) / span));

          if (cur >= endTime - 0.015 || progress >= 0.995 || vid.ended) {
            vid.pause();
            vid.currentTime = endTime;
            vid.playbackRate = 0.85;
            isBusyRef.current = false;
            return;
          }

          if (progress >= 0.55 && now - lastRateTick >= 95) {
            const tail = (progress - 0.55) / 0.45;
            vid.playbackRate = Math.max(0.16, 0.85 * Math.pow(1 - tail, 1.45));
            lastRateTick = now;
          }

          animFrameRef.current = requestAnimationFrame(monitor);
        }

        animFrameRef.current = requestAnimationFrame(monitor);
      }, 110);
    };

    if (vid.readyState >= 1 && vid.duration) {
      startPlayback();
    } else {
      vid.addEventListener('loadedmetadata', startPlayback, { once: true });
    }
  }

  function goToVideoStep(nextIdx) {
    if (nextIdx < 0 || nextIdx >= VIDEO_SECTIONS.length || nextIdx === videoStepRef.current) return;
    isBusyRef.current = true;
    setVideoStep(nextIdx);
    playPartWithSlowEaseOut(nextIdx);
    setTimeout(() => {
      isBusyRef.current = false;
    }, 3400);
  }

  function goToRoom(nextRoom) {
    if (nextRoom < 0 || nextRoom >= ROOMS.length || nextRoom === activeRoomRef.current) return;
    isBusyRef.current = true;
    const prev = activeRoomRef.current;
    setActiveRoom(nextRoom);

    if (nextRoom === 1) {
      const targetStep = prev === 0 ? 0 : videoStepRef.current;
      setVideoStep(targetStep);
      setTimeout(() => playPartWithSlowEaseOut(targetStep), 420);
      setTimeout(() => {
        isBusyRef.current = false;
      }, 3400);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      videoRef.current?.pause();
      setTimeout(() => {
        isBusyRef.current = false;
      }, 950);
    }
  }

  function handleScrollDirection(dir, target) {
    if (isBusyRef.current) return;
    const room = activeRoomRef.current;

    if (room === 0) {
      if (dir > 0) goToRoom(1);
    } else if (room === 1) {
      if (dir > 0) {
        if (videoStepRef.current < VIDEO_SECTIONS.length - 1) goToVideoStep(videoStepRef.current + 1);
        else goToRoom(2);
      } else {
        if (videoStepRef.current > 0) goToVideoStep(videoStepRef.current - 1);
        else goToRoom(0);
      }
    } else if (room === 2) {
      if (dir > 0) goToRoom(3);
      else goToRoom(1);
    } else if (room === 3) {
      const testiEl = document.getElementById('wf-testi-box');
      if (testiEl && testiEl.contains(target)) return;
      if (dir > 0) goToRoom(4);
      else goToRoom(2);
    } else if (room === 4) {
      const panel = reviewPanelRef.current;
      if (dir < 0 && (!panel || panel.scrollTop <= 4)) {
        goToRoom(3);
      }
    }
  }

  useEffect(() => {
    const isInteractive = (target) =>
      Boolean(
        document.querySelector('.wf-modal-backdrop') ||
          document.querySelector('.wf-bag-popover') ||
          target?.closest?.('textarea, input, button, a, .wf-navbar')
      );

    const onWheel = (e) => {
      if (isInteractive(e.target) || Math.abs(e.deltaY) < 4) return;
      if (activeRoomRef.current === 4 && reviewPanelRef.current) {
        const rp = reviewPanelRef.current;
        const canDown = rp.scrollTop + rp.clientHeight < rp.scrollHeight - 4;
        if ((e.deltaY > 0 && canDown) || (e.deltaY < 0 && rp.scrollTop > 4)) return;
      }
      e.preventDefault();
      handleScrollDirection(e.deltaY > 0 ? 1 : -1, e.target);
    };

    const onTouchStart = (e) => {
      if (isInteractive(e.target) || e.touches.length !== 1) return;
      touchStartYRef.current = e.touches[0].clientY;
      touchTriggeredRef.current = false;
    };

    const onTouchMove = (e) => {
      if (isInteractive(e.target)) return;
      if (isBusyRef.current) {
        e.preventDefault();
        return;
      }
      if (touchStartYRef.current === null || e.touches.length !== 1) return;
      const diff = touchStartYRef.current - e.touches[0].clientY;
      if (Math.abs(diff) < 10) return;

      if (activeRoomRef.current === 4 && reviewPanelRef.current) {
        const rp = reviewPanelRef.current;
        const canDown = rp.scrollTop + rp.clientHeight < rp.scrollHeight - 4;
        if ((diff > 0 && canDown) || (diff < 0 && rp.scrollTop > 4)) return;
      }

      e.preventDefault();
      if (!touchTriggeredRef.current && Math.abs(diff) >= 24) {
        touchTriggeredRef.current = true;
        handleScrollDirection(diff > 0 ? 1 : -1, e.target);
      }
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
      touchTriggeredRef.current = false;
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });

    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const target = ROOMS[activeRoom];
  const currentSec = VIDEO_SECTIONS[videoStep];

  const roomStyle = (idx) => {
    const r = ROOMS[idx];
    const dx = (r.col - target.col) * 100;
    const dy = (r.row - target.row) * 100;
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      transform: `translate3d(${dx}vw, ${dy}dvh, 0)`,
      opacity: idx === activeRoom ? 1 : 0,
      pointerEvents: idx === activeRoom ? 'auto' : 'none',
      transition: 'transform 0.95s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.75s ease',
      zIndex: 10,
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#121212' }}>
      {/* Room (0, 0): Sleek Curvy Quote */}
      <section
        style={{
          ...roomStyle(0),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '96px 24px 54px 24px',
          background: 'radial-gradient(circle at 50% 42%, #1D1A14 0%, #121212 72%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, filter: 'blur(20px)' }}
          animate={
            revealed
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 28, filter: 'blur(20px)' }
          }
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', maxWidth: '960px' }}
        >
          <blockquote
            style={{
              margin: 0,
              padding: '2.2rem 2.4rem 1.8rem 2.4rem',
              borderTop: '1px solid rgba(212,175,55,0.35)',
              borderBottom: '1px solid rgba(212,175,55,0.35)',
              background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06), transparent 72%)',
            }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 'clamp(3rem, 5.5vw, 5rem)', color: 'rgba(212,175,55,0.55)', display: 'block', textAlign: 'left', lineHeight: 0.45, marginBottom: '0.7rem' }}>
              “
            </span>
            <h1 style={{ margin: 0, lineHeight: 1.25, fontWeight: 400 }}>
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(3.3rem, 7.2vw, 6.2rem)', color: '#D4AF37', textShadow: '0 4px 28px rgba(212,175,55,0.38)', paddingRight: '6px' }}>
                Flavour
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.25rem, 2.5vw, 2.1rem)', fontStyle: 'italic', fontWeight: 300, color: '#E6DAC8' }}>
                , that comes{' '}
              </span>
              <span style={{ fontFamily: "'Parisienne', cursive", fontSize: 'clamp(2.3rem, 4.6vw, 3.8rem)', color: '#F5EFE6' }}>
                Alive{' '}
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.25rem, 2.5vw, 2.1rem)', fontStyle: 'italic', fontWeight: 300, color: '#E6DAC8' }}>
                After{' '}
              </span>
              <span
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                  background: 'linear-gradient(180deg, #FFF5DC 0%, #D4AF37 58%, #9A7418 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  padding: '0 6px',
                }}
              >
                Darkness
              </span>
            </h1>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 'clamp(3rem, 5.5vw, 5rem)', color: 'rgba(212,175,55,0.55)', display: 'block', textAlign: 'right', lineHeight: 0.45, marginTop: '0.7rem' }}>
              ”
            </span>
            <div style={{ marginTop: '1.1rem', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', letterSpacing: '3.5px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>
              — Waqar Foodies
            </div>
          </blockquote>
          <div style={{ marginTop: '1.8rem', color: 'rgba(245,239,230,0.48)', letterSpacing: '2px' }}>↓</div>
        </motion.div>
      </section>

      {/* Room (0, 1): Burger Prep Full-Screen Showcase */}
      <section
        style={{
          ...roomStyle(1),
          background: currentSec.bg,
          transition: 'transform 0.95s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.75s ease, background 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <video
            ref={videoRef}
            src="/static/burger_prep.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              height: 'min(92dvh, 92vw)',
              width: 'auto',
              maxWidth: '100vw',
              objectFit: 'contain',
              WebkitMaskImage: 'radial-gradient(ellipse 54% 68% at 50% 50%, #000 54%, rgba(0,0,0,0.45) 78%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 54% 68% at 50% 50%, #000 54%, rgba(0,0,0,0.45) 78%, transparent 100%)',
              transition: 'opacity 0.18s ease',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 4,
            width: '100%',
            maxWidth: '1380px',
            padding: '72px 3.5vw 0 3.5vw',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            alignItems: 'center',
            gap: '2rem',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            key={`left-${videoStep}`}
            initial={{ opacity: 0, y: 18, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '1.2rem 1.4rem',
              borderLeft: '2px solid rgba(212,175,55,0.65)',
              background: 'linear-gradient(90deg, rgba(14,13,11,0.65), transparent)',
              borderRadius: '0 14px 14px 0',
            }}
          >
            <div style={{ fontSize: '0.76rem', letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '0.45rem', fontWeight: 600 }}>
              {currentSec.source}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.45rem, 2.8vw, 2.6rem)', margin: 0, color: '#F5EFE6', lineHeight: 1.18 }}>
              {currentSec.sub}
            </h2>
          </motion.div>

          <div style={{ minHeight: '220px' }} />

          <motion.div
            key={`right-${videoStep}`}
            initial={{ opacity: 0, y: 18, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              textAlign: 'right',
              padding: '1.2rem 1.4rem',
              borderRight: '2px solid rgba(212,175,55,0.65)',
              background: 'linear-gradient(-90deg, rgba(14,13,11,0.65), transparent)',
              borderRadius: '14px 0 0 14px',
            }}
          >
            <p style={{ color: '#EAE0D2', fontSize: 'clamp(0.9rem, 1.25vw, 1.12rem)', lineHeight: 1.65, margin: 0 }}>
              {currentSec.body}
            </p>
          </motion.div>
        </div>

        <div style={{ position: 'absolute', right: '16px', top: '54%', transform: 'translateY(-50%)', zIndex: 6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {VIDEO_SECTIONS.map((_, idx) => (
            <div
              key={idx}
              onClick={() => !isBusyRef.current && goToVideoStep(idx)}
              style={{
                width: '8px',
                height: idx === videoStep ? '26px' : '8px',
                borderRadius: '999px',
                background: idx === videoStep ? '#D4AF37' : 'rgba(245,239,230,0.25)',
                border: '1px solid rgba(212,175,55,0.45)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </section>

      {/* Room (1, 1): Order Now Spotlight */}
      <section
        style={{
          ...roomStyle(2),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '96px 24px 54px 24px',
          background: 'radial-gradient(circle at 50% 42%, #1D1A14 0%, #121212 72%)',
        }}
      >
        <motion.div
          key={`cta-${activeRoom === 2}`}
          initial={{ opacity: 0, y: 28, filter: 'blur(16px)' }}
          animate={activeRoom === 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: '820px', width: '100%', textAlign: 'center' }}
        >
          <h2 className="wf-section-title">
            Crafted For <span>Tonight</span>
          </h2>
          <p className="wf-section-sub">
            Freshly seared over live charcoal and delivered piping hot after sundown.
          </p>

          <div className="wf-menu-grid" style={{ textAlign: 'left', marginBottom: '1.8rem' }}>
            <div className="wf-card">
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700 }}>Tower Burger</div>
              <div style={{ color: 'var(--wf-gold-bright)', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>500/- PKR</div>
              <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Double flame-kissed beef patties, aged cheddar melt, garden greens, and house burger sauce on sesame brioche.
              </div>
            </div>
            <div className="wf-card">
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700 }}>Chicken Paratha Roll</div>
              <div style={{ color: 'var(--wf-gold-bright)', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>350/- PKR</div>
              <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Crispy golden paratha layered with chargrilled chicken tikka, red onions, and signature mint-garlic crema.
              </div>
            </div>
          </div>

          <button type="button" className="wf-btn-gold" style={{ minWidth: '220px' }} onClick={() => navigate('/menu')}>
            Order Now
          </button>
        </motion.div>
      </section>

      {/* Room (1, 2): Testimonials */}
      <section
        style={{
          ...roomStyle(3),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '96px 24px 54px 24px',
          background: 'radial-gradient(circle at 50% 42%, #1D1A14 0%, #121212 72%)',
        }}
      >
        <motion.div
          key={`testi-${activeRoom === 3}`}
          initial={{ opacity: 0, y: 28, filter: 'blur(16px)' }}
          animate={activeRoom === 3 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: '780px' }}
        >
          <h2 className="wf-section-title">
            Voices After <span>Darkness</span>
          </h2>
          <p className="wf-section-sub">Swipe inside to browse reviews, or outside to continue.</p>
          <TestimonialsBox />
        </motion.div>
      </section>

      {/* Room (0, 2): Submit Review */}
      <section
        ref={reviewPanelRef}
        style={{
          ...roomStyle(4),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '104px 24px 64px 24px',
          overflowY: 'auto',
          background: 'radial-gradient(circle at 50% 42%, #1D1A14 0%, #121212 72%)',
        }}
      >
        <motion.div
          key={`rev-${activeRoom === 4}`}
          initial={{ opacity: 0, y: 28, filter: 'blur(16px)' }}
          animate={activeRoom === 4 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        >
          <ReviewForm />
        </motion.div>
      </section>

      {/* Lower-Left 2D Spatial Mini-Map HUD */}
      <div
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '22px',
          zIndex: 950,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(18, 17, 15, 0.84)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212, 175, 55, 0.34)',
          borderRadius: '16px',
          padding: '8px 14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 10px)',
            gridTemplateRows: 'repeat(3, 10px)',
            gap: '5px',
          }}
        >
          {ROOMS.map((r, idx) => (
            <div
              key={r.title}
              title={r.title}
              onClick={() => !isBusyRef.current && goToRoom(idx)}
              style={{
                gridColumn: r.col + 1,
                gridRow: r.row + 1,
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                cursor: 'pointer',
                background: idx === activeRoom ? '#D4AF37' : 'rgba(245,239,230,0.2)',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: idx === activeRoom ? '0 0 10px rgba(212,175,55,0.75)' : 'none',
                transform: idx === activeRoom ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#F5EFE6', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {target.title}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#D4AF37', letterSpacing: '0.8px' }}>
            {target.dir}
          </span>
        </div>
      </div>
    </div>
  );
}
