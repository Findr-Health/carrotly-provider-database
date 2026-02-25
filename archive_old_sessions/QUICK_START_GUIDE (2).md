# 🚀 QUICK START DEPLOYMENT GUIDE

**Get Your Booking System Running in 3 Hours**

---

## ⚡ IMMEDIATE PRIORITY: PHASE 1

**Goal:** Get request/approval system working TODAY (3 hours)

### **🎯 Step 1: Mobile App (1 hour)**

```bash
cd ~/Development/findr-health/findr-health-mobile

# 1. Add dependencies
# Edit pubspec.yaml, add:
#   web_socket_channel: ^2.4.0
#   firebase_core: ^2.24.2
#   firebase_messaging: ^14.7.10
#   flutter_local_notifications: ^16.3.0

flutter pub get

# 2. Copy 5 new files
cp flutter-booking-updates/lib/presentation/widgets/booking_urgency_indicator.dart \
   lib/presentation/widgets/

cp flutter-booking-updates/lib/presentation/widgets/suggested_times_modal.dart \
   lib/presentation/widgets/

cp flutter-booking-updates/lib/core/services/booking_websocket_service.dart \
   lib/core/services/

cp flutter-booking-updates/lib/providers/booking_realtime_provider.dart \
   lib/providers/

cp flutter-booking-updates/lib/core/services/push_notification_service.dart \
   lib/core/services/

# 3. Modify 3 existing files (see MODIFICATIONS files)

# 4. Test
flutter run
```

**Expected Result:** 
✅ Pending tab appears  
✅ App compiles without errors  
✅ Can create bookings  

---

### **🎯 Step 2: Backend Booking Flow (1 hour)**

```bash
cd ~/Development/findr-health/carrotly-provider-database

# 1. Update booking creation route
# Open backend/routes/bookings.js
# Find the POST / route (line ~100)
# Add this simple check:

const bookingType = provider.calendarConnected ? 'instant' : 'request';
const paymentMode = bookingType === 'request' ? 'hold' : 'prepay';

# 2. Return isRequest flag in response
res.json({
  success: true,
  booking: booking,
  isRequest: bookingType === 'request'
});

# 3. Test
node backend/server.js
```

**Expected Result:**
✅ Backend starts  
✅ Bookings create with isRequest flag  
✅ Mobile app receives correct status  

---

### **🎯 Step 3: Firebase Setup (1 hour)**

**iOS:**
```bash
# 1. Download GoogleService-Info.plist from Firebase
# 2. Add to ios/Runner/ in Xcode
# 3. Update AppDelegate.swift (see mobile INSTALLATION_GUIDE.md)
```

**Android:**
```bash
# 1. Download google-services.json from Firebase
# 2. Place in android/app/
# 3. Update build.gradle files (see mobile INSTALLATION_GUIDE.md)
```

**Expected Result:**
✅ Push notifications work  
✅ Can receive booking updates  

---

## 📅 PHASE 2: CALENDAR INTEGRATION (Next Week)

**Goal:** Add Google & Microsoft calendar verification

### **Step 1: Get API Credentials (30 min)**

**Google Calendar:**
1. Go to https://console.cloud.google.com
2. Create project
3. Enable Google Calendar API
4. Create OAuth credentials
5. Copy Client ID + Secret

**Microsoft Graph:**
1. Go to https://portal.azure.com
2. Create app registration
3. Add Calendar permissions
4. Create client secret
5. Copy IDs

---

### **Step 2: Install Calendar Services (30 min)**

```bash
cd ~/Development/findr-health/carrotly-provider-database

# Install packages
npm install googleapis @microsoft/microsoft-graph-client @azure/identity

# Copy 3 service files
cp backend-calendar-integration/services/GoogleCalendarService.js \
   backend/services/

cp backend-calendar-integration/services/MicrosoftCalendarService.js \
   backend/services/

cp backend-calendar-integration/services/CalendarService.js \
   backend/services/

# Add environment variables to .env
echo "GOOGLE_CLIENT_ID=your_id_here" >> .env
echo "GOOGLE_CLIENT_SECRET=your_secret_here" >> .env
echo "MICROSOFT_CLIENT_ID=your_id_here" >> .env
echo "MICROSOFT_CLIENT_SECRET=your_secret_here" >> .env
```

