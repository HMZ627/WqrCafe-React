import React, { useState } from 'react';
import IntroOverlay from '../components/IntroOverlay';
import SpatialShowcase from '../components/SpatialShowcase';

export default function HomePage() {
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <IntroOverlay onRevealReady={() => setRevealed(true)} />
      <SpatialShowcase revealed={revealed} />
    </>
  );
}
