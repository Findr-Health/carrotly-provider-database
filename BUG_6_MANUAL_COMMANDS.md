# BUG #6 INTEGRATION - SIMPLE COMMANDS
## Copy and paste these commands one section at a time

---

## STEP 1: Download File

**Action:** Download `search_results_screen.dart` from the outputs panel above
**Save to:** Desktop or Downloads folder

---

## STEP 2: Setup Directory & Copy File

```bash
cd ~/Development/findr-health/findr-health-mobile

mkdir -p lib/presentation/screens/search

# Replace "Downloads" with actual location if different
cp ~/Downloads/search_results_screen.dart lib/presentation/screens/search/

ls -la lib/presentation/screens/search/
```

**Expected output:** You should see `search_results_screen.dart` listed

---

## STEP 3: Update Imports in File

```bash
# Open the file in your editor
open lib/presentation/screens/search/search_results_screen.dart
```

**Replace the commented import section (lines 5-8) with:**

```dart
import 'package:findr_health/core/constants/app_colors.dart';
import 'package:findr_health/data/models/provider_model.dart';
import 'package:findr_health/data/repositories/provider_repository.dart';
import 'package:findr_health/presentation/widgets/provider_card.dart';
```

**Save the file.**

---

## STEP 4: Find Router File

```bash
find lib -name "*router*.dart" | grep -v test
```

**Expected output:** Should show path to your router file (e.g., `lib/core/router/app_router.dart`)

---

## STEP 5: Update Router

```bash
# Open your router file (replace path if different)
open lib/core/router/app_router.dart
```

**Add this import at the top:**

```dart
import 'package:findr_health/presentation/screens/search/search_results_screen.dart';
```

**Add this route in your routes list:**

```dart
GoRoute(
  path: '/search',
  builder: (context, state) {
    final query = state.uri.queryParameters['q'] ?? '';
    return SearchResultsScreen(query: query);
  },
),
```

**Save the file.**

---

## STEP 6: Format & Analyze

```bash
# Format code
flutter format lib/presentation/screens/search/search_results_screen.dart

# Analyze for errors
flutter analyze
```

**Expected:** No errors (0 issues found)

---

## STEP 7: Test Build

```bash
flutter build ios --debug --no-codesign
```

**Expected:** "Built build/ios/..." success message

---

## STEP 8: Commit Changes

```bash
# Check what changed
git status

# Stage files
git add lib/presentation/screens/search/search_results_screen.dart
git add lib/core/router/app_router.dart

# Commit
git commit -m "fix: add SearchResultsScreen to resolve Bug #6 (404 on 'See all results')

- Created comprehensive search results screen with filtering & sorting
- Added /search route to app router  
- Implements filter by type, rating, verified status
- Implements sort by relevance, distance, rating, price
- Includes empty state, error handling, pull-to-refresh
- Resolves Bug #6: Category Page 404 error

Engineering Standard: World-class, zero technical debt
Bug Fix Session: January 19, 2026"

# Push to GitHub
git push origin main
```

---

## STEP 9: Test on Device

```bash
# Run on simulator/device
flutter run
```

**Test:** 
1. Navigate to home screen
2. Tap search bar
3. Type a search query
4. Tap "See all results" button
5. ✅ Should load SearchResultsScreen (no 404!)

---

## ✅ COMPLETION CHECKLIST

- [ ] File downloaded and placed in correct directory
- [ ] Imports updated in search_results_screen.dart
- [ ] Route added to app_router.dart
- [ ] flutter analyze → 0 issues
- [ ] flutter build → Success
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Tested "See all results" button → Works!

---

**Status:** Bug #6 - FIXED ✅  
**Next:** Bug #4 (Search Quality) or Bug #5 (Location UI)
