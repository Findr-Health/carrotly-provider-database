// backend/services/clarityPrice/imageManagementService.js
// Cloudinary Image Management - PHI Compliant Auto-Deletion
// Critical: Images deleted within 24 hours, never stored long-term

const cloudinary = require('cloudinary').v2;

/**
 * Image Management Service
 * 
 * PHI COMPLIANCE:
 * - Images auto-delete after 24 hours
 * - Stored in temporary folder
 * - Access restricted (authenticated URLs)
 * - Deletion is MANDATORY, not optional
 * 
 * Features:
 * - Upload with auto-delete scheduling
 * - Manual deletion triggers
 * - Batch deletion for expired images
 * - Secure URL generation
 */

class ImageManagementService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    this.temporaryFolder = 'clarity-price/temp-bills';
  }
  
  /**
 * Upload bill image with auto-delete
 * 
 * @param {string|Buffer|object} imageData - File path, URL, Buffer, or Multer file object
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with deletion info
 */
async uploadBillImage(imageData, options = {}) {
  try {
    console.log('[ImageMgmt] Uploading bill image to Cloudinary...');
    const startTime = Date.now();
    
    // Handle Multer file object (from req.file)
    let uploadData = imageData;
    if (imageData && imageData.buffer && imageData.mimetype) {
      console.log('[ImageMgmt] Detected Multer file object, converting buffer to data URI');
      // Convert buffer to base64 data URI for Cloudinary
      const base64 = imageData.buffer.toString('base64');
      uploadData = `data:${imageData.mimetype};base64,${base64}`;
    } else if (Buffer.isBuffer(imageData)) {
      // Handle raw buffer
      console.log('[ImageMgmt] Detected raw buffer, converting to data URI');
      const base64 = imageData.toString('base64');
      uploadData = `data:application/octet-stream;base64,${base64}`;
    }
    
    // Calculate expiration time (24 hours from now)
    const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    
    // Upload configuration
    const uploadConfig = {
      folder: this.temporaryFolder,
      resource_type: 'auto', // Handles images and PDFs
      access_mode: 'authenticated', // Requires signed URLs
      type: 'upload',
      ...options,
      
      // CRITICAL: Set expiration
      tags: ['temp-bill', `expires:${expirationTime}`]
    };
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadData, uploadConfig);
    
    const uploadTime = Date.now() - startTime;
    console.log(`[ImageMgmt] Upload completed in ${uploadTime}ms`);
    console.log(`[ImageMgmt] Public ID: ${result.public_id}`);
    console.log(`[ImageMgmt] Scheduled deletion: ${new Date(expirationTime * 1000).toISOString()}`);
    
    return {
      success: true,
      cloudinaryPublicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      uploadedAt: new Date(),
      scheduledDeletionAt: new Date(expirationTime * 1000),
      expiresIn: '24 hours',
      metadata: {
        width: result.width,
        height: result.height,
        resourceType: result.resource_type
      }
    };
    
  } catch (error) {
    console.error('[ImageMgmt] Error uploading image:', error);
    return {
      success: false,
      error: error.message || 'Image upload failed'
    };
  }
}
  
  /**
   * Delete image immediately
   * Used when processing is complete or on error
   * 
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      console.log(`[ImageMgmt] Deleting image: ${publicId}`);
      
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true // Invalidate CDN cache
      });
      
      if (result.result === 'ok') {
        console.log(`[ImageMgmt] Successfully deleted: ${publicId}`);
        return {
          success: true,
          publicId: publicId,
          deletedAt: new Date()
        };
      } else {
        console.warn(`[ImageMgmt] Deletion returned: ${result.result}`);
        return {
          success: false,
          publicId: publicId,
          result: result.result
        };
      }
      
    } catch (error) {
      console.error('[ImageMgmt] Error deleting image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Delete multiple images (batch operation)
   * Used for cleanup jobs
   * 
   * @param {array} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<object>} Batch deletion result
   */
  async deleteImages(publicIds) {
    try {
      console.log(`[ImageMgmt] Batch deleting ${publicIds.length} images...`);
      
      const results = await Promise.allSettled(
        publicIds.map(id => this.deleteImage(id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      console.log(`[ImageMgmt] Batch deletion: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        total: publicIds.length,
        successful: successful,
        failed: failed,
        deletedAt: new Date()
      };
      
    } catch (error) {
      console.error('[ImageMgmt] Error in batch deletion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Find expired images that need deletion
   * Used by cleanup cron job
   * 
   * @returns {Promise<array>} Array of expired image public IDs
   */
  async findExpiredImages() {
    try {
      console.log('[ImageMgmt] Searching for expired images...');
      
      // Search for images in temporary folder
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: this.temporaryFolder,
        max_results: 500,
        tags: true
      });
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expired = [];
      
      // Check each image's expiration tag
      result.resources.forEach(resource => {
        const expiryTag = resource.tags?.find(tag => tag.startsWith('expires:'));
        
        if (expiryTag) {
          const expiryTime = parseInt(expiryTag.split(':')[1]);
          
          if (expiryTime <= currentTime) {
            expired.push(resource.public_id);
          }
        } else {
          // No expiry tag - check upload date (fallback)
          const uploadDate = new Date(resource.created_at);
          const hoursSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpload >= 24) {
            expired.push(resource.public_id);
          }
        }
      });
      
      console.log(`[ImageMgmt] Found ${expired.length} expired images`);
      
      return expired;
      
    } catch (error) {
      console.error('[ImageMgmt] Error finding expired images:', error);
      return [];
    }
  }
  
  /**
   * Run cleanup job
   * Deletes all expired images
   * Should be run by cron job every hour
   * 
   * @returns {Promise<object>} Cleanup result
   */
  async runCleanup() {
    try {
      console.log('[ImageMgmt] Starting image cleanup job...');
      const startTime = Date.now();
      
      // Find expired images
      const expiredIds = await this.findExpiredImages();
      
      if (expiredIds.length === 0) {
        console.log('[ImageMgmt] No expired images to clean up');
        return {
          success: true,
          deletedCount: 0,
          duration: Date.now() - startTime
        };
      }
      
      // Delete expired images
      const result = await this.deleteImages(expiredIds);
      
      const duration = Date.now() - startTime;
      console.log(`[ImageMgmt] Cleanup completed in ${duration}ms`);
      
      return {
        success: true,
        deletedCount: result.successful,
        failedCount: result.failed,
        duration: duration
      };
      
    } catch (error) {
      console.error('[ImageMgmt] Error in cleanup job:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate secure URL for image
   * Required since images are in authenticated mode
   * 
   * @param {string} publicId - Cloudinary public ID
   * @param {object} options - Transformation options
   * @returns {string} Signed secure URL
   */
  generateSecureUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      ...options
    });
  }
  
  /**
   * Get image info
   * 
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<object>} Image information
   */
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image'
      });
      
      return {
        success: true,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: new Date(result.created_at),
        url: result.secure_url
      };
      
    } catch (error) {
      console.error('[ImageMgmt] Error getting image info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if Cloudinary is configured
   * 
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
  
  /**
   * Test Cloudinary connection
   * 
   * @returns {Promise<object>} Connection test result
   */
  async testConnection() {
    try {
      // Try to list resources (limited)
      await cloudinary.api.resources({
        type: 'upload',
        max_results: 1
      });
      
      return {
        success: true,
        message: 'Cloudinary connection successful'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let imageManagementServiceInstance = null;

/**
 * Get image management service instance
 * 
 * @returns {ImageManagementService} Service singleton
 */
function getImageManagementService() {
  if (!imageManagementServiceInstance) {
    imageManagementServiceInstance = new ImageManagementService();
  }
  return imageManagementServiceInstance;
}

module.exports = {
  ImageManagementService,
  getImageManagementService
};
