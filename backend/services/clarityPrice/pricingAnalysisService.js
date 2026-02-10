// backend/services/clarityPrice/pricingAnalysisService.js
// Pricing Intelligence - Medicare, Regional, Market Analysis
// Non-punitive: Focuses on opportunities, not accusations

const { getMedicareRate, determineCategoryFromCPT } = require('../../data/medicare/medicare-rates');
const { getRegionalAdjustment, applyRegionalAdjustment } = require('../../data/medicare/regionalAdjustments');

/**
 * Pricing Analysis Service
 * 
 * Purpose: Analyze bill charges against reference pricing
 * Data Sources:
 * - Medicare rates (official CMS data)
 * - Regional cost of living adjustments
 * - Category-based discount patterns
 * 
 * Philosophy: Non-punitive, opportunity-focused
 * - Frame as "opportunity to ask" not "you're being overcharged"
 * - Acknowledge providers may have already discounted
 * - Provide ranges, not single numbers
 * - Be honest about confidence levels
 */

class PricingAnalysisService {
  constructor() {
    // Category-based discount patterns (industry knowledge)
    this.discountPatterns = {
      lab: {
        typicalRange: '30-50%',
        promptPayMultiplier: { min: 0.50, max: 0.70 },
        cashPriceCommon: true,
        reasoning: 'Lab work typically has high markups but providers are flexible'
      },
      
      imaging: {
        typicalRange: '20-35%',
        promptPayMultiplier: { min: 0.65, max: 0.80 },
        cashPriceCommon: true,
        reasoning: 'Imaging centers often offer cash pricing programs'
      },
      
      office_visit: {
        typicalRange: '10-20%',
        promptPayMultiplier: { min: 0.80, max: 0.90 },
        cashPriceCommon: false,
        reasoning: 'Office visits are less negotiable but worth asking'
      },
      
      procedure: {
        typicalRange: '15-30%',
        promptPayMultiplier: { min: 0.70, max: 0.85 },
        cashPriceCommon: false,
        reasoning: 'Varies by procedure complexity'
      },
      
      medication: {
        typicalRange: '10-25%',
        promptPayMultiplier: { min: 0.75, max: 0.90 },
        cashPriceCommon: true,
        reasoning: 'Generic medications may have cash programs'
      },
      
      emergency: {
        typicalRange: '5-15%',
        promptPayMultiplier: { min: 0.85, max: 0.95 },
        cashPriceCommon: false,
        reasoning: 'Emergency services are difficult to negotiate'
      },
      
      surgery: {
        typicalRange: '10-25%',
        promptPayMultiplier: { min: 0.75, max: 0.90 },
        cashPriceCommon: false,
        reasoning: 'Complex procedures vary widely'
      },
      
      therapy: {
        typicalRange: '15-25%',
        promptPayMultiplier: { min: 0.75, max: 0.85 },
        cashPriceCommon: true,
        reasoning: 'Therapy services often offer cash rates'
      },
      
      other: {
        typicalRange: '20-40%',
        promptPayMultiplier: { min: 0.60, max: 0.80 },
        cashPriceCommon: null,
        reasoning: 'Generic guidance for uncategorized services'
      }
    };
  }
  
  /**
   * Analyze pricing for all line items
   * 
   * @param {array} lineItems - Parsed bill line items
   * @param {string} userLocation - User's metro area (e.g., "Bozeman, MT")
   * @returns {object} Pricing analysis
   */
  analyzePricing(lineItems, userLocation = 'National Average', billSummary = {}) {
    console.log('[Pricing] Starting pricing analysis...');
    console.log(`[Pricing] Location: ${userLocation}`);
    console.log(`[Pricing] Analyzing ${lineItems.length} line items`);
    
    // Get regional adjustment
    const regional = getRegionalAdjustment(userLocation);
    
    // Analyze each line item
    const analyzedItems = lineItems.map(item => 
      this.analyzeLineItem(item, regional)
    );
    
    // Calculate summary statistics
    const summary = this.calculateSummary(analyzedItems, billSummary);
    
    console.log(`[Pricing] Analysis complete`);
    console.log(`[Pricing] Total billed: $${summary.totalBilled.toFixed(2)}`);
    console.log(`[Pricing] Estimated fair: $${summary.totalEstimatedFair.toFixed(2)}`);
    console.log(`[Pricing] Potential savings: $${summary.potentialSavings.toFixed(2)} (${summary.savingsPercentage.toFixed(1)}%)`);
    
    return {
      lineItems: analyzedItems,
      summary: summary,
      regional: {
        location: regional.label,
        factor: regional.factor,
        description: regional.description
      }
    };
  }
  
