// backend/models/clarityPrice/Analytics.js
// Clarity Price - Analytics Model for Admin Dashboard
// Purpose: Daily aggregated metrics for monitoring and business intelligence

const mongoose = require('mongoose');

/**
 * Analytics Model
 * 
 * Purpose: Daily snapshots of Clarity Price metrics
 * Used by: Admin dashboard
 * Updated: Daily via cron job
 */

const analyticsSchema = new mongoose.Schema({
  // Date for this snapshot
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  
  // Usage metrics
  usage: {
    totalAnalyses: {
      type: Number,
      default: 0,
      min: 0
    },
    
    uniqueUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    
    avgAnalysesPerUser: {
      type: Number,
      default: 0,
      min: 0
    },
    
    newUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    
    returningUsers: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Processing metrics
  processing: {
    avgProcessingTimeMs: Number,
    successRate: Number,           // % of successful analyses
    ocrSuccessRate: Number,         // % of successful OCR
    errorRate: Number,
    
    statusBreakdown: {
      complete: Number,
      error: Number,
      processing: Number,
    }
  },
  
  // Financial impact
  financialImpact: {
    totalBilledAmount: Number,
    totalEstimatedFair: Number,
    totalPotentialSavings: Number,
    avgSavingsPerBill: Number,
    avgSavingsPercentage: Number,
  },
  
  // Category breakdown
  categoryBreakdown: [{
    category: {
      type: String,
      enum: ['lab', 'imaging', 'office_visit', 'procedure', 'medication', 'emergency', 'surgery', 'therapy', 'other']
    },
    count: Number,
    totalBilled: Number,
    avgBilledAmount: Number,
    avgSuggestedDiscount: Number,
    confidenceDistribution: {
      high: Number,
      medium: Number,
      low: Number
    }
  }],
  
  // Regional breakdown
  regionalBreakdown: [{
    metro: String,
    count: Number,
    avgBilledAmount: Number,
    avgPotentialSavings: Number,
  }],
  
  // Confidence distribution
  confidenceTiers: {
    tier1: {                       // High confidence
      count: Number,
      percentage: Number,
      avgSavings: Number,
    },
    tier2: {                       // Medium confidence
      count: Number,
      percentage: Number,
      avgSavings: Number,
    },
    tier3: {                       // Low confidence
      count: Number,
      percentage: Number,
      avgSavings: Number,
    }
  },
  
  // Top analyzed services
  topServices: [{
    description: String,
    cptCode: String,
    category: String,
    count: Number,
    avgBilledAmount: Number,
    avgConfidenceTier: Number,
  }],
  
  // Data quality metrics
  dataQuality: {
    cptCodePresent: {
      count: Number,
      percentage: Number,
    },
    
    medicareRateAvailable: {
      count: Number,
      percentage: Number,
    },
    
    highConfidenceAnalyses: {
      count: Number,
      percentage: Number,
    },
    
    userFeedbackRate: {
      count: Number,
      percentage: Number,
    }
  },
  
  // User engagement
  engagement: {
    scriptsViewed: Number,
    scriptsCopied: Number,
    providersContacted: Number,
    feedbackSubmitted: Number,
    
    avgViewsPerAnalysis: Number,
    scriptCopyRate: Number,        // % who copied script
  },
  
  // Cumulative totals (all-time)
  cumulative: {
    totalAnalyses: Number,
    totalUsers: Number,
    totalPotentialSavings: Number,
    avgAnalysesPerUser: Number,
  },
  
  // Timestamps
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ generatedAt: -1 });

// Static: Generate daily analytics
analyticsSchema.statics.generateDailyAnalytics = async function(date = new Date()) {
  const Bill = mongoose.model('ClarityPriceBill');
  const User = mongoose.model('User');
  
  // Set date to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get bills for this day
  const dailyBills = await Bill.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    'processing.status': 'complete'
  });
  
  // Get all-time totals
  const allTimeBills = await Bill.find({ 'processing.status': 'complete' });
  const allTimeUsers = await User.distinct('_id', { 'clarityPrice.billsAnalyzed': { $gt: 0 } });
  
  // Calculate metrics
  const analytics = {
    date: startOfDay,
    
    usage: {
      totalAnalyses: dailyBills.length,
      uniqueUsers: new Set(dailyBills.map(b => b.userId.toString())).size,
      avgAnalysesPerUser: dailyBills.length / new Set(dailyBills.map(b => b.userId.toString())).size || 0,
      newUsers: 0,  // TODO: Calculate from user creation dates
      returningUsers: 0,
    },
    
    processing: {
      avgProcessingTimeMs: average(dailyBills.map(b => b.processing.durationMs)),
      successRate: dailyBills.length / (dailyBills.length + await Bill.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        'processing.status': 'error'
      })) * 100,
      errorRate: 0,  // TODO: Calculate
    },
    
    financialImpact: {
      totalBilledAmount: sum(dailyBills.map(b => b.summary.totalBilled)),
      totalEstimatedFair: sum(dailyBills.map(b => b.summary.totalEstimatedFair)),
      totalPotentialSavings: sum(dailyBills.map(b => b.summary.potentialSavings)),
      avgSavingsPerBill: average(dailyBills.map(b => b.summary.potentialSavings)),
      avgSavingsPercentage: average(dailyBills.map(b => b.summary.savingsPercentage)),
    },
    
    categoryBreakdown: await calculateCategoryBreakdown(dailyBills),
    regionalBreakdown: await calculateRegionalBreakdown(dailyBills),
    confidenceTiers: await calculateConfidenceTiers(dailyBills),
    topServices: await calculateTopServices(dailyBills),
    
    dataQuality: {
      cptCodePresent: {
        count: dailyBills.filter(b => b.lineItems.some(item => item.cptCode)).length,
        percentage: (dailyBills.filter(b => b.lineItems.some(item => item.cptCode)).length / dailyBills.length) * 100
      },
      medicareRateAvailable: {
        count: dailyBills.filter(b => b.lineItems.some(item => item.referencePricing?.medicareRate)).length,
        percentage: (dailyBills.filter(b => b.lineItems.some(item => item.referencePricing?.medicareRate)).length / dailyBills.length) * 100
      },
      highConfidenceAnalyses: {
        count: dailyBills.filter(b => b.aiAnalysis.overallConfidence === 'high').length,
        percentage: (dailyBills.filter(b => b.aiAnalysis.overallConfidence === 'high').length / dailyBills.length) * 100
      },
      userFeedbackRate: {
        count: dailyBills.filter(b => b.feedback?.submitted).length,
        percentage: (dailyBills.filter(b => b.feedback?.submitted).length / dailyBills.length) * 100
      }
    },
    
    engagement: {
      scriptsViewed: dailyBills.filter(b => b.userInteraction.viewed).length,
      scriptsCopied: dailyBills.filter(b => b.userInteraction.scriptCopied).length,
      providersContacted: dailyBills.filter(b => b.userInteraction.providerCalled).length,
      feedbackSubmitted: dailyBills.filter(b => b.feedback?.submitted).length,
      avgViewsPerAnalysis: dailyBills.filter(b => b.userInteraction.viewed).length / dailyBills.length,
      scriptCopyRate: (dailyBills.filter(b => b.userInteraction.scriptCopied).length / dailyBills.length) * 100,
    },
    
    cumulative: {
      totalAnalyses: allTimeBills.length,
      totalUsers: allTimeUsers.length,
      totalPotentialSavings: sum(allTimeBills.map(b => b.summary.potentialSavings)),
      avgAnalysesPerUser: allTimeBills.length / allTimeUsers.length || 0,
    },
    
    generatedAt: new Date(),
  };
  
  // Upsert analytics for this date
  await this.findOneAndUpdate(
    { date: startOfDay },
    analytics,
    { upsert: true, new: true }
  );
  
  return analytics;
};

