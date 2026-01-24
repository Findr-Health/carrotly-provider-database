// backend/models/clarityPrice/PricingIntelligence.js
// Clarity Price - Anonymized Pricing Intelligence Model
// Purpose: Aggregate anonymized data for ML training and market intelligence

const mongoose = require('mongoose');

/**
 * Pricing Intelligence Model
 * 
 * PRIVACY COMPLIANT:
 * - Fully anonymized (no user identifiers)
 * - No PHI (no patient names, DOBs, MRNs)
 * - Aggregated data only
 * - Used for ML training and market intelligence
 * 
 * Data Sources:
 * - User bill analyses (anonymized)
 * - Negotiation outcomes (optional user feedback)
 * - Market trends over time
 */

const pricingIntelligenceSchema = new mongoose.Schema({
  // Service identification
  serviceDescription: {
    type: String,
    required: true,
    index: true,
    trim: true,
    maxlength: 200,
  },
  
  serviceDescriptionHash: {
    type: String,              // SHA-256 hash for anonymization
    index: true,
  },
  
  cptCode: {
    type: String,
    index: true,
    match: /^\d{5}$/,
  },
  
  category: {
    type: String,
    required: true,
    enum: ['lab', 'imaging', 'office_visit', 'procedure', 'medication', 'emergency', 'surgery', 'therapy', 'other'],
    index: true
  },
  
  // Pricing data (aggregated)
  pricing: {
    billedAmount: {
      min: Number,
      max: Number,
      avg: Number,
      median: Number,
      stdDev: Number,
    },
    
    medicareRate: {
      national: Number,
      regional: Number,
    },
    
    suggestedPromptPay: {
      min: Number,
      max: Number,
      avg: Number,
    },
    
    actualDiscounts: {             // From user feedback
      min: Number,
      max: Number,
      avg: Number,
      median: Number,
      sampleSize: Number,
    }
  },
  
  // Regional context (metro level only)
  region: {
    metro: String,                 // e.g., "Mountain West" (generalized)
    costOfLivingFactor: Number,
  },
  
  // Provider context (type only, no identifiers)
  providerType: {
    type: String,
    enum: ['hospital', 'clinic', 'lab', 'imaging_center', 'pharmacy', 'therapy', 'other'],
  },
  
  // Confidence and quality metrics
  dataQuality: {
    sampleSize: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    
    confidenceLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    sources: [{
      type: String,
      enum: ['medicare', 'user_analysis', 'user_feedback', 'market_data']
    }]
  },
  
  // Negotiation success patterns
  negotiationPatterns: {
    attemptRate: Number,           // % of users who attempted
    successRate: Number,           // % who got discount
    avgTimeToNegotiate: Number,    // Days
    commonStrategies: [String],
  },
  
  // Trend data
  trends: {
    priceChangePercent: Number,    // % change over last 90 days
    volumeChange: Number,          // # of analyses change
    trending: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable'
    }
  },
  
  // Statistical metadata
  statistics: {
    firstSeen: Date,
    lastSeen: Date,
    totalAnalyses: {
      type: Number,
      default: 1,
      min: 1
    },
    feedbackCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
pricingIntelligenceSchema.index({ category: 1, 'dataQuality.sampleSize': -1 });
pricingIntelligenceSchema.index({ cptCode: 1, 'region.metro': 1 });
pricingIntelligenceSchema.index({ 'dataQuality.lastUpdated': -1 });
pricingIntelligenceSchema.index({ serviceDescriptionHash: 1 }, { unique: true });

// Method: Update with new data point
pricingIntelligenceSchema.methods.addDataPoint = async function(dataPoint) {
  // Update pricing statistics
  if (dataPoint.billedAmount) {
    this.pricing.billedAmount.min = Math.min(this.pricing.billedAmount.min || Infinity, dataPoint.billedAmount);
    this.pricing.billedAmount.max = Math.max(this.pricing.billedAmount.max || 0, dataPoint.billedAmount);
    
    // Recalculate average (incremental)
    const currentTotal = this.pricing.billedAmount.avg * this.statistics.totalAnalyses;
    this.pricing.billedAmount.avg = (currentTotal + dataPoint.billedAmount) / (this.statistics.totalAnalyses + 1);
  }
  
  // Update sample size
  this.statistics.totalAnalyses += 1;
  this.statistics.lastSeen = new Date();
  
  // Update confidence level based on sample size
  if (this.statistics.totalAnalyses >= 100) {
    this.dataQuality.confidenceLevel = 'high';
  } else if (this.statistics.totalAnalyses >= 20) {
    this.dataQuality.confidenceLevel = 'medium';
  } else {
    this.dataQuality.confidenceLevel = 'low';
  }
  
  this.dataQuality.sampleSize = this.statistics.totalAnalyses;
  this.dataQuality.lastUpdated = new Date();
  
  await this.save();
};

// Method: Add negotiation feedback
pricingIntelligenceSchema.methods.addFeedback = async function(feedback) {
  if (!feedback.attempted) return;
  
  this.statistics.feedbackCount += 1;
  
  if (feedback.successful && feedback.finalAmount) {
    const discount = ((feedback.billedAmount - feedback.finalAmount) / feedback.billedAmount) * 100;
    
    // Update actual discounts
    this.pricing.actualDiscounts.min = Math.min(this.pricing.actualDiscounts.min || Infinity, discount);
    this.pricing.actualDiscounts.max = Math.max(this.pricing.actualDiscounts.max || 0, discount);
    
    const currentTotal = this.pricing.actualDiscounts.avg * this.pricing.actualDiscounts.sampleSize;
    this.pricing.actualDiscounts.sampleSize += 1;
    this.pricing.actualDiscounts.avg = (currentTotal + discount) / this.pricing.actualDiscounts.sampleSize;
    
    // Update success rate
    const totalAttempts = this.negotiationPatterns.attemptRate * this.statistics.totalAnalyses;
    const totalSuccesses = this.negotiationPatterns.successRate * totalAttempts;
    this.negotiationPatterns.successRate = (totalSuccesses + 1) / (totalAttempts + 1);
  }
  
  // Add source
  if (!this.dataQuality.sources.includes('user_feedback')) {
    this.dataQuality.sources.push('user_feedback');
  }
  
  await this.save();
};

// Static: Find or create intelligence entry
pricingIntelligenceSchema.statics.findOrCreate = async function(data) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(data.serviceDescription).digest('hex');
  
  let entry = await this.findOne({ serviceDescriptionHash: hash });
  
  if (!entry) {
    entry = new this({
      serviceDescription: data.serviceDescription,
      serviceDescriptionHash: hash,
      cptCode: data.cptCode,
      category: data.category,
      region: data.region,
      providerType: data.providerType,
      pricing: {
        billedAmount: {
          min: data.billedAmount,
          max: data.billedAmount,
          avg: data.billedAmount,
        },
        medicareRate: data.medicareRate,
        suggestedPromptPay: data.suggestedPromptPay,
        actualDiscounts: {
          sampleSize: 0
        }
      },
      dataQuality: {
        sampleSize: 1,
        sources: ['user_analysis']
      },
      statistics: {
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalAnalyses: 1,
        feedbackCount: 0
      }
    });
    
    await entry.save();
  }
  
  return entry;
};

// Static: Get top services by volume
pricingIntelligenceSchema.statics.getTopServices = async function(limit = 10, category = null) {
  const query = category ? { category } : {};
  
  return this.find(query)
    .sort({ 'statistics.totalAnalyses': -1 })
    .limit(limit)
    .select('serviceDescription cptCode category pricing.billedAmount.avg statistics.totalAnalyses dataQuality.confidenceLevel');
};

// Static: Get analytics by category
pricingIntelligenceSchema.statics.getCategoryAnalytics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: '$statistics.totalAnalyses' },
        avgBilledAmount: { $avg: '$pricing.billedAmount.avg' },
        avgDiscount: { $avg: '$pricing.actualDiscounts.avg' },
        successRate: { $avg: '$negotiationPatterns.successRate' },
        uniqueServices: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static: Export for ML training
