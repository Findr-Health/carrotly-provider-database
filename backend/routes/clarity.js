/**
 * Healthcare Clarity API Routes
 * Findr Health - Document Analysis Endpoints
 * 
 * Integrates with existing:
 * - providers collection (for suggestions)
 * - users collection (for tracking/personalization)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const clarityService = require('../services/clarityService');
const multiDocService = require('../services/multiDocumentService');
const geoPricingService = require('../services/geoPricingService');

// Optional: Import your existing auth middleware if you want to track logged-in users
// const { optionalAuth } = require('../middleware/auth');

// Configure multer for memory storage (no disk persistence - privacy first)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF.'));
    }
  }
});

/**
 * POST /api/clarity/analyze
 * Main endpoint for document analysis
 * 
 * Body (multipart/form-data):
 * - document: File (image or PDF)
 * - question: String (optional) - user's specific question or preset key
 * 
 * Preset question keys:
 * - what_does_this_mean
 * - what_do_i_owe
 * - is_price_correct
 * - explain_this
 */
router.post('/analyze', upload.single('document'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document uploaded',
        message: 'Please upload an image or PDF of your healthcare document.'
      });
    }

    // Convert file to base64
    const documentBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const userQuestion = req.body.question || null;
    const userZipCode = req.body.zipCode || null;

    // Log analysis start (no PHI in logs)
    console.log(`[Clarity] Analysis started - Type: ${mimeType}, Size: ${req.file.size}, Question: ${userQuestion || 'none'}`);

    // Run analysis
    const result = await clarityService.analyzeDocument(documentBase64, mimeType, userQuestion);

    // Add geographic pricing if ZIP provided
    if (userZipCode && result.isHealthcare && result.extraction) {
      result.priceContext = geoPricingService.getRegionalPriceContext(
        result.extraction,
        userZipCode
      );
    }

    // Log completion (no PHI)
    console.log(`[Clarity] Analysis complete - Success: ${result.success}, Healthcare: ${result.isHealthcare}, Time: ${result.processingTime}ms`);

    // Track usage for analytics (optional - no PHI stored)
    const db = req.app.locals.db;
    if (db) {
      try {
        await db.collection('clarityUsage').insertOne({
          timestamp: new Date(),
          documentType: result.documentType || 'unknown',
          isHealthcare: result.isHealthcare,
          questionType: userQuestion,
          processingTime: result.processingTime,
          confidenceLevel: result.confidence?.level,
          // If user is logged in (via JWT), track their ID
          userId: req.user?.id || null,
          // Anonymous session tracking
          sessionId: req.body.sessionId || null,
          // Region for aggregate analytics
          region: userZipCode ? geoPricingService.getRegionFromZip(userZipCode) : null
        });
      } catch (trackingError) {
        // Don't fail the request if tracking fails
        console.error('[Clarity] Usage tracking error:', trackingError.message);
      }
    }

    // Clear document from memory immediately
    req.file.buffer = null;

    // Return result
    res.json(result);

  } catch (error) {
    console.error('[Clarity] Analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: 'We encountered an error analyzing your document. Please try again or contact support if the problem persists.'
    });
  }
});

/**
 * POST /api/clarity/classify
 * Quick classification endpoint (is this healthcare?)
 * Useful for client-side validation before full analysis
 */
router.post('/classify', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document uploaded'
      });
    }

    const documentBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const classification = await clarityService.classifyDocument(documentBase64, mimeType);

    // Clear document from memory
    req.file.buffer = null;

    res.json({
      success: true,
      ...classification
    });

  } catch (error) {
    console.error('[Clarity] Classification error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Classification failed'
    });
  }
});

/**
 * GET /api/clarity/presets
 * Returns available preset questions for UI
 */
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    presets: [
      {
        key: 'what_does_this_mean',
        label: 'What does this document mean?',
        icon: 'help-circle',
        description: 'Get a plain-language explanation of your document'
      },
      {
        key: 'what_do_i_owe',
        label: 'What do I owe?',
        icon: 'dollar-sign',
        description: 'Find out exactly how much you need to pay'
      },
      {
        key: 'is_price_correct',
        label: 'Does this price look correct?',
        icon: 'check-circle',
        description: 'Review charges and get questions to verify'
      },
      {
        key: 'explain_this',
        label: 'Explain this to me',
        icon: 'book-open',
        description: 'Complete breakdown of everything on your document'
      }
    ]
  });
});

