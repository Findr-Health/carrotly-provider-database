const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    enum: [
      // Search events
      'search.query',
      'search.filter',
      'search.result_click',
      'search.no_results',
      
      // Provider events
      'provider.view',
      'provider.favorite',
      'provider.unfavorite',
      'provider.share',
      'provider.call',
      'provider.directions',
      
      // Service events
      'service.view',
      'service.select',
      
      // Booking events
      'booking.start',
      'booking.service_select',
      'booking.professional_select',
      'booking.date_select',
      'booking.time_select',
      'booking.summary_view',
      'booking.payment_start',
      'booking.payment_complete',
      'booking.payment_fail',
      'booking.confirm',
      'booking.cancel',
      'booking.reschedule',
      
      // AI/Clarity events
      'ai.conversation_start',
      'ai.message_sent',
      'ai.message_received',
      'ai.feedback_positive',
      'ai.feedback_negative',
      'ai.document_upload',
      'ai.document_analyzed',
      'ai.calculator_trigger',
      'ai.calculator_complete',
      'ai.provider_recommendation',
      
      // User events
      'user.signup',
      'user.login',
      'user.logout',
      'user.profile_update',
      'user.photo_upload',
      
      // App lifecycle events
      'app.open',
      'app.background',
      'app.foreground',
      'app.crash',
      
      // Navigation events
      'screen.view',
      'tab.switch',
      
      // Notification events
      'notification.received',
      'notification.opened',
      'notification.dismissed',
      
      // Review events
      'review.start',
      'review.submit',
      'review.view'
    ],
    required: true,
    index: true
  },
  
  // User context
  userId: {
    type: String,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  
  // Event data - flexible schema for different event types
  data: {
    // Search specific
    searchQuery: String,
    searchFilters: {
      category: String,
      location: String,
      priceRange: String,
      rating: Number,
      distance: Number
    },
    searchResultCount: Number,
    searchPosition: Number, // Position of clicked result
    
    // Provider specific
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    providerName: String,
    providerCategory: String,
    
    // Service specific
    serviceId: mongoose.Schema.Types.ObjectId,
    serviceName: String,
    servicePrice: Number,
    serviceDuration: Number,
    
    // Booking specific
    bookingId: mongoose.Schema.Types.ObjectId,
    bookingAmount: Number,
    bookingStatus: String,
    paymentMethod: String,
    
    // AI specific
    conversationId: String,
    messageCount: Number,
    aiTopic: String,
    feedbackType: String,
    documentType: String,
    
    // Screen/Navigation specific
    screenName: String,
    previousScreen: String,
    tabName: String,
    
    // Error specific
    errorCode: String,
    errorMessage: String,
    
    // Generic metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Device & Platform context
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true,
    index: true
  },
  appVersion: String,
  osVersion: String,
  deviceModel: String,
  deviceId: String, // Anonymous device identifier
  
  // Location context (for regional analytics)
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'US' },
    latitude: Number,
    longitude: Number
  },
  
  // Time context
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  localTime: String, // User's local time
  timezone: String
});

// Compound indexes for efficient analytics queries
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ 'data.providerId': 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ 'data.searchQuery': 1, timestamp: -1 });
analyticsEventSchema.index({ platform: 1, timestamp: -1 });
analyticsEventSchema.index({ 'location.state': 1, timestamp: -1 });

// TTL index - auto-delete events older than 1 year (365 days)
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Static method to batch insert events
analyticsEventSchema.statics.batchInsert = async function(events) {
  try {
    const result = await this.insertMany(events, { ordered: false });
    return { success: true, inserted: result.length };
  } catch (error) {
    // insertMany with ordered: false continues on error
    console.error('Batch insert partial error:', error.message);
    return { 
      success: false, 
      inserted: error.insertedDocs?.length || 0,
      error: error.message 
    };
  }
};

// Static method to get event counts by type for a date range
analyticsEventSchema.statics.getEventCounts = async function(startDate, endDate, eventTypes = null) {
  const match = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (eventTypes && eventTypes.length > 0) {
    match.eventType = { $in: eventTypes };
  }
  
  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  return result.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

// Static method to get top search queries
analyticsEventSchema.statics.getTopSearches = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        eventType: 'search.query',
        'data.searchQuery': { $exists: true, $ne: '' },
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: { $toLower: '$data.searchQuery' },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        query: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get daily event counts
analyticsEventSchema.statics.getDailyStats = async function(startDate, endDate, eventType) {
  const match = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (eventType) {
    match.eventType = eventType;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' }
      }
    },
    { $sort: { date: 1 } }
  ]);
};

// Static method to get conversion funnel
analyticsEventSchema.statics.getBookingFunnel = async function(startDate, endDate) {
  const stages = [
    'provider.view',
    'service.select',
    'booking.start',
    'booking.payment_start',
    'booking.payment_complete'
  ];
  
  const match = {
    eventType: { $in: stages },
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        stage: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    }
  ]);
  
  // Return in funnel order
  return stages.map(stage => {
    const data = result.find(r => r.stage === stage);
    return {
      stage,
      count: data?.count || 0,
      uniqueUsers: data?.uniqueUsers || 0
    };
  });
};

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
