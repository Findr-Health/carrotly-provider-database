const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');

/**
 * Event Tracking API
 * 
 * These endpoints are called by the mobile app to track user events.
 * They use a simple API key authentication (not JWT) for simplicity.
 * 
 * In production, you might want to:
 * - Add rate limiting per session/device
 * - Validate event types more strictly
 * - Use a message queue for high-volume events
 */

// Simple API key verification for event tracking
const EVENTS_API_KEY = process.env.EVENTS_API_KEY || 'events-api-key-change-in-production';

const verifyEventsApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== EVENTS_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

/**
 * POST /api/events/track
 * Track a single event
 */
router.post('/track', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      eventType,
      userId,
      sessionId,
      data,
      platform,
      appVersion,
      osVersion,
      deviceModel,
      deviceId,
      location,
      localTime,
      timezone
    } = req.body;
    
    // Validation
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const event = new AnalyticsEvent({
      eventType,
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: data || {},
      platform: platform || 'ios',
      appVersion,
      osVersion,
      deviceModel,
      deviceId,
      location: location || {},
      localTime,
      timezone,
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({ 
      success: true,
      eventId: event._id 
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * POST /api/events/batch
 * Track multiple events at once (for offline sync)
 */
router.post('/batch', verifyEventsApiKey, async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' });
    }
    
    if (events.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 events per batch' });
    }
    
    // Validate and prepare events
    const preparedEvents = events.map(event => ({
      eventType: event.eventType,
      userId: event.userId || null,
      sessionId: event.sessionId,
      isAnonymous: !event.userId,
      data: event.data || {},
      platform: event.platform || 'ios',
      appVersion: event.appVersion,
      osVersion: event.osVersion,
      deviceModel: event.deviceModel,
      deviceId: event.deviceId,
      location: event.location || {},
      localTime: event.localTime,
      timezone: event.timezone,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
    }));
    
    const result = await AnalyticsEvent.batchInsert(preparedEvents);
    
    res.status(201).json({
      success: result.success,
      inserted: result.inserted,
      total: events.length,
      error: result.error
    });
  } catch (error) {
    console.error('Batch track error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
});

/**
 * POST /api/events/session/start
 * Start a new session (convenience endpoint)
 */
router.post('/session/start', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      platform,
      appVersion,
      osVersion,
      deviceModel,
      deviceId,
      location
    } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const event = new AnalyticsEvent({
      eventType: 'app.open',
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        isNewSession: true
      },
      platform: platform || 'ios',
      appVersion,
      osVersion,
      deviceModel,
      deviceId,
      location: location || {},
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      sessionId,
      eventId: event._id
    });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /api/events/search
 * Track a search event (convenience endpoint)
 */
router.post('/search', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      query,
      filters,
      resultCount,
      platform
    } = req.body;
    
    if (!sessionId || !query) {
      return res.status(400).json({ error: 'sessionId and query are required' });
    }
    
    const event = new AnalyticsEvent({
      eventType: 'search.query',
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        searchQuery: query,
        searchFilters: filters || {},
        searchResultCount: resultCount || 0
      },
      platform: platform || 'ios',
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      eventId: event._id
    });
  } catch (error) {
    console.error('Search track error:', error);
    res.status(500).json({ error: 'Failed to track search' });
  }
});

/**
 * POST /api/events/provider/view
 * Track provider view (convenience endpoint)
 */
router.post('/provider/view', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      providerId,
      providerName,
      providerCategory,
      source, // 'search', 'recommendation', 'favorite', 'ai'
      platform
    } = req.body;
    
    if (!sessionId || !providerId) {
      return res.status(400).json({ error: 'sessionId and providerId are required' });
    }
    
    const event = new AnalyticsEvent({
      eventType: 'provider.view',
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        providerId,
        providerName,
        providerCategory,
        metadata: { source }
      },
      platform: platform || 'ios',
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      eventId: event._id
    });
  } catch (error) {
    console.error('Provider view track error:', error);
    res.status(500).json({ error: 'Failed to track provider view' });
  }
});

