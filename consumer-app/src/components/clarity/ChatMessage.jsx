/**
 * ChatMessage - Renders chat messages in Findr Health style
 * Handles different message types: text, document upload, analysis results, etc.
 */

import React from 'react';
import AnalysisResult from './AnalysisResult';
import NonHealthcareResult from './NonHealthcareResult';
import LoadingIndicator from './LoadingIndicator';
import './ChatMessage.css';

function ChatMessage({ message, presets, onPresetSelect, onCustomSubmit, onNewAnalysis }) {
  const { role, content, timestamp } = message;
  const isAssistant = role === 'assistant';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Render different content types
  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return <p className="message-text">{content.text}</p>;
      
      case 'document_upload':
        return (
          <div className="message-document">
            {content.previewUrl ? (
              <img src={content.previewUrl} alt="Uploaded document" className="document-preview" />
            ) : (
              <div className="document-icon">📄</div>
            )}
            <span className="document-name">{content.fileName}</span>
          </div>
        );
      
      case 'question_prompt':
        return (
          <div className="message-prompt">
            <p className="message-text">{content.text}</p>
          </div>
        );
      
      case 'loading':
        return <LoadingIndicator />;
      
      case 'analysis_result':
        return (
          <AnalysisResult 
            data={content.data} 
            onNewAnalysis={onNewAnalysis}
          />
        );
      
      case 'non_healthcare':
        return <NonHealthcareResult data={content.data} />;
      
      case 'error':
        return (
          <div className="message-error">
            <span className="error-icon">⚠️</span>
            <p>{content.text}</p>
          </div>
        );
      
      default:
        return <p className="message-text">{JSON.stringify(content)}</p>;
    }
  };

  return (
    <div className={`chat-message ${isAssistant ? 'assistant' : 'user'}`}>
      {isAssistant && (
        <div className="message-avatar">
          <div className="avatar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L16 8L12 12L8 8L12 4Z" fill="#00B4A6"/>
              <path d="M12 12L16 16L12 20L8 16L12 12Z" fill="#00B4A6"/>
            </svg>
          </div>
        </div>
      )}
      
      <div className="message-content">
        {renderContent()}
        
        <div className="message-meta">
          <span className="message-time">{formatTime(timestamp)}</span>
          {!isAssistant && <span className="message-status">✓ Sent</span>}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
