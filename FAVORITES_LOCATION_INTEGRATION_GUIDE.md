# Findr Health - Favorites & Location Picker Integration Guide

## Overview

This guide covers integrating:
1. **Backend Places Proxy** - Secure proxy for Google Places API
2. **Favorites Feature** - Provider favoriting with optimistic updates
3. **Updated Location Picker** - Uses backend proxy instead of direct API calls

---

## 1. Backend Integration

### Step 1: Add the Places Route

Copy `places.js` to your backend routes folder:

```bash
cp places.js ~/Desktop/carrotly-provider-database/backend/routes/places.js
```

### Step 2: Register the Route in Your Server

In your main server file (likely `server.js` or `index.js`), add:

```javascript
// Add with other route imports
const placesRoutes = require('./routes/places');

// Add with other app.use() statements
app.use('/api/places', placesRoutes);
```

### Step 3: Add Environment Variable (Optional but Recommended)

In your Railway environment variables, add:

```
GOOGLE_PLACES_API_KEY=AIzaSyBNcg9u0nPypQXFOupFA5lD6FmJ-KCAekQ
```

Then update `places.js` line 7 to:
```javascript
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
```

### Step 4: Deploy Backend

```bash
cd ~/Desktop/carrotly-provider-database/backend
git add .
git commit -m "Add places proxy route"
git push
```

### Step 5: Test the Endpoints

```bash
# Test autocomplete
curl "https://fearless-achievement-production.up.railway.app/api/places/autocomplete?input=New%20York"

# Test place details
curl "https://fearless-achievement-production.up.railway.app/api/places/details/ChIJOwg_06VPwokRYv534QaPC8g"

# Test reverse geocode
curl "https://fearless-achievement-production.up.railway.app/api/places/reverse-geocode?lat=40.7128&lng=-74.0060"
```

---

## 2. Flutter Integration

### Step 1: Copy Files

```bash
# Favorites provider
cp favorites_provider.dart ~/Downloads/Findr_health_APP/lib/providers/

# Updated location picker
cp location_picker.dart ~/Downloads/Findr_health_APP/lib/presentation/widgets/

# Favorite button widget
cp favorite_button.dart ~/Downloads/Findr_health_APP/lib/presentation/widgets/

# Favorites screen
cp favorites_screen.dart ~/Downloads/Findr_health_APP/lib/presentation/screens/favorites/
```

### Step 2: Update API Constants

Make sure your `api_constants.dart` has the base URL:

```dart
// lib/core/constants/api_constants.dart
class ApiConstants {
  static const String baseUrl = 'https://fearless-achievement-production.up.railway.app/api';
}
```

### Step 3: Wire Up Auth Token Provider

Update `favorites_provider.dart` to connect to your actual auth state. Find these lines:

```dart
/// Auth token provider (should connect to your auth state)
final authTokenProvider = Provider<String?>((ref) {
  // TODO: Get from your auth state
  return null;
});
```

Replace with your actual auth provider:

```dart
final authTokenProvider = Provider<String?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.token;
});
```

### Step 4: Initialize Favorites on Login

In your auth provider or login flow, trigger favorites load after successful login:

```dart
// After successful login
ref.read(favoritesProvider.notifier).loadFavorites();
```

And clear on logout:

```dart
// On logout
ref.read(favoritesProvider.notifier).clear();
```

### Step 5: Add Route for Favorites Screen

In `app_router.dart`, add:

```dart
GoRoute(
  path: '/favorites',
  builder: (context, state) => const FavoritesScreen(),
),
```

### Step 6: Add Favorite Button to Provider Cards

In your `provider_card.dart`, add the FavoriteButton:

