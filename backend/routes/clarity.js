const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const Provider = require('../models/Provider');
const Inquiry = require('../models/Inquiry');
const claritySystemPrompt = require('../prompts/claritySystemPrompt');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Tool definitions for Claude
const tools = [
  {
    name: "searchProviders",
    description: "Search for healthcare providers near the user's location. Use this when a user wants to find a doctor, dentist, therapist, or any other healthcare provider.",
    input_schema: {
      type: "object",
      properties: {
        providerType: {
          type: "string",
          description: "The type of provider to search for (e.g., 'Dental', 'Medical', 'Mental Health', 'Skincare/Aesthetics')"
        },
        latitude: {
          type: "number",
          description: "User's latitude coordinate"
        },
        longitude: {
          type: "number",
          description: "User's longitude coordinate"
        },
        radius: {
          type: "number",
          description: "Search radius in miles (default 25)"
        }
      },
      required: ["providerType", "latitude", "longitude"]
    }
  },
  {
    name: "logProviderRequest",
    description: "Log a request when no providers are found in the user's area. This helps our team know where to expand. Always use this when searchProviders returns no results.",
    input_schema: {
      type: "object",
      properties: {
        providerType: {
          type: "string",
          description: "The type of provider the user was looking for"
        },
        latitude: {
          type: "number",
          description: "User's latitude"
        },
        longitude: {
          type: "number",
          description: "User's longitude"
        },
        city: {
          type: "string",
          description: "User's city if known"
        },
        state: {
          type: "string",
          description: "User's state if known"
        },
        userMessage: {
          type: "string",
          description: "The user's original request"
        }
      },
      required: ["providerType", "userMessage"]
    }
  }
];

// Type mapping for provider search
const typeMapping = {
  'dentist': 'Dental',
  'dental': 'Dental',
  'doctor': 'Medical',
  'medical': 'Medical',
  'physician': 'Medical',
  'urgent care': 'Urgent Care',
  'urgentcare': 'Urgent Care',
  'mental health': 'Mental Health',
  'therapy': 'Mental Health',
  'therapist': 'Mental Health',
  'counselor': 'Mental Health',
  'psychiatrist': 'Mental Health',
  'psychologist': 'Mental Health',
  'skincare': 'Skincare/Aesthetics',
  'aesthetics': 'Skincare/Aesthetics',
  'dermatology': 'Skincare/Aesthetics',
  'dermatologist': 'Skincare/Aesthetics',
  'cosmetic': 'Skincare/Aesthetics',
  'medspa': 'Skincare/Aesthetics',
  'med spa': 'Skincare/Aesthetics',
  'massage': 'Massage/Bodywork',
  'bodywork': 'Massage/Bodywork',
  'chiropractor': 'Massage/Bodywork',
  'chiropractic': 'Massage/Bodywork',
  'fitness': 'Fitness/Training',
  'training': 'Fitness/Training',
  'personal trainer': 'Fitness/Training',
  'trainer': 'Fitness/Training',
  'gym': 'Fitness/Training',
  'yoga': 'Yoga/Pilates',
  'pilates': 'Yoga/Pilates',
  'nutrition': 'Nutrition/Wellness',
  'wellness': 'Nutrition/Wellness',
  'nutritionist': 'Nutrition/Wellness',
  'dietitian': 'Nutrition/Wellness',
  'pharmacy': 'Pharmacy/RX',
  'rx': 'Pharmacy/RX'
};

// Execute tool calls
async function executeToolCall(toolName, toolInput) {
  console.log(`Executing tool: ${toolName}`, toolInput);
  
  if (toolName === 'searchProviders') {
    return await searchProviders(toolInput);
  } else if (toolName === 'logProviderRequest') {
    return await logProviderRequest(toolInput);
  }
  
  return { error: 'Unknown tool' };
}

