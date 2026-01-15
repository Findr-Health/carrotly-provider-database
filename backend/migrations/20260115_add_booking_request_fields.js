/**
 * Migration: Add Calendar-Optional Booking Fields
 * Findr Health
 * Created: January 15, 2026
 * 
 * This migration:
 * 1. Updates existing bookings with new fields
 * 2. Updates providers with booking settings
 * 3. Creates indexes for new queries
 * 4. Creates BookingEvents collection
 * 5. Creates SlotReservations collection with TTL
 * 
 * Run with: node migrations/20260115_add_booking_request_fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Migration metadata
const MIGRATION_NAME = '20260115_add_booking_request_fields';
const MIGRATION_VERSION = '2.0';

async function up() {
  console.log(`\n🚀 Starting migration: ${MIGRATION_NAME}`);
  console.log(`Version: ${MIGRATION_VERSION}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  const db = mongoose.connection.db;
  
  try {
    // ========== STEP 1: Update Existing Bookings ==========
    console.log('📦 Step 1: Updating existing bookings...');
    
    const bookingUpdateResult = await db.collection('bookings').updateMany(
      { bookingType: { $exists: false } },
      {
        $set: {
          // Set booking type - all existing are instant
          bookingType: 'instant',
          
          // Confirmation tracking
          'confirmation.required': false,
          'confirmation.requestedAt': null,
          'confirmation.expiresAt': null,
          'confirmation.respondedAt': null,
          'confirmation.responseType': null,
          'confirmation.remindersSent': 0,
          
          // Reschedule tracking
          'reschedule.count': 0,
          'reschedule.maxAttempts': 2,
          'reschedule.current': null,
          'reschedule.history': [],
          
          // Payment enhancements
          'payment.mode': 'prepay',
          'payment.hold': {
            createdAt: null,
            expiresAt: null,
            capturedAt: null,
            cancelledAt: null,
            cancelReason: null
          },
          
          // Slot reservation (not applicable for existing)
          'slotReservation.released': true,
          'slotReservation.releasedReason': 'legacy_booking',
          
          // Calendar sync status for existing
          'calendar.syncStatus': 'not_applicable',
          
          // Versioning for optimistic concurrency
          version: 1
        }
      }
    );
    
    console.log(`   ✓ Updated ${bookingUpdateResult.modifiedCount} bookings`);
    
    // ========== STEP 2: Update Existing Providers ==========
    console.log('\n📦 Step 2: Updating providers with booking settings...');
    
    // First, add default booking settings to all providers
    const providerDefaultResult = await db.collection('providers').updateMany(
      { 'bookingSettings.mode': { $exists: false } },
      {
        $set: {
          // Timezone (default to Mountain)
          timezone: 'America/Denver',
          
          // Booking settings
          'bookingSettings.mode': 'request',  // Will update below based on calendar
          'bookingSettings.modeOverride': false,
          'bookingSettings.autoConfirm': {
            enabled: false,
            maxDailyAutoConfirm: 10,
            autoConfirmedToday: 0,
            lastResetDate: null
          },
          'bookingSettings.confirmationDeadlineHours': 24,
          'bookingSettings.minimumNoticeHours': 24,
          'bookingSettings.maximumAdvanceDays': 60,
          'bookingSettings.bufferMinutes': 15,
          'bookingSettings.allowReschedule': true,
          'bookingSettings.maxRescheduleAttempts': 2,
          'bookingSettings.rescheduleNoticeHours': 24,
          'bookingSettings.allowCancellation': true,
          'bookingSettings.cancellationNoticeHours': 24,
          'bookingSettings.cancellationFeePercent': 0,
          'bookingSettings.slotDurationMinutes': 30,
          'bookingSettings.allowMultipleServices': false,
          
          // Booking stats
          'bookingStats.totalRequests': 0,
          'bookingStats.totalConfirmed': 0,
          'bookingStats.totalCompleted': 0,
          'bookingStats.totalCancelled': 0,
          'bookingStats.totalExpired': 0,
          'bookingStats.totalNoShow': 0,
          'bookingStats.avgResponseTimeMinutes': null,
          'bookingStats.confirmationRate': null,
          'bookingStats.completionRate': null,
          'bookingStats.totalRevenue': 0,
          'bookingStats.lastCalculatedAt': null,
          
          // Notification preferences
          'notificationPreferences.channels': {
            email: true,
            push: true,
            sms: false
          },
          'notificationPreferences.quietHours': {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          'notificationPreferences.frequency': {
            newBookingRequest: 'immediate',
            expiringReminder: true
          },
          
          // Trust score
          'trustScore.score': 100,
          'trustScore.lastCalculatedAt': null
        }
      }
    );
    
    console.log(`   ✓ Added default settings to ${providerDefaultResult.modifiedCount} providers`);
    
    // Set mode based on calendar connection
    const instantModeResult = await db.collection('providers').updateMany(
      { calendarConnected: true },
      { $set: { 'bookingSettings.mode': 'instant' } }
    );
    
    console.log(`   ✓ Set ${instantModeResult.modifiedCount} providers to 'instant' mode (calendar connected)`);
    
    const requestModeResult = await db.collection('providers').updateMany(
      { calendarConnected: { $ne: true } },
      { $set: { 'bookingSettings.mode': 'request' } }
    );
    
    console.log(`   ✓ Set ${requestModeResult.modifiedCount} providers to 'request' mode (no calendar)`);
    
    // ========== STEP 3: Create Indexes ==========
    console.log('\n📦 Step 3: Creating indexes...');
    
    // Booking indexes
    const bookingIndexes = [
      {
        key: { provider: 1, status: 1, 'confirmation.expiresAt': 1 },
        name: 'pending_expiration_lookup'
      },
      {
        key: { 'payment.paymentIntentId': 1 },
        name: 'payment_intent_lookup',
        sparse: true
      },
      {
        key: { bookingType: 1, status: 1, createdAt: -1 },
        name: 'booking_type_status_lookup'
      },
      {
        key: { patient: 1, status: 1, 'dateTime.requestedStart': -1 },
        name: 'patient_bookings_lookup'
      },
      {
        key: { provider: 1, 'dateTime.requestedStart': 1, 'dateTime.requestedEnd': 1 },
        name: 'provider_schedule_lookup'
      }
    ];
    
    for (const idx of bookingIndexes) {
      try {
        await db.collection('bookings').createIndex(idx.key, { 
          name: idx.name,
          sparse: idx.sparse || false,
          background: true
        });
        console.log(`   ✓ Created index: ${idx.name}`);
      } catch (err) {
        if (err.code === 85 || err.code === 86) {
          console.log(`   ⚠ Index ${idx.name} already exists (skipped)`);
        } else {
          throw err;
        }
      }
    }
    
    // ========== STEP 4: Create BookingEvents Collection ==========
    console.log('\n📦 Step 4: Creating BookingEvents collection...');
    
    try {
      await db.createCollection('bookingevents');
      console.log('   ✓ Created bookingevents collection');
    } catch (err) {
      if (err.code === 48) {
        console.log('   ⚠ bookingevents collection already exists (skipped)');
      } else {
        throw err;
      }
    }
    
    // BookingEvents indexes
    const eventIndexes = [
      { key: { booking: 1, timestamp: -1 }, name: 'booking_history' },
      { key: { eventType: 1, timestamp: -1 }, name: 'event_type_lookup' },
      { key: { 'actor.userId': 1, timestamp: -1 }, name: 'actor_lookup' },
      { key: { bookingNumber: 1, timestamp: -1 }, name: 'booking_number_lookup' }
    ];
    
    for (const idx of eventIndexes) {
      try {
        await db.collection('bookingevents').createIndex(idx.key, { 
          name: idx.name,
          background: true
        });
        console.log(`   ✓ Created index: ${idx.name}`);
      } catch (err) {
        if (err.code === 85 || err.code === 86) {
          console.log(`   ⚠ Index ${idx.name} already exists (skipped)`);
        } else {
          throw err;
        }
      }
    }
    
    // ========== STEP 5: Create SlotReservations Collection ==========
    console.log('\n📦 Step 5: Creating SlotReservations collection...');
    
    try {
      await db.createCollection('slotreservations');
      console.log('   ✓ Created slotreservations collection');
    } catch (err) {
      if (err.code === 48) {
        console.log('   ⚠ slotreservations collection already exists (skipped)');
      } else {
        throw err;
      }
    }
    
    // SlotReservations indexes (including TTL)
    const slotIndexes = [
      { 
        key: { expiresAt: 1 }, 
        name: 'slot_ttl',
        expireAfterSeconds: 0  // TTL index
      },
      { 
        key: { provider: 1, startTime: 1, endTime: 1, status: 1 }, 
        name: 'slot_availability_check' 
      },
      { 
        key: { patient: 1, status: 1 }, 
        name: 'user_reservations' 
      },
      { 
        key: { status: 1, expiresAt: 1 }, 
        name: 'cleanup_lookup' 
      }
    ];
    
    for (const idx of slotIndexes) {
      try {
        const options = { name: idx.name, background: true };
        if (idx.expireAfterSeconds !== undefined) {
          options.expireAfterSeconds = idx.expireAfterSeconds;
        }
        await db.collection('slotreservations').createIndex(idx.key, options);
        console.log(`   ✓ Created index: ${idx.name}${idx.expireAfterSeconds !== undefined ? ' (TTL)' : ''}`);
      } catch (err) {
        if (err.code === 85 || err.code === 86) {
          console.log(`   ⚠ Index ${idx.name} already exists (skipped)`);
        } else {
          throw err;
        }
      }
    }
    
    // ========== STEP 6: Verify Migration ==========
    console.log('\n📦 Step 6: Verifying migration...');
    
    const bookingCount = await db.collection('bookings').countDocuments();
    const bookingsWithType = await db.collection('bookings').countDocuments({ bookingType: { $exists: true } });
    const providerCount = await db.collection('providers').countDocuments();
    const providersWithSettings = await db.collection('providers').countDocuments({ 'bookingSettings.mode': { $exists: true } });
    
    console.log(`   Bookings: ${bookingsWithType}/${bookingCount} have bookingType`);
    console.log(`   Providers: ${providersWithSettings}/${providerCount} have bookingSettings`);
    
    // ========== COMPLETE ==========
    console.log('\n✅ Migration completed successfully!\n');
    
    return {
      success: true,
      bookingsUpdated: bookingUpdateResult.modifiedCount,
      providersUpdated: providerDefaultResult.modifiedCount,
      instantModeProviders: instantModeResult.modifiedCount,
      requestModeProviders: requestModeResult.modifiedCount
    };
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  console.log(`\n🔄 Rolling back migration: ${MIGRATION_NAME}\n`);
  
  const db = mongoose.connection.db;
  
  try {
    // Remove new fields from bookings
    console.log('Removing new fields from bookings...');
    await db.collection('bookings').updateMany(
      {},
      {
        $unset: {
          bookingType: '',
          confirmation: '',
          reschedule: '',
          slotReservation: '',
          'payment.mode': '',
          'payment.hold': '',
          'calendar.syncStatus': '',
          version: ''
        }
      }
    );
    
    // Remove new fields from providers
    console.log('Removing new fields from providers...');
    await db.collection('providers').updateMany(
      {},
      {
        $unset: {
          timezone: '',
          bookingSettings: '',
          bookingStats: '',
          notificationPreferences: '',
          trustScore: ''
        }
      }
    );
    
    // Note: We don't drop collections in rollback to preserve any data
    console.log('⚠ BookingEvents and SlotReservations collections preserved');
    
    console.log('\n✅ Rollback completed!\n');
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    throw error;
  }
}

// ========== CLI EXECUTION ==========
async function main() {
  const command = process.argv[2] || 'up';
  
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable not set');
    process.exit(1);
  }
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✓ Connected\n');
  
  try {
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Usage: node migration.js [up|down]');
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { up, down };
