import React from 'react';
import { Route, Routes } from 'react-router-dom';
import GhostFibers from './components/GhostFibers';
import Navbar from './components/Navbar';
import CheckoutModal from './components/CheckoutModal';
import ConfirmationModal from './components/ConfirmationModal';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ReviewPage from './pages/ReviewPage';
import BugPage from './pages/BugPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <GhostFibers
        lineColor="#D4AF37"
        glowColor="#7A5612"
        secondaryColor="#3D2B08"
        backgroundColor="#0B0A08"
        speed={0.42}
        opacity={0.74}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/report-a-bug" element={<BugPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <CheckoutModal />
        <ConfirmationModal />
      </div>
    </>
  );
}
