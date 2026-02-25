# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 10, 2026 (End of Session)

---

## ✅ MAJOR MILESTONE: TESTFLIGHT LIVE

**Build 27 is now available on TestFlight!**
- App: Findr Health
- Bundle ID: com.findrhealth.app
- Internal Testers: Tim Wetherill, A. Gagi
- Status: Testing (expires in 90 days)

---

## 🟢 COMPLETED TODAY (Jan 10)

### TestFlight Deployment
- [x] Created new "Findr Health" app in App Store Connect
- [x] Fixed bundle ID mismatch
- [x] Created distribution certificate & provisioning profile
- [x] Generated app icons with Findr logo (white background)
- [x] Added NSCameraUsageDescription to Info.plist
- [x] Uploaded build 27 to TestFlight
- [x] Configured encryption compliance
- [x] Set up internal testing group

### App Fixes
- [x] Security: Rotated 3 exposed Google API keys
- [x] Calendar: Extended to 12 months booking range
- [x] Auth: Prompt screen on app launch
- [x] Booking Detail: Fetches real data (not hardcoded)
- [x] My Bookings: Added bottom navigation bar
- [x] Payment UX: Updated card-required messaging

---

## 🟡 MEDIUM PRIORITY

### Issue 1: Calendar Date Picker UX
**Status:** 🟡 IMPROVED BUT COULD BE BETTER
**Current State:** 12-month range available
**Remaining Issues:**
- Limited scrolling UX (week view only)
- No month indicator visible
- Could benefit from monthly calendar view

**File:** `datetime_selection_screen.dart`

---

### Issue 2: Payment Method Selection
**Status:** 🟡 NEEDS REFINEMENT
**Problem:** Shows misleading defaults when no payment method configured
**Current State:** "Select payment method" with card-required messaging
**Recommendation:** Clear indication when no card is on file

**File:** `booking_review_screen.dart`

---

### Issue 3: Provider Photos
**Status:** 🟡 NOT STARTED
**Problem:** Test providers use placeholder images
**Action:** Upload real photos via Provider Portal or Admin Dashboard

---

### Issue 4: Email Service
**Status:** 🟡 WORKAROUND IN PLACE
**Problem:** SMTP connection timeout on booking notifications
**Workaround:** Made email calls non-blocking (fire-and-forget)
**Future Fix:** Configure reliable email service (SendGrid, AWS SES)

---

## 🟢 LOW PRIORITY / Future

### Issue 5: Location Picker
**Status:** ⏳ NOT STARTED
**Problems:**
- "Use current location" shows wrong name
- City search autocomplete not working
**Effort:** 2-3 hours

---

### Issue 6: Push Notifications
**Status:** ⏳ NOT STARTED
**Requirements:**
- Firebase FCM setup
- Backend notification triggers
**Effort:** 6-8 hours

---

### Issue 7: Provider Dashboard
**Status:** ⏳ NOT STARTED
**Requirements:**
- Provider-facing view of their profile
- Analytics (bookings, revenue, ratings)
**Effort:** 8-10 hours

---

## 🔐 SECURITY STATUS

| Item | Status | Notes |
|------|--------|-------|
| Google API Keys | ✅ ROTATED | 3 new restricted keys created |
| Environment Variables | 🟡 PENDING | Keys still hardcoded in some places |
| Stripe Keys | ✅ SECURE | In Railway env vars |
| MongoDB | ✅ SECURE | In Railway env vars |

### Pending Security Work
- [ ] Move Google Maps key to environment variables (iOS)
- [ ] Move Google Maps key to environment variables (Android)
- [ ] Audit all repos for remaining hardcoded secrets

---

## ✅ COMPLETED (Previous Sessions)

### Jan 9, 2026
| Issue | Solution |
|-------|----------|
| Booking API not called | Uncommented TODO, implemented chargeType |
| My Bookings hardcoded | Complete rewrite to fetch real data |
| Provider type filters broken | Title Case IDs |
| My Bookings back button | Navigate to home |
| Search tiles hard to read | Soft tint style |
| Location permission overflow | Made scrollable |
| Help & Support crash | Removed Clarity chat button |
| Stripe 'cash' error | Use chargeType: 'at_visit' |
| Email blocking booking | Made non-blocking |

### Jan 8, 2026
| Issue | Solution |
|-------|----------|
| Cloudinary photo upload | Created /api/upload/image endpoint |
| Hours of Operation display | Added to provider detail screen |
| Admin Hours tab | Full edit capability |
| Notifications screen | Bell icon opens notifications |
| Terms of Service | Full 16-section legal document |

---

## 📋 NEXT SESSION PRIORITIES

### Must Do
1. [ ] **Test app on TestFlight** - Full booking flow end-to-end
2. [ ] **Upload provider photos** - At least for demo providers
3. [ ] **Create demo providers** - One per type with all services

### Should Do
4. [ ] Refine calendar date picker UX
5. [ ] Improve payment method selection UI
6. [ ] Move API keys to environment variables

### If Time Permits
7. [ ] External TestFlight testers (requires Apple review)
8. [ ] Location picker improvements
9. [ ] Push notification setup

---

## 📊 STATUS SUMMARY

| Category | Status |
|----------|--------|
| **TestFlight** | ✅ LIVE - Build 27 |
| **Security** | ✅ Keys rotated |
| Booking API | ✅ Working |
| My Bookings Screen | ✅ Real data |
| Provider Filters | ✅ Fixed |
| Calendar Range | ✅ 12 months |
| Auth Flow | ✅ Prompt on launch |
| App Icons | ✅ Findr logo |
| Calendar UX | 🟡 Could improve |
| Payment UX | 🟡 Could improve |
| Provider Photos | 🟡 Placeholder |
| Email Notifications | 🟡 Non-blocking |

---

## 🔧 USEFUL COMMANDS

```bash
# TestFlight build (for future updates)
cd ~/Downloads/findr_health_app
flutter clean && flutter pub get
flutter build ios --release
open ios/Runner.xcworkspace
# In Xcode: Product → Archive → Distribute App

# Increment build number in Xcode before each upload
# General → Identity → Build (must increase each time)

# Test API
curl https://fearless-achievement-production.up.railway.app/api/health
```

---

*Document Version: 7.0 - January 10, 2026 (End of Session)*
