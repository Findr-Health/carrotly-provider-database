# Findr Health Consumer App - User Flow Document

**Version:** 1.1  
**Last Updated:** January 2, 2026  
**Platform:** Flutter (iOS + Android)  
**Backend:** Node.js/MongoDB on Railway  

---

## Revision Notes (v1.1)

**Screens Added (25 new screens):**
- Onboarding carousel (3 screens) + Location/Notification permission screens
- Biometric login setup
- Filter & Sort bottom sheets for search
- Photo gallery viewer, Share provider, Report provider
- No availability + Notify me flow
- Add to calendar integration
- Provider-initiated cancel/reschedule handling (2 screens)
- Change password, Linked accounts, About/App version, Appearance settings
- Share app / Referral screen
- Contact support, Maintenance mode, Session expired, What's new, Location denied

**API Endpoints Added:**
- Change password, Linked accounts management
- Recent searches with clear
- Report provider, Availability alerts
- Promo code validation
- Calendar event generation
- Provider reschedule response
- Referral system

**Navigation Updates:**
- Added onboarding flow before auth
- Added biometric login path
- Added notification permission after signup
- Added provider-initiated booking change flows
- Added new deep link routes

**Total Screens: 79** (up from 54)

---

## Table of Contents

1. [Screen Inventory](#1-screen-inventory)
2. [Navigation Map](#2-navigation-map)
3. [State Definitions](#3-state-definitions)
4. [Component Library](#4-component-library)
5. [API Endpoint Mapping](#5-api-endpoint-mapping)
6. [Design Specifications](#6-design-specifications)

---

## 1. Screen Inventory

### 1.1 Onboarding & Authentication

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `ONBR-001` | Onboarding Carousel - Page 1 | "Find Healthcare Providers" - illustration + headline + subtext, skip button, pagination dots | First app launch (never seen onboarding) |
| `ONBR-002` | Onboarding Carousel - Page 2 | "Transparent Pricing" - illustration showing prices upfront, no surprises | Swipe from Page 1 |
| `ONBR-003` | Onboarding Carousel - Page 3 | "Book Instantly" - illustration showing booking flow, "Get Started" CTA | Swipe from Page 2 |
| `ONBR-004` | Location Permission | Map illustration, "Enable Location" headline, explanation of benefits, "Allow" / "Not Now" buttons | After onboarding carousel OR first search |
| `ONBR-005` | Notification Permission | Bell illustration, "Stay Updated" headline, benefits list, "Enable" / "Not Now" buttons | After first booking OR from settings prompt |
| `AUTH-001` | Splash Screen | App logo animation (2.5s), checks auth state, routes to Home or Sign In | App launch |
| `AUTH-002` | Sign In | Email/password fields, social auth (Facebook, Google, Apple), "Remember me" toggle, "Forgot password" link, biometric login option (if enabled) | Splash (unauthenticated), Sign Up link, Logout |
| `AUTH-003` | Sign Up | Email/password/confirm password, Terms checkbox, social auth options | Sign In link |
| `AUTH-004` | Email Verification | 6-digit OTP input, resend timer (60s), masked email display | After Sign Up submit |
| `AUTH-005` | Forgot Password - Method | Select contact method (email card or phone card) | Sign In "Forgot password" link |
| `AUTH-006` | Forgot Password - OTP | 6-digit code entry, resend timer | After method selection |
| `AUTH-007` | Create New Password | New password + confirm fields, validation rules display | After OTP verification |
| `AUTH-008` | Password Reset Success | Success illustration, "Continue" button to Sign In | After password created |
| `AUTH-009` | Biometric Setup | Face ID/Touch ID illustration, "Enable Biometric Login" headline, "Enable" / "Skip" buttons | After first successful login (optional prompt) |

### 1.2 Main Navigation (3-Tab Structure)

| Screen ID | Screen Name | Description | Tab Position |
|-----------|-------------|-------------|--------------|
| `HOME-001` | Home | Personalized feed with greeting, search bar, next appointment, provider sections, category grid | Tab 1 (Home icon) |
| `CHAT-001` | Clarity AI Chat | AI assistant for healthcare navigation and provider discovery | Tab 2 (Center compass) |
| `PROF-001` | Profile Hub | User photo, 6 action tiles, settings access | Tab 3 (Profile icon) |

### 1.3 Home & Discovery

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `HOME-001` | Home | Greeting, search bar (voice enabled), "Your Next Appointment" card (tap to expand to full list), horizontal provider sections (Viewed, Our Picks, What's Popular, Just Added), "Explore by Type" category grid, floating Clarity button | Bottom nav Tab 1 |
| `SRCH-001` | Search Keyword | Search input (focused), recent searches with clear all option, top categories with icons | Tap search bar on Home |
| `SRCH-002` | Search Results (Map + List) | Split view: map with cluster markers + draggable bottom sheet with provider cards, filter row (Sort, Price, Verified) | Submit search, tap category |
| `SRCH-003` | Filter Bottom Sheet | Full filter options: Provider Type (multi-select), Distance slider, Price Range, Rating minimum, Verified only toggle, "Apply" / "Reset" buttons | Tap filter icon on Search Results |
| `SRCH-004` | Sort Bottom Sheet | Radio options: Nearest, Highest Rated, Price Low-High, Price High-Low, Most Reviewed | Tap "Sort" on Search Results |
| `PROV-001` | Provider Detail | Hero image gallery (tap to expand), heart/share actions, rating, address, hours status, service tabs with pricing, team avatars, reviews preview, cancellation policy info, "About us", "Report" option in menu | Tap provider card anywhere |
| `PROV-002` | Provider Reviews (Full List) | Star filter tabs (All, 5★, 4★, etc.), scrollable review cards | "See All" on Provider Detail reviews |
| `PROV-003` | Provider Team (Full List) | Grid of team members with photos, names, ratings | "See All" on Provider Detail team |
| `PROV-004` | Photo Gallery Viewer | Full-screen swipeable image gallery with close button, pagination indicator | Tap hero image on Provider Detail |
| `PROV-005` | Share Provider Sheet | Native share sheet with provider link, preview card | Tap share icon on Provider Detail |
| `PROV-006` | Report Provider | Reason selection (Inappropriate content, Fake listing, Other), description textarea, "Submit" button | "Report" in Provider Detail menu |

### 1.4 Booking Flow

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `BOOK-001` | Select Team Member | Optional step - list of available professionals with photos, ratings, "Any available" option at top | Tap "Book" on service (if provider has team) |
| `BOOK-002` | Select Date & Time | Calendar picker (pre-selects next available), time slot chips (30-min intervals), availability from provider calendar | After service/team selection |
| `BOOK-003` | Payment Methods | Select existing card (PayPal, Google Pay, Apple Pay, saved cards) or add new, secure payment badge | After date/time confirmed |
| `BOOK-004` | Add New Card | Card visual preview, form fields (number, name, expiry, CVV), "Add" button, Stripe badge | Tap "Add New Card" on Payment Methods |
| `BOOK-005` | Review Summary | Provider info, service, team member (if selected), date/time, duration, cancellation policy summary, optional promo code field, optional booking notes, price breakdown (subtotal + platform fee + total), "Confirm" button | After payment method selected |
| `BOOK-006` | Enter PIN | 4-digit PIN pad for booking confirmation, secure payment indicator | Tap "Confirm" on Review Summary |
| `BOOK-007` | Booking Failed | Red X illustration, error message, "Try Again" / "Cancel" buttons | PIN verification failed or payment error |
| `BOOK-008` | Booking Success | Teal checkmark illustration, confirmation message, booking ID, "Add to Calendar" button, "View Appointment" / "Done" buttons | Booking completed successfully |
| `BOOK-009` | No Availability | Calendar showing no slots, "No availability this month" message, "Notify Me" button to get alerts when slots open, "Try Different Date" button | Date selection when provider fully booked |
| `BOOK-010` | Add to Calendar Sheet | Options: Apple Calendar, Google Calendar, Outlook, "Download .ics", Cancel | Tap "Add to Calendar" on success screen |

### 1.5 My Bookings

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `MYBK-001` | My Bookings | Tab bar (Upcoming, Completed, Cancelled), booking cards with actions | Home "Next Appointment" expand, Profile "Your Bookings" |
| `MYBK-002` | Booking Detail | Full appointment info, provider details, service, price paid, booking ID, actions (Cancel, Reschedule, Get Directions, Add to Calendar, Contact Support) | Tap booking card |
| `MYBK-003` | Reschedule - Reason | Radio button list of reasons + "Others" textarea | Tap "Reschedule" on booking |
| `MYBK-004` | Reschedule - Date/Time | Calendar + time slots (same as BOOK-002) | After reason selected |
| `MYBK-005` | Reschedule Success | Success illustration, "View Appointment" / "Done" buttons | Reschedule confirmed |
| `MYBK-006` | Cancel - Confirmation Modal | Overlay showing refund amount (based on cancellation policy), policy explanation, "Back" / "Yes, Cancel" buttons | Tap "Cancel" on booking |
| `MYBK-007` | Cancel - Reason | Radio button list of reasons + "Others" textarea | Confirm cancellation |
| `MYBK-008` | Cancel Success | Success illustration, refund info, "OK" button | Cancellation processed |
| `MYBK-009` | Provider Cancelled Notice | Modal/screen explaining provider cancelled, full refund confirmation, "Find Similar Providers" / "OK" buttons | Push notification deep link when provider cancels |
| `MYBK-010` | Provider Reschedule Request | Modal showing new proposed time, "Accept" / "Decline" / "Request Different Time" buttons | Push notification deep link when provider requests reschedule |

### 1.6 Favorites

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `FAV-001` | Favorites List | Category filter chips (All, General, Dentist, etc.), provider cards with red heart icons | Profile "Favorites" tile |
| `FAV-002` | Remove Favorite Modal | Provider preview card, "Cancel" / "Yes, Remove" buttons | Tap heart icon on favorited provider |

### 1.7 Reviews

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `REV-001` | Write Review | Provider photo, star rating selector, review textarea, "Would you recommend?" toggle | Push notification (24-48hr post-appointment), Booking Detail |
| `REV-002` | Review Success | Success illustration with star icon, "OK" button | Review submitted |

### 1.8 Profile & Settings

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `PROF-001` | Profile Hub | User photo with edit badge, name, 6 action tiles (Edit Profile, Favorites, Pay Bill/Claim, Rewards, Payment + Insurance, Your Bookings), settings gear icon | Bottom nav Tab 3 |
| `PROF-002` | Edit Profile | Form fields: name, DOB (date picker), email (read-only if verified), country dropdown, phone with country code, gender dropdown, "Update" button | Profile "Edit Profile" tile |
| `PROF-003` | Share App / Referral | Unique referral code, share options (copy link, SMS, email, social), referral benefits explanation | Profile or Settings |
| `PAY-001` | Payment Methods | List of saved cards (visual previews), default indicator, "Add New Card" button | Profile "Payment + Insurance" tile |
| `PAY-002` | Add Payment Card | Same as BOOK-004 | Tap "Add New Card" |
| `INS-001` | Insurance Cards | List of saved insurance cards | Profile "Payment + Insurance" tile (tab or section) |
| `INS-002` | Add Insurance Card | Insurance card visual, fields: Provider, Policy Number, Group Number, Member ID | Tap "Add Insurance" |
| `SET-001` | Settings | Grouped list: Account (Edit Profile, Change Password, Linked Accounts, Notifications), Preferences (Location, Appearance), Support (Help Center, Report Problem, Contact Us), Legal (Terms, Privacy), About (App Version), Danger Zone (Log Out, Delete Account) | Profile gear icon |
| `SET-002` | Notifications Settings | Toggles for push, email, SMS by category (bookings, reminders, promotions, provider updates) | Settings "Notifications" |
| `SET-003` | Privacy Policy | Scrollable legal text with consent toggles | Settings "Privacy Policy" |
| `SET-004` | Terms and Conditions | Scrollable legal text | Settings "Terms and Conditions" |
| `SET-005` | Help Center | FAQ accordion or searchable help articles, "Contact Support" button | Settings "Help Center" |
| `SET-006` | Report a Problem | Category dropdown, description textarea, screenshot attach option, "Submit" button | Settings "Report a Problem" |
| `SET-007` | Delete Account | Warning message, consequences list, password confirmation, "Delete Account" button (red) | Settings "Delete Account" |
| `SET-008` | Logout Confirmation Modal | "Are you sure?" message, "Cancel" / "Log Out" buttons | Settings "Log Out" |
| `SET-009` | Change Password | Current password, new password, confirm new password, validation rules, "Update" button | Settings "Change Password" |
| `SET-010` | Linked Accounts | List of connected social providers (Facebook, Google, Apple) with connect/disconnect toggles | Settings "Linked Accounts" |
| `SET-011` | About / App Version | App logo, version number, build number, "Check for Updates" button, links to website, social media | Settings "About" |
| `SET-012` | Contact Support | Options: Email, Phone, Live Chat (if available), operating hours | Settings "Contact Us" or Help Center |
| `SET-013` | Appearance Settings | Options: Light, Dark, System Default (with preview) | Settings "Appearance" |

### 1.9 Clarity AI Chat

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `CHAT-001` | Clarity Welcome | Findr logo, greeting message, quick action chips, text input with mic | Bottom nav Tab 2 (first visit or new conversation) |
| `CHAT-002` | Clarity Conversation | Chat bubbles (AI left/gray, user right/teal), provider cards inline, timestamps, text input | After first message sent |
| `CHAT-003` | Clarity with Keyboard | Active typing state with word suggestions | Input field focused |

### 1.10 Notifications

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `NOTF-001` | Notifications List | Color-coded notification cards (red=cancelled, orange=changed, teal=success), "New" badges, timestamps | Bell icon (Header or Profile) |

### 1.11 Utility Screens

| Screen ID | Screen Name | Description | Entry Points |
|-----------|-------------|-------------|--------------|
| `UTIL-001` | No Connection | Offline illustration, "No internet connection" message, "Retry" button | Any screen when offline |
| `UTIL-002` | Force Update | App update illustration, version info, "Update Now" button (links to store), cannot dismiss | App launch when version < minimum |
| `UTIL-003` | Soft Update Prompt | Update available modal, what's new summary, "Update" / "Later" buttons | App launch when update available |
| `UTIL-004` | Guest Login Prompt | Modal explaining login required to book, benefits list, "Sign In" / "Create Account" / "Cancel" buttons | Tap "Book" or "Favorite" as guest |
| `UTIL-005` | Maintenance Mode | Maintenance illustration, "We'll be back soon" message, estimated time if available | App launch during maintenance |
| `UTIL-006` | Location Permission Denied | Illustration, explanation of why location helps, "Open Settings" / "Enter Location Manually" buttons | Search when location denied |
| `UTIL-007` | Session Expired | Modal explaining session expired for security, "Sign In Again" button | API returns 401 and refresh fails |
| `UTIL-008` | What's New | Carousel of new features after app update, "Got it" button | First launch after update (optional, for major releases) |

---

## 2. Navigation Map

### 2.1 App Entry Flow

```
App Launch
    │
    ▼
┌─────────────────┐
│  Splash Screen  │
│    AUTH-001     │
└────────┬────────┘
         │
         ├─── Version < Minimum ────────────────► UTIL-002 (Force Update)
         │
         ├─── Maintenance Mode ─────────────────► UTIL-005 (Maintenance)
         │
         ├─── First Launch (never seen onboarding) ──► ONBR-001 (Onboarding Carousel)
         │                                                    │
         │                                                    └──► ONBR-004 (Location Permission)
         │                                                              │
         │                                                              └──► AUTH-002 (Sign In)
         │
         ├─── Token Valid ──────────────────────► HOME-001 (Home)
         │                                              │
         │                                              └─► (Optional) UTIL-008 (What's New)
         │
         └─── No Token / Invalid ───────────────► AUTH-002 (Sign In)
```

### 2.2 Authentication Flow

```
┌─────────────────┐
│    Sign In      │
│    AUTH-002     │
└────────┬────────┘
         │
         ├─── Email/Password ───► Validate ───► AUTH-009 (Biometric Setup, optional)
         │                                           │
         │                                           └──► HOME-001
         │
         ├─── Biometric ────────► Validate ───► HOME-001
         │
         ├─── Social Auth ──────► OAuth Flow ──► HOME-001
         │
         ├─── "Sign Up" ────────► AUTH-003 (Sign Up)
         │
         └─── "Forgot Password" ► AUTH-005 (Method Select)


┌─────────────────┐
│    Sign Up      │
│    AUTH-003     │
└────────┬────────┘
         │
         └─── Submit ───────────► AUTH-004 (Email Verification)
                                      │
                                      └─► Verified ──► ONBR-005 (Notification Permission)
                                                            │
                                                            └──► HOME-001


┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Forgot Password │        │   Enter OTP     │        │  New Password   │
│    AUTH-005     │───────►│    AUTH-006     │───────►│    AUTH-007     │
└─────────────────┘        └─────────────────┘        └────────┬────────┘
                                                               │
                                                               └──► AUTH-008 (Success) ──► AUTH-002
```

### 2.3 Main Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        BOTTOM NAV BAR                           │
├─────────────────┬─────────────────────┬─────────────────────────┤
│                 │                     │                         │
│   🏠 Home       │   ◇ Clarity         │      👤 Profile         │
│   HOME-001      │   CHAT-001/002      │      PROF-001           │
│                 │                     │                         │
└─────────────────┴─────────────────────┴─────────────────────────┘
                              │
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    Floating Clarity    Center Tab         Quick Access
    Button (on all      (dedicated         from Home
    screens except      chat screen)       "Next Appointment"
    Chat screen)
```

### 2.4 Home to Booking Flow

```
┌─────────────────┐
│      Home       │
│    HOME-001     │
└────────┬────────┘
         │
         ├─── Tap Search Bar ───────────────────► SRCH-001 (Search Keyword)
         │                                             │
         │                                             └──► SRCH-002 (Results)
         │
         ├─── Tap Category Tile ────────────────► SRCH-002 (Results filtered)
         │
         ├─── Tap Provider Card ────────────────► PROV-001 (Provider Detail)
         │
         └─── Tap "Next Appointment" ───────────► MYBK-001 (My Bookings)


┌─────────────────┐
│ Search Results  │
│    SRCH-002     │
└────────┬────────┘
         │
         ├─── Tap Provider Card ────────────────► PROV-001
         │
         ├─── Tap Map Marker ───────────────────► Highlight Card ──► PROV-001
         │
         └─── Adjust Filters ───────────────────► Refresh Results


┌─────────────────┐
│ Provider Detail │
│    PROV-001     │
└────────┬────────┘
         │
         ├─── Tap Heart Icon ───────────────────► Toggle Favorite (or Guest Prompt)
         │
         ├─── Tap "Book" on Service ────────────► Guest? ──► UTIL-004
         │                                             │
         │                                             └─► Logged In:
         │                                                    │
         │                                     Has Team? ─────┼───── No ──► BOOK-002
         │                                                    │
         │                                                    └─── Yes ──► BOOK-001
         │
         ├─── Tap Team "See All" ───────────────► PROV-003
         │
         └─── Tap Reviews "See All" ────────────► PROV-002
```

### 2.5 Complete Booking Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select Team    │     │ Select DateTime │     │ Payment Method  │
│    BOOK-001     │────►│    BOOK-002     │────►│    BOOK-003     │
│   (optional)    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
         ┌───────────────────────────────────────────────┤
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│  Add New Card   │                             │ Review Summary  │
│    BOOK-004     │────────────────────────────►│    BOOK-005     │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │    Enter PIN    │
                                                │    BOOK-006     │
                                                └────────┬────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    │                                         │
                                    ▼                                         ▼
                           ┌─────────────────┐                       ┌─────────────────┐
                           │ Booking Failed  │                       │ Booking Success │
                           │    BOOK-007     │                       │    BOOK-008     │
                           └────────┬────────┘                       └────────┬────────┘
                                    │                                         │
                                    ▼                                         ▼
                              Try Again ──► BOOK-006                   MYBK-002 (Detail)
```

### 2.6 Booking Management Flow

```
┌─────────────────┐
│   My Bookings   │
│    MYBK-001     │
└────────┬────────┘
         │
         └─── Tap Booking Card ─────────────────► MYBK-002 (Booking Detail)
                                                       │
                    ┌──────────────────────────────────┼──────────────────────────────────┐
                    │                                  │                                  │
                    ▼                                  ▼                                  ▼
           ┌─────────────────┐                ┌─────────────────┐                ┌─────────────────┐
           │   Reschedule    │                │     Cancel      │                │  Get Directions │
           │    MYBK-003     │                │    MYBK-006     │                │  (External Map) │
           └────────┬────────┘                └────────┬────────┘                └─────────────────┘
                    │                                  │
                    ▼                                  ▼
           ┌─────────────────┐                ┌─────────────────┐
           │  Select Date    │                │  Cancel Reason  │
           │    MYBK-004     │                │    MYBK-007     │
           └────────┬────────┘                └────────┬────────┘
                    │                                  │
                    ▼                                  ▼
           ┌─────────────────┐                ┌─────────────────┐
           │Reschedule Done  │                │  Cancel Done    │
           │    MYBK-005     │                │    MYBK-008     │
           └─────────────────┘                └─────────────────┘
```

### 2.7 Profile Navigation

```
┌─────────────────┐
│   Profile Hub   │
│    PROF-001     │
└────────┬────────┘
         │
         ├─── "Edit Profile" ───────────────────► PROF-002
         │
         ├─── "Favorites" ──────────────────────► FAV-001
         │
         ├─── "Pay Bill / Claim" ───────────────► (Future Feature)
         │
         ├─── "Rewards" ────────────────────────► (Future Feature)
         │
         ├─── "Payment + Insurance" ────────────► PAY-001 / INS-001
         │
         ├─── "Your Bookings" ──────────────────► MYBK-001
         │
         └─── Settings Gear ────────────────────► SET-001


┌─────────────────┐
│    Settings     │
│    SET-001      │
└────────┬────────┘
         │
         ├─── "Edit Profile" ───────────────────► PROF-002
         │
         ├─── "Notifications" ──────────────────► SET-002
         │
         ├─── "Payment Methods" ────────────────► PAY-001
         │
         ├─── "Insurance Cards" ────────────────► INS-001
         │
         ├─── "Location Services" ──────────────► System Settings (deep link)
         │
         ├─── "Appearance" ─────────────────────► Theme Picker (Light/Dark/System)
         │
         ├─── "Help Center" ────────────────────► SET-005
         │
         ├─── "Report a Problem" ───────────────► SET-006
         │
         ├─── "Contact Us" ─────────────────────► Email/Phone options
         │
         ├─── "Terms and Conditions" ───────────► SET-004
         │
         ├─── "Privacy Policy" ─────────────────► SET-003
         │
         ├─── "Log Out" ────────────────────────► SET-008 (Confirmation)
         │                                             │
         │                                             └──► AUTH-002
         │
         └─── "Delete Account" ─────────────────► SET-007
                                                       │
                                                       └──► AUTH-002
```

### 2.8 Clarity AI Chat Flow

```
┌─────────────────┐
│ Clarity Welcome │
│    CHAT-001     │
└────────┬────────┘
         │
         ├─── Tap Quick Action Chip ────────────► CHAT-002 (with prefilled message)
         │
         ├─── Type Message ─────────────────────► CHAT-002
         │
         └─── Tap Mic ──────────────────────────► Voice Input ──► CHAT-002


┌─────────────────┐
│Clarity Convo    │
│    CHAT-002     │
└────────┬────────┘
         │
         ├─── AI returns provider cards ────────► Tap Card ──► PROV-001
         │
         ├─── "New Conversation" ───────────────► CHAT-001 (clear history)
         │
         └─── Continue chatting ────────────────► Scroll, persist history
```

### 2.9 Deep Link Routes

| Notification Type | Deep Link Target |
|-------------------|------------------|
| Booking Confirmed | `MYBK-002` (specific booking) |
| Appointment Reminder | `MYBK-002` (specific booking) |
| Booking Cancelled (by user) | `MYBK-001` (Cancelled tab) |
| Booking Cancelled (by provider) | `MYBK-009` (Provider Cancelled Notice) |
| Schedule Changed (by user) | `MYBK-002` (specific booking) |
| Reschedule Request (by provider) | `MYBK-010` (Provider Reschedule Request) |
| Review Request | `REV-001` (with provider pre-filled) |
| New Services Available | `PROV-001` (specific provider) |
| Availability Alert | `PROV-001` (provider now has slots) |
| Promotion | `HOME-001` or specific provider |
| Referral Reward | `PROF-003` (Referral screen) |

---

## 3. State Definitions

### 3.1 Global States

| State | Visual | Behavior |
|-------|--------|----------|
| **Loading** | Skeleton placeholders matching content layout | Non-blocking, show cached data if available |
| **Empty** | Illustration + message + optional CTA | Contextual messaging per screen |
| **Error** | Illustration + error message + "Retry" button | Allow retry, show cached data if available |
| **Offline** | Full-screen UTIL-001 | Block interactions except retry |
| **Refreshing** | Pull-to-refresh indicator | Fetch latest data |

### 3.2 Screen-Specific States

| Screen | Loading State | Empty State | Error State |
|--------|---------------|-------------|-------------|
| **HOME-001** | Skeleton cards for each section | N/A (always has categories) | "Couldn't load feed" + Retry |
| **SRCH-002** | Skeleton map + card placeholders | "No providers found" + illustration + "Try different filters" | "Search failed" + Retry |
| **PROV-001** | Skeleton header + service list | N/A (provider always has data) | "Couldn't load provider" + Retry |
| **PROV-002** | Skeleton review cards | "No reviews yet" + "Be the first to review" | "Couldn't load reviews" + Retry |
| **BOOK-002** | Skeleton calendar + time slots | "No availability this month" + "Notify me" button | "Couldn't load schedule" + Retry |
| **MYBK-001** | Skeleton booking cards | Tab-specific: "No upcoming appointments" / "No completed" / "No cancelled" + illustration | "Couldn't load bookings" + Retry |
| **FAV-001** | Skeleton provider cards | "No favorites yet" + illustration + "Explore providers" button | "Couldn't load favorites" + Retry |
| **NOTF-001** | Skeleton notification rows | "No notifications" + illustration | "Couldn't load notifications" + Retry |
| **CHAT-002** | Typing indicator (three dots) | N/A (welcome state is default) | "Clarity is unavailable" + Retry |
| **PAY-001** | Skeleton card rows | "No payment methods" + "Add your first card" | "Couldn't load payment methods" + Retry |

### 3.3 Empty State Messaging

| Screen | Illustration | Headline | Subtext | CTA |
|--------|--------------|----------|---------|-----|
| **Search - No Results** | Magnifying glass with X | "No providers found" | "Try adjusting your filters or search in a different area" | "Clear Filters" |
| **Search - No Location** | Map pin illustration | "Enable location" | "Allow location access to find providers near you" | "Enable Location" |
| **Bookings - Upcoming** | Calendar illustration | "No upcoming appointments" | "Book your first appointment to get started" | "Find Providers" |
| **Bookings - Completed** | Checkmark illustration | "No completed appointments" | "Your past appointments will appear here" | None |
| **Bookings - Cancelled** | X illustration | "No cancelled appointments" | "Cancelled appointments will appear here" | None |
| **Favorites** | Heart illustration | "No favorites yet" | "Save providers you like for quick access" | "Explore Providers" |
| **Notifications** | Bell illustration | "No notifications" | "You're all caught up!" | None |
| **Payment Methods** | Card illustration | "No payment methods" | "Add a card to book appointments" | "Add Card" |
| **Insurance Cards** | Shield illustration | "No insurance cards" | "Add your insurance for easy reference" | "Add Insurance" |
| **Reviews (Provider)** | Star illustration | "No reviews yet" | "Be the first to share your experience" | None |
| **Recent Searches** | Clock illustration | "No recent searches" | "Your search history will appear here" | None |
| **Linked Accounts** | Link illustration | "No linked accounts" | "Connect social accounts for faster login" | "Link Account" |
| **Clarity Chat** | Findr logo | "Hi, I'm Clarity" | "Your personal health and wellness assistant" | Quick action chips |

### 3.4 Error Messages

| Error Type | User Message | Technical Handling |
|------------|--------------|-------------------|
| Network timeout | "Connection timed out. Please try again." | Retry with exponential backoff |
| Server error (5xx) | "Something went wrong on our end. Please try again." | Log to error tracking, retry |
| Not found (404) | "This [item] is no longer available." | Navigate back |
| Unauthorized (401) | Silent redirect to Sign In | Clear tokens, redirect |
| Payment failed | "Payment couldn't be processed. Please check your card details." | Stay on payment screen |
| Booking conflict | "This time slot is no longer available. Please select another." | Refresh availability |
| Validation error | Field-specific inline messages | Highlight fields |

---

## 4. Component Library

### 4.1 Navigation Components

| Component | Description | Used In |
|-----------|-------------|---------|
| `BottomNavBar` | 3-tab navigation (Home, Clarity compass, Profile) with active state indicators | All main screens |
| `AppHeader` | Back arrow + title + optional right actions (search, notifications, more) | Detail screens |
| `FloatingClarityButton` | Circular teal button with compass icon, positioned bottom-right | All screens except Chat |

### 4.2 Input Components

| Component | Description | Variants |
|-----------|-------------|----------|
| `TextInput` | Standard text field with label, placeholder, validation | Default, Password (toggle visibility), Error |
| `SearchInput` | Rounded input with search icon left, mic icon right | Default, Focused (teal border) |
| `PhoneInput` | Country code dropdown + phone number field | With flag icons |
| `DatePicker` | Calendar modal with month navigation | Single date selection |
| `DropdownSelect` | Tappable field that opens bottom sheet with options | Single select, with icons |
| `PinInput` | 4 circular inputs for PIN/OTP entry | With numeric keypad |
| `TextArea` | Multi-line input for reviews, problem reports | With character count |

### 4.3 Button Components

| Component | Description | Variants |
|-----------|-------------|----------|
| `PrimaryButton` | Full-width teal button, white text | Default, Loading (spinner), Disabled |
| `SecondaryButton` | Full-width outlined button, teal border/text | Default, Loading, Disabled |
| `TextButton` | No background, teal text | Default, Destructive (red) |
| `IconButton` | Circular button with icon only | Default, With badge |
| `SocialAuthButton` | Rounded button with social icon (Facebook, Google, Apple) | Facebook (blue), Google (white), Apple (black) |
| `ChipButton` | Small rounded pill for filters, categories | Selected (teal fill), Unselected (outline) |
| `FloatingActionButton` | Circular elevated button | Teal with white icon |

### 4.4 Card Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ProviderCard` | Provider image, name, location, rating, category tag, favorite heart | `provider`, `onTap`, `onFavorite`, `showPrice` |
| `ProviderCardSmall` | Compact horizontal card for search results | `provider`, `onTap`, `onFavorite` |
| `ProviderCardInline` | Card displayed within Clarity chat | `provider`, `onTap`, `onSave` |
| `BookingCard` | Provider info, service, date/time, status badge, action buttons | `booking`, `onCancel`, `onReschedule` |
| `ServiceCard` | Service name, price ("from $XX"), Book/+ button | `service`, `onBook` |
| `ReviewCard` | Reviewer photo, name, star rating, review text, date | `review` |
| `NotificationCard` | Color-coded icon, title, timestamp, description, "New" badge | `notification`, `onTap` |
| `PaymentCardVisual` | Credit card visual with masked number, expiry | `card`, `isSelected` |
| `InsuranceCardVisual` | Insurance card visual with provider, policy number | `insurance` |
| `TeamMemberAvatar` | Circular photo, name, rating below | `teamMember`, `onTap` |
| `CategoryTile` | Icon + label in rounded rectangle | `category`, `onTap` |
| `AppointmentSummaryCard` | "Your Next Appointment" - provider, date, time, address | `booking`, `onTap` |

### 4.5 List Components

| Component | Description | Props |
|-----------|-------------|-------|
| `HorizontalProviderList` | Scrollable row of `ProviderCard` with section title | `title`, `providers`, `onSeeAll` |
| `CategoryGrid` | 2-column grid of `CategoryTile` | `categories`, `onSelect` |
| `ServiceTabList` | Horizontal tabs + vertical service list below | `categories`, `services`, `onBook` |
| `TimeSlotGrid` | Wrapped row of time chip buttons | `slots`, `selectedSlot`, `onSelect` |
| `SettingsGroup` | Section header + list of `SettingsRow` | `title`, `items` |
| `SettingsRow` | Icon + label + chevron (or toggle) | `icon`, `label`, `onTap`, `trailing` |

### 4.6 Feedback Components

| Component | Description | Variants |
|-----------|-------------|----------|
| `LoadingSkeleton` | Gray animated placeholder | Card, Row, Circle, Rectangle |
| `EmptyState` | Illustration + headline + subtext + optional CTA | Various illustrations |
| `ErrorState` | Error illustration + message + Retry button | Network, Server, NotFound |
| `SuccessModal` | Centered card with checkmark, message, buttons | Booking, Reschedule, Cancel, Review |
| `FailureModal` | Centered card with X icon, error message, buttons | Payment, Network |
| `ConfirmationModal` | Title, message, Cancel/Confirm buttons | Logout, Delete, Remove Favorite, Cancel Booking |
| `Toast` | Temporary bottom snackbar for quick feedback | Success (teal), Error (red), Info (gray) |
| `PullToRefresh` | Standard pull-down refresh indicator | Default |

### 4.7 Map Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ProviderMap` | Map view with provider markers | `providers`, `userLocation`, `onMarkerTap` |
| `ClusterMarker` | Circular marker showing count | `count`, `onTap` |
| `ProviderMarker` | Pin with provider category icon | `provider`, `isSelected` |
| `DraggableBottomSheet` | Pull-up sheet over map with provider list | `children`, `initialHeight` |

### 4.8 Chat Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ChatBubbleAI` | Left-aligned gray bubble with Findr icon | `message`, `timestamp` |
| `ChatBubbleUser` | Right-aligned teal bubble | `message`, `timestamp`, `status` |
| `QuickActionChip` | Tappable suggestion pill | `label`, `onTap` |
| `ChatInput` | Text input with send button and mic icon | `onSend`, `onVoice` |
| `TypingIndicator` | Three animated dots | Default |

### 4.9 Form Components

| Component | Description | Props |
|-----------|-------------|-------|
| `StarRating` | 5 tappable stars for rating selection | `rating`, `onRate`, `size` |
| `StarRatingDisplay` | Read-only star display | `rating`, `size` |
| `ToggleSwitch` | Teal toggle for boolean settings | `value`, `onToggle` |
| `RadioGroup` | List of radio options with optional "Others" textarea | `options`, `selected`, `onSelect` |
| `Checkbox` | Square checkbox with label | `checked`, `label`, `onToggle` |
| `FilterRow` | Horizontal row of filter dropdowns and toggles | `filters`, `onFilterChange` |

---

## 5. API Endpoint Mapping

### 5.1 Authentication

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| AUTH-002 | Sign In | POST | `/api/auth/login` | `{ email, password }` | `{ token, refreshToken, user }` |
| AUTH-003 | Sign Up | POST | `/api/auth/register` | `{ email, password }` | `{ message, userId }` |
| AUTH-004 | Verify Email | POST | `/api/auth/verify-email` | `{ userId, code }` | `{ token, refreshToken, user }` |
| AUTH-004 | Resend OTP | POST | `/api/auth/resend-verification` | `{ userId }` | `{ message }` |
| AUTH-002 | Social Auth | POST | `/api/auth/social` | `{ provider, token }` | `{ token, refreshToken, user }` |
| AUTH-006 | Verify Reset OTP | POST | `/api/auth/verify-reset-code` | `{ email, code }` | `{ resetToken }` |
| AUTH-007 | Reset Password | POST | `/api/auth/reset-password` | `{ resetToken, newPassword }` | `{ message }` |
| SET-008 | Logout | POST | `/api/auth/logout` | `{ refreshToken }` | `{ message }` |
| - | Refresh Token | POST | `/api/auth/refresh` | `{ refreshToken }` | `{ token, refreshToken }` |

### 5.2 User Profile

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| PROF-001 | Get Profile | GET | `/api/users/me` | - | `{ user }` |
| PROF-002 | Update Profile | PUT | `/api/users/me` | `{ name, dob, phone, gender, country }` | `{ user }` |
| PROF-002 | Upload Avatar | POST | `/api/users/me/avatar` | FormData (image) | `{ avatarUrl }` |
| SET-009 | Change Password | PUT | `/api/users/me/password` | `{ currentPassword, newPassword }` | `{ message }` |
| SET-010 | Get Linked Accounts | GET | `/api/users/me/linked-accounts` | - | `{ linkedAccounts }` |
| SET-010 | Unlink Account | DELETE | `/api/users/me/linked-accounts/:provider` | - | `{ message }` |
| SET-010 | Link Account | POST | `/api/users/me/linked-accounts` | `{ provider, token }` | `{ linkedAccount }` |
| SET-007 | Delete Account | DELETE | `/api/users/me` | `{ password }` | `{ message }` |
| PROF-003 | Get Referral Info | GET | `/api/users/me/referral` | - | `{ code, referralCount, rewards }` |
| PROF-003 | Share Referral | POST | `/api/users/me/referral/share` | `{ method }` | `{ shareUrl }` |

### 5.3 Providers (Search shows onboarded providers only)

| Screen | Action | Method | Endpoint | Query Params | Response |
|--------|--------|--------|----------|--------------|----------|
| HOME-001 | Get Featured | GET | `/api/providers/featured` | - | `{ ourPicks, whatsPopular, justAdded }` |
| HOME-001 | Get Viewed | GET | `/api/users/me/recently-viewed` | - | `{ providers }` |
| SRCH-001 | Get Recent Searches | GET | `/api/users/me/recent-searches` | - | `{ searches }` |
| SRCH-001 | Clear Recent Searches | DELETE | `/api/users/me/recent-searches` | - | `{ message }` |
| SRCH-002 | Search Providers | GET | `/api/providers/search` | `q, lat, lng, radius, type, sort, priceMin, priceMax, verified` | `{ providers, total, page }` |
| SRCH-002 | Get by Category | GET | `/api/providers` | `type, lat, lng, radius, page, limit` | `{ providers, total }` |
| PROV-001 | Get Provider Detail | GET | `/api/providers/:id` | - | `{ provider }` |
| PROV-001 | Log View | POST | `/api/providers/:id/view` | - | `{ message }` |
| PROV-002 | Get Reviews | GET | `/api/providers/:id/reviews` | `rating, page, limit` | `{ reviews, total, averageRating }` |
| PROV-003 | Get Team | GET | `/api/providers/:id/team` | - | `{ team }` |
| PROV-006 | Report Provider | POST | `/api/providers/:id/report` | `{ reason, description }` | `{ reportId }` |
| BOOK-009 | Request Availability Alert | POST | `/api/providers/:id/notify-availability` | `{ serviceId, teamMemberId? }` | `{ message }` |

### 5.4 Bookings

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| BOOK-002 | Get Availability | GET | `/api/providers/:id/availability` | `date, teamMemberId` | `{ slots }` |
| BOOK-005 | Validate Promo Code | POST | `/api/promo/validate` | `{ code, providerId, serviceId }` | `{ valid, discount, discountType }` |
| BOOK-005 | Create Booking | POST | `/api/bookings` | `{ providerId, serviceId, teamMemberId, date, time, paymentMethodId, promoCode?, notes? }` | `{ booking, clientSecret }` |
| BOOK-006 | Confirm Booking | POST | `/api/bookings/:id/confirm` | `{ pin }` | `{ booking }` |
| BOOK-010 | Generate Calendar Event | GET | `/api/bookings/:id/calendar` | `format` (ics/google/outlook) | `{ calendarUrl }` or ICS file |
| MYBK-001 | Get My Bookings | GET | `/api/users/me/bookings` | `status` (upcoming/completed/cancelled) | `{ bookings }` |
| MYBK-002 | Get Booking Detail | GET | `/api/bookings/:id` | - | `{ booking }` |
| MYBK-004 | Reschedule | PUT | `/api/bookings/:id/reschedule` | `{ date, time, reason }` | `{ booking }` |
| MYBK-006 | Get Cancellation Fee | GET | `/api/bookings/:id/cancellation-fee` | - | `{ fee, refundAmount, policy }` |
| MYBK-007 | Cancel Booking | POST | `/api/bookings/:id/cancel` | `{ reason }` | `{ booking, refundAmount }` |
| MYBK-010 | Respond to Reschedule Request | POST | `/api/bookings/:id/reschedule-response` | `{ accept, alternativeTime? }` | `{ booking }` |

### 5.5 Favorites

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| FAV-001 | Get Favorites | GET | `/api/users/me/favorites` | `type` (optional filter) | `{ favorites }` |
| PROV-001 | Add Favorite | POST | `/api/users/me/favorites` | `{ providerId }` | `{ message }` |
| FAV-002 | Remove Favorite | DELETE | `/api/users/me/favorites/:providerId` | - | `{ message }` |

### 5.6 Reviews

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| REV-001 | Submit Review | POST | `/api/reviews` | `{ bookingId, rating, text, wouldRecommend }` | `{ review }` |

### 5.7 Payments

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| PAY-001 | Get Payment Methods | GET | `/api/users/me/payment-methods` | - | `{ paymentMethods }` |
| BOOK-004 | Add Payment Method | POST | `/api/users/me/payment-methods` | `{ stripePaymentMethodId }` | `{ paymentMethod }` |
| PAY-001 | Delete Payment Method | DELETE | `/api/users/me/payment-methods/:id` | - | `{ message }` |
| PAY-001 | Set Default | PUT | `/api/users/me/payment-methods/:id/default` | - | `{ message }` |

### 5.8 Insurance (Future - stored only)

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| INS-001 | Get Insurance Cards | GET | `/api/users/me/insurance` | - | `{ insuranceCards }` |
| INS-002 | Add Insurance | POST | `/api/users/me/insurance` | `{ provider, policyNumber, groupNumber, memberId }` | `{ insuranceCard }` |
| INS-001 | Delete Insurance | DELETE | `/api/users/me/insurance/:id` | - | `{ message }` |

### 5.9 Notifications

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| NOTF-001 | Get Notifications | GET | `/api/users/me/notifications` | `page, limit` | `{ notifications, unreadCount }` |
| NOTF-001 | Mark as Read | PUT | `/api/users/me/notifications/:id/read` | - | `{ message }` |
| NOTF-001 | Mark All Read | PUT | `/api/users/me/notifications/read-all` | - | `{ message }` |
| SET-002 | Get Notification Settings | GET | `/api/users/me/notification-settings` | - | `{ settings }` |
| SET-002 | Update Notification Settings | PUT | `/api/users/me/notification-settings` | `{ push, email, sms }` | `{ settings }` |
| - | Register Push Token | POST | `/api/users/me/push-token` | `{ token, platform }` | `{ message }` |

### 5.10 Clarity AI Chat

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| CHAT-002 | Send Message | POST | `/api/clarity/chat` | `{ message, conversationId?, location? }` | `{ response, providers?, conversationId }` |
| CHAT-001 | Get History | GET | `/api/clarity/history` | `conversationId` | `{ messages }` |
| CHAT-001 | New Conversation | POST | `/api/clarity/new` | - | `{ conversationId }` |

### 5.11 Settings & Support

| Screen | Action | Method | Endpoint | Request Body | Response |
|--------|--------|--------|----------|--------------|----------|
| SET-003 | Get Privacy Settings | GET | `/api/users/me/privacy-settings` | - | `{ settings }` |
| SET-003 | Update Privacy Settings | PUT | `/api/users/me/privacy-settings` | `{ consents }` | `{ settings }` |
| SET-006 | Report Problem | POST | `/api/support/report` | `{ category, description, screenshot? }` | `{ ticketId }` |
| SET-005 | Get FAQ | GET | `/api/support/faq` | - | `{ categories, articles }` |

### 5.12 App Config

| Screen | Action | Method | Endpoint | Response |
|--------|--------|--------|----------|----------|
| Splash | Get Config | GET | `/api/config` | `{ minVersion, currentVersion, maintenance, features }` |
| HOME-001 | Get Categories | GET | `/api/categories` | `{ categories }` |

---

## 6. Design Specifications

### 6.1 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary Teal | `#1EC8A5` | Buttons, active states, links, Clarity accent |
| Primary Dark | `#18A085` | Button pressed state |
| Background | `#FFFFFF` | Screen backgrounds |
| Surface | `#F8F9FA` | Cards, input backgrounds |
| Text Primary | `#1A1A1A` | Headlines, body text |
| Text Secondary | `#6B7280` | Subtitles, placeholders |
| Text Tertiary | `#9CA3AF` | Timestamps, hints |
| Error Red | `#EF4444` | Error states, destructive actions, cancelled |
| Warning Orange | `#F59E0B` | Schedule changed, attention |
| Success Green | `#10B981` | Success states, verified badges |
| Favorite Red | `#EF4444` | Heart icon (filled) |
| Heart Outline | `#D1D5DB` | Heart icon (unfilled) |
| Divider | `#E5E7EB` | Lines, separators |
| Skeleton | `#E5E7EB` | Loading placeholders |
| Map Cluster | `#1EC8A5` | Map cluster markers |

### 6.2 Typography

| Style | Font | Size | Weight | Line Height |
|-------|------|------|--------|-------------|
| H1 | Inter | 28px | Bold (700) | 34px |
| H2 | Inter | 24px | SemiBold (600) | 30px |
| H3 | Inter | 20px | SemiBold (600) | 26px |
| H4 | Inter | 18px | Medium (500) | 24px |
| Body Large | Inter | 16px | Regular (400) | 24px |
| Body | Inter | 14px | Regular (400) | 20px |
| Body Small | Inter | 12px | Regular (400) | 16px |
| Caption | Inter | 11px | Regular (400) | 14px |
| Button | Inter | 16px | SemiBold (600) | 20px |
| Button Small | Inter | 14px | Medium (500) | 18px |

### 6.3 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight spacing, icon padding |
| `sm` | 8px | Between related elements |
| `md` | 16px | Standard padding, card padding |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Screen padding top/bottom |
| `2xl` | 48px | Large gaps between sections |

### 6.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small buttons, chips |
| `md` | 12px | Cards, inputs |
| `lg` | 16px | Modals, large cards |
| `xl` | 24px | Bottom sheets |
| `full` | 9999px | Circular buttons, avatars |

### 6.5 Shadows

| Name | Value | Usage |
|------|-------|-------|
| Card | `0 2px 8px rgba(0,0,0,0.08)` | Elevated cards |
| Modal | `0 4px 24px rgba(0,0,0,0.15)` | Modals, bottom sheets |
| FAB | `0 4px 12px rgba(30,200,165,0.3)` | Floating action button |

### 6.6 Animation Timing

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Fast | 150ms | ease-out | Micro-interactions, toggles |
| Normal | 250ms | ease-in-out | Page transitions, modals |
| Slow | 400ms | ease-in-out | Complex animations, success states |

### 6.7 Iconography

- **Icon Library**: Lucide Icons (or similar line icon set)
- **Size Small**: 16px
- **Size Default**: 24px
- **Size Large**: 32px
- **Stroke Width**: 2px

### 6.8 Component Dimensions

| Component | Height | Notes |
|-----------|--------|-------|
| Bottom Nav Bar | 64px + safe area | Fixed at bottom |
| App Header | 56px + status bar | Fixed at top |
| Primary Button | 52px | Full width with 16px margin |
| Secondary Button | 48px | |
| Text Input | 52px | Including border |
| Search Input | 48px | Rounded ends |
| Provider Card (Home) | 200px | Width: 160px |
| Provider Card (Search) | 100px | Full width |
| Booking Card | 140px | Full width |
| Time Slot Chip | 40px | Auto width |
| Category Tile | 100px | Square with icon |
| Avatar (Team) | 64px | Circular |
| Avatar (Profile) | 100px | Circular with edit badge |

---

## Appendix A: Screen Count Summary

| Category | Count |
|----------|-------|
| Onboarding | 5 |
| Auth | 9 |
| Home & Discovery | 11 |
| Booking Flow | 10 |
| My Bookings | 10 |
| Favorites | 2 |
| Reviews | 2 |
| Profile & Settings | 18 |
| Clarity AI Chat | 3 |
| Notifications | 1 |
| Utility | 8 |
| **Total Screens** | **79** |

---

## Appendix B: Data Flow Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FINDR HEALTH ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    PROVIDER     │         │     BACKEND     │         │    CONSUMER     │
│    PORTAL       │         │   (Railway)     │         │      APP        │
│    (React)      │         │  Node/MongoDB   │         │   (Flutter)     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │   Create/Update Profile   │                           │
         │ ─────────────────────────►│                           │
         │                           │                           │
         │   Services, Pricing,      │   Search Providers        │
         │   Team, Hours, Photos     │◄───────────────────────── │
         │                           │                           │
         │                           │   Provider Data           │
         │                           │ ─────────────────────────►│
         │                           │                           │
         │                           │   Create Booking          │
         │                           │◄───────────────────────── │
         │                           │                           │
         │   New Booking Alert       │   Booking Confirmation    │
         │◄───────────────────────── │ ─────────────────────────►│
         │                           │                           │
         │                           │   Submit Review           │
         │                           │◄───────────────────────── │
         │                           │                           │
         │   Review Notification     │                           │
         │◄───────────────────────── │                           │
         │                           │                           │
         │                           │                           │
┌────────▼────────┐         ┌────────▼────────┐         ┌────────▼────────┐
│     ADMIN       │◄────────│    ANALYTICS    │◄────────│   STRIPE        │
│   DASHBOARD     │         │    SERVICE      │         │  PAYMENTS       │
│    (React)      │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                                                       │
         │   User registrations, bookings,                       │
         │   cancellations, reviews, support                     │
         │◄───────────────────────────────────────────────────────
         │
         │   Provider approvals, user management,
         │   booking oversight, analytics
         ▼
```

---

## Appendix C: Implementation Priority

### Phase 1: Core MVP (Weeks 1-4)
1. Splash screen + onboarding carousel (first-time users)
2. Auth flow (Sign In, Sign Up, Email Verification, Forgot Password)
3. Location + notification permission screens
4. Home screen with provider sections
5. Search with map + list + filter/sort sheets
6. Provider detail with services, team, reviews
7. Basic booking flow (service → date/time → payment → confirmation)
8. My Bookings list with tabs

### Phase 2: Complete Booking (Weeks 5-6)
1. Team member selection (optional)
2. Payment integration (Stripe) + Add Card flow
3. PIN confirmation
4. Booking success/failure states
5. Add to calendar integration
6. Cancel and reschedule flows with policy display
7. No availability + notify me flow

### Phase 3: Engagement (Weeks 7-8)
1. Favorites list and management
2. Write review flow
3. Push notifications integration
4. Notification center
5. Provider-initiated cancel/reschedule handling

### Phase 4: Profile & Settings (Weeks 9-10)
1. Profile hub and edit profile
2. Payment methods management
3. Insurance cards (storage only)
4. Settings screens (all)
5. Change password, linked accounts
6. Help center, report problem
7. Delete account, logout

### Phase 5: AI & Polish (Weeks 11-12)
1. Clarity AI chat integration (Anthropic)
2. Photo gallery viewer
3. Share provider/app functionality
4. Empty states and error handling (all screens)
5. Skeleton loaders
6. Biometric login
7. What's new after updates
8. App store preparation
4. Booking confirmation states
5. Cancel and reschedule flows

### Phase 3: Engagement (Weeks 7-8)
1. Favorites
2. Reviews
3. Push notifications
4. Notification center

### Phase 4: Profile & Settings (Weeks 9-10)
1. Profile hub and edit
2. Payment methods management
3. Settings screens
4. Insurance cards (storage only)

### Phase 5: AI & Polish (Weeks 11-12)
1. Clarity AI chat integration
2. Empty states and error handling
3. Skeleton loaders
4. App store preparation

---

*Document ready for implementation. All screens, flows, and APIs mapped to existing backend.*
