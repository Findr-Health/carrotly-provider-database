# Findr Health - Complete Project Status & Context

**Date:** December 12, 2025  
**Project:** Findr Health Provider Platform (formerly Carrotly)  
**Status:** Active Development - Admin Dashboard Save Feature Troubleshooting

---

## 📋 PROJECT OVERVIEW

### Three Main Applications

#### 1. **Provider MVP (Onboarding Flow)**
- **Location:** `~/Desktop/carrotly-provider-mvp/`
- **Production URL:** https://carrotly-provider-mvp.vercel.app/onboarding
- **GitHub:** https://github.com/Findr-Health/carrotly-provider-mvp
- **Purpose:** New provider onboarding flow (10 steps)
- **Status:** ✅ Deployed and working

#### 2. **Provider Dashboard**
- **Location:** `~/Desktop/carrotly-provider-database/provider-dashboard/`
- **Purpose:** Provider portal for managing appointments, services, etc.
- **Status:** ⚠️ In development (not focus of current session)

#### 3. **Admin Dashboard**
- **Location:** `~/Desktop/carrotly-provider-database/admin-dashboard/`
- **Purpose:** Admin interface to review/approve providers
- **Status:** 🔴 Save functionality broken (current issue)

---

## 🎨 BRANDING & DESIGN

### Brand Identity
- **Name:** Findr Health (rebranded from Carrotly)
- **Primary Color:** Teal (#17DDC0)
- **Font:** Urbanist (weights: 300-800)

### Logo Assets
- **Full Logo:** `/findr-logo.svg` (icon + "findr" text) - 2,992 bytes
- **Icon Only:** `/findr-icon.svg` (just the icon) - 1,148 bytes
- **Source:** `/mnt/user-data/uploads/Findr_logo_4.svg`

### Logo Implementation Status
✅ **Provider MVP:**
- SearchBusiness.tsx: Full logo
- EditProfile.tsx: Full logo (h-40 / 160px)
- CompleteProfile.tsx: Large logo (FindrLogo size="lg")
- FindrLogo.tsx: Fixed syntax errors, added xl size

✅ **Provider Dashboard:** Branding complete

✅ **Admin Dashboard:** Branding complete

---

## 🔧 BACKEND INFRASTRUCTURE

### Current Setup
- **Hosting:** Railway (PostgreSQL database)
- **API Base URL:** https://fearless-achievement-production.up.railway.app/api
- **Database:** PostgreSQL (not MongoDB!)
- **Port:** 3001 (when running locally)

### Environment Configuration
**File:** `~/Desktop/carrotly-provider-database/backend/.env`

```bash
NODE_ENV=production
PORT=3001

# PostgreSQL on Railway
DATABASE_URL=postgresql://postgres:eALwjVPaEfNqubuyiOIMqcDnfeFVEYkc@yamabiko.proxy.rlwy.net:50543/railway

# JWT
JWT_SECRET=2e6a4f8305db4997ff4e79941b0fe5399924fdc095f84a26141787ea676aa133

# Cloudinary
CLOUDINARY_CLOUD_NAME=wetherillt
CLOUDINARY_API_KEY=421367498417262
CLOUDINARY_API_SECRET=2EBI-ffE3lrdK6Lz4JQZfWpAPdI

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyBOajlUsR1c3rXuUPsWTPGldWENuicRxtU

# Resend Email
RESEND_API_KEY=re_eKz6LipP_HQEtVqze5tcjq7ge5t8huWMX

# Stripe
STRIPE_SECRET_KEY=sk_test_51SVHOHRoHR2gRYs6x3gsp1zeaL0eBXUY2e7SGPznBh2HV9U3O3oCqfIf5ztZePHW3e73dWH0sh5QyUZrtKmhkK0G00iKk2wMtD
STRIPE_PUBLISHABLE_KEY=pk_test_51SVHOHRoHR2gRYs6HOGr2sYNqVtq2PJMesd92yOZBMBBoCrIiZRu19o338xwTunj8pp9wjyolhJ5Msm8wOTgUQBL00ucNYWN5u
```

### Key Backend Files
- **Main:** `backend/server.js`
- **Routes:** `backend/routes/admin.js`
- **API Config:** `admin-dashboard/src/utils/api.js`

---

## 🎯 CURRENT SESSION WORK

### Part 1: Logo Size Fixes (COMPLETED ✅)

**Problem:** Logos too small on production

**Files Modified:**
1. `carrotly-provider-mvp/src/pages/onboarding/SearchBusiness.tsx`
   - Changed from `findr-icon.svg` to `findr-logo.svg`

2. `carrotly-provider-mvp/src/pages/onboarding/EditProfile.tsx`
   - Line 136-150: Replaced inline SVG with full logo image
   - Size: `h-40` (160px)

3. `carrotly-provider-mvp/src/pages/onboarding/CompleteProfile.tsx`
   - Line 369: Changed `FindrLogo size="sm"` to `size="lg"`

4. `carrotly-provider-mvp/src/components/branding/FindrLogo.tsx`
   - **CRITICAL FIX:** Fixed syntax error `className=\`...` → `className={\`...`}
   - Fixed missing comma after `lg: 'h-24'`
   - Added `xl: 'h-40'` size option

