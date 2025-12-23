/**
 * Geographic Pricing Service
 * P1 Feature: Compare charges to regional averages
 * 
 * Key Features:
 * - Regional price benchmarks by ZIP code
 * - Price comparison with "typical/high/low" indicators
 * - Facility type context (hospital vs clinic vs freestanding)
 * - Fair Health / CMS reference data structure
 */

// Regional pricing data structure
// In production, this would come from Fair Health API or CMS data
const REGIONAL_PRICING = require('../data/regionalPricing.json');

/**
 * Get regional price context for a document's charges
 * @param {Object} extraction - Document extraction data
 * @param {string} zipCode - User's ZIP code (5 digits)
 * @returns {Object} Price context with comparisons
 */
function getRegionalPriceContext(extraction, zipCode) {
  if (!zipCode || !extraction?.lineItems) {
    return {
      available: false,
      reason: 'ZIP code or line items not provided'
    };
  }

  // Determine region from ZIP code
  const region = getRegionFromZip(zipCode);
  const facilityType = detectFacilityType(extraction);
  
  // Analyze each line item
  const priceAnalysis = extraction.lineItems.map((item, index) => {
    const code = item.code || item.cptCode || item.hcpcsCode;
    const charge = item.charge || item.billed || item.chargedAmount || 0;
    
    if (!code || charge === 0) {
      return {
        lineNumber: index + 1,
        code: code,
        description: item.description,
        charge: charge,
        comparison: null,
        reason: 'Unable to compare - missing code or amount'
      };
    }

    // Get regional benchmark
    const benchmark = getRegionalBenchmark(code, region, facilityType);
    
    if (!benchmark) {
      return {
        lineNumber: index + 1,
        code: code,
        description: item.description,
        charge: charge,
        comparison: null,
        reason: 'No regional data available for this code'
      };
    }

    // Compare charge to benchmark
    const comparison = compareToRegional(charge, benchmark);
    
    return {
      lineNumber: index + 1,
      code: code,
      description: item.description,
      charge: charge,
      benchmark: benchmark,
      comparison: comparison
    };
  });

  // Calculate summary statistics
  const analyzed = priceAnalysis.filter(p => p.comparison !== null);
  const summary = calculatePricingSummary(analyzed);

  return {
    available: true,
    region: region,
    facilityType: facilityType,
    zipCode: zipCode,
    lineItems: priceAnalysis,
    summary: summary,
    insights: generatePricingInsights(summary, facilityType),
    disclaimer: 'Price ranges are estimates based on regional data and may vary by facility, insurance, and other factors.'
  };
}

/**
 * Get region from ZIP code
 */
function getRegionFromZip(zipCode) {
  const prefix = zipCode.substring(0, 3);
  
  // Simplified ZIP to region mapping
  // In production, use full ZIP code database
  const regionMap = {
    // Northeast
    '010': 'NORTHEAST', '011': 'NORTHEAST', '012': 'NORTHEAST', // MA
    '100': 'NORTHEAST', '101': 'NORTHEAST', '102': 'NORTHEAST', // NY
    '190': 'NORTHEAST', '191': 'NORTHEAST', // PA
    
    // Southeast
    '300': 'SOUTHEAST', '301': 'SOUTHEAST', '302': 'SOUTHEAST', // GA
    '330': 'SOUTHEAST', '331': 'SOUTHEAST', '332': 'SOUTHEAST', // FL
    '270': 'SOUTHEAST', '271': 'SOUTHEAST', // NC
    
    // Midwest
    '430': 'MIDWEST', '431': 'MIDWEST', // OH
    '480': 'MIDWEST', '481': 'MIDWEST', // MI
    '606': 'MIDWEST', '607': 'MIDWEST', // IL (Chicago)
    
    // Southwest
    '750': 'SOUTHWEST', '751': 'SOUTHWEST', '752': 'SOUTHWEST', // TX (Dallas)
    '770': 'SOUTHWEST', '771': 'SOUTHWEST', // TX (Houston)
    '850': 'SOUTHWEST', '851': 'SOUTHWEST', // AZ
    
    // West
    '900': 'WEST', '901': 'WEST', '902': 'WEST', // CA (LA)
    '941': 'WEST', '942': 'WEST', // CA (SF)
    '980': 'WEST', '981': 'WEST', // WA (Seattle)
    
    // Mountain
    '800': 'MOUNTAIN', '801': 'MOUNTAIN', '802': 'MOUNTAIN', // CO
    '840': 'MOUNTAIN', '841': 'MOUNTAIN' // UT
  };

  return regionMap[prefix] || 'NATIONAL';
}

/**
 * Detect facility type from extraction
 */
