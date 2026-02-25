# QUICK START GUIDE - Next Session
**For:** New conversation or engineer  
**Project:** Findr Health Booking System  
**Last Updated:** February 7, 2026

---

## 🚀 SYSTEM STATUS

**Current State:** ✅ WORKING  
**Last Working Commit:** `dfae73c` (reverted from broken cleanup)  
**Hosting:** Railway  
**Demo:** Ready with known limitations

**Known Issues:**
- ⚠️ Email notifications timeout (non-blocking)
- ⚠️ Push notifications not implemented
- ✅ Bookings complete successfully
- ✅ Payments process correctly
- ✅ Calendar integration working

---

## 📍 YOU ARE HERE

```
Project Timeline:
├── [DONE] 80/20 Payment Split Implementation
├── [DONE] Calendar Integration (Google OAuth)
├── [DONE] Booking Flow (Instant + Request)
├── [DONE] Critical Bug Fix (2-day hang resolved)
├── [IN PROGRESS] Code Cleanup & Refactoring
└── [NEXT] AWS Migration Planning ← YOU ARE HERE
```

---

## ⚡ 5-MINUTE CONTEXT

### **What Happened?**
Booking system hung for 2 days. Root cause: email sending had no timeout, Gmail SMTP unreliable. Fixed by adding 5-second timeout to `NotificationService.sendEmail()`.

### **What Works Now?**
- Bookings create successfully
- Payments charge 80% deposit
- Calendar events create on Google Calendar
- Mobile app receives confirmation
- System stable on Railway

### **What Doesn't?**
- Email notifications timeout (bookings still succeed)
- Push notifications placeholder only
- Some debug code needs cleanup

### **What's Next?**
- Plan AWS migration (you have new AWS account)
- Implement proper background job queue for notifications
- Move from Gmail to AWS SES for email delivery

---

## 📁 ESSENTIAL FILES

### **Read These First:**
```
1. SESSION_SUMMARY_FEB_7_2026.md - Full debugging story
2. AWS_MIGRATION_PLAN.md - Infrastructure migration guide
3. OUTSTANDING_ISSUES_FEB_7_2026.md - Current problems list
4. FINDR_HEALTH_ECOSYSTEM_v28.md - System architecture
```

### **Code Location:**
```
~/Development/findr-health/carrotly-provider-database/
├── backend/
│   ├── routes/bookings.js (main endpoint, 1800+ lines)
│   ├── services/
│   │   ├── NotificationService.js (email timeout fix here)
│   │   ├── PaymentService.js (80/20 split)
│   │   └── calendarSync.js (Google Calendar)
│   ├── models/Booking.js (pre-save hook commented out)
│   └── config/db.js (MongoDB with timeouts)
└── infrastructure/ (create this for Terraform)
```

---

## 🎯 IMMEDIATE ACTIONS

### **If Continuing from Where We Left Off:**

#### **Option A: Continue Cleanup (1-2 hours)**
```bash
cd ~/Development/findr-health/carrotly-provider-database/backend

# 1. Verify current state
git status
git log --oneline -5

# 2. Check if cleanup worked
grep -c "🔍\|📊" routes/bookings.js  # Should be 0
grep -n "REPLACED WITH DIAGNOSTIC CODE" routes/bookings.js  # Should be empty

# 3. Re-enable pre-save hook
nano models/Booking.js  # Lines 504-525

# 4. Run full test
railway logs --follow
# Test booking from mobile app
```

#### **Option B: Start AWS Migration (recommended)**
```bash
# 1. Set up AWS CLI
brew install awscli
aws configure

# 2. Create project structure
mkdir -p infrastructure/{terraform,scripts}

# 3. Follow AWS_MIGRATION_PLAN.md Phase 1

# 4. Create Dockerfile
touch backend/Dockerfile

# Reference: See AWS_MIGRATION_PLAN.md for complete steps
```

---

## 🔍 DEBUGGING COMMANDS

### **Check System Health**
```bash
# Railway logs
railway logs --follow

# Git status
git log --oneline -5
git status

# Check for syntax errors
grep -r 'console\.log`' backend/ --include="*.js" | grep -v node_modules

# Test locally
cd backend
npm install
npm start
```

### **Test Booking Flow**
```bash
# Watch logs
railway logs --follow

# In mobile app:
# 1. Select service
# 2. Choose date/time
# 3. Tap "Book Appointment"

# Expected logs:
# ✅ Deposit charged: X (deposit_charged)
# ✅ Booking saved successfully
# ✅ Notification sent successfully (or timeout warning)
```

---

## 📞 KEY INFORMATION

### **Credentials Needed**
```bash
# Railway
railway login

# AWS (new account)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-west-2

# Stripe (working)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Calendar (working)
GOOGLE_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# MongoDB (working)
MONGODB_URI=mongodb://railway...
```

### **URLs**
- **Backend:** https://carrotly-provider-database-production.up.railway.app
- **Repository:** https://github.com/Findr-Health/carrotly-provider-database
- **Railway Dashboard:** https://railway.app

---

## 🚨 IF SOMETHING BREAKS

### **Bookings Stop Working?**

**Step 1: Check Railway logs**
```bash
railway logs --tail 100
```

**Step 2: Look for the hang point**
- Stops after "Deposit charged"? → Calendar issue
- Stops after "Calendar event created"? → Save issue
- Stops after "Booking saved"? → Notification issue
- Stops after "Notification sent"? → Response issue

**Step 3: Quick fixes**
```bash
# Revert to last working state
git reset --hard dfae73c
git push origin main --force

