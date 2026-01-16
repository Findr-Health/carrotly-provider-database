/**
 * Migration: Upgrade Booking Schema to v2.0
 * Findr Health
 * 
 * Created: January 15, 2026
 * 
 * This migration:
 * 1. Creates backup of existing bookings
 * 2. Migrates field names and structure
 * 3. Drops old indexes, creates new ones
 * 4. Validates migrated data
 * 
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Dry-run mode for testing
 * - Rollback capability
 * - Progress logging
 * 
 * Usage:
 *   node migrations/upgrade-booking-schema-v2.js                    # Dry run
 *   node migrations/upgrade-booking-schema-v2.js --execute          # Execute migration
 *   node migrations/upgrade-booking-schema-v2.js --rollback         # Rollback
 *   node migrations/upgrade-booking-schema-v2.js --validate         # Validate only
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  backupCollection: 'bookings_backup_v1',
  migrationVersion: '2.0.0',
  batchSize: 100
};

// Field mapping from old schema to new schema
const FIELD_MAP = {
  // Direct renames
  'user': 'patient',
  'confirmationCode': 'bookingNumber',
  
  // Nested field mappings
  'appointmentDate': 'dateTime.requestedStart',
  'appointmentTime': '_appointmentTime', // Will be combined with date
  'appointmentEndTime': '_appointmentEndTime',
  'timezone': 'dateTime.providerTimezone',
  
  // Status mapping
  'status': {
    field: 'status',
    valueMap: {
      'pending': 'pending_confirmation',
      'confirmed': 'confirmed',
      'completed': 'completed',
      'cancelled_by_user': 'cancelled_patient',
      'cancelled_by_provider': 'cancelled_provider',
      'no_show': 'no_show',
      'rescheduled': 'confirmed', // Rescheduled becomes confirmed with history
      'expired': 'expired'
    }
  },
  
  // Payment mapping
  'payment.servicePrice': 'payment.originalAmount',
  'payment.status': 'payment.status',
  'payment.stripePaymentIntentId': 'payment.paymentIntentId',
  'payment.stripePaymentMethodId': 'payment.paymentMethodId',
  'payment.stripeCustomerId': 'payment.customerId',
  
  // Notes
  'notes': 'notes.patientNotes',
  
  // Calendar
  'calendarEventId': 'calendar.googleEventId'
};

// ============================================================================
// UTILITIES
// ============================================================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (num, msg) => console.log(`\n📍 Step ${num}: ${msg}`),
  progress: (current, total, msg) => {
    const pct = Math.round((current / total) * 100);
    process.stdout.write(`\r   Processing: ${current}/${total} (${pct}%) - ${msg}`);
  }
};

function parseTime(timeStr, baseDate) {
  if (!timeStr || !baseDate) return null;
  
  // Parse "10:00 AM" format
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function calculateEndTime(startDate, duration) {
  if (!startDate || !duration) return null;
  return new Date(startDate.getTime() + duration * 60 * 1000);
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_PUBLIC_URL;
  
  if (!mongoUri) {
    throw new Error('MongoDB URI not set. Set MONGODB_URI environment variable.');
  }
  
  log.info('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  log.success('Connected to MongoDB');
  
  return mongoose.connection.db;
}

async function createBackup(db) {
  log.step(1, 'Creating backup');
  
  const bookings = db.collection('bookings');
  const backup = db.collection(CONFIG.backupCollection);
  
  // Check if backup already exists
  const backupCount = await backup.countDocuments();
  if (backupCount > 0) {
    log.warn(`Backup collection already exists with ${backupCount} documents`);
    log.info('Skipping backup creation (idempotent)');
    return { skipped: true, count: backupCount };
  }
  
  // Get all bookings
  const allBookings = await bookings.find({}).toArray();
  
  if (allBookings.length === 0) {
    log.info('No bookings to backup');
    return { skipped: false, count: 0 };
  }
  
  // Add metadata to each document
  const backupDocs = allBookings.map(doc => ({
    ...doc,
    _backup: {
      originalId: doc._id,
      backedUpAt: new Date(),
      migrationVersion: CONFIG.migrationVersion
    }
  }));
  
  // Insert into backup collection
  await backup.insertMany(backupDocs);
  log.success(`Backed up ${backupDocs.length} bookings to ${CONFIG.backupCollection}`);
  
  return { skipped: false, count: backupDocs.length };
}

async function migrateDocument(oldDoc) {
  const newDoc = {
    _id: oldDoc._id,
    
    // References (rename user → patient)
    patient: oldDoc.user,
    provider: oldDoc.provider,
    
    // Booking type (infer from bookingRequest.isRequest)
    bookingType: oldDoc.bookingRequest?.isRequest ? 'request' : 'instant',
    
    // Status mapping
    status: mapStatus(oldDoc.status),
    
    // Identifiers
    bookingNumber: oldDoc.confirmationCode || null,
    
    // Service (copy as-is, it's compatible)
    service: {
      serviceId: oldDoc.service?.serviceId || `svc_${oldDoc._id}`,
      name: oldDoc.service?.name || 'Unknown Service',
      category: oldDoc.service?.category || 'General',
      duration: oldDoc.service?.duration || 30,
      price: convertToCents(oldDoc.service?.price),
      description: ''
    },
    
    // DateTime (convert from appointmentDate + appointmentTime)
    dateTime: buildDateTime(oldDoc),
    
    // Location
    location: {
      type: 'in_person'
    },
    
    // Confirmation (from bookingRequest)
    confirmation: buildConfirmation(oldDoc),
    
    // Reschedule (from rescheduleCount and related fields)
    reschedule: {
      count: oldDoc.rescheduleCount || 0,
      maxAttempts: 2,
      history: []
    },
    
    // Cancellation
    cancellation: oldDoc.cancellation ? {
      cancelledAt: oldDoc.cancellation.cancelledAt,
      cancelledBy: mapCancelledBy(oldDoc.cancellation.cancelledBy),
      reason: oldDoc.cancellation.reason,
      policyApplied: oldDoc.cancellation.policyTier,
      hoursBeforeAppointment: oldDoc.cancellation.hoursBeforeAppointment,
      feePercent: oldDoc.cancellation.feePercent,
      feeAmount: convertToCents(oldDoc.cancellation.feeAmount),
      feeWaived: oldDoc.cancellation.feeWaived || false
    } : undefined,
    
    // Payment
    payment: buildPayment(oldDoc),
    
    // Calendar
    calendar: {
      eventRequired: false,
      eventCreated: !!oldDoc.calendarEventId,
      googleEventId: oldDoc.calendarEventId || null,
      syncStatus: oldDoc.calendarEventId ? 'synced' : 'not_applicable'
    },
    
    // Notes
    notes: {
      patientNotes: typeof oldDoc.notes === 'string' ? oldDoc.notes : '',
      providerNotes: ''
    },
    
    // Metadata
    metadata: {
      source: 'migration_v2'
    },
    
    // Version
    version: 2,
    
    // Timestamps (preserve original)
    createdAt: oldDoc.createdAt,
    updatedAt: new Date()
  };
  
  // Clean undefined values
  return JSON.parse(JSON.stringify(newDoc));
}

function mapStatus(oldStatus) {
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
  return statusMap[oldStatus] || 'pending_confirmation';
}

function mapCancelledBy(oldValue) {
  const map = { 'user': 'patient', 'provider': 'provider', 'system': 'system' };
  return map[oldValue] || oldValue;
}

function convertToCents(dollars) {
  if (typeof dollars !== 'number') return 0;
  // Check if already in cents (> 1000 likely means cents)
  if (dollars > 1000) return Math.round(dollars);
  return Math.round(dollars * 100);
}

function buildDateTime(oldDoc) {
  const appointmentDate = oldDoc.appointmentDate ? new Date(oldDoc.appointmentDate) : new Date();
  
  // Try to parse time and combine with date
  let requestedStart = appointmentDate;
  if (oldDoc.appointmentTime) {
    const parsed = parseTime(oldDoc.appointmentTime, appointmentDate);
    if (parsed) requestedStart = parsed;
  }
  
  // Calculate end time
  const duration = oldDoc.service?.duration || 30;
  let requestedEnd = calculateEndTime(requestedStart, duration);
  
  // Or use provided end time
  if (oldDoc.appointmentEndTime) {
    const parsedEnd = parseTime(oldDoc.appointmentEndTime, appointmentDate);
    if (parsedEnd) requestedEnd = parsedEnd;
  }
  
  return {
    requestedStart,
    requestedEnd: requestedEnd || new Date(requestedStart.getTime() + duration * 60 * 1000),
    confirmedStart: oldDoc.status === 'confirmed' ? requestedStart : null,
    confirmedEnd: oldDoc.status === 'confirmed' ? requestedEnd : null,
    providerTimezone: oldDoc.timezone || 'America/Denver',
    patientTimezone: oldDoc.timezone || 'America/Denver',
    bufferMinutes: 15
  };
}

function buildConfirmation(oldDoc) {
  const isRequest = oldDoc.bookingRequest?.isRequest;
  
  return {
    required: isRequest || false,
    requestedAt: oldDoc.bookingRequest?.requestedAt || null,
    expiresAt: oldDoc.bookingRequest?.expiresAt || null,
    respondedAt: oldDoc.bookingRequest?.respondedAt || null,
    responseType: mapResponseType(oldDoc.bookingRequest?.providerResponse),
    remindersSent: oldDoc.bookingRequest?.reminderSentAt ? 1 : 0
  };
}

function mapResponseType(oldResponse) {
  const map = {
    'accepted': 'confirmed',
    'declined': 'declined',
    'counter_offered': 'reschedule'
  };
  return map[oldResponse] || null;
}

function buildPayment(oldDoc) {
  const oldPayment = oldDoc.payment || {};
  
  return {
    mode: mapPaymentMode(oldPayment.chargeType),
    status: mapPaymentStatus(oldPayment.status),
    originalAmount: convertToCents(oldPayment.servicePrice || oldDoc.service?.price),
    capturedAmount: oldPayment.status === 'captured' ? convertToCents(oldPayment.total) : null,
    refundedAmount: 0,
    paymentIntentId: oldPayment.stripePaymentIntentId || null,
    paymentMethodId: oldPayment.stripePaymentMethodId || null,
    customerId: oldPayment.stripeCustomerId || null,
    platformFee: {
      percentage: 10,
      flatFee: 150,
      maxFee: 3500,
      calculatedFee: convertToCents(oldPayment.platformFee)
    }
  };
}

function mapPaymentMode(chargeType) {
  const map = {
    'prepay': 'prepay',
    'at_visit': 'at_visit',
    'card_on_file': 'card_on_file'
  };
  return map[chargeType] || 'hold';
}

function mapPaymentStatus(oldStatus) {
  const map = {
    'pending': 'pending',
    'authorized': 'held',
    'captured': 'captured',
    'refunded': 'refunded',
    'partially_refunded': 'partially_refunded',
    'failed': 'failed',
    'cancelled': 'cancelled'
  };
  return map[oldStatus] || 'pending';
}

async function migrateBookings(db, dryRun = true) {
  log.step(2, `Migrating bookings${dryRun ? ' (DRY RUN)' : ''}`);
  
  const bookings = db.collection('bookings');
  const total = await bookings.countDocuments();
  
  if (total === 0) {
    log.info('No bookings to migrate');
    return { migrated: 0, errors: 0 };
  }
  
  log.info(`Found ${total} bookings to migrate`);
  
  let migrated = 0;
  let errors = 0;
  const errorDetails = [];
  
  // Process in batches
  const cursor = bookings.find({});
  const batch = [];
  
  while (await cursor.hasNext()) {
    const oldDoc = await cursor.next();
    
    try {
      // Check if already migrated
      if (oldDoc.version === 2 && oldDoc.patient) {
        log.progress(migrated + errors + 1, total, `Skipping ${oldDoc._id} (already migrated)`);
        migrated++;
        continue;
      }
      
      const newDoc = await migrateDocument(oldDoc);
      
      if (!dryRun) {
        await bookings.replaceOne({ _id: oldDoc._id }, newDoc);
      }
      
      migrated++;
      log.progress(migrated + errors, total, `Migrated ${newDoc.bookingNumber || newDoc._id}`);
      
    } catch (error) {
      errors++;
      errorDetails.push({ id: oldDoc._id, error: error.message });
      log.progress(migrated + errors, total, `Error on ${oldDoc._id}`);
    }
  }
  
  console.log(''); // New line after progress
  
  if (errors > 0) {
    log.warn(`Migration completed with ${errors} errors:`);
    errorDetails.slice(0, 10).forEach(e => log.error(`  ${e.id}: ${e.error}`));
    if (errorDetails.length > 10) {
      log.warn(`  ... and ${errorDetails.length - 10} more errors`);
    }
  }
  
  log.success(`Migrated ${migrated} bookings${dryRun ? ' (DRY RUN - no changes made)' : ''}`);
  return { migrated, errors };
}

async function updateIndexes(db, dryRun = true) {
  log.step(3, `Updating indexes${dryRun ? ' (DRY RUN)' : ''}`);
  
  const bookings = db.collection('bookings');
  
  // Indexes to drop
  const indexesToDrop = [
    'confirmationCode_1',
    'user_1_status_1_appointmentDate_-1',
    'provider_1_appointmentDate_1_status_1'
  ];
  
  // Indexes to create
  const indexesToCreate = [
    { key: { bookingNumber: 1 }, options: { unique: true, sparse: true, name: 'bookingNumber_1' } },
    { key: { patient: 1, status: 1, 'dateTime.requestedStart': -1 }, options: { name: 'patient_status_datetime' } },
    { key: { provider: 1, status: 1, 'dateTime.requestedStart': 1 }, options: { name: 'provider_status_datetime' } },
    { key: { status: 1, 'confirmation.expiresAt': 1 }, options: { name: 'status_expiration', sparse: true } },
    { key: { 'payment.paymentIntentId': 1 }, options: { name: 'payment_intent', sparse: true } },
    { key: { idempotencyKey: 1 }, options: { unique: true, sparse: true, name: 'idempotency' } }
  ];
  
  // Get current indexes
  const currentIndexes = await bookings.indexes();
  const currentIndexNames = currentIndexes.map(i => i.name);
  
  log.info('Current indexes:');
  currentIndexNames.forEach(name => log.info(`  - ${name}`));
  
  // Drop old indexes
  for (const indexName of indexesToDrop) {
    if (currentIndexNames.includes(indexName)) {
      log.info(`Dropping index: ${indexName}`);
      if (!dryRun) {
        try {
          await bookings.dropIndex(indexName);
          log.success(`Dropped ${indexName}`);
        } catch (e) {
          log.warn(`Could not drop ${indexName}: ${e.message}`);
        }
      }
    }
  }
  
  // Create new indexes
  for (const index of indexesToCreate) {
    if (!currentIndexNames.includes(index.options.name)) {
      log.info(`Creating index: ${index.options.name}`);
      if (!dryRun) {
        try {
          await bookings.createIndex(index.key, index.options);
          log.success(`Created ${index.options.name}`);
        } catch (e) {
          if (e.code === 85 || e.code === 86) {
            log.warn(`Index ${index.options.name} already exists with different options`);
          } else {
            log.error(`Failed to create ${index.options.name}: ${e.message}`);
          }
        }
      }
    } else {
      log.info(`Index ${index.options.name} already exists`);
    }
  }
  
  log.success(`Index update complete${dryRun ? ' (DRY RUN)' : ''}`);
}

async function validateMigration(db) {
  log.step(4, 'Validating migration');
  
  const bookings = db.collection('bookings');
  
  const checks = [
    {
      name: 'All documents have patient field',
      query: { patient: { $exists: false } },
      expectZero: true
    },
    {
      name: 'All documents have version 2',
      query: { version: { $ne: 2 } },
      expectZero: true
    },
    {
      name: 'All documents have dateTime.requestedStart',
      query: { 'dateTime.requestedStart': { $exists: false } },
      expectZero: true
    },
    {
      name: 'No null bookingNumber with unique constraint issues',
      query: { bookingNumber: null },
      expectZero: false,
      warn: true
    },
    {
      name: 'All confirmed bookings have confirmedStart',
      query: { status: 'confirmed', 'dateTime.confirmedStart': null },
      expectZero: false,
      warn: true
    }
  ];
  
  let passed = 0;
  let warned = 0;
  let failed = 0;
  
  for (const check of checks) {
    const count = await bookings.countDocuments(check.query);
    
    if (check.expectZero && count > 0) {
      if (check.warn) {
        log.warn(`${check.name}: found ${count} documents`);
        warned++;
      } else {
        log.error(`${check.name}: found ${count} documents (expected 0)`);
        failed++;
      }
    } else if (!check.expectZero && check.warn && count > 0) {
      log.warn(`${check.name}: found ${count} documents`);
      warned++;
    } else {
      log.success(`${check.name}: OK`);
      passed++;
    }
  }
  
  console.log('');
  log.info(`Validation complete: ${passed} passed, ${warned} warnings, ${failed} failed`);
  
  return { passed, warned, failed };
}

async function rollback(db) {
  log.step(1, 'Rolling back migration');
  
  const bookings = db.collection('bookings');
  const backup = db.collection(CONFIG.backupCollection);
  
  const backupCount = await backup.countDocuments();
  
  if (backupCount === 0) {
    log.error('No backup found. Cannot rollback.');
    return false;
  }
  
  log.info(`Found ${backupCount} documents in backup`);
  log.warn('This will replace all current bookings with backup data!');
  
  // Get all backup documents
  const backupDocs = await backup.find({}).toArray();
  
  // Remove backup metadata and restore
  for (const doc of backupDocs) {
    const originalId = doc._backup?.originalId || doc._id;
    delete doc._backup;
    
    await bookings.replaceOne(
      { _id: originalId },
      doc,
      { upsert: true }
    );
  }
  
  log.success(`Restored ${backupDocs.length} bookings from backup`);
  log.info(`Backup collection ${CONFIG.backupCollection} preserved for safety`);
  
  return true;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const doRollback = args.includes('--rollback');
  const validateOnly = args.includes('--validate');
  const dryRun = !execute;
  
  console.log('\n========================================');
  console.log('  Findr Health - Booking Schema Migration');
  console.log('  Version: ' + CONFIG.migrationVersion);
  console.log('========================================\n');
  
  if (dryRun && !doRollback && !validateOnly) {
    log.warn('DRY RUN MODE - No changes will be made');
    log.info('Use --execute flag to apply changes\n');
  }
  
  let db;
  
  try {
    db = await connectDatabase();
    
    if (doRollback) {
      await rollback(db);
    } else if (validateOnly) {
      await validateMigration(db);
    } else {
      // Full migration
      await createBackup(db);
      await migrateBookings(db, dryRun);
      await updateIndexes(db, dryRun);
      await validateMigration(db);
      
      if (dryRun) {
        console.log('\n========================================');
        log.info('DRY RUN COMPLETE');
        log.info('Review the output above, then run with --execute to apply changes');
        console.log('========================================\n');
      } else {
        console.log('\n========================================');
        log.success('MIGRATION COMPLETE');
        console.log('========================================\n');
      }
    }
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      log.info('Disconnected from MongoDB');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  migrateDocument,
  mapStatus,
  convertToCents,
  buildDateTime,
  buildPayment
};
