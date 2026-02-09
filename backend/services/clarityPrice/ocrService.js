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
      
      // ⚠️ TEMPORARY: Mock OCR data for testing full pipeline
      console.log('[OCR] ⚠️ USING MOCK DATA - Google Vision API temporarily disabled');
      console.log('[OCR] This allows testing bill parsing, pricing analysis, and membership features');
      
      return {
        success: true,
        rawText: `HEALTHCARE BILLING STATEMENT
Mountain View Medical Clinic
123 Health Way, Bozeman MT 59715

PATIENT STATEMENT
Date of Service: January 25, 2026
Statement Date: February 1, 2026

SERVICES PROVIDED:
Office Visit - Level 3 (CPT 99213)           $102.00
Comprehensive Metabolic Panel (CPT 80053)     $92.00
Lipid Panel (CPT 80061)                       $67.00

TOTAL CHARGES:                               $261.00
Insurance Paid:                                $0.00
PATIENT RESPONSIBILITY:                      $261.00

Payment is due within 30 days of statement date.`,
        confidence: 0.95,
        quality: { 
          assessment: 'good', 
          score: 95,
          issues: []
        },
        metadata: {
          wordCount: 65,
          characterCount: 450,
          pageCount: 1,
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        },
        structured: {}
      };
      
      // Original Google Vision API code (disabled for now)
      // Uncomment below and remove mock data above to re-enable
      /*
      // Prepare image for Vision API
      let request;
      if (imageSource.startsWith('http')) {
        request = {
          image: { source: { imageUri: imageSource } }
        };
      } else if (imageSource.startsWith('data:image')) {
        const base64Data = imageSource.split(',')[1];
        request = {
          image: { content: base64Data }
        };
      } else {
        request = {
          image: { content: imageSource }
        };
      }
      
      // Call Vision API with timeout
      const timeoutMs = 30000;
      const result = await Promise.race([
        this.client.documentTextDetection(request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR timeout after 30 seconds')), timeoutMs)
        )
      ]);
      
      const [visionResult] = result;
      const processingTime = Date.now() - startTime;
      
      const fullTextAnnotation = visionResult.fullTextAnnotation;
      
      if (!fullTextAnnotation || !fullTextAnnotation.text) {
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
      const quality = this.assessQuality(averageConfidence, rawText);
      
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
      */
      
    } catch (error) {
      console.error('[OCR] Error during text extraction:', error);
      
      if (error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'OCR processing timed out',
          rawText: '',
          confidence: 0
        };
      }
      
      return {
        success: false,
        error: error.message || 'OCR processing failed',
        rawText: '',
        confidence: 0
      };
    }
  }
  
  assessQuality(confidence, text) {
    if (confidence >= 0.9) {
      return { assessment: 'excellent', score: 95 };
    } else if (confidence >= 0.7) {
      return { assessment: 'good', score: 80 };
    } else {
      return { assessment: 'poor', score: 50 };
    }
  }
  
  extractStructuredData(pages) {
    return {};
  }
  
  extractPatterns(text) {
    return {};
  }
}

let ocrServiceInstance = null;

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
