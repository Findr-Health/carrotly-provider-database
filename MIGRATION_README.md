# Booking Schema Migration v2.0

## Overview

This migration upgrades your Findr Health booking system to support the **Calendar-Optional Booking Flow**, where:

- **Instant bookings**: Providers with calendar connected get immediate confirmations
- **Request bookings**: Providers without calendar must manually confirm within 24 hours

## Files

| File | Purpose |
|------|---------|
| `Booking.js` | New comprehensive booking model |
| `upgrade-booking-schema-v2.js` | Migration script |
| `bookings.js` | Updated API routes (from earlier) |

## What Changes

### Field Renames
| Old Field | New Field |
|-----------|-----------|
| `user` | `patient` |
| `confirmationCode` | `bookingNumber` |
| `appointmentDate` + `appointmentTime` | `dateTime.requestedStart` |
| `payment.stripePaymentIntentId` | `payment.paymentIntentId` |

### Status Changes
| Old Status | New Status |
|------------|------------|
| `pending` | `pending_confirmation` |
| `cancelled_by_user` | `cancelled_patient` |
| `cancelled_by_provider` | `cancelled_provider` |

### New Fields
- `bookingType`: `instant` or `request`
- `dateTime.confirmedStart/End`: Actual confirmed time (may differ from requested after reschedule)
- `confirmation.*`: Request flow metadata
- `reschedule.*`: Reschedule history tracking
- `payment.hold.*`: Payment hold details for request flow

## Migration Steps

### Step 1: Backup First (Automatic)
The migration creates a backup collection `bookings_backup_v1` automatically.

### Step 2: Dry Run (Recommended)
```bash
cd ~/Development/findr-health/carrotly-provider-database/backend

# Copy new files
cp ~/Downloads/Booking.js models/Booking.js
mkdir -p migrations
cp ~/Downloads/upgrade-booking-schema-v2.js migrations/

# Dry run - see what will change
node migrations/upgrade-booking-schema-v2.js
```

This shows you exactly what will happen without making changes.

### Step 3: Execute Migration
```bash
node migrations/upgrade-booking-schema-v2.js --execute
```

### Step 4: Validate
```bash
node migrations/upgrade-booking-schema-v2.js --validate
```

### Step 5: Deploy
```bash
git add -A
git commit -m "feat: upgrade booking schema to v2.0 - calendar-optional flow"
git push origin main
```

## Rollback (If Needed)

```bash
node migrations/upgrade-booking-schema-v2.js --rollback
```

This restores all bookings from the backup collection.

## Migration Features

- **Idempotent**: Safe to run multiple times
- **Dry-run mode**: Preview changes before applying
- **Batch processing**: Handles large datasets efficiently
- **Automatic backup**: Creates backup before modifying
- **Validation**: Checks data integrity after migration
- **Rollback**: Can restore original data if needed

## Post-Migration

After migration succeeds:

1. **Update routes file** (if not already done):
   ```bash
   cp ~/Downloads/bookings.js routes/bookings.js
   ```

2. **Test the API**:
   ```bash
   curl https://your-api.railway.app/api/bookings/provider/PROVIDER_ID/pending
   ```

3. **Remove backup** (optional, after confirming everything works):
   ```javascript
   // In mongo shell
   db.bookings_backup_v1.drop()
   ```

## Troubleshooting

### "Duplicate key error on confirmationCode"
The migration drops this index. Run the migration to fix.

### "Cannot find module"
Make sure you're in the backend directory with node_modules installed.

### "Backup already exists"
The migration is idempotent - it will skip backup creation if one exists.

### Migration fails midway
Run `--rollback` to restore, then debug the issue before retrying.

## Questions?

The migration script has detailed logging. Check the output for any warnings or errors.
