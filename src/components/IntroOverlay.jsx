import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function IntroOverlay({ onRevealReady }) {
  const { introDone, setIntroDone } = useApp();
  const [visible, setVisible] = useState(!introDone);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const finishedRef = useRef(false);

  function finishIntro() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setVisible(false);
    setIntroDone(true);
    setTimeout(() => {
      onRevealReady();
    }, 1000);
  }

  useEffect(() => {
    if (introDone) {
      onRevealReady();
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;
    vid.play().catch(() => {});

    const fallbackTimer = setTimeout(() => {
      if (!finishedRef.current && vid.readyState === 0) {
        finishIntro();
      }
    }, 4200);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.95, ease: 'easeInOut' }}
          onTouchStart={() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 999999,
            background: '#0B0A09',
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            src="/static/intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => {
              setVideoReady(true);
              videoRef.current?.play().catch(() => {});
            }}
            onTimeUpdate={() => {
              const v = videoRef.current;
              if (v && v.duration && v.duration - v.currentTime <= 0.85) {
                finishIntro();
              }
            }}
            onEnded={finishIntro}
            onError={finishIntro}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100vw',
              height: '100dvh',
              backgroundColor: '#0B0A09',
              objectFit: 'cover',
              objectPosition: 'center center',
              transform: 'scale(1.22)',
              WebkitMaskImage:
                'linear-gradient(180deg, transparent 0%, transparent 7%, #000 20%, #000 80%, transparent 93%, transparent 100%)',
              maskImage:
                'linear-gradient(180deg, transparent 0%, transparent 7%, #000 20%, #000 80%, transparent 93%, transparent 100%)',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          />
          {/* Top & bottom charcoal vignette ensures zero white bars show on any aspect ratio */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(180deg, #0B0A09 0%, rgba(11,10,9,0.72) 10%, transparent 24%, transparent 76%, rgba(11,10,9,0.72) 90%, #0B0A09 100%)',
            }}
          />
          <button
            type="button"
            onClick={finishIntro}
            className="wf-btn"
            style={{
              position: 'absolute',
              bottom: '28px',
              right: '28px',
              zIndex: 5,
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
