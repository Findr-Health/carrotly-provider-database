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

Project location: `~/Development/findr-health/carrotly-provider-database/backend`
Railway logs available via: `railway logs --follow`

Ready to debug when you are!

---

Then attach:
- CALENDAR_BOOKING_PROJECT_STATE.md
- CURRENT_BUG_DETAILS.md
- Screenshot of mobile app (if helpful)
