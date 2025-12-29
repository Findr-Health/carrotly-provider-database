const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
  // Date (stored as start of day UTC)
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  
  // User metrics
  users: {
    newSignups: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    returningUsers: { type: Number, default: 0 }
  },
  
  // Provider metrics
  providers: {
    newProviders: { type: Number, default: 0 },
    approved: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    totalApproved: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 }
  },
  
  // Booking metrics
  bookings: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    rescheduled: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    averageValue: { type: Number, default: 0 }
  },
  
  // Revenue metrics (sensitive - super_admin only)
  revenue: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 }
  },
  
  // Search metrics
  searches: {
    totalSearches: { type: Number, default: 0 },
    uniqueSearchers: { type: Number, default: 0 },
    searchesWithResults: { type: Number, default: 0 },
    searchesNoResults: { type: Number, default: 0 },
    avgResultsPerSearch: { type: Number, default: 0 },
    topQueries: [{
      query: String,
      count: Number
    }]
  },
  
  // AI/Clarity metrics
  ai: {
    conversations: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    avgMessagesPerConversation: { type: Number, default: 0 },
    documentsAnalyzed: { type: Number, default: 0 },
    calculatorUses: { type: Number, default: 0 },
    positiveFeedback: { type: Number, default: 0 },
    negativeFeedback: { type: Number, default: 0 },
    feedbackScore: { type: Number, default: 0 }, // Percentage positive
    topTopics: [{
      topic: String,
      count: Number
    }]
  },
  
  // Provider breakdown by type
  providersByType: [{
    type: { type: String },
    count: { type: Number }
  }],
  
  // Bookings by category
  bookingsByCategory: [{
    category: String,
    count: Number,
    revenue: Number
  }],
  
  // Platform breakdown
  platforms: {
    ios: {
      sessions: { type: Number, default: 0 },
      users: { type: Number, default: 0 }
    },
    android: {
      sessions: { type: Number, default: 0 },
      users: { type: Number, default: 0 }
    },
    web: {
      sessions: { type: Number, default: 0 },
      users: { type: Number, default: 0 }
    }
  },
  
  // Geographic breakdown (top states)
  topLocations: [{
    state: String,
    users: Number,
    bookings: Number
  }],
  
  // App engagement
  engagement: {
    appOpens: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 }, // in seconds
    screenViews: { type: Number, default: 0 },
    favoriteAdds: { type: Number, default: 0 }
  },
  
  // Metadata
  computedAt: {
    type: Date,
    default: Date.now
  },
  dataComplete: {
    type: Boolean,
    default: false
  },
  notes: String
});

// Index for date range queries
dailyStatsSchema.index({ date: -1 });

// Static method to get or create stats for a date
dailyStatsSchema.statics.getOrCreate = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  let stats = await this.findOne({ date: startOfDay });
  
  if (!stats) {
    stats = new this({ date: startOfDay });
    await stats.save();
  }
  
  return stats;
};

// Static method to get stats for a date range
dailyStatsSchema.statics.getRange = async function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

// Static method to aggregate stats for a period
dailyStatsSchema.statics.aggregatePeriod = async function(startDate, endDate) {
  const stats = await this.getRange(startDate, endDate);
  
  if (stats.length === 0) {
    return null;
  }
  
  // Sum up the daily stats
  const totals = {
    users: {
      newSignups: 0,
      activeUsers: new Set(),
      returningUsers: 0
    },
    providers: {
      newProviders: 0,
      approved: 0,
      rejected: 0
    },
    bookings: {
      created: 0,
      completed: 0,
      cancelled: 0,
      totalValue: 0
    },
    revenue: {
      gross: 0,
      net: 0,
      refunds: 0
    },
    searches: {
      totalSearches: 0,
      uniqueSearchers: 0
    },
    ai: {
      conversations: 0,
      messages: 0,
      positiveFeedback: 0,
      negativeFeedback: 0
    }
  };
  
  stats.forEach(day => {
    totals.users.newSignups += day.users.newSignups;
    totals.providers.newProviders += day.providers.newProviders;
    totals.providers.approved += day.providers.approved;
    totals.providers.rejected += day.providers.rejected;
    totals.bookings.created += day.bookings.created;
    totals.bookings.completed += day.bookings.completed;
    totals.bookings.cancelled += day.bookings.cancelled;
    totals.bookings.totalValue += day.bookings.totalValue;
    totals.revenue.gross += day.revenue.gross;
    totals.revenue.net += day.revenue.net;
    totals.revenue.refunds += day.revenue.refunds;
    totals.searches.totalSearches += day.searches.totalSearches;
    totals.ai.conversations += day.ai.conversations;
    totals.ai.messages += day.ai.messages;
    totals.ai.positiveFeedback += day.ai.positiveFeedback;
    totals.ai.negativeFeedback += day.ai.negativeFeedback;
  });
  
  // Calculate feedback score
  const totalFeedback = totals.ai.positiveFeedback + totals.ai.negativeFeedback;
  totals.ai.feedbackScore = totalFeedback > 0 
    ? Math.round((totals.ai.positiveFeedback / totalFeedback) * 100)
    : 0;
  
  // Get latest totals from most recent day
  const latest = stats[stats.length - 1];
  totals.users.totalUsers = latest.users.totalUsers;
  totals.providers.totalApproved = latest.providers.totalApproved;
  totals.providers.totalPending = latest.providers.totalPending;
  
  return {
    period: {
      start: startDate,
      end: endDate,
      days: stats.length
    },
    totals,
    daily: stats
  };
};

