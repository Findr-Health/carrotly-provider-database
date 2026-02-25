# CLARITY PRICE - INTEGRATION GUIDE
## Adding to Existing Findr Health App

**Created:** January 24, 2026  
**Status:** Ready for Integration  
**Time Estimate:** 30 minutes

---

## 📦 STEP 1: ADD PACKAGES

Add these to `pubspec.yaml`:

```yaml
dependencies:
  # State Management (probably already have)
  flutter_riverpod: ^2.4.9
  
  # Image/File Picking
  image_picker: ^1.0.5
  file_picker: ^6.1.1
  
  # API Communication
  http: ^1.1.0
  http_parser: ^4.0.2
  
  # PDF Generation & Export
  pdf: ^3.10.4
  printing: ^5.11.0
  share_plus: ^7.2.1
  image_gallery_saver: ^2.0.3
  
  # File System
  path_provider: ^2.1.1
  
  # Image Display (probably already have)
  cached_network_image: ^3.3.0
```

**Run:**
```bash
flutter pub get
```

---

## 📁 STEP 2: ADD FILES TO PROJECT

Create folder structure:

```
lib/
├── features/
│   └── clarity_price/
│       ├── screens/
│       │   ├── clarity_price_education_screen.dart
│       │   └── clarity_price_upload_screen.dart
│       ├── services/
│       │   ├── clarity_price_api_service.dart
│       │   └── clarity_price_export_service.dart
│       ├── providers/
│       │   └── clarity_price_providers.dart
│       └── models/
│           └── clarity_price_models.dart
```

**Copy the 6 files I created into these locations.**

---

## 🔗 STEP 3: CONNECT AUTH TOKEN

In `clarity_price_providers.dart`, line 17:

**Find this:**
```dart
final clarityPriceApiProvider = Provider<ClarityPriceApiService>((ref) {
  final authToken = ''; // Replace with actual auth token
  
  return ClarityPriceApiService(authToken: authToken);
});
```

**Replace with your auth provider:**
```dart
final clarityPriceApiProvider = Provider<ClarityPriceApiService>((ref) {
  // Example: Get token from your existing auth system
  final authState = ref.watch(authProvider);
  final authToken = authState.token ?? '';
  
  return ClarityPriceApiService(authToken: authToken);
});
```

*Adjust `authProvider` to match your existing auth state management.*

---

## 🛣️ STEP 4: ADD ROUTES

In your main routing file (e.g., `lib/routes.dart` or `lib/main.dart`):

```dart
import 'features/clarity_price/screens/clarity_price_education_screen.dart';
import 'features/clarity_price/screens/clarity_price_upload_screen.dart';

// In your routes map:
routes: {
  '/clarity-price': (context) => const ClarityPriceEducationScreen(),
  '/clarity-price/upload': (context) => const ClarityPriceUploadScreen(),
  // Add more screens as you build them
},
```

**Or if using GoRouter:**

```dart
GoRoute(
  path: '/clarity-price',
  builder: (context, state) => const ClarityPriceEducationScreen(),
),
GoRoute(
  path: '/clarity-price/upload',
  builder: (context, state) => const ClarityPriceUploadScreen(),
),
```

---

## 🏠 STEP 5: ADD ENTRY POINT TO HOME SCREEN

In your `HomeScreen` widget (e.g., `lib/screens/home_screen.dart`):

```dart
import 'package:flutter/material.dart';

// In your home screen build method, add this card:
Widget _buildClarityPriceCard(BuildContext context, ThemeData theme) {
  return Card(
    margin: const EdgeInsets.all(16.0),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 2,
    child: InkWell(
      onTap: () => Navigator.pushNamed(context, '/clarity-price'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(20.0),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withOpacity(0.1),
              theme.colorScheme.secondary.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.analytics_outlined,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Understand Your Bills',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey[400],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Analyze medical bills and discover potential savings. Average savings: \$285 per bill.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// In your home screen Column/ListView:
@override
Widget build(BuildContext context) {
  final theme = Theme.of(context);
  
  return Scaffold(
    body: SingleChildScrollView(
      child: Column(
        children: [
          // Your existing home screen widgets
          // ...
          
          // Add Clarity Price card here (after "Next Appointment" or similar)
          _buildClarityPriceCard(context, theme),
          
          // Rest of your home screen
          // ...
        ],
      ),
    ),
  );
}
```

---

## 📱 STEP 6: ADD TO PROFILE TAB (OPTIONAL)

If you want it in Profile as well, add to your profile screen:

