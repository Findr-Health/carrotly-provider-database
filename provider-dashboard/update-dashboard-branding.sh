#!/bin/bash

# Findr Branding Update Script for Provider Dashboard
# Run this from ~/Desktop/carrotly-provider-database/provider-dashboard

echo "🎨 Updating Provider Dashboard with Findr branding..."

# 1. Copy logo files from Provider MVP
echo "📁 Copying logo files..."
cp ~/Desktop/carrotly-provider-mvp/public/findr-logo.svg public/
cp ~/Desktop/carrotly-provider-mvp/public/findr-icon.svg public/

# 2. Update index.html
echo "📝 Updating index.html..."
cp ~/Downloads/provider-dashboard-index.html index.html

# 3. Check for any "Carrotly" references
echo "🔍 Checking for Carrotly references..."
echo "Files containing 'Carrotly':"
grep -r "Carrotly" src/ --include="*.tsx" --include="*.ts" -l || echo "None found"

echo ""
echo "✅ Branding update complete!"
echo ""
echo "Next steps:"
echo "1. If any Carrotly references were found above, manually replace them with 'Findr'"
echo "2. Start dev server: npm run dev"
echo "3. Check the dashboard at http://localhost:5173"
