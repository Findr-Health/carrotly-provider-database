# iOS Configuration Guide

**Document Purpose:** iOS-specific configuration for Findr Health app. Follow these steps when setting up the Xcode project.

---

## 1. Bundle Configuration

### Bundle Identifier
```
com.findrhealth.app
```

### Display Name
```
Findr Health
```

### Version Information
```
Version: 1.0.0
Build: 1
```

---

## 2. Info.plist Permissions

Add these entries to `ios/Runner/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Existing Flutter entries will be here -->
    
    <!-- ===== PERMISSIONS ===== -->
    
    <!-- Location (Required for finding nearby providers) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Findr Health needs your location to find healthcare providers near you and show accurate distances.</string>
    
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Findr Health needs your location to find healthcare providers near you and send appointment reminders based on your location.</string>
    
    <!-- Camera (For profile photo and insurance card scanning) -->
    <key>NSCameraUsageDescription</key>
    <string>Findr Health needs camera access to take your profile photo and scan insurance cards.</string>
    
    <!-- Photo Library (For profile photo selection) -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Findr Health needs photo library access to let you choose a profile photo.</string>
    
    <!-- Face ID (For biometric authentication) -->
    <key>NSFaceIDUsageDescription</key>
    <string>Findr Health uses Face ID for quick and secure login.</string>
    
    <!-- Contacts (Optional - for sharing provider info) -->
    <key>NSContactsUsageDescription</key>
    <string>Findr Health can access contacts to help you share provider information with friends and family.</string>
    
    <!-- Calendars (For adding appointments to calendar) -->
    <key>NSCalendarsUsageDescription</key>
    <string>Findr Health needs calendar access to add your appointments to your calendar.</string>
    
    <!-- ===== APP TRANSPORT SECURITY ===== -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <!-- Allow Railway backend -->
            <key>up.railway.app</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <false/>
                <key>NSIncludesSubdomains</key>
                <true/>
            </dict>
        </dict>
    </dict>
    
    <!-- ===== URL SCHEMES ===== -->
    <key>CFBundleURLTypes</key>
    <array>
        <!-- Deep linking -->
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>findrhealth</string>
            </array>
            <key>CFBundleURLName</key>
            <string>com.findrhealth.app</string>
        </dict>
        <!-- Google Sign-In (if using) -->
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID</string>
            </array>
        </dict>
    </array>
    
    <!-- ===== UNIVERSAL LINKS ===== -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:findrhealth.com</string>
        <string>applinks:www.findrhealth.com</string>
    </array>
    
    <!-- ===== BACKGROUND MODES ===== -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
    </array>
    
    <!-- ===== APPEARANCE ===== -->
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleDefault</string>
    
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>
    
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    
    <!-- ===== DEVICE CAPABILITIES ===== -->
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    
</dict>
</plist>
```

---

## 3. Podfile Configuration

Update `ios/Podfile`:

```ruby
# Uncomment this line to define a global platform for your project
platform :ios, '14.0'

# CocoaPods analytics sends network stats synchronously affecting flutter build latency.
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

def flutter_root
  generated_xcode_build_settings_path = File.expand_path(File.join('..', 'Flutter', 'Generated.xcconfig'), __FILE__)
  unless File.exist?(generated_xcode_build_settings_path)
    raise "#{generated_xcode_build_settings_path} must exist. If you're running pod install manually, make sure flutter pub get is executed first"
  end

  File.foreach(generated_xcode_build_settings_path) do |line|
    matches = line.match(/FLUTTER_ROOT\=(.*)/)
    return matches[1].strip if matches
  end
  raise "FLUTTER_ROOT not found in #{generated_xcode_build_settings_path}. Try deleting Generated.xcconfig, then run flutter pub get"
end

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
  
  # Add any additional pods here
  # pod 'Firebase/Analytics'
  # pod 'Firebase/Messaging'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    
    # Fix Xcode 14+ signing issues
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
      
      # Disable bitcode (deprecated by Apple)
      config.build_settings['ENABLE_BITCODE'] = 'NO'
      
      # Code signing
      config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO' if target.name == 'Pods-Runner'
    end
  end
end
```

---