  /**
   * Analyze single line item
   * 
   * @param {object} item - Bill line item
   * @param {object} regional - Regional adjustment data
   * @returns {object} Analyzed line item
   */
  analyzeLineItem(item, regional) {
    // Get Medicare rate
    const medicareInfo = getMedicareRate(item.cptCode || '');
    
    // Determine category if not set
    const category = item.category || this.guessCategory(item.description, item.cptCode);
    
    // Get discount pattern for category
    const pattern = this.discountPatterns[category] || this.discountPatterns.other;
    
    // Calculate reference pricing
    const referencePricing = this.calculateReferencePricing(
      item.billedAmount,
      medicareInfo,
      regional,
      pattern
    );
    
    // Determine confidence tier
    const confidence = this.determineConfidenceTier(
      medicareInfo,
      category,
      item.cptCode
    );
    
    // Assess pricing fairness
    const assessment = this.assessPricing(
      item.billedAmount,
      referencePricing,
      confidence
    );
    
    // Generate negotiation guidance
    const negotiation = this.generateNegotiationGuidance(
      item.billedAmount,
      referencePricing,
      pattern,
      confidence
    );
    
    return {
      ...item,
      category: category,
      referencePricing: referencePricing,
      analysis: {
        assessment: assessment.verdict,
        reasoning: assessment.reasoning,
        comparedToMedicare: assessment.comparedToMedicare,
        confidenceTier: confidence.tier,
        confidenceFactors: confidence.factors
      },
      negotiationGuidance: negotiation
    };
  }
  
  /**
   * Calculate reference pricing
   * 
   * @param {number} billedAmount - Amount provider billed
   * @param {object} medicareInfo - Medicare rate info
   * @param {object} regional - Regional adjustment
   * @param {object} pattern - Category discount pattern
   * @returns {object} Reference pricing
   */
  calculateReferencePricing(billedAmount, medicareInfo, regional, pattern) {
    const pricing = {
      medicareRate: null,
      regionalAdjusted: null,
      fairPriceRange: { low: null, high: null },
      source: 'unknown'
    };
    
    // If we have Medicare rate
    if (medicareInfo.rate) {
      pricing.medicareRate = medicareInfo.rate;
      
      // Apply regional adjustment
      const adjusted = applyRegionalAdjustment(medicareInfo.rate, regional.label);
      pricing.regionalAdjusted = adjusted.adjustedRate;
      
      // Fair price range: 140-200% of Medicare (industry standard)
      pricing.fairPriceRange = {
        low: Math.round(pricing.regionalAdjusted * 1.4 * 100) / 100,
        high: Math.round(pricing.regionalAdjusted * 2.0 * 100) / 100
      };
      
      pricing.source = medicareInfo.source;
    } else {
      // No Medicare rate - estimate from category pattern
      pricing.source = 'category_estimate';
      
      // Estimate fair range from billed amount using prompt pay multipliers
      pricing.fairPriceRange = {
        low: Math.round(billedAmount * pattern.promptPayMultiplier.min * 100) / 100,
        high: Math.round(billedAmount * pattern.promptPayMultiplier.max * 100) / 100
      };
    }
    
    return pricing;
  }
  
  /**
   * Determine confidence tier
   * 
   * @param {object} medicareInfo - Medicare rate info
   * @param {string} category - Service category
   * @param {string} cptCode - CPT code
   * @returns {object} Confidence assessment
   */
  determineConfidenceTier(medicareInfo, category, cptCode) {
    const factors = [];
    let tier = 3; // Default: low confidence
    
    // Tier 1 (High Confidence): Medicare rate + CPT code
    if (medicareInfo.rate && medicareInfo.source === 'medicare_schedule' && cptCode) {
      tier = 1;
      factors.push('Medicare rate available');
      factors.push('CPT code present');
      factors.push('Official CMS pricing data');
    }
    // Tier 2 (Medium Confidence): Medicare estimate OR category + description
    else if (medicareInfo.rate || (category && category !== 'other')) {
      tier = 2;
      if (medicareInfo.rate) {
        factors.push('Medicare rate estimated from category');
      }
      if (category && category !== 'other') {
        factors.push(`Service category identified: ${category}`);
      }
      factors.push('Market intelligence available');
    }
    // Tier 3 (Low Confidence): Generic guidance only
    else {
      tier = 3;
      factors.push('Limited data available');
      factors.push('Generic discount guidance');
    }
    
    return {
      tier: tier,
      level: tier === 1 ? 'high' : tier === 2 ? 'medium' : 'low',
      factors: factors
    };
  }
  
