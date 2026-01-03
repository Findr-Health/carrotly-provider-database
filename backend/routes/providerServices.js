const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * Provider Services Routes
 * These routes handle CRUD operations for provider services
 * Mount at: /api/providers/:providerId/services
 */

// Middleware to get provider from database
const getProvider = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;
    const provider = await db.collection('providers').findOne({
      _id: new mongoose.Types.ObjectId(req.params.providerId)
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    req.provider = provider;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider'
    });
  }
};

/**
 * GET /api/providers/:providerId/services
 * Get all services for a provider
 * Query params: category (optional), active (optional)
 */
router.get('/:providerId/services', getProvider, async (req, res) => {
  try {
    const { category, active } = req.query;
    let services = req.provider.services || [];

    // Filter by category if specified
    if (category) {
      services = services.filter(s => s.category === category);
    }

    // Filter by active status if specified
    if (active !== undefined) {
      const isActive = active === 'true';
      services = services.filter(s => s.isActive === isActive);
    }

    // Sort by category and sortOrder
    services.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

/**
 * GET /api/providers/:providerId/services/grouped
 * Get services grouped by category
 */
router.get('/:providerId/services/grouped', getProvider, async (req, res) => {
  try {
    const services = req.provider.services || [];
    
    // Group by category
    const grouped = {};
    services.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });

    // Sort services within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });

    // Get list of categories in order
    const categories = Object.keys(grouped).sort();

    res.json({
      success: true,
      categories,
      grouped
    });
  } catch (error) {
    console.error('Error fetching grouped services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grouped services'
    });
  }
});

/**
 * GET /api/providers/:providerId/services/:serviceId
 * Get a single service by ID
 */
router.get('/:providerId/services/:serviceId', getProvider, async (req, res) => {
  try {
    const service = (req.provider.services || []).find(
      s => s._id.toString() === req.params.serviceId
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service'
    });
  }
});

/**
 * POST /api/providers/:providerId/services
 * Add a new service to provider
 */
router.post('/:providerId/services', getProvider, async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      basePrice,
      duration,
      hasVariants,
      variants,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !category || basePrice === undefined || !duration) {
      return res.status(400).json({
        success: false,
        message: 'name, category, basePrice, and duration are required'
      });
    }

    // Calculate sort order
    const existingServices = req.provider.services || [];
    const categoryServices = existingServices.filter(s => s.category === category);
    const sortOrder = categoryServices.length;

    const newService = {
      _id: new mongoose.Types.ObjectId(),
      name,
      description: description || '',
      shortDescription: shortDescription || (description ? description.substring(0, 97) + '...' : ''),
      category,
      basePrice: parseFloat(basePrice),
      duration: parseInt(duration),
      hasVariants: hasVariants || false,
      variants: variants || [],
      isActive,
      sortOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to provider
    const db = mongoose.connection.db;
    await db.collection('providers').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.providerId) },
      { $push: { services: newService } }
    );

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      service: newService
    });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add service'
    });
  }
});

/**
 * POST /api/providers/:providerId/services/bulk
 * Add multiple services at once (for quick onboarding)
 */
router.post('/:providerId/services/bulk', getProvider, async (req, res) => {
  try {
    const { services } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'services array is required'
      });
    }

    const existingServices = req.provider.services || [];
    
    // Group existing services by category for sort order calculation
    const categoryCounts = {};
    existingServices.forEach(s => {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    });

    // Prepare new services
    const newServices = services.map(service => {
      const category = service.category || 'General';
      const sortOrder = categoryCounts[category] || 0;
      categoryCounts[category] = sortOrder + 1;

      return {
        _id: new mongoose.Types.ObjectId(),
        name: service.name,
        description: service.description || '',
        shortDescription: service.shortDescription || '',
        category,
        basePrice: parseFloat(service.basePrice || service.price || 0),
        duration: parseInt(service.duration || 60),
        hasVariants: service.hasVariants || false,
        variants: service.variants || [],
        isActive: service.isActive !== false,
        sortOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // Add all services to provider
    const db = mongoose.connection.db;
    await db.collection('providers').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.providerId) },
      { $push: { services: { $each: newServices } } }
    );

    res.status(201).json({
      success: true,
      message: `${newServices.length} services added successfully`,
      count: newServices.length,
      services: newServices
    });
  } catch (error) {
    console.error('Error adding bulk services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add services'
    });
  }
});

/**
 * PUT /api/providers/:providerId/services/:serviceId
 * Update a service
 */
