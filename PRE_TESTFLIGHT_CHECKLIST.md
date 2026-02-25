# Pre-TestFlight Checklist

**Document Purpose:** Step-by-step guide to deploy Findr Health to TestFlight for beta testing.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Mac with macOS Monterey (12.0) or later
- [ ] Xcode 14.0 or later installed
- [ ] Apple Developer Account (enrolled, $99/year paid)
- [ ] Flutter SDK installed and in PATH
- [ ] CocoaPods installed (`sudo gem install cocoapods`)
- [ ] Your Apple Developer Team ID

---

## Phase 1: Local Setup (One-Time)

### 1.1 Clone/Download the Project
```bash
# If using Git
git clone [your-repo-url]
cd findr_health_app

# Install dependencies
flutter pub get
```

### 1.2 Open in Xcode
```bash
cd ios
pod install
open Runner.xcworkspace
```

> ⚠️ **Important:** Always open `.xcworkspace`, NOT `.xcodeproj`

### 1.3 Configure Signing

1. In Xcode, select **Runner** in the navigator
2. Select **Runner** under TARGETS
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** from dropdown
6. Xcode will create provisioning profiles automatically

### 1.4 Set Bundle Identifier

1. In **General** tab
2. Set **Bundle Identifier** to: `com.findrhealth.app`
3. Verify **Display Name**: `Findr Health`
4. Set **Version**: `1.0.0`
5. Set **Build**: `1`

### 1.5 Add Capabilities

1. Go to **Signing & Capabilities** tab
2. Click **+ Capability**
3. Add these capabilities:
   - ✅ Push Notifications
   - ✅ Sign in with Apple
   - ✅ Associated Domains
   - ✅ Background Modes (check: Remote notifications, Background fetch)

### 1.6 Configure Associated Domains

1. Under Associated Domains capability
2. Add:
   - `applinks:findrhealth.com`
   - `applinks:www.findrhealth.com`

---

## Phase 2: Build Preparation

### 2.1 Update Version Numbers

In `pubspec.yaml`:
```yaml
version: 1.0.0+1
# Format: major.minor.patch+build
```

### 2.2 Test on Simulator
```bash
flutter run
```

### 2.3 Test on Physical Device

1. Connect iPhone via USB
2. Trust computer on device
3. In Xcode: Select your device from device dropdown
4. Click **Run** (▶️)

### 2.4 Fix Any Signing Issues

If you see signing errors:
```bash
# In project root
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
flutter clean
flutter pub get
```

---

## Phase 3: App Store Connect Setup (One-Time)

### 3.1 Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** Findr Health
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.findrhealth.app (select from dropdown)
   - **SKU:** FINDRHEALTH001
   - **User Access:** Full Access

### 3.2 App Information

1. Go to **App Information** in sidebar
2. Fill in:
   - **Subtitle:** Find Care. See Prices. Book.
   - **Category:** Medical
   - **Secondary Category:** Health & Fitness
   - **Content Rights:** Does not contain third-party content

### 3.3 Pricing and Availability

1. Go to **Pricing and Availability**
2. Select **Price:** Free
3. Select **Availability:** All territories (or select specific)

---

## Phase 4: Build and Upload

### 4.1 Create Archive Build

```bash
# Clean and build
flutter clean
flutter pub get
flutter build ios --release
```

### 4.2 Archive in Xcode

1. In Xcode, select **Any iOS Device (arm64)** as target
2. Go to **Product** → **Archive**
3. Wait for archive to complete (5-10 minutes)
4. **Organizer** window will open automatically

### 4.3 Upload to App Store Connect

1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect** → **Next**
4. Select **Upload** → **Next**
5. Keep default options → **Next**
6. Select your signing certificate → **Next**
7. Review and click **Upload**
8. Wait for upload (5-15 minutes depending on connection)

### 4.4 Verify Upload

1. Go to App Store Connect
2. Select your app
3. Go to **TestFlight** tab
4. You should see your build under **iOS Builds**
5. Status will show **Processing** (takes 10-30 minutes)

---

## Phase 5: TestFlight Configuration

### 5.1 Compliance Questions

When build finishes processing:

1. Click on the build number
2. Answer **Export Compliance**:
   - Q: Does your app use encryption?
   - A: **Yes** (we use HTTPS)
   - Q: Does it qualify for exemption?
   - A: **Yes** (standard HTTPS/TLS only)

### 5.2 Test Information

