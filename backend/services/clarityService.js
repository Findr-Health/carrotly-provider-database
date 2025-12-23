/**
 * Healthcare Clarity Service - Enhanced with P0 Improvements
 * Findr Health - Document Analysis Engine
 * 
 * P0 IMPROVEMENTS IMPLEMENTED:
 * 1. Confidence Scoring - Shows users when we're uncertain
 * 2. Math Validation - Verifies totals add up correctly
 * 3. Unknown Code Handling - Honest about codes not in database
 * 4. Tiered Output - Summary → Details → Deep Dive
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load knowledge base
let KNOWLEDGE_BASE = {};
let CPT_CODES = { codes: {} };
let HCPCS_CODES = { codes: {} };
let ICD10_CODES = { codes: {} };

// Try to load knowledge bases (graceful failure if not present)
try {
  KNOWLEDGE_BASE = require('../data/clarityKnowledgeBase.json');
} catch (e) { console.log('Knowledge base not loaded'); }

try {
  CPT_CODES = require('../data/cptCodes.json');
} catch (e) { console.log('CPT codes not loaded'); }

try {
  HCPCS_CODES = require('../data/hcpcsCodes.json');
} catch (e) { console.log('HCPCS codes not loaded'); }

try {
  ICD10_CODES = require('../data/icd10Codes.json');
} catch (e) { console.log('ICD10 codes not loaded'); }

/**
 * Main analysis function - orchestrates the two-stage process
 */
