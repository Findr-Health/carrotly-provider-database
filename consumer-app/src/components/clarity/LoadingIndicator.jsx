/**
 * LoadingIndicator - Animated loading state for analysis
 */
import React, { useState, useEffect } from 'react';
import './LoadingIndicator.css';

function LoadingIndicator({ isDocument = false }) {
  const [message, setMessage] = useState(0);
  
  const documentMessages = [
    'Reading your document...',
    'Extracting information...',
    'Analyzing charges...',
    'Preparing your summary...',
    'Almost done...'
  ];

  const chatMessages = [
    'Thinking...',
    'Looking into that...',
    'Preparing response...'
  ];

  const messages = isDocument ? documentMessages : chatMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="loading-indicator">
      <div className="loading-animation">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
      <p className="loading-message">{messages[message]}</p>
    </div>
  );
}

export default LoadingIndicator;