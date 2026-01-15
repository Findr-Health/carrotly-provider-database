/**
 * Booking Expiration Job
 * Findr Health - Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * This job:
 * 1. Finds expired pending_confirmation bookings
 * 2. Releases payment holds
 * 3. Updates booking status
 * 4. Sends notifications
 * 5. Updates provider stats
 * 
 * Run every 5 minutes via cron
 */

const Booking = require('../models/Booking');
const BookingEvent = require('../models/BookingEvent');
const Provider = require('../models/Provider');

// Import Stripe if available
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.log('[ExpirationJob] Stripe not configured');
}

/**
 * Process expired bookings
 */
async function processExpiredBookings() {
  const startTime = Date.now();
  console.log(`[ExpirationJob] Starting at ${new Date().toISOString()}`);
  
  try {
    // Find expired pending confirmations
    const expiredBookings = await Booking.find({
      status: 'pending_confirmation',
      'confirmation.expiresAt': { $lt: new Date() }
    }).populate('patient provider');
    
    console.log(`[ExpirationJob] Found ${expiredBookings.length} expired bookings`);
    
    let processed = 0;
    let errors = 0;
    
    for (const booking of expiredBookings) {
      try {
        await processExpiredBooking(booking);
        processed++;
      } catch (error) {
        console.error(`[ExpirationJob] Error processing booking ${booking._id}:`, error);
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[ExpirationJob] Completed in ${duration}ms. Processed: ${processed}, Errors: ${errors}`);
    
    return { processed, errors, duration };
    
  } catch (error) {
    console.error('[ExpirationJob] Fatal error:', error);
    throw error;
  }
}

/**
 * Process a single expired booking
 */
async function processExpiredBooking(booking) {
  const previousStatus = booking.status;
  
  // 1. Release payment hold if exists
  if (stripe && booking.payment?.paymentIntentId && booking.payment?.status === 'held') {
    try {
      await stripe.paymentIntents.cancel(booking.payment.paymentIntentId);
      booking.payment.status = 'cancelled';
      booking.payment.hold.cancelledAt = new Date();
      booking.payment.hold.cancelReason = 'Booking request expired - provider did not respond';
      console.log(`[ExpirationJob] Released payment hold for ${booking.bookingNumber}`);
    } catch (stripeError) {
      console.error(`[ExpirationJob] Stripe error for ${booking.bookingNumber}:`, stripeError.message);
      // Continue anyway - payment will auto-expire
    }
  }
  
  // 2. Update booking status
  booking.status = 'expired';
  booking.confirmation.responseType = 'expired';
  await booking.save();
  
  // 3. Log event
  await BookingEvent.create({
    booking: booking._id,
    bookingNumber: booking.bookingNumber,
    eventType: 'expired',
    previousStatus,
    newStatus: 'expired',
    data: {
      reason: 'Provider did not respond within deadline',
      expiresAt: booking.confirmation.expiresAt
    },
    actor: { type: 'system' },
    context: { source: 'cron' },
    timestamp: new Date()
  });
  
  // 4. Update provider stats
  await Provider.findByIdAndUpdate(booking.provider._id || booking.provider, {
    $inc: { 'bookingStats.totalExpired': 1 }
  });
  
  // 5. TODO: Send notifications
  // - Email patient: "Your booking request has expired. Payment hold released."
  // - Email provider: "A booking request has expired."
  
  console.log(`[ExpirationJob] Expired booking ${booking.bookingNumber}`);
}

/**
 * Send expiration warnings (bookings expiring in 4 hours)
 */
async function sendExpirationWarnings() {
  const startTime = Date.now();
  console.log(`[WarningJob] Starting at ${new Date().toISOString()}`);
  
  try {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    // Find bookings expiring soon that haven't been warned
    const expiringBookings = await Booking.find({
      status: 'pending_confirmation',
      'confirmation.expiresAt': { $gt: now, $lt: fourHoursFromNow },
      'notifications.provider.expiringWarning.sent': { $ne: true }
    }).populate('patient provider');
    
    console.log(`[WarningJob] Found ${expiringBookings.length} bookings expiring soon`);
    
    for (const booking of expiringBookings) {
      try {
        // TODO: Send warning notification to provider
        console.log(`[WarningJob] Sending warning for ${booking.bookingNumber}`);
        
        // Mark as warned
        booking.notifications = booking.notifications || { provider: {} };
        booking.notifications.provider.expiringWarning = {
          sent: true,
          sentAt: new Date()
        };
        booking.confirmation.remindersSent = (booking.confirmation.remindersSent || 0) + 1;
        await booking.save();
        
        // Log event
        await BookingEvent.create({
          booking: booking._id,
          bookingNumber: booking.bookingNumber,
          eventType: 'notification_sent',
          data: { type: 'expiration_warning', channel: 'email' },
          actor: { type: 'system' },
          context: { source: 'cron' },
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error(`[WarningJob] Error warning ${booking._id}:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[WarningJob] Completed in ${duration}ms. Warned: ${expiringBookings.length}`);
    
    return { warned: expiringBookings.length, duration };
    
  } catch (error) {
    console.error('[WarningJob] Fatal error:', error);
    throw error;
  }
}

/**
 * Clean up expired slot reservations (backup to TTL)
 */
async function cleanupSlotReservations() {
  try {
    const SlotReservation = require('../models/SlotReservation');
    const cleaned = await SlotReservation.cleanupExpired();
    if (cleaned > 0) {
      console.log(`[CleanupJob] Cleaned ${cleaned} expired slot reservations`);
    }
    return { cleaned };
  } catch (error) {
    console.error('[CleanupJob] Error:', error);
    return { cleaned: 0, error: error.message };
  }
}

/**
 * Update provider booking stats
 */
async function updateProviderStats() {
  const startTime = Date.now();
  console.log(`[StatsJob] Starting at ${new Date().toISOString()}`);
  
  try {
    const Provider = require('../models/Provider');
    const providers = await Provider.find({ status: 'approved' });
    
    for (const provider of providers) {
      try {
        // Aggregate booking stats
        const stats = await Booking.aggregate([
          { $match: { provider: provider._id } },
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              confirmed: {
                $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed', 'checked_in', 'in_progress']] }, 1, 0] }
              },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              expired: {
                $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
              },
              avgResponseTime: {
                $avg: {
                  $cond: [
                    { $and: [
                      { $ne: ['$confirmation.respondedAt', null] },
                      { $ne: ['$confirmation.requestedAt', null] }
                    ]},
                    { $subtract: ['$confirmation.respondedAt', '$confirmation.requestedAt'] },
                    null
                  ]
                }
              },
              totalRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ['$payment.status', 'captured'] },
                    '$payment.capturedAmount',
                    0
                  ]
                }
              }
            }
          }
        ]);
        
        if (stats.length > 0) {
          const s = stats[0];
          provider.bookingStats = {
            totalRequests: s.totalRequests || 0,
            totalConfirmed: s.confirmed || 0,
            totalCompleted: s.completed || 0,
            totalExpired: s.expired || 0,
            avgResponseTimeMinutes: s.avgResponseTime ? s.avgResponseTime / 60000 : null,
            confirmationRate: s.totalRequests > 0 ? (s.confirmed / s.totalRequests * 100) : null,
            totalRevenue: s.totalRevenue || 0,
            lastCalculatedAt: new Date()
          };
          await provider.save();
        }
        
      } catch (error) {
        console.error(`[StatsJob] Error updating provider ${provider._id}:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[StatsJob] Completed in ${duration}ms. Updated: ${providers.length} providers`);
    
    return { updated: providers.length, duration };
    
  } catch (error) {
    console.error('[StatsJob] Fatal error:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  processExpiredBookings,
  sendExpirationWarnings,
  cleanupSlotReservations,
  updateProviderStats
};

// CLI execution
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  const command = process.argv[2] || 'expire';
  
  async function run() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_PUBLIC_URL;
    if (!mongoUri) {
      console.error('MongoDB URI not set');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    try {
      switch (command) {
        case 'expire':
          await processExpiredBookings();
          break;
        case 'warn':
          await sendExpirationWarnings();
          break;
        case 'cleanup':
          await cleanupSlotReservations();
          break;
        case 'stats':
          await updateProviderStats();
          break;
        case 'all':
          await processExpiredBookings();
          await sendExpirationWarnings();
          await cleanupSlotReservations();
          break;
        default:
          console.log('Usage: node expirationJob.js [expire|warn|cleanup|stats|all]');
      }
    } finally {
      await mongoose.disconnect();
    }
  }
  
  run().catch(console.error);
}
