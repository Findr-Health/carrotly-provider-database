/**
 * ClarityChat - Healthcare Document Analysis Chat Interface
 * Findr Health Consumer App
 */

import React, { useState, useRef, useEffect } from 'react';
import ChatWelcome from '../components/clarity/ChatWelcome';
import ChatMessage from '../components/clarity/ChatMessage';
import DocumentUpload from '../components/clarity/DocumentUpload';
import QuickActions from '../components/clarity/QuickActions';
import AnalysisResult from '../components/clarity/AnalysisResult';
import LoadingIndicator from '../components/clarity/LoadingIndicator';
import NonHealthcareResult from '../components/clarity/NonHealthcareResult';
import { analyzeDocument, getPresets } from '../services/clarityApi';
import '../styles/ClarityChat.css';

function ClarityChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [presets, setPresets] = useState([]);
  const [awaitingQuestion, setAwaitingQuestion] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load preset questions on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadPresets = async () => {
    try {
      const data = await getPresets();
      setPresets(data.presets || []);
    } catch (error) {
      console.error('Error loading presets:', error);
      // Default presets if API fails
      setPresets([
        { key: 'what_does_this_mean', label: 'What does this document mean?' },
        { key: 'what_do_i_owe', label: 'What do I owe?' },
        { key: 'is_price_correct', label: 'Does this price look correct?' },
        { key: 'explain_this', label: 'Explain this to me' }
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      // Add user message showing upload
      addMessage('user', {
        type: 'document_upload',
        fileName: file.name,
        fileType: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });

      // Show preset questions
      setAwaitingQuestion(true);
      addMessage('assistant', {
        type: 'question_prompt',
        text: "I've received your document. What would you like to know about it?",
        showPresets: true
      });
    }
  };

  const handleQuestionSelect = async (questionKey) => {
    if (!selectedFile) return;

    setAwaitingQuestion(false);
    
    // Show selected question as user message
    const questionLabel = presets.find(p => p.key === questionKey)?.label || questionKey;
    addMessage('user', { type: 'text', text: questionLabel });

    // Start analysis
    await runAnalysis(questionKey);
  };

  const handleCustomQuestion = async (question) => {
    if (!selectedFile || !question.trim()) return;

    setAwaitingQuestion(false);
    addMessage('user', { type: 'text', text: question });
    await runAnalysis(question);
  };

  const runAnalysis = async (question) => {
    setIsLoading(true);
    
    // Add loading message
    const loadingId = addMessage('assistant', { type: 'loading' });

    try {
      const result = await analyzeDocument(selectedFile, question);
      
      // Remove loading message
      removeMessage(loadingId);

      if (result.success) {
        if (result.isHealthcare === false) {
          // Non-healthcare document
          addMessage('assistant', {
            type: 'non_healthcare',
            data: result
          });
        } else {
          // Healthcare document - show analysis
          setCurrentAnalysis(result);
          addMessage('assistant', {
            type: 'analysis_result',
            data: result
          });
        }
      } else {
        // Error
        addMessage('assistant', {
          type: 'error',
          text: result.message || 'I had trouble analyzing your document. Please try again or upload a clearer image.'
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      removeMessage(loadingId);
      addMessage('assistant', {
        type: 'error',
        text: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (role, content) => {
    const id = Date.now() + Math.random();
    const message = {
      id,
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    return id;
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentAnalysis(null);
    setAwaitingQuestion(false);
    // Keep the welcome message, clear the rest
    setMessages([]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="clarity-chat">
      {/* Header */}
      <header className="clarity-header">
        <h1>Document Helper</h1>
      </header>

      {/* Messages Area */}
      <div className="clarity-messages">
        {messages.length === 0 ? (
          <ChatWelcome onUploadClick={triggerFileInput} />
        ) : (
          messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message}
              presets={presets}
              onPresetSelect={handleQuestionSelect}
              onCustomSubmit={handleCustomQuestion}
              onNewAnalysis={handleNewAnalysis}
            />
          ))
        )}
        
        {/* Preset questions shown after document upload */}
        {awaitingQuestion && !isLoading && (
          <QuickActions 
            presets={presets}
            onSelect={handleQuestionSelect}
            onCustomSubmit={handleCustomQuestion}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="clarity-input-area">
        {!selectedFile ? (
          <DocumentUpload 
            onFileSelect={handleFileSelect}
            fileInputRef={fileInputRef}
          />
        ) : awaitingQuestion ? (
          <div className="input-hint">
            Select a question above or type your own
          </div>
        ) : (
          <button 
            className="new-analysis-btn"
            onClick={handleNewAnalysis}
          >
            Analyze Another Document
          </button>
        )}
      </div>
    </div>
  );
}

export default ClarityChat;
