#!/bin/bash
# Validation script for 80/20 payment policy installation

echo "🔍 Validating Payment Policy Installation..."
echo ""

ERRORS=0

# Check files exist
echo "📁 Checking files..."
FILES=(
  "backend/services/PaymentService.js"
  "backend/utils/platformFee.js"
  "backend/cron/retryFailedPayments.js"
  "backend/templates/emailTemplates.js"
  "backend/models/_payment_policy_schema.js"
  "backend/routes/_payment_policy_routes.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing: $file"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
if grep -q "stripe" package.json; then
  echo "  ✅ stripe"
else
  echo "  ❌ Missing: stripe"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "node-cron" package.json; then
  echo "  ✅ node-cron"
else
  echo "  ❌ Missing: node-cron"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "date-fns-tz" package.json; then
  echo "  ✅ date-fns-tz"
else
  echo "  ❌ Missing: date-fns-tz"
  ERRORS=$((ERRORS + 1))
fi

# Check syntax
echo ""
echo "🔧 Checking JavaScript syntax..."
FILES_TO_CHECK=(
  "backend/services/PaymentService.js"
  "backend/utils/platformFee.js"
  "backend/cron/retryFailedPayments.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if node -c "$file" 2>/dev/null; then
    echo "  ✅ $file"
  else
    echo "  ❌ Syntax error: $file"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Validation passed! Ready for integration."
else
  echo "❌ Validation failed with $ERRORS errors"
  exit 1
fi
