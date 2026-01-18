# FINDR HEALTH - UX IMPROVEMENT PLAN
## Pre-TestFlight Polish - World-Class Design Standards

**Created:** January 17, 2026  
**Target:** iPhone 16 Pro (6.1" display, 393×852pt)  
**Design System:** iOS Human Interface Guidelines + Marketplace Best Practices  
**Quality Standard:** World-class e-commerce/healthcare UX

---

## 📋 EXECUTIVE SUMMARY

Three critical UX improvements before TestFlight:

### 1. Provider Cards: 220pt → 300pt (+36%)
- Current: 2.33 cards visible (cluttered)
- New: 1.66 cards visible (optimal)
- Fonts scaled: 18pt names, 15pt types, 14pt details
- Matches Zocdoc (300pt), Uber Health (280pt)

### 2. Footer Icons: 24pt → 28pt (+17%)
- Current: Below accessibility minimum
- New: WCAG AAA compliant (48pt tap targets)
- Center button: 60pt → 64pt

### 3. Multi-Field Search
- Current: Provider names only (~30% success)
- New: Names + services + locations (~85% success)
- Examples: "teeth whitening", "physical therapy", "San Francisco"

**Total Time:** 5-7 hours  
**Impact:** Transforms app from good to world-class

---

## 🎯 DETAILED SPECIFICATIONS

See full 24-page plan in repository for:
- Research foundations (iOS HIG, WCAG, marketplace benchmarks)
- Exact measurements and typography specifications
- Implementation code examples
- Success metrics and testing criteria

---

## 📐 IMPLEMENTATION PHASES

### Phase 1: Provider Cards (1-2 hours)
```dart
// Update in home_screen.dart
height: 300,  // was 220

// Update in provider_card.dart
Provider name: fontSize: 18, fontWeight: w700
Provider type: fontSize: 15, fontWeight: w500
Rating/distance: fontSize: 14
```

### Phase 2: Footer Icons (1 hour)
```dart
// Update in main_shell.dart
Icon size: 28,  // was 24
Padding: 10,    // was 8
Center button: 64,  // was 60
```

### Phase 3: Multi-Field Search (2-3 hours)
```javascript
// Backend: routes/providers.js
query.$or = [
  { practiceName: { $regex: search, $options: 'i' } },
  { 'services.name': { $regex: search, $options: 'i' } },
  { 'services.category': { $regex: search, $options: 'i' } },
  { 'address.city': { $regex: search, $options: 'i' } },
];
```

---

*Full plan: See complete UX_IMPROVEMENT_PLAN.md in repository*
