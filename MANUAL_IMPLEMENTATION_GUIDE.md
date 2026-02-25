# FINDR HEALTH - CALENDAR INTEGRATION MANUAL IMPLEMENTATION GUIDE

**Date:** January 31, 2026  
**Status:** Production Ready  
**Estimated Time:** 2-4 hours

---

## 📋 PREREQUISITES CHECKLIST

Before starting, verify you have:

- [ ] Access to your local development machine
- [ ] Backend code cloned locally
- [ ] Node.js installed (`node --version` should work)
- [ ] npm installed (`npm --version` should work)
- [ ] Railway CLI installed (optional but helpful)
- [ ] Google Cloud OAuth credentials configured
- [ ] Microsoft Azure OAuth credentials configured
- [ ] Railway environment variables set

---

## OPTION 1: AUTOMATED IMPLEMENTATION (RECOMMENDED)

### Step 1: Download Implementation Files

```bash
# Navigate to your project root (where backend/ folder is)
cd /path/to/findr-health-mobile

# Copy the implementation script
cp /mnt/user-data/outputs/implement_calendar_integration.py .

# Make it executable
chmod +x implement_calendar_integration.py
```

### Step 2: Run Dry Run (Preview Changes)

```bash
# Preview what will happen without making changes
python3 implement_calendar_integration.py --dry-run
```

### Step 3: Execute Implementation

```bash
# Execute the full implementation
python3 implement_calendar_integration.py
```

### Step 4: Review Output

The script will:
- ✅ Validate prerequisites
- ✅ Backup existing files
- ✅ Update Provider schema
- ✅ Install npm packages
- ✅ Copy calendar files
- ✅ Update server.js
- ✅ Validate environment
- ✅ Generate test scripts

---

## OPTION 2: MANUAL IMPLEMENTATION (STEP-BY-STEP)

### STEP 1: BACKUP CURRENT FILES

```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Backup files that will be modified
cp backend/models/Provider.js backups/$(date +%Y%m%d_%H%M%S)/
cp backend/server.js backups/$(date +%Y%m%d_%H%M%S)/

echo "✅ Backups created"
```

---

### STEP 2: UPDATE PROVIDER SCHEMA

**File:** `backend/models/Provider.js`

**Find this section** (around line 130):

```javascript
teamMembers: [{
  name: { type: String, required: true },
  title: String,
  // ... other fields ...
  calendarConnected: { type: Boolean, default: false },  // ← FIND THIS LINE
  serviceIds: [String]
}]
```

**Replace the `calendarConnected` line with this complete calendar object:**

```javascript
  calendar: {
    provider: { 
      type: String, 
      enum: ['google', 'microsoft', null],
      default: null 
    },
    connected: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    calendarId: String,
    calendarEmail: String,
    syncStatus: {
      type: String,
      enum: ['active', 'error', 'expired', 'disconnected'],
      default: 'disconnected'
    },
    lastSyncAt: Date,
    syncError: String,
    bufferMinutes: { type: Number, default: 15 },
    minNoticeHours: { type: Number, default: 24 },
    maxDaysOut: { type: Number, default: 60 }
  },
```

**Save the file.**

**Verify:**
```bash
# Check if the change was made
grep -A 5 "calendar: {" backend/models/Provider.js

# Should show the new calendar object
```

---

### STEP 3: INSTALL NPM PACKAGES

```bash
cd backend

# Install required packages
npm install googleapis axios

# Verify installation
npm list googleapis axios

# Should show:
# ├── googleapis@X.X.X
# └── axios@X.X.X

cd ..
```

---

### STEP 4: CREATE SERVICES DIRECTORY

```bash
# Create services directory if it doesn't exist
mkdir -p backend/services

# Verify
ls -la backend/services
```

---

### STEP 5: COPY CALENDAR INTEGRATION FILES

```bash
# Copy calendar routes
cp /mnt/user-data/outputs/backend_routes_calendar.js backend/routes/calendar.js

# Copy calendar sync service
cp /mnt/user-data/outputs/backend_services_calendarSync.js backend/services/calendarSync.js

# Copy availability routes
cp /mnt/user-data/outputs/backend_routes_availability.js backend/routes/availability.js

# Verify files were copied
ls -lh backend/routes/calendar.js
ls -lh backend/services/calendarSync.js
ls -lh backend/routes/availability.js

# Should show three files with sizes around 20-30 KB each
```

---

### STEP 6: UPDATE SERVER.JS

**File:** `backend/server.js`

**A. Add route requires** (find where other routes are required):

```javascript
// Find this section:
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
// ... other routes ...

// ADD THESE TWO LINES:
const calendarRoutes = require('./routes/calendar');
const availabilityRoutes = require('./routes/availability');
```

