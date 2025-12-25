/**
 * Clarity API Routes
 * Findr Health - Healthcare Cost Transparency Platform
 * 
 * Endpoints:
 * - POST /api/clarity/chat - Chat with Cost Navigator
 * - POST /api/clarity/analyze - Analyze uploaded document
 * - GET /api/clarity/health - Health check
 */

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');

// Import system prompts
const { buildCostNavigatorPrompt, buildDocumentAnalysisPrompt } = require('../prompts');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.'));
    }
  }
});

// Maximum conversation history to send (last N messages)
const MAX_HISTORY_MESSAGES = 10;

/**
 * Format conversation history for Anthropic API
 * @param {Array} history - Array of {role, content} messages
 * @returns {Array} Formatted messages for API
 */
function formatConversationHistory(history) {
  if (!history || !Array.isArray(history)) {
    return [];
  }
  
  // Take only the last MAX_HISTORY_MESSAGES
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  
  // Format for Anthropic API (ensure alternating user/assistant)
  return recentHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

/**
 * POST /api/clarity/chat
 * Chat with Cost Navigator AI
 * 
 * Body:
 * - message: string (required) - User's message
 * - history: array (optional) - Previous messages [{role, content}]
 * - location: object (optional) - {city, state, zip, country}
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, location } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required',
        success: false 
      });
    }
    
    // Build system prompt with location context
    const systemPrompt = buildCostNavigatorPrompt(location);
    
    // Format conversation history
    const formattedHistory = formatConversationHistory(history);
    
    // Build messages array
    const messages = [
      ...formattedHistory,
      { role: 'user', content: message }
    ];
    
    // Ensure proper message format (must start with user, alternate)
    const cleanedMessages = ensureValidMessageFormat(messages);
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: cleanedMessages
    });
    
    // Extract response text
    const assistantMessage = response.content[0]?.text || 
      "I'm sorry, I couldn't process that request. Please try again.";
    
    // Check for special triggers in the response
    const triggers = detectTriggers(message, assistantMessage);
    
    res.json({
      success: true,
      message: assistantMessage,
      triggers, // Frontend can use these to show special UI
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Handle specific Anthropic errors
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        message: getFallbackResponse('rate_limit')
      });
    }
    
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'API configuration error',
        message: getFallbackResponse('error')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred processing your request',
      message: getFallbackResponse('error')
    });
  }
});

/**
 * POST /api/clarity/analyze
 * Analyze uploaded healthcare document
 * 
 * Form Data:
 * - file: file (required) - The document to analyze
 * - documentType: string (optional) - Type hint (bill, eob, lab, etc.)
 * - question: string (optional) - Specific question about the document
 * - location: string (optional) - JSON string of location object
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { documentType, question } = req.body;
    let location = null;
    
    // Parse location if provided
    if (req.body.location) {
      try {
        location = JSON.parse(req.body.location);
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Build system prompt
    const systemPrompt = buildDocumentAnalysisPrompt(documentType);
    
    // Prepare the image for Anthropic
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;
    
    // Build user message with image
    const userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Image
        }
      },
      {
        type: 'text',
        text: question 
          ? `Please analyze this healthcare document. Specific question: ${question}`
          : 'Please analyze this healthcare document and explain what it shows. Identify any concerns or action items.'
      }
    ];
    
    // Add location context if available
    if (location && (location.city || location.state)) {
      userContent[1].text += ` The user is located in ${[location.city, location.state].filter(Boolean).join(', ')}.`;
    }
    
    // Call Anthropic API with vision
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096, // Longer for document analysis
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent }
      ]
    });
    
    const analysisResult = response.content[0]?.text || 
      "I'm sorry, I couldn't analyze this document. Please try uploading a clearer image.";
    
    // Detect triggers in the analysis
    const triggers = detectDocumentTriggers(analysisResult);
    
    res.json({
      success: true,
      analysis: analysisResult,
      documentType: detectDocumentType(analysisResult),
      triggers,
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    });
    
  } catch (error) {
    console.error('Document analysis error:', error);
    
    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze document',
      analysis: "I'm sorry, I couldn't analyze this document. Please try uploading a clearer image or PDF."
    });
  }
});

/**
 * GET /api/clarity/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'clarity',
    timestamp: new Date().toISOString(),
    features: {
      chat: true,
      documentAnalysis: true,
      conversationHistory: true,
      locationAware: true
    }
  });
});

// ============ Helper Functions ============

/**
 * Ensure messages alternate properly between user and assistant
 */
function ensureValidMessageFormat(messages) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  const cleaned = [];
  let lastRole = null;
  
  for (const msg of messages) {
    // Skip empty messages
    if (!msg.content) continue;
    
    // If same role as last, combine (shouldn't happen often)
    if (msg.role === lastRole && cleaned.length > 0) {
      cleaned[cleaned.length - 1].content += '\n\n' + msg.content;
    } else {
      cleaned.push({ role: msg.role, content: msg.content });
      lastRole = msg.role;
    }
  }
  
  // Ensure first message is from user
  if (cleaned.length > 0 && cleaned[0].role !== 'user') {
    cleaned.shift();
  }
  
  return cleaned;
}

