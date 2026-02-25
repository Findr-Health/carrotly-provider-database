# FINDR HEALTH - NEXT SESSION PROMPT
## Copy this entire prompt to start a new conversation

---

## PROJECT CONTEXT

I'm building **Findr Health**, a healthcare marketplace platform that connects patients with independent healthcare providers. The platform has 5 integrated components:

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  FLUTTER APP    │     │ PROVIDER PORTAL │     │ ADMIN DASHBOARD │
│  (Consumer)     │     │ (React/Vercel)  │     │ (React/Vercel)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    NODE.JS BACKEND     │
                    │    (Railway)           │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    MONGODB ATLAS       │
                    └────────────────────────┘
```

### Project Locations
| Project | Location |
|---------|----------|
| Flutter App | `~/Downloads/Findr_health_APP` |
| Backend | `~/Desktop/carrotly-provider-database/backend` |
| Provider Portal | `~/Desktop/carrotly-provider-mvp` |
| Admin Dashboard | `~/Desktop/carrotly-provider-database/admin-dashboard` |

### Live URLs
- Backend API: `https://fearless-achievement-production.up.railway.app/api`
- Provider Portal: `https://findrhealth-provider.vercel.app`

---

## RECENT WORK COMPLETED (Jan 5-7, 2026)

### Flutter App Features Built
- ✅ User auth (email + social auth UI)
- ✅ Home screen with real provider data
- ✅ **Search overlay with typeahead** - Real-time results with relevance scoring
- ✅ **Category services screen** - Browse all services in a category by price
- ✅ **Distance calculation** - Haversine formula for GPS-based distances
- ✅ Provider detail with services
- ✅ **Booking flow fixed** - Service pre-selection (Option C - lookup by ID after load)
- ✅ Payment methods (Stripe)
- ✅ My bookings management
- ✅ TOS acceptance during registration

### Backend Features
- ✅ **Text search** - $or regex search across practiceName, services.name, services.category
- ✅ Provider CRUD with 30 providers, 149 service templates
- ✅ Booking management with cancellation policies
- ✅ Stripe payment integration

---

## OUTSTANDING ISSUES (Priority Order)

### 🟡 P1 - High Priority

**1. Location Picker Issues** (2-3 hrs)
- "Use current location" shows wrong name
- City search returns nothing
- Places API autocomplete not working
- Files: `lib/presentation/widgets/location_picker.dart`, `lib/services/location_service.dart`

**2. Favorites Feature** (3-4 hrs)
- Heart icon on provider cards
- Backend: User.favorites array with endpoints
- Flutter: FavoritesNotifier, optimistic updates

**3. Settings Functionality** (3-4 hrs)
- Biometric login (`local_auth` package)
- Notification toggles
- Account deletion

### 🟢 P2 - Medium Priority

**4. TOS in Profile** (1 hr)
- Show TOS document user accepted
- Display acceptance date

**5. Notifications** (6-8 hrs)
- Firebase FCM setup
- Push notifications for bookings

---

## KEY TECHNICAL CONTEXT

### Booking Flow Architecture
```dart
// CategoryServicesScreen → BookingFlowScreen
onBook: () => context.push('/book/${providerId}', extra: {'serviceId': serviceId})

// BookingFlowScreen._loadProvider()
// 1. Fetch provider from API if not passed
// 2. Lookup service by preSelectedServiceId
// 3. Skip to Step 2 (Team Selection) if service found
```

### Search Architecture
```dart
// SearchService provides relevance scoring:
// - Service name match: +15
// - Category match: +12
// - Provider name match: +10
// - Provider type match: +8
// Results sorted by score, grouped by type
```

### Database
- 30 providers (10 approved, WellNow has 73 services)
- 149 service templates across 38 categories
- Prices stored in dollars (not cents)

---

## DEBUGGING COMMANDS

```bash
# Flutter analyze
cd ~/Downloads/Findr_health_APP && flutter analyze lib/

# Run app
flutter run

# Test backend search
curl "https://fearless-achievement-production.up.railway.app/api/providers?search=labs"

# Get WellNow provider
curl "https://fearless-achievement-production.up.railway.app/api/providers/69360ad81eda41be998c8acb"
```

---

## SESSION GOALS

Please help me with the following priorities:

1. **Fix Location Picker** - Debug why Places API isn't working, fix "Use current location" display
2. **Add TOS to Profile** - Simple viewer showing the terms user accepted
3. **Start Favorites Feature** - Backend endpoints first, then Flutter UI

Before making changes:
- Check file contents with `sed -n 'X,Yp' file`
- Use `flutter analyze` to verify changes compile
- Test API endpoints with `curl` before debugging Flutter

Let's start by investigating the Location Picker issue - can you check the location service implementation?
