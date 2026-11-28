import React, { useEffect, useState } from 'react';

function buildLiquidEdgeMapUrl() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const data = img.data;

  // Rounded-box SDF with gradual inward-fading refraction (no sharp inner seam)
  const half = 0.5;
  const radius = 0.16;
  const rimWidth = 0.30;

  for (let y = 0; y < size; y++) {
    const v = (y + 0.5) / size;
    const py = v - 0.5;

    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const px = u - 0.5;

      const bx = half - radius;
      const by = half - radius;
      const qx = Math.abs(px) - bx;
      const qy = Math.abs(py) - by;

      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outLen = Math.hypot(ox, oy);
      const insideDist = -(Math.min(Math.max(qx, qy), 0) + outLen - radius);

      let r = 128;
      let g = 128;

      if (insideDist > 0 && insideDist < rimWidth) {
        let nx = 0;
        let ny = 0;
        if (ox > 0 || oy > 0) {
          const len = Math.max(1e-5, outLen);
          nx = -(Math.sign(px) * ox) / len;
          ny = -(Math.sign(py) * oy) / len;
        } else if (qx > qy) {
          nx = -Math.sign(px);
        } else {
          ny = -Math.sign(py);
        }

        // Smooth C1 cosine falloff: zero value AND zero slope where distortion fades into center
        const t = insideDist / rimWidth;
        const edgeAntiAlias = Math.min(1, t / 0.055);
        const cosineFade = Math.pow(0.5 * (1 + Math.cos(Math.PI * t)), 1.45);
        const lensSlope = cosineFade * edgeAntiAlias;

        r = Math.round(128 + nx * 127 * lensSlope);
        g = Math.round(128 + ny * 127 * lensSlope);
      }

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function LiquidGlassFilter() {
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    setMapUrl(buildLiquidEdgeMapUrl());

    const ua = navigator.userAgent;
    const isChromium =
      (/Chrome\//.test(ua) || /Edg\//.test(ua)) &&
      !/CriOS|FxiOS|OPiOS/.test(ua);

    if (isChromium) {
      document.documentElement.classList.add('wf-liquid-supported');
    }

    return () => {
      document.documentElement.classList.remove('wf-liquid-supported');
    };
  }, []);

  if (!mapUrl) return null;

  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter
          id="wf-liquid-edge"
          x="0"
          y="0"
          width="1"
          height="1"
          filterUnits="objectBoundingBox"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={mapUrl}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="lensMap"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="lensMap"
            scale="0.19"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispR"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lensMap"
            scale="0.215"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispG"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lensMap"
            scale="0.24"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispB"
          />

          <feColorMatrix
            in="dispR"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chR"
          />
          <feColorMatrix
            in="dispG"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chG"
          />
          <feColorMatrix
            in="dispB"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="chB"
          />

          <feBlend in="chR" in2="chG" mode="screen" result="chRG" />
          <feBlend in="chRG" in2="chB" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
