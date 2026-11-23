import React from 'react';
import { Route, Routes } from 'react-router-dom';
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
    </>
  );
}
