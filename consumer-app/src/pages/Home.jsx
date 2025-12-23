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
          <span className="findr-text">findr</span>
          <svg className="findr-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0L20 8L28 8L22 14L24 22L16 18L8 22L10 14L4 8L12 8L16 0Z" fill="#17DDC0"/>
          </svg>
          <span className="findr-tm">™</span>
        </div>
        <p className="tagline">Healthcare, demystified</p>
      </header>

      {/* Main Feature - Clarity */}
      <section className="main-feature">
        <button
          className="clarity-card"
          onClick={() => navigate('/clarity')}
        >
          <div className="clarity-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#17DDC0" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="clarity-content">
            <h2>Clarity</h2>
            <p>Understand your medical bills, EOBs, and healthcare documents in seconds</p>
          </div>
          <div className="clarity-action">
            <span className="action-text">Upload or ask a question</span>
            <span className="action-arrow">→</span>
          </div>
        </button>
      </section>

      {/* What Clarity Can Do */}
      <section className="clarity-features">
        <h3>What you can do</h3>
        <div className="feature-pills">
          <span className="feature-pill" onClick={() => navigate('/clarity')}>📄 Upload a bill</span>
          <span className="feature-pill" onClick={() => navigate('/clarity')}>❓ Ask a question</span>
          <span className="feature-pill" onClick={() => navigate('/clarity')}>💰 Check pricing</span>
          <span className="feature-pill" onClick={() => navigate('/clarity')}>📋 Compare EOB vs Bill</span>
        </div>
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