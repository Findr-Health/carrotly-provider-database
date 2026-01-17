// backend/models/Notification.js
// In-App Notification model for Findr Health

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    enum: ['User', 'Provider'],
    required: true
  },
  
  // Notification content
  type: {
    type: String,
    enum: [
      'booking_request_received',    // Provider gets new request
      'booking_confirmed',           // User gets confirmation
      'booking_declined',            // User gets decline
      'booking_cancelled_by_user',   // Provider gets cancellation
      'booking_cancelled_by_provider', // User gets cancellation
      'reschedule_proposed',         // User gets reschedule offer
      'reschedule_accepted',         // Provider gets acceptance
      'reschedule_declined',         // Provider gets decline
      'booking_reminder',            // Both get reminder
      'booking_expired',             // Both get expiration notice
      'payment_received',            // Provider gets payment
      'review_received'              // Provider gets review
    ],
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  body: {
    type: String,
    required: true
  },
  
  // Related data for deep linking
  data: {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    actionUrl: String,  // Deep link path e.g., '/bookings/123'
    actionLabel: String // e.g., 'View Booking', 'Respond Now'
  },
  
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Priority for sorting/display
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Expiration (optional - for time-sensitive notifications)
  expiresAt: Date

}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipientId: 1, recipientType: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  console.log(`[Notification] Created: ${data.type} for ${data.recipientType} ${data.recipientId}`);
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId, recipientType) {
  return this.countDocuments({ 
    recipientId, 
    recipientType, 
    read: false 
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