async function analyzeDocument(documentBase64, mimeType, userQuestion = null) {
  const startTime = Date.now();
  
  try {
    // Stage 0: Document Classification
    const classification = await classifyDocument(documentBase64, mimeType);
    
    if (!classification.isHealthcare) {
      return {
        success: true,
        isHealthcare: false,
        documentType: classification.detectedType,
        message: classification.message,
        suggestedAction: classification.suggestedAction,
        confidence: {
          overall: classification.confidence,
          level: classification.confidence > 0.8 ? 'HIGH' : 'MODERATE',
          classification: classification.confidence
        },
        processingTime: Date.now() - startTime
      };
    }
    
    // Stage 1: Extraction
    const extraction = await extractDocument(documentBase64, mimeType, classification.documentType);
    
    // P0: Math Validation
    const mathValidation = validateMath(extraction);
    
    // P0: Code Verification - check which codes we know vs don't know
    const codeVerification = verifyCodesAgainstDatabase(extraction);
    
    // Stage 2: Analysis & Recommendations
    const analysis = await analyzeExtraction(extraction, userQuestion, codeVerification);
    
    // P0: Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(
      classification.confidence,
      extraction.confidence,
      analysis.confidence,
      mathValidation,
      codeVerification
    );
    
    // Enhance with actionable items
    const actionableOutput = enhanceWithActions(analysis, extraction);
    
    // P0: Add tiered output structure
    const tieredOutput = createTieredOutput(actionableOutput, extraction, mathValidation, codeVerification);
    
    return {
      success: true,
      isHealthcare: true,
      documentType: classification.documentType,
      extraction: extraction,
      analysis: tieredOutput,
      validation: {
        math: mathValidation,
        codes: codeVerification
      },
      confidence: {
        overall: overallConfidence.score,
        level: overallConfidence.level,
        factors: overallConfidence.factors,
        warnings: overallConfidence.warnings
      },
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Clarity analysis error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * P0: Calculate overall confidence score with detailed breakdown
 */
function calculateOverallConfidence(classificationConf, extractionConf, analysisConf, mathValidation, codeVerification) {
  const factors = [];
  const warnings = [];
  
  // Factor 1: Classification confidence
  factors.push({
    name: 'Document Recognition',
    score: classificationConf || 0.5,
    weight: 0.15
  });
  
  // Factor 2: Extraction confidence
  factors.push({
    name: 'Data Extraction',
    score: extractionConf || 0.5,
    weight: 0.25
  });
  
  // Factor 3: Analysis confidence
  factors.push({
    name: 'Analysis Quality',
    score: analysisConf || 0.5,
    weight: 0.25
  });
  
  // Factor 4: Math validation
  const mathScore = mathValidation.valid ? 1.0 : 
    mathValidation.issues.length === 1 ? 0.7 : 0.4;
  factors.push({
    name: 'Math Verification',
    score: mathScore,
    weight: 0.20
  });
  if (!mathValidation.valid) {
    warnings.push({
      type: 'MATH_ISSUE',
      message: `Found ${mathValidation.issues.length} calculation discrepancy(ies)`,
      details: mathValidation.issues
    });
  }
  
  // Factor 5: Code coverage
  const totalCodes = Math.max(codeVerification.summary.totalCodes, 1);
  const knownCodesRatio = codeVerification.summary.knownCodes / totalCodes;
  factors.push({
    name: 'Code Recognition',
    score: knownCodesRatio,
    weight: 0.15
  });
  if (codeVerification.summary.unknownCodes > 0) {
    warnings.push({
      type: 'UNKNOWN_CODES',
      message: `${codeVerification.summary.unknownCodes} code(s) not in our database`,
      details: codeVerification.unknown
    });
  }
  
  // Calculate weighted score
  const weightedScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
  
  // Determine confidence level
  let level;
  if (weightedScore >= 0.85) level = 'HIGH';
  else if (weightedScore >= 0.70) level = 'GOOD';
  else if (weightedScore >= 0.50) level = 'MODERATE';
  else level = 'LOW';
  
  return {
    score: Math.round(weightedScore * 100) / 100,
    level,
    factors,
    warnings
  };
}

/**
 * P0: Math Validation - verify totals add up
 */
function validateMath(extraction) {
  const issues = [];
  
  if (!extraction || !extraction.lineItems) {
    return { valid: true, issues: [], checks: [] };
  }
  
  const checks = [];
  
  // Check 1: Line items sum to total
  if (extraction.lineItems && extraction.totals) {
    const lineItemSum = extraction.lineItems.reduce((sum, item) => {
      const amount = item.charge || item.billed || item.chargedAmount || 0;
      return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
    }, 0);
    
    const totalCharged = extraction.totals.totalCharges || 
                         extraction.totals.billed || 
                         extraction.totals.totalBilled || 0;
    
    const difference = Math.abs(lineItemSum - totalCharged);
    
    checks.push({
      name: 'Line Items Sum',
      calculated: lineItemSum,
      stated: totalCharged,
      difference: difference,
      passed: difference <= 1
    });
    
    if (difference > 1) {
      issues.push({
        type: 'LINE_ITEM_SUM_MISMATCH',
        severity: difference > 100 ? 'HIGH' : 'MEDIUM',
        message: `Line items total $${lineItemSum.toFixed(2)} but document shows $${totalCharged.toFixed(2)}`,
        difference: difference,
        suggestion: 'There may be missing line items or a calculation error on the document'
      });
    }
  }
  
  // Check 2: EOB math
  if (extraction.documentType === 'EOB' && extraction.totals) {
    const allowed = extraction.totals.allowed || extraction.totals.allowedAmount || 0;
    const insurancePaid = extraction.totals.insurancePaid || 0;
    const patientResp = extraction.totals.patientResponsibility || extraction.totals.patientOwes || 0;
    
    const expectedPatientResp = allowed - insurancePaid;
    const difference = Math.abs(expectedPatientResp - patientResp);
    
    checks.push({
      name: 'EOB Patient Responsibility',
      formula: 'Allowed - Insurance Paid ≈ Patient Owes',
      calculated: expectedPatientResp,
      stated: patientResp,
      difference: difference,
      passed: difference <= 5
    });
    
    if (difference > 5 && difference > patientResp * 0.1) {
      issues.push({
        type: 'EOB_MATH_VARIANCE',
        severity: 'LOW',
        message: `EOB math doesn't quite add up: Allowed ($${allowed}) - Paid ($${insurancePaid}) = $${expectedPatientResp.toFixed(2)}, but patient responsibility shows $${patientResp.toFixed(2)}`,
        difference: difference,
        suggestion: 'This is usually due to deductibles, copays, or coinsurance breakdowns. Not necessarily an error.'
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    checks
  };
}

/**
 * P0: Verify codes against our database, identify unknowns
 */
function verifyCodesAgainstDatabase(extraction) {
  const known = [];
  const unknown = [];
  const inferred = [];
  
  if (!extraction || !extraction.lineItems) {
    return {
      known: [],
      unknown: [],
      inferred: [],
      summary: { totalCodes: 0, knownCodes: 0, unknownCodes: 0, inferredCodes: 0 }
    };
  }
  
  extraction.lineItems.forEach((item, index) => {
    const code = item.code || item.cptCode || item.hcpcsCode;
    if (!code || code === 'OTHER' || code === 'UNKNOWN') return;
    
    // Check CPT codes
    const cptMatch = CPT_CODES?.codes?.[code];
    if (cptMatch) {
      known.push({
        lineNumber: index + 1,
        code: code,
        type: 'CPT',
        description: item.description,
        databaseDefinition: cptMatch.description,
        plainLanguage: cptMatch.plainLanguage,
        typicalRange: cptMatch.typicalPriceRange
      });
      return;
    }
    
    // Check HCPCS codes
    const hcpcsMatch = HCPCS_CODES?.codes?.[code];
    if (hcpcsMatch) {
      known.push({
        lineNumber: index + 1,
        code: code,
        type: 'HCPCS',
        description: item.description,
        databaseDefinition: hcpcsMatch.description,
        plainLanguage: hcpcsMatch.plainLanguage
      });
      return;
    }
    
    // Code not in our database
    unknown.push({
      lineNumber: index + 1,
      code: code,
      description: item.description,
      documentDescription: item.description,
      inferredMeaning: inferCodeMeaning(code, item.description),
      confidence: 'LOW',
      note: 'This code is not in our database. The explanation is based on the document description and may not be fully accurate.'
    });
  });
  
  return {
    known,
    unknown,
    inferred,
    summary: {
      totalCodes: known.length + unknown.length,
      knownCodes: known.length,
      unknownCodes: unknown.length,
      inferredCodes: inferred.length
    }
  };
}

/**
 * Attempt to infer meaning of unknown codes from description
 */
function inferCodeMeaning(code, description) {
  if (!description) return 'Unable to determine - no description provided';
  
  const desc = description.toLowerCase();
  
  if (desc.includes('visit') || desc.includes('office') || desc.includes('consult')) {
    return 'This appears to be an office or consultation visit';
  }
  if (desc.includes('lab') || desc.includes('blood') || desc.includes('test')) {
    return 'This appears to be a laboratory test';
  }
  if (desc.includes('xray') || desc.includes('x-ray') || desc.includes('imaging') || desc.includes('ct') || desc.includes('mri')) {
    return 'This appears to be an imaging/radiology service';
  }
  if (desc.includes('injection') || desc.includes('infusion') || desc.includes('iv')) {
    return 'This appears to be an injection or infusion service';
  }
  if (desc.includes('surgery') || desc.includes('procedure') || desc.includes('repair')) {
    return 'This appears to be a surgical or procedural service';
  }
  if (desc.includes('therapy') || desc.includes('treatment')) {
    return 'This appears to be a therapy or treatment service';
  }
  if (desc.includes('supply') || desc.includes('supplies') || desc.includes('equipment')) {
    return 'This appears to be medical supplies or equipment';
  }
  
  return `Based on the description "${description}", this appears to be a healthcare service, but we cannot verify the specific meaning of code ${code}`;
}

/**
 * P0: Create tiered output structure
 */
function createTieredOutput(analysis, extraction, mathValidation, codeVerification) {
  return {
    // TIER 1: Quick Summary (always visible)
    tier1_summary: {
      headline: analysis.summary?.headline || 'Document Analysis Complete',
      amountDue: formatAmount(analysis.summary?.amountDue || extraction.totals?.amountDue || extraction.totals?.patientResponsibility),
      keyTakeaway: analysis.summary?.keyTakeaway,
      quickAnswer: analysis.summary?.quickAnswer,
      confidenceLevel: analysis.confidenceLevel,
      alertCount: countAlerts(analysis, mathValidation, codeVerification),
      hasWarnings: (mathValidation && !mathValidation.valid) || (codeVerification && codeVerification.summary.unknownCodes > 0)
    },
    
    // TIER 2: Key Details (expandable)
    tier2_details: {
      whatThisIs: analysis.explanation?.whatThisIs,
      whatHappened: analysis.explanation?.whatHappened,
      financialSummary: analysis.explanation?.financialSummary,
      observations: prioritizeObservations(analysis.observations),
      topActions: (analysis.actionItems || []).slice(0, 3),
      mathIssues: mathValidation?.issues || [],
      unknownCodes: codeVerification?.unknown || []
    },
    
    // TIER 3: Deep Dive (on request)
    tier3_deepDive: {
      allLineItems: analysis.lineItemExplanations,
      allActions: analysis.actionItems,
      allQuestions: analysis.questionsToAsk,
      mathValidation: mathValidation,
      codeVerification: codeVerification,
      glossary: analysis.glossary,
      rawExtraction: extraction
    },
    
    // Keep original structure for compatibility
    summary: analysis.summary,
    explanation: analysis.explanation,
    lineItemExplanations: analysis.lineItemExplanations,
    observations: analysis.observations,
    actionItems: analysis.actionItems,
    questionsToAsk: analysis.questionsToAsk,
    reassurance: analysis.reassurance,
    glossary: analysis.glossary,
    confidence: analysis.confidence
  };
}

/**
 * Format amount for display
 */
function formatAmount(amount) {
  if (amount === null || amount === undefined) return null;
  if (typeof amount === 'string' && amount.startsWith('$')) return amount;
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return amount;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Count alerts for summary badge
 */
function countAlerts(analysis, mathValidation, codeVerification) {
  let count = 0;
  
  if (analysis.observations) {
    count += analysis.observations.filter(o => 
      o.type === 'ACTION_NEEDED' || o.type === 'REVIEW'
    ).length;
  }
  
  if (mathValidation && !mathValidation.valid) {
    count += mathValidation.issues.filter(i => i.severity === 'HIGH').length;
  }
  
  return count;
}

/**
 * Prioritize observations by importance
 */
function prioritizeObservations(observations) {
  if (!observations) return [];
  
  const priority = { 'ACTION_NEEDED': 1, 'REVIEW': 2, 'INFO': 3 };
  
  return [...observations].sort((a, b) => {
    return (priority[a.type] || 99) - (priority[b.type] || 99);
  });
}

/**
 * Stage 0: Document Classification
 */
async function classifyDocument(documentBase64, mimeType) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: documentBase64,
            },
          },
          {
            type: 'text',
            text: `Classify this document. Return ONLY valid JSON:

{
  "isHealthcare": true/false,
  "documentType": "BILL" | "EOB" | "CLINICAL" | "INSURANCE_CARD" | "OTHER_HEALTHCARE" | "NON_HEALTHCARE",
  "detectedType": "string describing what you see (e.g., 'auto repair invoice', 'restaurant receipt')",
  "confidence": 0.0-1.0,
  "identifiedEntity": "name of company/provider on document if visible",
  "contactInfo": "any phone number or website visible on document",
  "message": "brief description for user"
}

Healthcare documents include: medical bills, hospital statements, EOBs, insurance cards, clinical notes, lab results, prescription info.
Non-healthcare: anything else (retail receipts, utility bills, auto repair, etc.)`
          },
        ],
      },
    ],
  });

  try {
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);
    
    if (!result.isHealthcare) {
      result.suggestedAction = result.contactInfo 
        ? `This appears to be a ${result.detectedType}. For questions about this document, contact ${result.identifiedEntity || 'the company'} at ${result.contactInfo}.`
        : `This appears to be a ${result.detectedType}, not a healthcare document. I'm designed to help with medical bills, insurance statements, and clinical records. For help with this document, please contact the issuing company directly.`;
    }
    
    return result;
  } catch (e) {
    return {
      isHealthcare: true,
      documentType: 'UNKNOWN',
      confidence: 0.5,
      message: 'Could not confidently classify document, attempting analysis.'
    };
  }
}

