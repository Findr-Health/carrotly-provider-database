/**
 * NonHealthcareResult - Shown when user uploads a non-healthcare document
 * Gracefully explains and redirects
 */

import React from 'react';
import './NonHealthcareResult.css';

function NonHealthcareResult({ data }) {
  const { documentType, detectedType, identifiedEntity, contactInfo, suggestedAction, confidence } = data;

  return (
    <div className="non-healthcare-result">
      <div className="result-icon">
        <span>🤔</span>
      </div>
      
      <h3>This doesn't look like a healthcare document</h3>
      
      <div className="detected-info">
        <p className="detected-type">
          This appears to be: <strong>{detectedType || 'a non-medical document'}</strong>
        </p>
        
        {identifiedEntity && (
          <p className="detected-entity">
            From: <strong>{identifiedEntity}</strong>
          </p>
        )}
      </div>

      <div className="explanation">
        <p>
          I'm designed to help with healthcare documents like medical bills, 
          insurance statements (EOBs), and clinical records.
        </p>
      </div>

      {contactInfo && (
        <div className="contact-suggestion">
          <p>For questions about this document, you can contact:</p>
          <a href={contactInfo.includes('@') ? `mailto:${contactInfo}` : `tel:${contactInfo}`} className="contact-link">
            {contactInfo.includes('@') ? '✉️' : '📞'} {contactInfo}
          </a>
        </div>
      )}

      <div className="what-i-can-help">
        <h4>I can help with:</h4>
        <ul>
          <li>Medical bills and hospital statements</li>
          <li>Explanation of Benefits (EOB) from insurance</li>
          <li>Lab results and clinical summaries</li>
          <li>Insurance cards</li>
        </ul>
      </div>

      <div className="action-prompt">
        <p>Have a healthcare document? Upload it and I'll help you understand it!</p>
      </div>

      {/* Confidence indicator */}
      {confidence && confidence < 0.7 && (
        <p className="confidence-note">
          <span className="info-icon">ℹ️</span>
          If this actually is a healthcare document, try uploading a clearer image and I'll analyze it.
        </p>
      )}
    </div>
  );
}

export default NonHealthcareResult;