**B. Register routes** (find where other routes are registered):

```javascript
// Find this section:
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
// ... other app.use() calls ...

// ADD THESE TWO LINES:
app.use('/api/calendar', calendarRoutes);
app.use('/api/availability', availabilityRoutes);
```

**Save the file.**

**Verify:**
```bash
# Check if routes were added
grep "calendarRoutes" backend/server.js
grep "availabilityRoutes" backend/server.js

# Both should return matches
```

---

### STEP 7: CONFIGURE REDIRECT URIs

#### A. Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on: **Findr Health Calendar** OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://findr-health-backend-production.up.railway.app/api/calendar/callback/google
   ```
   (Replace with your actual Railway URL)
5. Click **Save**

#### B. Azure Portal

1. Go to: https://portal.azure.com
2. Navigate to: **App registrations** → **Findr Health Calendar**
3. Click: **Authentication** → **Add a platform** → **Web**
4. Add redirect URI:
   ```
   https://findr-health-backend-production.up.railway.app/api/calendar/callback/microsoft
   ```
   (Replace with your actual Railway URL)
5. Click **Configure**

---

### STEP 8: VERIFY RAILWAY ENVIRONMENT VARIABLES

```bash
# Check Railway variables
railway variables

# Verify these exist:
# - GOOGLE_CALENDAR_CLIENT_ID
# - GOOGLE_CALENDAR_CLIENT_SECRET
# - MICROSOFT_CALENDAR_CLIENT_ID
# - MICROSOFT_CALENDAR_CLIENT_SECRET
```

**If any are missing, add them:**

```bash
# Example (replace with your actual values):
railway variables set GOOGLE_CALENDAR_CLIENT_ID="your-client-id.apps.googleusercontent.com"
railway variables set GOOGLE_CALENDAR_CLIENT_SECRET="your-secret"
railway variables set MICROSOFT_CALENDAR_CLIENT_ID="your-app-id"
railway variables set MICROSOFT_CALENDAR_CLIENT_SECRET="your-secret"
```

**Note:** Your screenshot shows these are already set! ✅

---

### STEP 9: UPDATE BOOKING CREATION (CALENDAR EVENT)

**File:** `backend/routes/bookings.js`

**Find the booking creation section** (around line 200-250, after `await booking.save()`):

**Add this code after the booking is saved:**

```javascript
    await booking.save();

    // NEW CODE - Create calendar event if integrated
    if (hasCalendarIntegration && teamMember) {
      try {
        const calendarSync = require('../services/calendarSync');
        const teamMemberDoc = provider.teamMembers.id(teamMember.memberId);
        
        if (teamMemberDoc?.calendar?.connected) {
          const eventId = await calendarSync.createCalendarEvent(
            booking,
            provider,
            teamMemberDoc
          );
          
          if (eventId) {
            booking.calendarEventId = eventId;
            await booking.save();
            console.log(`📅 Calendar event created: ${eventId}`);
          }
        }
      } catch (calendarError) {
        console.error('Calendar event creation failed (non-blocking):', calendarError);
        // Don't fail the booking if calendar event fails
      }
    }

    // Continue with rest of booking logic...
```

**Save the file.**

---

### STEP 10: COMMIT AND DEPLOY

```bash
# Check what changed
git status

# Should show:
# - backend/models/Provider.js (modified)
# - backend/routes/calendar.js (new)
# - backend/services/calendarSync.js (new)
# - backend/routes/availability.js (new)
# - backend/routes/bookings.js (modified)
# - backend/server.js (modified)
# - backend/package.json (modified)
# - backend/package-lock.json (modified)

# Stage changes
git add backend/

# Commit
git commit -m "feat: add calendar integration (Google + Microsoft OAuth)

- Updated Provider schema with team member calendar object
- Added OAuth routes for Google and Microsoft
- Added calendar sync service with HIPAA-compliant event creation
- Added availability API endpoints
- Integrated calendar event creation into booking flow
- Installed googleapis and axios packages"

# Push to Railway (auto-deploys)
git push origin main

# Monitor deployment
railway logs --tail
```

---

## STEP 11: TESTING

### A. Test OAuth Endpoints

```bash
# Get your Railway URL
RAILWAY_URL=$(railway variables get APP_URL)

# Test calendar status endpoint
curl "$RAILWAY_URL/api/calendar/status/PROVIDER_ID/MEMBER_ID"