  /**
   * Assess pricing fairness
   * 
   * @param {number} billedAmount - Amount billed
   * @param {object} referencePricing - Reference pricing data
   * @param {object} confidence - Confidence assessment
   * @returns {object} Pricing assessment
   */
  assessPricing(billedAmount, referencePricing, confidence) {
    let verdict = 'unknown';
    let reasoning = 'Unable to assess without reference pricing';
    let comparedToMedicare = null;
    
    // If we have Medicare rate
    if (referencePricing.medicareRate) {
      comparedToMedicare = billedAmount / referencePricing.medicareRate;
      
      // Assess based on comparison to fair range
      const fairLow = referencePricing.fairPriceRange.low;
      const fairHigh = referencePricing.fairPriceRange.high;
      
      if (billedAmount <= fairHigh) {
        verdict = 'fair';
        reasoning = `This charge is within the fair market range (${comparedToMedicare.toFixed(1)}x Medicare rate)`;
      } else if (billedAmount <= fairHigh * 1.5) {
        verdict = 'high';
        reasoning = `This charge is higher than typical (${comparedToMedicare.toFixed(1)}x Medicare rate)`;
      } else if (billedAmount <= fairHigh * 2.5) {
        verdict = 'very_high';
        reasoning = `This charge is significantly higher than typical (${comparedToMedicare.toFixed(1)}x Medicare rate)`;
      } else {
        verdict = 'extreme';
        reasoning = `This charge is extremely high (${comparedToMedicare.toFixed(1)}x Medicare rate)`;
      }
    }
    // If we only have category estimate
    else if (referencePricing.fairPriceRange.low) {
      const midpoint = (referencePricing.fairPriceRange.low + referencePricing.fairPriceRange.high) / 2;
      
      if (billedAmount <= midpoint) {
        verdict = 'fair';
        reasoning = 'This charge appears reasonable for this service category';
      } else if (billedAmount <= midpoint * 1.5) {
        verdict = 'high';
        reasoning = 'This charge is on the higher end for this service category';
      } else {
        verdict = 'very_high';
        reasoning = 'This charge is significantly higher for this service category';
      }
    }
    
    return {
      verdict: verdict,
      reasoning: reasoning,
      comparedToMedicare: comparedToMedicare
    };
  }
  
  /**
   * Generate negotiation guidance
   * 
   * @param {number} billedAmount - Amount billed
   * @param {object} referencePricing - Reference pricing
   * @param {object} pattern - Category pattern
   * @param {object} confidence - Confidence assessment
   * @returns {object} Negotiation guidance
   */
  generateNegotiationGuidance(billedAmount, referencePricing, pattern, confidence) {
    const guidance = {
      suggestedRange: { opening: null, acceptable: { low: null, high: null }, walkaway: null },
      discountRange: pattern.typicalRange,
      strategy: '',
      leverage: []
    };
    
    // Calculate suggested prices based on confidence
    if (confidence.tier === 1 && referencePricing.fairPriceRange.low) {
      // High confidence: Use Medicare + fair range
      guidance.suggestedRange.opening = Math.round(referencePricing.fairPriceRange.low * 100) / 100;
      guidance.suggestedRange.acceptable.low = guidance.suggestedRange.opening;
      guidance.suggestedRange.acceptable.high = Math.round(referencePricing.fairPriceRange.high * 100) / 100;
      guidance.suggestedRange.walkaway = Math.round(referencePricing.fairPriceRange.high * 1.2 * 100) / 100;
      
      guidance.strategy = 'Start with Medicare-based pricing, reference national rates';
      guidance.leverage.push(`Medicare pays $${referencePricing.medicareRate.toFixed(2)} for this service`);
      guidance.leverage.push('Offering immediate payment');
    } else if (confidence.tier === 2 && referencePricing.fairPriceRange.low) {
      // Medium confidence: Use category pattern
      guidance.suggestedRange.opening = referencePricing.fairPriceRange.low;
      guidance.suggestedRange.acceptable.low = referencePricing.fairPriceRange.low;
      guidance.suggestedRange.acceptable.high = referencePricing.fairPriceRange.high;
      guidance.suggestedRange.walkaway = Math.round(referencePricing.fairPriceRange.high * 1.3 * 100) / 100;
      
      guidance.strategy = `Ask about prompt pay discounts. ${pattern.reasoning}`;
      guidance.leverage.push('Willing to pay in full today');
    } else {
      // Low confidence: Use generic pattern
      const min = Math.round(billedAmount * pattern.promptPayMultiplier.min * 100) / 100;
      const max = Math.round(billedAmount * pattern.promptPayMultiplier.max * 100) / 100;
      
      guidance.suggestedRange.opening = min;
      guidance.suggestedRange.acceptable.low = min;
      guidance.suggestedRange.acceptable.high = max;
      guidance.suggestedRange.walkaway = Math.round(billedAmount * 0.95 * 100) / 100;
      
      guidance.strategy = `Ask if prompt pay discount is available. ${pattern.reasoning}`;
      guidance.leverage.push('Offering immediate payment');
      guidance.leverage.push(`Typical discounts for this category: ${pattern.typicalRange}`);
    }
    
    return guidance;
  }
  
