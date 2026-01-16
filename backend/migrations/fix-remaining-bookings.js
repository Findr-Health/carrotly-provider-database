/**
 * Migration Fix: Use $set/$unset instead of replaceOne
 * Findr Health
 * 
 * This fixes the _id type conversion issue from the previous migration attempt.
 * 
 * Usage:
 *   MONGODB_URI="..." node migrations/fix-remaining-bookings.js
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
      
      // Use $set and $unset to update in place
      const updateResult = await bookings.updateOne(
        { _id: doc._id },
        {
          $set: {
            // Rename user -> patient
            patient: doc.user,
            
            // Booking type
            bookingType: doc.bookingRequest?.isRequest ? 'request' : 'instant',
            
            // Status mapping
            status: statusMap[doc.status] || 'pending_confirmation',
            
            // Booking number (keep confirmationCode value)
            bookingNumber: doc.confirmationCode || `FH-${Date.now().toString(36).toUpperCase()}`,
            
            // Service (update price to cents)
            'service.price': servicePrice,
            'service.serviceId': doc.service?.serviceId || `svc_${doc._id}`,
            'service.description': doc.service?.description || '',
            
            // DateTime structure
            'dateTime.requestedStart': requestedStart,
            'dateTime.requestedEnd': requestedEnd,
            'dateTime.confirmedStart': doc.status === 'confirmed' ? requestedStart : null,
            'dateTime.confirmedEnd': doc.status === 'confirmed' ? requestedEnd : null,
            'dateTime.providerTimezone': doc.timezone || 'America/Denver',
            'dateTime.patientTimezone': doc.timezone || 'America/Denver',
            'dateTime.bufferMinutes': 15,
            
            // Location
            'location.type': 'in_person',
            
            // Confirmation
            'confirmation.required': doc.bookingRequest?.isRequest || false,
            'confirmation.requestedAt': doc.bookingRequest?.requestedAt || null,
            'confirmation.expiresAt': doc.bookingRequest?.expiresAt || null,
            'confirmation.respondedAt': doc.bookingRequest?.respondedAt || null,
            'confirmation.remindersSent': doc.bookingRequest?.reminderSentAt ? 1 : 0,
            
            // Reschedule
            'reschedule.count': doc.rescheduleCount || 0,
            'reschedule.maxAttempts': 2,
            'reschedule.history': [],
            
            // Payment updates
            'payment.mode': doc.payment?.chargeType || 'hold',
            'payment.originalAmount': servicePrice,
            'payment.paymentIntentId': doc.payment?.stripePaymentIntentId || null,
            'payment.paymentMethodId': doc.payment?.stripePaymentMethodId || null,
            'payment.customerId': doc.payment?.stripeCustomerId || null,
            'payment.platformFee.percentage': 10,
            'payment.platformFee.flatFee': 150,
            'payment.platformFee.maxFee': 3500,
            
            // Calendar
            'calendar.eventRequired': false,
            'calendar.eventCreated': !!doc.calendarEventId,
            'calendar.googleEventId': doc.calendarEventId || null,
            'calendar.syncStatus': doc.calendarEventId ? 'synced' : 'not_applicable',
            
            // Notes (convert string to object)
            'notes.patientNotes': typeof doc.notes === 'string' ? doc.notes : '',
            'notes.providerNotes': '',
            
            // Metadata
            'metadata.source': 'migration_v2',
            
            // Version
            version: 2
          },
          $unset: {
            // Remove old fields
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
            bookingRequest: ''
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
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
  
  console.log(`   Documents without 'patient': ${withoutPatient}`);
  console.log(`   Documents without version 2: ${withoutVersion}`);
  console.log(`   Documents without dateTime.requestedStart: ${withoutDateTime}`);
  
  if (withoutPatient === 0 && withoutVersion === 0 && withoutDateTime === 0) {
    console.log('\n✅ All validations passed!');
  } else {
    console.log('\n⚠️  Some validations failed - check the counts above');
  }
  
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
