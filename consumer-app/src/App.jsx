/**
 * Findr Health Consumer App
 * Healthcare Clarity Tool - Document Analysis
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClarityChat from './pages/ClarityChat';
import Profile from './pages/Profile';
import ConsultationRequest from './pages/ConsultationRequest';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ClarityChat />} />
          <Route path="/clarity" element={<ClarityChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/consultation" element={<ConsultationRequest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