/**
 * POST /api/clarity/suggest-providers
 * Get provider suggestions based on analysis
 * Integrates with Findr Health's provider database
 */
router.post('/suggest-providers', async (req, res) => {
  try {
    const { analysisContext, category, userLocation, analysisId } = req.body;
    
    // Get database connection from app
    const db = req.app.locals.db;
    
    if (!db) {
      return res.json({
        success: true,
        providers: [],
        message: 'Provider suggestions not available'
      });
    }

    // Base query: only approved providers
    let query = { status: 'approved' };
    
    // Filter by category based on analysis needs
    if (category === 'billing_advocate' || analysisContext?.hasBillingIssues) {
      // Find providers who offer billing advocacy or patient advocacy services
      query.$or = [
        { 'services.name': { $regex: /billing|advocacy|patient rights|medical billing/i } },
        { providerTypes: { $in: ['patient-advocate', 'billing-specialist'] } },
        { 'services.category': { $regex: /advocacy|billing/i } }
      ];
    } else if (category === 'mental_health' || analysisContext?.documentType === 'MENTAL_HEALTH') {
      query.providerTypes = { $in: ['mental-health', 'Mental Health'] };
    } else if (category === 'second_opinion') {
      // For medical second opinions, match provider types to the issue
      if (analysisContext?.providerTypes) {
        query.providerTypes = { $in: analysisContext.providerTypes };
      }
    }

    // Add location filter if provided
    if (userLocation?.state) {
      query['address.state'] = userLocation.state;
    }
    if (userLocation?.city) {
      query['address.city'] = { $regex: new RegExp(userLocation.city, 'i') };
    }

    const providers = await db.collection('providers')
      .find(query)
      .limit(5)
      .toArray();

    res.json({
      success: true,
      providers: providers.map(p => ({
        id: p._id,
        name: p.practiceName,
        providerTypes: p.providerTypes || [],
        // Location info
        location: {
          city: p.address?.city,
          state: p.address?.state,
          zip: p.address?.zip
        },
        fullAddress: [
          p.address?.street,
          p.address?.suite,
          p.address?.city,
          p.address?.state,
          p.address?.zip
        ].filter(Boolean).join(', '),
        // Contact info (check both nested and flat fields for backwards compatibility)
        phone: p.contactInfo?.phone || p.phone,
        email: p.contactInfo?.email || p.email,
        website: p.contactInfo?.website || p.website,
        // Services relevant to the query
        services: (p.services || [])
          .filter(s => s.isActive !== false)
          .slice(0, 3)
          .map(s => ({
            name: s.name,
            price: s.price,
            duration: s.duration
          })),
        // Credentials
        credentials: {
          yearsExperience: p.credentials?.yearsExperience,
          certifications: p.credentials?.certifications || []
        },
        // Languages (useful for diverse populations)
        languagesSpoken: p.languagesSpoken || [],
        // Insurance (helpful context)
        insuranceAccepted: p.insuranceAccepted || [],
        // Photo for display
        primaryPhoto: p.photos?.find(photo => photo.isPrimary)?.url || p.photos?.[0]?.url || null,
        // Link to Findr Health profile
        profileUrl: `https://findrhealth.com/provider/${p._id}`
      })),
      // Include search context for transparency
      searchContext: {
        category: category,
        location: userLocation,
        resultsCount: providers.length
      }
    });

  } catch (error) {
    console.error('[Clarity] Provider suggestion error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Could not fetch provider suggestions'
    });
  }
});

/**
 * POST /api/clarity/analyze-multiple
 * P1 Feature: Analyze and correlate multiple documents
 * 
 * Body (multipart/form-data):
 * - documents: Array of Files (images or PDFs)
 * - zipCode: String (optional) - for geographic pricing context
 */
