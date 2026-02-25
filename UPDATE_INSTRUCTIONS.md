# QUICK UPDATE INSTRUCTIONS - Terms of Service v3.0

**File to Update:** `lib/presentation/screens/settings/terms_of_service_screen.dart`

---

## ✅ **OPTION 1: SIMPLE FIND & REPLACE** (Recommended - 2 minutes)

Since only Sections 4 & 5 changed, you can do a simple find and replace:

### Step 1: Update Version Number
**Find:**
```dart
'Version 2.0 | Effective Date: January 1, 2026',
```

**Replace with:**
```dart
'Version 3.0 | Effective Date: February 15, 2026',
```

### Step 2: Replace Section 4
**Find:** `class _Section4 extends StatelessWidget {`

**Replace entire class** with the new Section 4 code (see SECTION_4_NEW.txt)

### Step 3: Replace Section 5  
**Find:** `class _Section5 extends StatelessWidget {`

**Replace entire class** with the new Section 5 code (see SECTION_5_NEW.txt)

### Step 4: Add New Widget Classes
At the end of the file (before the closing brace), add these 4 new widgets:
- _PaymentModelBox
- _PlatformFeeBox
- _BinaryCancellationBox
- _TimeCalculationBox

(Code provided in NEW_WIDGETS.txt)

---

## ✅ **OPTION 2: USE PROVIDED COMPLETE FILE** (If you prefer)

I can provide the complete file broken into parts that you can reassemble, OR:

**EASIEST:** Tell me and I'll create a GitHub Gist link or provide it in chunks that you can copy/paste sequentially.

---

## 📋 **WHAT CHANGED**

**Section 4:** Added subsections 4.2 (80/20 model) and 4.3 (Platform fees)  
**Section 5:** Completely rewritten with binary 48-hour policy  
**New Widgets:** 4 visual components added  
**Version:** 2.0 → 3.0  
**Effective Date:** January 1 → February 15, 2026

---

## 🎯 **RECOMMENDATION**

**Best approach:** I'll provide you with 3 separate code files:
1. `SECTION_4_NEW.dart` - New Section 4 code
2. `SECTION_5_NEW.dart` - New Section 5 code  
3. `NEW_WIDGETS.dart` - 4 new widget classes

You can then:
1. Open your current file
2. Replace Section 4 class
3. Replace Section 5 class
4. Add new widgets at the end
5. Update version numbers
6. Done!

**Would you like me to:**
- **A)** Provide these 3 separate code files? (Easiest to copy/paste)
- **B)** Create one giant complete file? (Harder to work with)
- **C)** Create a diff/patch file? (For advanced users)

**Let me know and I'll provide it immediately!** 🚀
