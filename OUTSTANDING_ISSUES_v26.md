# FINDR HEALTH - OUTSTANDING ISSUES
## Priority-Ranked Action Items

**Version:** 2.6  
**Last Updated:** January 24, 2026 - 12:00 PM MT  
**Status:** Post-Clarity Price Launch - Ready for TestFlight Build 4

---

## 🎯 EXECUTIVE SUMMARY

**Major Achievement Today (Jan 24):**
- ✅ Clarity Price feature COMPLETE (4 screens, production-ready)
- ✅ Patient responsibility analysis with insurance adjustment
- ✅ PDF export via iOS Share Sheet (working)
- ✅ World-class design, zero bugs

**Current Status:**
- Mobile App: 9.7/10 quality, Clarity Price ready
- Backend: Healthy, needs Clarity Price integration
- Admin Dashboard: Functional, needs Clarity Price tab
- Provider Portal: Basic, needs scheduling feature

**Overall:** 21 tracked issues across 4 priorities

---

## 📊 ISSUE SUMMARY

| Priority | Count | Focus Area |
|----------|-------|------------|
| P0 (Critical) | 2 | Block TestFlight |
| P1 (High) | 8 | Next 2 sprints |
| P2 (Medium) | 7 | Following sprints |
| P3 (Low) | 4 | Future enhancements |
| **TOTAL** | **21** | **Active tracking** |

---

## 🔴 P0 - CRITICAL (Block TestFlight/Production)

### P0-1: Apple Sign-In Implementation
**Component:** User App - Authentication  
**Impact:** Required for App Store approval  
**Effort:** 2-3 hours  
**Status:** 🔴 Not started

**Why P0:**
App Store requires "Sign in with Apple" if app offers other third-party login (Google OAuth). Cannot submit to App Store without this.

**Tasks:**
- [ ] Configure Sign in with Apple in Apple Developer Portal
- [ ] Add Apple OAuth to backend (similar to Google)
- [ ] Implement in mobile app (sign_in_with_apple package)
- [ ] Test profile completion flow
- [ ] Verify multiple Apple IDs work

**Acceptance Criteria:**
- Apple button appears on login screen below Google
- OAuth flow completes successfully
- Profile completion works identically to Google
- Backend creates/authenticates users correctly

---

### P0-2: Stripe Payment Testing in TestFlight
**Component:** User App - Payments  
**Impact:** Cannot process real bookings in production  
**Effort:** 2-3 hours  
**Status:** 🔴 Not started

**Why P0:**
Payment functionality exists but completely untested with real Stripe test cards in TestFlight environment.

**What to Test:**
1. **Happy Path:**
   - Add test card: 4242 4242 4242 4242
   - Complete booking with payment
   - Verify Stripe dashboard shows transaction
   - Check booking status updates
   - Confirm receipt sent to user
   
2. **Failure Scenarios:**
   - Declined card: 4000 0000 0000 0002
   - Verify error message displays
   - Confirm booking not created
   - Check user can retry
   
3. **3D Secure:**
   - Test card: 4000 0025 0000 3155
   - Complete authentication flow
   - Verify payment processes

**Acceptance Criteria:**
- Can add test card to app
- Payment processing works end-to-end
- Stripe webhooks trigger correctly
- Failed payments handled gracefully
- Receipts generated and sent

---

## 🟠 P1 - HIGH PRIORITY (Next Sprint)

### P1-1: Favorites Not Saving Correctly
**Component:** User App - Favorites Feature  
**Impact:** Feature completely broken  
**Effort:** 2-3 hours  
**Status:** 🟠 Bug reported

**Problem:**
Users can tap heart to favorite providers, but:
- Favorites don't persist after app restart
- Heart icon state incorrect on cards
- Favorites screen shows empty
- No sync between home/search screens

**Root Cause:** TBD (needs debugging)

**Investigation Steps:**
1. Check if `POST /api/users/:id/favorites` endpoint exists/works
2. Verify Riverpod favorites provider state management
3. Test SharedPreferences persistence
4. Check provider ID consistency across screens
5. Review error logs

**Tasks:**
- [ ] Debug backend favorites endpoint
- [ ] Fix state management (favoritesProvider)
- [ ] Implement proper persistence
- [ ] Sync state across all screens
- [ ] Add loading states
- [ ] Handle offline scenarios

