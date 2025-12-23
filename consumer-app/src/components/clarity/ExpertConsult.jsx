/**
 * ExpertConsult Component
 * "Talk to Your Healthcare Navigator" - Personal expert consultation CTA
 * 
 * This component appears after analysis when users might benefit from
 * personalized expert guidance. Developers will build the scheduling/payment
 * workflow - this creates the compelling entry point.
 */

import React, { useState } from 'react';
import './ExpertConsult.css';

function ExpertConsult({ analysisData, onRequestConsult }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    concern: '',
    preferredTime: 'anytime'
  });
  const [submitted, setSubmitted] = useState(false);

  // Determine which CTA to show based on analysis
  const getCTAContext = () => {
    if (!analysisData) return 'general';
    
    const hasHighAlerts = analysisData.confidence?.warnings?.length > 0;
    const hasMismatches = analysisData.validation?.math?.valid === false;
    const hasActionItems = analysisData.analysis?.actionItems?.length > 2;
    const amountDue = parseFloat(
      (analysisData.analysis?.tier1_summary?.amountDue || '0').replace(/[^0-9.]/g, '')
    );

    if (amountDue > 1000 || hasMismatches) return 'urgent';
    if (hasHighAlerts || hasActionItems) return 'recommended';
    return 'available';
  };

  const ctaContext = getCTAContext();

  const contextMessages = {
    urgent: {
      headline: 'This looks complex. Let\'s figure it out together.',
      subtext: 'A 15-minute call with our healthcare navigator could save you hundreds.',
      buttonText: 'Get Expert Help Now',
      urgencyBadge: 'Recommended'
    },
    recommended: {
      headline: 'Have questions? Talk to someone who gets it.',
      subtext: 'Our navigator has 20+ years on both sides of the healthcare system.',
      buttonText: 'Schedule a Call',
      urgencyBadge: null
    },
    available: {
      headline: 'Want a second opinion from a real expert?',
      subtext: 'Sometimes you just want to talk to a human who understands.',
      buttonText: 'Talk to Our Navigator',
      urgencyBadge: null
    },
    general: {
      headline: 'Confused by healthcare? You\'re not alone.',
      subtext: 'Get personalized guidance from a board-certified surgeon turned patient advocate.',
      buttonText: 'Meet Your Navigator',
      urgencyBadge: null
    }
  };

  const message = contextMessages[ctaContext];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // In production, this would call the API
    if (onRequestConsult) {
      onRequestConsult({
        ...formData,
        analysisContext: analysisData?.documentType,
        ctaContext: ctaContext
      });
    }
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="expert-consult success-state">
        <div className="success-icon">✓</div>
        <h3>Request Received!</h3>
        <p>Our healthcare navigator will reach out within 24 hours to schedule your consultation.</p>
        <div className="success-tips">
          <h4>To prepare:</h4>
          <ul>
            <li>Have your documents ready to share</li>
            <li>Write down your top 3 questions</li>
            <li>Note any deadlines (payment due dates, appeal windows)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`expert-consult ${ctaContext}`}>
      {/* Main CTA Card */}
      <div className="expert-cta-card">
        {message.urgencyBadge && (
          <span className="urgency-badge">{message.urgencyBadge}</span>
        )}
        
        <div className="expert-header">
          <div className="expert-avatar">
            <span className="avatar-icon">👨‍⚕️</span>
            <span className="available-dot"></span>
          </div>
          <div className="expert-intro">
            <h3>{message.headline}</h3>
            <p>{message.subtext}</p>
          </div>
        </div>

        <button 
          className="expert-cta-button"
          onClick={() => setShowDetails(!showDetails)}
        >
          {message.buttonText}
          <span className="button-arrow">→</span>
        </button>

        <p className="expert-micro-copy">
          No obligation • Real human • Actually helpful
        </p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="expert-details">
          <div className="expert-profile">
            <h4>Your Personal Healthcare Navigator</h4>
            <div className="credentials">
              <span className="credential-badge">Board-Certified Surgeon</span>
              <span className="credential-badge">Healthcare Executive</span>
              <span className="credential-badge">20+ Years Experience</span>
            </div>
            <p className="expert-bio">
              "I've sat in the OR, the boardroom, and the billing department. I know exactly 
              how the system works—and how to make it work for you. Let me help you cut 
              through the confusion and get real answers."
            </p>
          </div>

          <div className="consult-options">
            <h4>Consultation Options</h4>
            
            <div className="consult-option">
              <div className="option-header">
                <span className="option-icon">⚡</span>
                <div>
                  <h5>Quick Clarity</h5>
                  <span className="option-duration">15 minutes</span>
                </div>
              </div>
              <p>Perfect for one confusing bill or a quick question</p>
            </div>

            <div className="consult-option featured">
              <div className="option-header">
                <span className="option-icon">🔍</span>
                <div>
                  <h5>Deep Dive</h5>
                  <span className="option-duration">30 minutes</span>
                </div>
                <span className="popular-badge">Most Popular</span>
              </div>
              <p>Comprehensive review with a clear action plan</p>
            </div>

            <div className="consult-option">
              <div className="option-header">
                <span className="option-icon">🎯</span>
                <div>
                  <h5>Advocacy Strategy</h5>
                  <span className="option-duration">45 minutes</span>
                </div>
              </div>
              <p>For complex disputes, appeals, or large bills</p>
            </div>
          </div>

          <div className="what-to-expect">
            <h4>What to Expect</h4>
            <ul>
              <li>
                <span className="expect-icon">📋</span>
                <span>We'll review your documents together on video</span>
              </li>
              <li>
                <span className="expect-icon">💡</span>
                <span>You'll understand exactly what's going on</span>
              </li>
              <li>
                <span className="expect-icon">📝</span>
                <span>You'll leave with specific next steps</span>
              </li>
              <li>
                <span className="expect-icon">📞</span>
                <span>Scripts for phone calls if needed</span>
              </li>
            </ul>
          </div>

          <button 
            className="schedule-button"
            onClick={() => setShowRequestForm(true)}
          >
            Request a Consultation
          </button>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="request-modal-overlay" onClick={() => setShowRequestForm(false)}>
          <div className="request-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRequestForm(false)}>×</button>
            
            <h3>Request Your Consultation</h3>
            <p>Tell us a bit about your situation and we'll reach out to schedule.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone (optional)</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div className="form-group">
                <label htmlFor="concern">What do you need help with? *</label>
                <textarea
                  id="concern"
                  required
                  value={formData.concern}
                  onChange={e => setFormData({...formData, concern: e.target.value})}
                  placeholder="E.g., I received a $5,000 ER bill and my insurance only paid $200. I don't understand why..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredTime">Best time to reach you</label>
                <select
                  id="preferredTime"
                  value={formData.preferredTime}
                  onChange={e => setFormData({...formData, preferredTime: e.target.value})}
                >
                  <option value="anytime">Anytime</option>
                  <option value="morning">Morning (9am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 8pm)</option>
                </select>
              </div>

              <button type="submit" className="submit-button">
                Send Request
              </button>

              <p className="form-disclaimer">
                We'll respond within 24 hours. Your information is kept confidential.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpertConsult;