/**
 * Stage 1: Document Extraction
 */
async function extractDocument(documentBase64, mimeType, documentType) {
  const extractionPrompt = getExtractionPrompt(documentType);
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: documentBase64,
            },
          },
          {
            type: 'text',
            text: extractionPrompt
          },
        ],
      },
    ],
  });

  try {
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    const extracted = JSON.parse(jsonMatch[0]);
    return extracted;
  } catch (e) {
    return {
      error: 'Could not extract document data',
      confidence: 0,
      rawResponse: response.content[0].text
    };
  }
}

/**
 * Get extraction prompt based on document type
 */
function getExtractionPrompt(documentType) {
  const baseInstruction = `Extract all information from this document. Return ONLY valid JSON.
Be precise with numbers and codes. If something is unclear, set confidence lower.
IMPORTANT: Extract ALL billing codes exactly as shown (CPT, HCPCS, revenue codes, etc.)`;

  if (documentType === 'EOB') {
    return `${baseInstruction}

Extract into this structure:
{
  "documentType": "EOB",
  "confidence": 0.0-1.0,
  "insurer": { "name": "", "phone": "", "website": "", "claimsAddress": "" },
  "member": { "name": "", "memberId": "", "groupNumber": "" },
  "claim": { "claimNumber": "", "dateProcessed": "" },
  "provider": { "name": "", "npi": "", "phone": "" },
  "serviceDate": "",
  "lineItems": [
    {
      "code": "",
      "description": "",
      "billed": 0,
      "allowed": 0,
      "insurancePaid": 0,
      "patientOwes": 0,
      "denialCode": "",
      "denialReason": ""
    }
  ],
  "totals": {
    "billed": 0,
    "allowed": 0,
    "insurancePaid": 0,
    "patientResponsibility": 0
  },
  "costSharing": {
    "deductibleApplied": 0,
    "coinsurance": 0,
    "copay": 0
  },
  "networkStatus": "IN_NETWORK" | "OUT_OF_NETWORK" | "UNKNOWN",
  "remarks": []
}`;
  }

  if (documentType === 'BILL') {
    return `${baseInstruction}

Extract into this structure:
{
  "documentType": "BILL",
  "confidence": 0.0-1.0,
  "provider": { 
    "name": "", 
    "address": "", 
    "phone": "", 
    "billingPhone": "",
    "website": "",
    "taxId": "",
    "npi": ""
  },
  "patient": { "name": "", "accountNumber": "", "dateOfBirth": "" },
  "statementDate": "",
  "serviceDate": "",
  "lineItems": [
    {
      "date": "",
      "code": "",
      "revenueCode": "",
      "description": "",
      "quantity": 1,
      "charge": 0
    }
  ],
  "totals": {
    "totalCharges": 0,
    "insurancePayments": 0,
    "adjustments": 0,
    "priorPayments": 0,
    "amountDue": 0
  },
  "paymentInfo": {
    "dueDate": "",
    "minimumPayment": 0,
    "paymentPlanAvailable": null,
    "paymentMethods": ""
  },
  "importantNotices": []
}`;
  }

  return `${baseInstruction}

Extract into this structure:
{
  "documentType": "HEALTHCARE",
  "confidence": 0.0-1.0,
  "provider": { "name": "", "phone": "", "address": "" },
  "patient": { "name": "" },
  "date": "",
  "content": "summary of document content",
  "keyItems": [],
  "amounts": { "total": 0, "amountDue": 0 },
  "contactInfo": { "phone": "", "website": "" }
}`;
}