/**
 * POST /api/events/booking
 * Track booking funnel events (convenience endpoint)
 */
router.post('/booking', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      step, // 'start', 'service_select', 'professional_select', 'date_select', 'time_select', 'summary_view', 'payment_start', 'payment_complete', 'payment_fail', 'cancel'
      providerId,
      providerName,
      serviceId,
      serviceName,
      servicePrice,
      bookingId,
      bookingAmount,
      paymentMethod,
      platform
    } = req.body;
    
    if (!sessionId || !step) {
      return res.status(400).json({ error: 'sessionId and step are required' });
    }
    
    const eventTypeMap = {
      'start': 'booking.start',
      'service_select': 'booking.service_select',
      'professional_select': 'booking.professional_select',
      'date_select': 'booking.date_select',
      'time_select': 'booking.time_select',
      'summary_view': 'booking.summary_view',
      'payment_start': 'booking.payment_start',
      'payment_complete': 'booking.payment_complete',
      'payment_fail': 'booking.payment_fail',
      'cancel': 'booking.cancel'
    };
    
    const eventType = eventTypeMap[step];
    if (!eventType) {
      return res.status(400).json({ error: 'Invalid booking step' });
    }
    
    const event = new AnalyticsEvent({
      eventType,
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        providerId,
        providerName,
        serviceId,
        serviceName,
        servicePrice,
        bookingId,
        bookingAmount,
        paymentMethod
      },
      platform: platform || 'ios',
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      eventId: event._id
    });
  } catch (error) {
    console.error('Booking track error:', error);
    res.status(500).json({ error: 'Failed to track booking event' });
  }
});

/**
 * POST /api/events/ai
 * Track AI/Clarity events (convenience endpoint)
 */
router.post('/ai', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      action, // 'conversation_start', 'message_sent', 'message_received', 'feedback_positive', 'feedback_negative', 'document_upload', 'document_analyzed', 'calculator_trigger', 'calculator_complete'
      conversationId,
      messageCount,
      topic,
      documentType,
      platform
    } = req.body;
    
    if (!sessionId || !action) {
      return res.status(400).json({ error: 'sessionId and action are required' });
    }
    
    const eventTypeMap = {
      'conversation_start': 'ai.conversation_start',
      'message_sent': 'ai.message_sent',
      'message_received': 'ai.message_received',
      'feedback_positive': 'ai.feedback_positive',
      'feedback_negative': 'ai.feedback_negative',
      'document_upload': 'ai.document_upload',
      'document_analyzed': 'ai.document_analyzed',
      'calculator_trigger': 'ai.calculator_trigger',
      'calculator_complete': 'ai.calculator_complete',
      'provider_recommendation': 'ai.provider_recommendation'
    };
    
    const eventType = eventTypeMap[action];
    if (!eventType) {
      return res.status(400).json({ error: 'Invalid AI action' });
    }
    
    const event = new AnalyticsEvent({
      eventType,
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        conversationId,
        messageCount,
        aiTopic: topic,
        documentType
      },
      platform: platform || 'ios',
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      eventId: event._id
    });
  } catch (error) {
    console.error('AI track error:', error);
    res.status(500).json({ error: 'Failed to track AI event' });
  }
});

/**
 * POST /api/events/screen
 * Track screen views (convenience endpoint)
 */
router.post('/screen', verifyEventsApiKey, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      screenName,
      previousScreen,
      platform
    } = req.body;
    
    if (!sessionId || !screenName) {
      return res.status(400).json({ error: 'sessionId and screenName are required' });
    }
    
    const event = new AnalyticsEvent({
      eventType: 'screen.view',
      userId: userId || null,
      sessionId,
      isAnonymous: !userId,
      data: {
        screenName,
        previousScreen
      },
      platform: platform || 'ios',
      timestamp: new Date()
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      eventId: event._id
    });
  } catch (error) {
    console.error('Screen track error:', error);
    res.status(500).json({ error: 'Failed to track screen view' });
  }
});

/**
 * GET /api/events/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