```dart
// In ProfileScreen:
ListTile(
  leading: Icon(Icons.analytics_outlined),
  title: Text('My Bill Analyses'),
  subtitle: Text('View past analyses and savings'),
  trailing: Icon(Icons.arrow_forward_ios, size: 16),
  onTap: () => Navigator.pushNamed(context, '/clarity-price/history'),
),
```

---

## 🔔 STEP 7: ADD PERMISSIONS (iOS)

In `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to photograph your medical bills</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select bill images</string>
```

---

## 🤖 STEP 8: ADD PERMISSIONS (Android)

In `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="28" />
```

---

## 🧪 STEP 9: TEST THE INTEGRATION

### Test Flow:
1. **Launch app**
2. **Go to Home screen** → Should see "Understand Your Bills" card
3. **Tap card** → Education screen opens
4. **Tap "Analyze Your First Bill"** → Upload screen opens
5. **Select image** → Preview appears
6. **Tap "Analyze Bill"** → (Processing screen - to be built next)

### Test API Connection:
```dart
// In a test widget or debug screen:
final api = ClarityPriceApiService(authToken: 'YOUR_TEST_TOKEN');

try {
  final stats = await api.getStats();
  print('Stats: $stats');
} catch (e) {
  print('API Error: $e');
}
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Package not found"
```bash
flutter pub get
flutter clean
flutter pub get
```

### Issue: "Auth token is empty"
Check `clarity_price_providers.dart` line 17 - make sure you're getting token from your auth provider.

### Issue: "Image picker not working"
- iOS: Check Info.plist has camera/photo permissions
- Android: Check AndroidManifest.xml has permissions
- Run: `flutter clean && flutter run`

### Issue: "API 401 Unauthorized"
- Verify auth token is valid
- Test login flow first
- Check token format (should be Bearer token)

### Issue: "Navigation error"
- Verify routes are added to your routing configuration
- Check route names match exactly (case-sensitive)

---

## 📊 WHAT'S NEXT

After integration, you still need to build:

### Remaining Screens (Priority Order):
1. **Processing Screen** - Shows real-time progress during analysis
2. **Results Screen** - Displays analysis with export options
3. **Script Screen** - Detailed negotiation strategy
4. **History Screen** - List of past analyses

### Features to Add:
- Deep linking (for notifications)
- Push notifications (analysis complete)
- Analytics tracking
- Error handling UI
- Offline mode

---

## 🎯 VALIDATION CHECKLIST

Before considering integration complete:

**Functionality:**
- [ ] Education screen displays correctly
- [ ] Upload screen can pick images
- [ ] Upload screen can pick PDFs
- [ ] Camera works on physical device
- [ ] Gallery picker works
- [ ] Location input works
- [ ] Date picker works
- [ ] Navigation flows work

**API Integration:**
- [ ] Auth token passes correctly
- [ ] Upload request succeeds
- [ ] Can fetch analysis by ID
- [ ] Can fetch history
- [ ] Error handling works

**UI/UX:**
- [ ] Matches existing app design
- [ ] Theme colors applied correctly
- [ ] Typography consistent
- [ ] Loading states work
- [ ] Error messages clear

**Permissions:**
- [ ] Camera permission granted (iOS)
- [ ] Camera permission granted (Android)
- [ ] Photo library permission granted (iOS)
- [ ] Storage permission granted (Android)

---

## 📞 SUPPORT

**Issues with integration?**
1. Check console for errors
2. Verify all files copied correctly
3. Ensure packages installed
4. Test auth token separately
5. Check API endpoint is accessible

**Backend API:**
- Base URL: https://fearless-achievement-production.up.railway.app
- Health check: GET /health
- Test endpoint: GET /api/clarity-price/stats (requires auth)

---

## ✅ COMPLETION

Once integrated, you should be able to:
1. ✅ Navigate to Clarity Price from Home
2. ✅ See education screen with examples
3. ✅ Upload a bill image via camera or gallery
4. ✅ Preview the selected image
5. ✅ Submit for analysis (then see processing screen)

**Status after integration:**
- Education screen: ✅ Complete
- Upload screen: ✅ Complete
- API service: ✅ Complete
- Models: ✅ Complete
- State management: ✅ Complete
- Export service: ✅ Complete

**Next build:**
- Processing screen (20 min)
- Results screen (40 min)
- Script screen (20 min)
- History screen (30 min)

---

*Integration Guide v1.0*  
*January 24, 2026*  
*Clarity Price Feature*