router.post('/analyze-multiple', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'No documents uploaded',
        message: 'Please upload at least one document.'
      });
    }

    const zipCode = req.body.zipCode || null;
    console.log(`[Clarity] Multi-document analysis - ${req.files.length} files, ZIP: ${zipCode || 'none'}`);

    // Analyze each document
    const analyses = await Promise.all(
      req.files.map(async (file) => {
        const documentBase64 = file.buffer.toString('base64');
        const result = await clarityService.analyzeDocument(documentBase64, file.mimetype);
        
        // Add geographic pricing if ZIP provided and healthcare doc
        if (zipCode && result.isHealthcare && result.extraction) {
          result.priceContext = geoPricingService.getRegionalPriceContext(
            result.extraction,
            zipCode
          );
        }
        
        // Clear buffer
        file.buffer = null;
        return result;
      })
    );

    // Correlate documents if multiple healthcare docs
    const healthcareAnalyses = analyses.filter(a => a.isHealthcare);
    let correlation = null;
    
    if (healthcareAnalyses.length >= 2) {
      correlation = multiDocService.correlateDocuments(healthcareAnalyses);
    }

    res.json({
      success: true,
      documentCount: analyses.length,
      analyses: analyses,
      correlation: correlation,
      hasCorrelation: correlation?.correlated || false
    });

  } catch (error) {
    console.error('[Clarity] Multi-document error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: 'Error analyzing documents. Please try again.'
    });
  }
});

/**
 * POST /api/clarity/price-check
 * P1 Feature: Get geographic price context for an extraction
 * 
 * Body (JSON):
 * - extraction: Object - previously extracted document data
 * - zipCode: String - 5-digit ZIP code
 */
router.post('/price-check', async (req, res) => {
  try {
    const { extraction, zipCode } = req.body;

    if (!extraction || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide both extraction data and ZIP code.'
      });
    }

    const priceContext = geoPricingService.getRegionalPriceContext(extraction, zipCode);
    const questions = geoPricingService.getPriceVerificationQuestions(priceContext);

    res.json({
      success: true,
      priceContext: priceContext,
      verificationQuestions: questions
    });

  } catch (error) {
    console.error('[Clarity] Price check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Price check failed'
    });
  }
});

/**
 * POST /api/clarity/correlate
 * P1 Feature: Correlate previously analyzed documents
 * 
 * Body (JSON):
 * - analyses: Array of analysis results
 */
router.post('/correlate', async (req, res) => {
  try {
    const { analyses } = req.body;

    if (!analyses || !Array.isArray(analyses) || analyses.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 2 analyses to correlate'
      });
    }

    const correlation = multiDocService.correlateDocuments(analyses);

    res.json({
      success: true,
      ...correlation
    });

  } catch (error) {
    console.error('[Clarity] Correlation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Correlation failed'
    });
  }
});

/**
 * POST /api/clarity/expert-consult-request
 * Submit interest in expert consultation
 * Developers will build the full scheduling/payment workflow
 * 
 * Body (JSON):
 * - analysisId: String (optional) - reference to previous analysis
 * - documentType: String - type of document analyzed
 * - primaryConcern: String - what user needs help with
 * - contactEmail: String
 * - contactPhone: String (optional)
 * - preferredTime: String (optional) - morning/afternoon/evening
 */
router.post('/expert-consult-request', async (req, res) => {
  try {
    const { 
      analysisId, 
      documentType, 
      primaryConcern, 
      contactEmail, 
      contactPhone,
      preferredTime 
    } = req.body;

    if (!contactEmail || !primaryConcern) {
      return res.status(400).json({
        success: false,
        error: 'Email and concern description required'
      });
    }

    // Log the request (in production, save to database)
    console.log(`[Expert Consult] New request - Email: ${contactEmail}, Concern: ${primaryConcern.substring(0, 50)}...`);

    // In production, this would:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Notify the expert
    // 4. Return booking link

    res.json({
      success: true,
      message: 'Your request has been received. Our healthcare expert will contact you within 24 hours.',
      requestId: `ECR-${Date.now()}`,
      nextSteps: [
        'Check your email for confirmation',
        'Prepare your documents for the consultation',
        'Write down your specific questions'
      ],
      expertInfo: {
        title: 'Healthcare Navigation Expert',
        credentials: 'Board-Certified Surgeon & Healthcare Executive',
        experience: '20+ years in healthcare administration and patient advocacy',
        specialties: [
          'Medical bill review and negotiation',
          'Insurance claim disputes',
          'Healthcare system navigation',
          'Treatment options and second opinions'
        ]
      }
    });

  } catch (error) {
    console.error('[Expert Consult] Request error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Could not submit request'
    });
  }
});

/**
 * GET /api/clarity/expert-info
 * Get information about expert consultation service
 */