# Add timeout to any hanging operation
const result = await Promise.race([
  operationPromise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
]);
```

### **Emergency Rollback**
```bash
# Go back to last working commit
git reset --hard dfae73c
git push origin main --force
railway logs --follow

# This puts you at: bookings work, notifications timeout gracefully
```

---

## 🎓 LESSONS FROM LAST SESSION

### **What Worked Well:**
1. Systematic logging to isolate hang point
2. Adding timeout wrappers around external calls
3. Not being afraid to revert when stuck
4. Using Python scripts for complex file edits

### **What Didn't:**
1. Incremental patches that accumulated tech debt
2. Assuming terminal output was accurate (copy/paste artifacts)
3. Not verifying deployed code matched local changes
4. Using sed with emoji characters

### **Golden Rules:**
1. **Always add timeouts** to external service calls
2. **Never block user endpoints** with non-critical operations
3. **Verify deployment** before declaring victory
4. **Test before refactoring** - keep working state
5. **Revert quickly** if solution isn't clear within 30 minutes

---

## 📊 PROJECT METRICS

### **Code Stats**
- **Backend:** ~15,000 lines of code
- **Routes:** 12 main endpoints
- **Models:** 8 Mongoose schemas
- **Services:** 6 service classes
- **Tests:** None (high priority TODO)

### **Technical Debt Score: 6/10**
- Email delivery: unreliable
- No background jobs: notifications block
- Some debug code: needs cleanup
- No tests: needs test suite
- Documentation: comprehensive

### **System Stability: 8/10**
- Bookings: working reliably
- Payments: Stripe integration solid
- Calendar: Google OAuth stable
- Notifications: timeout protection added
- Database: connection pool configured

---

## 🎯 RECOMMENDED NEXT STEPS

### **For Tomorrow's Demo:**
1. Do nothing - system is stable
2. Test booking flow one more time
3. Prepare to explain email limitation
4. Have Railway dashboard open for monitoring

### **After Demo (Priority Order):**

**Week 1: AWS Foundation**
1. Set up AWS account structure (Day 1)
2. Create VPC and networking (Day 1-2)
3. Deploy test environment (Day 2-3)
4. Migrate database (Day 3-4)
5. Configure SES email (Day 4)
6. Validate in staging (Day 5)

**Week 2: Production Migration**
7. Set up CI/CD pipeline (Day 1)
8. Blue-green deployment (Day 2)
9. DNS cutover (Day 2)
10. Monitor for 48 hours (Day 3-4)
11. Decommission Railway (Day 5)

**Week 3: Code Quality**
12. Implement background job queue (Day 1-2)
13. Add push notifications (Day 3)
14. Write test suite (Day 4-5)
15. Code cleanup sprint

---

## 💡 QUICK REFERENCE

### **Common Git Commands**
```bash
# Check state
git status
git log --oneline -10

# Revert changes
git reset --hard HEAD~1  # Last commit
git reset --hard dfae73c  # Specific commit

# Force push (use cautiously)
git push origin main --force

# Create branch for experiments
git checkout -b feature/aws-migration
```

### **Railway Commands**
```bash
railway login
railway logs --follow
railway logs --tail 100
railway status
railway variables  # List env vars
```

### **Docker Commands (for AWS)**
```bash
docker build -t findr-backend .
docker run -p 8080:8080 findr-backend
docker-compose up
```

---

## 📚 ADDITIONAL RESOURCES

### **External Documentation**
- AWS ECS Fargate: https://docs.aws.amazon.com/ecs/
- Stripe API: https://stripe.com/docs/api
- Google Calendar API: https://developers.google.com/calendar
- Mongoose: https://mongoosejs.com/docs/
- Express.js: https://expressjs.com/

### **Internal Documentation**
- All `.md` files in project root
- Code comments in services/
- Inline documentation in routes/bookings.js

---

## ✅ CHECKLIST FOR NEW SESSION

Before starting:
- [ ] Read SESSION_SUMMARY_FEB_7_2026.md
- [ ] Understand current system state (working but with issues)
- [ ] Review AWS_MIGRATION_PLAN.md if migrating
- [ ] Check OUTSTANDING_ISSUES for priorities
- [ ] Pull latest code: `git pull origin main`
- [ ] Verify Railway is running: `railway logs`
- [ ] Have AWS credentials ready if migrating

Starting fresh:
- [ ] Decide: Continue cleanup OR Start AWS migration
- [ ] Create feature branch if making changes
- [ ] Set up development environment
- [ ] Test booking flow to establish baseline
- [ ] Review last 10 git commits for context

---

## 🎬 LET'S GO!

**You're ready to continue.** The system is stable, the path forward is clear, and all the context you need is documented.

**Recommended First Action:**
1. Read SESSION_SUMMARY_FEB_7_2026.md (15 minutes)
2. Test a booking to confirm system works (5 minutes)
3. Decide next priority: AWS migration OR code cleanup
4. Follow relevant documentation guide

**Questions?** Everything you need is in the documentation files. Start with the session summary for full context.

---

**Good luck! 🚀**
