/**
 * Booking Jobs Scheduler
 * Findr Health - Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * Initialize this in your main server.js or app.js:
 *   require('./jobs/scheduler').init();
 */

const cron = require('node-cron');
const {
  processExpiredBookings,
  sendExpirationWarnings,
  cleanupSlotReservations,
  updateProviderStats
} = require('./expirationJob');

let isInitialized = false;

function init() {
  if (isInitialized) {
    console.log('[Scheduler] Already initialized');
    return;
  }
  
  console.log('[Scheduler] Initializing booking jobs...');
  
  // Process expired bookings every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processExpiredBookings();
    } catch (error) {
      console.error('[Scheduler] Expiration job failed:', error);
    }
  });
  console.log('[Scheduler] ✓ Expiration job: every 5 minutes');
  
  // Send expiration warnings every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await sendExpirationWarnings();
    } catch (error) {
      console.error('[Scheduler] Warning job failed:', error);
    }
  });
  console.log('[Scheduler] ✓ Warning job: every 30 minutes');
  
  // Cleanup slot reservations every minute (backup to TTL)
  cron.schedule('* * * * *', async () => {
    try {
      await cleanupSlotReservations();
    } catch (error) {
      console.error('[Scheduler] Cleanup job failed:', error);
    }
  });
  console.log('[Scheduler] ✓ Cleanup job: every minute');
  
  // Update provider stats every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      await updateProviderStats();
    } catch (error) {
      console.error('[Scheduler] Stats job failed:', error);
    }
  });
  console.log('[Scheduler] ✓ Stats job: every 6 hours');
  
  isInitialized = true;
  console.log('[Scheduler] ✅ All jobs scheduled');
}

module.exports = { init };
