import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec4 aParticle;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uDpr;

out float vBokeh;
out float vAlpha;
out float vHighlight;
out float vMix;

void main() {
  float u = aParticle.x;
  float v = aParticle.y;
  float rid = aParticle.z;
  float seed = aParticle.w;

  float t = uTime;
  float aspect = uResolution.x / max(1.0, uResolution.y);

  vec3 pos = vec3(0.0);
  float twist = 0.0;
  float edgeFade = 1.0;

  if (rid < 2.5) {
    float wavePhase = t * 0.55;

    if (rid < 0.5) {
      float x = u * 1.18;
      float yCurve = u * 0.42 + sin(u * 2.1 - wavePhase + 0.4) * 0.22 + cos(u * 1.15 + wavePhase * 0.6) * 0.09;
      float zCurve = cos(u * 1.85 - wavePhase * 0.8) * 0.34;
      twist = u * 2.65 + sin(u * 1.4 - wavePhase * 0.7) * 0.9;

      float width = 0.34 + 0.08 * sin(u * 2.2 + wavePhase * 0.5);
      pos = vec3(
        x + sin(twist) * v * 0.08,
        yCurve + cos(twist) * v * width,
        zCurve + sin(twist) * v * width * 1.15
      );
      edgeFade = smoothstep(1.38, 0.82, abs(u));
    } else if (rid < 1.5) {
      float x = u * 1.18;
      float yCurve = 0.40 + u * 0.14 + sin(u * 2.3 + wavePhase * 0.8 + 1.4) * 0.17;
      float zCurve = -0.05 + sin(u * 1.7 + wavePhase * 0.65) * 0.32;
      twist = u * 2.95 + 1.1 + cos(u * 1.3 + wavePhase * 0.5) * 0.8;

      float width = 0.28 + 0.06 * cos(u * 2.0 - wavePhase * 0.4);
      pos = vec3(
        x,
        yCurve + cos(twist) * v * width,
        zCurve + sin(twist) * v * width * 1.1
      );
      edgeFade = smoothstep(1.38, 0.78, abs(u));
    } else {
      float x = 0.22 + u * 0.95;
      float yCurve = -0.52 + u * 0.58 + sin(u * 2.0 - wavePhase * 0.7 + 2.5) * 0.14;
      float zCurve = 0.18 + cos(u * 1.9 + wavePhase * 0.55) * 0.28;
      twist = u * 2.2 - 0.6 + sin(u * 1.5 + wavePhase * 0.6) * 0.7;

      float width = 0.26;
      pos = vec3(
        x,
        yCurve + cos(twist) * v * width,
        zCurve + sin(twist) * v * width
      );
      edgeFade = smoothstep(1.32, 0.72, abs(u));
    }

    pos.y += sin(seed * 25.0 + t * 0.9 + u * 3.0) * 0.012;
    pos.z += cos(seed * 19.0 + t * 0.8 + u * 2.5) * 0.012;

    float foldDensity = 1.0 - smoothstep(0.0, 0.42, abs(cos(twist)));
    float crest = smoothstep(0.15, 0.95, sin(u * 2.2 - t * 0.4 + rid * 2.1) * 0.5 + 0.5);
    vHighlight = pow(foldDensity, 1.8) * (0.45 + 0.55 * crest);
  } else {
    float driftX = fract(u * 0.5 + 0.5 + t * 0.012 * (0.4 + seed)) * 2.4 - 1.2;
    float driftY = fract(v + 0.5 + sin(t * 0.2 + seed * 10.0) * 0.04) * 2.1 - 1.05;
    float zDust = mix(-0.75, 0.75, fract(seed * 7.31));
    pos = vec3(driftX, driftY, zDust);
    vHighlight = 0.15;
    edgeFade = 0.75;
  }

  // Interactive mouse & touch ripple + parallax
  vec2 m = (uMouse - 0.5) * 2.0;
  vec2 delta = pos.xy - m;
  float dist = length(delta);
  float push = exp(-dist * 2.2) * uMouseInfluence * 0.16;
  pos.xy += normalize(delta + vec2(0.0001)) * push;
  pos.x += m.x * uMouseInfluence * 0.09 * (0.5 - pos.z);
  pos.y += m.y * uMouseInfluence * 0.07 * (0.5 - pos.z);

  pos.x /= max(0.75, aspect * 0.62);

  float focalDist = abs(pos.z - 0.08);
  float dof = smoothstep(0.04, 0.62, focalDist);

  float baseSize = (rid > 2.5) ? (3.5 + seed * 8.0) : mix(1.9, 11.5, dof);
  gl_PointSize = clamp(baseSize * uDpr * (1.0 + vHighlight * 0.45), 1.4, 24.0);
  gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);

  vBokeh = dof;
  vMix = fract(seed * 3.7 + v * 0.5 + 0.5);

  float sharpAlpha = mix(0.68, 0.11, dof);
  float ribbonFade = (rid > 2.5) ? (0.12 + 0.18 * (1.0 - dof)) : (sharpAlpha + vHighlight * 0.42);
  float vEdge = (rid > 2.5) ? 1.0 : smoothstep(0.55, 0.18, abs(v));

  vAlpha = clamp(ribbonFade * edgeFade * vEdge, 0.0, 0.92);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec3 uGlowColor;
uniform vec3 uSecondaryColor;
uniform float uIntensity;

in float vBokeh;
in float vAlpha;
in float vHighlight;
in float vMix;