**Result:** ✅ All logo fixes deployed to Vercel production

---

### Part 2: Admin Dashboard Features (PARTIALLY COMPLETE ⚠️)

#### Feature 1: Export Provider Data (COMPLETED ✅)

**File:** `admin-dashboard/src/components/ProviderDetail.jsx`

**Added `handleExport` function (after line 82):**
```javascript
const handleExport = () => {
  const exportData = {
    provider: {
      id: provider._id,
      practiceName: provider.practiceName,
      providerTypes: provider.providerTypes,
      status: provider.status,
      contactInfo: provider.contactInfo,
      address: provider.address,
      createdAt: provider.createdAt
    },
    services: provider.services || [],
    exportDate: new Date().toISOString(),
    exportVersion: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `provider-${provider.practiceName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

**Export button added (~line 152):**
```jsx
<button onClick={handleExport} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
  📥 Export
</button>
```

**Export Data Format:**
- Filename: `provider-{practice-name}-{YYYY-MM-DD}.json`
- Contains: provider info, services array, export metadata

**Status:** ✅ Working - successfully downloads JSON

---

#### Feature 2: Save Provider Edits (BROKEN 🔴)

**Current Error:** `Failed to save: Request failed with status code 404`

**What We've Done:**

1. **Fixed API Configuration** (`admin-dashboard/src/utils/api.js`):
   - Removed duplicate `providersAPI` definitions
   - Added `update` method:
   ```javascript
   export const providersAPI = {
     getAll: (params) => api.get('/admin/providers', { params }),
     getById: (id) => api.get(`/admin/providers/${id}`),
     update: (id, data) => api.put(`/admin/providers/${id}`, data),  // ADDED
     updateStatus: (id, status) => api.patch(`/admin/providers/${id}/status`, { status }),
   };
   ```

2. **Removed Duplicate Backend Route** (`backend/routes/admin.js`):
   - **Deleted lines 200-234** (first `PUT /providers/:id` route)
   - Kept second route at ~line 277 (after line deletion)
   - Pushed to Railway GitHub repository

3. **Verified Edit Mode Works** (`ProviderDetail.jsx` lines 40-50):
   - Edit button toggles `isEditing` state
   - Form fields become editable
   - Save/Cancel buttons appear

**What's NOT Working:**
- Clicking "Save Changes" returns 404
- Route may not exist on deployed Railway backend
- OR route path doesn't match API call

---

## 🔴 CURRENT PROBLEM: Save Returns 404

### Symptoms
- Admin can enter edit mode ✅
- Admin can modify provider details ✅
- Click "Save Changes" → Error: `Failed to save: Request failed with status code 404`

### Possible Causes

1. **Railway didn't redeploy after push**
   - Git push completed but Railway may not have rebuilt
   - Route deletion didn't take effect

2. **Route path mismatch**
   - Frontend calls: `PUT /api/admin/providers/{id}`
   - Backend route: `PUT /providers/:id` (under `/admin` router)
   - Path may not be mounting correctly

3. **Wrong route was deleted**
   - We deleted lines 200-234
   - But there was supposed to be a second route at ~line 277
   - Need to verify second route still exists after deletion

4. **Authentication issue**
   - Route requires `verifyToken` middleware
   - Token may not be sent correctly
   - Would typically return 401, not 404, but worth checking

---

## 📁 KEY FILES REFERENCE

### Admin Dashboard
```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── ProviderDetail.jsx    # Edit/Save/Export functionality
│   ├── utils/
│   │   └── api.js                # API configuration & endpoints
│   └── pages/
│       └── ProviderDetail.jsx    # Main provider detail page
```

### Backend
```
backend/
├── routes/
│   └── admin.js                  # Admin routes (PROBLEM FILE)
├── server.js                      # Express server
├── .env                          # Environment variables
└── config/
    └── db.js                     # Database connection
```

### Provider MVP
```
carrotly-provider-mvp/
├── src/
│   ├── pages/onboarding/
│   │   ├── SearchBusiness.tsx    # Logo fixed
│   │   ├── EditProfile.tsx       # Logo fixed (h-40)
│   │   └── CompleteProfile.tsx   # Logo size="lg"
│   └── components/branding/
│       └── FindrLogo.tsx         # Syntax errors fixed
└── public/
    ├── findr-logo.svg            # Full logo
    └── findr-icon.svg            # Icon only
```

---

## 🔍 WHAT NEEDS TO BE INVESTIGATED

### Priority 1: Verify Backend Route Exists
**Task:** Confirm the PUT route still exists in the deployed Railway code

**Steps:**
1. Check Railway deployment logs
2. Verify git commit was pushed successfully
3. View current `routes/admin.js` content on Railway
4. Look for `router.put('/providers/:id'` route
5. Confirm it's still there after line 200-234 deletion

**Expected Route (should exist around former line 277, now ~line 243):**
```javascript
router.put('/providers/:id', verifyToken, async (req, res) => {
  try {
    const updateData = {
      practiceName: req.body.practiceName,
      providerTypes: req.body.providerTypes,
      contactInfo: req.body.contactInfo,
      address: req.body.address,
      services: req.body.services,
      credentials: req.body.credentials,
      insuranceAccepted: req.body.insuranceAccepted,
      languagesSpoken: req.body.languagesSpoken,
      photos: req.body.photos,
      updatedAt: new Date()
    };
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    const provider = await Provider.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    res.json(provider);
  } catch (err) {
    console.error('Update provider error:', err);
    res.status(400).json({ error: err.message });
  }
});
```

---

### Priority 2: Check Network Request
**Task:** Inspect the actual HTTP request being sent

**What to capture from Browser DevTools:**
1. **Request URL** - Full URL including path
2. **Request Method** - Should be PUT
3. **Request Headers** - Especially `Authorization` token
4. **Request Payload** - Data being sent
5. **Response Status** - 404 details
6. **Response Body** - Any error message from server

**Expected:**
- URL: `https://fearless-achievement-production.up.railway.app/api/admin/providers/{mongoId}`
- Method: `PUT`
- Headers: `Authorization: Bearer {jwt_token}`
- Payload: Provider update data

---

### Priority 3: Test Route Manually
**Task:** Hit the API endpoint directly to isolate the problem

**Using curl:**
```bash
# Get auth token first (login)
curl -X POST https://fearless-achievement-production.up.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carrotly.com","password":"admin123"}'

# Use token to test update (replace TOKEN and ID)
curl -X PUT https://fearless-achievement-production.up.railway.app/api/admin/providers/{PROVIDER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"practiceName":"Test Update"}'
```

**What this tells us:**
- If curl works but browser doesn't → Frontend issue
- If curl also returns 404 → Backend route missing
- If curl returns different error → Different problem

---

## 🎯 NEXT STEPS (Ordered by Priority)

### Step 1: Verify Railway Deployment ⚡ URGENT
```bash
cd ~/Desktop/carrotly-provider-database/backend
git log -1  # Check last commit
git status  # Ensure clean working directory
```

Then check Railway:
1. Go to https://railway.app/
2. Find backend project
3. Check "Deployments" tab
4. Verify latest deployment includes the route deletion commit
5. Check deployment logs for errors

---

### Step 2: Inspect Browser Network Request ⚡ URGENT
1. Open Admin Dashboard: http://localhost:5173
2. Open DevTools (F12)
3. Go to **Network** tab
4. Click "Preserve log"
5. Try to save provider changes
6. Click the failed PUT request
7. Screenshot or copy:
   - **Request URL**
   - **Request Headers** (especially Authorization)
   - **Request Payload**
   - **Response** tab

---

### Step 3: Review Backend Routes File
```bash
cd ~/Desktop/carrotly-provider-database/backend

# Show lines around where PUT route should be
cat routes/admin.js | sed -n '240,270p'

# Search for all PUT routes
grep -n "router.put" routes/admin.js

# Count total lines to see how much was deleted
wc -l routes/admin.js
```

**What to look for:**
- Should see ONE `router.put('/providers/:id'` route
- Should be around line 243 (after deletion of lines 200-234)
- Should have `verifyToken` middleware
- Should have complete try-catch block

---

### Step 4: Check Route Mounting in server.js
```bash
cat backend/server.js | grep -A 5 "admin"
```

**Expected:**
```javascript
app.use('/api/admin', adminRoutes);
```

This means routes in `admin.js` are mounted at `/api/admin`, so:
- `router.put('/providers/:id')` becomes `PUT /api/admin/providers/:id`

---

### Step 5: Manual API Test
Use the curl commands from Priority 3 above to test the endpoint directly.

---

### Step 6: If Route is Missing - Restore and Redeploy
If the route was accidentally deleted:

```bash
cd ~/Desktop/carrotly-provider-database/backend

# Restore from backup if it exists
cp routes/admin.js.backup routes/admin.js

# Or manually re-add the route at line ~243
nano routes/admin.js

# Then commit and push
git add routes/admin.js
git commit -m "Fix: Restore PUT /providers/:id route"
git push origin main
```

---

## 📊 TESTING CHECKLIST

After fixing the 404 issue, verify:

### Admin Dashboard - Edit & Save
- [ ] Can open provider detail page
- [ ] Can click "Edit" button
- [ ] Form fields become editable
- [ ] Can modify provider information
- [ ] Click "Save Changes"
- [ ] Success message appears
- [ ] Changes persist after page refresh
- [ ] Changes visible in provider list

### Admin Dashboard - Export
- [ ] Export button visible on all provider detail pages
- [ ] Click export downloads JSON file
- [ ] Filename format: `provider-{name}-{date}.json`
- [ ] JSON contains all provider data
- [ ] JSON is valid and parseable

### Provider MVP - Logos
- [ ] SearchBusiness page shows full logo
- [ ] EditProfile page shows large logo (160px)
- [ ] CompleteProfile page shows large logo
- [ ] All pages use correct logo files
- [ ] Logos display correctly on mobile

---

## 🐛 KNOWN ISSUES

### Issue 1: Save Returns 404 (ACTIVE 🔴)
**Status:** Under investigation  
**Impact:** Critical - blocks admin approval workflow  
**Next Action:** See "Next Steps" above

### Issue 2: MongoDB vs PostgreSQL Confusion (RESOLVED ✅)
**Problem:** Backend code uses Mongoose (MongoDB) but .env has PostgreSQL  
**Solution:** Using Railway hosted backend which has correct MongoDB setup  
**Note:** Local backend cannot run without MongoDB installation

---

## 💡 IMPORTANT NOTES

### Database Architecture
- **Production (Railway):** PostgreSQL database
- **Backend Code:** Uses Mongoose (MongoDB ODM)
- **⚠️ Mismatch:** Code expects MongoDB but Railway uses PostgreSQL
- **Current Solution:** Backend may have been migrated to PostgreSQL or using MongoDB Atlas
- **Recommendation:** Clarify actual production database setup

### Local Development
- **Do NOT run backend locally** - missing MongoDB
- **Always use Railway backend** for admin dashboard testing
- **Provider MVP** can run locally (no backend needed for static pages)

### Git Repositories
- **Provider MVP:** https://github.com/Findr-Health/carrotly-provider-mvp
- **Backend & Dashboards:** Likely separate repo (not specified in conversation)

### Deployment
- **Provider MVP:** Auto-deploys to Vercel on push to main
- **Backend:** Auto-deploys to Railway on push to main
- **Admin Dashboard:** Runs locally (http://localhost:5173)
- **Provider Dashboard:** Runs locally (not actively worked on)

---

## 🎓 LEARNING NOTES

### Route Duplication Issue
**What happened:** Same PUT route defined twice in admin.js (lines 200 and 277)  
**Why it matters:** Express uses first matching route, second never executes  
**How to prevent:** Search for duplicate routes before adding: `grep -n "router.put('/providers/:id'" routes/admin.js`

### 404 vs 401 vs 500
- **404:** Route doesn't exist (path wrong or route missing)
- **401:** Not authenticated (token missing/invalid)
- **500:** Server error (code crash, database issue)

### Testing API Routes
Always test routes manually (curl/Postman) before debugging frontend:
1. Isolates problem to frontend or backend
2. Faster than debugging through UI
3. Shows exact error messages

---

## 📞 CONTACT & CREDENTIALS

### Admin Dashboard Login
- **Email:** admin@carrotly.com
- **Password:** admin123

### Railway Project
- **URL:** https://railway.app/
- **API Base:** https://fearless-achievement-production.up.railway.app/api

### Vercel Project
- **Provider MVP:** https://carrotly-provider-mvp.vercel.app/onboarding

---

## 📝 CONVERSATION TRANSCRIPT

Full conversation archived at:
`/mnt/transcripts/2025-12-12-18-15-14-findr-admin-dashboard-export-save.txt`

---

## 🚀 READY FOR NEXT CONVERSATION

Use this document as context when starting a new conversation to continue troubleshooting the save functionality issue.

**Status Summary:**
- ✅ Logo fixes complete and deployed
- ✅ Export feature working
- 🔴 Save feature returning 404 - needs investigation
- ⚠️ Railway deployment status unknown
- ⚠️ Backend route existence unconfirmed

**Immediate Goal:** Fix admin dashboard save functionality by identifying why PUT request returns 404.
