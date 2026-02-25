# OUTSTANDING ISSUES - Quick Reference
**Last Updated:** February 7, 2026  
**System Status:** WORKING with known limitations

---

## 🚨 CRITICAL (Affects User Experience)

### **1. Email Notifications Not Delivering**
- **Status:** TIMEOUT after 5s
- **Impact:** Patients/providers not receiving confirmation emails
- **Root Cause:** Gmail SMTP unreliable, no production email service
- **Workaround:** Bookings complete successfully, emails fail gracefully
- **Fix:** Migrate to SendGrid or AWS SES
- **Priority:** HIGH
- **Effort:** 4 hours
- **File:** `backend/services/NotificationService.js`

```javascript
// Current (times out):
await this.emailTransporter.sendMail({...})

// Target (AWS SES):
await ses.sendEmail({...}).promise()
```

---

## ⚠️ HIGH PRIORITY (Technical Debt)

### **2. Notification Architecture Blocking**
- **Status:** Notifications run synchronously in booking endpoint
- **Impact:** 5-second delay on every booking (timeout wrapper)
- **Root Cause:** No background job queue
- **Fix:** Implement Bull/BullMQ with Redis
- **Priority:** HIGH
- **Effort:** 1-2 days
- **Files:** `backend/routes/bookings.js`, `backend/services/NotificationService.js`

**Proposed Architecture:**
```javascript
// routes/bookings.js
await booking.save();

// Emit event to job queue (non-blocking)
await jobQueue.add('send-booking-notification', {
  bookingId: booking._id,
  type: bookingType
});

return res.status(201).json({ success: true, booking });
```

---

### **3. Pre-Save Hook Disabled**
- **Status:** COMMENTED OUT (lines 504-525)
- **Impact:** Platform fees not auto-calculated, version not incrementing
- **Root Cause:** Caused hangs during debugging, never re-enabled properly
- **Fix:** Re-enable with error handling, remove booking number generation
- **Priority:** MEDIUM
- **Effort:** 1 hour
- **File:** `backend/models/Booking.js`

```javascript
// Re-enable this:
bookingSchema.pre('save', async function(next) {
  // Remove this - now done in routes:
  // if (!this.bookingNumber) {
  //   await this.generateBookingNumber();
  // }
  
  // Keep this:
  if (this.payment?.totalAmount) {
    this.calculatePlatformFee();
  }
  
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 0) + 1;
  }
  
  next();
});
```

---

### **4. Console.log Syntax Errors (Project-Wide)**
- **Status:** PARTIALLY FIXED
- **Impact:** Silent failures when errors are logged
- **Root Cause:** Template literals without parentheses
- **Fix:** Project-wide search and replace
- **Priority:** MEDIUM
- **Effort:** 2 hours
- **Files:** Multiple

**Search Command:**
```bash
grep -r 'console\.log`' backend/ --include="*.js" | grep -v node_modules
grep -r 'console\.error`' backend/ --include="*.js" | grep -v node_modules
grep -r 'console\.warn`' backend/ --include="*.js" | grep -v node_modules
```

**Fix:**
```javascript
// Wrong:
console.log`message ${var}`)

// Correct:
console.log(`message ${var}`)
```

---

## 📋 MEDIUM PRIORITY (Code Quality)

### **5. Diagnostic Code Not Cleaned Up**
- **Status:** Partially removed, remnants remain
- **Impact:** Code readability, maintenance confusion
- **Files:** `routes/bookings.js`
- **Lines:** Search for "REPLACED WITH DIAGNOSTIC CODE"
- **Priority:** LOW-MEDIUM
- **Effort:** 30 minutes

**To Remove:**
```javascript
// Line ~490
// REPLACED WITH DIAGNOSTIC CODE - SEE BELOW

