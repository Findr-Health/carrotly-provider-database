/**
 * ChatWelcome - Welcome screen for Clarity Chat
 * Matches Findr Health design language
 */

import React from 'react';
import './ChatWelcome.css';

function ChatWelcome({ onUploadClick }) {
  return (
    <div className="chat-welcome">
      {/* Findr Logo */}
      <div className="welcome-logo">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="20" fill="#00B4A6" fillOpacity="0.1"/>
          <path d="M40 20L52 32L40 44L28 32L40 20Z" fill="#00B4A6"/>
          <path d="M40 36L52 48L40 60L28 48L40 36Z" fill="#00B4A6"/>
          <path d="M24 32L36 44L24 56L12 44L24 32Z" fill="#00B4A6" fillOpacity="0.6"/>
          <path d="M56 32L68 44L56 56L44 44L56 32Z" fill="#00B4A6" fillOpacity="0.6"/>
        </svg>
      </div>

      {/* Welcome Text */}
      <h2 className="welcome-title">
        Hi, I'm your healthcare document helper
      </h2>
      <p className="welcome-subtitle">
        Upload a medical bill, insurance statement, or health document and I'll help you understand it.
      </p>

      {/* Quick Action Buttons */}
      <div className="welcome-actions">
        <button className="welcome-action-btn" onClick={onUploadClick}>
          <span className="action-icon">📄</span>
          <span className="action-text">Upload a bill or statement</span>
        </button>
        <button className="welcome-action-btn" onClick={onUploadClick}>
          <span className="action-icon">📷</span>
          <span className="action-text">Take a photo of a document</span>
        </button>
      </div>

      {/* Privacy Note */}
      <p className="welcome-privacy">
        <span className="privacy-icon">🔒</span>
        Your documents are analyzed securely and never stored
      </p>

      {/* What I Can Help With */}
      <div className="welcome-capabilities">
        <h3>I can help you understand:</h3>
        <ul>
          <li>Medical bills and hospital statements</li>
          <li>Insurance Explanation of Benefits (EOB)</li>
          <li>What charges mean in plain English</li>
          <li>What you actually owe</li>
          <li>Questions to ask your provider</li>
        </ul>
      </div>
    </div>
  );
}

export default ChatWelcome;