/**
 * Stage 2: Analysis & Recommendations
 */
async function analyzeExtraction(extraction, userQuestion, codeVerification) {
  const analysisPrompt = buildAnalysisPrompt(extraction, userQuestion, codeVerification);
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: getAnalysisSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: analysisPrompt
      },
    ],
  });

  try {
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return {
      error: 'Could not analyze document',
      confidence: 0,
      rawResponse: response.content[0].text
    };
  }
}

/**
 * System prompt for analysis stage
 */
function getAnalysisSystemPrompt() {
  return `You are a healthcare billing expert helping consumers understand their documents. 

YOUR PERSONALITY:
- Warm, reassuring, and empowering
- You explain things simply without being condescending
- You're HONEST about what you can and cannot determine
- You provide SPECIFIC, ACTIONABLE advice

CONFIDENCE RULES (CRITICAL):
- If you're not sure about something, SAY SO
- Use phrases like "This appears to be..." or "Based on the description, this seems to be..."
- Never fabricate code definitions - if a code isn't familiar, say "I don't have this code in my database"
- Rate your confidence on each line item explanation

CRITICAL RULES:
1. NEVER say "contact your insurance for more information" without providing the specific phone number
2. ALWAYS provide specific questions to ask, not just "ask questions"
3. If the document has phone numbers, USE THEM in your recommendations
4. Be honest when something looks unusual but don't accuse anyone of wrongdoing
5. Prioritize the user's most likely concern first
6. For unknown codes, be explicit: "Code XXXXX is not in my database. Based on the description '[description]', this appears to be [inference]."

OUTPUT REQUIREMENTS:
- Keep summaries under 50 words
- Action items must be specific and completable
- Include actual phone numbers when available
- Include a confidence score (0.0-1.0) for your analysis`;
}

