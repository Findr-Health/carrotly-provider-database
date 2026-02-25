#!/bin/bash
# Quick Start Script for Next Session
# Run this to verify system state and get oriented

echo "🚀 FINDR HEALTH - SESSION STARTUP CHECK"
echo "========================================"
echo ""

# Navigate to project
cd ~/Development/findr-health/carrotly-provider-database/backend 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Project directory not found"
    echo "Expected: ~/Development/findr-health/carrotly-provider-database/backend"
    exit 1
fi

echo "✅ Project directory found"
echo ""

# Check git status
echo "📝 GIT STATUS:"
echo "-------------"
git log --oneline -3
echo ""
echo "Current branch: $(git branch --show-current)"
echo "Uncommitted changes: $(git status --short | wc -l | xargs)"
echo ""

# Check for common issues
echo "🔍 QUICK HEALTH CHECK:"
echo "--------------------"

# Check for debug logs
DEBUG_COUNT=$(grep -c "🔍\|📊" routes/bookings.js 2>/dev/null || echo "0")
if [ "$DEBUG_COUNT" -eq "0" ]; then
    echo "✅ Debug logs cleaned up"
else
    echo "⚠️  $DEBUG_COUNT debug logs still present"
fi

# Check for console.log syntax errors
SYNTAX_ERRORS=$(grep -r 'console\.log`' backend/ --include="*.js" 2>/dev/null | grep -v node_modules | wc -l | xargs)
if [ "$SYNTAX_ERRORS" -eq "0" ]; then
    echo "✅ No console.log syntax errors found"
else
    echo "⚠️  $SYNTAX_ERRORS potential console.log syntax errors"
fi

# Check if getPushConfig exists
if grep -q "getPushConfig(template" services/NotificationService.js 2>/dev/null; then
    echo "✅ getPushConfig method present"
else
    echo "❌ getPushConfig method missing"
fi

# Check pre-save hook status
if grep -q "^// bookingSchema.pre('save'" models/Booking.js 2>/dev/null; then
    echo "⚠️  Pre-save hook is commented out"
else
    echo "✅ Pre-save hook is active"
fi

echo ""

# Railway status
echo "🚂 RAILWAY STATUS:"
echo "-----------------"
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI installed"
    echo ""
    echo "To check logs: railway logs --follow"
    echo "To check status: railway status"
else
    echo "❌ Railway CLI not installed"
    echo "Install: npm install -g @railway/cli"
fi

echo ""

# AWS CLI status
echo "☁️  AWS STATUS:"
echo "--------------"
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI installed"
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ AWS credentials configured (Account: $AWS_ACCOUNT)"
    else
        echo "⚠️  AWS credentials not configured"
        echo "Run: aws configure"
    fi
else
    echo "❌ AWS CLI not installed"
    echo "Install: brew install awscli"
fi

echo ""

# Summary
echo "📊 SYSTEM SUMMARY:"
echo "-----------------"
echo "Current commit: $(git log -1 --oneline)"
echo "Working directory clean: $([ -z "$(git status --porcelain)" ] && echo "YES" || echo "NO")"
echo ""

echo "📚 DOCUMENTATION AVAILABLE:"
echo "-------------------------"
echo "1. EXECUTIVE_SUMMARY.md - 60-second overview"
echo "2. QUICK_START_NEXT_SESSION.md - Detailed startup guide"
echo "3. SESSION_SUMMARY_FEB_7_2026.md - Full debugging story"
echo "4. AWS_MIGRATION_PLAN.md - Infrastructure migration"
echo "5. OUTSTANDING_ISSUES_FEB_7_2026.md - Problems & priorities"
echo ""

echo "🎯 NEXT ACTIONS:"
echo "---------------"
echo "1. Test booking: Open mobile app → book appointment"
echo "2. Watch logs: railway logs --follow"
echo "3. Choose path:"
echo "   Option A: Continue cleanup (1-2 hours)"
echo "   Option B: Start AWS migration (1-2 weeks)"
echo ""

echo "✅ Startup check complete!"
echo ""
echo "Need help? Start with: cat QUICK_START_NEXT_SESSION.md"
