// backend/models/clarityPrice/Bill.js
// Clarity Price - Bill Analysis Model
// CRITICAL: This model stores NO PHI. Images are deleted within 24h.

const mongoose = require('mongoose');

/**
 * Bill Analysis Model
 * 
 * PHI COMPLIANCE:
 * - NO patient names
 * - NO dates of birth
 * - NO medical record numbers
 * - NO full bill images (deleted after processing)
 * - Only de-identified pricing data retained
 * 
 * Data Retention:
 * - De-identified pricing data: 2 years (for ML training)
 * - Original images: 24 hours max (auto-deleted)
 * - OCR text: 7 days (debugging only)
 */

const lineItemSchema = new mongoose.Schema({
  // Service information (generic, no patient-specific details)
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  
  // Medical coding
  cptCode: {
    type: String,
    trim: true,
    match: /^\d{5}$|^$/,  // 5 digits or empty
  },
  
  category: {
    type: String,
    required: true,
    enum: ['lab', 'imaging', 'office_visit', 'procedure', 'medication', 'emergency', 'surgery', 'therapy', 'other'],
    default: 'other'
  },
  
  // Pricing data
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  billedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Reference pricing (for analysis)
  referencePricing: {
    medicareRate: Number,          // CMS national rate
    regionalAdjusted: Number,      // Adjusted for cost of living
    fairPriceRange: {
      low: Number,                 // Conservative estimate
      high: Number,                // Upper reasonable limit
    },
    source: {
      type: String,
      enum: ['medicare', 'category_pattern', 'historical', 'medicare_schedule', 'unknown'],
      default: 'unknown'
    }
  },
  
  // AI Analysis
  analysis: {
    assessment: {
      type: String,
      enum: ['fair', 'high', 'very_high', 'extreme', 'unknown'],
      default: 'unknown'
    },
    reasoning: String,
    comparedToMedicare: Number,    // Multiplier (e.g., 3.5 = 3.5x Medicare)
    confidenceTier: {
      type: Number,
      enum: [1, 2, 3],             // 1=high, 2=medium, 3=low
      default: 3
    },
    confidenceFactors: [String],
  },
  
  // Negotiation guidance
  negotiationGuidance: {
    suggestedRange: {
      opening: Number,             // Start here
      acceptable: {
        low: Number,
        high: Number
      },
      walkaway: Number,            // Never pay more than this
    },
    discountRange: String,         // e.g., "30-50%"
    strategy: String,
    leverage: [String],
  }
}, { _id: true });

const billSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

    // Membership tracking
  userWasMember: {
    type: Boolean,
    required: true,
    default: false
  },
  
  isFirstBill: {
    type: Boolean,
    default: false
  },
  
  // Fee calculation
  feeCharged: {
    type: Number,
    default: 0
  },
  
  guaranteeApplies: {
    type: Boolean,
    default: true  // $100 savings guarantee
  },
  
  // Negotiation tracking (for future use)
  negotiationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'user_declined'],
    default: 'pending'
  },
  
  assignedNegotiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Image handling (TEMPORARY ONLY)
  imageMetadata: {
    cloudinaryPublicId: String,    // For deletion
    uploadedAt: Date,
    scheduledDeletionAt: Date,     // 24 hours from upload
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  },
  
  // OCR data (TEMPORARY - 7 days retention for debugging)
  ocrData: {
    extractedText: String,
    confidence: Number,             // 0-1 from Google Vision
    processedAt: Date,
    retentionExpiry: Date,          // 7 days from processing
  },
  
  // Bill summary (de-identified)
  summary: {
    providerName: String,          // Generic name only, no NPI or tax ID
    providerType: {
      type: String,
      enum: ['hospital', 'clinic', 'lab', 'imaging_center', 'pharmacy', 'therapy', 'other'],
    },
    billDate: Date,                // For user reference only
    serviceDate: Date,             // For user reference only
    totalBilled: {
      type: Number,
      default: 0,     
      min: 0
    },
    totalEstimatedFair: Number,
    potentialSavings: Number,
    savingsPercentage: Number,
  },
  
  // Regional context (metro level, not specific address)
  region: {
    metro: String,                 // e.g., "Bozeman, MT"
    costOfLivingFactor: Number,    // Adjustment factor (0.85 = 15% below national)
  },
  
  // Line items (detailed charges)
  lineItems: [lineItemSchema],
  
  // AI-generated content
  aiAnalysis: {
    plainLanguageExplanation: String,
    negotiationScript: String,
    keyInsights: [String],
    overallConfidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    confidenceScore: Number,       // 0-100
  },
  
  // Processing metadata
  processing: {
    status: {
      type: String,
      enum: ['uploading', 'ocr', 'parsing', 'analyzing', 'complete', 'generating_explanation', 'complete', 'error'],
      default: 'uploading',
      index: true
    },
    startedAt: Date,
    completedAt: Date,
    durationMs: Number,
    errorMessage: String,
    errorDetails: mongoose.Schema.Types.Mixed,
  },
  
  // User interaction tracking (for product improvement)
  userInteraction: {
    viewed: {
      type: Boolean,
      default: false
    },
    viewedAt: Date,
    scriptCopied: {
      type: Boolean,
      default: false
    },
    providerCalled: {
      type: Boolean,
      default: false
    },
  },
  
  // Optional: User feedback (not required for MVP)
  feedback: {
    attempted: Boolean,
    successful: Boolean,
    finalAmount: Number,
    discountAchieved: Number,
    notes: String,
    submittedAt: Date,
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
billSchema.index({ userId: 1, createdAt: -1 });
billSchema.index({ 'processing.status': 1, createdAt: -1 });
billSchema.index({ 'imageMetadata.scheduledDeletionAt': 1 });
billSchema.index({ 'ocrData.retentionExpiry': 1 });

// Virtual: Has image been deleted?
billSchema.virtual('imageDeleted').get(function() {
  return this.imageMetadata?.deleted || false;
});

// Virtual: Should image be deleted now?
billSchema.virtual('shouldDeleteImage').get(function() {
  if (!this.imageMetadata?.scheduledDeletionAt) return false;
  return new Date() >= this.imageMetadata.scheduledDeletionAt;
});

// Method: Mark as complete
billSchema.methods.markComplete = async function() {
  this.processing.status = 'complete';
  this.processing.completedAt = new Date();
  this.processing.durationMs = new Date() - this.processing.startedAt;
  await this.save();
};

// Method: Mark as error
billSchema.methods.markError = async function(error) {
  this.processing.status = 'error';
  this.processing.completedAt = new Date();
  this.processing.errorMessage = error.message;
  this.processing.errorDetails = {
    stack: error.stack,
    code: error.code,
    timestamp: new Date()
  };
  await this.save();
};

// Method: Record image deletion
billSchema.methods.recordImageDeletion = async function() {
  this.imageMetadata.deleted = true;
  this.imageMetadata.deletedAt = new Date();
  await this.save();
};

// Method: Calculate statistics
billSchema.methods.calculateStats = function() {
  return {
    totalBilled: this.summary.totalBilled,
    totalEstimatedFair: this.summary.totalEstimatedFair,
    potentialSavings: this.summary.potentialSavings,
    savingsPercentage: this.summary.savingsPercentage,
    lineItemCount: this.lineItems.length,
    highConfidenceItems: this.lineItems.filter(item => item.analysis.confidenceTier === 1).length,
    averageConfidence: this.lineItems.reduce((sum, item) => sum + (4 - item.analysis.confidenceTier), 0) / this.lineItems.length
  };
};

// Static: Find bills requiring image deletion
billSchema.statics.findPendingImageDeletions = function() {
  return this.find({
    'imageMetadata.deleted': false,
    'imageMetadata.scheduledDeletionAt': { $lte: new Date() }
  });
};

// Static: Find bills with expired OCR data
billSchema.statics.findExpiredOCRData = function() {
  return this.find({
    'ocrData.retentionExpiry': { $lte: new Date() },
    'ocrData.extractedText': { $exists: true, $ne: null }
  });
};

// Pre-save middleware: Update timestamps
billSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware: Set deletion schedules
billSchema.pre('save', function(next) {
  // Schedule image deletion 24 hours from upload
  if (this.isNew && this.imageMetadata?.uploadedAt) {
    const deletionTime = new Date(this.imageMetadata.uploadedAt);
    deletionTime.setHours(deletionTime.getHours() + 24);
    this.imageMetadata.scheduledDeletionAt = deletionTime;
  }
  
  // Schedule OCR data expiry 7 days from processing
  if (this.ocrData?.processedAt && !this.ocrData.retentionExpiry) {
    const expiryTime = new Date(this.ocrData.processedAt);
    expiryTime.setDate(expiryTime.getDate() + 7);
    this.ocrData.retentionExpiry = expiryTime;
  }
  
  next();
});

// Export model
const Bill = mongoose.model('ClarityPriceBill', billSchema);

module.exports = Bill;
