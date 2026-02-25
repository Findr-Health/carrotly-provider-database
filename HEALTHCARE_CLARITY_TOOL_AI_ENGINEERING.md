# Healthcare Clarity Tool - AI Engineering Specification

**Version:** 1.0  
**Date:** December 22, 2025  
**AI Provider:** Anthropic Claude  
**Status:** Ready for Development

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [JSON Schemas](#json-schemas)
3. [Stage 1: Extraction Prompts](#stage-1-extraction-prompts)
4. [Stage 2: Reasoning Prompts](#stage-2-reasoning-prompts)
5. [Knowledge Base Content](#knowledge-base-content)
6. [API Contract for Frontend](#api-contract-for-frontend)
7. [Test Harness](#test-harness)
8. [Error Handling](#error-handling)
9. [Implementation Notes](#implementation-notes)

---

## Architecture Overview

### Two-Stage Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  STAGE 1: EXTRACTION                    STAGE 2: REASONING              │
│  ────────────────────                   ────────────────────            │
│                                                                         │
│  ┌─────────────┐                        ┌─────────────┐                │
│  │  Document   │                        │  Extracted  │                │
│  │  (PDF/IMG)  │                        │    JSON     │                │
│  └──────┬──────┘                        └──────┬──────┘                │
│         │                                      │                        │
│         ▼                                      ▼                        │
│  ┌─────────────┐                        ┌─────────────┐                │
│  │  Claude     │                        │  Claude     │                │
│  │  Vision +   │                        │  + Knowledge│                │
│  │  Extraction │                        │  Base       │                │
│  │  Prompt     │                        │  + Reasoning│                │
│  └──────┬──────┘                        │  Prompt     │                │
│         │                               └──────┬──────┘                │
│         ▼                                      │                        │
│  ┌─────────────┐                               ▼                        │
│  │  Structured │                        ┌─────────────┐                │
│  │  JSON       │ ─────────────────────▶ │  Final      │                │
│  │  Output     │                        │  Response   │                │
│  └─────────────┘                        │  to User    │                │
│                                         └─────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Two Stages?

| Benefit | Explanation |
|---------|-------------|
| **Accuracy** | Separating extraction from reasoning reduces hallucination |
| **Debuggability** | Can inspect extraction output before reasoning |
| **Flexibility** | Can enhance either stage independently |
| **Consistency** | Structured intermediate format ensures reliable downstream processing |

---

## JSON Schemas

### Stage 1 Output: Extraction Schema

#### Billing Document Extraction

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BillingDocumentExtraction",
  "type": "object",
  "required": ["documentType", "extractionConfidence", "serviceDate", "lineItems"],
  "properties": {
    "documentType": {
      "type": "string",
      "enum": ["EOB", "ITEMIZED_BILL", "STATEMENT", "INVOICE", "UNKNOWN"],
      "description": "Type of billing document detected"
    },
    "extractionConfidence": {
      "type": "string",
      "enum": ["HIGH", "MEDIUM", "LOW"],
      "description": "Overall confidence in extraction accuracy"
    },
    "provider": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "type": "string" },
        "npi": { "type": "string" },
        "taxId": { "type": "string" },
        "phone": { "type": "string" }
      }
    },
    "patient": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "memberId": { "type": "string" },
        "groupNumber": { "type": "string" },
        "accountNumber": { "type": "string" }
      }
    },
    "insurance": {
      "type": "object",
      "properties": {
        "payerName": { "type": "string" },
        "planName": { "type": "string" },
        "claimNumber": { "type": "string" }
      }
    },
    "serviceDate": {
      "type": "string",
      "format": "date",
      "description": "Primary date of service (YYYY-MM-DD)"
    },
    "serviceDateRange": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "format": "date" },
        "end": { "type": "string", "format": "date" }
      }
    },
    "lineItems": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["description"],
        "properties": {
          "lineNumber": { "type": "integer" },
          "serviceDate": { "type": "string", "format": "date" },
          "cptCode": { "type": "string" },
          "hcpcsCode": { "type": "string" },
          "icd10Codes": { 
            "type": "array",
            "items": { "type": "string" }
          },
          "revenueCode": { "type": "string" },
          "description": { "type": "string" },
          "modifier": { "type": "string" },
          "quantity": { "type": "number" },
          "chargedAmount": { "type": "number" },
          "allowedAmount": { "type": "number" },
          "adjustmentAmount": { "type": "number" },
          "insurancePaid": { "type": "number" },
          "patientResponsibility": { "type": "number" },
          "denialCode": { "type": "string" },
          "denialReason": { "type": "string" }
        }
      }
    },
    "totals": {
      "type": "object",
      "properties": {
        "totalCharged": { "type": "number" },
        "totalAllowed": { "type": "number" },
        "totalAdjustment": { "type": "number" },
        "totalInsurancePaid": { "type": "number" },
        "totalPatientResponsibility": { "type": "number" },
        "amountDue": { "type": "number" },
        "dueDate": { "type": "string", "format": "date" }
      }
    },
    "paymentInfo": {
      "type": "object",
      "properties": {
        "paymentDueDate": { "type": "string", "format": "date" },
        "minimumPayment": { "type": "number" },
        "paymentPlanAvailable": { "type": "boolean" },
        "paymentMethods": { "type": "string" }
      }
    },
    "remarks": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Any notes, remarks, or messages on the document"
    },
    "rawTextExcerpts": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Key text that couldn't be structured but may be relevant"
    }
  }
}
```

#### Clinical Document Extraction

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ClinicalDocumentExtraction",
  "type": "object",
  "required": ["documentType", "extractionConfidence", "visitDate"],
  "properties": {
    "documentType": {
      "type": "string",
      "enum": ["VISIT_SUMMARY", "LAB_RESULTS", "IMAGING_REPORT", "PROCEDURE_NOTE", "DISCHARGE_SUMMARY", "REFERRAL", "PRESCRIPTION", "UNKNOWN"],
      "description": "Type of clinical document detected"
    },
    "extractionConfidence": {
      "type": "string",
      "enum": ["HIGH", "MEDIUM", "LOW"]
    },
    "facility": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "type": "string" },
        "department": { "type": "string" },
        "phone": { "type": "string" }
      }
    },
    "patient": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "dateOfBirth": { "type": "string", "format": "date" },
        "mrn": { "type": "string" }
      }
    },
    "providers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "role": { "type": "string" },
          "specialty": { "type": "string" },
          "npi": { "type": "string" }
        }
      }
    },
    "visitDate": {
      "type": "string",
      "format": "date"
    },
    "visitType": {
      "type": "string",
      "description": "e.g., Office Visit, Emergency, Inpatient, Telehealth"
    },
    "chiefComplaint": {
      "type": "string",
      "description": "Primary reason for visit in patient's words"
    },
    "diagnoses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "codeType": { "type": "string", "enum": ["ICD10", "ICD9", "SNOMED", "OTHER"] },
          "description": { "type": "string" },
          "isPrimary": { "type": "boolean" }
        }
      }
    },
    "procedures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "codeType": { "type": "string" },
          "description": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "bodyPart": { "type": "string" },
          "findings": { "type": "string" }
        }
      }
    },
    "labResults": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "testName": { "type": "string" },
          "testCode": { "type": "string" },
          "value": { "type": "string" },
          "unit": { "type": "string" },
          "referenceRange": { "type": "string" },
          "flag": { "type": "string", "enum": ["NORMAL", "HIGH", "LOW", "CRITICAL", "ABNORMAL", ""] },
          "collectionDate": { "type": "string", "format": "date" }
        }
      }
    },
    "medications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "dosage": { "type": "string" },
          "frequency": { "type": "string" },
          "route": { "type": "string" },
          "quantity": { "type": "string" },
          "refills": { "type": "integer" },
          "prescribedDate": { "type": "string", "format": "date" },
          "isPrescribed": { "type": "boolean" },
          "isCurrent": { "type": "boolean" }
        }
      }
    },
    "vitalSigns": {
      "type": "object",
      "properties": {
        "bloodPressure": { "type": "string" },
        "heartRate": { "type": "string" },
        "temperature": { "type": "string" },
        "respiratoryRate": { "type": "string" },
        "oxygenSaturation": { "type": "string" },
        "weight": { "type": "string" },
        "height": { "type": "string" },
        "bmi": { "type": "string" }
      }
    },
    "assessment": {
      "type": "string",
      "description": "Provider's assessment/impression"
    },
    "plan": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Treatment plan items"
    },
    "followUp": {
      "type": "object",
      "properties": {
        "instructions": { "type": "string" },
        "timeframe": { "type": "string" },
        "referrals": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "specialty": { "type": "string" },
              "reason": { "type": "string" },
              "urgency": { "type": "string" }
            }
          }
        }
      }
    },
    "patientInstructions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "rawTextExcerpts": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

### Stage 2 Output: Reasoning Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ClarityToolResponse",
  "type": "object",
  "required": ["summary", "sections", "disclaimer"],
  "properties": {
    "analysisId": {
      "type": "string",
      "description": "Unique ID for this analysis (for support reference)"
    },
    "documentType": {
      "type": "string"
    },
    "analysisDate": {
      "type": "string",
      "format": "date-time"
    },
    "summary": {
      "type": "object",
      "required": ["headline", "plainLanguageSummary"],
      "properties": {
        "headline": {
          "type": "string",
          "description": "One-line summary, e.g., 'Office visit with lab work - $29.20 owed'"
        },
        "plainLanguageSummary": {
          "type": "string",
          "description": "2-3 sentence overview of the document"
        },
        "keyFacts": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Bullet points of most important facts"
        }
      }
    },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["sectionType", "title", "content"],
        "properties": {
          "sectionType": {
            "type": "string",
            "enum": ["CHARGES", "SERVICES", "DIAGNOSES", "MEDICATIONS", "LAB_RESULTS", "PROCEDURES", "FOLLOW_UP", "OBSERVATIONS", "QUESTIONS"]
          },
          "title": {
            "type": "string"
          },
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "item": { "type": "string" },
                "code": { "type": "string" },
                "explanation": { "type": "string" },
                "amounts": {
                  "type": "object",
                  "properties": {
                    "charged": { "type": "number" },
                    "allowed": { "type": "number" },
                    "insurancePaid": { "type": "number" },
                    "youOwe": { "type": "number" }
                  }
                },
                "flag": {
                  "type": "object",
                  "properties": {
                    "type": { "type": "string", "enum": ["INFO", "REVIEW", "QUESTION"] },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "observations": {
      "type": "array",
      "description": "Tier 2+: Patterns worth reviewing",
      "items": {
        "type": "object",
        "properties": {
          "observationType": {
            "type": "string",
            "enum": ["DUPLICATE_POSSIBLE", "PRICE_CONTEXT", "UNBUNDLING_POSSIBLE", "DATE_MISMATCH", "QUANTITY_NOTE", "GENERAL"]
          },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "suggestedQuestion": { "type": "string" },
          "relatedLineItems": {
            "type": "array",
            "items": { "type": "integer" }
          }
        }
      }
    },
    "suggestedQuestions": {
      "type": "array",
      "description": "Questions user might ask their provider",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "context": { "type": "string" },
          "askWho": { "type": "string", "enum": ["PROVIDER", "BILLING", "INSURANCE", "ANY"] }
        }
      }
    },
    "glossary": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "term": { "type": "string" },
          "definition": { "type": "string" }
        }
      }
    },
    "nextSteps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": { "type": "string" },
          "description": { "type": "string" },
          "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] }
        }
      }
    },
    "disclaimer": {
      "type": "object",
      "required": ["standard"],
      "properties": {
        "standard": {
          "type": "string",
          "default": "This analysis is for educational purposes only. Verify any concerns with your healthcare provider or insurance company. We do not provide medical or legal advice."
        },
        "specific": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Any analysis-specific caveats"
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "processingTime": { "type": "number" },
        "modelVersion": { "type": "string" },
        "extractionConfidence": { "type": "string" },
        "reasoningConfidence": { "type": "string" }
      }
    }
  }
}
```

