# Findr Health Payment Integration Guide

## Overview

This guide covers integrating Stripe payments into the Findr Health Flutter app, including:
- Payment methods management (Profile → Payments)
- Payment selection in booking flow (Step 4 - Review Summary)
- Apple Pay & Google Pay support
- Backend endpoints (already deployed)

## Backend Status

✅ **Already deployed and working** at `https://fearless-achievement-production.up.railway.app`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/setup-intent` | POST | Create SetupIntent for adding cards |
| `/api/payments/methods` | GET | Get user's saved payment methods |
| `/api/payments/methods/:id` | DELETE | Remove a payment method |
| `/api/payments/methods/:id/default` | POST | Set default payment method |
| `/api/payments/create-payment-intent` | POST | Create payment for booking |
| `/api/payments/confirm` | POST | Confirm payment |
| `/api/payments/refund` | POST | Refund payment |

## Files to Update/Add

### 1. Payment Methods Screen (Profile)

**File:** `lib/presentation/screens/profile/payment_methods_screen.dart`

Replace existing file with the new version. Features:
- Shows Apple Pay, Google Pay options
- Lists saved cards with brand icons (Visa, Mastercard, Amex)
- Add new card via Stripe Payment Sheet
- Set default / Remove cards
- Matches Figma design

### 2. Booking Review Screen (Step 4)

**File:** `lib/presentation/screens/booking/booking_review_screen.dart`

Replace existing file. Changes:
- Added payment method selection section
- Payment picker bottom sheet
- Auto-selects default card
- "Change" link to switch payment
- Confirm button disabled until payment selected

### 3. Booking Flow Screen (Coordinator)

**File:** `lib/presentation/screens/booking/booking_flow_screen.dart`

Replace existing file. Changes:
- Updated `onConfirm` callback to accept payment
- Processes payment via Stripe before creating booking
- Handles card payments, Apple Pay, Google Pay

## Installation Steps

### Step 1: Verify Stripe Package

Ensure `flutter_stripe` is in pubspec.yaml:

```yaml
dependencies:
  flutter_stripe: ^11.5.0
```

### Step 2: Stripe Initialization (main.dart)

Add to main.dart before runApp():

```dart
import 'package:flutter_stripe/flutter_stripe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Stripe
  Stripe.publishableKey = 'pk_test_51SVH0HRoHR2gRYs6H0Gr2sYNqVtq2PJMesd92y0ZBMBBoCrIiZRu19o338xwTunj8pp9wjyolhJ5Msm8w0TgUQBL00ucNYWN5u';
  Stripe.merchantIdentifier = 'merchant.com.findrhealth.app'; // For Apple Pay
  await Stripe.instance.applySettings();
  
  runApp(const ProviderScope(child: MyApp()));
}
```

### Step 3: iOS Configuration (Apple Pay)

**Info.plist** - Add:
```xml
<key>NSApplePayCapability</key>
<true/>
```

**Xcode:**
1. Open ios/Runner.xcworkspace
2. Select Runner target → Signing & Capabilities
3. Add "Apple Pay" capability
4. Add merchant ID: `merchant.com.findrhealth.app`

### Step 4: Android Configuration (Google Pay)

**android/app/src/main/AndroidManifest.xml** - Add inside `<application>`:
```xml
<meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
```

### Step 5: Copy Files

Copy these files to your Flutter project:

```
payment_methods_screen.dart → lib/presentation/screens/profile/
booking_review_screen.dart → lib/presentation/screens/booking/
booking_flow_screen.dart → lib/presentation/screens/booking/
```

### Step 6: Update Routes (if needed)

In `app_router.dart`, ensure payment route exists:

```dart
GoRoute(
  path: '/profile/payment',
  name: AppRoutes.paymentMethods,
  builder: (context, state) => const PaymentMethodsScreen(),
),
```

## Testing

### Test Card Numbers

| Card | Number | Result |
|------|--------|--------|
| Visa | 4242 4242 4242 4242 | Success |
| Mastercard | 5555 5555 5555 4444 | Success |
| Declined | 4000 0000 0000 0002 | Declined |
| Auth Required | 4000 0025 0000 3155 | 3D Secure |

Use any future expiry date and any 3-digit CVC.

### Test Flow

1. **Profile → Payments:**
   - Open app → Profile tab → Payment tile
   - Tap "Add New Card"
   - Enter test card details
   - Verify card appears in list

2. **Booking with Payment:**
   - Select a provider → Book service
   - Complete steps 1-3
   - On Review Summary (Step 4):
     - Verify payment method section shows
     - Tap "Change" to switch payment
     - Tap "Confirm" to complete booking

3. **Apple Pay (on device):**
   - Requires physical device
   - Must have cards in Apple Wallet
   - Select Apple Pay in payment picker

## User ID Integration

Currently using hardcoded `test-user-id`. To use real user:

```dart
// In payment_methods_screen.dart and booking_review_screen.dart
// Replace:
final String _userId = 'test-user-id';
final String _userEmail = 'test@example.com';

// With:
final user = ref.watch(authProvider).user;
final String _userId = user?.id ?? '';
final String _userEmail = user?.email ?? '';
```

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Service Selection                                  │
│           ↓                                                 │
│  Step 2: Team Selection                                     │
│           ↓                                                 │
│  Step 3: Date/Time Selection                                │
│           ↓                                                 │
│  Step 4: Review Summary                                     │
│           ├── Payment Method Selection ◄────┐              │
│           │   ├── Apple Pay                  │              │
│           │   ├── Google Pay                 │              │
│           │   └── Saved Cards ───────────────┤              │
│           │                                  │              │
│           │   [Add New Card] ────────────────┘              │
│           │        │                                        │
│           │        └── Stripe Payment Sheet                 │
│           │                                                 │
│           └── [Confirm] ────► Payment Intent ────► Booking  │
│                                                             │
│  Step 5: Confirmation                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

The implementation handles:
- Payment sheet cancellation (user dismisses)
- Card declined
- Network errors
- 3D Secure authentication
- Missing payment method selection

## Future Enhancements

1. **PayPal Integration** - Requires PayPal SDK
2. **Save Card During Booking** - Checkbox to save card
3. **Receipt Emails** - Send payment confirmation
4. **Payment History** - View past transactions
5. **Tipping** - Add tip during checkout

## Support

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Flutter Stripe: https://pub.dev/packages/flutter_stripe