/**
 * Detect special triggers in conversation
 */
function detectTriggers(userMessage, assistantResponse) {
  const triggers = {
    providerOutreach: false,
    internationalValidation: false,
    consultationSuggested: false,
    calculatorFlow: false,
    locationNeeded: false
  };
  
  const lowerUser = userMessage.toLowerCase();
  const lowerResponse = assistantResponse.toLowerCase();
  
  // Provider outreach trigger
  if (lowerResponse.includes('would you like us to reach out') ||
      lowerResponse.includes('reach out to') && lowerResponse.includes('cash prices')) {
    triggers.providerOutreach = true;
  }
  
  // International validation trigger
  if (lowerResponse.includes('validate this facility') ||
      lowerResponse.includes('research') && lowerResponse.includes('email you')) {
    triggers.internationalValidation = true;
  }
  
  // Consultation suggested
  if (lowerResponse.includes('free consultation') ||
      lowerResponse.includes('request a consultation')) {
    triggers.consultationSuggested = true;
  }
  
  // Insurance calculator flow
  if (lowerUser.includes('should i get insurance') ||
      lowerUser.includes('do i need insurance') ||
      lowerUser.includes('insurance vs cash') ||
      lowerUser.includes('worth having insurance')) {
    triggers.calculatorFlow = true;
  }
  
  // Location needed
  if (lowerResponse.includes('what city') ||
      lowerResponse.includes('zip code') ||
      lowerResponse.includes('where are you located')) {
    triggers.locationNeeded = true;
  }
  
  return triggers;
}

/**
 * Detect triggers in document analysis
 */
function detectDocumentTriggers(analysis) {
  const triggers = {
    highBillAmount: false,
    upcodingFlagged: false,
    consultationSuggested: false,
    multipleFlags: false
  };
  
  const lower = analysis.toLowerCase();
  
  // High bill amount
  if (lower.includes('$10,000') || lower.includes('$15,000') || 
      lower.includes('$20,000') || lower.includes('significant amount')) {
    triggers.highBillAmount = true;
  }
  
  // Upcoding flagged
  const upcodingDiagnoses = ['sepsis', 'acute kidney injury', 'aki', 'respiratory failure', 
                             'encephalopathy', 'chf', 'copd exacerbation'];
  if (upcodingDiagnoses.some(d => lower.includes(d)) && 
      lower.includes('flag') || lower.includes('confirm')) {
    triggers.upcodingFlagged = true;
  }
  
  // Consultation suggested
  if (lower.includes('free consultation') || lower.includes('request a consultation')) {
    triggers.consultationSuggested = true;
  }
  
  // Multiple flags
  const flagCount = (lower.match(/\*\*flag/g) || []).length;
  if (flagCount >= 2) {
    triggers.multipleFlags = true;
  }
  
  return triggers;
}

/**
 * Detect document type from analysis content
 */
function detectDocumentType(analysis) {
  const lower = analysis.toLowerCase();
  
  if (lower.includes('this is not a bill') || lower.includes('explanation of benefits') || lower.includes('eob')) {
    return 'eob';
  }
  if (lower.includes('lab result') || lower.includes('blood test') || lower.includes('test result')) {
    return 'lab';
  }
  if (lower.includes('collection') || lower.includes('debt') || lower.includes('past due')) {
    return 'collection';
  }
  if (lower.includes('estimate') || lower.includes('quote')) {
    return 'estimate';
  }
  if (lower.includes('imaging') || lower.includes('radiology') || lower.includes('mri') || lower.includes('ct scan')) {
    return 'imaging';
  }
  if (lower.includes('bill') || lower.includes('charges') || lower.includes('amount due')) {
    return 'bill';
  }
  
  return 'unknown';
}

/**
 * Get fallback response for errors
 */
function getFallbackResponse(type) {
  const responses = {
    rate_limit: "I'm experiencing high demand right now. Here are some general tips while you wait:\n\n1. Always request an itemized bill\n2. Compare prices using Healthcare Bluebook\n3. Ask for the cash/self-pay price\n4. Don't be afraid to negotiate\n\nPlease try again in a moment.",
    
    error: "I'm having trouble connecting right now. In the meantime:\n\n1. You have the right to an itemized bill\n2. Most hospital bills can be negotiated\n3. Cash prices are often 40-60% less than insurance rates\n\nPlease try again, or request a consultation for complex issues."
  };
  
  return responses[type] || responses.error;
}

module.exports = router;
