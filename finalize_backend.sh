#!/bin/bash
# Final backend setup - cron initialization + env config

echo "🚀 Finalizing Backend Implementation"
echo "======================================"
echo ""

# Step 1: Show where to add cron initialization
echo "📋 STEP 1: Add Cron Initialization"
echo ""
echo "Location: backend/server.js"
echo ""
echo "Find the MongoDB connection (look for one of these patterns):"
echo "  • mongoose.connect()"
echo "  • connectDB()"
echo "  • mongoose.connection.once('open', ...)"
echo ""
echo "Add this code AFTER the connection is established:"
echo ""
cat << 'CRON'
// Initialize payment policy cron jobs
console.log('🔄 Initializing payment cron jobs...');
const { startRetryFailedPaymentsCron, startAutoCompleteBookingsCron } = require('./cron/retryFailedPayments');
startRetryFailedPaymentsCron();
startAutoCompleteBookingsCron();
CRON
echo ""
echo "Press ENTER when done..."
read

# Step 2: Create .env if it doesn't exist
echo ""
echo "📋 STEP 2: Configure Environment Variables"
echo ""

if [ -f .env ]; then
  echo "✅ .env file exists"
  echo ""
  echo "Add these variables if missing:"
else
  echo "Creating .env file..."
  cat > .env << 'ENV'
# Node Environment
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/findr-health

# Stripe (TEST KEYS - Replace with your keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Payment Policy Settings
PLATFORM_FEE_PERCENT=10
PLATFORM_FEE_FLAT=1.50
PLATFORM_FEE_CAP=35.00
CANCELLATION_THRESHOLD_HOURS=48
DEPOSIT_PERCENT=80
FINAL_PAYMENT_PERCENT=20

# Email (Optional - for sending receipts/notifications)
SENDGRID_API_KEY=your_sendgrid_key_here
FROM_EMAIL=noreply@findrhealth.com
SUPPORT_EMAIL=support@findrhealth.com

# Application URLs
APP_URL=http://localhost:3000
PROVIDER_PORTAL_URL=http://localhost:3001
API_URL=http://localhost:8080

# Server Port
PORT=8080
ENV

  echo "✅ Created .env file"
fi

cat << 'VARS'

Required Stripe Variables:
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...

Get test keys from: https://dashboard.stripe.com/test/apikeys
VARS

echo ""
echo "Press ENTER when Stripe keys are configured..."
read

# Step 3: Validation
echo ""
echo "📋 STEP 3: Final Validation"
echo ""

echo "Checking all files..."
FILES_OK=true

for file in \
  "backend/models/Booking.js" \
  "backend/routes/bookings.js" \
  "backend/services/PaymentService.js" \
  "backend/utils/platformFee.js" \
  "backend/cron/retryFailedPayments.js" \
  "backend/server.js"; do
  
  if node -c "$file" 2>/dev/null; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - SYNTAX ERROR"
    FILES_OK=false
  fi
done

echo ""
if [ "$FILES_OK" = true ]; then
  echo "✅ All files valid!"
else
  echo "⚠️  Some files have errors - fix before proceeding"
  exit 1
fi

# Step 4: Summary
echo ""
echo "======================================"
echo "✅ BACKEND IMPLEMENTATION COMPLETE"
echo "======================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Test endpoints with Postman/curl:"
echo "   POST /api/bookings (create with 80% deposit)"
echo "   POST /api/bookings/:id/cancel (test cancellation)"
echo "   POST /api/bookings/:id/complete (charge final 20%)"
echo ""
echo "3. Check cron jobs are running:"
echo "   Look for: '🔄 Initializing payment cron jobs...'"
echo ""
echo "4. Commit to git:"
echo "   git add ."
echo "   git commit -m 'feat: implement 80/20 payment policy'"
echo "   git push origin feature/80-20-payment-policy"
echo ""
echo "📖 See IMPLEMENTATION_STATUS.md for full details"
echo ""