---

## Stage 1: Extraction Prompts

### Billing Document Extraction Prompt

```markdown
# SYSTEM PROMPT - BILLING DOCUMENT EXTRACTION

You are a healthcare billing document parser. Your job is to extract structured data from medical bills, Explanations of Benefits (EOBs), and healthcare statements.

## YOUR ROLE
- Extract information accurately from the document
- Structure it according to the schema provided
- Flag uncertainty when text is unclear or ambiguous
- Do NOT interpret, analyze, or make judgments - only extract

## EXTRACTION RULES

1. **Be literal**: Extract exactly what you see. Don't infer missing information.

2. **Handle uncertainty**: If a field is:
   - Not present: omit it from output (don't include null)
   - Unclear/illegible: include with a note in rawTextExcerpts
   - Ambiguous: extract best interpretation, set confidence to MEDIUM or LOW

3. **Codes**: Extract codes exactly as shown (CPT, HCPCS, ICD-10, revenue codes)
   - CPT codes are typically 5 digits (e.g., 99214, 85025)
   - HCPCS codes start with a letter (e.g., J1234, G0001)
   - ICD-10 codes have letters and numbers (e.g., J06.9, M54.5)
   - Revenue codes are typically 3-4 digits (e.g., 0250, 0300)

4. **Money**: 
   - Extract as numbers without currency symbols
   - Negative amounts should be negative numbers
   - If shown as (100.00) or -$100.00, extract as -100.00

5. **Dates**: Convert to YYYY-MM-DD format when possible

6. **Line items**: Create a separate line item for each row in the charges section

## CONFIDENCE LEVELS

Set extractionConfidence based on:
- **HIGH**: Document is clear, all key fields readable, standard format
- **MEDIUM**: Some fields unclear, non-standard format, or partial information
- **LOW**: Poor image quality, significant portions illegible, or unusual format

## OUTPUT FORMAT

Return valid JSON matching the BillingDocumentExtraction schema. Do not include any text outside the JSON.

---

# USER MESSAGE

Please extract all billing information from the attached document. Return only valid JSON matching the specified schema.

[DOCUMENT ATTACHED]
```