/**
 * Build analysis prompt with user question context and code verification
 */
function buildAnalysisPrompt(extraction, userQuestion, codeVerification) {
  const questionContext = userQuestion 
    ? `\n\nUSER'S SPECIFIC QUESTION: "${userQuestion}"\nPrioritize answering this question directly.`
    : '';

  const presetQuestionMap = {
    'what_does_this_mean': 'Focus on explaining what this document is and what it\'s telling the patient.',
    'what_do_i_owe': 'Focus on the exact amount owed and payment options.',
    'is_price_correct': 'Focus on whether charges seem reasonable and what questions to ask.',
    'explain_this': 'Provide a comprehensive but simple explanation of everything on this document.'
  };

  const questionGuidance = userQuestion && presetQuestionMap[userQuestion]
    ? `\n\nUSER SELECTED: "${userQuestion}"\n${presetQuestionMap[userQuestion]}`
    : questionContext;

  let codeContext = '';
  if (codeVerification && codeVerification.unknown.length > 0) {
    codeContext = `\n\nIMPORTANT - UNKNOWN CODES:
The following codes are NOT in our verified database. Be explicit that these explanations are inferred:
${codeVerification.unknown.map(c => `- ${c.code}: "${c.description}" (inferred: ${c.inferredMeaning})`).join('\n')}

For these codes, clearly state: "Code [code] is not in our database. Based on the description, this appears to be [inference]."\n`;
  }

  return `Analyze this healthcare document extraction and provide helpful guidance.

EXTRACTED DATA:
${JSON.stringify(extraction, null, 2)}
${codeContext}
${questionGuidance}

Return JSON with this structure:
{
  "confidence": 0.0-1.0,
  "confidenceNotes": "Brief explanation of confidence level",
  "summary": {
    "headline": "One line summary (under 15 words)",
    "quickAnswer": "Direct answer to user's question if they asked one",
    "amountDue": "The bottom line amount if applicable (format as $X,XXX.XX)",
    "keyTakeaway": "The single most important thing to know"
  },
  "explanation": {
    "whatThisIs": "1-2 sentences explaining document type",
    "whatHappened": "Brief narrative of the healthcare event",
    "financialSummary": "Clear breakdown of money (charged, covered, owed)"
  },
  "lineItemExplanations": [
    {
      "code": "",
      "description": "",
      "plainLanguage": "What this actually is in simple terms",
      "amount": 0,
      "patientPays": 0,
      "confidence": 0.0-1.0,
      "isVerified": true/false,
      "notes": "Any relevant context or uncertainty"
    }
  ],
  "observations": [
    {
      "type": "INFO" | "REVIEW" | "ACTION_NEEDED",
      "title": "Short title",
      "detail": "What we noticed",
      "confidence": 0.0-1.0,
      "suggestedAction": "Specific action if applicable"
    }
  ],
  "actionItems": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "detail": "Exactly how to do it",
      "contactInfo": "Phone/website if applicable",
      "scriptToUse": "Exact words to say if calling",
      "deadline": "When to do this by, if relevant"
    }
  ],
  "questionsToAsk": [
    {
      "askWho": "Provider billing" | "Insurance" | "Doctor's office",
      "phone": "Number to call",
      "question": "Exact question to ask",
      "whyAsk": "Why this matters"
    }
  ],
  "reassurance": "A warm, reassuring message about their situation",
  "glossary": [
    { "term": "", "definition": "" }
  ]
}`;
}

