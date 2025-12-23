/**
 * LoadingIndicator - Animated loading state for analysis
 */

import React, { useState, useEffect } from 'react';
import './LoadingIndicator.css';

function LoadingIndicator() {
  const [message, setMessage] = useState(0);
  
  const messages = [
    'Reading your document...',
    'Extracting information...',
    'Analyzing charges...',
    'Preparing your summary...',
    'Almost done...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