### Clinical Document Extraction Prompt

```markdown
# SYSTEM PROMPT - CLINICAL DOCUMENT EXTRACTION

You are a clinical document parser. Your job is to extract structured data from medical records, visit summaries, lab results, and other clinical documentation.

## YOUR ROLE
- Extract information accurately from the document
- Structure it according to the schema provided
- Flag uncertainty when text is unclear or ambiguous
- Do NOT interpret clinical significance or provide medical opinions - only extract

## EXTRACTION RULES

1. **Be literal**: Extract exactly what you see. Don't infer diagnoses or interpret results.

2. **Medical codes**: Extract exactly as shown
   - ICD-10 diagnosis codes (e.g., J06.9, E11.9)
   - CPT procedure codes (e.g., 99214)
   - LOINC lab codes if present

3. **Lab results**: 
   - Extract value exactly as shown
   - Include units
   - Include reference range if provided
   - Set flag based on document's own flagging (H, L, abnormal, etc.)

4. **Medications**:
   - Extract full medication name including strength
   - Include dosage instructions exactly as written
   - Distinguish between prescribed (new) vs. current (ongoing)

5. **Provider notes**:
   - For assessment/plan sections, extract the actual text
   - Don't summarize or paraphrase clinical content

6. **Dates**: Convert to YYYY-MM-DD format when possible

## CONFIDENCE LEVELS

Set extractionConfidence based on:
- **HIGH**: Document is clear, typed/printed, standard format
- **MEDIUM**: Some handwriting, abbreviations, or partial information
- **LOW**: Heavily handwritten, poor quality, or significant portions unclear

## OUTPUT FORMAT

Return valid JSON matching the ClinicalDocumentExtraction schema. Do not include any text outside the JSON.

---

# USER MESSAGE

Please extract all clinical information from the attached document. Return only valid JSON matching the specified schema.

[DOCUMENT ATTACHED]
```

---

## Stage 2: Reasoning Prompts

### Billing Document Reasoning Prompt

```markdown
# SYSTEM PROMPT - BILLING CLARITY ANALYSIS

You are a healthcare billing educator helping consumers understand their medical bills. You translate complex billing information into plain English and help identify areas where they might want to ask questions.

## YOUR ROLE
- Explain what each charge means in everyday language
- Provide context without making accusations
- Suggest questions, not conclusions
- Empower the user to have informed conversations with their provider

## CORE PRINCIPLES

1. **Clarity, not accusations**: Explain what you see. Never say "you were overcharged" or "this is wrong."

2. **Guidance, not advice**: Suggest questions to ask, not actions to take.

3. **Honesty about limits**: You can't see the full medical record. There may be valid reasons for anything unusual.

4. **Empowerment**: Help the user understand so THEY can decide what to do.

## WHAT TO INCLUDE

### Summary
- Headline: One line capturing the essence (e.g., "Emergency room visit - $847.32 total, you owe $150.00")
- Plain language summary: 2-3 sentences explaining what this document represents
- Key facts: The most important numbers/dates

### Charge Explanations
For each line item, provide:
- What this service/procedure typically is
- Why it might have been performed (in general terms)
- The amounts broken down (charged, insurance paid, you owe)

### Glossary
Define any medical or billing terms used:
- CPT/HCPCS codes mentioned
- Billing terms (EOB, allowed amount, adjustment, etc.)
- Medical terms in descriptions

### Observations (if applicable - Tier 2)
Note patterns that might warrant a question, such as:
- Same code appearing multiple times on same date
- Charges significantly above typical ranges
- Services that are sometimes bundled

CRITICAL: Frame observations as "worth verifying" not "errors"

### Suggested Questions
Provide ready-to-use questions like:
- "Can you help me understand why [X] was billed separately from [Y]?"
- "I see two charges for [service] - can you confirm these were two separate procedures?"

## WHAT NOT TO DO

- Don't say charges are "wrong," "incorrect," or "fraudulent"
- Don't say the user was "overcharged" or "overbilled"
- Don't provide medical advice about whether procedures were necessary
- Don't tell the user what to do - give them information to decide
- Don't speculate about intent ("they did this to charge more")

## TONE

- Friendly and supportive
- Educational, not condescending
- Acknowledge that billing is confusing
- Reassure that asking questions is normal and appropriate

## OUTPUT FORMAT

Return valid JSON matching the ClarityToolResponse schema.

---

# KNOWLEDGE BASE - COMMON CPT CODES

[Insert CPT code reference - see Knowledge Base section]

---

# KNOWLEDGE BASE - BILLING TERMS

[Insert billing glossary - see Knowledge Base section]

---

# USER MESSAGE

Here is the extracted billing data from a user's document. Please analyze it and provide a clear, helpful explanation.

## Extracted Data:
```json
{extracted_billing_json}
```

## Analysis Tier: [TIER_1_UNDERSTAND | TIER_2_ASSESS | TIER_3_ACT]

Please provide your analysis as JSON matching the ClarityToolResponse schema.
```

