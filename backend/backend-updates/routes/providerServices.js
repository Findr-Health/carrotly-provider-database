// Provider Services Routes - Additional endpoints for booking flow
// Add these routes to your existing providers.js or create as separate file

const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// ============================================
// GET /api/providers/:id/services/grouped
// Returns services grouped by category
// ============================================
router.get('/:id/services/grouped', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Get active services only
    const activeServices = (provider.services || []).filter(s => s.isActive !== false);
    
    // Group by category
    const grouped = {};
    const categoryOrder = [];
    
    activeServices.forEach(service => {
      const category = service.category || 'General';
      
      if (!grouped[category]) {
        grouped[category] = [];
        categoryOrder.push(category);
      }
      
      // Sort services within category by sortOrder
      grouped[category].push({
        id: service._id,
        name: service.name,
        description: service.description,
        shortDescription: service.shortDescription || (service.description ? service.description.substring(0, 100) : ''),
        category: category,
        duration: service.duration,
        price: service.price,
        basePrice: service.basePrice || service.price,
        hasVariants: service.hasVariants || false,
        variants: service.variants || [],
        sortOrder: service.sortOrder || 0
      });
    });
    
    // Sort services within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    
    // Build response with category metadata
    const categories = categoryOrder.map(category => ({
      name: category,
      serviceCount: grouped[category].length,
      services: grouped[category]
    }));
    
    res.json({
      providerId: provider._id,
      totalServices: activeServices.length,
      categories: categories
    });
    
  } catch (error) {
    console.error('Get grouped services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GET /api/providers/:id/team/for-service/:serviceId
// Returns team members who can perform a specific service
// ============================================
router.get('/:id/team/for-service/:serviceId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceId = req.params.serviceId;
    
    // Filter team members who:
    // 1. Accept bookings
    // 2. Have this service in their serviceIds (or have no serviceIds = can do all)
    const eligibleMembers = (provider.teamMembers || []).filter(member => {
      if (!member.acceptsBookings) return false;
      
      // If member has no serviceIds, they can perform all services
      if (!member.serviceIds || member.serviceIds.length === 0) {
        return true;
      }
      
      // Check if serviceId is in their list
      return member.serviceIds.includes(serviceId);
    });
    
    const formattedMembers = eligibleMembers.map(member => ({
      id: member._id,
      name: member.name,
      title: member.title,
      credentials: member.credentials,
      photo: member.photo,
      rating: member.rating || 0,
      reviewCount: member.reviewCount || 0,
      specialties: member.specialties || []
    }));
    
    res.json({
      providerId: provider._id,
      serviceId: serviceId,
      teamMembers: formattedMembers,
      totalCount: formattedMembers.length
    });
    
  } catch (error) {
    console.error('Get team for service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PUT /api/providers/:id/team/:memberId/services
// Update which services a team member can perform
// ============================================
router.put('/:id/team/:memberId/services', async (req, res) => {
  try {
    const { serviceIds } = req.body;
    
    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ error: 'serviceIds must be an array' });
    }
    
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Find the team member
    const memberIndex = provider.teamMembers.findIndex(
      m => m._id.toString() === req.params.memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    // Validate that all serviceIds exist in provider's services
    const validServiceIds = provider.services.map(s => s._id.toString());
    const invalidIds = serviceIds.filter(id => !validServiceIds.includes(id));
    
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid service IDs', 
        invalidIds: invalidIds 
      });
    }
    
    // Update the team member's serviceIds
    provider.teamMembers[memberIndex].serviceIds = serviceIds;
    provider.updatedAt = new Date();
    
    await provider.save();
    
    res.json({
      success: true,
      teamMember: {
        id: provider.teamMembers[memberIndex]._id,
        name: provider.teamMembers[memberIndex].name,
        serviceIds: provider.teamMembers[memberIndex].serviceIds
      }
    });
    
  } catch (error) {
    console.error('Update team member services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GET /api/providers/:id/team/:memberId/services
// Get services a team member can perform
// ============================================
router.get('/:id/team/:memberId/services', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Find the team member
    const member = provider.teamMembers.find(
      m => m._id.toString() === req.params.memberId
    );
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    // Get the services this member can perform
    let memberServices = [];
    
    if (!member.serviceIds || member.serviceIds.length === 0) {
      // No specific services = can do all active services
      memberServices = provider.services.filter(s => s.isActive !== false);
    } else {
      // Get only specified services
      memberServices = provider.services.filter(s => 
        s.isActive !== false && member.serviceIds.includes(s._id.toString())
      );
    }
    
    res.json({
      teamMemberId: member._id,
      teamMemberName: member.name,
      canPerformAllServices: !member.serviceIds || member.serviceIds.length === 0,
      services: memberServices.map(s => ({
        id: s._id,
        name: s.name,
        category: s.category,
        duration: s.duration,
        price: s.price
      }))
    });
    
  } catch (error) {
    console.error('Get team member services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PUT /api/providers/:id/services/:serviceId
// Update a service (including variants)
// ============================================
router.put('/:id/services/:serviceId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceIndex = provider.services.findIndex(
      s => s._id.toString() === req.params.serviceId
    );
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Update service fields
    const allowedFields = [
      'name', 'category', 'description', 'shortDescription',
      'duration', 'price', 'basePrice', 'hasVariants', 
      'variants', 'isActive', 'sortOrder'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        provider.services[serviceIndex][field] = req.body[field];
      }
    });
    
    // If hasVariants is true and basePrice not set, calculate from variants
    if (provider.services[serviceIndex].hasVariants && 
        provider.services[serviceIndex].variants?.length > 0 &&
        !req.body.basePrice) {
      const lowestPrice = Math.min(
        ...provider.services[serviceIndex].variants.map(v => v.price)
      );
      provider.services[serviceIndex].basePrice = lowestPrice;
    }
    
    provider.updatedAt = new Date();
    await provider.save();
    
    res.json({
      success: true,
      service: provider.services[serviceIndex]
    });
    
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// POST /api/providers/:id/services/:serviceId/variants
// Add a variant to a service
// ============================================
router.post('/:id/services/:serviceId/variants', async (req, res) => {
  try {
    const { name, description, price, duration, isDefault } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceIndex = provider.services.findIndex(
      s => s._id.toString() === req.params.serviceId
    );
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Initialize variants array if needed
    if (!provider.services[serviceIndex].variants) {
      provider.services[serviceIndex].variants = [];
    }
    
    // If this is the default, unset other defaults
    if (isDefault) {
      provider.services[serviceIndex].variants.forEach(v => {
        v.isDefault = false;
      });
    }
    
    // Add the variant
    provider.services[serviceIndex].variants.push({
      name,
      description,
      price,
      duration: duration || provider.services[serviceIndex].duration,
      isDefault: isDefault || provider.services[serviceIndex].variants.length === 0
    });
    
    // Update hasVariants flag
    provider.services[serviceIndex].hasVariants = true;
    
    // Update basePrice to lowest variant price
    const lowestPrice = Math.min(
      ...provider.services[serviceIndex].variants.map(v => v.price)
    );
    provider.services[serviceIndex].basePrice = lowestPrice;
    
    provider.updatedAt = new Date();
    await provider.save();
    
    res.json({
      success: true,
      service: provider.services[serviceIndex]
    });
    
  } catch (error) {
    console.error('Add variant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DELETE /api/providers/:id/services/:serviceId/variants/:variantId
// Remove a variant from a service
// ============================================
router.delete('/:id/services/:serviceId/variants/:variantId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceIndex = provider.services.findIndex(
      s => s._id.toString() === req.params.serviceId
    );
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Remove the variant
    provider.services[serviceIndex].variants = 
      (provider.services[serviceIndex].variants || []).filter(
        v => v._id.toString() !== req.params.variantId
      );
    
    // Update hasVariants flag
    if (provider.services[serviceIndex].variants.length === 0) {
      provider.services[serviceIndex].hasVariants = false;
      provider.services[serviceIndex].basePrice = provider.services[serviceIndex].price;
    } else {
      // Update basePrice to lowest remaining variant price
      const lowestPrice = Math.min(
        ...provider.services[serviceIndex].variants.map(v => v.price)
      );
      provider.services[serviceIndex].basePrice = lowestPrice;
    }
    
    provider.updatedAt = new Date();
    await provider.save();
    
    res.json({
      success: true,
      service: provider.services[serviceIndex]
    });
    
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
