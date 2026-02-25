# Findr Health Design System
**Version 1.0** | Updated: January 27, 2026

Complete design specification for Findr Health mobile app and provider portal.

---

## 📱 MOBILE APP (Flutter)

### **Typography**

#### **Font Family**
- **Primary:** Urbanist
- **Weights Available:**
  - Regular (400)
  - Medium (500)
  - SemiBold (600)
  - Bold (700)

#### **Type Scale & Hierarchy**

**Display (Headlines for Hero Sections)**
```dart
displayLarge:   57px / Bold (700) / -0.5 letter-spacing
displayMedium:  45px / Bold (700) / -0.5 letter-spacing
displaySmall:   36px / Bold (700) / -0.5 letter-spacing
```

**Headlines (Section Headers)**
```dart
headlineLarge:  32px / Bold (700) / -0.5 letter-spacing
headlineMedium: 28px / Bold (700) / -0.5 letter-spacing
headlineSmall:  24px / Bold (700)
```

**Titles (Card Headers, List Items)**
```dart
titleLarge:     20px / Bold (700)
titleMedium:    16px / SemiBold (600)
titleSmall:     14px / SemiBold (600)
```

**Body (Content Text)**
```dart
bodyLarge:      16px / Regular (400) / 1.5 line-height
bodyMedium:     14px / Regular (400) / 1.5 line-height
bodySmall:      12px / Regular (400) / 1.5 line-height / textSecondary color
```

**Labels (Buttons, Form Labels)**
```dart
labelLarge:     14px / SemiBold (600)
labelMedium:    12px / SemiBold (600)
labelSmall:     10px / SemiBold (600) / textSecondary color
```

**Usage Guidelines:**
- Display: Hero sections only (e.g., onboarding splash)
- Headlines: Main screen titles, major sections
- Titles: Card headers, provider names, list items
- Body: Descriptions, content paragraphs, chat messages
- Labels: Button text, form labels, badges

---

### **Color System**

#### **Brand Colors**
```dart
Primary:        #17DDC0 (Teal) - Main brand color
Primary Light:  #E5FBF8 - Backgrounds, hover states
Primary Dark:   #12B89E - Active states, pressed buttons
```

**Usage:**
- Primary: Buttons, links, active states, brand elements
- Primary Light: Card backgrounds, input fills, subtle highlights
- Primary Dark: Button press states, selected items

#### **Text Colors**
```dart
Text Primary:   #000000 - Headlines, body text
Text Secondary: #6B7280 - Supporting text, labels
Text Tertiary:  #9CA3AF - Placeholders, disabled text
Text White:     #FFFFFF - Text on dark backgrounds
```

**Usage Hierarchy:**
1. Primary: All main content, headlines
2. Secondary: Captions, metadata, secondary info
3. Tertiary: Placeholders, hints, disabled states

#### **Background Colors**
```dart
Background:     #FFFFFF - Main app background
Surface:        #F9FAFB - Cards, elevated elements
Surface Light:  #F3F4F6 - Secondary cards, nested content
```

**Layer System:**
- Background: Base canvas
- Surface: Floating cards, containers
- Surface Light: Nested cards, input backgrounds

#### **Border & Divider**
```dart
Border:         #E5E7EB - Card borders, dividers
Divider:        #E5E7EB - List separators
```

**Weight:** 1px standard

#### **Status Colors**
```dart
Success:        #10B981 + Light: #D1FAE5
Warning:        #F59E0B + Light: #FEF3C7
Error:          #EF4444 + Light: #FEE2E2
Info:           #3B82F6 + Light: #DBEAFE
```

**Usage:**
- Success: Confirmations, approved states, positive feedback
- Warning: Alerts, pending states, caution messages
- Error: Validation errors, rejected states, destructive actions
- Info: Informational messages, tips, neutral notifications

