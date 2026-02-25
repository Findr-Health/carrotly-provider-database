# Provider Portal - Outstanding Bugs

**Date:** January 4, 2025  
**Component:** Provider Portal (carrotly-provider-mvp)  
**Status:** Deferred - Moving to Flutter development

---

## Bug 1: "Unsaved Changes" Popup Appears After Saving

### Description
When a user makes changes (e.g., adds a team member), clicks "Save Changes" (which succeeds), and then clicks the back arrow to return to the dashboard, a popup appears saying "You have unsaved changes. Are you sure you want to leave?" even though changes were saved successfully.

### Root Cause Analysis
The issue stems from a race condition in React state management:

1. User makes change → `markChanged()` → `hasChanges = true`
2. User clicks Save → `handleSave()` calls `setHasChanges(false)`
3. `updateProvider()` succeeds and returns updated provider data
4. The `useProviderData` hook calls `setProvider(updated)`
5. This triggers the `useEffect([provider])` in EditProfile.tsx
6. The useEffect re-sets all form state values
7. Some state setter may be indirectly triggering `markChanged()` OR the async nature causes `hasChanges` to be read before it's updated

### What We Tried

1. **successMessage check** - Added `&& !successMessage` to handleCancel condition
   - Failed because successMessage clears after 3 seconds

2. **justSavedRef** - Added a React ref `justSavedRef.current = true` after save
   - Failed - popup still appears (ref may not be checked in time or state issue persists)

3. **Various hasChanges debugging** - Confirmed setHasChanges(false) is called in handleSave

### Recommended Next Steps

1. **Add console.log debugging** to trace exactly when `hasChanges` changes:
   ```typescript
   useEffect(() => {
     console.log('hasChanges changed to:', hasChanges);
   }, [hasChanges]);
   ```

2. **Check if useEffect is re-triggering markChanged** - Add logging to see if the provider useEffect runs after save and if any setter calls markChanged

3. **Alternative approach: Don't use hasChanges for navigation guard**
   - Compare current form state to original provider data instead
   - Or use a timestamp-based approach (if saved within last 2 seconds, skip prompt)

4. **Move navigation guard to useEffect with beforeunload**
   ```typescript
   useEffect(() => {
     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
       if (hasChanges && !justSavedRef.current) {
         e.preventDefault();
         e.returnValue = '';
       }
     };
     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [hasChanges]);
   ```

### Files Involved
- `src/pages/EditProfile.tsx` - Lines 167-175 (handleCancel), Lines 218-232 (handleSave)
- `src/hooks/useProviderData.ts` - updateProvider function

---

## Bug 2: Cancellation Policy Changes Not Saving

### Description
When changing the cancellation policy in the Policies tab and clicking Save Changes, the policy selection does not persist. On page refresh, it reverts to the previous value.

### Root Cause Analysis
There's a **schema mismatch** between frontend and backend:

- **Backend Schema** (Provider.js line 154):
  ```javascript
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'standard', 'strict'],
    default: 'standard'
  }
  ```

- **Frontend sends** (after our fix):
  ```javascript
  cancellationPolicy: cancellationTier  // e.g., "standard" or "moderate"
  ```

- **Issue**: Frontend uses "moderate" but backend enum only allows "flexible", "standard", "strict"

### What We Tried

1. Changed from sending object `{tier, allowFeeWaiver}` to string `cancellationTier`
   - Fixed the 500 error but values may not match enum

2. Fixed loading logic to handle string vs object
   ```typescript
   const policy = provider.cancellationPolicy;
   if (typeof policy === 'string') {
     setCancellationTier(policy as 'standard' | 'moderate');
   }
   ```

### Recommended Next Steps

1. **Align enum values** - Either:
   - Update backend to include 'moderate': `enum: ['flexible', 'standard', 'moderate', 'strict']`
   - OR update frontend to use 'flexible'/'standard'/'strict'

2. **Update backend schema** to store full policy object if allowFeeWaiver is needed:
   ```javascript
   cancellationPolicy: {
     tier: { type: String, enum: ['flexible', 'standard', 'moderate', 'strict'] },
     allowFeeWaiver: { type: Boolean, default: true }
   }
   ```

3. **Check backend logs** after attempting to save to confirm if validation error occurs

### Files Involved
- **Backend:** `backend/models/Provider.js` - Line 154 (cancellationPolicy schema)
- **Frontend:** `src/pages/EditProfile.tsx`:
  - Lines 151-157 (loading cancellation policy)
  - Line 214 (saving cancellation policy)
  - Lines 1170-1250 (Policies tab UI)

---

## Completed Today (Working Features)

✅ Team-Service linking UI - Team members can be assigned to specific services  
✅ "All Services" checkbox logic fixed - Optional linking works correctly  
✅ Save Changes working for: Basic Info, Location, Hours, Services, Team Members, Photos, Credentials  
✅ Backend schema updated with serviceIds, variants support  
✅ API endpoints deployed and tested  
✅ useProviderData.ts fetch syntax fixed  
✅ businessHours transform (enabled→isOpen, start→open, end→close)  

---

## Technical Context

### Backend
- **URL:** https://fearless-achievement-production.up.railway.app
- **Database:** MongoDB
- **Key files:** 
  - `backend/models/Provider.js`
  - `backend/routes/providers.js`

### Frontend  
- **Deployment:** Vercel (findrhealth-provider.vercel.app)
- **Framework:** React + TypeScript + Vite
- **Key files:**
  - `src/pages/EditProfile.tsx`
  - `src/hooks/useProviderData.ts`
  - `src/types/index.ts`

### Test Provider
- ID: `6959b75e8b1d9aac97d0b76f`
- Name: "Test Update Only"
