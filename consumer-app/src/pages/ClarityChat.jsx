/**
 * ClarityChat Page
 * Findr Health - Consumer App
 * 
 * Main chat interface for Cost Navigator and Document Analysis
 * Updated with conversation history and geolocation support
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatMessage from '../components/clarity/ChatMessage';
import DocumentUpload from '../components/clarity/DocumentUpload';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import BottomNav from '../components/BottomNav';
import { 
  sendChatMessage, 
  analyzeDocument, 
  getUserLocation,
  setUserLocation,
  parseLocationInput 
} from '../services/clarityApi';
import '../styles/ClarityChat.css';

// Maximum messages to keep in history (for memory management)
const MAX_MESSAGES = 50;

function ClarityChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('chat'); // 'chat' or 'document'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [locationPromptShown, setLocationPromptShown] = useState(false);
  
  // Check for preset question from navigation
  useEffect(() => {
    if (location.state?.presetQuestion) {
      handleSendMessage(location.state.presetQuestion);
      // Clear the state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  
  // Request geolocation on mount (once)
  useEffect(() => {
    getUserLocation().then(loc => {
      if (loc) {
        console.log('Location obtained:', loc);
      }
    });
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Auto-focus input when not loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Get conversation history for API (excludes welcome, system messages)
   */
  const getHistoryForAPI = () => {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  };
  
  /**
   * Handle sending a chat message
   */
  const handleSendMessage = async (messageText = null) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;
    
    // Check if user is providing location info
    const locationKeywords = ['i live in', 'i\'m in', 'located in', 'my zip', 'zip code is'];
    const isLocationResponse = locationKeywords.some(kw => text.toLowerCase().includes(kw));
    
    if (isLocationResponse) {
      const parsed = parseLocationInput(text.replace(/.*(?:i live in|i'm in|located in|my zip|zip code is)\s*/i, ''));
      if (parsed) {
        setUserLocation(parsed);
      }
    }
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), userMessage]);
    setInputValue('');
    setIsLoading(true);
    setLoadingType('chat');
    
    try {
      const history = getHistoryForAPI();
      const response = await sendChatMessage(text, history);
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        triggers: response.triggers
      };
      
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), assistantMessage]);
      
      // Handle triggers (for future UI enhancements)
      if (response.triggers?.locationNeeded && !locationPromptShown) {
        setLocationPromptShown(true);
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle document upload and analysis
   */
  const handleDocumentUpload = async (file) => {
    setShowUploadModal(false);
    setIsLoading(true);
    setLoadingType('document');
    
    // Add user message indicating upload
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: `[Uploaded document: ${file.name}]`,
      timestamp: new Date().toISOString(),
      isUpload: true,
      fileName: file.name
    };
    
    setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), userMessage]);
    
    try {
      const response = await analyzeDocument(file);
      
      const analysisMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.analysis,
        timestamp: new Date().toISOString(),
        documentType: response.documentType,
        triggers: response.triggers,
        isAnalysis: true
      };
      
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), analysisMessage]);
      
    } catch (error) {
      console.error('Document analysis error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I couldn't analyze that document. Please try uploading a clearer image, or describe what you're seeing and I'll try to help.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle new chat - clear messages
   */
  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setLocationPromptShown(false);
    inputRef.current?.focus();
  };
  
  /**
   * Handle input key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Determine if we're in welcome state (no messages)
  const isWelcomeState = messages.length === 0;
  
  return (
    <div className="clarity-chat-page">
      {/* Header */}
      <header className="clarity-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="header-brand">
          <span className="header-findr">findr</span>
          <svg className="header-icon" width="24" height="24" viewBox="0 0 63 63" fill="none">
            <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0" stroke="#17DDC0" strokeWidth="3"/>
            <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
            <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
            <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
            <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
          </svg>
          <span className="header-health">health</span>
        </div>
        
        {!isWelcomeState ? (
          <button className="new-chat-btn" onClick={handleNewChat} title="New Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        ) : (
          <div style={{ width: 40 }} /> 
        )}
      </header>
      
      {/* Messages Area */}
      <div className={`clarity-messages ${!isWelcomeState ? 'chat-active' : ''}`}>
        {isWelcomeState ? (
          /* Welcome State */
          <div className="clarity-welcome">
            <h1 style={{ 
              fontFamily: 'Urbanist, sans-serif',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Hi, I'm Clarity
            </h1>
            <p style={{
              fontFamily: 'Urbanist, sans-serif',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#4B5563',
              marginBottom: '1.5rem',
              maxWidth: '320px',
              lineHeight: 1.5
            }}>
              I help you understand healthcare costs. Upload a bill or ask me anything about medical pricing, insurance, or negotiation.
            </p>
            
            <button 
              className="upload-document-btn"
              onClick={() => setShowUploadModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload a Document
            </button>
            
            <div className="quick-prompts">
              <span className="prompts-label">Or try asking:</span>
              <button onClick={() => handleSendMessage("How do I negotiate a hospital bill?")}>
                How do I negotiate a hospital bill?
              </button>
              <button onClick={() => handleSendMessage("What's a fair price for an MRI?")}>
                What's a fair price for an MRI?
              </button>
              <button onClick={() => handleSendMessage("Should I get health insurance or pay cash?")}>
                Should I get insurance or pay cash?
              </button>
            </div>
            
            {/* Inline input in welcome state */}
            <div className="inline-chat-input" style={{ marginTop: '1.5rem', maxWidth: '320px' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about healthcare costs..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <>
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg}
              />
            ))}
            
            {isLoading && (
              <LoadingIndicator type={loadingType} />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input Area - Only show in chat mode */}
      {!isWelcomeState && (
        <div className="clarity-input-area">
          <button 
            className="upload-btn"
            onClick={() => setShowUploadModal(true)}
            disabled={isLoading}
            aria-label="Upload document"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          
          <input
            ref={!isWelcomeState ? inputRef : null}
            type="text"
            className="clarity-input"
            placeholder="Ask about healthcare costs..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          <button 
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onUpload={handleDocumentUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default ClarityChat;
