// backend/services/clarityPrice/explanationService.js
// Claude AI - User-Friendly Bill Explanations & Negotiation Scripts
// Non-punitive, empowering, opportunity-focused

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Explanation Service using Claude AI
 * 
 * Purpose: Generate user-friendly explanations and negotiation scripts
 * Tone: Empowering, non-punitive, opportunity-focused
 * 
 * Capabilities:
 * - Plain language bill explanations
 * - Specific negotiation scripts with dollar amounts
 * - Key insights and opportunities
 * - Non-accusatory framing
 */

class ExplanationService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.model = 'claude-sonnet-4-20250514';
  }
  
  /**
   * Generate complete bill analysis
   * 
   * @param {object} billData - Analyzed bill data
   * @returns {Promise<object>} Generated explanations
   */
  async generateAnalysis(billData) {
    try {
      console.log('[Explanation] Generating bill analysis with Claude AI...');
      const startTime = Date.now();
      
      // Build comprehensive analysis prompt
      const prompt = this.buildAnalysisPrompt(billData);
      
      // Call Claude API
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 3000,
        temperature: 0.7, // Slightly creative for natural language
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[Explanation] Analysis generated in ${processingTime}ms`);
      
      // Extract JSON from response
      const responseText = message.content[0].text;
      const analysis = this.extractJSON(responseText);
      
      if (!analysis) {
        console.error('[Explanation] Failed to parse Claude response');
        return {
          success: false,
          error: 'Failed to parse explanation response'
        };
      }
      
      console.log('[Explanation] Successfully generated explanations');
      
      return {
        success: true,
        explanation: analysis.explanation,
        negotiationScript: analysis.negotiationScript,
        keyInsights: analysis.keyInsights,
        metadata: {
          processingTime: processingTime,
          model: this.model,
          tokensUsed: message.usage
        }
      };
      
    } catch (error) {
      console.error('[Explanation] Error generating analysis:', error);
      return {
        success: false,
        error: error.message || 'Explanation generation failed'
      };
    }
  }
  
  /**
   * Build analysis prompt
   * 
   * @param {object} billData - Analyzed bill data
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(billData) {
    const { summary, lineItems, regional, provider } = billData;
    
    // Build line items summary
    const itemsSummary = lineItems.map(item => `
- ${item.description}
  Billed: $${item.billedAmount.toFixed(2)}
  Category: ${item.category}
  ${item.referencePricing.medicareRate ? `Medicare rate: $${item.referencePricing.medicareRate.toFixed(2)}` : 'Medicare rate: Not available'}
  Assessment: ${item.analysis.assessment}
  Confidence: ${item.analysis.confidenceTier === 1 ? 'High' : item.analysis.confidenceTier === 2 ? 'Medium' : 'Low'}
  Suggested prompt pay: $${item.negotiationGuidance.suggestedRange.opening?.toFixed(2) || 'N/A'}
  Typical discount range: ${item.negotiationGuidance.discountRange}
    `).join('\n');
    
    return `You are a friendly medical billing advocate helping a patient understand their bill.

BILL SUMMARY:
Provider: ${provider?.name || 'Healthcare provider'}
Location: ${regional?.location || 'Unknown'}
Total Billed: $${summary.totalBilled.toFixed(2)}
Estimated Fair Price: $${summary.totalEstimatedFair.toFixed(2)}
Potential Savings: $${summary.potentialSavings.toFixed(2)} (${summary.savingsPercentage.toFixed(0)}%)
Overall Confidence: ${summary.overallConfidence}

LINE ITEMS:
${itemsSummary}

REGIONAL CONTEXT:
${regional?.description || 'National average pricing'}

TASK: Generate a helpful, empowering analysis. Return ONLY valid JSON:

{
  "explanation": "2-3 paragraphs in friendly, conversational language. Explain what this bill is for, which charges are notable, and what opportunities exist. Be encouraging and non-punitive. Frame as 'you may be able to' not 'you should demand.' Acknowledge that some providers may have already applied discounts. Use specific dollar amounts from the analysis.",
  
  "negotiationScript": "Word-for-word script for calling the provider. Make it confident but polite. Structure as a conversation with specific dollar amounts. Include: (1) Friendly opening, (2) Current situation, (3) Your offer (specific $amount), (4) Justification (Medicare rates, prompt payment), (5) What to say if they refuse, (6) Closing. Format with clear sections using line breaks.",
  
  "keyInsights": [
    "3-5 specific, actionable bullet points",
    "Each should be a complete sentence with specific details",
    "Focus on opportunities and facts, not accusations",
    "Include specific dollar amounts where relevant",
    "Examples: 'Lab work is billed at 4x Medicare rate - this is common and often negotiable', 'Paying today could save $200-$350 based on typical prompt pay discounts'"
  ]
}

TONE GUIDELINES:
- Empowering, not angry
- Opportunity-focused, not accusatory
- "You may be able to ask for" not "Demand"
- "This bill may not include a discount yet" not "They're overcharging you"
- Acknowledge good faith: "Providers want to help patients pay bills"
- Frame as education: "Here's what you should know"
- Be specific with numbers: "$85 could become $35-$50 if you ask"

CONFIDENCE HANDLING:
- High confidence: Be specific about Medicare rates and savings
- Medium confidence: Use ranges and acknowledge uncertainty
- Low confidence: Focus on the fact that asking never hurts

DO NOT:
- Accuse providers of wrongdoing
- Guarantee specific outcomes
- Make legal claims
- Suggest withholding payment
- Use angry or confrontational language

Return ONLY the JSON. No markdown, no explanation.`;
  }
  
  /**
   * Generate quick script for a single line item
   * Useful for line-by-line UI
   * 
   * @param {object} lineItem - Single analyzed line item
   * @param {string} providerPhone - Provider phone number
   * @returns {Promise<string>} Quick negotiation script
   */
  async generateQuickScript(lineItem, providerPhone = null) {
    try {
      const opening = lineItem.negotiationGuidance?.suggestedRange?.opening;
      const category = lineItem.category;
      const billedAmount = lineItem.billedAmount;
      
      if (!opening) {
        return this.getGenericScript(billedAmount, category, providerPhone);
      }
      
      const script = `Hi, I'm calling about a charge for ${lineItem.description} dated [SERVICE DATE].

The billed amount is $${billedAmount.toFixed(2)}. I'd like to pay in full today if we can discuss a prompt pay discount.

Based on Medicare rates${lineItem.referencePricing.medicareRate ? ` (which are $${lineItem.referencePricing.medicareRate.toFixed(2)} for this service)` : ''} and typical prompt pay discounts for ${category} services, I'm prepared to pay $${opening.toFixed(2)} today.

Can you help me with this?`;
      
      return script;
      
    } catch (error) {
      console.error('[Explanation] Error generating quick script:', error);
      return this.getGenericScript(lineItem.billedAmount, lineItem.category, providerPhone);
    }
  }
  
  /**
   * Get generic negotiation script
   * Fallback when specific data isn't available
   * 
   * @param {number} amount - Billed amount
   * @param {string} category - Service category
   * @param {string} phone - Provider phone
   * @returns {string} Generic script
   */
  getGenericScript(amount, category = 'service', phone = null) {
    return `Hi, I received a bill for $${amount.toFixed(2)} and I'd like to discuss payment options.

I'm prepared to pay in full today if we can agree on a prompt pay discount. Many providers offer 20-40% discounts for immediate payment.

What prompt pay options do you have available?

${phone ? `\nProvider phone: ${phone}` : ''}`;
  }
  
  /**
   * Extract JSON from Claude response
   * 
   * @param {string} text - Claude response
   * @returns {object|null} Parsed JSON
   */
  extractJSON(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try extracting from markdown
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('[Explanation] Failed to parse JSON from markdown');
        }
      }
      
      // Try finding JSON object
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e3) {
          console.error('[Explanation] Failed to parse extracted JSON');
        }
      }
      
      return null;
    }
  }
  
  /**
   * Generate tier-specific messaging
   * Different messaging based on confidence level
   * 
   * @param {number} tier - Confidence tier (1, 2, or 3)
   * @param {object} item - Line item
   * @returns {string} Confidence-appropriate message
   */
  getConfidenceMessage(tier, item) {
    if (tier === 1) {
      // High confidence - be specific
      return `We have high confidence in this analysis. Medicare pays $${item.referencePricing.medicareRate.toFixed(2)} for this service. Based on national data and your region, a fair prompt pay price would be $${item.negotiationGuidance.suggestedRange.opening.toFixed(2)}-$${item.negotiationGuidance.suggestedRange.acceptable.high.toFixed(2)}.`;
    } else if (tier === 2) {
      // Medium confidence - use ranges
      return `We have moderate confidence in this analysis. While we don't have specific Medicare data for this charge, typical prompt pay discounts for ${item.category} services range from ${item.negotiationGuidance.discountRange}. A reasonable ask would be $${item.negotiationGuidance.suggestedRange.opening.toFixed(2)}-$${item.negotiationGuidance.suggestedRange.acceptable.high.toFixed(2)}.`;
    } else {
      // Low confidence - generic guidance
      return `We have limited specific data for this charge. However, it's always worth asking about prompt pay discounts. Many providers offer 20-40% off for immediate payment. For this $${item.billedAmount.toFixed(2)} charge, that could mean paying $${item.negotiationGuidance.suggestedRange.opening.toFixed(2)}-$${item.negotiationGuidance.suggestedRange.acceptable.high.toFixed(2)} instead.`;
    }
  }
}

// Singleton instance
let explanationServiceInstance = null;

/**
 * Get explanation service instance
 * 
 * @returns {ExplanationService} Service singleton
 */
function getExplanationService() {
  if (!explanationServiceInstance) {
    explanationServiceInstance = new ExplanationService();
  }
  return explanationServiceInstance;
}

module.exports = {
  ExplanationService,
  getExplanationService
};
