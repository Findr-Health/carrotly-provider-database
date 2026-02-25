# Flutter App Integration - Implementation Guide
## Phase 2: Real Calendar Availability & Confirmation Numbers

**Time to implement: 1-2 hours**

---

## STEP 1: Update booking_service.dart

**File:** `lib/services/booking_service.dart`

**Action:** Add this method after `getNextAvailable()` (around line 75):

```dart
/// Get availability slots for a specific date (NEW - Calendar Integration)
/// Uses real-time calendar availability endpoint
Future<Map<String, dynamic>> getAvailabilityForDate({
  required String providerId,
  required String date, // yyyy-MM-dd format
  required int duration,
  String? memberId,
}) async {
  try {
    final response = await _dio.get(
      '/availability/$providerId',
      queryParameters: {
        'date': date,
        'duration': duration.toString(),
        if (memberId != null) 'memberId': memberId,
      },
    );
    
    return response.data;
  } on DioException catch (e) {
    throw BookingException(_parseError(e));
  }
}
```

---

## STEP 2: Replace datetime_selection_screen.dart

**File:** `lib/presentation/screens/booking/datetime_selection_screen.dart`

**Action:** Replace ENTIRE file contents with `datetime_selection_screen.dart` from outputs.

**Key changes:**
- ✅ Calls real `/api/availability` endpoint
- ✅ Shows booking mode (instant vs request) dynamically
- ✅ Real calendar-based time slots
- ✅ Fallback to business hours if API fails

---

## STEP 3: Update booking_confirmation_screen.dart

**File:** `lib/presentation/screens/booking/booking_confirmation_screen.dart`

**Action:** Add the widgets from `booking_confirmation_widgets.dart`

**Where to add:**

1. Copy the two widget methods:
   - `_buildConfirmationNumber()`
   - `_buildCheckInInstructions()`

2. In your `build()` method, add after success animation:

```dart
// Existing success animation
Lottie.asset('assets/animations/success.json', height: 120),

// NEW: Add confirmation number
_buildConfirmationNumber(booking.bookingNumber),

// NEW: Add check-in instructions
_buildCheckInInstructions(phoneLastFour),

// Continue with existing appointment details...
```

3. Calculate phoneLastFour at top of build method:

```dart
final userPhone = user?.phone ?? '';
final phoneLastFour = userPhone.length >= 4 
    ? userPhone.substring(userPhone.length - 4) 
    : 'XXXX';
```

4. Add imports at top:

```dart
import 'package:flutter/services.dart'; // For Clipboard
```

---

## STEP 4: Test the Flow

1. **Run the app:**
   ```bash
   cd ~/Development/findr-health/findr-health-mobile
   flutter run
   ```

2. **Test instant booking:**
   - Select Long Island City Physical Therapy
   - Select Dr. Sarah Johnson (has calendar connected)
   - Select a date
   - Should see: "⚡ Instant Booking" badge
   - Should see: Real time slots from Google Calendar
   - Complete booking
   - Should see: Confirmation number (FH-2026-XXXX)

3. **Test request booking:**
   - Select Mike Chen (no calendar connected)
   - Should see: "📋 Request Booking" badge
   - Should see: Business hours slots
   - Should see: "Provider will confirm within 24 hours"

---

## WHAT YOU'LL SEE

### ✅ BEFORE (Old Flow)
- All providers show business hours slots
- No booking mode distinction
- No confirmation numbers

### ✅ AFTER (New Flow)
- Dr. Sarah Johnson: Real calendar slots, instant booking
- Mike Chen: Business hours, request booking
- All bookings: Confirmation numbers with check-in instructions

---

## EXPECTED API CALLS

When user selects Feb 5, 2026:

```
GET /api/availability/697a98f3a04e359abfda111f?date=2026-02-05&duration=60&memberId=697e6d12a6d5b2ae327e8635
```

Response:
```json
{
  "success": true,
  "availability": [{
    "teamMemberId": "697e6d12a6d5b2ae327e8635",
    "teamMemberName": "Dr. Sarah Johnson",
    "calendarConnected": true,
    "bookingMode": "instant",
    "slots": [
      { "startTime": "09:00", "endTime": "10:00", "available": true },
      { "startTime": "10:00", "endTime": "11:00", "available": true },
      { "startTime": "14:00", "endTime": "15:00", "available": true }
    ]
  }]
}
```

---

## TROUBLESHOOTING

**Problem:** "Failed to load availability" error

**Solution:** Check these:
1. Backend is running: `https://fearless-achievement-production.up.railway.app`
2. Calendar token not expired (run OAuth reconnect)
3. Check Flutter console for API error details

**Problem:** No slots showing

**Reasons:**
- Provider's calendar is fully booked for that day
- Calendar event overlaps
- Date is outside 60-day booking window

**Problem:** Confirmation number not showing

**Solution:** 
- Backend returns `bookingNumber` in booking response
- Check API response in Network tab
- Verify booking was created successfully

---

## NEXT STEPS (Optional)

After testing works:

1. **Add loading skeleton** to time slots while API loads
2. **Add retry button** if API fails
3. **Create Check-In Details screen** (separate screen showing QR code)
4. **Update My Bookings** to show confirmation numbers in list

---

## COMMIT AFTER TESTING

```bash
git add -A
git commit -m "feat: integrate real calendar availability and confirmation numbers

Phase 2 Flutter Integration Complete:
- DateTime screen now calls /api/availability endpoint
- Shows booking mode (instant vs request) dynamically
- Displays real calendar-based time slots
- Shows confirmation numbers on booking success
- Added check-in instructions with phone verification

Tested with:
- Dr. Sarah Johnson (instant booking with calendar)
- Mike Chen (request booking without calendar)"

git push origin main
```

---

## SUMMARY

**Files Changed: 2**
1. ✅ `booking_service.dart` - Added availability API method
2. ✅ `datetime_selection_screen.dart` - Complete replacement with API integration
3. ✅ `booking_confirmation_screen.dart` - Added confirmation number widgets

**Time Investment: 1-2 hours**

**Result:** End-to-end working booking flow with real calendar integration! 🎉
