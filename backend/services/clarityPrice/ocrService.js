// backend/services/clarityPrice/ocrService.js
// Google Cloud Vision API - Text Extraction from Medical Bills
// PHI Compliant: Extracts text temporarily, never stores images

const vision = require('@google-cloud/vision');

/**
 * OCR Service for Medical Bills
 * 
 * Uses: Google Cloud Vision API
 * Purpose: Extract text from bill images for analysis
 * PHI Handling: Text extracted temporarily, never stored long-term
 * 
 * Features:
 * - High-accuracy text detection
 * - Handles various image formats (JPEG, PNG, PDF)
 * - Confidence scoring
 * - Poor quality image detection
 * - Structured text extraction (preserves layout)
 */

class OCRService {
  constructor() {
    // Initialize Vision API client
    this.client = new vision.ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
    });
    
    this.initialized = true;
  }
  
  /**
   * Extract text from bill image
   * 
   * @param {string} imageSource - URL or base64 image
   * @param {object} options - Extraction options
   * @returns {Promise<object>} Extracted text and metadata
   */
  async extractText(imageSource, options = {}) {
    try {
      console.log('[OCR] Starting text extraction...');
      const startTime = Date.now();
      
      // Prepare image for Vision API
      let request;
      if (imageSource.startsWith('http')) {
        // Image URL (Cloudinary, etc.)
        request = {
          image: { source: { imageUri: imageSource } }
        };
      } else if (imageSource.startsWith('data:image')) {
        // Base64 image
        const base64Data = imageSource.split(',')[1];
        request = {
          image: { content: base64Data }
        };
      } else {
        // Assume base64 without prefix
        request = {
          image: { content: imageSource }
        };
      }
      
      // Call Vision API for document text detection
      // Using DOCUMENT_TEXT_DETECTION for better accuracy on documents
      const [result] = await this.client.documentTextDetection(request);
      
      const processingTime = Date.now() - startTime;
      console.log(`[OCR] Text extraction completed in ${processingTime}ms`);
      
      // Extract full text and structured data
      const fullTextAnnotation = result.fullTextAnnotation;
      
      if (!fullTextAnnotation || !fullTextAnnotation.text) {
        console.warn('[OCR] No text detected in image');
        return {
          success: false,
          error: 'No text detected in image',
          confidence: 0,
          rawText: '',
          processingTime
        };
      }
      
      const rawText = fullTextAnnotation.text;
      const pages = fullTextAnnotation.pages || [];
      
      // Calculate average confidence
      let totalConfidence = 0;
      let wordCount = 0;
      
      pages.forEach(page => {
        page.blocks?.forEach(block => {
          block.paragraphs?.forEach(paragraph => {
            paragraph.words?.forEach(word => {
              if (word.confidence) {
                totalConfidence += word.confidence;
                wordCount++;
              }
            });
          });
        });
      });
      
      const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;
      
      // Quality assessment
      const quality = this.assessQuality(averageConfidence, rawText);
      
      console.log(`[OCR] Confidence: ${(averageConfidence * 100).toFixed(1)}%`);
      console.log(`[OCR] Quality: ${quality.assessment}`);
      console.log(`[OCR] Extracted ${rawText.length} characters`);
      
      return {
        success: true,
        rawText: rawText,
        confidence: averageConfidence,
        quality: quality,
        metadata: {
          wordCount: wordCount,
          characterCount: rawText.length,
          pageCount: pages.length,
          processingTime: processingTime,
          timestamp: new Date()
        },
        structured: this.extractStructuredData(pages)
      };
      
    } catch (error) {
      console.error('[OCR] Error during text extraction:', error);
      
      // Handle specific errors
      if (error.code === 3) {
        return {
          success: false,
          error: 'Invalid image format or corrupted image',
          rawText: '',
          confidence: 0
        };
      }
      
      if (error.message?.includes('API key not valid')) {
        return {
          success: false,
          error: 'Google Cloud Vision API key is invalid or not configured',
          rawText: '',
          confidence: 0
        };
      }
      
      return {
        success: false,
        error: error.message || 'OCR extraction failed',
        rawText: '',
        confidence: 0
      };
    }
  }
  
  /**
   * Assess OCR quality
   * 
   * @param {number} confidence - Average confidence score (0-1)
   * @param {string} text - Extracted text
   * @returns {object} Quality assessment
   */
  assessQuality(confidence, text) {
    const assessment = {
      score: confidence,
      assessment: 'unknown',
      recommendation: '',
      issues: []
    };
    
    // Confidence-based assessment
    if (confidence >= 0.95) {
      assessment.assessment = 'excellent';
      assessment.recommendation = 'High quality OCR, proceed with confidence';
    } else if (confidence >= 0.85) {
      assessment.assessment = 'good';
      assessment.recommendation = 'Good quality OCR, minor verification recommended';
    } else if (confidence >= 0.70) {
      assessment.assessment = 'fair';
      assessment.recommendation = 'Fair quality OCR, verify extracted data carefully';
      assessment.issues.push('Lower confidence detected, may have errors');
    } else if (confidence >= 0.50) {
      assessment.assessment = 'poor';
      assessment.recommendation = 'Poor quality OCR, manual review required';
      assessment.issues.push('Low confidence, significant errors likely');
    } else {
      assessment.assessment = 'very_poor';
      assessment.recommendation = 'Very poor quality, request clearer image';
      assessment.issues.push('Very low confidence, extraction likely failed');
    }
    
    // Text-based issues
    if (text.length < 50) {
      assessment.issues.push('Very short text extracted, may be incomplete');
    }
    
    if (!/\d/.test(text)) {
      assessment.issues.push('No numbers detected, may not be a bill');
    }
    
    if (!/\$/.test(text) && !/USD/.test(text)) {
      assessment.issues.push('No currency symbols detected');
    }
    
    return assessment;
  }
  
  /**
   * Extract structured data from Vision API pages
   * Preserves layout and positioning information
   * 
   * @param {array} pages - Vision API page data
   * @returns {object} Structured text data
   */
  extractStructuredData(pages) {
    const structured = {
      blocks: [],
      lines: [],
      words: []
    };
    
    pages.forEach((page, pageIndex) => {
      page.blocks?.forEach((block, blockIndex) => {
        const blockText = this.getTextFromSymbols(block);
        
        structured.blocks.push({
          pageIndex,
          blockIndex,
          text: blockText,
          confidence: block.confidence,
          boundingBox: block.boundingBox
        });
        
        block.paragraphs?.forEach((paragraph, paragraphIndex) => {
          paragraph.words?.forEach((word, wordIndex) => {
            const wordText = this.getTextFromSymbols(word);
            
            structured.words.push({
              pageIndex,
              blockIndex,
              paragraphIndex,
              wordIndex,
              text: wordText,
              confidence: word.confidence,
              boundingBox: word.boundingBox
            });
          });
        });
      });
    });
    
    return structured;
  }
  
  /**
   * Extract text from Vision API symbols
   * 
   * @param {object} element - Vision API text element (block, paragraph, or word)
   * @returns {string} Extracted text
   */
  getTextFromSymbols(element) {
    if (!element.symbols) {
      return '';
    }
    
    return element.symbols
      .map(symbol => symbol.text)
      .join('');
  }
  
  /**
   * Detect if image is a medical bill
   * Quick pre-check before full processing
   * 
   * @param {string} imageSource - Image URL or base64
   * @returns {Promise<object>} Detection result
   */
  async detectBillType(imageSource) {
    try {
      const result = await this.extractText(imageSource);
      
      if (!result.success) {
        return {
          isBill: false,
          confidence: 0,
          reason: 'Could not extract text'
        };
      }
      
      const text = result.rawText.toLowerCase();
      
      // Look for bill indicators
      const billIndicators = [
        'patient',
        'provider',
        'service',
        'charge',
        'amount due',
        'bill',
        'invoice',
        'statement',
        'cpt',
        'procedure code',
        'diagnosis',
        'payment',
        'insurance',
        'copay',
        'deductible',
        'balance'
      ];
      
      const indicatorsFound = billIndicators.filter(indicator => 
        text.includes(indicator)
      );
      
      const confidence = indicatorsFound.length / billIndicators.length;
      
      return {
        isBill: confidence > 0.2, // At least 20% of indicators
        confidence: confidence,
        indicatorsFound: indicatorsFound,
        reason: indicatorsFound.length > 0 
          ? `Found ${indicatorsFound.length} bill indicators` 
          : 'No bill indicators found'
      };
      
    } catch (error) {
      console.error('[OCR] Error detecting bill type:', error);
      return {
        isBill: false,
        confidence: 0,
        reason: 'Detection error: ' + error.message
      };
    }
  }
  
  /**
   * Extract specific data patterns from text
   * Useful for pre-parsing before AI analysis
   * 
   * @param {string} text - OCR extracted text
   * @returns {object} Extracted patterns
   */
  extractPatterns(text) {
    const patterns = {
      amounts: [],
      dates: [],
      cptCodes: [],
      phoneNumbers: [],
      emails: []
    };
    
    // Dollar amounts: $123.45 or $1,234.56
    const amountRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      patterns.amounts.push({
        text: match[0],
        value: parseFloat(match[1].replace(/,/g, ''))
      });
    }
    
    // Dates: MM/DD/YYYY or MM-DD-YYYY
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
    while ((match = dateRegex.exec(text)) !== null) {
      patterns.dates.push(match[0]);
    }
    
    // CPT codes: 5-digit numbers
    const cptRegex = /\b(\d{5})\b/g;
    while ((match = cptRegex.exec(text)) !== null) {
      // Filter out obvious non-CPT numbers (zip codes, etc.)
      const code = match[1];
      if (code >= '10000' && code <= '99999') {
        patterns.cptCodes.push(code);
      }
    }
    
    // Phone numbers: (123) 456-7890 or 123-456-7890
    const phoneRegex = /(?:\((\d{3})\)|(\d{3}))[\s\-\.]?(\d{3})[\s\-\.]?(\d{4})/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      patterns.phoneNumbers.push(match[0]);
    }
    
    // Email addresses
    const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w+\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      patterns.emails.push(match[0]);
    }
    
    return patterns;
  }
}

// Singleton instance
let ocrServiceInstance = null;

/**
 * Get OCR service instance
 * 
 * @returns {OCRService} OCR service singleton
 */
function getOCRService() {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService();
  }
  return ocrServiceInstance;
}

module.exports = {
  OCRService,
  getOCRService
};
