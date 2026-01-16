/**
 * Migration Fix v2: Handle type conflicts
 * Findr Health
 * 
 * Two-phase approach:
 * 1. $unset conflicting fields (notes as string, platformFee as number)
 * 2. $set new structure
 * 
 * Usage:
 *   MONGODB_URI="..." node migrations/fix-remaining-bookings-v2.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }
  
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected\n');
  
  const db = mongoose.connection.db;
  const bookings = db.collection('bookings');
  
  // Find documents that need migration (have 'user' but not 'patient')
  const toMigrate = await bookings.find({
    user: { $exists: true },
    patient: { $exists: false }
  }).toArray();
  
  console.log(`📋 Found ${toMigrate.length} bookings to migrate\n`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const doc of toMigrate) {
    try {
      // Build dateTime from old fields
      const appointmentDate = doc.appointmentDate ? new Date(doc.appointmentDate) : new Date();
      let requestedStart = appointmentDate;
      
      // Parse time if available
      if (doc.appointmentTime) {
        const match = doc.appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const period = match[3]?.toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          requestedStart = new Date(appointmentDate);
          requestedStart.setHours(hours, minutes, 0, 0);
        }
      }
      
      const duration = doc.service?.duration || 30;
      const requestedEnd = new Date(requestedStart.getTime() + duration * 60 * 1000);
      
      // Map old status to new status
      const statusMap = {
        'pending': 'pending_confirmation',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled_by_user': 'cancelled_patient',
        'cancelled_by_provider': 'cancelled_provider',
        'no_show': 'no_show',
        'rescheduled': 'confirmed',
        'expired': 'expired'
      };
      
      // Convert price to cents if needed
      const convertToCents = (val) => {
        if (typeof val !== 'number') return 0;
        if (val > 1000) return Math.round(val); // Already cents
        return Math.round(val * 100);
      };
      
      const servicePrice = convertToCents(doc.service?.price || doc.payment?.servicePrice);
      
      // Save old values before unsetting
      const oldNotes = typeof doc.notes === 'string' ? doc.notes : '';
      const oldPlatformFee = typeof doc.payment?.platformFee === 'number' ? doc.payment.platformFee : null;
      
      // PHASE 1: Unset ALL conflicting and old fields first
      await bookings.updateOne(
        { _id: doc._id },
        {
          $unset: {
            // Old fields to remove
            user: '',
            confirmationCode: '',
            appointmentDate: '',
            appointmentTime: '',
            appointmentEndTime: '',
            timezone: '',
            teamMember: '',
            rescheduledFrom: '',
            rescheduledTo: '',
            rescheduleCount: '',
            calendarEventId: '',
            reminders: '',
            bookingRequest: '',
            // Conflicting type fields
            notes: '',
            'payment.platformFee': '',
            'payment.stripePaymentIntentId': '',
            'payment.stripePaymentMethodId': '',
            'payment.stripeCustomerId': '',
            'payment.servicePrice': '',
            'payment.total': '',
            'payment.providerPayout': '',
            'payment.stripeFee': '',
            'payment.chargeType': '',
            'payment.authorizedAt': '',
            'payment.capturedAt': '',
            'payment.refundedAt': '',
            'payment.adjustedAmount': '',
            'payment.adjustmentReason': ''
          }
        }
      );
      
      // PHASE 2: Set all new fields
      const updateResult = await bookings.updateOne(
        { _id: doc._id },
        {
          $set: {
            // Core references
            patient: doc.user,
            
            // Booking type
            bookingType: doc.bookingRequest?.isRequest ? 'request' : 'instant',
            
            // Status mapping
            status: statusMap[doc.status] || 'pending_confirmation',
            
            // Booking number
            bookingNumber: doc.confirmationCode || `FH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            
            // Service updates
            'service.price': servicePrice,
            'service.serviceId': doc.service?.serviceId || `svc_${doc._id}`,
            'service.description': doc.service?.description || '',
            
            // DateTime structure
            dateTime: {
              requestedStart: requestedStart,
              requestedEnd: requestedEnd,
              confirmedStart: doc.status === 'confirmed' ? requestedStart : null,
              confirmedEnd: doc.status === 'confirmed' ? requestedEnd : null,
              providerTimezone: doc.timezone || 'America/Denver',
              patientTimezone: doc.timezone || 'America/Denver',
              bufferMinutes: 15
            },
            
            // Location
            location: {
              type: 'in_person'
            },
            
            // Confirmation
            confirmation: {
              required: doc.bookingRequest?.isRequest || false,
              requestedAt: doc.bookingRequest?.requestedAt || null,
              expiresAt: doc.bookingRequest?.expiresAt || null,
              respondedAt: doc.bookingRequest?.respondedAt || null,
              remindersSent: doc.bookingRequest?.reminderSentAt ? 1 : 0
            },
            
            // Reschedule
            reschedule: {
              count: doc.rescheduleCount || 0,
              maxAttempts: 2,
              history: []
            },
            
            // Payment - rebuild entirely
            'payment.mode': doc.payment?.chargeType || 'hold',
            'payment.status': doc.payment?.status || 'pending',
            'payment.originalAmount': servicePrice,
            'payment.capturedAmount': doc.payment?.status === 'captured' ? servicePrice : null,
            'payment.refundedAmount': 0,
            'payment.paymentIntentId': doc.payment?.stripePaymentIntentId || null,
            'payment.paymentMethodId': doc.payment?.stripePaymentMethodId || null,
            'payment.customerId': doc.payment?.stripeCustomerId || null,
            'payment.platformFee': {
              percentage: 10,
              flatFee: 150,
              maxFee: 3500,
              calculatedFee: oldPlatformFee ? Math.round(oldPlatformFee * 100) : Math.min(Math.round(servicePrice * 0.1) + 150, 3500)
            },
            
            // Calendar
            calendar: {
              eventRequired: false,
              eventCreated: !!doc.calendarEventId,
              googleEventId: doc.calendarEventId || null,
              syncStatus: doc.calendarEventId ? 'synced' : 'not_applicable'
            },
            
            // Notes - as object now
            notes: {
              patientNotes: oldNotes,
              providerNotes: ''
            },
            
            // Metadata
            metadata: {
              source: 'migration_v2'
            },
            
            // Version
            version: 2
          }
        }
      );
      
      if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
        migrated++;
        console.log(`✅ Migrated ${doc.confirmationCode || doc._id}`);
      } else {
        console.log(`⚠️  No changes for ${doc._id}`);
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ Error migrating ${doc._id}: ${error.message}`);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`✅ Migration complete: ${migrated} migrated, ${errors} errors`);
  console.log(`========================================\n`);
  
  // Validate
  console.log('📋 Validating...');
  
  const withoutPatient = await bookings.countDocuments({ patient: { $exists: false } });
  const withoutVersion = await bookings.countDocuments({ version: { $ne: 2 } });
  const withoutDateTime = await bookings.countDocuments({ 'dateTime.requestedStart': { $exists: false } });
  const total = await bookings.countDocuments({});
  
  console.log(`   Total documents: ${total}`);
  console.log(`   Documents without 'patient': ${withoutPatient}`);
  console.log(`   Documents without version 2: ${withoutVersion}`);
  console.log(`   Documents without dateTime.requestedStart: ${withoutDateTime}`);
  
  if (withoutPatient === 0 && withoutVersion === 0 && withoutDateTime === 0) {
    console.log('\n✅ All validations passed!');
  } else {
    console.log('\n⚠️  Some documents may need attention');
  }
  
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