1. Fill in **Test Information**:
   - **Beta App Description:** Test version of Findr Health
   - **Email:** your-email@example.com
   - **Phone:** Your phone number
   - **Demo Account:** (if needed)
   - **Notes:** Any notes for testers

### 5.3 Internal Testing (Up to 100 testers)

1. Go to **Internal Testing** → **App Store Connect Users**
2. Click **+** to add testers
3. Testers must have App Store Connect access

### 5.4 External Testing (Up to 10,000 testers)

1. Go to **External Testing** → **+** Add Group
2. Create group (e.g., "Beta Testers")
3. Add testers by email
4. Submit for **Beta App Review** (usually 24-48 hours)
5. Once approved, testers receive invitation email

---

## Phase 6: Testing Checklist

Before submitting to App Store, verify:

### Core Functionality
- [ ] App launches without crash
- [ ] Onboarding carousel works
- [ ] Location permission flow works
- [ ] Sign up creates account
- [ ] Email verification works
- [ ] Login works (email/password)
- [ ] Login works (social auth)
- [ ] Home screen loads providers
- [ ] Search returns results
- [ ] Map displays correctly
- [ ] Provider detail loads
- [ ] Service pricing displays
- [ ] Booking flow completes
- [ ] Payment processes (use Stripe test mode)
- [ ] My Appointments shows bookings
- [ ] Cancel booking works
- [ ] Reschedule booking works
- [ ] Clarity AI chat responds
- [ ] Profile displays correctly
- [ ] Favorites can be added/removed
- [ ] Settings screens load
- [ ] Logout works

### Edge Cases
- [ ] No internet shows error state
- [ ] Empty states display correctly
- [ ] Pull-to-refresh works
- [ ] Back navigation works
- [ ] Deep links work
- [ ] Push notifications received
- [ ] App returns from background correctly

### Performance
- [ ] No noticeable lag
- [ ] Images load reasonably fast
- [ ] No memory leaks (monitor in Xcode)
- [ ] Battery usage acceptable

### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14/15 (standard)
- [ ] iPhone 14/15 Pro Max (large)
- [ ] iOS 14 (minimum supported)
- [ ] iOS 17+ (latest)

---

## Phase 7: Common Issues & Solutions

### Build Fails with Signing Error
```bash
# Reset signing
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
flutter clean
flutter build ios
```

### Archive Fails
1. Ensure you're targeting "Any iOS Device"
2. Check that all capabilities are properly configured
3. Verify provisioning profiles in Xcode preferences

### Upload Fails
1. Check internet connection
2. Verify Apple Developer account is in good standing
3. Try uploading with **Transporter** app instead

### Build Processing Stuck
- Normal processing takes 10-30 minutes
- If over 1 hour, contact Apple Developer support
- Sometimes re-uploading helps

### TestFlight Invite Not Received
1. Check spam folder
2. Verify email address is correct
3. Tester needs to install TestFlight app first
4. Try resending invitation

---

## Phase 8: Incrementing Builds

For each new TestFlight build:

1. Increment build number in `pubspec.yaml`:
   ```yaml
   version: 1.0.0+2  # Changed +1 to +2
   ```

2. Rebuild and upload:
   ```bash
   flutter clean
   flutter build ios --release
   # Then Archive and Upload in Xcode
   ```

---

## Quick Reference

### Key URLs
- App Store Connect: https://appstoreconnect.apple.com
- Developer Portal: https://developer.apple.com
- Certificates: https://developer.apple.com/account/resources/certificates
- TestFlight App: https://apps.apple.com/app/testflight/id899247664

### Key Commands
```bash
# Full clean rebuild
flutter clean && flutter pub get && cd ios && pod install && cd .. && flutter build ios --release

# Open in Xcode
open ios/Runner.xcworkspace

# Check Flutter doctor
flutter doctor -v
```

### Version Format
```
version: MAJOR.MINOR.PATCH+BUILD
Example: 1.0.0+1, 1.0.0+2, 1.0.1+3, 1.1.0+4
```

---

## Timeline Estimate

| Step | Time |
|------|------|
| Local setup (first time) | 30-60 min |
| App Store Connect setup | 15-30 min |
| Build + Upload | 20-40 min |
| Processing | 10-30 min |
| Internal testing setup | 10 min |
| External testing review | 24-48 hours |

**Total first deployment: ~2-4 hours + review time**

---

*Last Updated: January 2, 2026*