#### **Provider Type Colors** (Category Tiles)
```dart
Medical:        #E6EFFF (Light Blue)
Urgent Care:    #FFE8E5 (Light Coral)
Dental:         #FFF3E1 (Light Yellow)
Mental Health:  #F9EBFF (Light Purple)
Skincare:       #F5E8F0 (Light Pink)
Massage:        #FFF9E6 (Cream)
Fitness:        #E9FFDB (Light Green)
Yoga:           #E7FFFA (Mint)
Nutrition:      #E5F7FF (Sky Blue)
Pharmacy:       #FEE4E4 (Light Red)
```

**Application:** Home screen category tiles, search filters

#### **Gradients**
```dart
Primary Gradient:
  - Start: #4FE8D0 (top-left)
  - End:   #17DDC0 (bottom-right)
  - Usage: CTA buttons, hero sections, Clarity Hub buttons

Dark Gradient:
  - Start: #1A3A35 (top)
  - End:   #0D1F1C (bottom)
  - Usage: Premium features, dark mode elements
```

#### **Special Colors**
```dart
Star Filled:    #F59E0B - Rating stars (filled)
Star Empty:     #E5E7EB - Rating stars (empty)
Overlay:        #80000000 (50% black) - Modals, dialogs
Overlay Light:  #40000000 (25% black) - Subtle overlays
Shimmer Base:   #E5E7EB - Loading skeleton base
Shimmer Highlight: #F9FAFB - Loading skeleton shimmer
```

---

### **Component Styles**

#### **Buttons**

**Elevated Button (Primary CTA)**
```dart
Background:     Primary (#17DDC0)
Text:           White
Padding:        24px horizontal, 16px vertical
Border Radius:  12px
Font:           16px / SemiBold (600)
Elevation:      0 (flat design)
States:
  - Hover:      Primary Dark (#12B89E)
  - Pressed:    Primary Dark (#12B89E)
  - Disabled:   50% opacity
```

**Outlined Button (Secondary Action)**
```dart
Background:     Transparent
Border:         1.5px solid Primary (#17DDC0)
Text:           Primary (#17DDC0)
Padding:        24px horizontal, 16px vertical
Border Radius:  12px
Font:           16px / SemiBold (600)
States:
  - Hover:      Primary Light background (#E5FBF8)
  - Pressed:    Primary Light background (#E5FBF8)
```

**Text Button (Tertiary Action)**
```dart
Background:     Transparent
Text:           Primary (#17DDC0)
Padding:        16px horizontal, 12px vertical
Font:           14px / SemiBold (600)
States:
  - Hover:      Primary Dark text (#12B89E)
  - Pressed:    Primary Dark text (#12B89E)
```

#### **Cards**
```dart
Background:     Surface (#F9FAFB) or Background (#FFFFFF)
Border Radius:  16px
Elevation:      0 (flat design)
Border:         None (optional 1px #E5E7EB for emphasis)
Padding:        16-24px (content dependent)
```