/**
 * Enhance analysis with concrete actions
 */
function enhanceWithActions(analysis, extraction) {
  if (analysis.actionItems) {
    analysis.actionItems = analysis.actionItems.map(item => {
      if (!item.contactInfo) {
        if (item.action.toLowerCase().includes('insurance') || item.action.toLowerCase().includes('insurer')) {
          item.contactInfo = extraction.insurer?.phone || extraction.insurer?.website || null;
        } else if (item.action.toLowerCase().includes('provider') || item.action.toLowerCase().includes('hospital') || item.action.toLowerCase().includes('billing')) {
          item.contactInfo = extraction.provider?.billingPhone || extraction.provider?.phone || null;
        }
      }
      return item;
    });
  }
  
  if (analysis.questionsToAsk) {
    analysis.questionsToAsk = analysis.questionsToAsk.map(q => {
      if (!q.phone) {
        if (q.askWho?.toLowerCase().includes('insurance')) {
          q.phone = extraction.insurer?.phone || 'See your insurance card';
        } else {
          q.phone = extraction.provider?.billingPhone || extraction.provider?.phone || 'See your statement';
        }
      }
      return q;
    });
  }
  
  if (!analysis.actionItems || analysis.actionItems.length === 0) {
    analysis.actionItems = [{
      priority: 1,
      action: 'Review this document',
      detail: 'Keep this document for your records. If you have questions, contact information is below.',
      contactInfo: extraction.provider?.phone || extraction.insurer?.phone || null
    }];
  }
  
  return analysis;
}

/**
 * Get suggested providers based on analysis
 */
async function getSuggestedProviders(analysis, userLocation, db) {
  const suggestions = [];
  
  if (analysis.observations?.some(o => o.type === 'REVIEW' || o.type === 'ACTION_NEEDED')) {
    try {
      const advocates = await db.collection('providers').find({
        $or: [
          { 'services.name': { $regex: /billing|advocacy|patient rights/i } },
          { 'specialties': { $regex: /patient advocate/i } }
        ],
        status: 'approved'
      }).limit(3).toArray();
      
      if (advocates.length > 0) {
        suggestions.push({
          category: 'Patient Advocates',
          reason: 'Can help you review and negotiate medical bills',
          providers: advocates.map(p => ({
            id: p._id,
            name: p.practiceName,
            specialty: p.specialty,
            phone: p.contactInfo?.phone
          }))
        });
      }
    } catch (e) {
      console.error('Error fetching suggested providers:', e);
    }
  }
  
  return suggestions;
}

module.exports = {
  analyzeDocument,
  classifyDocument,
  extractDocument,
  analyzeExtraction,
  validateMath,
  verifyCodesAgainstDatabase,
  calculateOverallConfidence,
  getSuggestedProviders
};