### Clinical Document Reasoning Prompt

```markdown
# SYSTEM PROMPT - CLINICAL CLARITY ANALYSIS

You are a healthcare educator helping patients understand their clinical documents. You translate medical terminology into plain English and help patients prepare informed questions for their healthcare providers.

## YOUR ROLE
- Explain medical terms and findings in everyday language
- Help patients understand what happened during their visit
- Suggest questions for follow-up conversations
- NEVER provide medical advice or interpret clinical significance

## CORE PRINCIPLES

1. **Translate, don't interpret**: Explain what terms mean, not what they mean FOR THE PATIENT.

2. **Educate, don't diagnose**: You can explain what a diagnosis generally is, not whether it applies correctly to this patient.

3. **Empower conversations**: Help patients ask informed questions at their next visit.

4. **Respect the provider relationship**: Always direct clinical questions back to their healthcare provider.

## WHAT TO INCLUDE

### Summary
- Headline: What type of visit/document this is
- Plain language summary: What happened, in simple terms
- Key facts: Important dates, providers, main findings

### Diagnoses Explained
For each diagnosis:
- What this condition generally is (in plain language)
- Common reasons it might be diagnosed
- NOT whether the diagnosis is correct for this patient

### Procedures/Tests Explained
For each procedure or test:
- What it is and what it typically measures/evaluates
- Why it's commonly ordered
- What the results generally indicate (normal vs. abnormal ranges)

### Medications Explained
For each medication:
- What class of medication it is
- What it's typically prescribed for
- Common instructions (without providing medical advice)

### Lab Results Explained
For each result:
- What the test measures
- What the reference range means
- What "high" or "low" generally indicates (not specifically for this patient)

### Glossary
Define medical terms used:
- Diagnoses and conditions
- Procedures and tests
- Anatomical terms
- Medical abbreviations

### Suggested Questions
Provide questions for the patient's next appointment:
- "Can you help me understand what [diagnosis] means for my health?"
- "What should I watch for regarding [finding]?"
- "Are there any lifestyle changes that might help with [condition]?"

## WHAT NOT TO DO

- Don't interpret whether diagnoses are correct or appropriate
- Don't say a treatment was right or wrong
- Don't suggest alternative diagnoses or treatments
- Don't interpret lab results beyond explaining what the test measures
- Don't provide medical advice of any kind
- Don't say "you should" regarding medical decisions

## IMPORTANT DISCLAIMERS TO INCLUDE

- "This explanation is for understanding only - please discuss any concerns with your healthcare provider"
- "Lab results should be interpreted by your doctor in the context of your full medical history"
- "We cannot determine whether treatments or diagnoses are appropriate - that requires clinical judgment"

## TONE

- Warm and reassuring
- Educational without being clinical
- Acknowledge that medical documents can be confusing
- Encourage follow-up with healthcare provider

## OUTPUT FORMAT

Return valid JSON matching the ClarityToolResponse schema.

---

# KNOWLEDGE BASE - COMMON DIAGNOSES

[Insert ICD-10 reference - see Knowledge Base section]

---

# KNOWLEDGE BASE - MEDICAL TERMS

[Insert medical glossary - see Knowledge Base section]

---

# USER MESSAGE

Here is the extracted clinical data from a user's document. Please analyze it and provide a clear, helpful explanation.

## Extracted Data:
```json
{extracted_clinical_json}
```

## Analysis Tier: [TIER_1_UNDERSTAND | TIER_2_ASSESS | TIER_3_ACT]

Please provide your analysis as JSON matching the ClarityToolResponse schema.
```

---

## Knowledge Base Content

### Common CPT Codes Reference