**Acceptance Criteria:**
- Tap heart → favorite saves immediately
- Heart reflects correct state everywhere (home, search, detail)
- Favorites persist after app restart
- Favorites screen shows all saved providers
- Unfavorite updates immediately

---

### P1-2: Admin Dashboard - Clarity Price Activity Tab
**Component:** Admin Dashboard  
**Impact:** Cannot monitor Clarity Price usage  
**Effort:** 4-6 hours  
**Status:** 🟠 New feature request

**Why Needed:**
Need to track Clarity Price adoption and usage without violating user privacy.

**Requirements:**
✅ **NO PII (Private Health Information):**
- No bill images stored
- No patient names
- No line-item details with amounts
- No linking to specific users
- Aggregate statistics ONLY

**Metrics to Track:**
```
Safe to Track:
✅ Total analyses run
✅ Date/time of analyses
✅ Verdict distribution (Fair/Elevated/Very Elevated)
✅ Average patient responsibility (anonymized)
✅ Average potential savings (anonymized)
✅ Provider name analyzed (public info, not PII)
✅ Geographic distribution (zip code only)
✅ Top procedure codes (CPT codes, no amounts)
```

**Dashboard Design:**
```
Clarity Price Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[📊 This Week]  [📅 This Month]  [📆 All Time]

Total Analyses: 247
Average Savings: $156
Active Users: 89

Verdict Distribution:
● Fair: 45 (18%)
● Slightly Elevated: 102 (41%)
● Significantly Elevated: 100 (41%)

Top Providers Analyzed:
1. Billings Clinic (23%)
2. Bozeman Deaconess (18%)
3. St. Vincent (15%)

Geographic Distribution:
59715 (Bozeman): 45%
59701 (Helena): 22%
...

[Export Report]
```

**Tasks:**
- [ ] Design anonymized data model
- [ ] Create backend analytics endpoint
- [ ] Build admin dashboard tab with charts
- [ ] Implement date range filters
- [ ] Add export to CSV functionality
- [ ] Set up 90-day auto-purge (compliance)
- [ ] Legal review of data collection

**Acceptance Criteria:**
- Admin can view aggregate statistics
- No PII visible anywhere
- Charts show trends over time
- Can filter by date range
- Export functionality works
- Complies with HIPAA privacy rules

---

### P1-3: Pricing Data Management Strategy
**Component:** Backend + Admin Dashboard  
**Impact:** Clarity Price accuracy depends on this  
**Effort:** Research (4 hours) + Implementation (12-16 hours)  
**Status:** 🟠 Strategic planning needed

**Current State:**
- Using hardcoded Medicare + 25-50% estimates
- Works for MVP demonstration
- Not scalable for production accuracy

**Problem:**
Need systematic approach to maintain accurate, up-to-date fair pricing data.

**Decision Points:**

**1. Data Source:**
- Option A: CMS Medicare Fee Schedule (free, public)
- Option B: Fair Health Consumer API (paid, ~$500/month)
- Option C: Healthcare Bluebook API (paid, ~$1000/month)
- Option D: State all-payer claims databases (varies by state)

**2. Update Mechanism:**
- Option A: Manual CSV uploads via admin dashboard
- Option B: Automated API sync (daily/weekly)
- Option C: Hybrid (automated baseline + manual overrides)

**3. Storage Structure:**
```javascript
{
  procedureCode: "99213",  // CPT code
  description: "Office visit, established patient, 15 min",
  medicareNationalRate: 100.00,
  regionalMultiplier: {
    "Mountain West": 1.15,  // 15% higher
    "California": 1.35,     // 35% higher
  },
  fairPriceMin: 125.00,  // Medicare + 25%
  fairPriceMax: 150.00,  // Medicare + 50%
  lastUpdated: "2026-01-01",
  dataSource: "CMS 2026 Fee Schedule"
}
```

**Recommended Approach (Hybrid):**
1. **Baseline:** CMS Medicare rates (free, automated)
2. **Markup:** Admin-configurable 25-50% range
3. **Regional:** State-level multipliers (researched)
4. **Overrides:** Admin can manually adjust specific procedures
5. **Updates:** Quarterly review, annual Medicare refresh

**Tasks:**
- [ ] Research data sources and costs
- [ ] Evaluate legal/licensing requirements
- [ ] Design database schema
- [ ] Build data import pipeline OR admin upload UI
- [ ] Implement regional adjustments
- [ ] Create update schedule (quarterly)
- [ ] Build QA/validation process
- [ ] Document methodology for transparency

