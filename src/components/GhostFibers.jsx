import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uIntensity;
uniform float uFiberCount;
uniform float uWarpAmount;
uniform float uNoiseScale;
uniform float uGlowAmount;
uniform float uVignette;
uniform vec3 uGlowColor;
uniform vec3 uSecondaryColor;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return value;
}

vec2 domainWarp(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p * uNoiseScale + vec2(0.0, t * 0.14)),
    fbm(p * uNoiseScale + vec2(5.2, 1.3) - vec2(t * 0.11, 0.0))
  );
  vec2 r = vec2(
    fbm(p * uNoiseScale + 2.4 * q + vec2(1.7, 9.2) + t * 0.09),
    fbm(p * uNoiseScale + 2.4 * q + vec2(8.3, 2.8) - t * 0.08)
  );
  return p + uWarpAmount * (r - 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / max(1.0, uResolution.y);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  vec2 toMouse = p - m;
  float dist = length(toMouse);
  float push = exp(-dist * 2.8) * uMouseInfluence * 0.35;
  p += normalize(toMouse + 0.0001) * push;

  float t = uTime;
  vec2 wp = domainWarp(p, t);

  float angle = atan(wp.y, wp.x);
  float radius = length(wp);
  float twist = radius * 1.65 - t * 0.22;
  vec2 twisted = vec2(
    cos(angle + twist) * radius,
    sin(angle + twist) * radius
  );

  float fibers = 0.0;
  float glow = 0.0;
  int count = int(clamp(uFiberCount, 4.0, 32.0));

  for (int i = 0; i < 32; i++) {
    if (i >= count) break;
    float fi = float(i) / max(1.0, uFiberCount);
    float phase = fi * 6.2831853 + t * (0.28 + fi * 0.18);
    float band = sin(twisted.x * (2.6 + fi * 3.1) + twisted.y * 1.9 + phase);
    float wave = fbm(wp * (1.4 + fi * 0.7) + vec2(t * 0.1, -t * 0.08));
    float d = abs(band + (wave - 0.5) * 1.8);

    float line = smoothstep(0.14, 0.0, d) * (0.45 + 0.55 * sin(fi * 12.0 + t));
    float soft = exp(-d * 4.5) * 0.22;

    fibers += line * (1.0 - fi * 0.45);
    glow += soft * (0.6 + 0.4 * sin(fi * 8.0 - t));
  }

  fibers /= max(1.0, uFiberCount * 0.22);
  glow /= max(1.0, uFiberCount * 0.28);

  vec3 baseDark = vec3(0.035, 0.03, 0.022);
  vec3 col = baseDark;
  col += uSecondaryColor * glow * uGlowAmount * 0.85;
  col += uGlowColor * fibers * uIntensity;
  col += mix(uSecondaryColor, uGlowColor, 0.5) * pow(max(0.0, glow), 1.4) * uGlowAmount * 0.65;

  float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(1.2, 1.0)));
  col *= mix(1.0, vig, uVignette);

  fragColor = vec4(col, 1.0);
}`;

function hexToRgb(hex) {
  const clean = String(hex || '#ffffff').replace('#', '');
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

export default function GhostFibers({
  glowColor = '#ffc204',
  secondaryColor = '#ffc610',
  speed = 0.75,
  intensity = 0.62,
  mouseInfluence = 0.45,
  paused = false,
  fiberCount = 18,
  warpAmount = 0.8,
  noiseScale = 1.6,
  glowAmount = 0.58,
  vignette = 0.82,
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
    fiberCount,
    warpAmount,
    noiseScale,
    glowAmount,
    vignette,
    enableMouse,
  });

  propsRef.current = {
    glowColor,
    secondaryColor,
    speed,
    intensity,
    mouseInfluence,
    paused,
    fiberCount,
    warpAmount,
    noiseScale,
    glowAmount,
    vignette,
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

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseInfluence: gl.getUniformLocation(program, 'uMouseInfluence'),
      uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      uFiberCount: gl.getUniformLocation(program, 'uFiberCount'),
      uWarpAmount: gl.getUniformLocation(program, 'uWarpAmount'),
      uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
      uGlowAmount: gl.getUniformLocation(program, 'uGlowAmount'),
      uVignette: gl.getUniformLocation(program, 'uVignette'),
      uGlowColor: gl.getUniformLocation(program, 'uGlowColor'),
      uSecondaryColor: gl.getUniformLocation(program, 'uSecondaryColor'),
    };

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    function updateSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

    function onMouseMove(e) {
      if (!propsRef.current.enableMouse) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = 1.0 - (e.clientY - rect.top) / rect.height;
    }

    function onMouseLeave() {
      mouse.tx = 0.5;
      mouse.ty = 0.5;
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
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

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      gl.useProgram(program);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, simTime);
      gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
      gl.uniform1f(uniforms.uMouseInfluence, p.enableMouse ? p.mouseInfluence : 0.0);
      gl.uniform1f(uniforms.uIntensity, p.intensity);
      gl.uniform1f(uniforms.uFiberCount, p.fiberCount);
      gl.uniform1f(uniforms.uWarpAmount, p.warpAmount);
      gl.uniform1f(uniforms.uNoiseScale, p.noiseScale);
      gl.uniform1f(uniforms.uGlowAmount, p.glowAmount);
      gl.uniform1f(uniforms.uVignette, p.vignette);

      const gc = hexToRgb(p.glowColor);
      const sc = hexToRgb(p.secondaryColor);
      gl.uniform3f(uniforms.uGlowColor, gc[0], gc[1], gc[2]);
      gl.uniform3f(uniforms.uSecondaryColor, sc[0], sc[1], sc[2]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
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
        ...style,
      }}
    >
      {/* Subtle dark center vignette so Warm Cream & Gold text always stands out */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 50%, rgba(10, 9, 7, 0.42) 10%, rgba(10, 9, 7, 0.65) 85%)',
          zIndex: 1,
        }}
      />
    </div>
  );
}