// Search providers function
async function searchProviders({ providerType, latitude, longitude, radius = 25 }) {
  try {
    if (!latitude || !longitude) {
      return {
        success: false,
        count: 0,
        providers: [],
        message: 'Location not available'
      };
    }
    
    const radiusInMeters = radius * 1609.34;
    
    // Normalize provider type
    const normalizedType = providerType.toLowerCase().trim();
    const mappedType = typeMapping[normalizedType] || providerType;
    
    const query = {
      status: 'approved',
      'location.coordinates': { $exists: true },
      providerTypes: { $regex: new RegExp(mappedType, 'i') }
    };
    
    console.log('[searchProviders] Query:', JSON.stringify(query));
    console.log('[searchProviders] Input:', { providerType, latitude, longitude, radius, mappedType });
    
    const providers = await Provider.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: query
        }
      },
      {
        $project: {
          _id: 1,
          practiceName: 1,
          providerTypes: 1,
          distance: { $divide: ['$distance', 1609.34] },
          rating: 1,
          reviewCount: 1,
          isVerified: 1,
          isFeatured: 1,
          'address.city': 1,
          'address.state': 1
        }
      },
      {
        $sort: { isFeatured: -1, distance: 1 }
      },
      {
        $limit: 5
      }
    ]);
    
    const formattedProviders = providers.map(p => ({
      id: p._id.toString(),
      name: p.practiceName,
      type: p.providerTypes?.join(', ') || 'Healthcare',
      distance: Math.round(p.distance * 10) / 10,
      city: p.address?.city,
      state: p.address?.state,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      isVerified: p.isVerified || false,
      isFeatured: p.isFeatured || false
    }));
    
    console.log(`Found ${formattedProviders.length} providers for ${mappedType}`);
    
    return {
      success: true,
      count: formattedProviders.length,
      providers: formattedProviders,
      searchedType: mappedType
    };
    
  } catch (error) {
    console.error('Provider search error:', error);
    return {
      success: false,
      count: 0,
      providers: [],
      error: error.message
    };
  }
}