**Questions to Answer:**
- Budget for data sources?
- State-by-state data needed?
- How to handle outliers?
- Liability exposure?
- Update frequency?

**Acceptance Criteria:**
- Pricing data comprehensive (top 1000 procedures)
- Update process defined and documented
- Admin can view/edit prices if needed
- Regional adjustments implemented
- Methodology transparent to users

---

### P1-4: Admin Dashboard - Enhanced Provider Editing
**Component:** Admin Dashboard  
**Impact:** Cannot fully manage provider data  
**Effort:** 3-4 hours  
**Status:** 🟠 Feature gap

**Current State:**
Can edit: Name, description, photos, badges  
Cannot edit: Address, phone, email, hours, services, pricing, insurance

**Why Needed:**
Admin needs ability to update ALL provider fields, especially when providers report incorrect information.

**Fields to Add:**
- [ ] Address (street, city, state, zip)
- [ ] Phone number (with validation)
- [ ] Email (with validation)
- [ ] Website URL
- [ ] Hours of operation (visual schedule editor)
- [ ] Services (add/remove/edit with pricing)
- [ ] Provider types (medical, dental, etc.)
- [ ] Insurance accepted (multi-select)
- [ ] Credentials (MD, DDS, etc.)
- [ ] Specialties

**Tasks:**
- [ ] Design comprehensive edit form
- [ ] Add validation for all fields
- [ ] Build services editor (add/remove with CRUD)
- [ ] Build hours editor (visual weekly schedule)
- [ ] Add insurance multi-select dropdown
- [ ] Implement change history log (audit trail)
- [ ] Test save functionality
- [ ] Verify changes reflect in mobile app

**Acceptance Criteria:**
- Admin can edit ANY provider field
- Validation prevents invalid data (phone format, email, etc.)
- Services can be added/removed with pricing
- Hours can be set visually
- Changes save correctly to backend
- Audit trail shows who changed what/when
- Mobile app reflects changes immediately

---

### P1-5: Provider Portal - Calendar Integration Testing
**Component:** Provider Portal  
**Impact:** Feature exists but reliability unknown  
**Effort:** 2-3 hours  
**Status:** 🟠 Needs testing

**Problem:**
Calendar integration code exists but needs comprehensive testing to ensure it works reliably.

**Test Scenarios:**
1. **Google Calendar Connection:**
   - [ ] Provider connects Google Calendar
   - [ ] OAuth flow completes
   - [ ] Permissions granted correctly
   
2. **Booking Sync:**
   - [ ] New booking appears in Google Calendar
   - [ ] Event includes correct details (patient name, time, service)
   - [ ] Sync happens within 5 minutes
   
3. **Booking Updates:**
   - [ ] Provider confirms booking → event updates
   - [ ] Provider declines booking → event removed
   - [ ] Patient cancels → event removed
   
4. **Edge Cases:**
   - [ ] Multiple bookings same day
   - [ ] Time zone handling (Montana vs Pacific vs Eastern)
   - [ ] All-day events don't conflict
   - [ ] Recurring events handled
   
5. **iCal Export:**
   - [ ] iCal feed generates correctly
   - [ ] Feed updates in real-time
   - [ ] Compatible with Apple Calendar

**Acceptance Criteria:**
- Bookings sync to provider calendar reliably
- Updates reflect within 5 minutes
- Time zones handled correctly
- No duplicate events created
- iCal export works for Apple Calendar
- Provider can disconnect/reconnect calendar

---

### P1-6: Provider Portal - Simple Scheduling Platform
**Component:** Provider Portal  
**Impact:** Provider retention and value  
**Effort:** 8-12 hours  
**Status:** 🟠 New feature request

**Why Needed:**
Providers want to use Findr Health for ALL their scheduling, not just marketplace bookings. This increases stickiness and value.

**MVP Requirements:**

**1. Provider Features:**
- [ ] Set weekly availability (Mon-Fri, 9-5, with lunch breaks)
- [ ] Block specific time slots (vacation, meetings)
- [ ] View all bookings (marketplace + direct) in one calendar
- [ ] Accept/decline booking requests
- [ ] Send manual booking confirmations

**2. Patient Booking (Public Link):**
- [ ] Unique booking link per provider (findrhealth.com/book/dr-smith)
- [ ] See available time slots
- [ ] Select slot and book appointment
- [ ] Provide name, phone, reason for visit
- [ ] Receive email confirmation

