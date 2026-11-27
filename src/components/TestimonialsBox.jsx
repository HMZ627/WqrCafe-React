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
      padding: '1.35rem 1.65rem',
      borderRadius: '20px',
      background:
        'linear-gradient(135deg, rgba(255, 250, 236, 0.06) 0%, rgba(255, 248, 228, 0.015) 55%, rgba(255, 235, 180, 0.04) 100%)',
      border: '1px solid rgba(255, 246, 220, 0.24)',
      transition:
        'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease, filter 0.65s ease',
      willChange: 'transform, opacity',
      cursor: 'pointer',
      textShadow: '0 2px 14px rgba(0, 0, 0, 0.92), 0 0 6px rgba(0, 0, 0, 0.85)',
    };

    if (pos === 0) {
      return {
        ...base,
        transform: 'translate(-50%, -50%) scale(1) rotateX(0deg)',
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 5,
        borderColor: 'rgba(255, 246, 220, 0.4)',
        boxShadow:
          '0 22px 50px rgba(0,0,0,0.52), inset 0 1px 1px rgba(255,255,255,0.4), inset 1px 0 1px rgba(255,255,255,0.16)',
      };
    }
    if (pos === -1) {
      return {
        ...base,
        transform: 'translate(-50%, -138%) scale(0.86) rotateX(16deg) skewX(-1.5deg)',
        filter: 'blur(2px)',
        opacity: 0.45,
        zIndex: 3,
      };
    }
    if (pos === 1) {
      return {
        ...base,
        transform: 'translate(-50%, 38%) scale(0.86) rotateX(-16deg) skewX(1.5deg)',
        filter: 'blur(2px)',
        opacity: 0.45,
        zIndex: 3,
      };
    }
    if (pos === -2) {
      return {
        ...base,
        transform: 'translate(-50%, -215%) scale(0.74) rotateX(24deg)',
        filter: 'blur(3.5px)',
        opacity: 0.14,
        zIndex: 1,
      };
    }
    if (pos === 2) {
      return {
        ...base,
        transform: 'translate(-50%, 115%) scale(0.74) rotateX(-24deg)',
        filter: 'blur(3.5px)',
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
      className="wf-glass"
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
        padding: 0,
        overflow: 'hidden',
        borderRadius: '28px',
        userSelect: 'none',
        cursor: 'ns-resize',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          perspective: '900px',
          WebkitMaskImage:
            'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
          maskImage:
            'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
        }}
      >
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
              <div
                style={{
                  color: '#F5EFE6',
                  fontSize: '1rem',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                  marginBottom: '0.7rem',
                }}
              >
                “{rev.text}”
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#F0CA5A',
                  fontWeight: 700,
                }}
              >
                <span>— {rev.name}</span>
                <span style={{ display: 'inline-flex', gap: '3px' }}>
                  {Array.from({ length: rev.stars || 5 }).map((_, sIdx) => (
                    <svg key={sIdx} width="14" height="14" viewBox="0 0 24 24" fill="#F0CA5A">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
