# Fix Findr Logo in Provider Onboarding Header

## Problem
The header is currently showing just the icon symbol with separate text, but should show the full integrated Findr logo (text + icon together).

## Solution
Update the header component to use the full logo instead of just the icon.

---

## Find and Replace in Your Code

**Location:** `src/components/onboarding/` or `src/components/common/` folder

**Look for a file like:**
- `Header.tsx`
- `OnboardingHeader.tsx`
- `Layout.tsx`
- Or in `OnboardingWizard.tsx` (the main onboarding page)

---

## Current Code (WRONG)
The header probably looks something like this:

```tsx
<header>
  <div className="flex items-center">
    <img src="/findr-icon.svg" alt="Findr" className="w-12 h-12" />
    <div>
      <div>findr™</div>
      <div>Provider Onboarding</div>
    </div>
  </div>
</header>
```

---

## Fixed Code (CORRECT)
Should look like this:

```tsx
<header className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex flex-col items-center space-y-2">
      {/* Full Findr Logo (text + icon + TM) */}
      <img 
        src="/findr-logo.svg" 
        alt="Findr Health" 
        className="h-12 w-auto"
      />
      {/* Subtitle below logo */}
      <p className="text-gray-600 text-sm">Provider Onboarding</p>
    </div>
  </div>
</header>
```

---

## Key Changes

1. **Change image source:**
   - FROM: `src="/findr-icon.svg"`
   - TO: `src="/findr-logo.svg"`

2. **Remove separate text:**
   - DELETE: The separate `findr™` text element
   - KEEP: Only "Provider Onboarding" as subtitle below logo

3. **Adjust sizing:**
   - Logo height: `h-12` or `h-16` (experiment with what looks best)
   - Width: `w-auto` (maintains aspect ratio)

---

## Manual Steps

1. **Find the header component file:**
   ```bash
   cd ~/Desktop/carrotly-provider-mvp
   grep -r "findr-icon.svg" src/
   ```

2. **Open the file shown in results**

3. **Replace the logo image tag:**
   - Change `src="/findr-icon.svg"` to `src="/findr-logo.svg"`
   - Remove any separate "findr™" text elements
   - Keep only "Provider Onboarding" as subtitle

4. **Save the file**

5. **The dev server should auto-reload** (if not, restart it)

---

## Result
You should now see the **full Findr logo** (with "findr" text + icon + TM all together) at the top, with "Provider Onboarding" subtitle below it - matching your Figma design!