**3. Out of Scope (Future):**
- ❌ Payment processing (marketplace only for now)
- ❌ Automated reminders (future)
- ❌ Waitlist management (future)
- ❌ Recurring appointments (future)
- ❌ Multiple providers per practice (future)

**Data Model:**
```javascript
{
  providerId: "...",
  weeklySchedule: {
    monday: { start: "09:00", end: "17:00", breaks: [{start: "12:00", end: "13:00"}] },
    tuesday: { ... },
    ...
  },
  blockedSlots: [
    { date: "2026-02-01", start: "14:00", end: "16:00", reason: "Staff meeting" }
  ],
  bookings: [
    {
      type: "marketplace" | "direct",
      patientName: "Sarah Johnson",
      patientPhone: "406-555-1234",
      datetime: "2026-01-27T14:00:00",
      service: "Checkup",
      status: "confirmed"
    }
  ]
}
```

**Tasks:**
- [ ] Design data model
- [ ] Build weekly availability editor UI
- [ ] Create public booking page
- [ ] Implement conflict detection (no double-booking)
- [ ] Add email confirmations (SendGrid/similar)
- [ ] Build unified calendar view
- [ ] Test with real provider
- [ ] Generate shareable booking links

**Acceptance Criteria:**
- Provider can set weekly schedule
- Provider can block specific times
- Public booking link works
- No double-bookings possible
- Buffer time between appointments respected
- Confirmations sent automatically
- Provider sees ALL bookings (marketplace + direct) in one place

---

### P1-7: Real Provider Data Migration
**Component:** Database  
**Impact:** Still using test providers  
**Effort:** 6-8 hours  
**Status:** 🟠 Production requirement

**Current State:**
10 test providers with fake data

**Production Need:**
50-100 real Montana providers with accurate information

**Data to Collect:**
- Practice name
- Provider name(s)
- Specialties/provider types
- Address (verified)
- Phone (verified)
- Email (verified)
- Website
- Hours of operation
- Services offered with pricing
- Insurance accepted
- Photos
- Credentials

**Tasks:**
- [ ] Research Montana provider directories
- [ ] Contact providers for participation
- [ ] Collect accurate data
- [ ] Verify all information
- [ ] Upload photos
- [ ] Input into database
- [ ] Review in admin dashboard
- [ ] Test booking flow
- [ ] Get provider agreements signed

**Target Providers (Montana):**
- Billings Clinic
- Bozeman Health Deaconess
- St. Vincent Healthcare
- Logan Health
- Kalispell Regional
- Community Health Center of Bozeman
- + 44 more

**Acceptance Criteria:**
- At least 50 real providers in database
- All required fields complete and accurate
- Photos for all providers
- Verified contact information
- Provider consent/partnership agreements signed
- Tested booking flow with 5+ providers

---

### P1-8: Push Notifications for Bookings
**Component:** User App + Backend  
**Impact:** Users miss appointments without reminders  
**Effort:** 4-6 hours  
**Status:** 🟠 Not implemented

**Why Needed:**
Users need timely reminders to reduce no-shows and improve experience.

**Notification Types:**
1. **Booking Confirmed** (immediate)
   - "Your appointment at [Provider] on [Date] at [Time] has been confirmed!"
   
2. **Booking Declined** (immediate)
   - "Your booking request was declined. Here are alternative providers..."
   
3. **24-Hour Reminder**
   - "Reminder: You have an appointment tomorrow at [Provider] at [Time]"
   
4. **1-Hour Reminder**
   - "Reminder: Your appointment at [Provider] starts in 1 hour"
   
5. **Booking Cancelled by Provider**
   - "Unfortunately, [Provider] cancelled your appointment. Tap to reschedule."

**Technical Implementation:**
- Firebase Cloud Messaging (already set up?)
- Push notification permissions request
- Device token storage in backend
- Notification triggers in booking workflow
- Deep linking on notification tap

**Tasks:**
- [ ] Set up Firebase Cloud Messaging (if not already)
- [ ] Request notification permissions in app
- [ ] Store device tokens in backend
- [ ] Create notification service
- [ ] Add notification triggers (booking confirmed, etc.)
- [ ] Implement deep linking (tap opens booking detail)
- [ ] Add notification settings screen (enable/disable each type)
- [ ] Test all notification types
- [ ] Handle foreground vs background notifications

**Acceptance Criteria:**
- Notifications delivered reliably
- User can enable/disable each notification type in settings
- Tapping notification opens relevant screen (deep linking)
- Works in foreground and background
- Respects iOS "Do Not Disturb" settings
- No notification spam (rate limiting)

