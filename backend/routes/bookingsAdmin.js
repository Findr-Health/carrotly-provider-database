const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-admin-secret-2025';

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id || decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Get booking stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' })
    ]);
    
    // Calculate total revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const revenue = revenueResult[0]?.total || 0;
    
    res.json({ total, pending, confirmed, completed, cancelled, revenue });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all bookings (with filters)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, providerId, userId, page = 1, limit = 50, startDate, endDate } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (providerId) filter.providerId = providerId;
    if (userId) filter.userId = userId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }
    
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo')
      .populate('teamMember', 'name title profilePhoto email phone serviceIds')
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get single booking
router.get('/:bookingId', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo address')
      .populate('reviewId')
      .populate('teamMember', 'name title profilePhoto email phone serviceIds calendar');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Update booking status
router.patch('/:bookingId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = { status };
    
    // Set additional fields based on status
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = 'admin';
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email')
     .populate('providerId', 'practiceName')
     .populate('teamMember', 'name title');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // TODO: Send notification to user about status change
    
    res.json({ message: 'Status updated', booking });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Process refund
router.post('/:bookingId/refund', adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;  // Optional: partial refund amount
    
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Booking has not been paid' });
    }
    
    const refundAmount = amount || booking.totalAmount;
    
    // TODO: Process actual Stripe refund here
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // await stripe.refunds.create({
    //   payment_intent: booking.stripePaymentIntentId,
    //   amount: refundAmount * 100
    // });
    
    booking.paymentStatus = refundAmount === booking.totalAmount ? 'refunded' : 'partially_refunded';
    booking.refundAmount = refundAmount;
    booking.refundedAt = new Date();
    await booking.save();
    
    res.json({ 
      message: 'Refund processed', 
      refundAmount,
      booking 
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Add admin note to booking
router.patch('/:bookingId/notes', adminAuth, async (req, res) => {
  try {
    const { providerNotes } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { providerNotes },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Notes updated', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// Get upcoming bookings (for dashboard widget)
router.get('/upcoming/today', adminAuth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.find({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('userId', 'firstName lastName')
    .populate('providerId', 'practiceName')
    .sort({ appointmentDate: 1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get today\'s bookings' });
  }
});

module.exports = router;