**Card Variants:**
- **Standard:** White background, no border
- **Elevated:** Surface background (#F9FAFB), subtle shadow
- **Outlined:** White background, 1px border

#### **Input Fields**
```dart
Background:     Surface (#F9FAFB)
Border:         None (default state)
Border Radius:  12px
Padding:        16px horizontal, 16px vertical
Font:           14px / Regular (400)
Placeholder:    Text Tertiary (#9CA3AF)
States:
  - Default:    Filled surface, no border
  - Focused:    2px Primary border (#17DDC0)
  - Error:      1px Error border (#EF4444)
  - Disabled:   50% opacity
```

#### **Spacing System**
```dart
XS:  4px   - Icon gaps, tight spacing
S:   8px   - Between related elements
M:   16px  - Standard spacing, card padding
L:   24px  - Section spacing
XL:  32px  - Major section breaks
XXL: 48px  - Screen-level spacing
```

#### **Border Radius Scale**
```dart
Small:   8px  - Badges, small chips
Medium:  12px - Buttons, inputs
Large:   16px - Cards, containers
XLarge:  24px - Modal dialogs
Round:   999px - Pills, circular elements
```

#### **Icons**
**Library:** Lucide Icons (lucide_icons package)

**Sizes:**
```dart
Small:   16px - List items, inline icons
Medium:  24px - Navigation, standard UI
Large:   32px - Feature icons, empty states
XLarge:  48px - Hero icons, large graphics
```

**Common Icons:**
- `LucideIcons.sparkles` - Clarity/AI features
- `LucideIcons.messageCircle` - Chat
- `LucideIcons.fileText` - Documents, bills
- `LucideIcons.trendingUp` - Analytics, growth
- `LucideIcons.chevronRight` - Navigation arrows
- `LucideIcons.alertCircle` - Warnings, info
- `LucideIcons.search` - Search functionality
- `LucideIcons.mapPin` - Location

**Color Usage:**
- Primary icons: Primary color (#17DDC0)
- Standard icons: Text Primary (#000000)
- Secondary icons: Text Secondary (#6B7280)

---

### **Layout Guidelines**

#### **Screen Padding**
```dart
Mobile:         20px horizontal, 16px top/bottom
Tablet:         32px horizontal, 24px top/bottom
Content Max:    None (full width with padding)
```

#### **Safe Areas**
- **iOS:** Respect notch/Dynamic Island (56px top minimum)
- **Android:** Respect system UI (24px top minimum)
- **Bottom Nav:** 80px height + safe area

#### **Modal Overlays**
```dart
Background:     Overlay (#80000000)
Content BG:     White
Border Radius:  24px top corners (bottom sheet style)
Max Height:     90% screen height
Drag Handle:    40px width, 4px height, gray (#9CA3AF)
```

---

### **Animation & Transitions**

#### **Timing**
```dart
Fast:       150ms - Micro-interactions, hover states
Standard:   250ms - Button presses, sheet openings
Slow:       400ms - Page transitions, complex animations
```

#### **Curves**
```dart
Standard:   Curves.easeInOut - Most animations
Emphasis:   Curves.easeOut - Entering elements
Decelerate: Curves.decelerate - Exiting elements
```

#### **Common Animations**
- **Button Press:** Scale 0.95 + opacity 0.8 (100ms)
- **Sheet Open:** Slide up + fade (250ms)
- **Card Tap:** Scale 0.98 (150ms)
- **Loading:** Shimmer sweep (1500ms loop)

---

## 💻 PROVIDER PORTAL (React + Tailwind)

### **Typography**

#### **Font Family**
- **System Font Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Uses browser default sans-serif fonts for performance

#### **Type Scale**
```css
text-xs:    12px / 1rem
text-sm:    14px / 1.25rem
text-base:  16px / 1.5rem (default)
text-lg:    18px / 1.75rem
text-xl:    20px / 1.75rem
text-2xl:   24px / 2rem
text-3xl:   30px / 2.25rem
```

**Usage:**
- `text-2xl font-bold` - Page headers
- `text-lg font-medium` - Section headers
- `text-base` - Body text, forms
- `text-sm` - Secondary text, captions
- `text-xs` - Badges, small labels

#### **Font Weights**
```css
font-normal:  400 - Body text
font-medium:  500 - Emphasized text
font-semibold: 600 - Subheadings
font-bold:    700 - Main headings
```

---

### **Color System**

#### **Brand Colors (Tailwind Config)**
```javascript
teal: {
  50:  '#f0fdfa'  // Lightest
  100: '#ccfbf1'
  200: '#99f6e4'
  300: '#5eead4'
  400: '#2dd4bf'
  500: '#00CDB7'  // Primary brand color
  600: '#0d9488'
  700: '#0f766e'
  800: '#115e59'
  900: '#134e4a'  // Darkest
}
```

**Usage:**
- `bg-teal-500` - Primary buttons, active states
- `text-teal-600` - Links, interactive text
- `bg-teal-50` - Subtle backgrounds
- `border-teal-500` - Active borders

#### **Status Colors (Tailwind Default)**
```javascript
Success (Green):
  - bg-green-100: #d1fae5 (background)
  - text-green-800: #065f46 (text)
  - bg-green-600: #16a34a (button)

Warning (Yellow):
  - bg-yellow-100: #fef3c7 (background)
  - text-yellow-800: #854d0e (text)
  - bg-yellow-500: #eab308 (button)

Error (Red):
  - bg-red-100: #fee2e2 (background)
  - text-red-800: #991b1b (text)
  - bg-red-600: #dc2626 (button)

Info (Blue):
  - bg-blue-100: #dbeafe (background)
  - text-blue-800: #1e40af (text)
  - bg-blue-600: #2563eb (button)
```

#### **Neutral Grays**
```javascript
gray-50:   #f9fafb  // Backgrounds
gray-100:  #f3f4f6  // Subtle backgrounds
gray-200:  #e5e7eb  // Borders
gray-300:  #d1d5db  // Dividers
gray-600:  #4b5563  // Secondary text
gray-700:  #374151  // Body text
gray-900:  #111827  // Headlines
```

---

### **Component Styles**

#### **Buttons**

**Primary Button**
```css
bg-blue-600 hover:bg-blue-700
text-white
px-4 py-2
rounded-lg
disabled:opacity-50
```

**Secondary Button**
```css
border border-gray-300
hover:bg-gray-50
px-4 py-2
rounded-lg
```

**Danger Button**
```css
bg-red-600 hover:bg-red-700
text-white
px-4 py-2
rounded-lg
disabled:opacity-50
```

**Button Sizes:**
- Small: `px-3 py-1.5 text-sm`
- Medium: `px-4 py-2 text-base` (default)
- Large: `px-6 py-3 text-lg`

#### **Status Badges**
```css
Pending:  bg-yellow-100 text-yellow-800
Approved: bg-green-100 text-green-800
Rejected: bg-red-100 text-red-800
Draft:    bg-gray-100 text-gray-800

Style:    px-3 py-1 rounded-full text-sm font-medium
```

#### **Cards**
```css
bg-white
rounded-lg
shadow (default Tailwind: 0 1px 3px rgba(0,0,0,0.1))
p-4 or p-6 (content-dependent)
```

**Card Variants:**
- **Standard:** `bg-white rounded-lg shadow p-6`
- **Outlined:** `bg-white rounded-lg border border-gray-200 p-6`
- **Elevated:** `bg-white rounded-lg shadow-lg p-6`

#### **Forms & Inputs**
```css
Default Input:
  px-4 py-2
  border border-gray-300
  rounded-lg
  hover:bg-gray-50
  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
```

#### **Spacing**
Uses Tailwind's default spacing scale (4px base unit):
```css
p-2:  8px
p-4:  16px
p-6:  24px
p-8:  32px
gap-2: 8px
gap-4: 16px
```

#### **Borders**
```css
Border Width:   1px (default)
Border Radius:
  - rounded:      4px
  - rounded-lg:   8px
  - rounded-full: 9999px
Border Colors:  gray-200, gray-300 (standard)
```

---

### **Layout Guidelines**

#### **Container**
```css
max-width: 1280px (max-w-7xl)
margin: 0 auto
padding: 2rem (p-8)
```

#### **Grid System**
Uses Tailwind's grid utilities:
```css
Grid:       grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Gap:        gap-4 (16px)
```

#### **Responsive Breakpoints**
```css
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

**Common Pattern:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 🎨 DESIGN PATTERNS

### **Mobile App Patterns**

#### **Navigation**
- **Bottom Nav:** 3-5 items, always visible
- **Top AppBar:** Title + actions, transparent background
- **Back Navigation:** Leading arrow, system back gesture

#### **Lists**
- **Padding:** 16px horizontal
- **Item Height:** 72-88px (touch target)
- **Dividers:** 1px, color: Border (#E5E7EB)
- **Swipe Actions:** Optional (delete, archive)

#### **Empty States**
- **Icon:** 64px, Primary color or gray
- **Title:** Headline Small (24px Bold)
- **Description:** Body Medium (14px Regular)
- **Action:** Primary button (optional)

#### **Loading States**
- **Shimmer:** Animated gradient sweep
- **Spinner:** Primary color, 32-48px
- **Progress Bar:** Primary color, 4px height

#### **Modals & Sheets**
- **Bottom Sheet:** Preferred for mobile
- **Full Screen:** For complex flows
- **Drag Handle:** Always include for sheets
- **Overlay:** 50% black (#80000000)

---

### **Provider Portal Patterns**

#### **Tables**
```html
<table class="min-w-full">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 text-sm text-gray-900">
</table>
```

#### **Forms**
```html
<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
    <input class="w-full px-4 py-2 border border-gray-300 rounded-lg">
  </div>
</div>
```

#### **Alerts/Notifications**
```html
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
  <!-- Info alert -->
</div>

<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
  <!-- Error alert -->
</div>
```

---

## 🔤 BRAND VOICE & TONE

### **Mobile App (Patient-Facing)**
- **Voice:** Direct, empowering, insider knowledge
- **Tone:** Confident but not arrogant, helpful
- **Language:** Plain English, avoid medical jargon
- **Example:** "That $580 bill? 5x Medicare rates. Fair price: $115-175."

### **Provider Portal (Professional)**
- **Voice:** Professional, efficient, technical when needed
- **Tone:** Neutral, informative
- **Language:** Industry terminology acceptable
- **Example:** "Provider status updated to Approved"

---

## 📐 ACCESSIBILITY

### **Mobile App**
- **Minimum Touch Target:** 44x44 points (iOS), 48x48 dp (Android)
- **Color Contrast:** WCAG AA compliant (4.5:1 for text)
- **Font Scaling:** Supports system text size settings
- **Screen Readers:** All interactive elements labeled

### **Provider Portal**
- **Keyboard Navigation:** All actions accessible via keyboard
- **Focus Indicators:** Visible focus rings (ring-2 ring-blue-500)
- **Color Contrast:** WCAG AA compliant
- **ARIA Labels:** Added where needed

---

## 🎯 IMPLEMENTATION NOTES

### **Mobile App**
- **Design System File:** `lib/presentation/theme/app_theme.dart`
- **Colors:** `lib/core/constants/app_colors.dart`
- **Material 3:** Enabled (`useMaterial3: true`)
- **Icon Package:** `lucide_icons` (consistent with web)

### **Provider Portal**
- **Framework:** Tailwind CSS v3
- **Config:** `tailwind.config.js`
- **No Custom CSS:** Use Tailwind utilities exclusively
- **Icons:** Built-in Tailwind icons or inline SVG

---

## 📱 RESPONSIVE DESIGN

### **Mobile App**
- **Single Layout:** Optimized for mobile screens
- **Tablet:** Larger spacing, multi-column where appropriate
- **Orientation:** Portrait primary, landscape supported

### **Provider Portal**
- **Mobile First:** Base styles for mobile
- **Breakpoint Strategy:**
  - Mobile: Single column
  - Tablet (md): 2 columns
  - Desktop (lg): 3+ columns, sidebar navigation
- **Table Handling:** Horizontal scroll on mobile

---

## 🎨 ASSETS & RESOURCES

### **Mobile App Assets**
- **Location:** `assets/images/`, `assets/icons/`
- **Format:** PNG for images, vector icons via package
- **Density:** @1x, @2x, @3x for iOS; mdpi, hdpi, xhdpi, xxhdpi for Android

### **Provider Portal Assets**
- **Icons:** Inline SVG or Lucide Icons
- **Images:** Hosted on CDN or base64 embedded
- **Format:** SVG preferred for icons, WebP for photos

---

**Last Updated:** January 27, 2026  
**Maintained By:** Tim Wetherill + Claude  
**Version:** 1.0 (Initial Documentation)

---

## 📞 QUICK REFERENCE

### **Most Common Mobile Patterns**
```dart
// Primary Button
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: AppColors.primary,
    foregroundColor: Colors.white,
    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
)

// Card
Card(
  color: AppColors.surface,
  elevation: 0,
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
  child: Padding(padding: EdgeInsets.all(16), child: ...)
)

// Input Field
TextField(
  decoration: InputDecoration(
    filled: true,
    fillColor: AppColors.surface,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
  ),
)
```

### **Most Common Portal Patterns**
```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

<!-- Card -->
<div class="bg-white rounded-lg shadow p-6">

<!-- Status Badge -->
<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">

<!-- Input -->
<input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
```