---

## 🟡 P2 - MEDIUM PRIORITY (Following Sprints)

### P2-1: App Store Submission Materials
**Component:** Marketing + Design  
**Impact:** Required for App Store launch  
**Effort:** 4-6 hours  
**Status:** 🟡 Preparation needed

**Required Materials:**

**1. App Icon:**
- 1024x1024px PNG (no alpha channel)
- High-resolution, professional
- Recognizable at small sizes

**2. Screenshots (5-10 per size):**
- iPhone 6.7" (iPhone 15 Pro Max): Required
- iPhone 6.5" (iPhone 14 Plus): Optional but recommended
- iPhone 5.5" (iPhone 8 Plus): Optional
- iPad Pro 12.9": Required if supporting iPad

**3. App Preview Video (Optional but Recommended):**
- 15-30 seconds showing key features
- Clarity Price demo perfect for this

**4. Metadata:**
- App name: "Findr Health"
- Subtitle: Compelling value prop (30 chars)
- Description: Engaging, keyword-rich (4000 chars)
- Keywords: ASO optimization (100 chars)
- What's New: Changelog

**5. URLs:**
- Privacy Policy: Required
- Support URL: Required
- Marketing URL: Optional

**6. Other:**
- Age rating: Medical app considerations
- Categories: Medical, Health & Fitness
- Copyright: Your company name
- Contact information

**Tasks:**
- [ ] Design professional app icon
- [ ] Create screenshots (use iPhone 15 Pro Max)
- [ ] Record app preview video (optional)
- [ ] Write compelling description
- [ ] Research ASO keywords
- [ ] Create support page
- [ ] Complete age rating questionnaire
- [ ] Prepare export compliance info

**Pro Tips:**
- Use template tools (AppLaunchpad, etc.)
- Show Clarity Price feature prominently
- A/B test screenshots if possible
- Localize for Spanish if targeting that market

---

### P2-2: Privacy Policy Updates for Clarity Price
**Component:** Legal Compliance  
**Impact:** Required for Clarity Price feature  
**Effort:** 2-3 hours + legal review  
**Status:** 🟡 Legal review needed

**Why Needed:**
Clarity Price handles health information. Privacy policy must explicitly address this.

**Sections to Add/Update:**

**1. Clarity Price Data Collection:**
```
"When you use our Clarity Price feature, we may temporarily 
process your medical bill image to provide analysis. We do NOT 
store your bill images. Analysis results are stored anonymously 
and cannot be linked back to you."
```

**2. Health Information:**
```
"We collect limited health-related information only when you 
voluntarily use our bill analysis feature. This information is 
processed solely to provide you with price comparisons and is 
not shared with third parties."
```

**3. Data Retention:**
```
"Medical bill images are deleted immediately after analysis. 
Anonymized analysis results (amounts, procedure codes) may be 
retained for up to 90 days to improve our service."
```

**4. User Rights:**
```
"You can delete your analysis history at any time from your 
profile settings. This will permanently remove all associated data."
```

**Tasks:**
- [ ] Draft privacy policy updates
- [ ] Review with legal counsel
- [ ] Get HIPAA compliance opinion
- [ ] Determine if BAA needed
- [ ] Update privacy policy on website
- [ ] Update in-app privacy policy link
- [ ] Add disclosure in Clarity Price flow
- [ ] Get user consent acknowledgment

**Questions for Legal:**
- Do we need HIPAA Business Associate Agreement?
- What's our liability for incorrect analysis?
- Can we store anonymized aggregate data?
- Do we need special consent beyond TOS?
- Any state-specific requirements (California CCPA, etc.)?

**Recommendation:**
- Store ZERO bill data permanently
- Immediate deletion after analysis
- Anonymized metrics only (no user linkage)
- Clear disclosure in app before upload
- Get legal review BEFORE production launch

---

### P2-3: Analytics and User Tracking
**Component:** Backend + Mobile  
**Impact:** Cannot measure feature success  
**Effort:** 3-4 hours  
**Status:** 🟡 Not implemented

**Why Needed:**
Need data to understand what users do, what works, and what doesn't.

**Key Metrics:**

**Acquisition:**
- User sign-ups (source: organic, referral, ads)
- Download-to-sign-up conversion
- Install source attribution

**Engagement:**
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- Session length
- Session frequency
- Screen views

**Feature Usage:**
- Provider searches per user
- Bookings created per user
- Clarity Price analyses per user
- PDF exports
- Favorites added

**Conversion:**
- Search-to-booking rate
- Booking completion rate
- Payment success rate
- Clarity Price usage rate

**Retention:**
- D1, D7, D30 retention
- Churn rate
- User lifecycle

**Technical Events to Track:**
```javascript
// User events
- user_signup (method: google, apple, email)
- user_login
- profile_completed

// Search events
- provider_search (query, filters)
- provider_viewed
- provider_favorited

// Booking events
- booking_initiated
- booking_payment_started
- booking_payment_completed
- booking_confirmed
- booking_cancelled

// Clarity Price events
- clarity_price_started
- clarity_price_bill_uploaded
- clarity_price_results_viewed
- clarity_price_script_viewed
- clarity_price_pdf_exported

// Errors
- error_occurred (screen, error_type, error_message)
```

**Tools to Consider:**
1. **Firebase Analytics** (free, integrated)
2. **Mixpanel** (powerful, paid, $20/mo+)
3. **Amplitude** (product analytics, $49/mo+)
4. **PostHog** (open source, self-hosted)

**Recommendation:** Start with Firebase (free, easy)

**Tasks:**
- [ ] Set up Firebase Analytics (or chosen tool)
- [ ] Define key events to track
- [ ] Implement event tracking in app
- [ ] Set up conversion funnels
- [ ] Create dashboards
- [ ] Configure alerts (drop in bookings, etc.)
- [ ] Add user properties (location, plan type, etc.)
- [ ] Test data collection

**Acceptance Criteria:**
- Events tracked accurately
- Dashboards show real-time data
- Funnels configured (search → booking)
- Can segment users (new vs returning, etc.)
- Data exports for deeper analysis

---

### P2-4: Error Monitoring and Crash Reporting
**Component:** Backend + Mobile  
**Impact:** Can't proactively fix bugs  
**Effort:** 2-3 hours  
**Status:** 🟡 Not implemented

**Why Needed:**
Catch crashes and errors BEFORE users report them.

**What to Monitor:**

**Mobile App:**
- App crashes
- API errors
- Rendering errors
- Network failures
- Payment failures

**Backend:**
- Unhandled exceptions
- API timeouts
- Database errors
- Authentication failures
- Payment processing errors

**Tools:**
1. **Sentry** (excellent for Flutter, $26/mo)
2. **Firebase Crashlytics** (free)
3. **Bugsnag** (good UX, $49/mo)

**Recommendation:** Sentry (best Flutter support)

**Tasks:**
- [ ] Set up Sentry account
- [ ] Add Sentry SDK to mobile app
- [ ] Add Sentry SDK to backend
- [ ] Configure source maps for readable stack traces
- [ ] Set up Slack/email alerts
- [ ] Test crash reporting (force crash)
- [ ] Create triage process (who responds to alerts?)
- [ ] Define severity levels (P0-P3)

**Acceptance Criteria:**
- Crashes reported automatically with stack traces
- Errors categorized by severity
- Alerts sent for critical errors
- Can reproduce issues from reports
- Track fix status (open, in progress, fixed)

---

### P2-5: Performance Optimization
**Component:** Mobile App  
**Impact:** User experience improvement  
**Effort:** 4-6 hours  
**Status:** 🟡 Enhancement

**Current State:**
App performs well but can be optimized.

**Areas to Optimize:**

**1. Image Loading:**
- [ ] Implement progressive loading
- [ ] Add image caching (cached_network_image)
- [ ] Compress images before upload
- [ ] Use WebP format where possible

**2. List Performance:**
- [ ] Implement pagination (load more)
- [ ] Use ListView.builder (already using?)
- [ ] Add pull-to-refresh
- [ ] Optimize provider card rendering

**3. API Calls:**
- [ ] Cache API responses (Hive or shared_preferences)
- [ ] Debounce search input (wait 300ms)
- [ ] Batch API calls where possible
- [ ] Add retry logic with exponential backoff

**4. App Size:**
- [ ] Run flutter build with --split-debug-info
- [ ] Enable obfuscation
- [ ] Remove unused assets
- [ ] Optimize images in assets folder

**5. Startup Time:**
- [ ] Lazy load features
- [ ] Defer non-critical initialization
- [ ] Optimize app initialization

**Target Metrics:**
- Initial load: <2 seconds
- Page transitions: <100ms
- List scrolling: 60fps
- API response: <500ms
- App size: <50MB

**Tasks:**
- [ ] Profile app with Flutter DevTools
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Measure improvements
- [ ] A/B test if significant changes

---

### P2-6: User Onboarding Flow
**Component:** Mobile App  
**Impact:** First-time user experience  
**Effort:** 3-4 hours  
**Status:** 🟡 Enhancement

**Why Needed:**
New users don't know how to use the app. Need guided onboarding.

**Onboarding Screens:**

**Screen 1: Welcome**
```
[Hero Image]
Welcome to Findr Health
Find and book healthcare appointments in seconds

[Continue]  [Skip]
```

**Screen 2: Search**
```
[Search Demo]
Search by Provider, Service, or Location
Verified providers with transparent pricing

[Continue]  [Skip]
```

**Screen 3: Book**
```
[Booking Demo]
Book Appointments Instantly
No phone calls, no waiting

[Continue]  [Skip]
```

**Screen 4: Clarity Price**
```
[Bill Analysis Demo]
Clarity Price™: Analyze Your Bills
See if you're being overcharged, get negotiation scripts

[Continue]  [Skip]
```

**Screen 5: Notifications**
```
[Notification Icon]
Stay Updated
Get booking confirmations and appointment reminders

[Enable Notifications]  [Skip]
```

**Implementation:**
- Use intro_screen package or custom
- Show only once (track in SharedPreferences)
- Add "Show again" option in Settings
- Skippable at any point

**Tasks:**
- [ ] Design onboarding screens
- [ ] Implement with animations
- [ ] Add skip functionality
- [ ] Track completion in analytics
- [ ] Test with new users
- [ ] Measure impact on engagement

---

### P2-7: Help and Support Section
**Component:** Mobile App  
**Impact:** User self-service  
**Effort:** 3-4 hours  
**Status:** 🟡 Missing

**Contents Needed:**

**FAQ:**
- How do I book an appointment?
- Can I cancel or reschedule?
- What payment methods are accepted?
- How does Clarity Price work?
- Is my health information private?
- How do I favorite a provider?

**How-To Guides:**
- How to search for providers
- How to analyze a medical bill
- How to export a PDF report
- How to update your profile

**Contact Support:**
- Email: support@findrhealth.com
- Response time: 24 hours
- Report a bug
- Feature request

**Legal:**
- Terms of Service
- Privacy Policy
- About Findr Health
- App version and build number

**Tasks:**
- [ ] Write FAQ content (15-20 questions)
- [ ] Create how-to guides with screenshots
- [ ] Build help screen UI
- [ ] Add search functionality
- [ ] Implement contact form
- [ ] Set up support email routing
- [ ] Test all links and flows

---

## 🟢 P3 - LOW PRIORITY (Future)

### P3-1: Appointment Card Overflow Fix
**Component:** Mobile App - UI  
**Impact:** Cosmetic only  
**Effort:** 30 minutes  
**Status:** 🟢 Cosmetic bug

**Description:**
Appointment card on home screen has 2px overflow. Purely visual, doesn't affect functionality.

**Fix:**
- Adjust padding in appointment card widget
- Test on multiple screen sizes
- Verify no new overflows introduced

---

### P3-2: Rating and Review Prompts
**Component:** Mobile App  
**Impact:** App Store optimization  
**Effort:** 2-3 hours  
**Status:** 🟢 Enhancement

**Why:**
Positive reviews help App Store ranking and social proof.

**Best Practices:**
- Wait until user completes 2-3 bookings
- Use native iOS review prompt (SKStoreReviewController)
- Don't prompt more than once per 30 days
- Don't prompt after negative experience (cancelled booking, etc.)

**Tasks:**
- [ ] Implement prompt logic
- [ ] Track trigger conditions (3 completed bookings)
- [ ] Test prompt appears correctly
- [ ] Respect "Don't ask again" preference
- [ ] Track prompt-to-review conversion

---

### P3-3: Social Sharing
**Component:** Mobile App  
**Impact:** Viral growth  
**Effort:** 2-3 hours  
**Status:** 🟢 Enhancement

**Share Options:**
- Provider profile → "Check out this provider!"
- Booking confirmation → "I booked at..."
- Clarity Price results → Already implemented ✅
- Referral link → "Join Findr Health" (with credit?)

**Tasks:**
- [ ] Add share buttons
- [ ] Generate share text/images
- [ ] Implement deep linking (shared links open app)
- [ ] Track viral coefficient (shares → installs)

---

### P3-4: Dark Mode Support
**Component:** Mobile App  
**Impact:** User preference  
**Effort:** 4-6 hours  
**Status:** 🟢 Enhancement

**Why:**
Many users prefer dark mode, especially for health apps used at night.

**Tasks:**
- [ ] Define dark mode color palette
- [ ] Update all screens with dark mode support
- [ ] Test readability of all text
- [ ] Add theme toggle in settings
- [ ] Follow system preference by default
- [ ] Test with OLED screens

---

## 📋 SPRINT PLANNING

### Sprint 1: TestFlight Build 4 (This Week)
**Goal:** Ship Clarity Price to testers

**Tasks:**
1. ✅ Clarity Price feature (DONE!)
2. Apple Sign-In (P0, 2-3 hours)
3. Stripe testing (P0, 2-3 hours)
4. Upload provider photos (2 hours)
5. Build and submit to TestFlight (1 hour)

**Total:** 7-9 hours  
**Outcome:** Polished TestFlight build

---

### Sprint 2: Stability & Monitoring (Week 2)
**Goal:** Fix bugs, add monitoring

**Tasks:**
1. Favorites bug fix (P1, 2-3 hours)
2. Push notifications (P1, 4-6 hours)
3. Analytics setup (P2, 3-4 hours)
4. Error monitoring (P2, 2-3 hours)

**Total:** 11-16 hours  
**Outcome:** Stable, monitored app

---

### Sprint 3: Admin Tools (Week 3)
**Goal:** Admin dashboard improvements

**Tasks:**
1. Clarity Price analytics tab (P1, 4-6 hours)
2. Enhanced provider editing (P1, 3-4 hours)
3. Pricing data strategy (P1, research + design, 6-8 hours)

**Total:** 13-18 hours  
**Outcome:** Admin can manage effectively

---

### Sprint 4: Provider Tools (Week 4)
**Goal:** Provider portal improvements

**Tasks:**
1. Calendar integration testing (P1, 2-3 hours)
2. Simple scheduling platform (P1, 8-12 hours)
3. Real provider data migration (P1, 6-8 hours)

**Total:** 16-23 hours  
**Outcome:** Providers can self-serve

---

### Sprint 5: Production Launch (Week 5)
**Goal:** App Store submission

**Tasks:**
1. App Store materials (P2, 4-6 hours)
2. Privacy policy updates (P2, 2-3 hours + legal)
3. Performance optimization (P2, 4-6 hours)
4. Help section (P2, 3-4 hours)
5. Final QA

**Total:** 13-19 hours  
**Outcome:** App Store submission

---

## 📊 EFFORT SUMMARY

**By Priority:**
- P0: 4-6 hours (critical)
- P1: 35-48 hours (high)
- P2: 21-30 hours (medium)
- P3: 9-14 hours (low)
- **TOTAL:** 69-98 hours (5 sprints)

**By Component:**
- Mobile App: 40-55 hours
- Backend: 10-15 hours
- Admin Dashboard: 10-14 hours
- Provider Portal: 10-15 hours
- Legal/Compliance: 2-3 hours

---

## ✅ DEFINITION OF DONE

**For TestFlight Build 4:**
- [ ] Clarity Price accessible and working
- [ ] Apple Sign-In functional
- [ ] Stripe payment tested
- [ ] Provider photos uploaded
- [ ] No P0 bugs

**For Production:**
- [ ] All P0 issues resolved
- [ ] 90% of P1 issues resolved
- [ ] App Store approved
- [ ] 50+ real providers
- [ ] Analytics live
- [ ] Monitoring live
- [ ] Legal compliance confirmed

---

## 📝 NOTES

### Context
This document tracks ALL known issues and enhancements for Findr Health. Issues are prioritized based on impact and urgency.

### Priority Definitions
- **P0 (Critical):** Blocks TestFlight or production launch
- **P1 (High):** Important for user experience, schedule soon
- **P2 (Medium):** Valuable improvements, plan accordingly  
- **P3 (Low):** Nice to have, backlog items

### Next Update
This document will be reviewed and updated after each sprint (weekly).

---

*Last Updated: January 24, 2026 - 12:00 PM MT*  
*Version: 2.6*  
*Next Review: January 27, 2026*  
*Status: 21 issues tracked, Clarity Price complete, ready for TestFlight Build 4*
