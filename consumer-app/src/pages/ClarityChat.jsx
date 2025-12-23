/**
 * ClarityChat - Main Clarity interface
 * Chat-based UI for healthcare document analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/clarity/DocumentUpload';
import ChatMessage from '../components/clarity/ChatMessage';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import { analyzeDocument } from '../services/clarityApi';
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
    const question = inputText;
    setInputText('');
    setIsLoading(true);

    // Simulate AI response for text questions (document upload uses real API)
    setTimeout(() => {
      let response = "";
      
      // Simple keyword matching for common questions
      const q = question.toLowerCase();
      if (q.includes('deductible')) {
        response = "A deductible is the amount you pay for healthcare services before your insurance starts to pay. For example, if your deductible is $1,000, you pay the first $1,000 of covered services yourself. After that, your insurance kicks in and you typically pay a smaller portion (like a copay or coinsurance) while insurance covers the rest.";
      } else if (q.includes('eob') || q.includes('explanation of benefits')) {
        response = "An Explanation of Benefits (EOB) is a statement from your insurance company that shows what they paid for a medical service. It's NOT a bill! It shows: the service provided, what the provider charged, what your insurance paid, and what you may owe. Always compare your EOB to any bill you receive.";
      } else if (q.includes('copay') || q.includes('co-pay')) {
        response = "A copay is a fixed amount you pay for a covered healthcare service. For example, you might pay $25 for a doctor visit or $10 for a prescription. Copays don't usually count toward your deductible.";
      } else if (q.includes('coinsurance')) {
        response = "Coinsurance is your share of costs after you've met your deductible. It's usually a percentage. For example, with 20% coinsurance, you pay 20% of the cost and your insurance pays 80%.";
      } else if (q.includes('out of pocket') || q.includes('out-of-pocket')) {
        response = "Your out-of-pocket maximum is the most you'll pay for covered services in a year. Once you reach this limit, your insurance pays 100% of covered services. This includes deductibles, copays, and coinsurance, but not your premium.";
      } else if (q.includes('premium')) {
        response = "A premium is the amount you pay for your health insurance every month. You pay this whether or not you use medical services. It's separate from deductibles, copays, and coinsurance.";
      } else if (q.includes('bill') && q.includes('question')) {
        response = "Great questions to ask about your medical bill:\n\n1. Can I get an itemized bill?\n2. Are all these charges correct?\n3. Is this covered by my insurance?\n4. Do you offer a payment plan?\n5. Do you offer a discount for paying in full?\n6. Is there financial assistance available?";
      } else {
        response = "That's a great question! For the most accurate answer, I recommend uploading your specific document (bill, EOB, or statement) and I can analyze it in detail. Or, feel free to ask about specific terms like deductibles, copays, coinsurance, or EOBs.";
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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