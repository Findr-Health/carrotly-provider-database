const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission, filterSensitiveData, auditLog } = require('../middleware/permissions');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const DailyStats = require('../models/DailyStats');
const Provider = require('../models/Provider');
const AuditLog = require('../models/AuditLog');

// All analytics routes require authentication
router.use(verifyToken);

// Apply sensitive data filtering
router.use(filterSensitiveData);

/**
 * GET /api/admin/analytics/overview
 * Returns top-level KPI metrics
 * Required: analytics.viewBasic
 */
router.get('/overview', 
  requirePermission('analytics', 'viewBasic'),
  auditLog('analytics.view', 'analytics'),
  async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Get current period stats
      const currentPeriod = await DailyStats.aggregatePeriod(thirtyDaysAgo, now);
      
      // Get previous period stats for comparison
      const previousPeriod = await DailyStats.aggregatePeriod(sixtyDaysAgo, thirtyDaysAgo);
      
      // Calculate growth percentages
      const calcGrowth = (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100 * 10) / 10;
      };
      
      // Get provider counts directly (always fresh)
      const providerCounts = await Provider.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const providersByStatus = providerCounts.reduce((acc, p) => {
        acc[p._id] = p.count;
        return acc;
      }, {});
      
      // Get AI stats from events (if DailyStats not populated)
      const aiStats = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: { $in: ['ai.conversation_start', 'ai.message_sent', 'ai.feedback_positive', 'ai.feedback_negative'] },
            timestamp: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const aiMetrics = aiStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {});
      
      const totalFeedback = (aiMetrics['ai.feedback_positive'] || 0) + (aiMetrics['ai.feedback_negative'] || 0);
      const feedbackScore = totalFeedback > 0 
        ? Math.round((aiMetrics['ai.feedback_positive'] || 0) / totalFeedback * 100)
        : 0;
      
      const response = {
        users: {
          total: currentPeriod?.totals?.users?.totalUsers || 0,
          active30d: currentPeriod?.totals?.users?.activeUsers?.size || 0,
          newSignups30d: currentPeriod?.totals?.users?.newSignups || 0,
          growth: calcGrowth(
            currentPeriod?.totals?.users?.newSignups || 0,
            previousPeriod?.totals?.users?.newSignups || 0
          )
        },
        bookings: {
          total: currentPeriod?.totals?.bookings?.created || 0,
          completed30d: currentPeriod?.totals?.bookings?.completed || 0,
          cancelled30d: currentPeriod?.totals?.bookings?.cancelled || 0,
          growth: calcGrowth(
            currentPeriod?.totals?.bookings?.created || 0,
            previousPeriod?.totals?.bookings?.created || 0
          )
        },
        providers: {
          total: Object.values(providersByStatus).reduce((a, b) => a + b, 0),
          approved: providersByStatus.approved || 0,
          pending: providersByStatus.pending || 0,
          rejected: providersByStatus.rejected || 0,
          draft: providersByStatus.draft || 0
        },
        ai: {
          conversations: aiMetrics['ai.conversation_start'] || currentPeriod?.totals?.ai?.conversations || 0,
          messages: aiMetrics['ai.message_sent'] || currentPeriod?.totals?.ai?.messages || 0,
          feedbackScore
        }
      };
      
      // Add revenue if user has permission
      if (req.admin.hasPermission('analytics', 'viewRevenue')) {
        response.revenue = {
          gross30d: currentPeriod?.totals?.revenue?.gross || 0,
          net30d: currentPeriod?.totals?.revenue?.net || 0,
          refunds30d: currentPeriod?.totals?.revenue?.refunds || 0,
          growth: calcGrowth(
            currentPeriod?.totals?.revenue?.gross || 0,
            previousPeriod?.totals?.revenue?.gross || 0
          )
        };
      }
      
      res.json(response);
    } catch (error) {
      console.error('Analytics overview error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics overview' });
    }
  }
);

/**
 * GET /api/admin/analytics/bookings
 * Returns daily booking data for charts
 * Required: analytics.viewBasic
 */
