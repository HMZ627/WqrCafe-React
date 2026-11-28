import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TestimonialsBox from './TestimonialsBox';
import ReviewForm from './ReviewForm';
import OrderButton from './OrderButton';

const ROOMS = [
  { camCol: 0, camRow: 0, hudCol: 0, hudRow: 0, title: 'Quote', dir: 'Next ↓' },
  { camCol: 0, camRow: 1, hudCol: 0, hudRow: 1, title: 'Craft', dir: '↓  |  Next →' },
  { camCol: 1, camRow: 1, hudCol: 1, hudRow: 1, title: 'Signature', dir: 'Next ↓' },
  { camCol: 1, camRow: 2, hudCol: 1, hudRow: 2, title: 'Testimonials', dir: 'Next ↓' },
  { camCol: 1, camRow: 2, hudCol: 0, hudRow: 2, title: 'Review', dir: 'Back ↑' },
];

const VIDEO_SECTIONS = [
  {
    startPct: 0.0,
    endPct: 0.145,
    source: 'Sunlit Golden Wheat Fields',
    sub: 'Toasted Sesame Brioche Bun',
    body: 'Harvested from golden wheat fields and baked pillowy-soft with toasted sesame seeds, splitting open in warm millstone mist.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(79, 56, 20, 0.84) 0%, rgba(20, 17, 12, 0.9) 65%, rgba(11, 10, 8, 0.94) 100%)',
  },
  {
    startPct: 0.205,
    endPct: 0.275,
    source: 'Morning Dew Vegetable Farms',
    sub: 'Crisp Lettuce, Vine Tomatoes & Red Onions',
    body: 'Dew-fresh emerald lettuce, sun-ripened tomato slices, and sharp purple onion rings cascading straight from fertile garden soil.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(21, 61, 35, 0.84) 0%, rgba(13, 21, 16, 0.9) 65%, rgba(10, 12, 11, 0.94) 100%)',
  },
  {
    startPct: 0.335,
    endPct: 0.465,
    source: 'Lush Green Dairy Pastures',
    sub: 'Creamy Double Cheddar & Crisp Pickles',
    body: 'Wholesome pasture milk churned into two rich, velvety cheddar slices, layered generously over tangy dill pickles and greens.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(46, 63, 25, 0.84) 0%, rgba(19, 21, 14, 0.9) 65%, rgba(11, 12, 9, 0.94) 100%)',
  },
  {
    startPct: 0.525,
    endPct: 0.665,
    source: 'Twilight Wood-Fired Grill',
    sub: 'Double Charcoal-Seared Beef Patties',
    body: 'Two thick, hand-pressed beef patties seared at dusk over roaring hardwood flames—locking in smoky char and sizzling juices.',
    bg: 'radial-gradient(circle at 50% 48%, rgba(82, 26, 14, 0.84) 0%, rgba(22, 13, 12, 0.9) 65%, rgba(12, 9, 9, 0.94) 100%)',
  },
  {
    startPct: 0.735,
    endPct: 0.985,
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
  const playTokenRef = useRef(0);
  const seekFallbackRef = useRef(null);

  const room2Ref = useRef(null);
  const room3Ref = useRef(null);
  const room4Ref = useRef(null);

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
    const token = ++playTokenRef.current;
    cancelAnimationFrame(animFrameRef.current);
    clearTimeout(seekFallbackRef.current);

    const vid = videoRef.current;
    if (!vid) return;

    const runAfterMeta = () => {
      if (token !== playTokenRef.current) return;
      const duration = vid.duration;
      if (!duration || Number.isNaN(duration)) return;

      const s = VIDEO_SECTIONS[stepIdx];
      const startTime = Math.max(0, s.startPct * duration);
      const endTime = Math.min(duration - 0.04, s.endPct * duration);

      vid.pause();
      vid.style.opacity = '0.3';

      let started = false;
      const onSeeked = () => {
        if (started || token !== playTokenRef.current) return;
        started = true;
        vid.removeEventListener('seeked', onSeeked);
        clearTimeout(seekFallbackRef.current);

        vid.style.opacity = '0.96';
        vid.muted = true;
        vid.playbackRate = 0.88;
        let slowedDown = false;
        const span = Math.max(0.15, endTime - startTime);

        vid.play().catch(() => {});

        function monitor() {
          if (token !== playTokenRef.current) return;
          const cur = vid.currentTime;
          const progress = Math.max(0, Math.min(1, (cur - startTime) / span));

          if (!slowedDown && progress >= 0.65) {
            slowedDown = true;
            vid.playbackRate = 0.52;
          }

          if (cur >= endTime - 0.02 || progress >= 0.99 || vid.ended) {
            vid.pause();
            vid.playbackRate = 0.88;
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
        seekFallbackRef.current = setTimeout(onSeeked, 300);
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
    setBusyFor(260);
    setVideoStep(nextIdx);
    playPartSmoothly(nextIdx);
  }

  function goToRoom(nextRoom) {
    if (nextRoom < 0 || nextRoom >= ROOMS.length || nextRoom === activeRoomRef.current) return;
    const prev = activeRoomRef.current;
    prevRoomRef.current = prev;
    setActiveRoom(nextRoom);

    if (nextRoom === 1) {
      setBusyFor(700);
      const targetStep = prev === 0 ? 0 : videoStepRef.current;
      setVideoStep(targetStep);
      setTimeout(() => {
        if (activeRoomRef.current === 1) playPartSmoothly(targetStep);
      }, 360);
    } else {
      setBusyFor(850);
      ++playTokenRef.current;
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(seekFallbackRef.current);
      videoRef.current?.pause();
    }
  }

  function getActiveScrollPanel() {
    if (activeRoomRef.current === 2) return room2Ref.current;
    if (activeRoomRef.current === 3) return room3Ref.current;
    if (activeRoomRef.current === 4) return room4Ref.current;
    return null;
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
      const panel = room4Ref.current;
      if (dir < 0 && (!panel || panel.scrollTop <= 4)) {
        goToRoom(3);
      }
    }
  }

  useEffect(() => {
    const isInteractive = (target) =>
      Boolean(
        window.location.pathname !== '/' ||
          document.querySelector('.wf-modal-backdrop') ||
          document.querySelector('.wf-bag-popover') ||
          target?.closest?.('textarea, input, button, a, .wf-navbar')
      );

    const canInternalScroll = (deltaY) => {
      const panel = getActiveScrollPanel();
      if (!panel) return false;
      const canDown = panel.scrollTop + panel.clientHeight < panel.scrollHeight - 4;
      const canUp = panel.scrollTop > 4;
      return (deltaY > 0 && canDown) || (deltaY < 0 && canUp);
    };

    const onWheel = (e) => {
      if (isInteractive(e.target) || Math.abs(e.deltaY) < 4) return;
      if (canInternalScroll(e.deltaY)) return;
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

      if (canInternalScroll(diff)) return;

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
      clearTimeout(seekFallbackRef.current);
    };
  }, []);

  const target = ROOMS[activeRoom];
  const currentSec = VIDEO_SECTIONS[videoStep];

  const roomStyle = (idx) => {
    const r = ROOMS[idx];
    const dx = (r.camCol - target.camCol) * 100;
    const dy = (r.camRow - target.camRow) * 100;

    // Room 3 (Testimonials): NEVER uses opacity < 1 or filter so #wf-testi-box refracts immediately at 0ms
    if (idx === 3) {
      const inBgBehindReview = activeRoom === 4;
      const isVisible = activeRoom === 3 || activeRoom === 4 || prevRoomRef.current === 3;
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        transform: `translate3d(${dx}vw, ${dy}dvh, 0) scale(${inBgBehindReview ? 0.84 : 1})`,
        opacity: 1,
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: activeRoom === 3 ? 'auto' : 'none',
        transition: 'transform 0.85s cubic-bezier(0.65, 0, 0.35, 1)',
        willChange: 'transform',
        zIndex: inBgBehindReview ? 11 : activeRoom === 3 ? 12 : 10,
        background: 'transparent',
      };
    }

    // Room 4 (Review): enters with opacity: 1 (zero backdrop-filter delay); scales out cleanly when returning to Room 3
    if (idx === 4) {
      const isActive = activeRoom === 4;
      const isLeaving = !isActive && prevRoomRef.current === 4;
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        transform: `translate3d(${dx}vw, ${dy}dvh, 0) scale(${isActive ? 1 : 1.14})`,
        opacity: isActive ? 1 : 0,
        visibility: isActive || isLeaving ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none',
        transition: isActive
          ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease',
        willChange: 'transform',
        zIndex: 14,
        background: 'transparent',
      };
    }

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
      {/* Room (0, 0): Sleek Curvy Quote (glass card stays opacity: 1 so refraction is instant at 0ms) */}
      <section className="wf-room-section" style={roomStyle(0)}>
        <div className="wf-room-inner" style={{ textAlign: 'center', maxWidth: '960px' }}>
          <blockquote
            className="wf-glass"
            style={{
              margin: 0,
              padding: '2.2rem 2rem 1.8rem 2rem',
              borderRadius: '26px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                  color: 'rgba(255,246,220,0.55)',
                  display: 'block',
                  textAlign: 'left',
                  lineHeight: 0.45,
                  marginBottom: '0.7rem',
                }}
              >
                “
              </span>
              <h1 style={{ margin: 0, lineHeight: 1.25, fontWeight: 400 }}>
                <span
                  style={{
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: 'clamp(3.1rem, 7.2vw, 6.2rem)',
                    color: '#F0CA5A',
                    textShadow: '0 4px 24px rgba(0,0,0,0.75)',
                    paddingRight: '6px',
                  }}
                >
                  Flavour
                </span>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 'clamp(1.2rem, 2.5vw, 2.1rem)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: '#F5EFE6',
                  }}
                >
                  , that comes{' '}
                </span>
                <span
                  style={{
                    fontFamily: "'Parisienne', cursive",
                    fontSize: 'clamp(2.2rem, 4.6vw, 3.8rem)',
                    color: '#FFFFFF',
                  }}
                >
                  Alive{' '}
                </span>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 'clamp(1.2rem, 2.5vw, 2.1rem)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: '#F5EFE6',
                  }}
                >
                  After{' '}
                </span>
                <span
                  style={{
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: 'clamp(3rem, 7vw, 6rem)',
                    background: 'linear-gradient(180deg, #FFF8E6 0%, #F0CA5A 58%, #C99A27 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    padding: '0 6px',
                  }}
                >
                  Darkness
                </span>
              </h1>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                  color: 'rgba(255,246,220,0.55)',
                  display: 'block',
                  textAlign: 'right',
                  lineHeight: 0.45,
                  marginTop: '0.7rem',
                }}
              >
                ”
              </span>
              <div
                style={{
                  marginTop: '1.1rem',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  letterSpacing: '3.5px',
                  textTransform: 'uppercase',
                  color: '#F0CA5A',
                  fontWeight: 600,
                }}
              >
                — Waqar Foodies
              </div>
            </motion.div>
          </blockquote>
          <div style={{ marginTop: '1.4rem', color: 'rgba(245,239,230,0.55)', letterSpacing: '2px' }}>
            ↓
          </div>
        </div>
      </section>

      {/* Room (0, 1): Burger Prep Full-Screen Showcase */}
      <section
        style={{
          ...roomStyle(1),
          background: currentSec.bg,
          transition:
            'transform 0.9s cubic-bezier(0.65, 0, 0.35, 1), background 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <video
            ref={videoRef}
            src="/static/burger_prep.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              height: 'min(82dvh, 88vw)',
              width: 'auto',
              maxWidth: '100vw',
              objectFit: 'contain',
              WebkitMaskImage:
                'radial-gradient(ellipse 54% 68% at 50% 50%, #000 54%, rgba(0,0,0,0.45) 78%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 54% 68% at 50% 50%, #000 54%, rgba(0,0,0,0.45) 78%, transparent 100%)',
              transition: 'opacity 0.16s ease',
            }}
          />
        </div>

        <div className="wf-craft-grid">
          <div
            className="wf-glass wf-craft-side-card"
            style={{
              padding: '1.35rem 1.55rem',
              borderRadius: '20px',
            }}
          >
            <motion.div
              key={`left-${videoStep}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  letterSpacing: '2.2px',
                  textTransform: 'uppercase',
                  color: '#F0CA5A',
                  marginBottom: '0.45rem',
                  fontWeight: 600,
                }}
              >
                {currentSec.source}
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.25rem, 2.8vw, 2.6rem)',
                  margin: 0,
                  color: '#F5EFE6',
                  lineHeight: 1.18,
                }}
              >
                {currentSec.sub}
              </h2>
            </motion.div>
          </div>

          <div className="wf-craft-spacer" style={{ minHeight: '220px' }} />

          <div
            className="wf-glass wf-craft-side-card"
            style={{
              textAlign: 'right',
              padding: '1.35rem 1.55rem',
              borderRadius: '20px',
            }}
          >
            <motion.div
              key={`right-${videoStep}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                style={{
                  color: '#F5EFE6',
                  fontSize: 'clamp(0.86rem, 1.25vw, 1.12rem)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {currentSec.body}
              </p>
            </motion.div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: '14px',
            top: '54%',
            transform: 'translateY(-50%)',
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
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

      {/* Room (1, 1): Signatures Spotlight */}
      <section ref={room2Ref} className="wf-room-section" style={roomStyle(2)}>
        <div className="wf-room-inner" style={{ maxWidth: '820px', textAlign: 'center' }}>
          <h2 className="wf-section-title">
            Crafted For <span>Tonight</span>
          </h2>
          <p className="wf-section-sub" style={{ lineHeight: 1.6 }}>
            Freshly seared over fire and delivered piping hot after sundown, just for{' '}
            <span
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: 'clamp(1.75rem, 2.8vw, 2.35rem)',
                color: 'var(--wf-gold-bright)',
                paddingLeft: '4px',
                verticalAlign: 'middle',
              }}
            >
              You
            </span>
          </p>

          <div className="wf-menu-grid" style={{ textAlign: 'left', marginBottom: '1.6rem' }}>
            <div className="wf-card">
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700 }}>
                Tower Burger
              </div>
              <div style={{ color: 'var(--wf-gold-bright)', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>
                500/- PKR
              </div>
              <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Two fire-charred prime patties stacked high with double melted cheddar, crisp garden greens, vine tomatoes, tangy pickles, and house sauce inside toasted sesame brioche.
              </div>
            </div>
            <div className="wf-card">
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700 }}>
                Chicken Paratha Roll
              </div>
              <div style={{ color: 'var(--wf-gold-bright)', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>
                350/- PKR
              </div>
              <div style={{ color: 'var(--wf-cream-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Crispy golden paratha layered with chargrilled chicken tikka, red onions, and signature mint-garlic crema.
              </div>
            </div>
          </div>

          <OrderButton style={{ minWidth: '220px' }} onClick={() => navigate('/menu')}>
            Order Now
          </OrderButton>
        </div>
      </section>

      {/* Room (1, 2) Background Layer: Voices of our Regulars (stays at opacity: 1, no filter on self) */}
      <section ref={room3Ref} className="wf-room-section" style={roomStyle(3)}>
        <div className="wf-room-inner" style={{ maxWidth: '780px' }}>
          <h2 className="wf-section-title" style={{ marginBottom: '1.5rem' }}>
            Voices of our <span>Regulars</span>
          </h2>
          <TestimonialsBox />
        </div>
      </section>

      {/* Between-layer blur scrim: blurs Room 3 cleanly when Room 4 (Review) is active */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 13,
          pointerEvents: 'none',
          background: 'rgba(11, 10, 8, 0.54)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          opacity: activeRoom === 4 ? 1 : 0,
          transition: 'opacity 0.55s ease',
        }}
      />

      {/* Room (1, 2) Foreground Depth Layer: Submit Review */}
      <section ref={room4Ref} className="wf-room-section" style={roomStyle(4)}>
        <div className="wf-room-inner">
          <ReviewForm />
        </div>
      </section>

      {/* Lower-Left Liquid Glass 2D Spatial Mini-Map HUD */}
      <div className="wf-glass wf-hud-glass">
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
                gridColumn: r.hudCol + 1,
                gridRow: r.hudRow + 1,
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                cursor: 'pointer',
                background: idx === activeRoom ? '#D4AF37' : 'rgba(245,239,230,0.22)',
                border: '1px solid rgba(255,246,220,0.3)',
                boxShadow: idx === activeRoom ? '0 0 10px rgba(212,175,55,0.75)' : 'none',
                transform: idx === activeRoom ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#F5EFE6',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            {target.title}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#F0CA5A', letterSpacing: '0.8px' }}>
            {target.dir}
          </span>
        </div>
      </div>
    </div>
  );
}
