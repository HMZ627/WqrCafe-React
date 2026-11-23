import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TestimonialsBox() {
  const { reviews } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef(null);
  const touchHandledRef = useRef(false);

  function startAuto() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % reviews.length);
    }, 3400);
  }

  function pauseAndResumeAuto(delay = 5500) {
    clearInterval(timerRef.current);
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      startAuto();
    }, delay);
  }

  useEffect(() => {
    setActiveIdx(0);
    startAuto();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pauseTimerRef.current);
    };
  }, [reviews.length]);

  function step(dir) {
    setActiveIdx((prev) => (prev + dir + reviews.length) % reviews.length);
    pauseAndResumeAuto();
  }

  const cardStyleForPos = (pos) => {
    const base = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '86%',
      maxWidth: '580px',
      padding: '1.3rem 1.6rem',
      borderRadius: '18px',
      background: 'linear-gradient(145deg, #1E1C17, #161512)',
      border: '1px solid rgba(212, 175, 55, 0.2)',
      transition: 'all 0.72s cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: 'pointer',
    };

    if (pos === 0) {
      return {
        ...base,
        transform: 'translate(-50%, -50%) scale(1) rotateX(0deg)',
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 5,
        borderColor: '#D4AF37',
        boxShadow: '0 18px 42px rgba(0,0,0,0.65), 0 0 24px rgba(212,175,55,0.18)',
      };
    }
    if (pos === -1) {
      return {
        ...base,
        transform: 'translate(-50%, -138%) scale(0.86) rotateX(18deg) skewX(-1.5deg)',
        filter: 'blur(4px) contrast(0.9)',
        opacity: 0.45,
        zIndex: 3,
      };
    }
    if (pos === 1) {
      return {
        ...base,
        transform: 'translate(-50%, 38%) scale(0.86) rotateX(-18deg) skewX(1.5deg)',
        filter: 'blur(4px) contrast(0.9)',
        opacity: 0.45,
        zIndex: 3,
      };
    }
    if (pos === -2) {
      return {
        ...base,
        transform: 'translate(-50%, -215%) scale(0.74) rotateX(28deg) skewX(-3deg)',
        filter: 'blur(8px)',
        opacity: 0.14,
        zIndex: 1,
      };
    }
    if (pos === 2) {
      return {
        ...base,
        transform: 'translate(-50%, 115%) scale(0.74) rotateX(-28deg) skewX(3deg)',
        filter: 'blur(8px)',
        opacity: 0.14,
        zIndex: 1,
      };
    }
    return {
      ...base,
      transform: 'translate(-50%, 260%) scale(0.6)',
      opacity: 0,
      pointerEvents: 'none',
      zIndex: 0,
    };
  };

  return (
    <div
      id="wf-testi-box"
      onWheel={(e) => {
        e.stopPropagation();
        if (Math.abs(e.deltaY) < 6 || wheelLockRef.current) return;
        wheelLockRef.current = true;
        step(e.deltaY > 0 ? 1 : -1);
        setTimeout(() => {
          wheelLockRef.current = false;
        }, 320);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        touchStartYRef.current = e.touches[0].clientY;
        touchHandledRef.current = false;
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        if (touchStartYRef.current === null) return;
        const diff = touchStartYRef.current - e.touches[0].clientY;
        if (!touchHandledRef.current && Math.abs(diff) > 20) {
          touchHandledRef.current = true;
          step(diff > 0 ? 1 : -1);
        }
      }}
      style={{
        position: 'relative',
        height: '380px',
        maxWidth: '740px',
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: '24px',
        background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08), #141311 78%)',
        border: '1px solid rgba(212,175,55,0.22)',
        perspective: '900px',
        userSelect: 'none',
        cursor: 'ns-resize',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'linear-gradient(180deg, #121212 10%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'linear-gradient(0deg, #121212 10%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {reviews.map((rev, idx) => {
        const n = reviews.length;
        let diff = idx - activeIdx;
        if (diff > Math.floor(n / 2)) diff -= n;
        if (diff < -Math.floor(n / 2)) diff += n;
        const pos = Math.abs(diff) <= 2 ? diff : 99;

        return (
          <div
            key={`${rev.name}-${idx}`}
            style={cardStyleForPos(pos)}
            onClick={() => {
              setActiveIdx(idx);
              pauseAndResumeAuto(6000);
            }}
          >
            <div style={{ color: '#F5EFE6', fontSize: '1rem', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '0.7rem' }}>
              “{rev.text}”
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#D4AF37', fontWeight: 700 }}>
              <span>— {rev.name}</span>
              <span style={{ display: 'inline-flex', gap: '3px' }}>
                {Array.from({ length: rev.stars || 5 }).map((_, sIdx) => (
                  <svg key={sIdx} width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