function detectFacilityType(extraction) {
  const providerName = (extraction.provider?.name || '').toLowerCase();
  const description = (extraction.content || '').toLowerCase();
  
  // Check for hospital indicators
  if (providerName.includes('hospital') || 
      providerName.includes('medical center') ||
      providerName.includes('health system')) {
    return 'HOSPITAL';
  }
  
  // Check for ER indicators
  if (extraction.documentType === 'EOB' && extraction.lineItems?.some(item => {
    const code = item.code || '';
    return code.startsWith('9928') || code.startsWith('9929'); // ED codes
  })) {
    return 'EMERGENCY';
  }
  
  // Check for urgent care
  if (providerName.includes('urgent care') || 
      providerName.includes('immediate care')) {
    return 'URGENT_CARE';
  }
  
  // Check for imaging center
  if (providerName.includes('imaging') || 
      providerName.includes('radiology') ||
      providerName.includes('diagnostic')) {
    return 'IMAGING_CENTER';
  }
  
  // Check for lab
  if (providerName.includes('lab') || 
      providerName.includes('quest') ||
      providerName.includes('labcorp')) {
    return 'LAB';
  }
  
  // Check for freestanding ASC
  if (providerName.includes('surgery center') || 
      providerName.includes('surgical center') ||
      providerName.includes('ambulatory')) {
    return 'ASC';
  }
  
  // Default to physician office
  return 'PHYSICIAN_OFFICE';
}

/**
 * Get regional benchmark for a code
 */
function getRegionalBenchmark(code, region, facilityType) {
  try {
    const codeData = REGIONAL_PRICING?.codes?.[code];
    if (!codeData) return null;
    
    // Get regional multiplier
    const regionMultiplier = REGIONAL_PRICING?.regionMultipliers?.[region] || 1.0;
    
    // Get facility multiplier
    const facilityMultipliers = {
      'HOSPITAL': 2.5,
      'EMERGENCY': 3.0,
      'URGENT_CARE': 1.3,
      'ASC': 1.5,
      'IMAGING_CENTER': 0.8,
      'LAB': 0.6,
      'PHYSICIAN_OFFICE': 1.0
    };
    const facilityMultiplier = facilityMultipliers[facilityType] || 1.0;
    
    // Calculate adjusted range
    const baseMedian = codeData.medianPrice || codeData.typical || 100;
    const adjustedMedian = baseMedian * regionMultiplier * facilityMultiplier;
    
    return {
      code: code,
      description: codeData.description,
      region: region,
      facilityType: facilityType,
      low: Math.round(adjustedMedian * 0.5),
      median: Math.round(adjustedMedian),
      high: Math.round(adjustedMedian * 2.0),
      percentile90: Math.round(adjustedMedian * 2.5),
      source: 'Estimated from regional data',
      regionMultiplier: regionMultiplier,
      facilityMultiplier: facilityMultiplier
    };
  } catch (e) {
    return null;
  }
}

/**
 * Compare charge to regional benchmark
 */
function compareToRegional(charge, benchmark) {
  if (!benchmark) return null;
  
  const percentOfMedian = (charge / benchmark.median) * 100;
  
  let rating, explanation, color;
  
  if (charge <= benchmark.low) {
    rating = 'LOW';
    explanation = 'Below typical range - unusually low for your area';
    color = 'green';
  } else if (charge <= benchmark.median) {
    rating = 'TYPICAL';
    explanation = 'Within normal range for your area';
    color = 'green';
  } else if (charge <= benchmark.high) {
    rating = 'ABOVE_AVERAGE';
    explanation = 'Above median but within normal variation';
    color = 'yellow';
  } else if (charge <= benchmark.percentile90) {
    rating = 'HIGH';
    explanation = 'Higher than most charges in your area';
    color = 'orange';
  } else {
    rating = 'VERY_HIGH';
    explanation = 'Significantly higher than typical - worth verifying';
    color = 'red';
  }

  return {
    rating: rating,
    explanation: explanation,
    color: color,
    percentOfMedian: Math.round(percentOfMedian),
    charge: charge,
    regionalMedian: benchmark.median,
    regionalRange: {
      low: benchmark.low,
      high: benchmark.high
    },
    savingsOpportunity: charge > benchmark.median ? charge - benchmark.median : 0
  };
}

/**
 * Calculate summary statistics for pricing analysis
 */
