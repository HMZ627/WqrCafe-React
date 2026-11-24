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

// Tightened scene windows with safe buffers so sections never bleed into each other
const VIDEO_SECTIONS = [
  {
    startPct: 0.0,
    endPct: 0.145, // Bun preparation in wheat field (00:00 - ~00:01.4)
    source: 'Sunlit Golden Wheat Fields',
    sub: 'Toasted Sesame Brioche Bun',
    body: 'Harvested from golden wheat fields and baked pillowy-soft with toasted sesame seeds, splitting open in warm millstone mist.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(79, 56, 20, 0.84) 0%, rgba(20, 17, 12, 0.9) 65%, rgba(11, 10, 8, 0.94) 100%)',
  },
  {
    startPct: 0.205,
    endPct: 0.275, // Garden soil & vegetables (around 00:02)
    source: 'Morning Dew Vegetable Farms',
    sub: 'Crisp Lettuce, Vine Tomatoes & Red Onions',
    body: 'Dew-fresh emerald lettuce, sun-ripened tomato slices, and sharp purple onion rings cascading straight from fertile garden soil.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(21, 61, 35, 0.84) 0%, rgba(13, 21, 16, 0.9) 65%, rgba(10, 12, 11, 0.94) 100%)',
  },
  {
    startPct: 0.335,
    endPct: 0.465, // Cow pastures, milk splash & double cheddar (00:03 - 00:04)
    source: 'Lush Green Dairy Pastures',
    sub: 'Creamy Double Cheddar & Crisp Pickles',
    body: 'Wholesome pasture milk churned into two rich, velvety cheddar slices, layered generously over tangy dill pickles and greens.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(46, 63, 25, 0.84) 0%, rgba(19, 21, 14, 0.9) 65%, rgba(11, 12, 9, 0.94) 100%)',
  },
  {
    startPct: 0.525,
    endPct: 0.665, // Twilight open-flame grill & double patties (00:05 - 00:06)
    source: 'Twilight Wood-Fired Grill',
    sub: 'Double Charcoal-Seared Beef Patties',
    body: 'Two thick, hand-pressed beef patties seared at dusk over roaring hardwood flames—locking in smoky char and sizzling juices.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(82, 26, 14, 0.84) 0%, rgba(22, 13, 12, 0.9) 65%, rgba(12, 9, 9, 0.94) 100%)',
  },
  {
    startPct: 0.735,
    endPct: 0.985, // Spice burst into final Tower Burger in darkness (00:07 - 00:09)
    source: 'Waqar Foodies — After Darkness',
    sub: 'The Signature Double Tower Burger',
    body: 'Crowned with crushed peppercorns, signature house burger sauce, and warm golden bokeh—crafted to come alive after darkness.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(54, 36, 11, 0.84) 0%, rgba(17, 15, 12, 0.9) 65%, rgba(10, 10, 9, 0.94) 100%)',
  },
];

