/**
 * Findr Health Booking Cron Jobs
 * 
 * Handles:
 * - 24h reminder to providers for pending requests
 * - 48h auto-cancellation of expired requests
 * - Appointment reminders to users (24h and 1h before)
 * 
 * Run with: node cron/bookingCron.js
 * Or use node-cron in server.js
 */

const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Provider = require('../models/Provider');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');

// ==================== PROCESS PENDING REQUESTS ====================

async function processPendingRequests() {
  console.log('[CRON] Processing pending booking requests...');
  
  try {
    const now = new Date();
    
    // Find pending requests
    const pendingBookings = await Booking.find({
      status: 'pending',
      'bookingRequest.isRequest': true
    }).populate('user provider');
    
    let reminded = 0;
    let expired = 0;
    
    for (const booking of pendingBookings) {
      const requestedAt = booking.bookingRequest.requestedAt;
      const hoursSince = (now - requestedAt) / (1000 * 60 * 60);
      
      // Check for expiration (48 hours)
      if (hoursSince >= 48) {
        await expireBookingRequest(booking);
        expired++;
      }
      // Check for 24h reminder
      else if (hoursSince >= 24 && !booking.bookingRequest.reminderSentAt) {
        await sendProviderReminder(booking);
        reminded++;
      }
    }
    
    console.log(`[CRON] Processed ${pendingBookings.length} pending requests: ${reminded} reminded, ${expired} expired`);
    
  } catch (error) {
    console.error('[CRON] Error processing pending requests:', error);
  }
}

async function expireBookingRequest(booking) {
  try {
    console.log(`[CRON] Expiring booking ${booking._id}...`);
    
    // Release the payment authorization
    if (booking.payment.stripePaymentIntentId) {
      await stripeService.cancelPaymentIntent(booking.payment.stripePaymentIntentId);
    }
    
    // Update booking status
    booking.status = 'expired';
    booking.payment.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'system',
      reason: 'Provider did not respond within 48 hours',
      feeAmount: 0,
      refundAmount: booking.payment.total
    };
    
    await booking.save();
    
    // Notify user
    const user = booking.user.email ? booking.user : await User.findById(booking.user);
    const provider = booking.provider.practiceName ? booking.provider : await Provider.findById(booking.provider);
    
    // TODO: Add expired booking email template
    await emailService.sendUserBookingCancelledByProvider(
      user.email,
      booking,
      provider
    );
    
    console.log(`[CRON] Booking ${booking._id} expired and user notified`);
    
  } catch (error) {
    console.error(`[CRON] Error expiring booking ${booking._id}:`, error);
  }
}

async function sendProviderReminder(booking) {
  try {
    console.log(`[CRON] Sending 24h reminder for booking ${booking._id}...`);
    
    const user = booking.user.email ? booking.user : await User.findById(booking.user);
    const provider = booking.provider.contactInfo ? booking.provider : await Provider.findById(booking.provider);
    const providerEmail = provider.contactInfo?.email || provider.email;
    
    if (providerEmail) {
      await emailService.sendProviderBookingRequestReminder(
        providerEmail,
        booking,
        user,
        24 // hours remaining
      );
    }
    
    // Mark reminder as sent
    booking.bookingRequest.reminderSentAt = new Date();
    await booking.save();
    
    console.log(`[CRON] Reminder sent for booking ${booking._id}`);
    
  } catch (error) {
    console.error(`[CRON] Error sending reminder for booking ${booking._id}:`, error);
  }
}

// ==================== APPOINTMENT REMINDERS ====================

async function sendAppointmentReminders() {
  console.log('[CRON] Sending appointment reminders...');
  
  try {
    const now = new Date();
    
    // 24 hours from now
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setMinutes(0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 60 * 60 * 1000); // 1 hour window
    
    // Find bookings 24 hours away
    const upcomingBookings = await Booking.find({
      status: 'confirmed',
      appointmentDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
      'reminders.dayBefore.sent': { $ne: true }
    }).populate('user provider');
    
    let sent = 0;
    
    for (const booking of upcomingBookings) {
      try {
        await emailService.sendAppointmentReminder(
          booking.user.email,
          booking,
          booking.provider,
          24
        );
        
        booking.reminders = booking.reminders || {};
        booking.reminders.dayBefore = { sent: true, sentAt: new Date() };
        await booking.save();
        
        sent++;
      } catch (err) {
        console.error(`[CRON] Error sending reminder for booking ${booking._id}:`, err);
      }
    }
    
    console.log(`[CRON] Sent ${sent} appointment reminders`);
    
  } catch (error) {
    console.error('[CRON] Error sending appointment reminders:', error);
  }
}

// ==================== 1 HOUR REMINDERS ====================

async function sendHourBeforeReminders() {
  console.log('[CRON] Sending 1-hour reminders...');
  
  try {
    const now = new Date();
    
    // 1 hour from now
    const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const hourStart = new Date(oneHour);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 15 * 60 * 1000); // 15 min window
    
    // Find bookings 1 hour away
    const upcomingBookings = await Booking.find({
      status: 'confirmed',
      appointmentDate: { $gte: hourStart, $lt: hourEnd },
      'reminders.hourBefore.sent': { $ne: true }
    }).populate('user provider');
    
    let sent = 0;
    
    for (const booking of upcomingBookings) {
      try {
        await emailService.sendAppointmentReminder(
          booking.user.email,
          booking,
          booking.provider,
          1
        );
        
        booking.reminders = booking.reminders || {};
        booking.reminders.hourBefore = { sent: true, sentAt: new Date() };
        await booking.save();
        
        sent++;
      } catch (err) {
        console.error(`[CRON] Error sending 1h reminder for booking ${booking._id}:`, err);
      }
    }
    
    console.log(`[CRON] Sent ${sent} 1-hour reminders`);
    
  } catch (error) {
    console.error('[CRON] Error sending 1-hour reminders:', error);
  }
}

// ==================== SCHEDULE CRON JOBS ====================

function scheduleCronJobs() {
  // Process pending requests every 15 minutes
  cron.schedule('*/15 * * * *', processPendingRequests);
  
  // Send 24h reminders every hour
  cron.schedule('0 * * * *', sendAppointmentReminders);
  
  // Send 1h reminders every 15 minutes
  cron.schedule('*/15 * * * *', sendHourBeforeReminders);
  
  console.log('[CRON] Booking cron jobs scheduled');
}

// ==================== MANUAL RUN (for testing) ====================

async function runAll() {
  console.log('[CRON] Running all cron jobs manually...');
  await processPendingRequests();
  await sendAppointmentReminders();
  await sendHourBeforeReminders();
  console.log('[CRON] Manual run complete');
}

module.exports = {
  scheduleCronJobs,
  processPendingRequests,
  sendAppointmentReminders,
  sendHourBeforeReminders,
  runAll
};

// If run directly
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await runAll();
      process.exit(0);
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}
