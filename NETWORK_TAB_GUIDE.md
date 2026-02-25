# 🔍 Network Tab Investigation Guide

**Use this to find where claims are stored in the upload API response**

---

## 📋 **What You Need to Do**

1. **Open browser DevTools** (F12 or right-click → Inspect)
2. **Go to Network tab**
3. **Clear existing requests** (trash icon)
4. **Upload a file** in the app
5. **Find `/api/upload` request** (should be near bottom)
6. **Click on it**
7. **Go to Response tab**
8. **Look for the claims array**

---

## 🎯 **What We're Looking For**

We need to find where this array is located:

```javascript
{
  // Somewhere in the response is:
  claims: [
    {
      claim_id: "CWND-001181",
      provider_id: "P91005", 
      service_date: "2025-01-15",
      cpt_hcpcs: "99213",
      billed_amount: "100.00",
      // ... more fields
    },
    // ... 2319 more claims
  ]
}
```

---

## 🔎 **Possible Locations to Check**

The claims array could be at any of these paths:

```javascript
// Option 1: Top level
response.claims                      ← Check this first

// Option 2: Under detection
response.detection.allClaims
response.detection.claims

// Option 3: Under parseResult  
response.parseResult.claims
response.parseResult.data.claims
response.parseResult.allClaims

// Option 4: Under data
response.data.claims
response.data.allClaims

// Option 5: Under qualityReport
response.qualityReport.claims
response.qualityReport.allClaims

// Option 6: Nested deeper
response.detection.results.claims
response.parseResult.data.detection.claims
```

---

## 📸 **What to Screenshot**

**Take a screenshot showing:**
1. The full JSON structure of the response
2. Where you find the claims array
3. How many items are in it (should be 2320+)

**Example of what to look for:**

```json
{
  "success": true,
  "fileName": "FWA_Demo.xlsx",
  "detection": {
    "leads": [...],
    "allClaims": [...]  ← FOUND IT! This is what we need
  }
}
```

---

## ✅ **Once You Find It**

**Tell new Claude:**

> "I found claims at: `response.detection.allClaims` (or whatever path you found). Now update handleViewDetails in page.tsx to use this path."

**Then Claude will update:**
```typescript
// In src/app/page.tsx
const allClaims = data.detection.allClaims || [];  // ← Using your discovered path
```

---

## 🚫 **Common Pitfalls**

**Don't confuse these:**
- `claims` (individual claim records) ✅ - What we need
- `claimCount` (just a number) ❌ - Not what we need  
- `leads` (provider summaries) ❌ - Not what we need
- `detection.leads` (provider analysis) ❌ - Not what we need

**We specifically need the raw claim records array with 2000+ items.**

---

## 🔄 **Alternative: Check Server Logs**

If the Network tab is unclear, check terminal where `npm run dev` is running:

```bash
# Look for lines like:
POST /api/upload 200 in 805ms

# Then add console.log to the upload API to see structure
```

---

## 💡 **Quick Test Once Fixed**

After updating the path, run in browser console:

```javascript
// Should now show 2320+ instead of 0
const data = JSON.parse(sessionStorage.getItem('fwa_results'));
console.log('Claims stored:', data.allClaims?.length);
```

---

**Use this guide to complete Step 1 in QUICK_START_CLAIMS.md**