export default function SpatialShowcase({ revealed }) {
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(0);
  const [videoStep, setVideoStep] = useState(0);

  const activeRoomRef = useRef(0);
  const prevRoomRef = useRef(0);
  const videoStepRef = useRef(0);
  const isBusyRef = useRef(false);
  const busyTimerRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const reviewPanelRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchTriggeredRef = useRef(false);

  activeRoomRef.current = activeRoom;
  videoStepRef.current = videoStep;

  function setBusyFor(ms) {
    clearTimeout(busyTimerRef.current);
    isBusyRef.current = true;
    busyTimerRef.current = setTimeout(() => {
      isBusyRef.current = false;
    }, ms);
  }

  function playPartSmoothly(stepIdx) {
    cancelAnimationFrame(animFrameRef.current);
    const vid = videoRef.current;
    if (!vid) {
      isBusyRef.current = false;
      return;
    }

    const runAfterMeta = () => {
      const duration = vid.duration;
      if (!duration || Number.isNaN(duration)) {
        isBusyRef.current = false;
        return;
      }

      const s = VIDEO_SECTIONS[stepIdx];
      const startTime = Math.max(0, s.startPct * duration);
      const endTime = Math.min(duration - 0.04, s.endPct * duration);

      vid.pause();
      vid.style.opacity = '0.25';

      let started = false;
      const onSeeked = () => {
        if (started) return;
        started = true;
        vid.removeEventListener('seeked', onSeeked);

        vid.style.opacity = '0.96';
        vid.muted = true;
        vid.playbackRate = 0.88;
        let slowedDown = false;
        const span = Math.max(0.15, endTime - startTime);

        vid.play().catch(() => {});

        function monitor() {
          const cur = vid.currentTime;
          const progress = Math.max(0, Math.min(1, (cur - startTime) / span));

          // Single clean deceleration step avoids browser decoder stutters
          if (!slowedDown && progress >= 0.65) {
            slowedDown = true;
            vid.playbackRate = 0.52;
          }

          if (cur >= endTime - 0.02 || progress >= 0.99 || vid.ended) {
            vid.pause();
            vid.playbackRate = 0.88;
            clearTimeout(busyTimerRef.current);
            isBusyRef.current = false;
            return;
          }

          animFrameRef.current = requestAnimationFrame(monitor);
        }

        animFrameRef.current = requestAnimationFrame(monitor);
      };

      vid.addEventListener('seeked', onSeeked);
      if (Math.abs(vid.currentTime - startTime) < 0.03) {
        onSeeked();
      } else {
        vid.currentTime = startTime;
        setTimeout(onSeeked, 350);
      }
    };

    if (vid.readyState >= 1 && vid.duration) {
      runAfterMeta();
    } else {
      vid.addEventListener('loadedmetadata', runAfterMeta, { once: true });
    }
  }

  function goToVideoStep(nextIdx) {
    if (nextIdx < 0 || nextIdx >= VIDEO_SECTIONS.length || nextIdx === videoStepRef.current) return;
    setBusyFor(3200);
    setVideoStep(nextIdx);
    playPartSmoothly(nextIdx);
  }

  function goToRoom(nextRoom) {
    if (nextRoom < 0 || nextRoom >= ROOMS.length || nextRoom === activeRoomRef.current) return;
    const prev = activeRoomRef.current;
    prevRoomRef.current = prev;
    setActiveRoom(nextRoom);

    if (nextRoom === 1) {
      setBusyFor(3200);
      const targetStep = prev === 0 ? 0 : videoStepRef.current;
      setVideoStep(targetStep);
      setTimeout(() => playPartSmoothly(targetStep), 420);
    } else {
      setBusyFor(950);
      cancelAnimationFrame(animFrameRef.current);
      videoRef.current?.pause();
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
      clearTimeout(busyTimerRef.current);
    };
  }, []);

  const target = ROOMS[activeRoom];
  const currentSec = VIDEO_SECTIONS[videoStep];

  // Only active & leaving rooms stay visible while sliding; far rooms stay hidden for 0 GPU cost
  const roomStyle = (idx) => {
    const r = ROOMS[idx];
    const dx = (r.col - target.col) * 100;
    const dy = (r.row - target.row) * 100;
    const isVisible = idx === activeRoom || idx === prevRoomRef.current;
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      transform: `translate3d(${dx}vw, ${dy}dvh, 0)`,
      opacity: 1,
      visibility: isVisible ? 'visible' : 'hidden',
      pointerEvents: idx === activeRoom ? 'auto' : 'none',
      transition: 'transform 0.9s cubic-bezier(0.65, 0, 0.35, 1)',
      willChange: 'transform',
      zIndex: idx === activeRoom ? 12 : 10,
      background: 'transparent',
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'transparent' }}>
      {/* Room (0, 0): Sleek Curvy Quote */}
      <section
        style={{
          ...roomStyle(0),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '96px 24px 54px 24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
          animate={
            revealed
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 24, filter: 'blur(12px)' }
          }
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', maxWidth: '960px' }}
        >
          <blockquote
            style={{
              margin: 0,
              padding: '2.2rem 2.4rem 1.8rem 2.4rem',
              borderTop: '1px solid rgba(212,175,55,0.4)',
              borderBottom: '1px solid rgba(212,175,55,0.4)',
              background: 'radial-gradient(circle at 50% 50%, rgba(12,11,9,0.72), rgba(12,11,9,0.25) 75%)',
              borderRadius: '18px',
            }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 'clamp(3rem, 5.5vw, 5rem)', color: 'rgba(212,175,55,0.65)', display: 'block', textAlign: 'left', lineHeight: 0.45, marginBottom: '0.7rem' }}>
              “
            </span>
            <h1 style={{ margin: 0, lineHeight: 1.25, fontWeight: 400 }}>
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(3.3rem, 7.2vw, 6.2rem)', color: '#F0CA5A', textShadow: '0 4px 28px rgba(0,0,0,0.85)', paddingRight: '6px' }}>
                Flavour
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.25rem, 2.5vw, 2.1rem)', fontStyle: 'italic', fontWeight: 300, color: '#E6DAC8' }}>
                , that comes{' '}
              </span>
              <span style={{ fontFamily: "'Parisienne', cursive", fontSize: 'clamp(2.3rem, 4.6vw, 3.8rem)', color: '#FFFDF8' }}>
                Alive{' '}
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.25rem, 2.5vw, 2.1rem)', fontStyle: 'italic', fontWeight: 300, color: '#E6DAC8' }}>
                After{' '}
              </span>
              <span
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                  background: 'linear-gradient(180deg, #FFF5DC 0%, #F0CA5A 58%, #B88E24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  padding: '0 6px',
                }}
              >
                Darkness
              </span>
            </h1>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 'clamp(3rem, 5.5vw, 5rem)', color: 'rgba(212,175,55,0.65)', display: 'block', textAlign: 'right', lineHeight: 0.45, marginTop: '0.7rem' }}>
              ”
            </span>
            <div style={{ marginTop: '1.1rem', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', letterSpacing: '3.5px', textTransform: 'uppercase', color: '#F0CA5A', fontWeight: 600 }}>
              — Waqar Foodies
            </div>
          </blockquote>
          <div style={{ marginTop: '1.8rem', color: 'rgba(245,239,230,0.55)', letterSpacing: '2px' }}>↓</div>
        </motion.div>
      </section>

      {/* Room (0, 1): Burger Prep Full-Screen Showcase */}
      <section
        style={{
          ...roomStyle(1),
          background: currentSec.bg,
          transition: 'transform 0.9s cubic-bezier(0.65, 0, 0.35, 1), background 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
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
              transition: 'opacity 0.16s ease',
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
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '1.2rem 1.4rem',
              borderLeft: '2px solid rgba(212,175,55,0.75)',
              background: 'linear-gradient(90deg, rgba(12,11,9,0.78), transparent)',
              borderRadius: '0 14px 14px 0',
            }}
          >
            <div style={{ fontSize: '0.76rem', letterSpacing: '2.2px', textTransform: 'uppercase', color: '#F0CA5A', marginBottom: '0.45rem', fontWeight: 600 }}>
              {currentSec.source}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.45rem, 2.8vw, 2.6rem)', margin: 0, color: '#F5EFE6', lineHeight: 1.18 }}>
              {currentSec.sub}
            </h2>
          </motion.div>

          <div style={{ minHeight: '220px' }} />

          <motion.div
            key={`right-${videoStep}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              textAlign: 'right',
              padding: '1.2rem 1.4rem',
              borderRight: '2px solid rgba(212,175,55,0.75)',
              background: 'linear-gradient(-90deg, rgba(12,11,9,0.78), transparent)',
              borderRadius: '14px 0 0 14px',
            }}
          >
            <p style={{ color: '#F5EFE6', fontSize: 'clamp(0.9rem, 1.25vw, 1.12rem)', lineHeight: 1.65, margin: 0 }}>
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
        }}
      >
        <div style={{ maxWidth: '820px', width: '100%', textAlign: 'center' }}>
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
        </div>
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
        }}
      >
        <div style={{ width: '100%', maxWidth: '780px' }}>
          <h2 className="wf-section-title">
            Voices After <span>Darkness</span>
          </h2>
          <p className="wf-section-sub">Swipe inside to browse reviews, or outside to continue.</p>
          <TestimonialsBox />
        </div>
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
        }}
      >
        <div style={{ width: '100%' }}>
          <ReviewForm />
        </div>
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
          background: 'rgba(18, 17, 15, 0.92)',
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
