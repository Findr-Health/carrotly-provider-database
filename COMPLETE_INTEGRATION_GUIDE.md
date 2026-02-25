# Findr Health - Complete Integration Guide

**Date:** January 5, 2025  
**Components:** Flutter App, Provider Portal

---

## Overview

This guide covers integration of:
1. ✅ Clarity AI Chat (connected to backend)
2. ✅ Payment Methods Screen (Stripe)
3. ✅ Edit Profile Screen
4. ✅ Help, Terms, Privacy, Rewards screens
5. ✅ Logout functionality
6. ✅ Google Maps Search
7. ✅ Provider Portal Bug Fix

---

## Part 1: Flutter App Updates

### File Locations

Copy these files to your Flutter project:

| Source File | Destination |
|-------------|-------------|
| `clarity_service.dart` | `lib/services/clarity_service.dart` |
| `chat_screen.dart` | `lib/presentation/screens/chat/chat_screen.dart` (REPLACE) |
| `payment_methods_screen.dart` | `lib/presentation/screens/profile/payment_methods_screen.dart` |
| `edit_profile_screen.dart` | `lib/presentation/screens/profile/edit_profile_screen.dart` |
| `settings_screens.dart` | `lib/presentation/screens/settings/settings_screens.dart` |
| `map_search_screen.dart` | `lib/presentation/screens/search/map_search_screen.dart` |

### Commands to Copy Files

```bash
cd ~/Downloads/Findr_health_APP

# Create directories if needed
mkdir -p lib/services
mkdir -p lib/presentation/screens/settings
mkdir -p lib/presentation/screens/search

# Copy files (after downloading from Claude outputs)
# Files will be in ~/Downloads/ after you download them
```

---

## Part 2: Router Updates

Open `lib/core/router/app_router.dart` and make these changes:

### 2.1 Add Imports at Top

```dart
// Add these imports (around line 19-25)
import '../../services/clarity_service.dart';
import '../../presentation/screens/chat/chat_screen.dart';
import '../../presentation/screens/profile/payment_methods_screen.dart';
import '../../presentation/screens/profile/edit_profile_screen.dart';
import '../../presentation/screens/settings/settings_screens.dart';
import '../../presentation/screens/search/map_search_screen.dart';
```

### 2.2 Add Routes

Add these routes inside your routes list (around line 230, before Settings section):

```dart
// ==========================================
// PROFILE SCREENS
// ==========================================

// Edit Profile
GoRoute(
  path: '/profile/edit',
  name: 'editProfile',
  builder: (context, state) => const EditProfileScreen(),
),

// Payment Methods
GoRoute(
  path: '/profile/payment',
  name: 'paymentMethods',
  builder: (context, state) => const PaymentMethodsScreen(),
),

// Rewards (Coming Soon)
GoRoute(
  path: '/profile/rewards',
  name: 'rewards',
  builder: (context, state) => const RewardsScreen(),
),

// Pay Bill
GoRoute(
  path: '/profile/pay-bill',
  name: 'payBill',
  builder: (context, state) => const PayBillScreen(),
),

// ==========================================
// SETTINGS/HELP SCREENS
// ==========================================

// Help & Support
GoRoute(
  path: '/help',
  name: 'help',
  builder: (context, state) => const HelpSupportScreen(),
),

// Terms of Service
GoRoute(
  path: '/terms',
  name: 'terms',
  builder: (context, state) => const TermsOfServiceScreen(),
),

// Privacy Policy
GoRoute(
  path: '/privacy',
  name: 'privacy',
  builder: (context, state) => const PrivacyPolicyScreen(),
),

// ==========================================
// MAP SEARCH
// ==========================================

GoRoute(
  path: '/search/map',
  name: 'mapSearch',
  builder: (context, state) {
    final query = state.uri.queryParameters['q'];
    final type = state.uri.queryParameters['type'];
    return MapSearchScreen(
      initialQuery: query,
      providerType: type,
    );
  },
),

// ==========================================
// CHAT (Clarity AI) - Update existing route
// ==========================================

GoRoute(
  path: '/chat',
  name: 'chat',
  builder: (context, state) => const ChatScreen(),
),
```

---

## Part 3: Update Profile Screen

Open your profile screen (likely `lib/presentation/screens/profile/profile_screen.dart`) and update the tile onTap handlers:

### 3.1 Find the Profile Tiles

Look for tiles like "Edit Profile", "Payment", "Rewards", etc. and update their `onTap`:

```dart
// Edit Profile tile
onTap: () => context.push('/profile/edit'),

// Payment tile
onTap: () => context.push('/profile/payment'),

// Rewards tile
onTap: () => context.push('/profile/rewards'),

// Pay Bill tile
onTap: () => context.push('/profile/pay-bill'),
```

### 3.2 Find Settings Menu Items

Update the settings items:

