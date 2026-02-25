# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 8, 2026

---

## 🔴 BUGS TO FIX (Priority)

### Bug 1: Provider Portal - Unsaved Changes Warning After Save
**Status:** 🔴 NEEDS FIX
**Effort:** 30 minutes
**Location:** `~/Desktop/carrotly-provider-mvp/src/pages/EditProfile.tsx`

**Symptom:** 
After clicking "Save Changes" successfully, clicking the back arrow shows "You have unsaved changes. Are you sure you want to leave?" even though changes were saved.

**Root Cause:**
The `hasChanges` state is being re-triggered when:
1. Save completes and data is refreshed from server
2. `useEffect` watching provider data marks form as "changed"

**Fix Strategy:**
```typescript
// Option A: Add a justSavedRef flag
const justSavedRef = useRef(false);

// In handleSave:
justSavedRef.current = true;

// In useEffect that loads provider:
if (justSavedRef.current) {
  justSavedRef.current = false;
  return; // Don't mark as changed
}
```

---

### Bug 2: Admin Dashboard - Badges Not Saving
**Status:** 🔴 NEEDS FIX
**Effort:** 30-45 minutes
**Location:** 
- `~/Desktop/carrotly-provider-database/admin-dashboard/src/components/ProviderDetail.jsx`
- `~/Desktop/carrotly-provider-database/backend/models/Provider.js`

**Symptom:**
"Verified" and "Featured" checkboxes in admin dashboard don't persist after save.

**Investigation Steps:**
1. Check if `verified` and `featured` fields exist in Provider schema
2. Check if admin dashboard sends these fields in the update payload
3. Verify backend accepts and saves these fields

**Likely Fix:**
Add to Provider schema if missing:
```javascript
verified: { type: Boolean, default: false },
featured: { type: Boolean, default: false }
```

---

### Bug 3: User App - Photos Not Showing
**Status:** 🔴 NEEDS FIX  
**Effort:** 15 minutes
**Location:** Database (Medical Test provider)

**Symptom:**
Provider photos don't appear in Flutter app even though they show in admin/provider portal.

**Root Cause:**
Old base64 photos are still stored in database. Flutter correctly filters these out:
```dart
if (url != null && !url.startsWith('data:')) {
  primaryPhoto = url;
}
```

**Fix:**
1. Go to Provider Portal → Edit Profile → Photos
2. Delete all existing (base64) photos
3. Upload new photos (will go to Cloudinary)
4. Save changes

**OR via API:**
```bash
curl -X PUT "https://fearless-achievement-production.up.railway.app/api/providers/6959b75e8b1d9aac97d0b76f" \
  -H "Content-Type: application/json" \
  -d '{"photos": []}'
```
Then upload fresh photos.

---

## ✅ COMPLETED ISSUES

### Issue: Book Button from Category Screen
**Status:** ✅ FIXED (Jan 7, 2026)
**Solution:** Option C - Service ID Lookup after provider loads

### Issue: Hours Not Saving
**Status:** ✅ FIXED (Jan 8, 2026)
**Solution:** 
- Backend: Fixed nested object merging in PUT route
- Provider Portal: Fixed hours format transformation

### Issue: Photos as Base64
**Status:** ✅ FIXED (Jan 8, 2026)
**Solution:** Cloudinary integration for cloud storage

### Issue: Medical Test "dental" Type
**Status:** ✅ FIXED (Jan 8, 2026)
**Solution:** Updated via API to only have "Medical" type

---

## 🟡 P1 - HIGH PRIORITY (Post Bug Fixes)

### Issue: Location Picker Broken
**Status:** ❌ NOT STARTED
**Effort:** 2-3 hours

**Current Problems:**
- "Use current location" shows wrong name
- City search autocomplete not working
- Places API issues

**Files to Check:**
- `lib/presentation/widgets/location_picker.dart`
- `lib/services/location_service.dart`

---

### Issue: Favorites Feature
**Status:** ❌ NOT STARTED
**Effort:** 3-4 hours

**Requirements:**
- Heart icon on provider cards
- Tap to toggle favorite
- Backend storage in User model
- Favorites screen with real data

---

### Issue: Settings Functionality
**Status:** ⏳ PARTIALLY DONE
**Effort:** 2-3 hours remaining

**Completed:**
- ✅ Settings screen UI
- ✅ Change password
- ✅ Delete account
- ✅ Notification preferences (local)
- ✅ About screen

**Remaining:**
- [ ] Biometric login (local_auth)
- [ ] Dark mode toggle
- [ ] Rate app (needs App Store ID)

---

## 🟢 P2 - MEDIUM PRIORITY

### Issue: Provider Dashboard
**Status:** ❌ NOT STARTED
**Effort:** 8-10 hours

**Requirements:**
- Provider-facing view of their profile
- Analytics (bookings, revenue, ratings)
- Simple calendar view
- Different from admin dashboard

---

### Issue: Push Notifications
**Status:** ❌ NOT STARTED
**Effort:** 6-8 hours

**Requirements:**
- Firebase FCM setup
- Backend notification triggers
- Flutter integration
- Notification history screen (UI done, needs backend)

---

## 📋 IMPLEMENTATION ORDER

### Tomorrow Session (Priority)
1. [ ] Bug 1: Provider Portal unsaved changes (30 min)
2. [ ] Bug 2: Admin Dashboard badges (30 min)
3. [ ] Bug 3: Clean up Medical Test photos (15 min)
4. [ ] Final testing across all platforms
5. [ ] TestFlight build

### Future Sessions
6. [ ] Location picker fix
7. [ ] Favorites feature
8. [ ] Provider dashboard
9. [ ] Push notifications

---

## 🔍 DEBUGGING COMMANDS

```bash
# Check Medical Test provider photos
curl -s "https://fearless-achievement-production.up.railway.app/api/providers/6959b75e8b1d9aac97d0b76f" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Photos:', len(d.get('photos',[]))); [print(p.get('url','')[:60]) for p in d.get('photos',[])]"

# Check provider schema
cat ~/Desktop/carrotly-provider-database/backend/models/Provider.js | grep -A2 "verified\|featured"

# Flutter analyze
cd ~/Downloads/Findr_health_APP && flutter analyze

# Test Cloudinary upload
curl -X POST "https://fearless-achievement-production.up.railway.app/api/upload/image" \
  -F "image=@test.jpg"
```

---

*Document Version: 3.0 - Updated Jan 8, 2026*
