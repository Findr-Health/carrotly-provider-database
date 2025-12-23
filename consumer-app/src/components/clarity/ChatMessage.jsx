/**
 * ChatMessage - Individual message bubble
 */

import React from 'react';
import AnalysisResult from './AnalysisResult';

function ChatMessage({ message }) {
  const isUser = message.type === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'ai'}`}>
      <div className="message-bubble">
        {message.content}
        {message.analysisResult && (
          <AnalysisResult data={message.analysisResult} />
        )}
      </div>
    </div>
  );
}

export default ChatMessage;