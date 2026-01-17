// backend/routes/notifications.js
// Notification API routes for Findr Health

const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Provider = require('../models/Provider');
const { authenticateToken } = require('../middleware/auth');

/**
 * Helper to format date for notifications
 */
function formatDate(date) {
  if (!date) return 'TBD';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(time) {
  if (!time) return 'TBD';
  // Handle both Date objects and time strings
  if (time instanceof Date) {
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return time;
}

// ============================================================================
// NOTIFICATION TRIGGER ENDPOINTS
// ============================================================================

/**
 * POST /api/notifications/booking-created
 * Triggered when a new booking request is created
 */
router.post('/booking-created', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const isRequest = booking.bookingRequest?.isRequest || !booking.provider.calendarConnected;
    
    // Notify patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_request_sent',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        amount: booking.payment?.amount || 0,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    // Notify provider (for request bookings)
    if (isRequest) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await NotificationService.send({
        recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
          name: booking.provider.practiceName,
          fcmToken: booking.provider.fcmToken
        },
        template: 'new_booking_request',
        data: {
          providerName: booking.provider.practiceName,
          patientName: booking.user.name,
          serviceName: booking.service?.name || 'Appointment',
          appointmentDate: formatDate(booking.appointmentDate),
          appointmentTime: booking.appointmentTime,
          amount: booking.payment?.amount || 0,
          expiresAt: formatDate(expiresAt) + ' ' + formatTime(expiresAt),
          bookingId: booking._id.toString()
        },
        channels: ['email', 'push']
      });
    }
    
    res.json({ success: true, message: 'Notifications sent' });
  } catch (error) {
    console.error('[Notifications] booking-created error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/booking-confirmed
 * Triggered when provider confirms a booking
 */
router.post('/booking-confirmed', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_confirmed_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        confirmationCode: booking.confirmationCode,
        providerAddress: booking.provider.location?.formattedAddress,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Confirmation notification sent' });
  } catch (error) {
    console.error('[Notifications] booking-confirmed error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/booking-declined
 * Triggered when provider declines a booking
 */
router.post('/booking-declined', authenticateToken, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_declined_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        declineReason: reason,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Decline notification sent' });
  } catch (error) {
    console.error('[Notifications] booking-declined error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/reschedule-proposed
 * Triggered when provider proposes a new time
 */
router.post('/reschedule-proposed', authenticateToken, async (req, res) => {
  try {
    const { bookingId, proposedDate, proposedTime, message } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'reschedule_proposed_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        originalDate: formatDate(booking.appointmentDate),
        originalTime: booking.appointmentTime,
        proposedDate: formatDate(proposedDate),
        proposedTime: proposedTime,
        message: message,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Reschedule proposal notification sent' });
  } catch (error) {
    console.error('[Notifications] reschedule-proposed error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/reschedule-accepted
 * Triggered when patient accepts reschedule
 */
router.post('/reschedule-accepted', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify provider
    await NotificationService.send({
      recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
        name: booking.provider.practiceName,
        fcmToken: booking.provider.fcmToken
      },
      template: 'reschedule_accepted_provider',
      data: {
        providerName: booking.provider.practiceName,
        patientName: booking.user.name,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    // Also send confirmation to patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_confirmed_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        confirmationCode: booking.confirmationCode,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Reschedule acceptance notifications sent' });
  } catch (error) {
    console.error('[Notifications] reschedule-accepted error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/reschedule-declined
 * Triggered when patient declines reschedule (cancels booking)
 */
router.post('/reschedule-declined', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify provider
    await NotificationService.send({
      recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
        name: booking.provider.practiceName,
        fcmToken: booking.provider.fcmToken
      },
      template: 'reschedule_declined_provider',
      data: {
        providerName: booking.provider.practiceName,
        patientName: booking.user.name,
        serviceName: booking.service?.name || 'Appointment',
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    // Notify patient of cancellation
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_cancelled_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        appointmentDate: formatDate(booking.appointmentDate),
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Reschedule decline notifications sent' });
  } catch (error) {
    console.error('[Notifications] reschedule-declined error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/booking-cancelled
 * Triggered when booking is cancelled by either party
 */
router.post('/booking-cancelled', authenticateToken, async (req, res) => {
  try {
    const { bookingId, cancelledBy, reason } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify the OTHER party
    if (cancelledBy === 'patient') {
      await NotificationService.send({
        recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
          name: booking.provider.practiceName,
          fcmToken: booking.provider.fcmToken
        },
        template: 'booking_cancelled_provider',
        data: {
          providerName: booking.provider.practiceName,
          patientName: booking.user.name,
          serviceName: booking.service?.name || 'Appointment',
          appointmentDate: formatDate(booking.appointmentDate),
          reason: reason,
          bookingId: booking._id.toString()
        },
        channels: ['email', 'push']
      });
    } else {
      await NotificationService.send({
        recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
          name: booking.user.name,
          fcmToken: booking.user.fcmToken
        },
        template: 'booking_cancelled_patient',
        data: {
          patientName: booking.user.name,
          providerName: booking.provider.practiceName,
          serviceName: booking.service?.name || 'Appointment',
          appointmentDate: formatDate(booking.appointmentDate),
          cancelledBy: 'provider',
          refundAmount: booking.payment?.amount,
          bookingId: booking._id.toString()
        },
        channels: ['email', 'push']
      });
    }
    
    res.json({ success: true, message: 'Cancellation notification sent' });
  } catch (error) {
    console.error('[Notifications] booking-cancelled error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/booking-expired
 * Triggered when booking expires (24hr timeout)
 */
router.post('/booking-expired', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify patient
    await NotificationService.send({
      recipient: {
        id: booking.user._id,
        type: 'user',
        email: booking.user.email,
        name: booking.user.name,
        fcmToken: booking.user.fcmToken
      },
      template: 'booking_expired_patient',
      data: {
        patientName: booking.user.name,
        providerName: booking.provider.practiceName,
        serviceName: booking.service?.name || 'Appointment',
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    // Notify provider
    await NotificationService.send({
      recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
        name: booking.provider.practiceName
      },
      template: 'booking_expiring_reminder', // Reuse template
      data: {
        providerName: booking.provider.practiceName,
        patientName: booking.user.name,
        serviceName: booking.service?.name || 'Appointment',
        hoursRemaining: 0,
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        bookingId: booking._id.toString()
      },
      channels: ['email']
    });
    
    res.json({ success: true, message: 'Expiration notifications sent' });
  } catch (error) {
    console.error('[Notifications] booking-expired error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/expiring-reminder
 * Triggered 2 hours before request expires
 */
router.post('/expiring-reminder', authenticateToken, async (req, res) => {
  try {
    const { bookingId, hoursRemaining } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('provider');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Notify provider only
    await NotificationService.send({
      recipient: {
        id: booking.provider._id,
        type: 'provider',
        email: booking.provider.email,
        name: booking.provider.practiceName,
        fcmToken: booking.provider.fcmToken
      },
      template: 'booking_expiring_reminder',
      data: {
        providerName: booking.provider.practiceName,
        patientName: booking.user.name,
        serviceName: booking.service?.name || 'Appointment',
        hoursRemaining: hoursRemaining || 2,
        appointmentDate: formatDate(booking.appointmentDate),
        appointmentTime: booking.appointmentTime,
        bookingId: booking._id.toString()
      },
      channels: ['email', 'push']
    });
    
    res.json({ success: true, message: 'Expiring reminder sent' });
  } catch (error) {
    console.error('[Notifications] expiring-reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// ============================================================================
// IN-APP NOTIFICATION CENTER ENDPOINTS
// ============================================================================

const Notification = require('../models/Notification');

/**
 * GET /api/notifications/user/:userId
 * Get all notifications for a user
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const query = { 
      recipientId: userId, 
      recipientType: 'User' 
    };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId, 'User');
    
    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: parseInt(offset) + notifications.length < total
    });
  } catch (error) {
    console.error('[Notifications] Error fetching user notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/provider/:providerId
 * Get all notifications for a provider
 */
router.get('/provider/:providerId', authenticateToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const query = { 
      recipientId: providerId, 
      recipientType: 'Provider' 
    };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(providerId, 'Provider');
    
    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: parseInt(offset) + notifications.length < total
    });
  } catch (error) {
    console.error('[Notifications] Error fetching provider notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count/:recipientType/:recipientId
 * Get unread notification count (for badge)
 */
router.get('/unread-count/:recipientType/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;
    const type = recipientType === 'user' ? 'User' : 'Provider';
    
    const count = await Notification.getUnreadCount(recipientId, type);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PATCH /api/notifications/read-all/:recipientType/:recipientId
 * Mark all notifications as read for a recipient
 */
router.patch('/read-all/:recipientType/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;
    const type = recipientType === 'user' ? 'User' : 'Provider';
    
    const result = await Notification.updateMany(
      { recipientId, recipientType: type, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ 
      success: true, 
      markedAsRead: result.modifiedCount 
    });
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});
