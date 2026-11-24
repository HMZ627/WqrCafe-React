import React, { useEffect, useRef } from 'react';

export default function GhostFibers({
  lineColor = '#D4AF37',
  glowColor = '#7A5612',
  secondaryColor = '#4A340B',
  backgroundColor = '#0B0A08',
  speed = 0.45,
  opacity = 0.72,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    // 5 layered depth-of-field ribbons, each made of fine glowing fibers
    const ribbons = [
      { fibers: 12, blur: 6, alpha: 0.16, amp: 0.16, freq: 1.4, phase: 0.0, yBase: 0.28, color: secondaryColor, lw: 1.4 },
      { fibers: 15, blur: 3, alpha: 0.24, amp: 0.19, freq: 1.7, phase: 1.5, yBase: 0.46, color: glowColor, lw: 1.2 },
      { fibers: 18, blur: 0, alpha: 0.34, amp: 0.21, freq: 2.0, phase: 2.8, yBase: 0.54, color: lineColor, lw: 0.95 },
      { fibers: 14, blur: 2, alpha: 0.22, amp: 0.17, freq: 1.6, phase: 4.1, yBase: 0.68, color: glowColor, lw: 1.15 },
      { fibers: 10, blur: 7, alpha: 0.14, amp: 0.15, freq: 1.2, phase: 5.2, yBase: 0.78, color: secondaryColor, lw: 1.6 },
    ];

    const startTime = performance.now();

    function draw(now) {
      const t = ((now - startTime) / 1000) * speed;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      const steps = 64;

      for (let rIdx = 0; rIdx < ribbons.length; rIdx++) {
        const rib = ribbons[rIdx];
        ctx.save();
        if (rib.blur > 0) {
          ctx.filter = `blur(${rib.blur}px)`;
        }

        for (let f = 0; f < rib.fibers; f++) {
          const normF = f / Math.max(1, rib.fibers - 1) - 0.5;
          const fiberPhase = rib.phase + normF * 0.95;

          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const x = u * width;

            // Twisting, folding harmonic drift
            const twist = Math.sin(u * Math.PI * rib.freq + t * 0.9 + rib.phase) * (normF * 78);
            const fold = Math.cos(u * Math.PI * 1.35 - t * 0.65 + fiberPhase) * (height * rib.amp * 0.55);
            const drift = Math.sin(u * Math.PI * 2.7 + t * 1.15 + normF * 1.8) * 28;
            const y = height * rib.yBase + twist + fold + drift;

            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Broad atmospheric fiber glow
          ctx.strokeStyle = glowColor;
          ctx.globalAlpha = rib.alpha * 0.35 * opacity;
          ctx.lineWidth = rib.lw * 4.2;
          ctx.stroke();

          // Fine luminous fiber core
          ctx.strokeStyle = rib.color;
          ctx.globalAlpha = rib.alpha * (1 - Math.abs(normF) * 0.55) * opacity;
          ctx.lineWidth = rib.lw;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Soft dark vignette so foreground cream & gold text always pops cleanly
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const vig = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.14,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.78
      );
      vig.addColorStop(0, 'rgba(11, 10, 8, 0.38)');
      vig.addColorStop(1, 'rgba(11, 10, 8, 0.84)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [lineColor, glowColor, secondaryColor, backgroundColor, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