  /**
   * Calculate summary statistics
   * 
   * @param {array} analyzedItems - Analyzed line items
   * @returns {object} Summary statistics
   */
  calculateSummary(analyzedItems, billTotals = {}) {
  // Calculate total charges
  const totalBilled = analyzedItems.reduce((sum, item) => 
    sum + (item.billedAmount * (item.quantity || 1)), 0
  );
  
  // Calculate total estimated fair price
  const totalEstimatedFair = analyzedItems.reduce((sum, item) => {
    const opening = item.negotiationGuidance?.suggestedRange?.opening || item.billedAmount * 0.7;
    return sum + (opening * (item.quantity || 1));
  }, 0);
  
  // Get patient responsibility from parsed bill (or calculate it)
  let patientResponsibility = billTotals.patientResponsibility;
  let insuranceAdjustments = 0;
  
  if (!patientResponsibility) {
    // If not provided, calculate from insurance payments
    const insurancePaid = billTotals.insurancePaid || 0;
    insuranceAdjustments = insurancePaid;
    patientResponsibility = Math.max(0, totalBilled - insurancePaid);
  } else {
    // Calculate adjustments as difference
    insuranceAdjustments = totalBilled - patientResponsibility;
  }
  
  // Calculate fair patient share (proportional to what's fair)
  const fairnessRatio = totalEstimatedFair / totalBilled;
  const fairPatientShare = patientResponsibility * fairnessRatio;
  
  // Calculate realistic savings (what patient can actually save)
  const potentialSavings = Math.max(0, patientResponsibility - fairPatientShare);
  const savingsPercentage = patientResponsibility > 0 
    ? (potentialSavings / patientResponsibility) * 100 
    : 0;
  
  // Calculate total savings (for reference)
  const totalPotentialSavings = totalBilled - totalEstimatedFair;
  
  // Count items by confidence tier
  const confidenceDistribution = {
    high: analyzedItems.filter(item => item.analysis.confidenceTier === 1).length,
    medium: analyzedItems.filter(item => item.analysis.confidenceTier === 2).length,
    low: analyzedItems.filter(item => item.analysis.confidenceTier === 3).length
  };
  
  // Overall confidence
  let overallConfidence = 'low';
  if (confidenceDistribution.high >= analyzedItems.length * 0.7) {
    overallConfidence = 'high';
  } else if (confidenceDistribution.high + confidenceDistribution.medium >= analyzedItems.length * 0.5) {
    overallConfidence = 'medium';
  }
  
  return {
    // Total bill amounts
    totalBilled: totalBilled,
    totalEstimatedFair: totalEstimatedFair,
    totalPotentialSavings: totalPotentialSavings,
    
    // Insurance and patient amounts
    insuranceAdjustments: insuranceAdjustments,
    patientResponsibility: patientResponsibility,
    fairPatientShare: Math.round(fairPatientShare * 100) / 100,
    
    // Realistic savings (what matters to the patient)
    potentialSavings: Math.round(potentialSavings * 100) / 100,
    savingsPercentage: Math.round(savingsPercentage * 10) / 10,
    
    // Confidence metrics
    confidenceDistribution: confidenceDistribution,
    overallConfidence: overallConfidence,
    lineItemCount: analyzedItems.length
  };
}
  
  /**
   * Guess category from description
   * Fallback categorization
   * 
   * @param {string} description - Service description
   * @param {string} cptCode - CPT code
   * @returns {string} Category
   */
  guessCategory(description, cptCode) {
    if (cptCode) {
      return determineCategoryFromCPT(cptCode) || 'other';
    }
    
    const desc = description.toLowerCase();
    
    if (/(blood|lab|test|panel|urinalysis)/i.test(desc)) return 'lab';
    if (/(x-ray|ct|mri|ultrasound|scan)/i.test(desc)) return 'imaging';
    if (/(office|visit|consultation|exam)/i.test(desc)) return 'office_visit';
    if (/(therapy|rehabilitation|pt|ot)/i.test(desc)) return 'therapy';
    if (/(surgery|surgical|operation)/i.test(desc)) return 'surgery';
    if (/(emergency|er|urgent)/i.test(desc)) return 'emergency';
    if (/(medication|drug|injection|infusion)/i.test(desc)) return 'medication';
    if (/(procedure|biopsy)/i.test(desc)) return 'procedure';
    
    return 'other';
  }
}

// Singleton instance
let pricingServiceInstance = null;

/**
 * Get pricing analysis service instance
 * 
 * @returns {PricingAnalysisService} Service singleton
 */
function getPricingAnalysisService() {
  if (!pricingServiceInstance) {
    pricingServiceInstance = new PricingAnalysisService();
  }
  return pricingServiceInstance;
}

module.exports = {
  PricingAnalysisService,
  getPricingAnalysisService
};