```json
{
  "cptCodes": {
    "99201": {
      "description": "Office visit - new patient, straightforward",
      "plainLanguage": "A first-time visit with a doctor for a simple issue. Typically 15-29 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 50, "high": 150}
    },
    "99202": {
      "description": "Office visit - new patient, low complexity",
      "plainLanguage": "A first-time visit with a doctor for a minor problem. Typically 15-29 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 75, "high": 200}
    },
    "99203": {
      "description": "Office visit - new patient, moderate complexity",
      "plainLanguage": "A first-time visit with a doctor for a moderately complex issue. Typically 30-44 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 100, "high": 300}
    },
    "99204": {
      "description": "Office visit - new patient, high complexity",
      "plainLanguage": "A first-time visit with a doctor for a complex issue. Typically 45-59 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 150, "high": 400}
    },
    "99205": {
      "description": "Office visit - new patient, highest complexity",
      "plainLanguage": "A first-time visit with a doctor for a very complex issue. Typically 60-74 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 200, "high": 500}
    },
    "99211": {
      "description": "Office visit - established patient, minimal",
      "plainLanguage": "A brief follow-up visit, often with a nurse, for something simple like a blood pressure check.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 20, "high": 75}
    },
    "99212": {
      "description": "Office visit - established patient, straightforward",
      "plainLanguage": "A follow-up visit with a doctor for a simple issue. Typically 10-19 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 50, "high": 125}
    },
    "99213": {
      "description": "Office visit - established patient, low complexity",
      "plainLanguage": "A follow-up visit for a minor problem. Typically 20-29 minutes. This is one of the most common visit codes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 75, "high": 175}
    },
    "99214": {
      "description": "Office visit - established patient, moderate complexity",
      "plainLanguage": "A follow-up visit for a moderately complex issue. Typically 30-39 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 100, "high": 250}
    },
    "99215": {
      "description": "Office visit - established patient, high complexity",
      "plainLanguage": "A follow-up visit for a complex issue requiring significant time and decision-making. Typically 40-54 minutes.",
      "category": "Evaluation & Management",
      "typicalPriceRange": {"low": 150, "high": 350}
    },
    "99281": {
      "description": "Emergency department visit - straightforward",
      "plainLanguage": "An ER visit for a minor issue that doesn't require much evaluation.",
      "category": "Emergency",
      "typicalPriceRange": {"low": 100, "high": 300}
    },
    "99282": {
      "description": "Emergency department visit - low complexity",
      "plainLanguage": "An ER visit for a problem requiring some evaluation.",
      "category": "Emergency",
      "typicalPriceRange": {"low": 150, "high": 400}
    },
    "99283": {
      "description": "Emergency department visit - moderate complexity",
      "plainLanguage": "An ER visit requiring moderate evaluation and decision-making.",
      "category": "Emergency",
      "typicalPriceRange": {"low": 200, "high": 600}
    },
    "99284": {
      "description": "Emergency department visit - high complexity",
      "plainLanguage": "An ER visit for an urgent problem requiring significant evaluation.",
      "category": "Emergency",
      "typicalPriceRange": {"low": 300, "high": 900}
    },
    "99285": {
      "description": "Emergency department visit - highest complexity",
      "plainLanguage": "An ER visit for a serious or life-threatening condition requiring immediate attention.",
      "category": "Emergency",
      "typicalPriceRange": {"low": 400, "high": 1500}
    },
    "36415": {
      "description": "Venipuncture",
      "plainLanguage": "Drawing blood from a vein, usually in your arm. This is the 'blood draw' itself, separate from the tests run on the blood.",
      "category": "Laboratory",
      "typicalPriceRange": {"low": 5, "high": 35}
    },
    "85025": {
      "description": "Complete blood count (CBC) with differential",
      "plainLanguage": "A common blood test that counts your red cells, white cells, and platelets. Used to check for infections, anemia, and many other conditions.",
      "category": "Laboratory",
      "typicalPriceRange": {"low": 10, "high": 50}
    },
    "80053": {
      "description": "Comprehensive metabolic panel (CMP)",
      "plainLanguage": "A blood test that checks 14 different substances including blood sugar, calcium, and kidney/liver function. Common in routine checkups.",
      "category": "Laboratory",
      "typicalPriceRange": {"low": 15, "high": 75}
    },
    "80048": {
      "description": "Basic metabolic panel (BMP)",
      "plainLanguage": "A blood test checking 8 substances including blood sugar, calcium, and kidney function. Simpler version of the CMP.",
      "category": "Laboratory",
      "typicalPriceRange": {"low": 10, "high": 50}
    },
    "81001": {
      "description": "Urinalysis with microscopy",
      "plainLanguage": "A urine test examined under a microscope. Checks for infections, kidney problems, diabetes, and other conditions.",
      "category": "Laboratory",
      "typicalPriceRange": {"low": 5, "high": 40}
    },
    "71046": {
      "description": "Chest X-ray, 2 views",
      "plainLanguage": "X-ray images of your chest from two angles (front and side). Used to check lungs, heart size, and chest bones.",
      "category": "Radiology",
      "typicalPriceRange": {"low": 50, "high": 250}
    },
    "72148": {
      "description": "MRI lumbar spine without contrast",
      "plainLanguage": "Detailed imaging of your lower back using magnetic fields. Shows soft tissues like discs and nerves.",
      "category": "Radiology",
      "typicalPriceRange": {"low": 400, "high": 2500}
    },
    "73721": {
      "description": "MRI lower extremity joint without contrast",
      "plainLanguage": "Detailed imaging of a joint in your leg (knee, ankle, hip) using magnetic fields.",
      "category": "Radiology",
      "typicalPriceRange": {"low": 400, "high": 2500}
    },
    "70553": {
      "description": "MRI brain with and without contrast",
      "plainLanguage": "Detailed brain imaging, done twice - once plain and once with injected dye to highlight certain structures.",
      "category": "Radiology",
      "typicalPriceRange": {"low": 500, "high": 3000}
    },
    "74177": {
      "description": "CT abdomen and pelvis with contrast",
      "plainLanguage": "CT scan of your belly and pelvic area with injected dye for better visualization.",
      "category": "Radiology",
      "typicalPriceRange": {"low": 300, "high": 2000}
    },
    "93000": {
      "description": "Electrocardiogram (ECG/EKG) complete",
      "plainLanguage": "A test that records your heart's electrical activity. Quick, painless test using sensors on your chest.",
      "category": "Cardiology",
      "typicalPriceRange": {"low": 25, "high": 150}
    },
    "90834": {
      "description": "Psychotherapy, 45 minutes",
      "plainLanguage": "A 45-minute therapy session with a mental health provider.",
      "category": "Mental Health",
      "typicalPriceRange": {"low": 100, "high": 250}
    },
    "96372": {
      "description": "Therapeutic injection",
      "plainLanguage": "An injection of medication given by a healthcare provider (like a shot in the arm or muscle).",
      "category": "Medicine",
      "typicalPriceRange": {"low": 20, "high": 75}
    },
    "J3420": {
      "description": "Vitamin B12 injection",
      "plainLanguage": "An injection of vitamin B12, often used for B12 deficiency or certain types of anemia.",
      "category": "Drug Administration",
      "typicalPriceRange": {"low": 15, "high": 50}
    }
  }
}
```

### Billing Terms Glossary

