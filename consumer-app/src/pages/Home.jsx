/**
 * Home Page - Main landing for Findr Health Consumer App
 * Clarity - Healthcare Document Understanding Tool
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const handlePresetQuestion = (question) => {
    navigate('/clarity', { state: { initialQuestion: question } });
  };

  const handleForensicAnalysis = () => {
    alert('Forensic Bill Analysis coming soon! For now, upload your bill in Clarity and we\'ll help you understand it.');
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

      {/* Reality Check Section */}
      <section className="reality-section">
        <div className="reality-card">
          <h3>Healthcare pricing is broken.</h3>
          <p className="reality-text">
            Bills are inflated. "Discounts" are often theater. And insurance? It's not always the best choice—or even necessary—for everyone.
          </p>
          <p className="reality-text">
            We give you the tools to understand what you actually owe and push back when the numbers don't add up.
          </p>
          <p className="reality-disclaimer">
            Every situation is different. We help you figure out what's right for yours.
          </p>
          
          <div className="preset-questions">
            <p className="preset-label">Common questions:</p>
            <button onClick={() => handlePresetQuestion("Do I actually need health insurance? What are the pros and cons for my situation?")}>
              Do I actually need insurance?
            </button>
            <button onClick={() => handlePresetQuestion("How do I negotiate a medical bill? What strategies work?")}>
              How do I negotiate a medical bill?
            </button>
            <button onClick={() => handlePresetQuestion("How do I find out what a fair price is for a medical procedure?")}>
              What's a fair price for my procedure?
            </button>
            <button onClick={() => handlePresetQuestion("How can I tell if I'm being overcharged on a medical bill?")}>
              Am I being overcharged?
            </button>
            <button onClick={() => handlePresetQuestion("What are my options if I can't afford a medical bill?")}>
              What if I can't afford this bill?
            </button>
          </div>
        </div>
      </section>

      {/* Forensic Analysis Section */}
      <section className="forensic-section">
        <div className="forensic-card">
          <div className="forensic-badge">Advanced</div>
          <h3>Big bill? Let's dig in.</h3>
          <p>
            Complex bills—especially $10K+—often hide errors, inflated charges, and negotiation opportunities.
          </p>
          <p className="forensic-stat">
            We've analyzed bills totaling millions and helped reduce them by <strong>30-50%</strong>.
          </p>
          <button className="forensic-btn" onClick={handleForensicAnalysis}>
            Request Bill Analysis
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