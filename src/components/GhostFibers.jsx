import React, { useEffect, useRef } from 'react';

export default function GhostFibers({
  lineColor = '#181205',
  glowColor = '#ffc204',
  secondaryColor = '#ffc610',
  backgroundColor = '#0B0A08',
  speed = 0.42,
  opacity = 0.82,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animId = null;
    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    resize();
    window.addEventListener('resize', resize);

    const ribbons = [
      { fibers: 7, alpha: 0.24, amp: 0.16, freq: 1.4, phase: 0.2, yBase: 0.32, glow: glowColor },
      { fibers: 10, alpha: 0.30, amp: 0.21, freq: 1.85, phase: 2.1, yBase: 0.52, glow: secondaryColor },
      { fibers: 7, alpha: 0.22, amp: 0.17, freq: 1.5, phase: 4.0, yBase: 0.72, glow: glowColor },
    ];

    const startTime = performance.now();
    let lastFrame = 0;
    const steps = 36;

    function draw(now) {
      animId = requestAnimationFrame(draw);
      if (now - lastFrame < 26) return;
      lastFrame = now;

      const t = ((now - startTime) / 1000) * speed;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      for (let rIdx = 0; rIdx < ribbons.length; rIdx++) {
        const rib = ribbons[rIdx];

        for (let f = 0; f < rib.fibers; f++) {
          const normF = f / Math.max(1, rib.fibers - 1) - 0.5;
          const fiberPhase = rib.phase + normF * 0.95;

          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const x = u * width;
            const twist = Math.sin(u * Math.PI * rib.freq + t * 0.85 + rib.phase) * (normF * 74);
            const fold = Math.cos(u * Math.PI * 1.35 - t * 0.6 + fiberPhase) * (height * rib.amp * 0.54);
            const drift = Math.sin(u * Math.PI * 2.5 + t * 1.05 + normF * 1.7) * 24;
            const y = height * rib.yBase + twist + fold + drift;

            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Pass 1: #ffc204 / #ffc610 golden atmospheric glow
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = rib.glow;
          ctx.globalAlpha = rib.alpha * 0.12 * opacity;
          ctx.lineWidth = 10;
          ctx.stroke();

          ctx.globalAlpha = rib.alpha * 0.24 * opacity;
          ctx.lineWidth = 3.2;
          ctx.stroke();

          // Pass 2: Dark ghost fiber core weaving inside the golden glow
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = lineColor;
          ctx.globalAlpha = 0.68;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [lineColor, glowColor, secondaryColor, backgroundColor, speed, opacity]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {/* Soft dark readability vignette so cream & gold foreground text stays razor sharp */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(11,10,8,0.42) 15%, rgba(11,10,8,0.86) 85%)',
        }}
      />
    </div>
  );
}
