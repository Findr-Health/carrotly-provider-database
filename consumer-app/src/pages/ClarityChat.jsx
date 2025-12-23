/**
 * ClarityChat - Main Clarity interface
 * Chat-based UI for healthcare document analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/clarity/DocumentUpload';
import ChatMessage from '../components/clarity/ChatMessage';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import { analyzeDocument, analyzeQuestion } from '../services/clarityApi';
import '../styles/ClarityChat.css';

function ClarityChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await analyzeQuestion(inputText);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data?.summary?.plainLanguageSummary || response.message || "I can help you understand healthcare billing and documents. Try uploading a bill or asking a specific question about medical costs.",
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I couldn't process that. Please try again or upload a document for me to analyze.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDocumentUpload = async (file, question) => {
    setShowUpload(false);
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `Uploaded: ${file.name}`,
      hasDocument: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await analyzeDocument(file, question);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data?.summary?.plainLanguageSummary || "I've analyzed your document.",
        analysisResult: response.data,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I had trouble analyzing that document. Please make sure it's a clear image of a medical bill or EOB and try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="clarity-chat-page">
      {/* Header */}
      <header className="clarity-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="clarity-logo">
          <img src="/findr-logo.svg" alt="Findr Health" className="clarity-logo-img" />
        </div>
        <div style={{ width: 40 }}></div>
      </header>

      {/* Messages Area */}
      <div className="clarity-messages">
        {messages.length === 0 ? (
          <div className="clarity-welcome">
            <h2>Welcome to Clarity</h2>
            <p>Ask me anything about your healthcare journey or upload a document and I'll explain it.</p>
            
            {/* Upload Document Button */}
            <button className="upload-document-btn" onClick={() => setShowUpload(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Upload a Document
            </button>
            
            <div className="quick-prompts">
              <p className="prompts-label">Or ask a question:</p>
              
              {/* Empty chat input */}
              <div className="inline-chat-input">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here..."
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              
              <p className="prompts-label-small">Or try one of these:</p>
              <button onClick={() => setInputText("What's a deductible and how does it work?")}>
                What's a deductible?
              </button>
              <button onClick={() => setInputText("How do I read an Explanation of Benefits?")}>
                How to read an EOB?
              </button>
              <button onClick={() => setInputText("What questions should I ask about my medical bill?")}>
                Questions to ask about my bill
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="clarity-input-area">
        <button 
          className="upload-btn"
          onClick={() => setShowUpload(true)}
          aria-label="Upload document"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="clarity-input"
        />
        
        <button 
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="upload-modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowUpload(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <DocumentUpload onUpload={handleDocumentUpload} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClarityChat;