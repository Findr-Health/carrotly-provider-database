# FINDR HEALTH - OUTSTANDING ISSUES
## Version 14 | Updated: January 16, 2026 (Start of Day)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Methodology:** Maintain accuracy through rigorous verification and daily updates

---

## ✅ VERIFIED TODAY (January 16, 2026)

### 1. ⭐ Request Booking Backend - FULLY DEPLOYED ✅
- **Status:** VERIFIED COMPLETE
- **Verified:** January 16, 2026 (Start of Day)
- **Evidence:**
  - `jobs/expirationJob.js` exists (10KB)
  - `jobs/scheduler.js` exists (1.9KB)
  - All V2 endpoints present in `routes/bookings.js`:
    - `POST /reserve-slot` - Reserve slot (5 min hold)
    - `DELETE /reserve-slot/:id` - Release reservation
    - `GET /provider/pending` - Provider's pending confirmations
    - `POST /:id/confirm` - Provider confirms
    - `POST /:id/decline` - Provider declines
    - `POST /:id/reschedule` - Provider proposes new time
    - `POST /:id/accept-reschedule` - Patient accepts
    - `POST /:id/decline-reschedule` - Patient declines
- **Next Step:** Implement Flutter UX for Request Booking flow (Issue #3)

---

## 🟡 HIGH PRIORITY: Calendar Integration

### 2. Calendar Integration UX for NEW Provider Onboarding
- **Status:** NOT IMPLEMENTED
- **Priority:** P1
- **Impact:** New providers must manually find /calendar page after completing onboarding

**Task:** Create `StepCalendar.tsx` in `carrotly-provider-mvp/src/components/onboarding/`

**Requirements:**
- Show ALL calendar integration options:
  - ✅ Google Calendar (backend complete)
  - ✅ Microsoft Outlook (backend complete - confirmed Jan 15)
  - 🔜 iCal/CalDAV (Apple Calendar, etc.) - see Issue #6
- Include "I'll manage manually" skip option
- Reuse OAuth logic from existing `src/pages/Calendar.tsx`

**Also Required:**
- Update existing provider profile pages in portal MVP to show all calendar options
- Update `src/pages/onboarding/CompleteProfile.tsx` to include calendar step

**UI Design Reference:** See PROVIDER_ONBOARDING_DESIGNER_SPEC.md and Nov 2025 conversation history

---

### 3. Booking Modes UX in Consumer App (Flutter) - PRIMARY FOCUS
- **Status:** NEEDS DESIGN & IMPLEMENTATION
- **Priority:** P1
- **Backend:** ✅ COMPLETE (verified Jan 16)

**Task:** Design and implement UX for Request Booking flow in Flutter app

**Reference:** CALENDAR_OPTIONAL_BOOKING_FLOW_v2.md Section on Consumer App (Phase 4):
- Add booking mode badges (Instant Book vs Request)
- Update provider detail with response stats
- Implement slot reservation during checkout (5 min hold)
- Create reschedule response screen
- Add booking status timeline
- Implement deep linking from notifications
- Add offline queue
- Update push notification handling

**Deliverable:** Create UX recommendation document before implementation

---

### 4. Admin Dashboard Calendar Tab ✅ VERIFIED COMPLETE
- **Status:** ✅ FULLY FUNCTIONAL (Verified Jan 16, 2026)
- **Features Confirmed Working:**
  - Calendar Integration status (Google/Microsoft)
  - Connected email display
  - Sync direction and buffer time
  - OAuth Token Health (expiry, refresh status, failures)
  - Sync Diagnostics (last sync, status, consecutive failures)
  - Booking Integration Health (FreeBusy queries, Event creation stats)
- **Note:** Expired tokens show red "Token Expired" warning - providers must reconnect

---

### 5. Additional Calendar Integrations - Planning Required
- **Status:** PLANNING NEEDED
- **Priority:** P2

**5a. iCal/CalDAV Support (Apple Calendar, etc.)**
- Research CalDAV protocol implementation
- Determine feasibility and effort estimate
- Create implementation plan

**5b. Manual Integration Instructions**
- Create documentation for providers with unique booking platforms
- Include step-by-step instructions for manual availability management
- Contact: providers@findrhealth.com for assistance

**5c. NEW: Simple Findr Booking Platform**
- Create a built-in booking calendar for providers who don't use external calendars
- Features:
  - Manual availability entry by provider
  - Auto-populated by Findr user app booking flow
  - Simple calendar UI in Provider Portal
- Add to future roadmap

---

## 🟢 MEDIUM PRIORITY

### 6. Provider Photo Upload - Investigation Required
- **Status:** BUG - Photos upload but don't display
- **Symptom:** User can upload photos in provider portal successfully, but they do not appear in the consumer app
- **Investigation Needed:**
  1. Do photos save to Cloudinary correctly? Check Cloudinary dashboard
  2. Does backend return photo URLs in provider API response?
  3. Does Flutter app properly fetch and display photo URLs?
- **Files to Check:**
  - Provider Portal: Photo upload component
  - Backend: Provider routes returning photo data
  - Flutter: Provider detail screen photo display

---

### 7. Pay a Bill Feature - Deferred
- **Status:** DEFERRED until calendar/booking/photo issues resolved
- **Current Location:** Profile screen tile
- **Planned Features:**
  - Upload document or take photo
  - OCR scanning
  - AI analysis via Clarity
  - Suggest best prompt pay price
- **Dependencies:**
  - AI model development for prompt pay price calculation
  - Data sources: Medicare rates, Fair Health data, historical negotiation data (TBD)
- **Action:** Create structured plan AFTER completing Issues #1-6

---

## ✅ RESOLVED

### iOS App Crash on Standalone Launch ✅
- **Resolved:** January 15, 2026
- **Fix:** Removed `flutter_facebook_auth` and `flutter_secure_storage` packages
- **Status:** Working as of Jan 15

### Biometric Login ✅ (Deferred)
- **Status:** DEFERRED - Will test on future TestFlight build
- **Plan:** Retest after additional UI features are implemented
- **May already be resolved** - will confirm during testing

### Microsoft Calendar Integration ✅
- **Resolved:** January 15, 2026
- **Completed:**
  - Azure Portal app registration ✅
  - Backend OAuth routes in `calendar.js` ✅
  - Provider Portal UI (Microsoft button in Calendar.tsx) ✅
  - Environment variables added to Railway ✅
- **Tested:** Successfully

### Google Calendar Integration (Dashboard) ✅
- **Resolved:** January 14, 2026
- **Routes:** google/auth, google/callback, status, disconnect, freebusy, create-event
- **Portal:** Calendar page with Google OAuth UI

### Provider Portal Popup Warning ✅
- **Resolved:** January 15, 2026
- **Fix:** Added `!justSavedRef.current` check in `handleCancel()`

### Calendar Date Picker UX (User App) ✅
- **Resolved:** January 15, 2026
- **Fix:** Added month indicator when scrolling through dates

### Stripe Connect Integration ✅
- **Resolved:** January 14, 2026
- **Fee Structure:** 10% + $1.50 per booking (capped at $35)

### AI Chat Auth Required ✅
- **Resolved:** January 14, 2026
- **Guests see:** "Sign in to use Clarity" screen

### Admin Dashboard User List ✅
- **Resolved:** January 14, 2026
- **Payment Methods:** Fetches from Stripe API (PCI compliant)

---

## 📅 CALENDAR INTEGRATION - COMPLETE STATUS MATRIX

| Component | Status | Notes |
|-----------|--------|-------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | Deployed |
| └─ Provider Portal Dashboard Page | ✅ Complete | `Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need `StepCalendar.tsx` |
| └─ FreeBusy API | ✅ Complete | Needs booking integration |
| └─ Create Event API | ✅ Complete | Deployed |
| **Microsoft Outlook** | | |
| └─ Azure Portal Registration | ✅ Complete | Jan 15 |
| └─ Backend OAuth Routes | ✅ Complete | Jan 15 |
| └─ Provider Portal Dashboard Page | ✅ Complete | Jan 15 |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need in `StepCalendar.tsx` |
| **iCal/CalDAV (Apple)** | | |
| └─ All components | ❌ NOT STARTED | Planning needed |
| **Booking Integration** | | |
| └─ FreeBusy in slot calculation | ⚠️ VERIFY | Check if deployed with v2 |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ⚠️ UI CREATED | Backend verification needed |

---

## 🔧 ENVIRONMENT CONFIGURATION

### Railway Variables (Current)
```
ANTHROPIC_API_KEY
APP_URL
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_CLOUD_NAME
FROM_EMAIL
GMAIL_APP_PASSWORD
GMAIL_USER
GOOGLE_PLACES_API_KEY
JWT_SECRET
MONGODB_URI
NODE_ENV=production
RESEND_API_KEY
SENDGRID_API_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
MICROSOFT_CLIENT_ID          # Added Jan 15
MICROSOFT_CLIENT_SECRET      # Added Jan 15
MICROSOFT_TENANT_ID          # Added Jan 15
```

---

## 📊 PROGRESS TRACKER

| Category | Status | Notes |
|----------|--------|-------|
| Google Calendar (Dashboard) | ✅ 100% | Complete |
| Microsoft Calendar (Dashboard) | ✅ 100% | Complete Jan 15 |
| Calendar Onboarding Step | ❌ 0% | Need StepCalendar.tsx |
| iCal/CalDAV Support | ❌ 0% | Planning needed |
| Request Booking Backend | ✅ 100% | **VERIFIED Jan 16** |
| Request Booking UX (Flutter) | ❌ 0% | **PRIMARY FOCUS** |
| Admin Calendar Tab | ✅ 100% | **VERIFIED Jan 16** |
| Photo Upload Bug | 🔴 Investigation | Upload works, display broken |
| Pay a Bill Feature | ⏸️ Deferred | After calendar/booking/photos |

---

## 🎯 TODAY'S PRIORITIES (January 16, 2026)

### ✅ Completed
1. ~~Verify Request Booking backend deployment~~ → **VERIFIED COMPLETE**
2. ~~Test Admin Dashboard calendar tab backend~~ → **VERIFIED COMPLETE**

### Current Focus
3. **Design Request Booking UX for Flutter app (Issue #3)** - Create UX recommendation document

### Remaining
4. Investigate photo upload bug (Issue #6)
5. Begin StepCalendar.tsx implementation (Issue #2)

### If Time Permits
6. Research iCal/CalDAV implementation options (Issue #5)

---

## 📝 DOCUMENT MAINTENANCE NOTES

**Version Control:**
- Always increment version number on updates
- Include timestamp and session context
- Mark items as RESOLVED only after explicit confirmation

**Accuracy Protocol:**
- Verify claims through conversation search before documenting
- When uncertain, mark as "NEEDS VERIFICATION"
- Ask clarifying questions rather than assume

**Mission Reminder:**
> "Proceed as if you are a world class engineer who thrives in innovation and relishes the idea of providing users transparency and ease in navigating healthcare!"

---

*Document Version: 14.0 - January 16, 2026 (Start of Day)*  
*Next Review: End of January 16 session*
