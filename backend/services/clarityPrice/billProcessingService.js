// backend/services/clarityPrice/billProcessingService.js
// Bill Processing Orchestrator - Coordinates All Services
// Complete pipeline: Upload → OCR → Parse → Analyze → Explain → Store → Delete

const { getOCRService } = require('./ocrService');
const { getBillParsingService } = require('./billParsingService');
const { getPricingAnalysisService } = require('./pricingAnalysisService');
const { getExplanationService } = require('./explanationService');
const { getImageManagementService } = require('./imageManagementService');
const Bill = require('../../models/clarityPrice/Bill');
const PricingIntelligence = require('../../models/clarityPrice/PricingIntelligence');
const User = require('../../models/User'); 

/**
 * Bill Processing Service
 * 
 * Orchestrates the complete bill analysis pipeline:
 * 1. Upload image (Cloudinary with auto-delete)
 * 2. Extract text (Google Vision OCR)
 * 3. Parse bill data (Claude AI)
 * 4. Analyze pricing (Medicare + regional)
 * 5. Generate explanations (Claude AI)
 * 6. Store analysis (MongoDB, de-identified)
 * 7. Schedule image deletion (24 hours)
 * 
 * PHI Compliance: Built into every step
 */

class BillProcessingService {
  constructor() {
    this.ocrService = getOCRService();
    this.parsingService = getBillParsingService();
    this.pricingService = getPricingAnalysisService();
    this.explanationService = getExplanationService();
    this.imageService = getImageManagementService();
  }
  
