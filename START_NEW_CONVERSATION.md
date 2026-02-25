# Prompt Template for New Claude Conversation

Copy and paste this into a new conversation, then upload the project state files:

---

I'm working on a critical production bug in a healthcare booking system. I'll upload 2 context files that contain the complete project state and bug details.

**Project:** Calendar integration + 80/20 payment split for booking flow  
**Bug:** Booking hangs after calendar event creation, never sends response to mobile app  
**Status:** 95% complete, one blocking bug

Please read both uploaded files:
1. CALENDAR_BOOKING_PROJECT_STATE.md
2. CURRENT_BUG_DETAILS.md

After reading, please:
1. Confirm you understand the bug symptoms
2. Propose 3 diagnostic approaches ranked by likelihood
3. Provide the first debugging command to run

**Project location:** `~/Development/findr-health/carrotly-provider-database/backend`  
**Railway logs:** `railway logs --follow`

**Key Facts:**
- Payment succeeds (✅ Deposit charged: 100)
- Calendar event creates (✅ Calendar event created)
- Code stops executing completely after calendar event
- No errors thrown, no timeouts, just silent hang
- Mobile app waits indefinitely for response

**What We've Ruled Out:**
- console.log syntax errors (verified clean)
- Mongoose model syntax errors (verified clean)
- Notification code crashing (has proper try/catch)

**Most Likely Culprits:**
1. Unhandled promise rejection between calendar and save
2. Mongoose pre/post save hooks blocking
3. Memory/resource exhaustion on Railway

Ready to debug when you are!

---

**Files to Attach:**
1. CALENDAR_BOOKING_PROJECT_STATE.md
2. CURRENT_BUG_DETAILS.md
3. Screenshot of mobile app stuck on loading (optional but helpful)

**Additional Context Commands (run these and share output if needed):**
```bash
# Check Railway logs
railway logs --tail 100

# Check for Mongoose hooks
grep -A 10 "pre('save')" backend/models/Booking.js

# Check memory usage
railway status
```