router.put('/:providerId/services/:serviceId', getProvider, async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      basePrice,
      duration,
      hasVariants,
      variants,
      isActive,
      sortOrder
    } = req.body;

    // Find service index
    const services = req.provider.services || [];
    const serviceIndex = services.findIndex(
      s => s._id.toString() === req.params.serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Build update object
    const updateFields = {};
    if (name !== undefined) updateFields['services.$.name'] = name;
    if (description !== undefined) updateFields['services.$.description'] = description;
    if (shortDescription !== undefined) updateFields['services.$.shortDescription'] = shortDescription;
    if (category !== undefined) updateFields['services.$.category'] = category;
    if (basePrice !== undefined) updateFields['services.$.basePrice'] = parseFloat(basePrice);
    if (duration !== undefined) updateFields['services.$.duration'] = parseInt(duration);
    if (hasVariants !== undefined) updateFields['services.$.hasVariants'] = hasVariants;
    if (variants !== undefined) updateFields['services.$.variants'] = variants;
    if (isActive !== undefined) updateFields['services.$.isActive'] = isActive;
    if (sortOrder !== undefined) updateFields['services.$.sortOrder'] = sortOrder;
    updateFields['services.$.updatedAt'] = new Date();

    // Update in database
    const db = mongoose.connection.db;
    await db.collection('providers').updateOne(
      { 
        _id: new mongoose.Types.ObjectId(req.params.providerId),
        'services._id': new mongoose.Types.ObjectId(req.params.serviceId)
      },
      { $set: updateFields }
    );

    // Fetch updated service
    const updatedProvider = await db.collection('providers').findOne({
      _id: new mongoose.Types.ObjectId(req.params.providerId)
    });
    const updatedService = updatedProvider.services.find(
      s => s._id.toString() === req.params.serviceId
    );

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

/**
 * DELETE /api/providers/:providerId/services/:serviceId
 * Delete a service
 */
router.delete('/:providerId/services/:serviceId', getProvider, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const result = await db.collection('providers').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.providerId) },
      { $pull: { services: { _id: new mongoose.Types.ObjectId(req.params.serviceId) } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

/**
 * POST /api/providers/:providerId/services/:serviceId/variants
 * Add a variant to a service
 */
router.post('/:providerId/services/:serviceId/variants', getProvider, async (req, res) => {
  try {
    const { name, description, price, duration, isDefault = false } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name and price are required'
      });
    }

    const newVariant = {
      _id: new mongoose.Types.ObjectId(),
      name,
      description: description || '',
      price: parseFloat(price),
      duration: duration ? parseInt(duration) : null,
      isDefault
    };

    const db = mongoose.connection.db;
    await db.collection('providers').updateOne(
      { 
        _id: new mongoose.Types.ObjectId(req.params.providerId),
        'services._id': new mongoose.Types.ObjectId(req.params.serviceId)
      },
      { 
        $push: { 'services.$.variants': newVariant },
        $set: { 
          'services.$.hasVariants': true,
          'services.$.updatedAt': new Date()
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      variant: newVariant
    });
  } catch (error) {
    console.error('Error adding variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add variant'
    });
  }
});

/**
 * PUT /api/providers/:providerId/services/:serviceId/variants/:variantId
 * Update a variant
 */
router.put('/:providerId/services/:serviceId/variants/:variantId', getProvider, async (req, res) => {
  try {
    const { name, description, price, duration, isDefault } = req.body;

    // Find the service and variant
    const service = (req.provider.services || []).find(
      s => s._id.toString() === req.params.serviceId
    );
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const variantIndex = (service.variants || []).findIndex(
      v => v._id.toString() === req.params.variantId
    );
    if (variantIndex === -1) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    // Build update
    const updateObj = {};
    if (name !== undefined) updateObj[`services.$[s].variants.$[v].name`] = name;
    if (description !== undefined) updateObj[`services.$[s].variants.$[v].description`] = description;
    if (price !== undefined) updateObj[`services.$[s].variants.$[v].price`] = parseFloat(price);
    if (duration !== undefined) updateObj[`services.$[s].variants.$[v].duration`] = parseInt(duration);
    if (isDefault !== undefined) updateObj[`services.$[s].variants.$[v].isDefault`] = isDefault;
    updateObj['services.$[s].updatedAt'] = new Date();

    const db = mongoose.connection.db;
    await db.collection('providers').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.providerId) },
      { $set: updateObj },
      {
        arrayFilters: [
          { 's._id': new mongoose.Types.ObjectId(req.params.serviceId) },
          { 'v._id': new mongoose.Types.ObjectId(req.params.variantId) }
        ]
      }
    );

    res.json({
      success: true,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update variant'
    });
  }
});

/**
 * DELETE /api/providers/:providerId/services/:serviceId/variants/:variantId
 * Delete a variant
 */
router.delete('/:providerId/services/:serviceId/variants/:variantId', getProvider, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Pull the variant
    await db.collection('providers').updateOne(
      { 
        _id: new mongoose.Types.ObjectId(req.params.providerId),
        'services._id': new mongoose.Types.ObjectId(req.params.serviceId)
      },
      { 
        $pull: { 'services.$.variants': { _id: new mongoose.Types.ObjectId(req.params.variantId) } },
        $set: { 'services.$.updatedAt': new Date() }
      }
    );

    // Check if any variants remain
    const provider = await db.collection('providers').findOne({
      _id: new mongoose.Types.ObjectId(req.params.providerId)
    });
    const service = provider.services.find(s => s._id.toString() === req.params.serviceId);
    
    if (service && (!service.variants || service.variants.length === 0)) {
      await db.collection('providers').updateOne(
        { 
          _id: new mongoose.Types.ObjectId(req.params.providerId),
          'services._id': new mongoose.Types.ObjectId(req.params.serviceId)
        },
        { $set: { 'services.$.hasVariants': false } }
      );
    }

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant'
    });
  }
});

/**
 * PUT /api/providers/:providerId/services/reorder
 * Reorder services within a category
 */
router.put('/:providerId/services/reorder', getProvider, async (req, res) => {
  try {
    const { category, serviceIds } = req.body;

    if (!category || !serviceIds || !Array.isArray(serviceIds)) {
      return res.status(400).json({
        success: false,
        message: 'category and serviceIds array are required'
      });
    }

    const db = mongoose.connection.db;

    // Update sort order for each service
    for (let i = 0; i < serviceIds.length; i++) {
      await db.collection('providers').updateOne(
        { 
          _id: new mongoose.Types.ObjectId(req.params.providerId),
          'services._id': new mongoose.Types.ObjectId(serviceIds[i])
        },
        { 
          $set: { 
            'services.$.sortOrder': i,
            'services.$.updatedAt': new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Services reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder services'
    });
  }
});

module.exports = router;