  /**
   * Process bill from image to complete analysis
   * Main entry point for bill analysis
   * 
   * @param {string|Buffer} imageData - File path, URL, or Buffer
   * @param {string} userId - User ID (MongoDB ObjectId)
   * @param {object} options - Processing options
   * @returns {Promise<object>} Complete analysis result
   */
  async processBill(imageData, userId, options = {}) {
    let billRecord = null;
    let uploadResult = null;
    
    try {
      console.log('[BillProcessor] Starting bill processing pipeline...');
      const pipelineStart = Date.now();
      
      // =========================================
      // STEP 1: UPLOAD IMAGE (with auto-delete)
      // =========================================
      console.log('[BillProcessor] Step 1/7: Uploading image...');
      uploadResult = await this.imageService.uploadBillImage(imageData);
      
      if (!uploadResult.success) {
        throw new Error('Image upload failed: ' + uploadResult.error);
      }
      
    // =========================================
// STEP 2: CREATE BILL RECORD + MEMBERSHIP LOGIC
// =========================================
console.log('[BillProcessor] Step 2/7: Creating bill record...');

// Get user and calculate membership fees
const user = await User.findById(userId);

if (!user) {
  throw new Error('User not found');
}

// Count user's previous bills
const billCount = await Bill.countDocuments({
  userId: userId,
  'processing.status': 'complete'
});

const isFirstBill = billCount === 0;
const isMember = user.isMember || false;

// Calculate fee
let feeCharged = 0;
if (!isMember) {
  feeCharged = isFirstBill ? 49 : 150;
}

console.log(`[BillProcessor] User membership: ${isMember}, First bill: ${isFirstBill}, Fee: $${feeCharged}`);

// Create bill record with membership fields
billRecord = new Bill({
  userId: userId,
  
  // Membership fields:
  userWasMember: isMember,
  isFirstBill: isFirstBill,
  feeCharged: feeCharged,
  guaranteeApplies: !isMember,
  
  // Image metadata:
  imageMetadata: {
    cloudinaryPublicId: uploadResult.cloudinaryPublicId,
    uploadedAt: uploadResult.uploadedAt,
    scheduledDeletionAt: uploadResult.scheduledDeletionAt,
    deleted: false
  },
  
  // Processing:
  processing: {
    status: 'ocr',
    startedAt: new Date()
  },
  
  // Region:
  region: {
    metro: options.userLocation || 'National Average',
    costOfLivingFactor: 1.0
  }
});

await billRecord.save();
console.log(`[BillProcessor] Bill record created: ${billRecord._id}`);
      
      // =========================================
// STEP 3: OCR TEXT EXTRACTION
// =========================================
console.log('[BillProcessor] Step 3/7: Extracting text with OCR...');

// Check if text was already extracted client-side
let ocrResult;
if (options.extractedText) {
  console.log('[BillProcessor] ✅ Using client-provided OCR text');
  console.log(`[BillProcessor] Text length: ${options.extractedText.length} characters`);
  ocrResult = {
    success: true,
    rawText: options.extractedText,
    confidence: 0.95, // Assume good quality from Google Vision
    quality: { assessment: 'good', score: 95, issues: [] },
    metadata: {
      wordCount: options.extractedText.split(/\s+/).length,
      characterCount: options.extractedText.length,
      pageCount: 1,
      processingTime: 0,
      timestamp: new Date()
    }
  };
} else {
  console.log('[BillProcessor] No client text provided, using server-side OCR');
  // Fallback to server-side OCR (currently mock data)
  ocrResult = await this.ocrService.extractText(uploadResult.secureUrl);
}

if (!ocrResult.success) {
  throw new Error('OCR extraction failed: ' + ocrResult.error);
}

console.log(`[BillProcessor] OCR complete: ${ocrResult.rawText.length} characters extracted`);
      // =========================================
      // STEP 4: PARSE BILL DATA
      // =========================================
      console.log('[BillProcessor] Step 4/7: Parsing bill with AI...');
      const parseResult = await this.parsingService.parseBillWithRetry(
        ocrResult.rawText
      );
      if (!parseResult.success) {
        throw new Error('Bill parsing failed: ' + parseResult.error);
      }
      
      const parsedData = parseResult.data;
      
      // Update bill record with parsed data
      billRecord.summary = {
        providerName: parsedData.provider?.name,
        providerType: parsedData.provider?.type,
        billDate: parsedData.dates?.billDate ? new Date(parsedData.dates.billDate) : null,
        serviceDate: parsedData.dates?.serviceDate ? new Date(parsedData.dates.serviceDate) : null,
        totalBilled: parsedData.totals?.totalBilled || 0
      };
      
      billRecord.processing.status = 'analyzing';
      await billRecord.save();
      
      // =========================================
      // STEP 5: PRICING ANALYSIS
      // =========================================
      console.log('[BillProcessor] Step 5/7: Analyzing pricing...');
      const pricingResult = this.pricingService.analyzePricing(
        parsedData.lineItems,
        options.userLocation || 'National Average',
        parsedData.totals || {}
      );
      
      // Update bill record with pricing analysis
      billRecord.lineItems = pricingResult.lineItems.map(item => ({
        description: item.description,
        cptCode: item.cptCode,
        category: item.category,
        quantity: item.quantity || 1,
        billedAmount: item.billedAmount,
        referencePricing: item.referencePricing,
        analysis: item.analysis,
        negotiationGuidance: item.negotiationGuidance
      }));
      
      billRecord.summary.totalEstimatedFair = pricingResult.summary.totalEstimatedFair;
      billRecord.summary.potentialSavings = pricingResult.summary.potentialSavings;
      billRecord.summary.savingsPercentage = pricingResult.summary.savingsPercentage;
      billRecord.summary.patientResponsibility = pricingResult.summary.patientResponsibility;
      billRecord.summary.fairPatientShare = pricingResult.summary.fairPatientShare;

      
      billRecord.region = {
        metro: pricingResult.regional.location,
        costOfLivingFactor: pricingResult.regional.factor
      };
      
      billRecord.processing.status = 'generating_explanation';
      await billRecord.save();
      
     // =========================================
// STEP 6: GENERATE EXPLANATIONS
// =========================================
console.log('[BillProcessor] Step 6/7: Generating explanations...');

const explanationResult = await this.explanationService.generateAnalysis({
  provider: billRecord.summary,
  lineItems: billRecord.lineItems,
  summary: pricingResult.summary,
  regional: pricingResult.regional,
  userContext: {
    isMember: billRecord.userWasMember,
    isFirstBill: billRecord.isFirstBill,
    fee: billRecord.feeCharged,
    billCount: billCount
  }
});

if (!explanationResult.success) {
  console.warn('[BillProcessor] Explanation generation failed, using fallback');
}

// Update bill record with AI analysis
      billRecord.aiAnalysis = {
        plainLanguageExplanation: explanationResult.plainLanguageExplanation || 'Analysis unavailable',
        negotiationScript: explanationResult.negotiationScript || 'Script unavailable',
        keyInsights: explanationResult.keyInsights || [],
        overallConfidence: pricingResult.summary.overallConfidence,
        confidenceScore: this.calculateConfidenceScore(pricingResult.summary.confidenceDistribution, billRecord.lineItems.length)
      };
      
      // =========================================
      // STEP 7: FINALIZE & STORE
      // =========================================
      console.log('[BillProcessor] Step 7/7: Finalizing...');
      
      // Mark as complete
      await billRecord.markComplete();
      
      // Store in pricing intelligence (anonymized)
      await this.updatePricingIntelligence(billRecord);
      
      const totalTime = Date.now() - pipelineStart;
      console.log(`[BillProcessor] ✅ Pipeline completed in ${totalTime}ms`);
      console.log(`[BillProcessor] Bill ID: ${billRecord._id}`);
      console.log(`[BillProcessor] Potential savings: $${billRecord.summary.potentialSavings.toFixed(2)}`);
      
      return {
        success: true,
        billId: billRecord._id,
        summary: {
          totalBilled: billRecord.summary.totalBilled,
          potentialSavings: billRecord.summary.potentialSavings,
          savingsPercentage: billRecord.summary.savingsPercentage,
          patientResponsibility: billRecord.summary.patientResponsibility,
          fairPatientShare: billRecord.summary.fairPatientShare,
          overallConfidence: billRecord.aiAnalysis.overallConfidence
        },
        processingTime: totalTime
      };
      
    } catch (error) {
      console.error('[BillProcessor] ❌ Pipeline failed:', error);
      
      // Mark bill as error if record exists
      if (billRecord) {
        await billRecord.markError(error);
      }
      
      // Clean up uploaded image on error
      if (uploadResult?.cloudinaryPublicId) {
        console.log('[BillProcessor] Cleaning up uploaded image...');
        await this.imageService.deleteImage(uploadResult.cloudinaryPublicId);
      }
      
      return {
        success: false,
        error: error.message,
        billId: billRecord?._id || null
      };
    }
  }
  
