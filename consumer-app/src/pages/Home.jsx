/**
 * Home Page - Main landing for Findr Health Consumer App
 * Links to various features including Clarity Tool
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      id: 'clarity',
      title: 'Document Helper',
      description: 'Upload a medical bill or insurance statement to understand it',
      icon: '📄',
      action: () => navigate('/clarity'),
      highlight: true,
    },
    {
      id: 'find-provider',
      title: 'Find a Provider',
      description: 'Search for doctors, specialists, and wellness providers',
      icon: '🔍',
      action: () => alert('Coming soon!'),
      highlight: false,
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      description: 'View and manage your appointments',
      icon: '📅',
      action: () => alert('Coming soon!'),
      highlight: false,
    },
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="findr-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 8L32 16L24 24L16 16L24 8Z" fill="#00B4A6"/>
            <path d="M24 24L32 32L24 40L16 32L24 24Z" fill="#00B4A6"/>
            <path d="M12 16L20 24L12 32L4 24L12 16Z" fill="#00B4A6" fillOpacity="0.6"/>
            <path d="M36 16L44 24L36 32L28 24L36 16Z" fill="#00B4A6" fillOpacity="0.6"/>
          </svg>
        </div>
        <h1>Findr Health</h1>
        <p className="tagline">Your personal health & wellness assistant</p>
      </header>

      {/* Quick Actions */}
      <section className="quick-actions-home">
        <div className="quick-action-cards">
          {features.map((feature) => (
            <button
              key={feature.id}
              className={`feature-card ${feature.highlight ? 'highlighted' : ''}`}
              onClick={feature.action}
            >
              <span className="feature-icon">{feature.icon}</span>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <span className="feature-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-banner">
        <div className="promo-content">
          <span className="promo-badge">New</span>
          <h3>Confused by a medical bill?</h3>
          <p>Upload it and get a plain-English explanation in seconds</p>
          <button className="promo-btn" onClick={() => navigate('/clarity')}>
            Try Document Helper
          </button>
        </div>
      </section>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search anything medical and wellness"
            className="search-input"
          />
          <button className="voice-btn" aria-label="Voice search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
