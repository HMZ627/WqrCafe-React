import React, { useEffect, useRef } from 'react';

export default function GhostFibers({
  lineColor = '#D4AF37',
  glowColor = '#7A5612',
  secondaryColor = '#4A340B',
  backgroundColor = '#0B0A08',
  speed = 0.42,
  opacity = 0.78,
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
      // 1x scale for ambient background is visually identical and 4x faster on GPU/CPU
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    resize();
    window.addEventListener('resize', resize);

    // 3 sleek ribbons (24 strands total) with multi-pass soft alpha instead of expensive ctx.filter
    const ribbons = [
      { fibers: 7, alpha: 0.22, amp: 0.16, freq: 1.4, phase: 0.2, yBase: 0.34, color: secondaryColor, lw: 1.2 },
      { fibers: 10, alpha: 0.34, amp: 0.2, freq: 1.85, phase: 2.2, yBase: 0.52, color: lineColor, lw: 1.0 },
      { fibers: 7, alpha: 0.24, amp: 0.17, freq: 1.5, phase: 4.1, yBase: 0.7, color: glowColor, lw: 1.15 },
    ];

    const startTime = performance.now();
    let lastFrame = 0;
    const steps = 36;

    function draw(now) {
      animId = requestAnimationFrame(draw);

      // Throttle subtly to ~36fps for buttery motion with minimal CPU load
      if (now - lastFrame < 26) return;
      lastFrame = now;

      const t = ((now - startTime) / 1000) * speed;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

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

          // Outer soft glow pass (no CPU blur filter needed)
          ctx.strokeStyle = glowColor;
          ctx.globalAlpha = rib.alpha * 0.18 * opacity;
          ctx.lineWidth = rib.lw * 7;
          ctx.stroke();

          // Luminous fiber core
          ctx.strokeStyle = rib.color;
          ctx.globalAlpha = rib.alpha * (1 - Math.abs(normF) * 0.5) * opacity;
          ctx.lineWidth = rib.lw;
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
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* Static GPU vignette overlay (zero per-frame canvas cost) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(11,10,8,0.28) 15%, rgba(11,10,8,0.82) 85%)',
        }}
      />
    </div>
  );
}
