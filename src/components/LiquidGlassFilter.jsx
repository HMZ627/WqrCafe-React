import React, { useEffect } from 'react';

export default function LiquidGlassFilter() {
  useEffect(() => {
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

  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        {/* 100% pure GPU SVG primitives (no bitmap feImage) so Chromium backdrop-filter works everywhere */}
        <filter
          id="wf-liquid-edge"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {/* Solid black base + inset white box -> Gaussian blur creates thick curved bezel heightmap */}
          <feFlood x="0%" y="0%" width="100%" height="100%" floodColor="#000000" result="blackBase" />
          <feFlood x="4%" y="5%" width="92%" height="90%" floodColor="#ffffff" result="innerBox" />
          <feMerge result="rawHeight">
            <feMergeNode in="blackBase" />
            <feMergeNode in="innerBox" />
          </feMerge>
          <feGaussianBlur in="rawHeight" stdDeviation="22" result="heightMap" />

          {/* Sobel X & Y derivatives compute smooth inward surface normals along all edges */}
          <feConvolveMatrix
            in="heightMap"
            order="3"
            kernelMatrix="-1 0 1 -2 0 2 -1 0 1"
            divisor="0.42"
            bias="0.5"
            edgeMode="duplicate"
            preserveAlpha="true"
            result="gx"
          />
          <feConvolveMatrix
            in="heightMap"
            order="3"
            kernelMatrix="-1 -2 -1 0 0 0 1 2 1"
            divisor="0.42"
            bias="0.5"
            edgeMode="duplicate"
            preserveAlpha="true"
            result="gy"
          />

          <feColorMatrix
            in="gx"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="rx"
          />
          <feColorMatrix
            in="gy"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="gyOnly"
          />
          <feBlend in="rx" in2="gyOnly" mode="screen" result="normalMap" />

          {/* RGB edge stretching + chromatic prism fringing along curved edges */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="normalMap"
            scale="84"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispR"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="normalMap"
            scale="94"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispG"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="normalMap"
            scale="104"
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