out vec4 fragColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;

  float sharpDot = exp(-r * r * 4.2);
  float bokehDisc = smoothstep(1.0, 0.45, r) * (0.55 + 0.45 * smoothstep(0.2, 0.85, r));
  float shape = mix(sharpDot, bokehDisc, vBokeh);

  vec3 baseGold = mix(uSecondaryColor, uGlowColor, vMix);
  vec3 hotCore = vec3(1.0, 0.94, 0.72);
  vec3 col = mix(baseGold, hotCore, clamp(vHighlight * 0.75, 0.0, 0.85));

  float finalAlpha = shape * vAlpha * uIntensity;
  if (finalAlpha < 0.004) discard;

  fragColor = vec4(col, finalAlpha);
}`;

function hexToRgb(hex) {
  const clean = String(hex || '#ffc204').replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

function buildParticleField() {
  const pts = [];
  let s = 1337;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  function addRibbon(ribbonId, cols, rows) {
    for (let i = 0; i < cols; i++) {
      const u = (i / (cols - 1)) * 2.7 - 1.35 + (rand() - 0.5) * 0.014;
      for (let j = 0; j < rows; j++) {
        const v = (j / (rows - 1)) - 0.5 + (rand() - 0.5) * 0.025;
        pts.push(u, v, ribbonId, rand());
      }
    }
  }

  addRibbon(0, 135, 22);
  addRibbon(1, 110, 18);
  addRibbon(2, 90, 14);

  for (let d = 0; d < 140; d++) {
    pts.push(rand() * 2.4 - 1.2, rand() - 0.5, 3, rand());
  }

  return new Float32Array(pts);
}

export default function GhostFibers({
  glowColor = '#ffc204',
  secondaryColor = '#ffc610',
  speed = 0.55,
  intensity = 0.78,
  mouseInfluence = 0.55,
  paused = false,
  enableMouse = true,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const propsRef = useRef({
    glowColor,
    secondaryColor,
    speed,
    intensity,
    mouseInfluence,
    paused,
    enableMouse,
  });

  propsRef.current = {
    glowColor,
    secondaryColor,
    speed,
    intensity,
    mouseInfluence,
    paused,
    enableMouse,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      return () => canvas.remove();
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      return () => canvas.remove();
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return () => canvas.remove();
    }

    const fieldData = buildParticleField();
    const totalPoints = fieldData.length / 4;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, fieldData, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'aParticle');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

    const uniforms = {
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseInfluence: gl.getUniformLocation(program, 'uMouseInfluence'),
      uDpr: gl.getUniformLocation(program, 'uDpr'),
      uGlowColor: gl.getUniformLocation(program, 'uGlowColor'),
      uSecondaryColor: gl.getUniformLocation(program, 'uSecondaryColor'),
      uIntensity: gl.getUniformLocation(program, 'uIntensity'),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.035, 0.032, 0.025, 1.0);

    let dpr = 1;
    function updateSize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(container.clientWidth * dpr));
      const h = Math.max(1, Math.floor(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, boost: 0 };
    let touchResetTimer = null;

    function updatePointer(clientX, clientY, boostAmount = 0) {
      if (!propsRef.current.enableMouse) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.tx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      mouse.ty = Math.max(0, Math.min(1, 1.0 - (clientY - rect.top) / rect.height));
      if (boostAmount > 0) mouse.boost = boostAmount;
    }

    function onMouseMove(e) {
      updatePointer(e.clientX, e.clientY, 0);
    }

    function onPointerMove(e) {
      updatePointer(e.clientX, e.clientY, e.pointerType === 'touch' ? 0.65 : 0);
    }

    function onTouchPoint(e) {
      if (!e.touches || e.touches.length === 0) return;
      clearTimeout(touchResetTimer);
      updatePointer(e.touches[0].clientX, e.touches[0].clientY, 0.85);
    }

    function onTouchEnd() {
      clearTimeout(touchResetTimer);
      touchResetTimer = setTimeout(() => {
        mouse.tx = 0.5;
        mouse.ty = 0.5;
      }, 900);
    }

    function onMouseLeave() {
      mouse.tx = 0.5;
      mouse.ty = 0.5;
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchstart', onTouchPoint, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchPoint, { passive: true, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    window.addEventListener('mouseleave', onMouseLeave);

    let animId = null;
    let simTime = 0;
    let lastClock = performance.now();

    function render(now) {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - lastClock) / 1000);
      lastClock = now;

      const p = propsRef.current;
      if (!p.paused) {
        simTime += dt * p.speed;
      }

      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      mouse.boost *= 0.94;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, simTime);
      gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
      gl.uniform1f(
        uniforms.uMouseInfluence,
        p.enableMouse ? p.mouseInfluence + mouse.boost : 0.0
      );
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uIntensity, p.intensity);

      const gc = hexToRgb(p.glowColor);
      const sc = hexToRgb(p.secondaryColor);
      gl.uniform3f(uniforms.uGlowColor, gc[0], gc[1], gc[2]);
      gl.uniform3f(uniforms.uSecondaryColor, sc[0], sc[1], sc[2]);

      gl.drawArrays(gl.POINTS, 0, totalPoints);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(touchResetTimer);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchstart', onTouchPoint, { capture: true });
      window.removeEventListener('touchmove', onTouchPoint, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('mouseleave', onMouseLeave);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#090806',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 50%, rgba(9, 8, 6, 0.32) 15%, rgba(9, 8, 6, 0.58) 85%)',
          zIndex: 1,
        }}
      />
    </div>
  );
}
