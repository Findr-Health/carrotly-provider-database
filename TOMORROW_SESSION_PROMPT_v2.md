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

## ✅ COMPLETED YESTERDAY (Jan 8)

1. **Cloudinary Photo Upload** - Backend `/api/upload/image`, Provider Portal & Admin Dashboard can upload to cloud
2. **Hours of Operation** - Admin Dashboard has Hours tab, Flutter app shows hours on provider detail
3. **Backend Fix** - Nested object merging works (hours now save properly)
4. **Flutter Notifications Screen** - Bell icon opens notifications with empty state
5. **Flutter TOS Screen** - Full 16-section Terms of Service

---

## 🔴 BUGS TO FIX TODAY (8 Total)

### Portal/Backend Bugs (3)

#### Bug 1: Provider Portal - Unsaved Changes Warning
**File:** `~/Desktop/carrotly-provider-mvp/src/pages/EditProfile.tsx`
**Issue:** After saving, clicking back arrow shows "unsaved changes" warning even though save completed
**Fix:** The `hasChanges` flag is re-triggered when data reloads. Need to skip change detection after save.

#### Bug 2: Admin Dashboard - Badges Not Saving  
**Files:** 
- `~/Desktop/carrotly-provider-database/admin-dashboard/src/components/ProviderDetail.jsx`
- `~/Desktop/carrotly-provider-database/backend/models/Provider.js`
**Issue:** "Verified" and "Featured" checkboxes don't persist
**Fix:** Check if fields exist in Provider schema, add if missing

#### Bug 3: User App - Photos Not Showing
**Provider ID:** `6959b75e8b1d9aac97d0b76f` (Medical Test)
**Issue:** Photos stored as base64 in database, Flutter filters these out
**Fix:** Delete old photos via Provider Portal, upload new ones to Cloudinary

---

### Flutter UI Bugs (5)

#### Bug 4: Provider Profile - Hours Should Be Collapsible
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/provider_detail/provider_detail_screen.dart`
**Issue:** Hours of Operation section takes up too much space
**Fix:** Make it collapsible/expandable (default collapsed, tap to expand)

#### Bug 5: Provider Profile - Favorites Button Not Working
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/provider_detail/provider_detail_screen.dart`
**Issue:** Heart/favorites icon doesn't toggle or save
**Fix:** Connect to favorites provider (may need backend work for User.favorites)

#### Bug 6: Provider Profile - Share Button Not Working
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/provider_detail/provider_detail_screen.dart`
**Issue:** Button next to favorites does nothing
**Fix:** Implement share functionality using `share_plus` package

#### Bug 7: Provider Profile - Location Icons Not Working
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/provider_detail/provider_detail_screen.dart`
**Issue:** Map pin and navigation icons in Location section don't function
**Fix:** 
- Map pin: Open in Google/Apple Maps
- Navigation: Get directions

#### Bug 8: Search/Clarity AI - Keyboard Not Showing (Simulator)
**Issue:** Keyboard doesn't appear in simulator for search and Clarity AI
**Note:** This is likely a simulator-only issue. On real iPhone the keyboard should appear.
**Verify:** Test on real device. If simulator-only, document as known simulator limitation.

---

## 🎯 TODAY'S GOALS

1. Fix all 8 bugs above (~2-3 hours)
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

Review the attached ecosystem summary and outstanding issues documents for full context:
- `FINDR_HEALTH_ECOSYSTEM_SUMMARY_v3.md`
- `OUTSTANDING_ISSUES_v3.md`

---

## 🚀 START HERE

**Order of operations:**
1. Bug 1: Provider Portal unsaved changes warning (30 min)
2. Bug 2: Admin Dashboard badges (30 min) 
3. Bug 3: Clean up Medical Test photos (15 min)
4. Bug 4: Collapsible hours section (20 min)
5. Bug 5: Favorites button (30-60 min depending on backend needs)
6. Bug 6: Share button (15 min)
7. Bug 7: Location icons (15 min)
8. Bug 8: Verify keyboard on real device (5 min)
9. Final testing
10. TestFlight build
