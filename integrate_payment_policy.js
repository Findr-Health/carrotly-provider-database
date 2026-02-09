#!/usr/bin/env node
/**
 * Integration script for 80/20 payment policy
 * Adds payment fields to Booking model and initializes cron jobs
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Integrating 80/20 Payment Policy...');

// Step 1: Check if Booking model needs updates
const bookingModelPath = path.join(__dirname, 'backend/models/Booking.js');
const bookingModel = fs.readFileSync(bookingModelPath, 'utf8');

if (!bookingModel.includes('depositAmount')) {
  console.log('⚠️  Booking model needs manual update');
  console.log('   Please add payment schema from: backend/models/_payment_policy_schema.js');
  console.log('   Reference: IMPLEMENTATION_PLAN.md - Day 1 Morning');
} else {
  console.log('✅ Booking model already updated');
}

// Step 2: Check server.js for cron initialization
const serverPath = path.join(__dirname, 'backend/server.js');
const serverCode = fs.readFileSync(serverPath, 'utf8');

if (!serverCode.includes('startRetryFailedPaymentsCron')) {
  console.log('⚠️  server.js needs cron job initialization');
  console.log('   Add to server.js after mongoose connection:');
  console.log('');
  console.log('   const { startRetryFailedPaymentsCron, startAutoCompleteBookingsCron } = require(\'./cron/retryFailedPayments\');');
  console.log('   mongoose.connection.once(\'open\', () => {');
  console.log('     startRetryFailedPaymentsCron();');
  console.log('     startAutoCompleteBookingsCron();');
  console.log('   });');
  console.log('');
} else {
  console.log('✅ Cron jobs already initialized');
}

// Step 3: Check routes
const routesPath = path.join(__dirname, 'backend/routes/bookings.js');
if (fs.existsSync(routesPath)) {
  const routesCode = fs.readFileSync(routesPath, 'utf8');
  
  if (!routesCode.includes('PaymentService')) {
    console.log('⚠️  bookings.js needs PaymentService integration');
    console.log('   Reference implementation: backend/routes/_payment_policy_routes.js');
  } else {
    console.log('✅ Routes already updated');
  }
}

console.log('');
console.log('📋 Next Steps:');
console.log('1. Review and integrate code from files prefixed with _payment_policy_');
console.log('2. Update Booking model with payment schema');
console.log('3. Update routes with PaymentService calls');
console.log('4. Initialize cron jobs in server.js');
console.log('5. Run: npm test');
console.log('6. Run: npm run dev (test locally)');
console.log('');
console.log('📖 Full implementation guide: IMPLEMENTATION_PLAN.md');
