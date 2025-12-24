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
          <div className="header-brand">
            <span className="header-findr">findr</span>
            <svg className="header-icon" width="24" height="24" viewBox="0 0 63 63" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0" stroke="#17DDC0" strokeWidth="3"/>
              <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
              <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
              <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
              <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
            </svg>
            <span className="header-health">health</span>
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
        <div className="header-brand">
          <span className="header-findr">findr</span>
          <svg className="header-icon" width="24" height="24" viewBox="0 0 63 63" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0" stroke="#17DDC0" strokeWidth="3"/>
            <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
            <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
            <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
            <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
          </svg>
          <span className="header-health">health</span>
        </div>
        <div style={{ width: 40 }}></div>
      </header>

      {/* Dark Hero Section */}
      <div className="consultation-hero">
        <h1>Drowning in a big bill?</h1>
        <p>We've helped reduce bills by <strong>30-50%</strong>. Tell us your situation and we'll let you know if we can help.</p>
        <div className="hero-steps">
          <div className="hero-step">
            <span className="step-num">1</span>
            <span>Submit request</span>
          </div>
          <div className="hero-step">
            <span className="step-num">2</span>
            <span>We review (48hrs)</span>
          </div>
          <div className="hero-step">
            <span className="step-num">3</span>
            <span>Schedule a call</span>
          </div>
        </div>
      </div>

      <div className="consultation-content">
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