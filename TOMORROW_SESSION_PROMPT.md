# FINDR HEALTH - SESSION RESTART PROMPT
## January 9, 2026

---

## 📋 CONTEXT

I'm building Findr Health, a healthcare marketplace platform. We've been working on:
- **Flutter Consumer App** (`~/Downloads/Findr_health_APP`)
- **Node.js Backend** (`~/Desktop/carrotly-provider-database/backend`) - Railway
- **Provider Portal** (`~/Desktop/carrotly-provider-mvp`) - Vercel
- **Admin Dashboard** (`~/Desktop/carrotly-provider-database/admin-dashboard`) - Vercel

**Backend API:** https://fearless-achievement-production.up.railway.app/api
**Provider Portal:** https://findrhealth-provider.vercel.app
**Cloudinary:** Cloud name `dzyc6cuv1`

---

## ✅ COMPLETED YESTERDAY

1. **Cloudinary Photo Upload** - Backend `/api/upload/image`, Provider Portal & Admin Dashboard can upload to cloud
2. **Hours of Operation** - Admin Dashboard has Hours tab, Flutter app shows hours on provider detail
3. **Backend Fix** - Nested object merging works (hours now save properly)
4. **Flutter Notifications Screen** - Bell icon opens notifications with empty state
5. **Flutter TOS Screen** - Full 16-section Terms of Service

---

## 🔴 3 BUGS TO FIX TODAY

### Bug 1: Provider Portal - Unsaved Changes Warning
**File:** `~/Desktop/carrotly-provider-mvp/src/pages/EditProfile.tsx`
**Issue:** After saving, clicking back arrow shows "unsaved changes" warning even though save completed
**Fix:** The `hasChanges` flag is re-triggered when data reloads. Need to skip change detection after save.

### Bug 2: Admin Dashboard - Badges Not Saving  
**Files:** 
- `~/Desktop/carrotly-provider-database/admin-dashboard/src/components/ProviderDetail.jsx`
- `~/Desktop/carrotly-provider-database/backend/models/Provider.js`
**Issue:** "Verified" and "Featured" checkboxes don't persist
**Fix:** Check if fields exist in Provider schema, add if missing

### Bug 3: User App - Photos Not Showing
**Provider ID:** `6959b75e8b1d9aac97d0b76f` (Medical Test)
**Issue:** Photos stored as base64 in database, Flutter filters these out
**Fix:** Delete old photos via Provider Portal, upload new ones to Cloudinary

---

## 🎯 TODAY'S GOALS

1. Fix all 3 bugs above (~1.5 hours)
2. Final testing across all platforms
3. TestFlight build for user app

---

## 🔧 QUICK REFERENCE

```bash
# Project locations
cd ~/Downloads/Findr_health_APP          # Flutter app
cd ~/Desktop/carrotly-provider-mvp        # Provider Portal
cd ~/Desktop/carrotly-provider-database   # Backend + Admin Dashboard

# Check Medical Test photos
curl -s "https://fearless-achievement-production.up.railway.app/api/providers/6959b75e8b1d9aac97d0b76f" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(p.get('url','')[:50]) for p in d.get('photos',[])]"

# Deploy backend
cd ~/Desktop/carrotly-provider-database/backend && git add -A && git commit -m "message" && git push

# Deploy provider portal
cd ~/Desktop/carrotly-provider-mvp && git add -A && git commit -m "message" && git push

# Deploy admin dashboard
cd ~/Desktop/carrotly-provider-database && git add -A && git commit -m "message" && git push

# Flutter
cd ~/Downloads/Findr_health_APP && flutter analyze && flutter run
```

---

## 📎 ATTACHED DOCUMENTS

Please review the attached ecosystem summary and outstanding issues documents for full context.

**START HERE:** Fix Bug 1 (Provider Portal unsaved changes warning)