---

### **Step 3: Update Booking Logic (30 min)**

```bash
# Replace POST / route in backend/routes/bookings.js
# With content from backend-calendar-integration/routes/bookings_updated_create.js

# Key changes:
1. Import CalendarService
2. Check calendar availability before creating booking
3. Set bookingType based on calendar check
4. Return calendarVerification in response
```

---

### **Step 4: Test Calendar Integration (30 min)**

```bash
# 1. Connect provider calendar in provider portal
# 2. Create test booking
# 3. Verify instant confirmation (if calendar free)
# 4. Verify request creation (if calendar busy)
```

**Expected Result:**
✅ 95%+ instant confirmations  
✅ Graceful conflict handling  
✅ Automatic calendar sync  

---

## 📊 TESTING CHECKLIST

### **Phase 1 - Request/Approval System:**

- [ ] Mobile app compiles
- [ ] Pending tab shows
- [ ] Can create booking
- [ ] Booking appears in Pending tab
- [ ] Urgency indicator displays
- [ ] WebSocket connects
- [ ] Push notification received
- [ ] Provider can confirm/decline
- [ ] User gets real-time update
- [ ] Suggested times modal works

### **Phase 2 - Calendar Integration:**

- [ ] Provider can connect Google Calendar
- [ ] Provider can connect Microsoft Outlook
- [ ] Calendar verification runs during booking
- [ ] Instant booking when slot is free
- [ ] Request created when slot is busy
- [ ] Events added to provider calendar
- [ ] Calendar sync works
- [ ] Webhooks receive updates

---

## 🎯 SUCCESS METRICS

**Phase 1 (This Week):**
- ✅ Request/approval system live
- ✅ Zero crashes
- ✅ WebSocket working
- ✅ Push notifications working

**Phase 2 (Next Week):**
- ✅ Calendar integration live
- ✅ >95% instant confirmation rate
- ✅ <500ms calendar verification
- ✅ Zero double bookings

---

## 🆘 QUICK FIXES

### **"Import errors" in Flutter:**
```bash
flutter clean
flutter pub get
```

### **"WebSocket not connecting":**
```dart
// Check backend URL in booking_websocket_service.dart
final wsUrl = 'wss://fearless-achievement-production.up.railway.app/api/bookings/realtime';
```

### **"Push notifications not working":**
1. Check Firebase project configured
2. Verify google-services files added
3. Test on real device (not simulator)

### **"Calendar API errors":**
1. Verify API enabled in console
2. Check credentials in .env
3. Verify redirect URIs match

---

## 📞 NEED HELP?

1. **Check installation guides:**
   - Mobile: `flutter-booking-updates/INSTALLATION_GUIDE.md`
   - Backend: `backend-calendar-integration/INSTALLATION_GUIDE.md`

2. **Review complete summary:**
   - `FINAL_IMPLEMENTATION_SUMMARY.md`

3. **Console logs:**
   - Mobile: Check Xcode/Android Studio console
   - Backend: Check terminal output

---

## ✅ DEPLOYMENT ORDER

**Week 1 - Phase 1:**
1. Monday: Mobile app files
2. Tuesday: Backend booking updates
3. Wednesday: Firebase setup
4. Thursday: Testing
5. Friday: Deploy to production

**Week 2 - Phase 2:**
1. Monday: API credentials
2. Tuesday: Calendar services
3. Wednesday: Booking logic update
4. Thursday: Testing
5. Friday: Deploy calendar integration

---

**🎉 You're ready to build world-class booking! 🚀**

Start with Phase 1 today, then add calendar integration next week when ready.

---

*Last Updated: January 26, 2026*  
*Quick Start Guide v1.0*