```dart
import '../../providers/favorites_provider.dart';
import '../widgets/favorite_button.dart';

// In your card widget, add positioned button:
Stack(
  children: [
    // Your existing card content
    
    // Add this in top-right corner
    Positioned(
      top: 8,
      right: 8,
      child: FavoriteButton(
        providerId: provider.id,
        providerData: FavoriteProvider(
          id: provider.id,
          practiceName: provider.practiceName,
          providerTypes: provider.providerTypes,
          primaryPhoto: provider.primaryPhoto,
          city: provider.address?.city,
          state: provider.address?.state,
          rating: provider.rating,
          reviewCount: provider.reviewCount,
          isVerified: provider.isVerified,
        ),
        showBackground: true,  // Adds white circle background
        size: 20,
      ),
    ),
  ],
)
```

### Step 7: Add to Provider Detail Screen

In your provider detail screen app bar:

```dart
AppBar(
  actions: [
    FavoriteButton(
      providerId: provider.id,
      providerData: FavoriteProvider(...),
      size: 24,
    ),
    const SizedBox(width: 8),
  ],
)
```

### Step 8: Link Favorites Screen from Profile

In your profile/settings screen, add a tile:

```dart
ListTile(
  leading: const Icon(LucideIcons.heart),
  title: const Text('Favorites'),
  trailing: Consumer(
    builder: (context, ref, _) {
      final count = ref.watch(favoritesProvider).favoriteProviders.length;
      if (count > 0) {
        return Text(
          '$count',
          style: const TextStyle(color: AppColors.textSecondary),
        );
      }
      return const SizedBox.shrink();
    },
  ),
  onTap: () => context.push('/favorites'),
),
```

---

## 3. Testing Checklist

### Backend Tests
- [ ] `GET /api/places/autocomplete?input=Chicago` returns predictions
- [ ] `GET /api/places/details/:placeId` returns city, state, coordinates
- [ ] `GET /api/places/reverse-geocode?lat=X&lng=Y` returns location name
- [ ] `GET /api/users/favorites` returns user's favorites (with auth)
- [ ] `POST /api/users/favorites/:providerId` adds favorite
- [ ] `DELETE /api/users/favorites/:providerId` removes favorite

### Flutter Tests
- [ ] Location picker opens and shows preset cities
- [ ] Typing in location search shows autocomplete results
- [ ] Selecting a city updates the location state
- [ ] "Use Current Location" works
- [ ] Heart icon shows on provider cards
- [ ] Tapping heart toggles favorite state immediately (optimistic)
- [ ] Favorites persist across app restarts
- [ ] Favorites screen shows all favorited providers
- [ ] Removing from favorites screen removes the card

---

## 4. File Summary

| File | Purpose | Location |
|------|---------|----------|
| `places.js` | Backend proxy for Google Places API | `backend/routes/` |
| `favorites_provider.dart` | State management for favorites | `lib/providers/` |
| `location_picker.dart` | Updated picker using backend proxy | `lib/presentation/widgets/` |
| `favorite_button.dart` | Reusable heart button widget | `lib/presentation/widgets/` |
| `favorites_screen.dart` | Screen showing all favorites | `lib/presentation/screens/favorites/` |

---

## 5. Troubleshooting

### Location Search Returns Empty
1. Check backend is deployed with places route
2. Verify Google Places API is enabled in Google Cloud Console
3. Check backend logs: `railway logs`

### Favorites Not Persisting
1. Verify auth token is being passed correctly
2. Check backend response: `curl -H "Authorization: Bearer TOKEN" .../favorites`
3. Ensure User model has `favorites` array field

### Heart Icon Not Showing
1. Verify `authTokenProvider` returns valid token
2. Check that favorites are loaded on login
3. Ensure `isFavoriteProvider` is watching correct state

---

## 6. Security Notes

### API Key Protection
- The Google Places API key is now server-side only
- Client apps no longer have access to the key
- Consider adding rate limiting per user/IP

### Future Improvements
- Add Redis caching for better performance
- Add request logging for debugging
- Consider caching at edge (CloudFlare, etc.)

---

*Integration Guide v1.0 - January 7, 2026*
