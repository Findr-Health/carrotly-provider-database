# PROVIDER DETAIL SCREEN - MANUAL FIX GUIDE
## Safe, Step-by-Step Instructions

**File:** `lib/presentation/screens/provider_detail/provider_detail_screen.dart`

---

## STEP 1: Add Import (Line 1)

**Find this at the top of the file:**
```dart
import 'package:flutter/material.dart';
```

**Add this line BEFORE it:**
```dart
import 'dart:convert';
```

**Result should be:**
```dart
import 'dart:convert';
import 'package:flutter/material.dart';
```

---

## STEP 2: Fix Photo Display (Around Line 207-215)

**Find this code:**
```dart
background: CachedNetworkImage(
  imageUrl: provider.coverImageUrl ?? provider.imageUrl ?? 'https://picsum.photos/400/300',
  fit: BoxFit.cover,
  placeholder: (context, url) => Container(
    color: AppColors.background,
    child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
  ),
  errorWidget: (context, url, error) => Container(
    color: AppColors.background,
    child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
  ),
),
```

**Replace with:**
```dart
background: _buildHeaderImage(provider.coverImageUrl ?? provider.imageUrl ?? 'https://picsum.photos/400/300'),
```

---

## STEP 3: Add Helper Method (After line 136, before @override Widget build)

**Find this line:**
```dart
@override
Widget build(BuildContext context) {
```

**Add THIS ENTIRE METHOD just BEFORE that line:**
```dart
/// Build header image - supports both URLs and base64
Widget _buildHeaderImage(String imageUrl) {
  // Check if it's a base64 data URI
  if (imageUrl.startsWith('data:image/')) {
    try {
      final base64Data = imageUrl.split(',').last;
      final bytes = base64Decode(base64Data);
      return Image.memory(
        bytes,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            color: AppColors.background,
            child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
          );
        },
      );
    } catch (e) {
      return Container(
        color: AppColors.background,
        child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
      );
    }
  }
  
  // Regular URL
  return CachedNetworkImage(
    imageUrl: imageUrl,
    fit: BoxFit.cover,
    placeholder: (context, url) => Container(
      color: AppColors.background,
      child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
    ),
    errorWidget: (context, url, error) => Container(
      color: AppColors.background,
      child: const Icon(LucideIcons.image, size: 48, color: AppColors.textTertiary),
    ),
  );
}

```

---

## STEP 4: Fix Badges (Around Line 242-263)

**Find this code:**
```dart
if (provider.isVerified)
  Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.badgeCheck, size: 14, color: AppColors.primary),
        const SizedBox(width: 4),
        Text('Verified', style: TextStyle(fontFamily: 'Urbanist', fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
      ],
    ),
  ),
if (provider.isFeatured)
  Container(
    margin: EdgeInsets.only(left: provider.isVerified ? 8 : 0),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(color: Colors.amber.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.star, size: 14, color: Colors.amber),
        const SizedBox(width: 4),
        Text('Featured', style: TextStyle(fontFamily: 'Urbanist', fontSize: 12, fontWeight: FontWeight.w600, color: Colors.amber)),
      ],
    ),
  ),
```

**Replace with:**
```dart
if (provider.isVerified)
  _buildIconBadge(
    icon: LucideIcons.badgeCheck,
    color: const Color(0xFF00BFA5),
    tooltip: 'Verified Provider',
  ),
if (provider.isFeatured)
  Padding(
    padding: EdgeInsets.only(left: provider.isVerified ? 4 : 0),
    child: _buildIconBadge(
      icon: LucideIcons.star,
      color: const Color(0xFFFFB300),
      tooltip: 'Featured Provider',
    ),
  ),
```

---

## STEP 5: Add Badge Helper Method (Right after _buildHeaderImage method)

**After the closing brace of `_buildHeaderImage`, add:**

```dart
/// Build icon badge - matches ProviderCard design
Widget _buildIconBadge({
  required IconData icon,
  required Color color,
  required String tooltip,
}) {
  return Tooltip(
    message: tooltip,
    child: Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(
        icon,
        size: 16,
        color: Colors.white,
      ),
    ),
  );
}

```

---

## VERIFICATION

After making all changes:

```bash
# Check for syntax errors
flutter analyze lib/presentation/screens/provider_detail/provider_detail_screen.dart

# Should see NO errors, only warnings (withOpacity deprecation is OK)
```

---

## SUMMARY

**Changes:**
1. ✅ Added dart:convert import
2. ✅ Replaced CachedNetworkImage with _buildHeaderImage() call
3. ✅ Added _buildHeaderImage() helper method (supports base64)
4. ✅ Replaced text badge pills with _buildIconBadge() calls
5. ✅ Added _buildIconBadge() helper method (circular badges)

**What This Fixes:**
- Photos display (both URLs and base64)
- Badges match card design (icon circles)
- Consistent UX across app

---

**Take your time with each step. Test after Step 3 (photos), then do Steps 4-5 (badges).**