```json
{
  "billingTerms": {
    "Allowed Amount": {
      "definition": "The maximum amount your insurance company has agreed to pay for a covered service. This is usually less than what the provider charged.",
      "alsoKnownAs": ["Eligible Amount", "Negotiated Rate", "Approved Amount"]
    },
    "Adjustment": {
      "definition": "The difference between what the provider charged and what your insurance allows. You don't pay this amount - it's essentially a discount from being insured.",
      "alsoKnownAs": ["Contractual Adjustment", "Write-off"]
    },
    "Balance Billing": {
      "definition": "When a provider bills you for the difference between their charge and what insurance paid. This is often prohibited for in-network providers but may occur with out-of-network care.",
      "alsoKnownAs": ["Surprise Billing"]
    },
    "Claim": {
      "definition": "The request submitted to your insurance company for payment of healthcare services you received.",
      "alsoKnownAs": []
    },
    "Coinsurance": {
      "definition": "Your share of costs after meeting your deductible, usually expressed as a percentage (e.g., you pay 20%, insurance pays 80%).",
      "alsoKnownAs": []
    },
    "Copay": {
      "definition": "A fixed amount you pay for a covered service, usually at the time of service. For example, $25 for a doctor visit.",
      "alsoKnownAs": ["Copayment"]
    },
    "Deductible": {
      "definition": "The amount you must pay out-of-pocket before your insurance starts paying. Resets each year.",
      "alsoKnownAs": []
    },
    "Denial": {
      "definition": "When your insurance company refuses to pay for a service. Can often be appealed.",
      "alsoKnownAs": ["Denied Claim"]
    },
    "EOB": {
      "definition": "Explanation of Benefits - a statement from your insurance showing what was billed, what they covered, and what you may owe. It's not a bill.",
      "alsoKnownAs": ["Explanation of Benefits"]
    },
    "In-Network": {
      "definition": "Providers who have contracts with your insurance company, typically resulting in lower costs for you.",
      "alsoKnownAs": ["Participating Provider"]
    },
    "Out-of-Network": {
      "definition": "Providers without contracts with your insurance. You typically pay more for their services.",
      "alsoKnownAs": ["Non-Participating"]
    },
    "Out-of-Pocket Maximum": {
      "definition": "The most you'll have to pay for covered services in a year. After reaching this, insurance pays 100%.",
      "alsoKnownAs": ["OOPM", "Out-of-Pocket Limit"]
    },
    "Patient Responsibility": {
      "definition": "The amount you owe after insurance processes the claim. This includes any deductible, coinsurance, or copay.",
      "alsoKnownAs": ["Member Responsibility", "Amount You Owe"]
    },
    "Pre-Authorization": {
      "definition": "Approval from your insurance required before certain services, confirming they'll cover it.",
      "alsoKnownAs": ["Prior Authorization", "Pre-Approval", "Pre-Cert"]
    },
    "Premium": {
      "definition": "The monthly amount you pay to have insurance coverage, regardless of whether you use services.",
      "alsoKnownAs": []
    },
    "Provider": {
      "definition": "Any person or facility that provides healthcare services - doctors, hospitals, labs, etc.",
      "alsoKnownAs": ["Healthcare Provider"]
    },
    "Statement": {
      "definition": "A bill from your healthcare provider showing what you owe them.",
      "alsoKnownAs": ["Patient Statement", "Bill"]
    },
    "Unbundling": {
      "definition": "Billing separately for services that are typically billed together. Sometimes appropriate, sometimes questioned by insurers.",
      "alsoKnownAs": []
    }
  }
}
```

### Common Medical Terms Glossary

```json
{
  "medicalTerms": {
    "Acute": "A condition that comes on suddenly and is usually short-term, as opposed to chronic (long-lasting).",
    "Benign": "Not harmful or cancerous. A benign tumor doesn't spread to other parts of the body.",
    "Biopsy": "A procedure where a small sample of tissue is removed for testing, often to check for cancer.",
    "Chronic": "A condition that lasts a long time or keeps coming back, like diabetes or high blood pressure.",
    "Diagnosis": "The identification of a disease or condition based on symptoms, tests, and examination.",
    "Differential Diagnosis": "A list of possible conditions that could explain your symptoms, which doctors narrow down through testing.",
    "Edema": "Swelling caused by fluid buildup in body tissues.",
    "Etiology": "The cause or origin of a disease or condition.",
    "Hypertension": "High blood pressure - when the force of blood against artery walls is too high.",
    "Hypotension": "Low blood pressure.",
    "Inflammation": "The body's response to injury or infection - causes redness, swelling, heat, and pain.",
    "Lesion": "Any abnormal tissue - could be a wound, sore, tumor, or other abnormality.",
    "Malignant": "Cancerous - cells that can spread to other parts of the body.",
    "Metastasis": "The spread of cancer from where it started to other parts of the body.",
    "Prognosis": "The likely outcome or course of a disease - what to expect going forward.",
    "Symptom": "Something you feel or notice that suggests a disease (like pain or fatigue).",
    "Sign": "Something a doctor can observe or measure (like a rash or high temperature).",
    "Vital Signs": "Basic body measurements: temperature, pulse, breathing rate, and blood pressure.",
    "WNL": "Within Normal Limits - test results or findings are in the normal range.",
    "PRN": "As needed - for medications to take when necessary rather than on a schedule.",
    "BID": "Twice daily - take medication two times a day.",
    "TID": "Three times daily.",
    "QID": "Four times daily.",
    "NPO": "Nothing by mouth - don't eat or drink.",
    "Stat": "Immediately - something that needs to happen right away.",
    "CBC": "Complete Blood Count - a common blood test.",
    "CMP": "Comprehensive Metabolic Panel - blood test checking multiple body functions.",
    "MRI": "Magnetic Resonance Imaging - detailed images using magnetic fields.",
    "CT": "Computed Tomography - detailed X-ray images from multiple angles.",
    "EKG/ECG": "Electrocardiogram - test of heart's electrical activity.",
    "UA": "Urinalysis - examination of urine.",
    "Rx": "Prescription.",
    "Dx": "Diagnosis.",
    "Hx": "History (medical history).",
    "Tx": "Treatment.",
    "Fx": "Fracture (broken bone)."
  }
}
```

---

## API Contract for Frontend

### Request Format

```typescript
interface ClarityAnalysisRequest {
  // Required
  document: {
    content: string;        // Base64 encoded document
    mimeType: string;       // 'image/jpeg', 'image/png', 'application/pdf'
    filename?: string;      // Original filename for reference
  };
  
  // Required
  documentType: 'BILLING' | 'CLINICAL' | 'UNKNOWN';
  
  // Required
  analysisTier: 'TIER_1_UNDERSTAND' | 'TIER_2_ASSESS' | 'TIER_3_ACT';
  
  // Optional
  options?: {
    includeRawExtraction?: boolean;  // Return Stage 1 output too
    language?: string;                // Future: support other languages
  };
}
```

### Response Format

```typescript
interface ClarityAnalysisResponse {
  success: boolean;
  
  // On success
  data?: {
    analysisId: string;
    result: ClarityToolResponse;       // The Stage 2 output (see schema above)
    rawExtraction?: object;            // Stage 1 output if requested
    processingTime: number;            // Milliseconds
  };
  
  // On error
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_DOCUMENT` | 400 | Document couldn't be processed (corrupt, unsupported format) |
| `DOCUMENT_TOO_LARGE` | 400 | Document exceeds size limit |
| `UNREADABLE_CONTENT` | 422 | Document readable but content too unclear to analyze |
| `UNSUPPORTED_TYPE` | 400 | Document type not supported |
| `PROCESSING_ERROR` | 500 | Internal error during analysis |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | AI service temporarily unavailable |

### Example Request

```javascript
const response = await fetch('/api/clarity/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    document: {
      content: base64EncodedDocument,
      mimeType: 'image/jpeg',
      filename: 'my_bill.jpg'
    },
    documentType: 'BILLING',
    analysisTier: 'TIER_1_UNDERSTAND'
  })
});

const result = await response.json();

if (result.success) {
  // Display result.data.result to user
  console.log(result.data.result.summary.headline);
} else {
  // Handle error
  console.error(result.error.message);
}
```

