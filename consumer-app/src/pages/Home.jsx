/**
 * Home Page - Main landing for Findr Health Consumer App
 * Two tools + One service
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const handleCostNavigator = (question = '') => {
    navigate('/clarity', { state: { initialQuestion: question, mode: 'cost' } });
  };

  const handleDocumentUpload = () => {
    navigate('/clarity', { state: { mode: 'document', openUpload: true } });
  };

  return (
    <div className="home-page">
      {/* Header with Findr Logo */}
      <header className="home-header">
        <div className="findr-logo">
          <img src="/findr-logo.svg" alt="Findr Health" className="findr-logo-img" />
        </div>
        <p className="tagline">Healthcare, simplified</p>
      </header>

      {/* Tool 1: Cost Navigator */}
      <section className="tool-section">
        <div className="tool-card cost-navigator">
          <div className="tool-icon">💰</div>
          <h2>Cost Navigator</h2>
          <p className="tool-subtitle">Find your lowest-cost path</p>
          <p className="tool-body">
            Insurance isn't always the answer. We help you compare options—whether that's going without coverage, choosing a high-deductible plan, or paying cash. Ask anything about costs, coverage, or strategy.
          </p>
          
          <div className="example-pills">
            <button onClick={() => handleCostNavigator("Should I use insurance or pay cash for my procedure?")}>
              Should I use insurance or pay cash?
            </button>
            <button onClick={() => handleCostNavigator("What's the real cost of this procedure without insurance?")}>
              What's the real cost of this procedure?
            </button>
            <button onClick={() => handleCostNavigator("Is a high-deductible health plan right for me?")}>
              Is a high-deductible plan right for me?
            </button>
          </div>
          
          <button className="tool-cta" onClick={() => handleCostNavigator()}>
            Start a conversation
            <span className="cta-arrow">→</span>
          </button>
          
          <p className="micro-disclaimer">
            We don't know your specific plan details or financial situation. Use this as a starting point, not a final answer.
          </p>
        </div>
      </section>

      {/* Tool 2: Document Clarity */}
      <section className="tool-section">
        <div className="tool-card document-clarity">
          <div className="tool-icon">📄</div>
          <h2>Document Clarity</h2>
          <p className="tool-subtitle">Upload anything. We'll explain it.</p>
          <p className="tool-body">
            Bills, labs, medical records, imaging reports, EOBs—drop it here and we'll tell you what it means in plain English.
          </p>
          
          <div className="format-pills">
            <span className="format-pill">Medical bills</span>
            <span className="format-pill">Lab results</span>
            <span className="format-pill">EOBs</span>
            <span className="format-pill">Imaging reports</span>
            <span className="format-pill">Medical records</span>
          </div>
          
          <button className="tool-cta" onClick={handleDocumentUpload}>
            Upload a document
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Service: Big Bill Help */}
      <section className="service-section">
        <div className="service-card">
          <h2>Drowning in a big bill? We can help.</h2>
          <p className="service-body">
            For complex cases sometimes you need a human. We've helped reduce bills by <strong>30-50%</strong>. Submit your situation and we'll let you know if we can help.
          </p>
          
          <div className="service-steps">
            <p className="steps-label">What happens next:</p>
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">You submit a brief request</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">We review and respond within 48 hours</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">If we can help, we'll schedule a call and discuss next steps</span>
            </div>
          </div>
          
          <button className="service-cta" onClick={() => navigate('/consultation')}>
            Request a consultation
            <span className="cta-arrow">→</span>
          </button>
          
          <p className="service-note">
            Initial consultations are free. If we work together, we'll discuss fees after understanding your situation.
          </p>
        </div>
      </section>

      {/* Trust + Disclaimer Section */}
      <section className="honesty-section">
        <h3>A note on honesty</h3>
        <p className="honesty-body">
          We're not your insurance company, your doctor, or your lawyer. We give you real information and actionable options—but every situation is different. Our suggestions are based on what you tell us, not your complete medical or financial picture. When in doubt, verify with your specific provider or plan.
        </p>
        
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
          <div className="trust-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6366F1" stroke="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Human help when you need it</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;