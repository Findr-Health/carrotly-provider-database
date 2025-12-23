/**
 * BottomNav - Bottom navigation bar matching Findr Health design
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-btn ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
        <span>Home</span>
      </button>

      <button 
        className={`nav-btn center-btn ${isActive('/clarity') ? 'active' : ''}`}
        onClick={() => navigate('/clarity')}
      >
        <div className="center-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4L20 10L14 16L8 10L14 4Z" fill="currentColor"/>
            <path d="M14 12L20 18L14 24L8 18L14 12Z" fill="currentColor"/>
          </svg>
        </div>
      </button>

      <button 
        className={`nav-btn ${isActive('/profile') ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}

export default BottomNav;
