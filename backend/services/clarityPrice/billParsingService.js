// backend/services/clarityPrice/billParsingService.js
// Claude AI - Structured Bill Data Extraction
// PHI Compliant: Extracts only billing data, removes patient identifiers

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Bill Parsing Service using Claude AI
 * 
 * Purpose: Parse OCR text into structured billing data
 * PHI Protection: Explicitly excludes patient names, DOBs, MRNs
 * 
 * Capabilities:
 * - Description-based service identification (doesn't require CPT codes)
 * - Category assignment (lab, imaging, office visit, etc.)
 * - Amount extraction with validation
 * - Provider information extraction (name only, no identifiers)
 * - Date extraction
 */

class BillParsingService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.model = 'claude-sonnet-4-20250514';
  }
  
  /**
   * Parse OCR text into structured bill data
   * 
   * @param {string} ocrText - Raw text from OCR
   * @param {object} patterns - Pre-extracted patterns (optional)
   * @returns {Promise<object>} Structured bill data
   */
  async parseBill(ocrText, patterns = {}) {
    try {
      console.log('[Parser] Starting bill parsing with Claude AI...');
      const startTime = Date.now();
      
      // Build the parsing prompt
      const prompt = this.buildParsingPrompt(ocrText, patterns);
      
      // Call Claude API
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: 0, // Deterministic for data extraction
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[Parser] Claude parsing completed in ${processingTime}ms`);
      
      // Extract JSON from response
      const responseText = message.content[0].text;
      const parsed = this.extractJSON(responseText);
      
      if (!parsed) {
        console.error('[Parser] Failed to extract JSON from Claude response');
        return {
          success: false,
          error: 'Failed to parse Claude response as JSON',
          rawResponse: responseText
        };
      }
      
      // Validate parsed data
      const validation = this.validateParsedData(parsed);
      
      if (!validation.valid) {
        console.warn('[Parser] Validation warnings:', validation.warnings);
      }
      
      console.log(`[Parser] Successfully parsed ${parsed.lineItems?.length || 0} line items`);
      
      return {
        success: true,
        data: parsed,
        validation: validation,
        metadata: {
          processingTime: processingTime,
          model: this.model,
          tokensUsed: message.usage
        }
      };
      
    } catch (error) {
      console.error('[Parser] Error parsing bill:', error);
      return {
        success: false,
        error: error.message || 'Bill parsing failed'
      };
    }
  }
  
  /**
   * Build Claude parsing prompt
   * 
   * @param {string} ocrText - OCR extracted text
   * @param {object} patterns - Pre-extracted patterns
   * @returns {string} Formatted prompt
   */
  buildParsingPrompt(ocrText, patterns) {
    return `You are a medical billing expert parsing healthcare bills. Extract structured billing data from this text.

CRITICAL PHI PROTECTION:
- DO NOT include patient names
- DO NOT include dates of birth
- DO NOT include medical record numbers
- DO NOT include social security numbers
- DO NOT include specific diagnoses (only service descriptions)
- Extract ONLY billing and pricing information

BILL TEXT:
${ocrText}

${patterns.amounts?.length > 0 ? `\nPRE-DETECTED AMOUNTS: ${patterns.amounts.map(a => a.text).join(', ')}` : ''}
${patterns.cptCodes?.length > 0 ? `\nPRE-DETECTED CPT CODES: ${patterns.cptCodes.join(', ')}` : ''}

TASK: Extract the following information and return ONLY valid JSON (no markdown, no explanation):

{
  "provider": {
    "name": "string (generic provider name, no NPI or tax ID)",
    "type": "hospital|clinic|lab|imaging_center|pharmacy|therapy|other",
    "phone": "string (if present)",
    "address": "string (if present, generic only)"
  },
  
  "dates": {
    "billDate": "YYYY-MM-DD or null",
    "serviceDate": "YYYY-MM-DD or null"
  },
  
  "lineItems": [
    {
      "description": "string (generic service description, e.g., 'Blood test' not 'John's blood test')",
      "cptCode": "string (5 digits) or null",
      "quantity": number (default 1),
      "billedAmount": number,
      "category": "lab|imaging|office_visit|procedure|medication|emergency|surgery|therapy|other"
    }
  ],
  
  "totals": {
    "totalBilled": number,
    "insurancePaid": number or null,
    "patientResponsibility": number or null
  }
}

INSTRUCTIONS:
1. For descriptions, use GENERIC terms only. Instead of "Patient John Smith's CBC", use "Complete Blood Count (CBC)"
2. Categories:
   - lab: Blood tests, urinalysis, pathology
   - imaging: X-rays, CT scans, MRI, ultrasound
   - office_visit: Doctor consultations, exams
   - procedure: Minor surgery, injections, biopsies
   - medication: Prescriptions, IV drugs
   - emergency: ER visits, urgent care
   - surgery: Major surgical procedures
   - therapy: Physical therapy, occupational therapy, speech therapy
   - other: Anything else

3. If CPT code is not explicitly listed, leave as null
4. If description has a CPT code embedded (e.g., "99213 - Office visit"), extract both
5. For amounts, parse carefully:
   - $1,234.56 → 1234.56
   - Remove any non-numeric characters except decimal point
   
6. If text is unclear or data is missing, use null (not empty strings)
7. Combine line items that are clearly the same service
8. Exclude non-charge items (headers, instructions, disclaimers)

Return ONLY the JSON. No preamble, no markdown backticks, no explanation.`;
  }
  
  /**
   * Extract JSON from Claude response
   * Handles responses with or without markdown formatting
   * 
   * @param {string} text - Claude response text
   * @returns {object|null} Parsed JSON or null
   */
  extractJSON(text) {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // Try extracting from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('[Parser] Failed to parse JSON from markdown block');
        }
      }
      
      // Try finding JSON object in text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e3) {
          console.error('[Parser] Failed to parse extracted JSON object');
        }
      }
      
      return null;
    }
  }
  
  /**
   * Validate parsed bill data
   * 
   * @param {object} data - Parsed bill data
   * @returns {object} Validation result
   */
  validateParsedData(data) {
    const warnings = [];
    
    // Check required fields
    if (!data.lineItems || !Array.isArray(data.lineItems)) {
      warnings.push('Missing or invalid lineItems array');
    }
    
    if (!data.provider?.name) {
      warnings.push('Missing provider name');
    }
    
    if (!data.totals?.totalBilled) {
      warnings.push('Missing total billed amount');
    }
    
    // Validate line items
    if (data.lineItems) {
      data.lineItems.forEach((item, index) => {
        if (!item.description) {
          warnings.push(`Line item ${index + 1}: Missing description`);
        }
        
        if (item.billedAmount === undefined || item.billedAmount === null) {
          warnings.push(`Line item ${index + 1}: Missing billed amount`);
        }
        
        if (item.billedAmount && item.billedAmount < 0) {
          warnings.push(`Line item ${index + 1}: Negative amount`);
        }
        
        if (item.cptCode && !/^\d{5}$/.test(item.cptCode)) {
          warnings.push(`Line item ${index + 1}: Invalid CPT code format`);
        }
        
        // Check for PHI leakage
        if (this.containsPotentialPHI(item.description)) {
          warnings.push(`Line item ${index + 1}: Description may contain PHI`);
        }
      });
    }
    
    // Validate totals match
    if (data.lineItems && data.totals?.totalBilled) {
      const sum = data.lineItems.reduce((total, item) => 
        total + (item.billedAmount * (item.quantity || 1)), 0
      );
      
      const difference = Math.abs(sum - data.totals.totalBilled);
      
      if (difference > 1) { // Allow $1 rounding difference
        warnings.push(`Line items sum ($${sum.toFixed(2)}) doesn't match total ($${data.totals.totalBilled.toFixed(2)})`);
      }
    }
    
    return {
      valid: warnings.length === 0,
      warnings: warnings
    };
  }
  
  /**
   * Check if text contains potential PHI
   * 
   * @param {string} text - Text to check
   * @returns {boolean} True if potential PHI detected
   */
  containsPotentialPHI(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for common patient identifiers
    const phiIndicators = [
      /patient name:/i,
      /name: [A-Z][a-z]+ [A-Z][a-z]+/,
      /dob:/i,
      /date of birth:/i,
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /mr#/i,
      /medical record/i,
      /chart number/i
    ];
    
    return phiIndicators.some(pattern => pattern.test(text));
  }
  
  /**
   * Categorize service based on description
   * Fallback when Claude doesn't categorize
   * 
   * @param {string} description - Service description
   * @param {string} cptCode - CPT code (optional)
   * @returns {string} Category
   */
  categorizeService(description, cptCode = null) {
    const desc = description.toLowerCase();
    
    // Use CPT code ranges if available
    if (cptCode) {
      const code = parseInt(cptCode);
      if (code >= 80047 && code <= 89398) return 'lab';
      if (code >= 70000 && code <= 79999) return 'imaging';
      if (code >= 99201 && code <= 99499) return 'office_visit';
      if (code >= 97000 && code <= 97799) return 'therapy';
    }
    
    // Use keywords
    if (/(blood|lab|test|panel|cbc|urinalysis|culture)/i.test(desc)) {
      return 'lab';
    }
    
    if (/(x-ray|ct|mri|ultrasound|scan|imaging|radiology)/i.test(desc)) {
      return 'imaging';
    }
    
    if (/(office visit|consultation|exam|evaluation|checkup)/i.test(desc)) {
      return 'office_visit';
    }
    
    if (/(surgery|surgical|operation)/i.test(desc)) {
      return 'surgery';
    }
    
    if (/(emergency|er visit|urgent care)/i.test(desc)) {
      return 'emergency';
    }
    
    if (/(therapy|rehabilitation|pt|ot)/i.test(desc)) {
      return 'therapy';
    }
    
    if (/(injection|infusion|medication|drug|prescription)/i.test(desc)) {
      return 'medication';
    }
    
    if (/(biopsy|procedure)/i.test(desc)) {
      return 'procedure';
    }
    
    return 'other';
  }
  
  /**
   * Parse bill with retry logic
   * Retries if parsing fails
   * 
   * @param {string} ocrText - OCR text
   * @param {object} patterns - Pre-extracted patterns
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<object>} Parsing result
   */
  async parseBillWithRetry(ocrText, patterns = {}, maxRetries = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Parser] Parse attempt ${attempt}/${maxRetries}`);
        
        const result = await this.parseBill(ocrText, patterns);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[Parser] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        lastError = error.message;
        console.error(`[Parser] Attempt ${attempt} failed:`, error);
      }
    }
    
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`
    };
  }
}

// Singleton instance
let parsingServiceInstance = null;

/**
 * Get bill parsing service instance
 * 
 * @returns {BillParsingService} Parsing service singleton
 */
function getBillParsingService() {
  if (!parsingServiceInstance) {
    parsingServiceInstance = new BillParsingService();
  }
  return parsingServiceInstance;
}

module.exports = {
  BillParsingService,
  getBillParsingService
};
