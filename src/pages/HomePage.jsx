import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import IntroOverlay from '../components/IntroOverlay';
import SpatialShowcase from '../components/SpatialShowcase';

export default function HomePage() {
  const { introDone } = useApp();
  const [revealed, setRevealed] = useState(introDone);

  return (
    <>
      <IntroOverlay onRevealReady={() => setRevealed(true)} />
      <SpatialShowcase revealed={revealed} />
    </>
  );
}
