/**
 * ClarityChat Page - Matching Figma Design
 * Features: + button for uploads, microphone, user avatars, teal assistant bubbles
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentUpload from '../components/clarity/DocumentUpload';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import { 
  sendChatMessage, 
  analyzeDocument, 
  getUserLocation,
  setUserLocation,
  parseLocationInput 
} from '../services/clarityApi';

const MAX_MESSAGES = 50;

// Global variable to store pending file (survives navigation)
let pendingUploadFile = null;

// Function to set pending file (called from Home.jsx)
export const setPendingUploadFile = (file) => {
  pendingUploadFile = file;
};

function ClarityChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasProcessedState = useRef(false);
  const hasProcessedPendingFile = useRef(false);
  
  const shouldOpenUpload = location.state?.openUpload === true;
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('chat');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [locationPromptShown, setLocationPromptShown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Get user info from localStorage (Google auth)
  const [userAvatar, setUserAvatar] = useState(null);
  
  useEffect(() => {
    // Try to get user avatar from stored auth
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserAvatar(user.picture || user.avatar || null);
      } catch (e) {
        console.log('No user avatar found');
      }
    }
  }, []);

  // Process any pending file from Home page navigation
  useEffect(() => {
    if (hasProcessedPendingFile.current) return;
    
    if (pendingUploadFile) {
      hasProcessedPendingFile.current = true;
      const file = pendingUploadFile;
      pendingUploadFile = null;
      
      setTimeout(() => {
        handleDocumentUpload(file);
      }, 100);
    }
  }, []);
  
  // Handle preset question on mount
  useEffect(() => {
    if (hasProcessedState.current) return;
    
    const state = location.state;
    if (!state) return;
    
    if (state.presetQuestion || state.initialQuestion) {
      hasProcessedState.current = true;
      const question = state.presetQuestion || state.initialQuestion;
      setTimeout(() => {
        handleSendMessage(question);
      }, 100);
    }
    
    if (state.openUpload) {
      hasProcessedState.current = true;
    }
  }, []);
  
  useEffect(() => {
    getUserLocation().then(loc => {
      if (loc) console.log('Location obtained:', loc);
    });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (!isLoading && inputRef.current && !showUploadSheet && !showUploadModal) {
      inputRef.current.focus();
    }
  }, [isLoading, showUploadSheet, showUploadModal]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const getHistoryForAPI = () => {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({ role: msg.role, content: msg.content }));
  };
  
  const handleSendMessage = async (messageText = null) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;
    
    const locationKeywords = ['i live in', 'i\'m in', 'located in', 'my zip', 'zip code is'];
    const isLocationResponse = locationKeywords.some(kw => text.toLowerCase().includes(kw));
    
    if (isLocationResponse) {
      const parsed = parseLocationInput(text.replace(/.*(?:i live in|i'm in|located in|my zip|zip code is)\s*/i, ''));
      if (parsed) setUserLocation(parsed);
    }
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
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
        timestamp: new Date(),
        triggers: response.triggers
      };
      
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), assistantMessage]);
      
      if (response.triggers?.locationNeeded && !locationPromptShown) {
        setLocationPromptShown(true);
      }
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDocumentUpload = async (file) => {
    setShowUploadModal(false);
    setShowUploadSheet(false);
    setIsLoading(true);
    setLoadingType('document');
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: `[Uploaded: ${file.name}]`,
      timestamp: new Date(),
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
        timestamp: new Date(),
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
        content: "I couldn't analyze that document. Please try uploading a clearer image.",
        timestamp: new Date(),
        isError: true
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
  
  // Voice input handler
  const handleMicrophoneClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Try Chrome or Safari.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  
  // Attachment sheet handlers
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleDocumentUpload(file);
    };
    input.click();
    setShowUploadSheet(false);
  };
  
  const handlePhotoLibrary = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleDocumentUpload(file);
    };
    input.click();
    setShowUploadSheet(false);
  };
  
  const handleBrowseFiles = () => {
    setShowUploadSheet(false);
    setShowUploadModal(true);
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  };
  
  const isWelcomeState = messages.length === 0;
  
  // Prompt cards for welcome state
  const promptCards = [
    "How do I find a good therapist near me?",
    "What's a fair price for an MRI?",
    "How do I negotiate a hospital bill?",
    "What should I look for in a med spa?",
    "Help me understand my insurance benefits",
    "What questions should I ask a new doctor?"
  ];
  
  return (
    <div style={styles.container}>
      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {isWelcomeState ? (
          <div style={styles.welcomeContainer}>
            {/* Findr Logo */}
            <svg style={styles.logo} width="64" height="64" viewBox="0 0 63 63" fill="none">
              <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="#17DDC0"/>
              <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="#17DDC0"/>
              <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="#17DDC0"/>
              <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="#17DDC0"/>
            </svg>
            
            {/* Welcome Text */}
            <h1 style={styles.welcomeTitle}>
              Hi I'm Clarity your personal health and wellness assistant
            </h1>
            
            {/* Prompt Cards */}
            <div style={styles.promptCards}>
              {promptCards.map((prompt, index) => (
                <button
                  key={index}
                  style={styles.promptCard}
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.chatMessages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  flexDirection: msg.role === 'user' ? 'row' : 'row-reverse'
                }}
              >
                {/* Avatar */}
                {msg.role === 'user' ? (
                  <div style={styles.avatarContainer}>
                    {userAvatar ? (
                      <img src={userAvatar} alt="" style={styles.userAvatar} />
                    ) : (
                      <div style={styles.defaultAvatar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.assistantAvatarContainer}>
                    <svg width="24" height="24" viewBox="0 0 63 63" fill="none">
                      <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0"/>
                      <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
                      <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
                      <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
                      <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
                    </svg>
                  </div>
                )}
                
                {/* Message Bubble */}
                <div style={styles.messageContent}>
                  <div
                    style={{
                      ...styles.messageBubble,
                      backgroundColor: msg.role === 'user' ? '#F3F4F6' : '#E0FAF5',
                      color: msg.role === 'user' ? '#374151' : '#065F46',
                      borderRadius: msg.role === 'user' 
                        ? '16px 16px 16px 4px' 
                        : '16px 16px 4px 16px'
                    }}
                  >
                    {msg.content}
                  </div>
                  <div style={{
                    ...styles.timestamp,
                    textAlign: msg.role === 'user' ? 'left' : 'right'
                  }}>
                    {formatTime(msg.timestamp)} <span style={styles.sentIndicator}>✓✓ Sent</span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ ...styles.messageRow, flexDirection: 'row-reverse' }}>
                <div style={styles.assistantAvatarContainer}>
                  <svg width="24" height="24" viewBox="0 0 63 63" fill="none">
                    <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0"/>
                    <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
                    <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
                    <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
                    <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
                  </svg>
                </div>
                <div style={styles.messageContent}>
                  <div style={{ ...styles.messageBubble, backgroundColor: '#E0FAF5', padding: '16px 20px' }}>
                    <LoadingIndicator type={loadingType} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          {/* Plus Button */}
          <button
            style={styles.plusButton}
            onClick={() => setShowUploadSheet(true)}
            disabled={isLoading}
            aria-label="Add attachment"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            style={styles.textInput}
            placeholder="Search anything medical and wellness"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          {/* Microphone / Send Button */}
          {inputValue.trim() ? (
            <button
              style={styles.micButton}
              onClick={() => handleSendMessage()}
              disabled={isLoading}
              aria-label="Send message"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#17DDC0" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9" fill="#17DDC0"/>
              </svg>
            </button>
          ) : (
            <button
              style={{
                ...styles.micButton,
                backgroundColor: isListening ? '#FEE2E2' : 'transparent'
              }}
              onClick={handleMicrophoneClick}
              disabled={isLoading}
              aria-label="Voice input"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#EF4444' : '#111827'} strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <nav style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </button>
        
        <button style={styles.navButtonCenter}>
          <svg width="32" height="32" viewBox="0 0 63 63" fill="none">
            <circle cx="31.5" cy="31.5" r="30" fill="#17DDC0"/>
            <path d="M13.2831 30.8584V22.68C18.6881 22.68 23.0842 18.2829 23.0842 12.8789H31.2627C31.2627 22.7927 23.1969 30.8584 13.2831 30.8584Z" fill="white"/>
            <path d="M50 30.8584C40.0862 30.8584 32.0204 22.7927 32.0204 12.8789H40.1989C40.1989 18.2838 44.596 22.68 50 22.68V30.8584Z" fill="white"/>
            <path d="M40.198 49.6807H32.0196C32.0196 39.7669 40.0853 31.7012 49.9991 31.7012V39.8796C44.5942 39.8796 40.198 44.2767 40.198 49.6807Z" fill="white"/>
            <path d="M31.2627 49.6807H23.0842C23.0842 44.2758 18.6871 39.8796 13.2831 39.8796V31.7012C23.1969 31.7012 31.2627 39.7669 31.2627 49.6807Z" fill="white"/>
          </svg>
        </button>
        
        <button style={styles.navButton} onClick={() => navigate('/profile')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </nav>
      
      {/* Upload Bottom Sheet */}
      {showUploadSheet && (
        <>
          <div style={styles.overlay} onClick={() => setShowUploadSheet(false)} />
          <div style={styles.bottomSheet}>
            <button style={styles.sheetOption} onClick={handleTakePhoto}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Take Photo</span>
            </button>
            
            <button style={styles.sheetOption} onClick={handlePhotoLibrary}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <span>Photo Library</span>
            </button>
            
            <button style={styles.sheetOption} onClick={handleBrowseFiles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span>Browse Files</span>
            </button>
            
            <button style={styles.cancelButton} onClick={() => setShowUploadSheet(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
      
      {/* Document Upload Modal (for file browser) */}
      {showUploadModal && (
        <DocumentUpload
          onUpload={handleDocumentUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Urbanist, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '20px',
    textAlign: 'center'
  },
  logo: {
    marginBottom: '24px'
  },
  welcomeTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '32px',
    maxWidth: '280px',
    lineHeight: 1.4
  },
  promptCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
    maxWidth: '340px'
  },
  promptCard: {
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#374151',
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s'
  },
  chatMessages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '16px'
  },
  messageRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  avatarContainer: {
    flexShrink: 0
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  defaultAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  assistantAvatarContainer: {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%'
  },
  messageBubble: {
    padding: '12px 16px',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#17DDC0',
    marginTop: '4px'
  },
  sentIndicator: {
    marginLeft: '4px'
  },
  inputArea: {
    padding: '12px 16px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: '24px',
    padding: '8px 12px',
    gap: '8px'
  },
  plusButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#111827'
  },
  micButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  bottomNav: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '12px 0 24px 0',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  navButton: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer'
  },
  navButtonCenter: {
    background: 'none',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    marginTop: '-24px'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100
  },
  bottomSheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '20px',
    zIndex: 101,
    animation: 'slideUp 0.3s ease-out'
  },
  sheetOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    padding: '16px',
    border: 'none',
    background: 'none',
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: '#374151',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    width: '100%',
    padding: '16px',
    marginTop: '8px',
    border: 'none',
    backgroundColor: '#F3F4F6',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    color: '#6B7280',
    cursor: 'pointer'
  }
};

export default ClarityChat;
