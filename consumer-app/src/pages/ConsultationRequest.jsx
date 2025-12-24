/**
 * ConsultationRequest - Big Bill Help form
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConsultationRequest.css';

function ConsultationRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    summary: ''
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    // In production, this would send to your backend/email service
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="consultation-page">
        <header className="consultation-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="header-logo">
            <img src="/findr-logo.svg" alt="Findr Health" />
          </div>
          <div style={{ width: 40 }}></div>
        </header>

        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Request Received</h2>
          <p>Thanks for reaching out. We'll review your situation and respond within 48 hours.</p>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-page">
      <header className="consultation-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-logo">
          <img src="/findr-logo.svg" alt="Findr Health" />
        </div>
        <div style={{ width: 40 }}></div>
      </header>

      <div className="consultation-content">
        <h1>Request a Consultation</h1>
        <p className="consultation-intro">
          Tell us briefly about your situation. We'll review and let you know if we can help.
        </p>

        <form onSubmit={handleSubmit} className="consultation-form">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 555-5555"
            />
          </div>

          <div className="form-group">
            <label htmlFor="summary">What's going on? *</label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="Brief summary of your situation—the bill amount, what it's for, and any challenges you're facing..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="files">Supporting documents (optional)</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="files"
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf"
              />
              <div className="file-upload-label">
                <span className="upload-icon">📎</span>
                <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Click to attach files'}</span>
              </div>
            </div>
            <p className="file-hint">PDF or images. Max 10MB each.</p>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || !formData.email || !formData.summary}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <p className="form-note">
          Initial consultations are free. If we work together, we'll discuss fees after understanding your situation.
        </p>
      </div>
    </div>
  );
}

export default ConsultationRequest;