router.get('/expert-info', (req, res) => {
  res.json({
    success: true,
    service: {
      name: 'Personal Healthcare Navigator',
      tagline: 'Get clarity from someone who\'s been on both sides',
      description: 'Schedule a 1-on-1 video consultation with a board-certified surgeon and healthcare executive who has spent decades navigating the complexities of healthcare from both the provider and payer perspectives.',
      benefits: [
        'Personalized review of your specific situation',
        'Expert interpretation of confusing documents',
        'Strategic advice on next steps',
        'Insider knowledge of how the system works',
        'Advocacy strategies that get results'
      ],
      expert: {
        credentials: 'Board-Certified Surgeon, Healthcare Executive',
        experience: '20+ years',
        background: 'Has worked as a surgeon, hospital administrator, and healthcare consultant, giving unique insight into how billing, insurance, and clinical decisions are made.'
      },
      consultTypes: [
        {
          type: 'quick_clarity',
          name: 'Quick Clarity Session',
          duration: '15 minutes',
          description: 'Perfect for a single bill question or quick document review',
          idealFor: ['One confusing bill', 'EOB interpretation', 'Quick second opinion on charges']
        },
        {
          type: 'deep_dive',
          name: 'Deep Dive Consultation',
          duration: '30 minutes',
          description: 'Comprehensive review of your situation with actionable next steps',
          idealFor: ['Multiple bills', 'Ongoing disputes', 'Complex medical situations', 'Insurance denials']
        },
        {
          type: 'advocacy_strategy',
          name: 'Advocacy Strategy Session',
          duration: '45 minutes',
          description: 'Develop a complete plan to resolve your healthcare challenge',
          idealFor: ['Large unexpected bills', 'Prior authorization issues', 'Appeal strategy', 'Negotiation coaching']
        }
      ]
    }
  });
});

/**
 * GET /api/clarity/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  const db = req.app.locals.db;
  let dbConnected = false;
  
  if (db) {
    try {
      await db.command({ ping: 1 });
      dbConnected = true;
    } catch (e) {
      dbConnected = false;
    }
  }

  res.json({
    success: true,
    service: 'clarity',
    status: 'operational',
    version: '1.2.0',
    features: {
      singleDocument: true,
      multiDocument: true,
      geoPricing: true,
      expertConsult: true,
      providerSuggestions: dbConnected,
      usageTracking: dbConnected
    },
    integrations: {
      database: dbConnected,
      anthropic: !!process.env.ANTHROPIC_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/clarity/analytics
 * Usage analytics for admin dashboard
 * Requires admin auth in production
 */
router.get('/analytics', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    // Get usage stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalAnalyses, byDocType, byDay, avgProcessingTime] = await Promise.all([
      // Total analyses
      db.collection('clarityUsage').countDocuments({
        timestamp: { $gte: thirtyDaysAgo }
      }),
      
      // By document type
      db.collection('clarityUsage').aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      
      // By day
      db.collection('clarityUsage').aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          } 
        },
        { $sort: { _id: 1 } }
      ]).toArray(),
      
      // Average processing time
      db.collection('clarityUsage').aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo }, processingTime: { $exists: true } } },
        { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
      ]).toArray()
    ]);

    res.json({
      success: true,
      period: 'last_30_days',
      analytics: {
        totalAnalyses,
        byDocumentType: byDocType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        dailyUsage: byDay,
        averageProcessingTime: avgProcessingTime[0]?.avgTime || null
      }
    });

  } catch (error) {
    console.error('[Clarity] Analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Could not fetch analytics'
    });
  }
});

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Please upload an image under 10MB'
      });
    }
  }
  
  console.error('[Clarity] Route error:', error.message);
  res.status(500).json({
    success: false,
    error: 'An error occurred',
    message: error.message
  });
});
// Chat endpoint for text questions
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are Clarity, a friendly healthcare billing assistant created by Findr Health. Your job is to help people understand their medical bills, insurance terms, and healthcare costs in plain, simple language.

Be conversational, warm, and helpful. Use bullet points and formatting when it helps clarity. If someone asks about specific prices, give general ranges and suggest ways to find exact prices in their area.

Always encourage users to upload their actual documents for more specific help. Keep responses concise but thorough.`,
      messages: [
        { role: 'user', content: question }
      ]
    });

    const aiResponse = response.content[0].text;
    
    res.json({ 
      success: true, 
      response: aiResponse 
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to process question. Please try again.' 
    });
  }
});
module.exports = router;
