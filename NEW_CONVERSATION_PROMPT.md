# New Conversation Starter Prompt

Copy everything below this line and paste into a new conversation:

---

## Context: Findr Health Flutter Integration

I'm building Findr Health, a healthcare marketplace. I have a technical summary document uploaded that covers the entire ecosystem architecture.

### Immediate Task: Flutter Booking Flow Integration

**Files ready at:** `~/Downloads/Findr_health_APP/flutter-updates/`

**Existing Flutter app at:** `~/Downloads/Findr_health_APP/`

The new booking flow screens need to be integrated:
- `provider_model.dart` → replace `lib/data/models/provider_model.dart`
- `booking_state.dart` → add to `lib/models/`
- `service_selection_screen.dart` → replace existing in `lib/presentation/screens/booking/`
- `team_selection_screen.dart` → add to `lib/presentation/screens/booking/`
- `datetime_selection_screen.dart` → replace existing
- `booking_review_screen.dart` → add new
- `booking_flow_screen.dart` → add new (main coordinator)

### What the Booking Flow Does:
1. **Service Selection** - User picks a service, if it has variants they select one
2. **Team Selection** - User picks a team member OR "No Preference" (only shows team members who can perform that service based on serviceIds linking)
3. **DateTime Selection** - Calendar + time slot picker
4. **Review & Confirm** - Shows price breakdown (service + 10% platform fee), cancellation policy, confirm button

### Key Integration Points:
1. Update `app_router.dart` with `/booking/:providerId` route
2. Update provider detail screen's "Book Now" button to navigate to booking flow
3. Ensure imports work (AppColors, lucide_icons, intl package)

### Backend API:
- URL: `https://fearless-achievement-production.up.railway.app`
- POST `/api/bookings` - Create booking
- Provider data includes `services[]` with `variants[]` and `teamMembers[]` with `serviceIds[]`

Please help me integrate these files step by step. Start by checking what currently exists:

```bash
ls ~/Downloads/Findr_health_APP/flutter-updates/
cat ~/Downloads/Findr_health_APP/lib/core/router/app_router.dart | head -50
```

---

## Also Note (For Later Reference)

### Outstanding Provider Portal Bugs:
1. "Unsaved changes" popup appears after saving (race condition with React state)
2. Cancellation policy not saving (backend enum missing 'moderate')

### Backend Fix Needed:
Update `Provider.js` line 154 to add 'moderate' to cancellationPolicy enum.

---