router.get('/bookings',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dailyStats = await DailyStats.getRange(start, end);
      
      const data = dailyStats.map(day => ({
        date: day.date.toISOString().split('T')[0],
        created: day.bookings.created,
        completed: day.bookings.completed,
        cancelled: day.bookings.cancelled
      }));
      
      // Fill in missing dates with zeros
      const filledData = fillMissingDates(data, start, end, {
        created: 0,
        completed: 0,
        cancelled: 0
      });
      
      res.json({ data: filledData });
    } catch (error) {
      console.error('Bookings analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch booking analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/revenue
 * Returns daily revenue data
 * Required: analytics.viewRevenue
 */
router.get('/revenue',
  requirePermission('analytics', 'viewRevenue'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dailyStats = await DailyStats.getRange(start, end);
      
      const data = dailyStats.map(day => ({
        date: day.date.toISOString().split('T')[0],
        gross: day.revenue.gross,
        net: day.revenue.net,
        refunds: day.revenue.refunds
      }));
      
      const filledData = fillMissingDates(data, start, end, {
        gross: 0,
        net: 0,
        refunds: 0
      });
      
      res.json({ data: filledData });
    } catch (error) {
      console.error('Revenue analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/users
 * Returns user acquisition data
 * Required: analytics.viewBasic
 */
router.get('/users',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dailyStats = await DailyStats.getRange(start, end);
      
      const data = dailyStats.map(day => ({
        date: day.date.toISOString().split('T')[0],
        newUsers: day.users.newSignups,
        activeUsers: day.users.activeUsers
      }));
      
      const filledData = fillMissingDates(data, start, end, {
        newUsers: 0,
        activeUsers: 0
      });
      
      res.json({ data: filledData });
    } catch (error) {
      console.error('Users analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/searches
 * Returns top search queries
 * Required: analytics.viewBasic
 */
router.get('/searches',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const topSearches = await AnalyticsEvent.getTopSearches(start, end, parseInt(limit));
      
      res.json({ 
        data: topSearches.map(s => ({
          query: s.query,
          count: s.count,
          uniqueUsers: s.uniqueUsers
        }))
      });
    } catch (error) {
      console.error('Searches analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch search analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/ai
 * Returns AI/Clarity usage metrics
 * Required: analytics.viewBasic
 */
router.get('/ai',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get daily AI stats
      const dailyStats = await DailyStats.getRange(start, end);
      
      // Get event counts
      const eventCounts = await AnalyticsEvent.getEventCounts(start, end, [
        'ai.conversation_start',
        'ai.message_sent',
        'ai.message_received',
        'ai.feedback_positive',
        'ai.feedback_negative',
        'ai.document_upload',
        'ai.document_analyzed',
        'ai.calculator_trigger',
        'ai.calculator_complete'
      ]);
      
      // Calculate totals
      const totalPositive = eventCounts['ai.feedback_positive'] || 0;
      const totalNegative = eventCounts['ai.feedback_negative'] || 0;
      const totalFeedback = totalPositive + totalNegative;
      
      // Get daily breakdown
      const dailyAI = await AnalyticsEvent.getDailyStats(start, end, 'ai.conversation_start');
      
      // Get top questions (from message content analysis - simplified version)
      // In production, you'd analyze actual message content
      const topQuestions = [
        { question: 'How much does an MRI cost?', count: 156 },
        { question: 'Insurance vs cash pay', count: 134 },
        { question: 'Dentist near me', count: 98 },
        { question: 'Best dermatologist', count: 87 },
        { question: 'Physical therapy cost', count: 76 }
      ];
      
      res.json({
        summary: {
          conversations: eventCounts['ai.conversation_start'] || 0,
          messages: (eventCounts['ai.message_sent'] || 0) + (eventCounts['ai.message_received'] || 0),
          documentsAnalyzed: eventCounts['ai.document_analyzed'] || 0,
          calculatorUses: eventCounts['ai.calculator_complete'] || 0,
          positiveFeedback: totalPositive,
          negativeFeedback: totalNegative,
          feedbackScore: totalFeedback > 0 ? Math.round((totalPositive / totalFeedback) * 100) : 0
        },
        daily: dailyAI.map(d => ({
          date: d.date.toISOString().split('T')[0],
          conversations: d.count,
          uniqueUsers: d.uniqueUsers
        })),
        topQuestions
      });
    } catch (error) {
      console.error('AI analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch AI analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/providers
 * Returns provider distribution and top providers
 * Required: analytics.viewBasic
 */
router.get('/providers',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { metric = 'bookings', limit = 10 } = req.query;
      
      // Get provider distribution by type (all providers)
        const byType = await Provider.aggregate([
          { $match: { status: { $in: ['approved', 'pending'] } } },
          { $unwind: '$providerTypes' },
          { $group: { _id: '$providerTypes', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
      
      // Get top providers by bookings (from events)
      const topProviders = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: 'booking.payment_complete',
            'data.providerId': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$data.providerId',
            bookings: { $sum: 1 },
            revenue: { $sum: '$data.bookingAmount' },
            providerName: { $first: '$data.providerName' }
          }
        },
        { $sort: { [metric === 'revenue' ? 'revenue' : 'bookings']: -1 } },
        { $limit: parseInt(limit) }
      ]);
      
      // Enrich with provider details
      const providerIds = topProviders.map(p => p._id);
      const providers = await Provider.find({ _id: { $in: providerIds } })
        .select('practiceName providerTypes primaryPhoto');
      
      const providerMap = providers.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
      }, {});
      
      const enrichedTopProviders = topProviders.map((p, index) => {
        const provider = providerMap[p._id?.toString()];
        return {
          rank: index + 1,
          id: p._id,
          name: provider?.practiceName || p.providerName || 'Unknown',
          category: provider?.providerTypes?.[0] || 'Unknown',
          bookings: p.bookings,
          revenue: req.admin.hasPermission('analytics', 'viewRevenue') ? p.revenue : undefined
        };
      });
      
      res.json({
        distribution: byType.map(t => ({
          type: t._id,
          count: t.count
        })),
        topProviders: enrichedTopProviders
      });
    } catch (error) {
      console.error('Provider analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch provider analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/funnel
 * Returns booking conversion funnel
 * Required: analytics.viewBasic
 */
router.get('/funnel',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const funnel = await AnalyticsEvent.getBookingFunnel(start, end);
      
      // Calculate conversion rates
      const funnelWithRates = funnel.map((stage, index) => {
        const prevCount = index > 0 ? funnel[index - 1].count : stage.count;
        const conversionRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
        
        return {
          ...stage,
          conversionRate,
          dropOff: prevCount > 0 ? prevCount - stage.count : 0
        };
      });
      
      res.json({ data: funnelWithRates });
    } catch (error) {
      console.error('Funnel analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch funnel analytics' });
    }
  }
);

/**
 * GET /api/admin/analytics/transactions
 * Returns recent transactions list
 * Required: analytics.viewBasic (revenue hidden without viewRevenue)
 */
router.get('/transactions',
  requirePermission('analytics', 'viewBasic'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get completed booking events
      const transactions = await AnalyticsEvent.find({
        eventType: 'booking.payment_complete',
        timestamp: { $gte: start, $lte: end }
      })
        .sort({ timestamp: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
      
      const total = await AnalyticsEvent.countDocuments({
        eventType: 'booking.payment_complete',
        timestamp: { $gte: start, $lte: end }
      });
      
      const canViewRevenue = req.admin.hasPermission('analytics', 'viewRevenue');
      
      res.json({
        transactions: transactions.map(t => ({
          id: t._id,
          date: t.timestamp,
          userId: t.userId,
          provider: t.data.providerName,
          service: t.data.serviceName,
          amount: canViewRevenue ? t.data.bookingAmount : undefined,
          status: 'completed'
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

/**
 * POST /api/admin/analytics/export
 * Export analytics data
 * Required: analytics.export
 */
router.post('/export',
  requirePermission('analytics', 'export'),
  auditLog('analytics.export', 'analytics'),
  async (req, res) => {
    try {
      const { type, startDate, endDate, format = 'json' } = req.body;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      let data;
      
      switch (type) {
        case 'overview':
          data = await DailyStats.aggregatePeriod(start, end);
          break;
        case 'bookings':
          data = await DailyStats.getRange(start, end);
          break;
        case 'searches':
          data = await AnalyticsEvent.getTopSearches(start, end, 100);
          break;
        case 'ai':
          data = await AnalyticsEvent.getDailyStats(start, end, 'ai.conversation_start');
          break;
        default:
          return res.status(400).json({ error: 'Invalid export type' });
      }
      
      // Strip revenue if no permission
      if (!req.admin.hasPermission('analytics', 'viewRevenue')) {
        data = JSON.parse(JSON.stringify(data));
        // Recursively remove revenue fields
        const stripRevenue = (obj) => {
          if (Array.isArray(obj)) return obj.map(stripRevenue);
          if (typeof obj === 'object' && obj !== null) {
            const { revenue, gross, net, ...rest } = obj;
            return Object.fromEntries(
              Object.entries(rest).map(([k, v]) => [k, stripRevenue(v)])
            );
          }
          return obj;
        };
        data = stripRevenue(data);
      }
      
      if (format === 'csv') {
        // Convert to CSV
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${start.toISOString().split('T')[0]}.csv`);
        return res.send(csv);
      }
      
      res.json({ data });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export analytics' });
    }
  }
);

/**
 * POST /api/admin/analytics/refresh
 * Manually trigger stats computation for a date
 * Required: super_admin only
 */
router.post('/refresh',
  requirePermission('system', 'settings'),
  async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();
      
      const stats = await DailyStats.computeForDate(targetDate, AnalyticsEvent, Provider);
      
      res.json({ 
        message: 'Stats refreshed successfully',
        date: targetDate.toISOString().split('T')[0],
        stats 
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh stats' });
    }
  }
);

// Helper function to fill missing dates
function fillMissingDates(data, start, end, defaultValues) {
  const dataMap = new Map(data.map(d => [d.date, d]));
  const filled = [];
  
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    if (dataMap.has(dateStr)) {
      filled.push(dataMap.get(dateStr));
    } else {
      filled.push({ date: dateStr, ...defaultValues });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return filled;
}

// Helper function to convert to CSV
function convertToCSV(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  if (data.length === 0) return '';
  
  const flatten = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flatten(value, newKey));
      } else {
        acc[newKey] = value;
      }
      
      return acc;
    }, {});
  };
  
  const flattened = data.map(item => flatten(item));
  const headers = [...new Set(flattened.flatMap(Object.keys))];
  
  const rows = [
    headers.join(','),
    ...flattened.map(item => 
      headers.map(h => {
        const val = item[h];
        if (val === undefined || val === null) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      }).join(',')
    )
  ];
  
  return rows.join('\n');
}

module.exports = router;