// Static method to compute stats for a specific date
dailyStatsSchema.statics.computeForDate = async function(date, AnalyticsEvent, Provider) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const stats = await this.getOrCreate(startOfDay);
  
  // Get event counts from AnalyticsEvent
  const eventCounts = await AnalyticsEvent.getEventCounts(startOfDay, endOfDay);
  
  // Get top searches
  const topSearches = await AnalyticsEvent.getTopSearches(startOfDay, endOfDay, 10);
  
  // Get provider stats
  const providerStats = await Provider.aggregate([
    {
      $facet: {
        byType: [
          { $match: { status: 'approved' } },
          { $unwind: '$providerTypes' },
          { $group: { _id: '$providerTypes', count: { $sum: 1 } } }
        ],
        totals: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ],
        newToday: [
          {
            $match: {
              createdAt: { $gte: startOfDay, $lte: endOfDay }
            }
          },
          { $count: 'count' }
        ],
        approvedToday: [
          {
            $match: {
              approvedAt: { $gte: startOfDay, $lte: endOfDay }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);
  
  // Update stats
  stats.searches.totalSearches = eventCounts['search.query'] || 0;
  stats.searches.topQueries = topSearches.map(s => ({ query: s.query, count: s.count }));
  
  stats.ai.conversations = eventCounts['ai.conversation_start'] || 0;
  stats.ai.messages = (eventCounts['ai.message_sent'] || 0) + (eventCounts['ai.message_received'] || 0);
  stats.ai.documentsAnalyzed = eventCounts['ai.document_analyzed'] || 0;
  stats.ai.calculatorUses = eventCounts['ai.calculator_complete'] || 0;
  stats.ai.positiveFeedback = eventCounts['ai.feedback_positive'] || 0;
  stats.ai.negativeFeedback = eventCounts['ai.feedback_negative'] || 0;
  
  const totalFeedback = stats.ai.positiveFeedback + stats.ai.negativeFeedback;
  stats.ai.feedbackScore = totalFeedback > 0 
    ? Math.round((stats.ai.positiveFeedback / totalFeedback) * 100)
    : 0;
  
  // Update provider stats
  if (providerStats[0]) {
    stats.providersByType = providerStats[0].byType.map(p => ({
      type: p._id,
      count: p.count
    }));
    
    const statusCounts = providerStats[0].totals.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});
    
    stats.providers.totalApproved = statusCounts.approved || 0;
    stats.providers.totalPending = statusCounts.pending || 0;
    stats.providers.newProviders = providerStats[0].newToday[0]?.count || 0;
    stats.providers.approved = providerStats[0].approvedToday[0]?.count || 0;
  }
  
  // Update engagement stats
  stats.engagement.appOpens = eventCounts['app.open'] || 0;
  stats.engagement.screenViews = eventCounts['screen.view'] || 0;
  stats.engagement.favoriteAdds = eventCounts['provider.favorite'] || 0;
  
  // Update platform stats
  const platformEvents = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$platform',
        sessions: { $addToSet: '$sessionId' },
        users: { $addToSet: '$userId' }
      }
    }
  ]);
  
  platformEvents.forEach(p => {
    if (stats.platforms[p._id]) {
      stats.platforms[p._id].sessions = p.sessions.length;
      stats.platforms[p._id].users = p.users.filter(u => u).length;
    }
  });
  
  stats.computedAt = new Date();
  stats.dataComplete = true;
  
  await stats.save();
  
  return stats;
};

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
