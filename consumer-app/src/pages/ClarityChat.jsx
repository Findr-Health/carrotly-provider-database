/**
 * ClarityChat - Main Clarity interface
 * Chat-based UI for healthcare document analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentUpload from '../components/clarity/DocumentUpload';
import ChatMessage from '../components/clarity/ChatMessage';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import { analyzeDocument } from '../services/clarityApi';
import '../styles/ClarityChat.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app';

function ClarityChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);

  // Handle initial state from navigation (preloaded question or open upload)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const state = location.state;
    if (state?.initialQuestion) {
      setInputText(state.initialQuestion);
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (state?.openUpload) {
      setShowUpload(true);
    }
    
    // Clear the state so refreshing doesn't re-trigger
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // Only scroll to bottom when new messages are added, not on initial load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (q.includes('survive without insurance') || q.includes('without coverage') || q.includes('need insurance')) {
      return "Living without health insurance is a real option for some people. Here's what to consider:\n\n**It might work if you:**\n• Are generally healthy with no chronic conditions\n• Have savings for emergencies ($5K-10K minimum)\n• Can pay cash for routine care\n• Live near affordable cash-pay clinics\n\n**Strategies that help:**\n• Negotiate cash prices directly (often 40-60% less than insurance rates)\n• Use direct primary care ($50-150/month for unlimited visits)\n• Get catastrophic-only coverage for major events\n• Use GoodRx or similar for medications\n\n**Risks to consider:**\n• One major accident or illness can mean $50K+ in debt\n• No ACA penalty currently, but state rules vary\n• Pre-existing conditions could affect future coverage\n\nWant me to help you think through your specific situation?";
    }
    if (q.includes('high-deductible') || q.includes('hdhp')) {
      return "A High-Deductible Health Plan (HDHP) can actually save you money in the right situation.\n\n**Good fit if you:**\n• Are generally healthy\n• Don't take expensive medications\n• Have savings to cover the deductible\n• Want to use an HSA (tax-advantaged savings)\n\n**The math:**\n• Lower monthly premiums (often $200-400/month less)\n• Higher deductible ($1,500-$7,000)\n• HSA contributions are tax-deductible\n\n**Example:** If you save $300/month in premiums ($3,600/year) and your deductible is $3,000, you come out ahead if you don't hit that deductible.\n\nWant me to help you compare the numbers for your situation?";
    }
    if (q.includes('insurance or pay cash') || q.includes('cash price')) {
      return "Great question! Paying cash is often cheaper than using insurance. Here's why:\n\n**Cash prices are often lower because:**\n• No insurance company middleman\n• Providers get paid immediately\n• Less administrative overhead\n\n**When to pay cash:**\n• You haven't met your deductible yet\n• The cash price is lower than your copay\n• You're uninsured or underinsured\n\n**How to get cash prices:**\n• Ask: 'What's your self-pay or cash price?'\n• Compare multiple providers\n• Check Surgery Center of Oklahoma, MDsave for procedures\n\n**Pro tip:** Even with insurance, ask for the cash price. Sometimes it's 50% less than the 'insurance rate.'\n\nDo you have a specific procedure or service in mind?";
    }
    if (q.includes('fair price') || q.includes('real cost')) {
      return "Finding the real cost of healthcare is tricky, but here's how:\n\n**Tools to find fair prices:**\n• Healthcare Bluebook (fairhealthconsumer.org)\n• Medicare's price lookup tool\n• Call 3 providers and ask for cash prices\n\n**What you'll usually find:**\n• Hospital prices: 2-5x higher than fair market\n• Surgery centers: Often 50-70% less than hospitals\n• Independent labs: 70-80% less than hospital labs\n\n**Example - MRI:**\n• Hospital: $2,000-4,000\n• Imaging center: $400-800\n• Same machine, same quality\n\nWhat procedure or service are you trying to price?";
    }
    if (q.includes('overcharg') || q.includes('too much')) {
      return "Medical bills often contain errors or inflated charges. Here's how to check:\n\n**Red flags for overcharging:**\n• Charges for services you didn't receive\n• Duplicate charges for the same thing\n• 'Facility fees' that seem excessive\n• Charges way above Medicare rates\n\n**How to fight back:**\n1. Request an itemized bill (not just a summary)\n2. Compare to Medicare rates (usually 2-3x is reasonable, 5-10x is excessive)\n3. Ask: 'Can you explain this charge?'\n4. Request the cash/self-pay price\n5. Ask for a payment plan while you dispute\n\n**What to say:** 'I'd like to understand these charges before paying. Can you send me an itemized bill and explain the pricing?'\n\nDo you have a bill you'd like me to look at?";
    }
    if (q.includes('afford') || q.includes('can\'t pay') || q.includes('payment plan')) {
      return "If you can't afford a medical bill, you have options:\n\n**Immediate steps:**\n1. Don't ignore it (but don't pay immediately either)\n2. Request an itemized bill\n3. Ask for the cash/self-pay discount\n4. Apply for financial assistance (most hospitals have programs)\n\n**Negotiation strategies:**\n• Offer to pay 25-50% upfront for a discount\n• Ask for a 0% payment plan\n• Say: 'This amount isn't possible for me. What can we work out?'\n\n**If you qualify as low-income:**\n• Hospital charity care (required by law for nonprofits)\n• State Medicaid programs\n• Community health centers (sliding scale fees)\n\n**Last resorts:**\n• Medical bill negotiation services\n• Medical credit cards (careful with interest)\n• Bankruptcy (medical debt is dischargeable)\n\nWant help figuring out what to say to the billing department?";
    }
    if (q.includes('negotiate')) {
      return "Yes, you can negotiate almost any medical bill. Here's how:\n\n**Before you call:**\n• Get an itemized bill\n• Research fair prices (Healthcare Bluebook)\n• Know your budget\n\n**What to say:**\n• 'What's your best cash price?'\n• 'I can't afford this. What options do we have?'\n• 'I've researched fair prices and this seems high. Can you match $X?'\n• 'Can you reduce this to the Medicare rate?'\n\n**Leverage points:**\n• Offer to pay immediately for a discount\n• Mention financial hardship\n• Ask about charity care programs\n• Be polite but persistent\n\n**Success rates:**\n• 50-80% of people who negotiate get some reduction\n• Average savings: 30-50%\n\nWant me to help you prepare for a specific negotiation?";
    }
    
    // Default helpful response
    return "I'd be happy to help with that! For the most specific answer, you can:\n\n• **Ask about costs** - insurance vs. cash, fair prices, negotiation strategies\n• **Upload a document** - I can analyze bills, EOBs, lab results, and more\n• **Explore options** - whether insurance makes sense for your situation\n\nWhat would you like to dig into?";
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
            {/* Upload Document Button */}
            <button className="upload-document-btn" onClick={() => setShowUpload(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Upload a Document
            </button>
            
            <div className="quick-prompts">
              <p className="prompts-label">Or ask a question:</p>
              
              {/* Chat input */}
              <div className="inline-chat-input">
                <input
                  ref={inputRef}
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

      {/* Input Area - Always visible */}
      <div className="clarity-input-area">
        <button 
          className="upload-btn"
          onClick={() => setShowUpload(true)}
          aria-label="Upload document"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <input
          ref={messages.length > 0 ? inputRef : null}
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