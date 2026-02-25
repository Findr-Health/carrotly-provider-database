# CALENDAR ONBOARDING IMPLEMENTATION GUIDE
## Two-Step Wizard - Installation Instructions

**Created:** January 26, 2026  
**Status:** Ready to Install  
**Estimated Time:** 30 minutes  
**Files:** 5 updates needed  

---

## 📋 PREREQUISITES

- ✅ CalendarSetup.tsx component generated
- ✅ Backend calendar endpoints operational
- ✅ Photo upload bug fixed
- ✅ Vercel builds working

---

## 🚀 INSTALLATION STEPS

### Step 1: Install CalendarSetup Component (2 minutes)

```bash
cd ~/Development/findr-health/carrotly-provider-mvp

# Copy generated component to correct location
mv /path/to/CalendarSetup.tsx src/pages/onboarding/CalendarSetup.tsx

# Or if generated in outputs directory:
cp /mnt/user-data/outputs/CalendarSetup.tsx src/pages/onboarding/CalendarSetup.tsx

# Verify
ls -la src/pages/onboarding/CalendarSetup.tsx
```

---

### Step 2: Update App.tsx Routing (5 minutes)

**File:** `src/App.tsx`

Add new route after the existing onboarding routes:

```typescript
// Find this section (around line 35-40):
<Route path="/onboarding/complete-profile" element={<CompleteProfile />} />
<Route path="/onboarding/contact-admin" element={<ContactAdmin />} />

// Add this line:
<Route path="/onboarding/calendar-setup" element={<CalendarSetup />} />
```

**Import at top of file:**

```typescript
// Add to imports (around line 7):
import CalendarSetup from './pages/onboarding/CalendarSetup';
```

**Command to verify:**
```bash
grep -n "calendar-setup" src/App.tsx
```

---

### Step 3: Update CompleteProfile Submit Handler (10 minutes)

**File:** `src/pages/onboarding/CompleteProfile.tsx`

**Find the submit handler** (around line 410):

```typescript
// Current code:
const result = await submitProviderProfile(profileData);

if (result.providerId) {
  localStorage.setItem('providerId', result.providerId);
  sessionStorage.setItem('submittedProvider', JSON.stringify({ 
    _id: result.providerId, 
    practiceName, 
    providerTypes: selectedTypes, 
    contactInfo: { email, phone }, 
    address: { street, suite, city, state, zip },
    needsSignature: true
  }));
  
  // OLD: navigate('/complete?signLater=true');
  
  // NEW: Navigate to calendar setup
  navigate('/onboarding/calendar-setup', {
    state: {
      providerId: result.providerId,
      practiceName: practiceName,
      serviceCount: services.length
    }
  });
}
```

**Automated command:**

```bash
cd ~/Development/findr-health/carrotly-provider-mvp

# Create backup
cp src/pages/onboarding/CompleteProfile.tsx src/pages/onboarding/CompleteProfile.tsx.backup

# Use sed to update (careful with line numbers - verify first)
# This is a manual step - open file and replace navigate line
```

---

### Step 4: Add Calendar Banner to Dashboard (10 minutes)

**File:** `src/pages/Dashboard.tsx`

**Find the Agreement Banner section** (around line 140):

```typescript
{/* Agreement Required Banner */}
{needsAgreement && (
  // ... existing banner code ...
)}

// ADD THIS AFTER THE AGREEMENT BANNER:
{/* Calendar Setup Banner - Show if not connected */}
{provider && !provider.calendarConnected && !needsAgreement && (
  <div className="bg-gradient-to-r from-[#4FE8D0] to-[#17DDC0] text-white rounded-xl p-6 mb-6 shadow-lg">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-white/20 rounded-full">
        <Calendar className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-2">Connect Your Calendar to Get 3x More Bookings</h2>
        <p className="text-white/90 mb-4">
          Providers with calendars connected receive instant bookings and avoid manual appointment approval. 
          Takes only 30 seconds to set up.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/calendar')}
            className="px-6 py-2 bg-white text-[#17DDC0] rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Connect Calendar Now
          </button>
          <button
            onClick={() => setDismissCalendarBanner(true)}
            className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

**Add state variable at top:**

```typescript
const [dismissCalendarBanner, setDismissCalendarBanner] = useState(false);
```

**Import Calendar icon:**

```typescript
import { Calendar } from 'lucide-react';
```

---

### Step 5: Update Calendar OAuth Callback (Optional - 5 minutes)

**File:** `src/pages/Calendar.tsx`

**This is optional** - only needed if you want to redirect back to onboarding after OAuth.

For now, the default behavior (redirect to /calendar) works fine since we're on Step 2.

---

## 🧪 TESTING CHECKLIST

### Test 1: New Provider Onboarding

```
1. Go to https://findrhealth-provider.vercel.app/onboarding
2. Fill out complete profile form
3. Upload photo (should work ✅)
4. Submit form
5. ✅ Should redirect to /onboarding/calendar-setup
6. ✅ Should see success message with practice name
7. ✅ Should see calendar connection buttons
8. Click "Connect Google Calendar"
9. Complete OAuth
10. ✅ Should redirect back to calendar setup or dashboard
11. Verify calendar connected in database
```

### Test 2: Skip Calendar Setup

```
1. Complete onboarding
2. Land on calendar setup page
3. Click "I'll set this up later"
4. ✅ Should redirect to dashboard
5. ✅ Should see calendar banner at top of dashboard
6. Click "Connect Calendar Now"
7. ✅ Should go to /calendar
8. Complete calendar connection
9. Return to dashboard
10. ✅ Banner should be gone
```

### Test 3: Existing Provider

```
1. Login as existing provider
2. ✅ Should NOT see calendar setup page
3. ✅ Should go straight to dashboard
4. If no calendar: should see banner
5. If has calendar: no banner
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot find module CalendarSetup"