---

## Test Harness

### Node.js Test Script

```javascript
// test-clarity-tool.js
// Run: node test-clarity-tool.js <path-to-document>

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load knowledge bases
const cptCodes = require('./knowledge/cpt-codes.json');
const billingTerms = require('./knowledge/billing-terms.json');
const medicalTerms = require('./knowledge/medical-terms.json');

// Stage 1: Extraction
async function extractDocument(documentBase64, mimeType, documentType) {
  const systemPrompt = documentType === 'BILLING' 
    ? BILLING_EXTRACTION_PROMPT 
    : CLINICAL_EXTRACTION_PROMPT;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
            text: 'Please extract all information from this document. Return only valid JSON.',
          },
        ],
      },
    ],
    system: systemPrompt,
  });

  // Parse JSON from response
  const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in extraction response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Stage 2: Reasoning
async function analyzeExtraction(extractedData, documentType, tier) {
  const systemPrompt = documentType === 'BILLING'
    ? buildBillingReasoningPrompt(tier)
    : buildClinicalReasoningPrompt(tier);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Here is the extracted data:\n\n${JSON.stringify(extractedData, null, 2)}\n\nPlease provide your analysis as JSON.`,
      },
    ],
    system: systemPrompt,
  });

  // Parse JSON from response
  const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in reasoning response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Build reasoning prompt with knowledge base
function buildBillingReasoningPrompt(tier) {
  return `${BILLING_REASONING_PROMPT}

## KNOWLEDGE BASE - CPT CODES
${JSON.stringify(cptCodes, null, 2)}

## KNOWLEDGE BASE - BILLING TERMS
${JSON.stringify(billingTerms, null, 2)}

## Analysis Tier: ${tier}
`;
}

function buildClinicalReasoningPrompt(tier) {
  return `${CLINICAL_REASONING_PROMPT}

## KNOWLEDGE BASE - MEDICAL TERMS
${JSON.stringify(medicalTerms, null, 2)}

## Analysis Tier: ${tier}
`;
}