  /**
   * Calculate confidence score (0-100)
   * 
   * @param {object} distribution - Confidence tier distribution
   * @param {number} totalItems - Total line items
   * @returns {number} Confidence score
   */
  calculateConfidenceScore(distribution, totalItems) {
    if (totalItems === 0) return 0;
    
    const weights = {
      high: 100,
      medium: 60,
      low: 30
    };
    
    const weighted = 
      (distribution.high * weights.high) +
      (distribution.medium * weights.medium) +
      (distribution.low * weights.low);
    
    return Math.round(weighted / totalItems);
  }
  
  /**
   * Update pricing intelligence database
   * Stores anonymized data for future ML training
   * 
   * @param {object} billRecord - Complete bill record
   * @returns {Promise<void>}
   */
  async updatePricingIntelligence(billRecord) {
    try {
      console.log('[BillProcessor] Updating pricing intelligence...');
      
      for (const item of billRecord.lineItems) {
        // Find or create intelligence entry
        const intelligence = await PricingIntelligence.findOrCreate({
          serviceDescription: item.description,
          cptCode: item.cptCode,
          category: item.category,
          region: {
            metro: this.generalizeMetro(billRecord.region.metro),
            costOfLivingFactor: billRecord.region.costOfLivingFactor
          },
          providerType: billRecord.summary.providerType,
          billedAmount: item.billedAmount,
          medicareRate: item.referencePricing?.medicareRate ? {
            national: item.referencePricing.medicareRate,
            regional: item.referencePricing.regionalAdjusted
          } : undefined,
          suggestedPromptPay: item.negotiationGuidance?.suggestedRange
        });
        
        // Add data point
        await intelligence.addDataPoint({
          billedAmount: item.billedAmount,
          confidenceTier: item.analysis.confidenceTier
        });
      }
      
      console.log('[BillProcessor] Pricing intelligence updated');
      
    } catch (error) {
      console.error('[BillProcessor] Error updating pricing intelligence:', error);
      // Non-fatal, continue
    }
  }
  
