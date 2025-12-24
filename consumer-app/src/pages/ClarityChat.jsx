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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app';

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

  // Focus input after messages update
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

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

    try {
      // Call the Anthropic API through our backend
      const response = await fetch(`${API_BASE_URL}/api/clarity/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response || data.message || "I'm here to help with your healthcare questions. Could you tell me more about what you'd like to know?",
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      // Fallback to helpful response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: getHelpfulResponse(question),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helpful responses for common questions
  const getHelpfulResponse = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('deductible')) {
      return "A deductible is the amount you pay for healthcare services before your insurance starts to pay. For example, if your deductible is $1,000, you pay the first $1,000 of covered services yourself. After that, your insurance kicks in and you typically pay a smaller portion (like a copay or coinsurance) while insurance covers the rest.\n\nWould you like to know more about how deductibles work with specific services?";
    }
    if (q.includes('eob') || q.includes('explanation of benefits')) {
      return "An Explanation of Benefits (EOB) is a statement from your insurance company that shows what they paid for a medical service. It's NOT a bill!\n\nIt shows:\n• The service provided\n• What the provider charged\n• What your insurance paid\n• What you may owe\n\nAlways compare your EOB to any bill you receive. If you have an EOB you'd like me to explain, upload it and I'll break it down for you!";
    }
    if (q.includes('copay') || q.includes('co-pay')) {
      return "A copay is a fixed amount you pay for a covered healthcare service. For example, you might pay $25 for a doctor visit or $10 for a prescription. Copays don't usually count toward your deductible.\n\nIs there a specific copay on a bill you're wondering about?";
    }
    if (q.includes('coinsurance')) {
      return "Coinsurance is your share of costs after you've met your deductible. It's usually a percentage. For example, with 20% coinsurance, you pay 20% of the cost and your insurance pays 80%.\n\nThis is different from a copay, which is a fixed dollar amount. Would you like me to explain more?";
    }
    if (q.includes('out of pocket') || q.includes('out-of-pocket')) {
      return "Your out-of-pocket maximum is the most you'll pay for covered services in a year. Once you reach this limit, your insurance pays 100% of covered services.\n\nThis includes:\n• Deductibles\n• Copays\n• Coinsurance\n\nBut NOT your monthly premium. What else would you like to know?";
    }
    if (q.includes('premium')) {
      return "A premium is the amount you pay for your health insurance every month. You pay this whether or not you use medical services. It's separate from deductibles, copays, and coinsurance.\n\nThink of it like a membership fee to have insurance coverage. Any other questions?";
    }
    if (q.includes('cbc') || q.includes('blood test') || q.includes('lab')) {
      return "Great question about lab pricing! Lab costs can vary significantly.\n\nFor a CBC (Complete Blood Count) in Montana:\n• Hospital lab: $50-150\n• Independent lab (Quest, LabCorp): $20-50\n• Direct-pay clinics: $15-35\n\n💡 Tips to save:\n1. Ask for the cash/self-pay price\n2. Use an independent lab instead of hospital\n3. Check if your insurance has preferred labs\n\nWould you like me to analyze a specific lab bill you've received?";
    }
    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
      return "Healthcare pricing can be confusing! Here are some tips:\n\n1. **Always ask for the cash price** - often lower than insurance price\n2. **Get an estimate in advance** - providers must give you a Good Faith Estimate\n3. **Compare prices** - use tools like Healthcare Bluebook or call different providers\n4. **Negotiate** - especially for large bills, providers often offer discounts\n\nIf you have a specific bill, upload it and I can help you understand if the charges seem reasonable!";
    }
    if (q.includes('bill') && q.includes('question')) {
      return "Great questions to ask about your medical bill:\n\n1. Can I get an itemized bill?\n2. Are all these charges correct?\n3. Is this covered by my insurance?\n4. Do you offer a payment plan?\n5. Do you offer a discount for paying in full?\n6. Is there financial assistance available?\n\nWould you like me to look at your actual bill? Just upload it!";
    }
    if (q.includes('negotiate') || q.includes('lower') || q.includes('reduce')) {
      return "Yes, you can often negotiate medical bills! Here's how:\n\n1. **Ask for an itemized bill** - look for errors or duplicate charges\n2. **Compare to fair prices** - use Healthcare Bluebook\n3. **Ask for the cash price** - often 20-50% lower\n4. **Request a payment plan** - interest-free is common\n5. **Ask about financial assistance** - most hospitals have programs\n6. **Offer to pay immediately** - for a discount\n\nWant me to analyze a bill you're trying to negotiate?";
    }
    if (q.includes('appeal') || q.includes('denied') || q.includes('denial')) {
      return "If your insurance denied a claim, you have the right to appeal!\n\nSteps to appeal:\n1. **Get the denial in writing** - understand why it was denied\n2. **Review your policy** - confirm the service should be covered\n3. **Gather documentation** - doctor's notes, medical records\n4. **Submit a written appeal** - be specific and include evidence\n5. **Follow up** - insurers have deadlines to respond\n\nMost appeals that are filed actually succeed! Would you like more specific guidance?";
    }
    if (q.includes('insurance') && (q.includes('work') || q.includes('how'))) {
      return "Here's how health insurance works:\n\n1. **Premium** - Your monthly payment to have coverage\n2. **Deductible** - What you pay before insurance kicks in\n3. **Copay** - Fixed amount per visit\n4. **Coinsurance** - Your percentage after deductible\n5. **Out-of-pocket max** - Most you'll pay in a year\n\nWant me to explain any of these in more detail?";
    }
    
    // Default helpful response
    return "I'd love to help with that! For the most specific answer, you can:\n\n1. **Upload a document** - I can analyze bills, EOBs, and statements in detail\n2. **Ask about specific terms** - deductibles, copays, coinsurance, etc.\n3. **Ask about pricing** - I can give general guidance on fair prices\n\nWhat would you like to explore?";
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
        content: response.data?.summary?.plainLanguageSummary || "I've analyzed your document. Here's what I found.",
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
            <p className="welcome-text">Ask Clarity about your healthcare journey or upload a document and I'll explain it.</p>
            
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
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
           
          </>
        )}
        
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Always visible */}
      <div className="clarity-input-area">
        <button 
          className="upload-btn"
          onClick={() => setShowUpload(true)}
          aria-label="Upload document"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a follow-up question..."
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