// Main execution
async function analyzeDocument(filePath, documentType = 'BILLING', tier = 'TIER_1_UNDERSTAND') {
  console.log('='.repeat(60));
  console.log('Healthcare Clarity Tool - Test Run');
  console.log('='.repeat(60));
  console.log(`Document: ${filePath}`);
  console.log(`Type: ${documentType}`);
  console.log(`Tier: ${tier}`);
  console.log('='.repeat(60));

  // Read and encode document
  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.webp': 'image/webp',
  }[ext] || 'image/jpeg';

  // Stage 1: Extract
  console.log('\n📄 STAGE 1: Extraction...');
  const startExtract = Date.now();
  const extracted = await extractDocument(base64Content, mimeType, documentType);
  const extractTime = Date.now() - startExtract;
  console.log(`✅ Extraction complete (${extractTime}ms)`);
  console.log('\nExtracted Data:');
  console.log(JSON.stringify(extracted, null, 2));

  // Stage 2: Reason
  console.log('\n🧠 STAGE 2: Reasoning...');
  const startReason = Date.now();
  const analysis = await analyzeExtraction(extracted, documentType, tier);
  const reasonTime = Date.now() - startReason;
  console.log(`✅ Analysis complete (${reasonTime}ms)`);
  console.log('\nFinal Analysis:');
  console.log(JSON.stringify(analysis, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total processing time: ${extractTime + reasonTime}ms`);
  console.log(`Headline: ${analysis.summary?.headline || 'N/A'}`);
  console.log('='.repeat(60));

  return { extracted, analysis };
}

// Prompt templates (abbreviated - use full versions from above)
const BILLING_EXTRACTION_PROMPT = `You are a healthcare billing document parser...`;
const CLINICAL_EXTRACTION_PROMPT = `You are a clinical document parser...`;
const BILLING_REASONING_PROMPT = `You are a healthcare billing educator...`;
const CLINICAL_REASONING_PROMPT = `You are a healthcare educator...`;

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node test-clarity-tool.js <document-path> [BILLING|CLINICAL] [TIER_1|TIER_2|TIER_3]');
    process.exit(1);
  }
  
  analyzeDocument(
    args[0],
    args[1] || 'BILLING',
    args[2] || 'TIER_1_UNDERSTAND'
  ).catch(console.error);
}

module.exports = { analyzeDocument, extractDocument, analyzeExtraction };
```

### Python Test Script

```python
# test_clarity_tool.py
# Run: python test_clarity_tool.py <path-to-document>

import anthropic
import base64
import json
import sys
import time
from pathlib import Path

# Initialize client
client = anthropic.Anthropic()

# Load knowledge bases (would be separate JSON files)
CPT_CODES = {}  # Load from cpt-codes.json
BILLING_TERMS = {}  # Load from billing-terms.json
MEDICAL_TERMS = {}  # Load from medical-terms.json

def get_mime_type(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    return {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.webp': 'image/webp',
    }.get(ext, 'image/jpeg')

def extract_document(doc_base64: str, mime_type: str, doc_type: str) -> dict:
    """Stage 1: Extract structured data from document"""
    
    system_prompt = BILLING_EXTRACTION_PROMPT if doc_type == 'BILLING' else CLINICAL_EXTRACTION_PROMPT
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": doc_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Please extract all information from this document. Return only valid JSON."
                    }
                ],
            }
        ],
    )
    
    # Extract JSON from response
    import re
    json_match = re.search(r'\{[\s\S]*\}', response.content[0].text)
    if not json_match:
        raise ValueError("No valid JSON in extraction response")
    
    return json.loads(json_match.group())

def analyze_extraction(extracted: dict, doc_type: str, tier: str) -> dict:
    """Stage 2: Analyze extracted data and generate user-friendly output"""
    
    system_prompt = build_reasoning_prompt(doc_type, tier)
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"Here is the extracted data:\n\n{json.dumps(extracted, indent=2)}\n\nPlease provide your analysis as JSON."
            }
        ],
    )
    
    # Extract JSON from response
    import re
    json_match = re.search(r'\{[\s\S]*\}', response.content[0].text)
    if not json_match:
        raise ValueError("No valid JSON in reasoning response")
    
    return json.loads(json_match.group())

def build_reasoning_prompt(doc_type: str, tier: str) -> str:
    """Build reasoning prompt with embedded knowledge base"""
    base_prompt = BILLING_REASONING_PROMPT if doc_type == 'BILLING' else CLINICAL_REASONING_PROMPT
    knowledge = CPT_CODES if doc_type == 'BILLING' else MEDICAL_TERMS
    terms = BILLING_TERMS if doc_type == 'BILLING' else {}
    
    return f"""{base_prompt}

## KNOWLEDGE BASE
{json.dumps(knowledge, indent=2)}

## TERMS GLOSSARY
{json.dumps(terms, indent=2)}

## Analysis Tier: {tier}
"""

def analyze_document(file_path: str, doc_type: str = 'BILLING', tier: str = 'TIER_1_UNDERSTAND'):
    """Main function to analyze a healthcare document"""
    
    print("=" * 60)
    print("Healthcare Clarity Tool - Test Run")
    print("=" * 60)
    print(f"Document: {file_path}")
    print(f"Type: {doc_type}")
    print(f"Tier: {tier}")
    print("=" * 60)
    
    # Read and encode document
    with open(file_path, 'rb') as f:
        doc_base64 = base64.standard_b64encode(f.read()).decode('utf-8')
    mime_type = get_mime_type(file_path)
    
    # Stage 1: Extract
    print("\n📄 STAGE 1: Extraction...")
    start = time.time()
    extracted = extract_document(doc_base64, mime_type, doc_type)
    extract_time = (time.time() - start) * 1000
    print(f"✅ Extraction complete ({extract_time:.0f}ms)")
    print("\nExtracted Data:")
    print(json.dumps(extracted, indent=2))
    
    # Stage 2: Reason
    print("\n🧠 STAGE 2: Reasoning...")
    start = time.time()
    analysis = analyze_extraction(extracted, doc_type, tier)
    reason_time = (time.time() - start) * 1000
    print(f"✅ Analysis complete ({reason_time:.0f}ms)")
    print("\nFinal Analysis:")
    print(json.dumps(analysis, indent=2))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total processing time: {extract_time + reason_time:.0f}ms")
    print(f"Headline: {analysis.get('summary', {}).get('headline', 'N/A')}")
    print("=" * 60)
    
    return {'extracted': extracted, 'analysis': analysis}

# Prompt templates (use full versions from documentation)
BILLING_EXTRACTION_PROMPT = """You are a healthcare billing document parser..."""
CLINICAL_EXTRACTION_PROMPT = """You are a clinical document parser..."""
BILLING_REASONING_PROMPT = """You are a healthcare billing educator..."""
CLINICAL_REASONING_PROMPT = """You are a healthcare educator..."""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_clarity_tool.py <document-path> [BILLING|CLINICAL] [TIER_1|TIER_2|TIER_3]")
        sys.exit(1)
    
    analyze_document(
        sys.argv[1],
        sys.argv[2] if len(sys.argv) > 2 else 'BILLING',
        sys.argv[3] if len(sys.argv) > 3 else 'TIER_1_UNDERSTAND'
    )
```

---

## Error Handling

### Extraction Failures

```javascript
// Handle cases where extraction fails or is incomplete
function handleExtractionResult(extracted) {
  if (extracted.extractionConfidence === 'LOW') {
    return {
      warning: true,
      message: "We had difficulty reading parts of this document. Some information may be missing or unclear.",
      proceed: true  // Still try to analyze what we got
    };
  }
  
  if (!extracted.lineItems || extracted.lineItems.length === 0) {
    return {
      error: true,
      code: 'NO_LINE_ITEMS',
      message: "We couldn't identify any charges or services in this document. Please make sure you uploaded a medical bill or clinical record."
    };
  }
  
  return { success: true };
}
```

### Graceful Degradation

```javascript
// If Stage 2 fails, return Stage 1 with basic formatting
function handleReasoningFailure(extracted, error) {
  console.error('Reasoning failed:', error);
  
  return {
    success: true,
    degraded: true,
    message: "We extracted your document information but couldn't complete the full analysis. Here's what we found:",
    data: {
      summary: {
        headline: `${extracted.documentType} - ${extracted.lineItems?.length || 0} items found`,
        plainLanguageSummary: "We extracted the basic information from your document. Please review the details below."
      },
      sections: formatExtractedAsBasicSections(extracted),
      disclaimer: {
        standard: "This analysis is for educational purposes only.",
        specific: ["Full analysis unavailable - showing extracted data only."]
      }
    }
  };
}
```

---

## Implementation Notes

### Performance Targets

| Metric | Target |
|--------|--------|
| Stage 1 (Extraction) | < 10 seconds |
| Stage 2 (Reasoning) | < 15 seconds |
| Total end-to-end | < 30 seconds |
| Error rate | < 5% |

### Recommended Model

- **Primary:** Claude claude-sonnet-4-20250514 (good balance of speed and quality)
- **Fallback:** Claude 3 Haiku (faster, simpler documents)
- **Complex cases:** Claude claude-sonnet-4-20250514 (highest accuracy)

### Caching Strategy

```javascript
// Cache knowledge base lookups but never cache PHI
const codeCache = new Map();

function lookupCode(code, type) {
  const key = `${type}:${code}`;
  if (codeCache.has(key)) {
    return codeCache.get(key);
  }
  
  const definition = knowledgeBase[type]?.[code];
  if (definition) {
    codeCache.set(key, definition);
  }
  return definition;
}
```

### Security Checklist

- [ ] Documents processed in memory only
- [ ] No logging of PHI content
- [ ] TLS for all API calls
- [ ] BAA executed with Anthropic
- [ ] User consent captured before upload
- [ ] Session-based analysis IDs (not persistent)
- [ ] Rate limiting per user/session

---

## Next Steps

1. **Set up development environment**
   - Get Anthropic API key
   - Set up BAA if not already done
   - Create test document corpus

2. **Build and test prompts**
   - Start with billing extraction
   - Test on 10+ sample documents
   - Iterate on prompt wording

3. **Develop knowledge base**
   - Expand CPT code coverage
   - Add more ICD-10 codes
   - Build price range data (Tier 2)

4. **Create backend service**
   - Implement API endpoints
   - Add error handling
   - Set up monitoring

5. **Integrate with frontend**
   - Share API contract with dev team
   - Define response rendering

---

*Document Version 1.0 - December 22, 2025*
*Prepared for Findr Health Engineering Team*
