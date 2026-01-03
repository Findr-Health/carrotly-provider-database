const express = require('express');
const router = express.Router();
const ServiceTemplate = require('../models/ServiceTemplate');

/**
 * GET /api/service-templates
 * Get service templates for a provider type
 * Query params: providerType (required), category (optional), popular (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { providerType, category, popular } = req.query;

    if (!providerType) {
      return res.status(400).json({
        success: false,
        message: 'providerType is required'
      });
    }

    // Build query
    const query = { providerType, isActive: true };
    if (category) {
      query.category = category;
    }
    if (popular === 'true') {
      query.isPopular = true;
    }

    const templates = await ServiceTemplate.find(query)
      .sort({ category: 1, sortOrder: 1 })
      .lean();

    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Error fetching service templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service templates'
    });
  }
});

/**
 * GET /api/service-templates/categories
 * Get allowed categories for a provider type
 * Query params: providerType (required)
 */
router.get('/categories', async (req, res) => {
  try {
    const { providerType } = req.query;

    if (!providerType) {
      return res.status(400).json({
        success: false,
        message: 'providerType is required'
      });
    }

    const categories = ServiceTemplate.getCategoriesForProviderType(providerType);

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown provider type: ${providerType}`
      });
    }

    res.json({
      success: true,
      providerType,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * GET /api/service-templates/grouped
 * Get templates grouped by category for a provider type
 * Query params: providerType (required)
 */
router.get('/grouped', async (req, res) => {
  try {
    const { providerType } = req.query;

    if (!providerType) {
      return res.status(400).json({
        success: false,
        message: 'providerType is required'
      });
    }

    const templates = await ServiceTemplate.find({ providerType, isActive: true })
      .sort({ category: 1, sortOrder: 1 })
      .lean();

    // Group by category
    const grouped = {};
    const categories = ServiceTemplate.getCategoriesForProviderType(providerType);
    
    // Initialize all categories (even if empty)
    categories.forEach(cat => {
      grouped[cat] = [];
    });

    // Populate with templates
    templates.forEach(template => {
      if (grouped[template.category]) {
        grouped[template.category].push(template);
      }
    });

    res.json({
      success: true,
      providerType,
      categories,
      grouped
    });
  } catch (error) {
    console.error('Error fetching grouped templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grouped templates'
    });
  }
});

/**
 * GET /api/service-templates/popular
 * Get popular/recommended templates for quick onboarding
 * Query params: providerType (required)
 */
router.get('/popular', async (req, res) => {
  try {
    const { providerType } = req.query;

    if (!providerType) {
      return res.status(400).json({
        success: false,
        message: 'providerType is required'
      });
    }

    const templates = await ServiceTemplate.find({
      providerType,
      isPopular: true,
      isActive: true
    })
      .sort({ sortOrder: 1 })
      .lean();

    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular templates'
    });
  }
});

/**
 * GET /api/service-templates/:id
 * Get a single service template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await ServiceTemplate.findById(req.params.id).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
});

/**
 * POST /api/service-templates/bulk-create-services
 * Create multiple services from templates for a provider
 * Body: { providerId, templateIds, customizations }
 * customizations: { [templateId]: { price, duration } }
 */
router.post('/bulk-create-services', async (req, res) => {
  try {
    const { providerId, templateIds, customizations = {} } = req.body;

    if (!providerId || !templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({
        success: false,
        message: 'providerId and templateIds array are required'
      });
    }

    // Fetch the templates
    const templates = await ServiceTemplate.find({
      _id: { $in: templateIds }
    }).lean();

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No templates found'
      });
    }

    // Convert templates to services
    const services = templates.map(template => {
      const custom = customizations[template._id.toString()] || {};
      
      return {
        name: template.name,
        description: template.description,
        shortDescription: template.shortDescription,
        category: template.category,
        basePrice: custom.price || template.suggestedPriceMin,
        duration: custom.duration || template.suggestedDuration,
        hasVariants: template.suggestedVariants && template.suggestedVariants.length > 0,
        variants: template.suggestedVariants ? template.suggestedVariants.map(v => ({
          name: v.name,
          description: v.description,
          price: (custom.price || template.suggestedPriceMin) + v.priceModifier,
          duration: (custom.duration || template.suggestedDuration) + v.durationModifier,
          isDefault: false
        })) : [],
        isActive: true,
        sortOrder: template.sortOrder
      };
    });

    // Return the services to be added to the provider
    // The actual provider update happens in the provider routes
    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Error creating services from templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create services from templates'
    });
  }
});

module.exports = router;