pricingIntelligenceSchema.statics.exportForML = async function(minSampleSize = 10) {
  const data = await this.find({
    'dataQuality.sampleSize': { $gte: minSampleSize }
  })
  .select('category cptCode pricing region providerType negotiationPatterns')
  .lean();
  
  // Further anonymize
  return data.map(item => ({
    category: item.category,
    cptCode: item.cptCode,
    billedAmountAvg: Math.round(item.pricing.billedAmount.avg / 10) * 10,  // Round to nearest $10
    medicareRate: item.pricing.medicareRate?.national,
    discountAvg: item.pricing.actualDiscounts?.avg,
    successRate: item.negotiationPatterns?.successRate,
    sampleSize: item.dataQuality?.sampleSize,
    region: generalizeRegion(item.region?.metro),
    providerType: item.providerType
  }));
};

// Helper: Generalize region for export
function generalizeRegion(metro) {
  if (!metro) return 'Unknown';
  
  // Map to broad regions
  const regionMap = {
    'Bozeman, MT': 'Mountain West',
    'Butte, MT': 'Mountain West',
    'Manhattan, NY': 'Northeast Metro',
    'San Francisco, CA': 'West Coast Metro',
    // etc.
  };
  
  return regionMap[metro] || 'Other';
}

// Pre-save middleware
pricingIntelligenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const PricingIntelligence = mongoose.model('ClarityPricePricingIntelligence', pricingIntelligenceSchema);

module.exports = PricingIntelligence;