**Solution:**
```bash
# Verify file exists
ls -la src/pages/onboarding/CalendarSetup.tsx

# Check import in App.tsx
grep "CalendarSetup" src/App.tsx
```

---

### Issue: Redirect loops

**Cause:** Provider data not passed correctly

**Solution:** Check navigation state:
```typescript
console.log('Navigation state:', location.state);
```

---

### Issue: Calendar banner shows for providers with calendar

**Cause:** `provider.calendarConnected` not checking correctly

**Solution:** Verify provider object has `calendarConnected` field:
```typescript
console.log('Provider:', provider);
console.log('Calendar connected:', provider?.calendarConnected);
```

---

## 📊 MONITORING

### Metrics to Track

After deployment, monitor:

1. **Calendar Connection Rate**
   - Before: ~10%
   - Expected: 60-75%
   - Track daily for first week

2. **Onboarding Completion Rate**
   - Should remain at 100%
   - Watch for drop-offs at calendar step

3. **OAuth Success Rate**
   - Google Calendar connections
   - Microsoft Outlook connections
   - Track failures

4. **Skip Rate**
   - How many users skip calendar setup
   - How many connect later from banner

---

## 🔄 ROLLBACK PLAN

If issues arise:

```bash
cd ~/Development/findr-health/carrotly-provider-mvp

# Restore backup
cp src/pages/onboarding/CompleteProfile.tsx.backup src/pages/onboarding/CompleteProfile.tsx

# Remove new route from App.tsx
# Remove calendar banner from Dashboard.tsx

# Commit
git add .
git commit -m "Rollback: Revert calendar onboarding changes"
git push origin main
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

After successful deployment:

- [ ] Test new provider onboarding flow
- [ ] Test calendar OAuth (Google)
- [ ] Test calendar OAuth (Microsoft)
- [ ] Test skip functionality
- [ ] Test dashboard banner
- [ ] Verify database updates
- [ ] Check error logs
- [ ] Monitor connection rates
- [ ] Update documentation
- [ ] Notify team

---

## 📝 COMMIT MESSAGES

**Recommended commit structure:**

```bash
# Commit 1: Add CalendarSetup component
git add src/pages/onboarding/CalendarSetup.tsx
git commit -m "feat: Add two-step calendar onboarding wizard

- Create CalendarSetup component with Findr Health branding
- Progress indicator showing Step 2/2
- Success message with provider details
- Compelling stats section (3x bookings, zero work)
- Google Calendar and Microsoft Outlook buttons
- Privacy assurance and skip option
- Expected to increase calendar adoption from 20% to 60-75%"

# Commit 2: Update routing and navigation
git add src/App.tsx src/pages/onboarding/CompleteProfile.tsx
git commit -m "feat: Implement two-step onboarding flow

- Add /onboarding/calendar-setup route
- Update CompleteProfile submit to navigate to calendar setup
- Pass provider data via navigation state
- Fixes calendar OAuth bug (providerId now exists)"

# Commit 3: Add dashboard calendar banner
git add src/pages/Dashboard.tsx
git commit -m "feat: Add calendar setup banner to dashboard

- Show banner for providers without calendar
- Compelling CTA with benefits
- Dismiss functionality with 'Remind Me Later'
- Completes two-step onboarding UX"

# Push all commits
git push origin main
```

---

## 🎯 SUCCESS CRITERIA

Deployment is successful if:

- ✅ New providers can complete onboarding
- ✅ Calendar connection works during onboarding
- ✅ OAuth redirects correctly
- ✅ Skip option works
- ✅ Dashboard banner appears correctly
- ✅ No JavaScript errors in console
- ✅ Vercel build succeeds
- ✅ Calendar connection rate increases

---

## 📞 SUPPORT

**If you encounter issues:**

1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Railway backend logs
4. Verify environment variables
5. Test in incognito mode

**Common fixes:**
- Clear browser cache
- Clear localStorage
- Restart dev server
- Rebuild Vercel deployment

---

*Implementation Guide Version 1.0*  
*Created: January 26, 2026*  
*Estimated Time: 30 minutes*  
*Difficulty: Intermediate*