```dart
// Help & Support
onTap: () => context.push('/help'),

// Terms of Service
onTap: () => context.push('/terms'),

// Privacy Policy
onTap: () => context.push('/privacy'),

// Log Out - Add this handler
onTap: () async {
  final confirmed = await showLogoutConfirmation(context);
  if (confirmed == true) {
    // TODO: Clear auth state
    // ref.read(authProvider.notifier).logout();
    context.go('/login'); // Or your login route
  }
},
```

### 3.3 Add showLogoutConfirmation Import

At top of profile_screen.dart:
```dart
import '../settings/settings_screens.dart';
```

---

## Part 4: Add Map Toggle to Search Screen

In your search/home screen, add a button to toggle map view:

```dart
// Add a map icon button in your search bar area
IconButton(
  icon: const Icon(LucideIcons.map),
  onPressed: () {
    context.push('/search/map?q=${searchController.text}');
  },
  tooltip: 'Map View',
),
```

---

## Part 5: Stripe Configuration

### 5.1 Initialize Stripe in main.dart

Open `lib/main.dart` and add Stripe initialization:

```dart
import 'package:flutter_stripe/flutter_stripe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Stripe with your publishable key
  Stripe.publishableKey = 'pk_test_YOUR_PUBLISHABLE_KEY';
  // Get your key from Railway: STRIPE_PUBLISHABLE_KEY
  
  await Stripe.instance.applySettings();
  
  runApp(const MyApp());
}
```

### 5.2 Get Your Stripe Publishable Key

From your Railway dashboard screenshot, you have `STRIPE_PUBLISHABLE_KEY` set.
Copy that value and paste it in main.dart.

---

## Part 6: Add Required Dependencies

Check/add these to `pubspec.yaml`:

```yaml
dependencies:
  # Already have:
  flutter_stripe: ^11.5.0
  geolocator: ^10.1.0  # Check version
  dio: ^5.0.0
  
  # Add if missing:
  google_maps_flutter: ^2.5.0
  flutter_markdown: ^0.6.18
  url_launcher: ^6.2.0
  image_picker: ^1.0.0
```

Then run:
```bash
flutter pub get
```

---

## Part 7: Provider Portal Bug Fix

### Location
`~/Desktop/carrotly-provider-mvp/src/pages/EditProfile.tsx`

### Quick Fix (Simplest)

Find the `handleCancel` function (around line 167) and replace with:

```typescript
const handleCancel = () => {
  // If success message is showing, we just saved - skip prompt
  if (successMessage) {
    navigate(-1);
    return;
  }
  
  if (hasChanges) {
    setShowUnsavedDialog(true);
  } else {
    navigate(-1);
  }
};
```

Then find where `successMessage` is cleared and extend the timeout:

```typescript
// Change from:
setTimeout(() => setSuccessMessage(''), 3000);

// To:
setTimeout(() => setSuccessMessage(''), 5000);
```

### Deploy
```bash
cd ~/Desktop/carrotly-provider-mvp
git add .
git commit -m "Fix unsaved changes popup bug"
git push
# Vercel auto-deploys
```

---

## Part 8: Complete Checklist

### Flutter Files
- [ ] Copy `clarity_service.dart` to `lib/services/`
- [ ] Replace `chat_screen.dart` in `lib/presentation/screens/chat/`
- [ ] Add `payment_methods_screen.dart` to `lib/presentation/screens/profile/`
- [ ] Add `edit_profile_screen.dart` to `lib/presentation/screens/profile/`
- [ ] Add `settings_screens.dart` to `lib/presentation/screens/settings/`
- [ ] Add `map_search_screen.dart` to `lib/presentation/screens/search/`

### Router
- [ ] Add imports for all new screens
- [ ] Add routes for all new screens
- [ ] Update existing chat route

### Profile Screen
- [ ] Update tile navigation handlers
- [ ] Add logout confirmation import
- [ ] Implement logout handler

### Stripe
- [ ] Add Stripe initialization to main.dart
- [ ] Add publishable key

### Google Maps
- [ ] Enable Maps SDK in Cloud Console
- [ ] Add API key to iOS AppDelegate.swift
- [ ] Add API key to Android AndroidManifest.xml
- [ ] Install pods

### Provider Portal
- [ ] Apply handleCancel fix
- [ ] Extend successMessage timeout
- [ ] Deploy to Vercel

### Test
- [ ] Chat screen connects to API
- [ ] Payment methods screen loads
- [ ] Map shows with markers
- [ ] Profile tiles navigate correctly
- [ ] Logout works with confirmation
- [ ] Provider portal save/back works

---

## Testing Commands

```bash
cd ~/Downloads/Findr_health_APP

# Analyze for errors
flutter analyze

# Run on iOS
flutter run -d iPhone

# Run on Android
flutter run -d android
```

---

*Integration Guide - January 5, 2025*
