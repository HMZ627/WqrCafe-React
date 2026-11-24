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
        glowColor="#ffc204"
        secondaryColor="#ffc610"
        speed={0.55}
        intensity={0.78}
        mouseInfluence={0.45}
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