## 4. Xcode Project Settings

### In Xcode, configure these settings:

#### General Tab
| Setting | Value |
|---------|-------|
| Display Name | Findr Health |
| Bundle Identifier | com.findrhealth.app |
| Version | 1.0.0 |
| Build | 1 |
| Deployment Target | iOS 14.0 |
| Device | iPhone |

#### Signing & Capabilities Tab
| Capability | Purpose |
|------------|---------|
| **Push Notifications** | Required for appointment reminders |
| **Sign in with Apple** | Required by App Store (since we offer social login) |
| **Associated Domains** | For universal links (deep linking) |
| **Background Modes** | Remote notifications, Background fetch |

**Add these Associated Domains:**
```
applinks:findrhealth.com
applinks:www.findrhealth.com
```

#### Build Settings Tab
| Setting | Value |
|---------|-------|
| iOS Deployment Target | 14.0 |
| Enable Bitcode | No |
| Always Embed Swift Standard Libraries | Yes |

---

## 5. App Icons Setup

### Directory Structure
Create this structure in `ios/Runner/Assets.xcassets/AppIcon.appiconset/`:

```
AppIcon.appiconset/
├── Contents.json
├── Icon-App-20x20@1x.png      (20x20)
├── Icon-App-20x20@2x.png      (40x40)
├── Icon-App-20x20@3x.png      (60x60)
├── Icon-App-29x29@1x.png      (29x29)
├── Icon-App-29x29@2x.png      (58x58)
├── Icon-App-29x29@3x.png      (87x87)
├── Icon-App-40x40@1x.png      (40x40)
├── Icon-App-40x40@2x.png      (80x80)
├── Icon-App-40x40@3x.png      (120x120)
├── Icon-App-60x60@2x.png      (120x120)
├── Icon-App-60x60@3x.png      (180x180)
├── Icon-App-76x76@1x.png      (76x76)
├── Icon-App-76x76@2x.png      (152x152)
├── Icon-App-83.5x83.5@2x.png  (167x167)
└── Icon-App-1024x1024@1x.png  (1024x1024)
```

### Contents.json
```json
{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-App-20x20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-App-20x20@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-App-29x29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-App-29x29@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-App-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-App-40x40@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-App-60x60@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-App-60x60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "Icon-App-20x20@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "Icon-App-20x20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "Icon-App-29x29@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "Icon-App-29x29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "Icon-App-40x40@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "Icon-App-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "Icon-App-76x76@1x.png",
      "scale" : "1x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "Icon-App-76x76@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "83.5x83.5",
      "idiom" : "ipad",
      "filename" : "Icon-App-83.5x83.5@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "Icon-App-1024x1024@1x.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
```

---

## 6. Launch Screen

The launch screen is configured in `ios/Runner/Base.lproj/LaunchScreen.storyboard`.

For a simple branded launch screen:
1. Set background color to white (#FFFFFF)
2. Add centered Findr logo image
3. Ensure it matches splash screen design

---

## 7. Entitlements

Create `ios/Runner/Runner.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>development</string>
    
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
    
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:findrhealth.com</string>
        <string>applinks:www.findrhealth.com</string>
    </array>
</dict>
</plist>
```

**Note:** Change `aps-environment` to `production` for App Store builds.

---

## 8. Environment Configuration

### Debug vs Release

Create `ios/Flutter/Debug.xcconfig`:
```
#include "Generated.xcconfig"
FLUTTER_TARGET=lib/main.dart
API_BASE_URL=https://fearless-achievement-production.up.railway.app/api
ENVIRONMENT=development
```

Create `ios/Flutter/Release.xcconfig`:
```
#include "Generated.xcconfig"
FLUTTER_TARGET=lib/main.dart
API_BASE_URL=https://fearless-achievement-production.up.railway.app/api
ENVIRONMENT=production
```

---

## 9. Quick Reference Commands

```bash
# Clean build
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Regenerate iOS project
flutter clean
flutter pub get
cd ios && pod install && cd ..

# Build for device
flutter build ios --release

# Build for simulator
flutter build ios --simulator

# Open in Xcode
open ios/Runner.xcworkspace
```

---

*Last Updated: January 2, 2026*
