# Google Maps SDK Setup Guide for Flutter

## Step 1: Enable APIs in Google Cloud Console

Go to: https://console.cloud.google.com/

### 1.1 Select or Create Project
- Click the project dropdown at the top
- Select existing project or click "New Project"

### 1.2 Enable Required APIs
Go to **APIs & Services > Library** and enable these:

1. **Maps SDK for Android**
   - Search "Maps SDK for Android"
   - Click Enable

2. **Maps SDK for iOS**
   - Search "Maps SDK for iOS"  
   - Click Enable

3. **Places API** (you already have this)
   - Search "Places API"
   - Verify it shows "Enabled"

### 1.3 Create/Configure API Key
Go to **APIs & Services > Credentials**

If you already have `GOOGLE_PLACES_API_KEY`:
- Click on the key name
- Under "API restrictions", select "Restrict key"
- Check all three: Maps SDK for Android, Maps SDK for iOS, Places API
- Click Save

If creating new key:
- Click "Create Credentials" > "API Key"
- Click "Restrict Key"
- Set restrictions as above

**Your API Key:** `AIzaSyCgdJkl9_IsnvtyuHgxLeN8uGollQ6_SmI`

---

## Step 2: Configure iOS

Open `ios/Runner/AppDelegate.swift` and replace contents with:

```swift
import Flutter
import UIKit
import GoogleMaps

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyCgdJkl9_IsnvtyuHgxLeN8uGollQ6_SmI")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### 2.1 Update iOS Podfile
Open `ios/Podfile` and ensure minimum iOS version is 14.0:

```ruby
platform :ios, '14.0'
```

### 2.2 Add Location Permission (if not already)
Open `ios/Runner/Info.plist` and add inside `<dict>`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Findr Health needs your location to find nearby healthcare providers.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Findr Health needs your location to find nearby healthcare providers.</string>
```

### 2.3 Install Pods
```bash
cd ios
pod install
cd ..
```

---

## Step 3: Configure Android

### 3.1 Add API Key to AndroidManifest.xml
Open `android/app/src/main/AndroidManifest.xml`

Add inside `<application>` tag (before `</application>`):

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyCgdJkl9_IsnvtyuHgxLeN8uGollQ6_SmI"/>
```

### 3.2 Add Permissions (if not already)
Add inside `<manifest>` tag (before `<application>`):

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

### 3.3 Update build.gradle
Open `android/app/build.gradle`

Ensure minSdkVersion is at least 21:
```gradle
defaultConfig {
    minSdkVersion 21
    // ...
}
```

---

## Step 4: Add Flutter Package

Run:
```bash
flutter pub add google_maps_flutter
```

Verify in `pubspec.yaml`:
```yaml
dependencies:
  google_maps_flutter: ^2.5.0
```

Then:
```bash
flutter pub get
```

---

## Step 5: Test the Setup

Create a simple test file or run the app:

```bash
flutter run
```

If you see map loading, the setup is complete!

---

## Troubleshooting

### "API key not found" or blank map
- Verify API key is correct in both iOS and Android configs
- Ensure Maps SDK for iOS/Android are enabled in Cloud Console
- Check API key restrictions include Maps SDK

### iOS build errors
```bash
cd ios
pod deintegrate
pod install
cd ..
flutter clean
flutter run
```

### Android build errors
```bash
flutter clean
cd android
./gradlew clean
cd ..
flutter run
```

### Location not working
- Check that location permissions are in Info.plist and AndroidManifest.xml
- On iOS simulator, set a location: Debug > Location > Custom Location
- On Android emulator, set location via extended controls

---

## Summary Checklist

- [ ] Maps SDK for Android enabled in Cloud Console
- [ ] Maps SDK for iOS enabled in Cloud Console
- [ ] Places API enabled in Cloud Console
- [ ] API key added to `ios/Runner/AppDelegate.swift`
- [ ] API key added to `android/app/src/main/AndroidManifest.xml`
- [ ] Location permissions added to both platforms
- [ ] `google_maps_flutter` package added to pubspec.yaml
- [ ] `flutter pub get` run
- [ ] iOS pods installed (`cd ios && pod install`)
- [ ] Test run successful
