// backend/routes/clarityPrice.js
// Clarity Price API Routes
// RESTful endpoints for medical bill analysis

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getBillProcessingService } = require('../services/clarityPrice/billProcessingService');
const { getImageManagementService } = require('../services/clarityPrice/imageManagementService');
const Bill = require('../models/clarityPrice/Bill');
const Analytics = require('../models/clarityPrice/Analytics');
const { authenticateToken } = require('../middleware/auth'); // Assuming auth middleware exists

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Service instances
const processingService = getBillProcessingService();
const imageService = getImageManagementService();

/**
 * POST /api/clarity-price/analyze
 * Upload and analyze a medical bill
 * 
 * Body: multipart/form-data with 'image' field
 * Optional: userLocation (string, e.g., "Bozeman, MT")
 * 
 * Returns: Bill analysis ID (processing happens async)
 */
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('[API] POST /clarity-price/analyze');
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }
    
    // Get user location (optional)
    const userLocation = req.body.userLocation || req.user.location || 'National Average';
    
    console.log(`[API] Processing bill for user: ${req.user.userId}`);
    console.log(`[API] File size: ${req.file.size} bytes`);
    console.log(`[API] User location: ${userLocation}`);
    
    // Process bill (this is async but we respond immediately)
    const result = await processingService.processBill(
      req.file,  // ✅ CORRECT - full file object with buffer, mimetype, etc.
      req.user.userId,
      { userLocation: userLocation }
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    // Return bill ID immediately
    res.status(200).json({
      success: true,
      billId: result.billId,
      message: 'Bill analysis complete',
      summary: result.summary,
      processingTime: result.processingTime
    });
    
  } catch (error) {
    console.error('[API] Error in /analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bill analysis failed'
    });
  }
});

/**
 * GET /api/clarity-price/bills/:id
 * Get detailed analysis for a specific bill
 * 
 * Params: id (billId)
 * Returns: Complete bill analysis
 */
router.get('/bills/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`[API] GET /clarity-price/bills/${req.params.id}`);
    
    const result = await processingService.getBillAnalysis(
      req.params.id,
      req.user.userId
    );
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      bill: result.bill
    });
    
  } catch (error) {
    console.error('[API] Error in /bills/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clarity-price/bills
 * Get user's bill history
 * 
 * Query: limit (optional, default 50)
 * Returns: List of user's analyzed bills
 */
router.get('/bills', authenticateToken, async (req, res) => {
  try {
    console.log(`[API] GET /clarity-price/bills for user: ${req.user.userId}`);
    
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await processingService.getUserBills(req.user.userId, { limit });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      bills: result.bills,
      totalSavings: result.totalSavings,
      count: result.count
    });
    
  } catch (error) {
    console.error('[API] Error in /bills:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/clarity-price/bills/:id/feedback
 * Submit negotiation feedback
 * 
 * Body: {
 *   attempted: boolean,
 *   successful: boolean,
 *   finalAmount: number,
 *   notes: string
 * }
 */
router.put('/bills/:id/feedback', authenticateToken, async (req, res) => {
  try {
    console.log(`[API] PUT /clarity-price/bills/${req.params.id}/feedback`);
    
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }
    
    // Update feedback
    bill.feedback = {
      attempted: req.body.attempted,
      successful: req.body.successful,
      finalAmount: req.body.finalAmount,
      discountAchieved: req.body.finalAmount 
        ? ((bill.summary.totalBilled - req.body.finalAmount) / bill.summary.totalBilled) * 100 
        : null,
      notes: req.body.notes,
      submittedAt: new Date()
    };
    
    await bill.save();
    
    console.log('[API] Feedback recorded successfully');
    
    res.status(200).json({
      success: true,
      message: 'Feedback recorded'
    });
    
  } catch (error) {
    console.error('[API] Error in /bills/:id/feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/clarity-price/bills/:id/interaction
 * Track user interaction with bill analysis
 * 
 * Body: {
 *   viewed: boolean,
 *   scriptCopied: boolean,
 *   providerCalled: boolean
 * }
 */
router.put('/bills/:id/interaction', authenticateToken, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }
    
    // Update interaction tracking
    if (req.body.viewed) {
      bill.userInteraction.viewed = true;
      bill.userInteraction.viewedAt = new Date();
    }
    
    if (req.body.scriptCopied) {
      bill.userInteraction.scriptCopied = true;
    }
    
    if (req.body.providerCalled) {
      bill.userInteraction.providerCalled = true;
    }
    
    await bill.save();
    
    res.status(200).json({
      success: true,
      message: 'Interaction tracked'
    });
    
  } catch (error) {
    console.error('[API] Error in /bills/:id/interaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/clarity-price/bills/:id
 * Delete a bill analysis
 * 
 * Note: Image is already auto-deleted after 24 hours
 */
router.delete('/bills/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`[API] DELETE /clarity-price/bills/${req.params.id}`);
    
    const bill = await Bill.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }
    
    // If image hasn't been deleted yet, delete it now
    if (!bill.imageMetadata?.deleted && bill.imageMetadata?.cloudinaryPublicId) {
      await imageService.deleteImage(bill.imageMetadata.cloudinaryPublicId);
    }
    
    res.status(200).json({
      success: true,
      message: 'Bill deleted'
    });
    
  } catch (error) {
    console.error('[API] Error in DELETE /bills/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clarity-price/stats
 * Get user's Clarity Price statistics
 * 
 * Returns: Total savings, bill count, etc.
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log(`[API] GET /clarity-price/stats for user: ${req.user.userId}`);
    
    const bills = await Bill.find({
      userId: req.user.userId,
      'processing.status': 'complete'
    }).select('summary.potentialSavings createdAt');
    
    const totalSavings = bills.reduce((sum, bill) => 
      sum + (bill.summary?.potentialSavings || 0), 0
    );
    
    const avgSavings = bills.length > 0 ? totalSavings / bills.length : 0;
    
    res.status(200).json({
      success: true,
      stats: {
        totalBillsAnalyzed: bills.length,
        totalPotentialSavings: Math.round(totalSavings * 100) / 100,
        avgSavingsPerBill: Math.round(avgSavings * 100) / 100,
        firstAnalysis: bills.length > 0 ? bills[bills.length - 1].createdAt : null,
        lastAnalysis: bills.length > 0 ? bills[0].createdAt : null
      }
    });
    
  } catch (error) {
    console.error('[API] Error in /stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =========================================
// ADMIN ENDPOINTS
// =========================================

/**
 * GET /api/clarity-price/admin/analytics
 * Get admin analytics dashboard data
 * 
 * Query: date (optional, default today)
 * Requires: Admin role
 */
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    console.log('[API] GET /clarity-price/admin/analytics');
    
    // Get date from query or use today
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    
    // Get analytics for date
    let analytics = await Analytics.findOne({ date: date });
    
    // If not found, generate it
    if (!analytics) {
      console.log('[API] Generating analytics for', date.toISOString());
      await Analytics.generateDailyAnalytics(date);
      analytics = await Analytics.findOne({ date: date });
    }
    
    res.status(200).json({
      success: true,
      analytics: analytics
    });
    
  } catch (error) {
    console.error('[API] Error in /admin/analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/clarity-price/admin/cleanup-images
 * Manually trigger image cleanup job
 * 
 * Requires: Admin role
 */
router.post('/admin/cleanup-images', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    console.log('[API] POST /clarity-price/admin/cleanup-images');
    
    const result = await imageService.runCleanup();
    
    res.status(200).json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('[API] Error in /admin/cleanup-images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