function calculatePricingSummary(analyzedItems) {
  if (analyzedItems.length === 0) {
    return {
      itemsAnalyzed: 0,
      overallRating: 'UNKNOWN',
      message: 'Unable to compare prices - no matching codes found'
    };
  }

  const ratings = {
    'LOW': 0,
    'TYPICAL': 0,
    'ABOVE_AVERAGE': 0,
    'HIGH': 0,
    'VERY_HIGH': 0
  };

  let totalCharge = 0;
  let totalMedian = 0;
  let totalSavingsOpportunity = 0;

  analyzedItems.forEach(item => {
    if (item.comparison) {
      ratings[item.comparison.rating]++;
      totalCharge += item.charge;
      totalMedian += item.comparison.regionalMedian;
      totalSavingsOpportunity += item.comparison.savingsOpportunity;
    }
  });

  // Determine overall rating
  let overallRating, overallMessage;
  const highCount = ratings.HIGH + ratings.VERY_HIGH;
  const totalAnalyzed = analyzedItems.filter(i => i.comparison).length;

  if (ratings.VERY_HIGH > 0) {
    overallRating = 'REVIEW_RECOMMENDED';
    overallMessage = `${ratings.VERY_HIGH} charge(s) significantly above typical prices for your area`;
  } else if (highCount > totalAnalyzed / 2) {
    overallRating = 'ABOVE_AVERAGE';
    overallMessage = 'Most charges are above average for your area';
  } else if (ratings.TYPICAL + ratings.LOW >= totalAnalyzed / 2) {
    overallRating = 'REASONABLE';
    overallMessage = 'Charges appear reasonable for your area';
  } else {
    overallRating = 'MIXED';
    overallMessage = 'Some charges are higher than typical, others are reasonable';
  }

  return {
    itemsAnalyzed: totalAnalyzed,
    ratingBreakdown: ratings,
    overallRating: overallRating,
    message: overallMessage,
    totalCharge: totalCharge,
    totalRegionalMedian: totalMedian,
    percentOfMedian: Math.round((totalCharge / totalMedian) * 100),
    potentialSavings: totalSavingsOpportunity
  };
}

/**
 * Generate insights based on pricing analysis
 */
function generatePricingInsights(summary, facilityType) {
  const insights = [];

  // Facility type context
  const facilityContext = {
    'HOSPITAL': 'Hospital-based pricing is typically 2-3x higher than freestanding facilities',
    'EMERGENCY': 'Emergency room pricing is typically the highest due to 24/7 availability and resources',
    'URGENT_CARE': 'Urgent care is typically more affordable than ER for non-emergency issues',
    'ASC': 'Ambulatory surgery centers typically offer lower prices than hospital outpatient',
    'IMAGING_CENTER': 'Freestanding imaging centers are typically 50-70% less than hospital imaging',
    'LAB': 'Freestanding labs typically offer the lowest prices for lab work',
    'PHYSICIAN_OFFICE': 'Physician office pricing is typically moderate'
  };

  if (facilityContext[facilityType]) {
    insights.push({
      type: 'CONTEXT',
      title: 'Facility Type',
      detail: facilityContext[facilityType]
    });
  }

  // Pricing insights
  if (summary.overallRating === 'REVIEW_RECOMMENDED') {
    insights.push({
      type: 'WARNING',
      title: 'Prices above typical range',
      detail: 'Some charges are significantly higher than typical for your area. Consider asking for an itemized bill and verifying each charge.'
    });
  }

  if (summary.potentialSavings > 100) {
    insights.push({
      type: 'SAVINGS',
      title: 'Potential savings opportunity',
      detail: `Based on regional pricing, you might save up to $${summary.potentialSavings.toFixed(0)} by negotiating or verifying charges.`
    });
  }

  if (summary.overallRating === 'REASONABLE') {
    insights.push({
      type: 'SUCCESS',
      title: 'Prices look reasonable',
      detail: 'The charges appear to be within normal range for your area and facility type.'
    });
  }

  return insights;
}

/**
 * Get price comparison questions to ask
 */
function getPriceVerificationQuestions(priceContext) {
  const questions = [];

  if (!priceContext.available) return questions;

  const highItems = priceContext.lineItems.filter(
    item => item.comparison?.rating === 'HIGH' || item.comparison?.rating === 'VERY_HIGH'
  );

  if (highItems.length > 0) {
    questions.push({
      askWho: 'Provider Billing',
      question: 'Can you provide an itemized bill showing each charge with the billing code?',
      whyAsk: 'This helps verify each charge is correct and there are no duplicates'
    });

    highItems.forEach(item => {
      questions.push({
        askWho: 'Provider Billing',
        question: `The charge for ${item.description} (code ${item.code}) is $${item.charge}. Can you explain what's included in this charge?`,
        whyAsk: `This charge is ${item.comparison.percentOfMedian}% of the typical price in your area`
      });
    });
  }

  if (priceContext.summary.potentialSavings > 200) {
    questions.push({
      askWho: 'Provider Billing',
      question: 'Do you offer a prompt-pay discount or self-pay rate?',
      whyAsk: 'Many providers offer 20-40% discounts for prompt payment'
    });

    questions.push({
      askWho: 'Provider Billing',
      question: 'Is there a financial assistance program I might qualify for?',
      whyAsk: 'Non-profit hospitals are required to have financial assistance programs'
    });
  }

  return questions;
}

module.exports = {
  getRegionalPriceContext,
  getRegionFromZip,
  detectFacilityType,
  getRegionalBenchmark,
  compareToRegional,
  getPriceVerificationQuestions
};