// Simplify timeout wrapper back to simple save:
await booking.save({ validateBeforeSave: false });
```

---

### **6. Schema Index Warning**
- **Status:** COSMETIC (doesn't affect functionality)
- **Impact:** Noisy logs
- **Message:** `Duplicate schema index on {"serviceDescriptionHash":1}`
- **Root Cause:** Index defined in both schema and manually
- **Fix:** Remove one definition
- **Priority:** LOW
- **Effort:** 15 minutes

**Debug Command:**
```bash
grep -n "serviceDescriptionHash" backend/models/*.js
```

---

### **7. Push Notifications Not Implemented**
- **Status:** PLACEHOLDER CODE ONLY
- **Impact:** No mobile push notifications
- **Root Cause:** Firebase Admin SDK not configured
- **Fix:** Integrate Firebase Cloud Messaging
- **Priority:** MEDIUM
- **Effort:** 4-6 hours
- **File:** `backend/services/NotificationService.js`

**Required:**
1. Firebase project setup
2. Add Firebase Admin SDK
3. Store FCM tokens on user registration
4. Implement `sendPush()` method

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async sendPush(fcmToken, template, data) {
  const config = this.getPushConfig(template, data);
  
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: config.title,
      body: config.body
    },
    data: {
      bookingId: data.bookingId,
      type: template
    }
  });
}
```

---

## 🔍 LOW PRIORITY (Nice to Have)

### **8. Calendar Token Refresh Verbose Logging**
- **Status:** INFO level logs in production
- **Impact:** Log noise
- **Fix:** Move to DEBUG level
- **Priority:** LOW
- **Effort:** 10 minutes
- **File:** `backend/services/calendarSync.js`

---

### **9. Error Messages Not User-Friendly**
- **Status:** Generic "Something went wrong" on mobile
- **Impact:** Poor user experience
- **Fix:** Return specific, actionable error messages
- **Priority:** LOW-MEDIUM
- **Effort:** 2-3 hours
- **File:** `backend/routes/bookings.js`

**Example:**
```javascript
// Current:
res.status(500).json({ error: 'Failed to create booking' });

// Better:
res.status(500).json({ 
  error: 'Unable to process payment',
  message: 'Your card was declined. Please try a different payment method.',
  code: 'PAYMENT_DECLINED'
});
```

---

### **10. No Rate Limiting**
- **Status:** MISSING
- **Impact:** Vulnerability to abuse/DOS
- **Fix:** Add express-rate-limit middleware
- **Priority:** MEDIUM (before public launch)
- **Effort:** 1 hour

```javascript
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 bookings per 15 minutes per IP
  message: 'Too many booking attempts, please try again later'
});

router.post('/', bookingLimiter, async (req, res) => {
  // ...
});
```

---

## 📊 TRACKING

### **Issue Summary**
| Priority | Count | Total Effort |
|----------|-------|--------------|
| Critical | 1 | 4 hours |
| High | 3 | 3-4 days |
| Medium | 5 | 1 day |
| Low | 3 | 4 hours |
| **TOTAL** | **12** | **5-6 days** |

### **Sprint Planning**
**Sprint 1 (Post-Demo, Pre-AWS):**
- Email delivery (SES) - 4 hours
- Pre-save hook re-enable - 1 hour
- Console.log audit - 2 hours
- Cleanup diagnostic code - 30 min
- **Total:** 1 day

**Sprint 2 (AWS Migration):**
- Background job queue - 2 days
- Push notifications - 1 day
- Rate limiting - 4 hours
- **Total:** 3-4 days

**Sprint 3 (Polish):**
- Error messages - 3 hours
- Schema index warning - 15 min
- Logging levels - 10 min
- **Total:** 4 hours

---

## 🎯 RECOMMENDED SEQUENCE

1. **Email Delivery** (blocks user experience)
2. **Background Jobs** (architectural improvement)
3. **Pre-Save Hook** (data integrity)
4. **Console.log Audit** (reliability)
5. **Push Notifications** (user engagement)
6. **Rate Limiting** (security)
7. **Error Messages** (UX)
8. **Cleanup Tasks** (tech debt)

---

## 🔗 RELATED DOCUMENTATION

- `SESSION_SUMMARY_FEB_7_2026.md` - Full debugging session details
- `AWS_MIGRATION_PLAN.md` - Infrastructure migration guide
- `FINDR_HEALTH_ECOSYSTEM_v28.md` - Overall architecture
- `IMPLEMENTATION_STATUS.md` - Payment system details

---

**Last Review:** February 7, 2026  
**Next Review:** Post-demo (after AWS migration planning)
