/**
 * Findr Health Consumer App
 * Healthcare Clarity Tool - Document Analysis
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClarityChat from './pages/ClarityChat';
import Home from './pages/Home';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import './styles/App.css';
import ConsultationRequest from './pages/ConsultationRequest';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clarity" element={<ClarityChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/consultation" element={<ConsultationRequest />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