// Log provider request function
async function logProviderRequest({ providerType, latitude, longitude, city, state, userMessage }) {
  try {
    const inquiry = new Inquiry({
      type: 'provider_outreach',
      source: 'ai_chat',
      status: 'new',
      requestedProviderType: providerType,
      userMessage: userMessage,
      location: {
        type: 'Point',
        coordinates: longitude && latitude ? [parseFloat(longitude), parseFloat(latitude)] : undefined,
        city: city,
        state: state
      },
      notes: `AI Chat: User searched for "${providerType}" but no providers found. Location: ${city || 'Unknown'}, ${state || 'Unknown'}`,
      priority: 'medium'
    });
    
    await inquiry.save();
    console.log('Provider request logged:', inquiry._id);
    
    return {
      success: true,
      message: 'Request logged for outreach team',
      inquiryId: inquiry._id.toString()
    };
  } catch (error) {
    console.error('Log request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main chat endpoint
 * POST /api/clarity/chat
 */
router.post('/chat', async (req, res) => {
  console.log('[Clarity /chat] === REQUEST RECEIVED ===');
  console.log('[Clarity /chat] Message:', req.body.message?.substring(0, 100));
  console.log('[Clarity /chat] Has location:', !!req.body.location);
  
  try {
    const { 
      message, 
      conversationHistory = [], 
      location,  // { latitude, longitude, city, state }
      userId,
      conversationId
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build messages array
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // Add location context to system prompt if available
    let systemPrompt = claritySystemPrompt;
    console.log('[Clarity] Received location:', location);
    if (location?.latitude && location?.longitude) {
      systemPrompt += `\n\n## CURRENT USER LOCATION\nLatitude: ${location.latitude}\nLongitude: ${location.longitude}`;
      if (location.city) systemPrompt += `\nCity: ${location.city}`;
      if (location.state) systemPrompt += `\nState: ${location.state}`;
      systemPrompt += `\n\nUse this location when searching for providers.`;
    }
    
    // Force tool use if user mentions provider-related keywords
    const providerKeywords = ['dentist', 'dental', 'doctor', 'physician', 'therapist', 'massage', 'urgent care', 'medical', 'need a', 'find me', 'looking for', 'where can'];
    const messageText = message.toLowerCase();
    const shouldForceToolUse = providerKeywords.some(keyword => messageText.includes(keyword));
    
    // PRE-SEARCH: If user mentions provider keywords, search BEFORE calling Claude
    let providerSearchResults = null;
    if (shouldForceToolUse && location?.latitude && location?.longitude) {
      console.log('[Clarity] PRE-SEARCHING for providers...');
      try {
        // Determine provider type from message
        const messageText = message.toLowerCase();
        let providerType = 'Medical'; // default
        if (messageText.includes('dentist') || messageText.includes('dental')) providerType = 'Dental';
        else if (messageText.includes('therapist') || messageText.includes('therapy') || messageText.includes('mental')) providerType = 'Mental Health';
        else if (messageText.includes('massage')) providerType = 'Massage';
        else if (messageText.includes('urgent')) providerType = 'Urgent Care';
        
        providerSearchResults = await executeToolCall('searchProviders', {
          providerType,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 5000  // 5000 miles = nationwide search for testing
        });
        
        console.log('[Clarity] Pre-search found:', providerSearchResults?.providers?.length || 0, 'providers');
        
        // Add results to system prompt
        if (providerSearchResults?.providers?.length > 0) {
          systemPrompt += `\n\n## PROVIDER SEARCH RESULTS\nI found ${providerSearchResults.providers.length} providers near the user:\n`;
          providerSearchResults.providers.forEach((p, i) => {
            systemPrompt += `\n${i+1}. ${p.name} - ${p.address?.city || 'Unknown city'}\n`;
            systemPrompt += `   ID: ${p._id}\n`;
            systemPrompt += `   Services: ${p.services?.length || 0}\n`;
          });
          systemPrompt += `\nYou MUST reference these specific providers in your response using [PROVIDER:id] format.\n`;
        }
      } catch (error) {
        console.error('[Clarity] Pre-search error:', error);
      }
    }
    
    // Initial API call with tools (with timeout)
    console.log('[Clarity] Calling Anthropic API...');
    const apiTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Anthropic API timeout')), 25000)
    );
    
    // Force tool use with tool_choice if provider keywords detected
    const apiOptions = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools,
      messages: messages
    };
    
    // FORCE searchProviders tool as first action for provider queries
    if (shouldForceToolUse && location?.latitude) {
      console.log('[Clarity] FORCING searchProviders with tool_choice');
      apiOptions.tool_choice = { type: 'tool', name: 'searchProviders' };
    }
    
    console.log('[Clarity] API options:', { 
      hasToolChoice: !!apiOptions.tool_choice, 
      toolChoice: apiOptions.tool_choice 
    });
    
    let response = await Promise.race([
      anthropic.messages.create(apiOptions),
      apiTimeout
    ]);
    
    console.log('Initial response stop_reason:', response.stop_reason);
    
    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');
      
      if (!toolUseBlock) break;
      
      console.log('Tool called:', toolUseBlock.name);
      
      // Add location to tool input if not provided
      const toolInput = { ...toolUseBlock.input };
      if (location?.latitude && !toolInput.latitude) {
        toolInput.latitude = location.latitude;
        toolInput.longitude = location.longitude;
      }
      if (location?.city && !toolInput.city) {
        toolInput.city = location.city;
        toolInput.state = location.state;
      }
      
      // Execute the tool
      const toolResult = await executeToolCall(toolUseBlock.name, toolInput);
      
      // Add assistant response and tool result to messages
      messages.push({
        role: 'assistant',
        content: response.content
      });
      
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(toolResult)
        }]
      });
      
      // Continue the conversation
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: tools,
        messages: messages
      });
      
      console.log('Follow-up response stop_reason:', response.stop_reason);
    }
    
    // Extract final text response
    const textContent = response.content.find(block => block.type === 'text');
    const assistantMessage = textContent?.text || 'I apologize, but I was unable to generate a response.';
    
    // Parse out provider references for the app
    const providerMatches = assistantMessage.match(/\[PROVIDER:([^\]]+)\]/g);
    const providerIds = providerMatches 
      ? providerMatches.map(m => m.match(/\[PROVIDER:([^\]]+)\]/)[1])
      : [];
    
    // Clean message for display (remove provider tags - app will render them)
    // Actually, keep them so the app can parse and render buttons
    
    res.json({
      success: true,
      message: assistantMessage,
      providerIds: providerIds,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens
      },
      debug: {
        receivedLocation: !!location?.latitude,
        forcedTool: shouldForceToolUse,
        stopReason: response.stop_reason,
        preSearchRan: providerSearchResults !== null,
        preSearchFound: providerSearchResults?.providers?.length || 0,
        locationCoords: location?.latitude ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'none'
      }
    });
    
  } catch (error) {
    console.error('Clarity chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * Health check
 * GET /api/clarity/health
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'clarity',
    features: ['chat', 'provider-search', 'tool-calling']
  });
});

module.exports = router;