# Should return:
# {"success": true, "connected": false, ...}
```

### B. Test OAuth Flow (Manual)

1. Get a provider ID and team member ID from your database:
   ```bash
   railway run mongosh --eval "use railway; db.providers.findOne({}, {_id:1, 'teamMembers._id':1})"
   ```

2. Initiate OAuth:
   ```bash
   curl -X POST "$RAILWAY_URL/api/calendar/connect" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "google",
       "providerId": "YOUR_PROVIDER_ID",
       "teamMemberId": "YOUR_TEAM_MEMBER_ID"
     }'
   ```

3. Copy the `authUrl` from response and open in browser

4. Authorize with Google

5. Should redirect back to your provider portal

6. Check database:
   ```bash
   railway run mongosh --eval "use railway; db.providers.findOne({'teamMembers._id': ObjectId('MEMBER_ID')}, {'teamMembers.$': 1})"
   ```
   
   Should show `calendar.connected: true` and tokens!

### C. Test Availability API

```bash
# Test availability endpoint
curl "$RAILWAY_URL/api/availability/PROVIDER_ID?date=2026-02-01&duration=60"

# Should return available time slots
```

### D. Test Full Booking Flow

1. Create a test booking via mobile app
2. Check if calendar event was created
3. Look in provider's Google Calendar
4. Should see: "Healthcare Appointment" event

---

## STEP 12: MOBILE APP INTEGRATION

### Update DateTime Selection Screen

**File:** `lib/presentation/screens/booking/datetime_selection_screen.dart`

**Replace the `_loadAvailableSlots()` method** (around line 51):

```dart
Future<void> _loadAvailableSlots() async {
  setState(() => _isLoading = true);
  
  try {
    final apiService = ref.read(apiServiceProvider);
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final duration = widget.selectedVariant?.durationMinutes ?? 
                     widget.selectedService.durationMinutes;
    
    final response = await apiService.get(
      '/availability/${widget.provider.id}',
      queryParameters: {
        'date': dateStr,
        'duration': duration.toString(),
        if (widget.selectedTeamMember != null)
          'memberId': widget.selectedTeamMember!.id,
      },
    );
    
    if (response.statusCode == 200) {
      final data = response.data;
      List<String> slots = [];
      
      if (data['mode'] == 'first_available') {
        slots = (data['slots'] as List)
            .map((s) => s['startTime'] as String)
            .toList();
      } else {
        final availability = data['availability'] as List;
        if (availability.isNotEmpty) {
          slots = (availability[0]['slots'] as List)
              .map((s) => s['startTime'] as String)
              .toList();
        }
      }
      
      setState(() {
        _availableSlots = slots;
        _isLoading = false;
      });
    }
  } catch (e) {
    debugPrint('Error loading slots: $e');
    setState(() {
      _availableSlots = [];
      _isLoading = false;
    });
  }
}
```

**Commit mobile changes:**
```bash
git add lib/presentation/screens/booking/datetime_selection_screen.dart
git commit -m "feat: integrate real calendar availability API"
git push origin main
```

---

## ✅ VERIFICATION CHECKLIST

After implementation, verify:

- [ ] Backend deployed successfully (`railway logs` shows no errors)
- [ ] Environment variables are set
- [ ] Redirect URIs configured in Google/Microsoft
- [ ] OAuth flow works (can connect calendar)
- [ ] Tokens saved to database
- [ ] Availability API returns slots
- [ ] Booking creates calendar event
- [ ] Mobile app shows real availability

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'googleapis'"

**Solution:**
```bash
cd backend
npm install googleapis axios
git add package.json package-lock.json
git commit -m "add googleapis and axios dependencies"
git push origin main
```

### Error: "Invalid OAuth client"

**Solution:** Check that:
1. Environment variables match your OAuth credentials
2. Redirect URIs are configured correctly
3. Using the correct client ID (Google Calendar vs regular Google)

### Error: "Calendar event creation failed"

**Solution:** This is non-blocking. Check:
1. Token hasn't expired
2. Provider has connected calendar
3. Railway logs for specific error message

### Availability shows no slots

**Solution:** Check:
1. Provider has business hours set
2. Team member has calendar connected (or manual schedule)
3. Date is within allowed range

---

## 📞 NEED HELP?

If you encounter issues:

1. Check Railway logs: `railway logs --tail`
2. Check browser console (for frontend errors)
3. Verify database: `railway run mongosh`
4. Test API endpoints with curl
5. Review this guide step-by-step

---

## 🎉 SUCCESS!

If all steps completed successfully, you now have:

✅ Full calendar integration (Google + Microsoft)
✅ OAuth authentication working
✅ Real-time availability from calendars
✅ HIPAA-compliant calendar events
✅ Automatic token refresh
✅ Request-based fallback for non-integrated providers

**Next:** Test with real providers and gather feedback!