  /**
   * Generalize metro for privacy
   * 
   * @param {string} metro - Specific metro area
   * @returns {string} Generalized region
   */
  generalizeMetro(metro) {
    // Map specific metros to broader regions
    const regionMap = {
      'Bozeman, MT': 'Mountain West',
      'Billings, MT': 'Mountain West',
      'Butte, MT': 'Mountain West',
      'Missoula, MT': 'Mountain West',
      'Manhattan, NY': 'Northeast Metro',
      'Brooklyn, NY': 'Northeast Metro',
      'San Francisco, CA': 'West Coast Metro',
      'Los Angeles, CA': 'West Coast Metro',
      'Seattle, WA': 'Pacific Northwest',
      'Dallas, TX': 'South Central',
      'Houston, TX': 'South Central',
      'Chicago, IL': 'Midwest Metro',
      'Atlanta, GA': 'Southeast Metro'
    };
    
    return regionMap[metro] || 'Other US';
  }
  
  /**
   * Get bill analysis by ID
   * Retrieves complete analysis for display
   * 
   * @param {string} billId - Bill MongoDB ObjectId
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object>} Complete bill analysis
   */
  async getBillAnalysis(billId, userId) {
    try {
      const bill = await Bill.findOne({
        _id: billId,
        userId: userId
      });
      
      if (!bill) {
        return {
          success: false,
          error: 'Bill not found or access denied'
        };
      }
      
      return {
        success: true,
        bill: {
          id: bill._id,
          provider: bill.summary,
          totalBilled: bill.summary.totalBilled,
          potentialSavings: bill.summary.potentialSavings,
          savingsPercentage: bill.summary.savingsPercentage,
          lineItems: bill.lineItems,
          explanation: bill.aiAnalysis?.plainLanguageExplanation,
          negotiationScript: bill.aiAnalysis?.negotiationScript,
          keyInsights: bill.aiAnalysis?.keyInsights,
          overallConfidence: bill.aiAnalysis?.overallConfidence,
          regional: bill.region,
          createdAt: bill.createdAt,
          status: bill.processing.status
        }
      };
      
    } catch (error) {
      console.error('[BillProcessor] Error getting bill analysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get user's bill history
   * 
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} User's bills
   */
  async getUserBills(userId, options = {}) {
    try {
      const query = {
        userId: userId,
        'processing.status': 'complete'
      };
      
      const bills = await Bill.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .select('summary aiAnalysis.overallConfidence createdAt')
        .lean();
      
      const totalSavings = bills.reduce((sum, bill) => 
        sum + (bill.summary?.potentialSavings || 0), 0
      );
      
      return {
        success: true,
        bills: bills,
        totalSavings: totalSavings,
        count: bills.length
      };
      
    } catch (error) {
      console.error('[BillProcessor] Error getting user bills:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let processingServiceInstance = null;

/**
 * Get bill processing service instance
 * 
 * @returns {BillProcessingService} Service singleton
 */
function getBillProcessingService() {
  if (!processingServiceInstance) {
    processingServiceInstance = new BillProcessingService();
  }
  return processingServiceInstance;
}

module.exports = {
  BillProcessingService,
  getBillProcessingService
};