// Helper functions
function sum(arr) {
  return arr.reduce((a, b) => a + (b || 0), 0);
}

function average(arr) {
  return arr.length > 0 ? sum(arr) / arr.length : 0;
}

async function calculateCategoryBreakdown(bills) {
  const categories = {};
  
  bills.forEach(bill => {
    bill.lineItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = {
          category: item.category,
          count: 0,
          totalBilled: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 }
        };
      }
      
      categories[item.category].count += 1;
      categories[item.category].totalBilled += item.billedAmount;
      
      // Confidence distribution
      if (item.analysis.confidenceTier === 1) {
        categories[item.category].confidenceDistribution.high += 1;
      } else if (item.analysis.confidenceTier === 2) {
        categories[item.category].confidenceDistribution.medium += 1;
      } else {
        categories[item.category].confidenceDistribution.low += 1;
      }
    });
  });
  
  return Object.values(categories).map(cat => ({
    ...cat,
    avgBilledAmount: cat.totalBilled / cat.count,
    avgSuggestedDiscount: 0,  // TODO: Calculate from negotiation guidance
  }));
}

async function calculateRegionalBreakdown(bills) {
  const regions = {};
  
  bills.forEach(bill => {
    const metro = bill.region?.metro || 'Unknown';
    
    if (!regions[metro]) {
      regions[metro] = {
        metro,
        count: 0,
        totalBilled: 0,
        totalSavings: 0,
      };
    }
    
    regions[metro].count += 1;
    regions[metro].totalBilled += bill.summary.totalBilled;
    regions[metro].totalSavings += bill.summary.potentialSavings;
  });
  
  return Object.values(regions).map(region => ({
    ...region,
    avgBilledAmount: region.totalBilled / region.count,
    avgPotentialSavings: region.totalSavings / region.count,
  }));
}

async function calculateConfidenceTiers(bills) {
  const tiers = { tier1: { count: 0 }, tier2: { count: 0 }, tier3: { count: 0 } };
  
  bills.forEach(bill => {
    bill.lineItems.forEach(item => {
      const tier = `tier${item.analysis.confidenceTier}`;
      tiers[tier].count += 1;
    });
  });
  
  const total = tiers.tier1.count + tiers.tier2.count + tiers.tier3.count;
  
  return {
    tier1: { count: tiers.tier1.count, percentage: (tiers.tier1.count / total) * 100, avgSavings: 0 },
    tier2: { count: tiers.tier2.count, percentage: (tiers.tier2.count / total) * 100, avgSavings: 0 },
    tier3: { count: tiers.tier3.count, percentage: (tiers.tier3.count / total) * 100, avgSavings: 0 },
  };
}

async function calculateTopServices(bills) {
  const services = {};
  
  bills.forEach(bill => {
    bill.lineItems.forEach(item => {
      const key = item.cptCode || item.description;
      
      if (!services[key]) {
        services[key] = {
          description: item.description,
          cptCode: item.cptCode,
          category: item.category,
          count: 0,
          totalBilled: 0,
          totalConfidence: 0,
        };
      }
      
      services[key].count += 1;
      services[key].totalBilled += item.billedAmount;
      services[key].totalConfidence += item.analysis.confidenceTier;
    });
  });
  
  return Object.values(services)
    .map(service => ({
      ...service,
      avgBilledAmount: service.totalBilled / service.count,
      avgConfidenceTier: service.totalConfidence / service.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

const Analytics = mongoose.model('ClarityPriceAnalytics', analyticsSchema);

module.exports = Analytics;
