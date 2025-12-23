/**
 * QuickActions - Preset question buttons
 * Allows users to quickly select common questions
 */

import React, { useState } from 'react';
import './QuickActions.css';

function QuickActions({ presets, onSelect, onCustomSubmit }) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      onCustomSubmit(customQuestion.trim());
      setCustomQuestion('');
      setShowCustomInput(false);
    }
  };

  const getIcon = (key) => {
    const icons = {
      'what_does_this_mean': '❓',
      'what_do_i_owe': '💰',
      'is_price_correct': '✅',
      'explain_this': '📖'
    };
    return icons[key] || '💬';
  };

  return (
    <div className="quick-actions">
      <div className="quick-actions-grid">
        {presets.map((preset) => (
          <button
            key={preset.key}
            className="quick-action-btn"
            onClick={() => onSelect(preset.key)}
          >
            <span className="quick-action-icon">{getIcon(preset.key)}</span>
            <span className="quick-action-label">{preset.label}</span>
          </button>
        ))}
      </div>

      {!showCustomInput ? (
        <button 
          className="custom-question-trigger"
          onClick={() => setShowCustomInput(true)}
        >
          Or ask your own question...
        </button>
      ) : (
        <form onSubmit={handleCustomSubmit} className="custom-question-form">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Type your question..."
            className="custom-question-input"
            autoFocus
          />
          <button 
            type="submit" 
            className="custom-question-submit"
            disabled={!customQuestion.trim()}
          >
            Ask
          </button>
        </form>
      )}
    </div>
  );
}

export default QuickActions;
