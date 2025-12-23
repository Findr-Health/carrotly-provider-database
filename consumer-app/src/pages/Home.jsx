/**
 * Home Page - Main landing for Findr Health Consumer App
 * Clarity - Healthcare Document Understanding Tool
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const handleScheduleConsult = () => {
    alert('Scheduling feature coming soon! For now, use Clarity to analyze your documents.');
  };

  return (
    <div className="home-page">
      {/* Header with Findr Logo */}
      <header className="home-header">
        <div className="findr-logo">
          <img src="/findr-logo.svg" alt="Findr Health" className="findr-logo-img" />
        </div>
      </header>

      {/* Clarity Section */}
      <section className="clarity-section">
        <p className="brings-you">brings you</p>
        <h2 className="clarity-headline">Clarity</h2>
        <p className="clarity-subhead">Take back control of your healthcare!</p>
        
        <button
          className="clarity-btn"
          onClick={() => navigate('/clarity')}
        >
          Ask a question or upload a document
          <span className="btn-arrow">→</span>
        </button>
      </section>

      {/* Schedule a Consult CTA */}
      <section className="consult-section">
        <div className="consult-card">
          <div className="consult-header">
            <div className="consult-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#17DDC0" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="consult-badge">Live Expert</div>
          </div>
          <h3>Need human help?</h3>
          <p>Schedule a 1:1 consultation with a healthcare expert who can advocate for you</p>
          <button className="consult-btn" onClick={handleScheduleConsult}>
            Schedule a Consult
          </button>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-section">
        <div className="trust-badges">
          <div className="trust-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" stroke="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Private & Secure</span>
          </div>
          <div className="trust-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#17DDC0" stroke="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span>AI-Powered</span>
          </div>
        </div>
        <p className="trust-note">Your documents are never stored. Analysis happens in real-time.</p>
      </section>
    </div>
  );
}

export default Home;