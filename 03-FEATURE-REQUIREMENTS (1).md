# Feature Requirements - User Stories

**Purpose:** Define what users experience, not how it's built

---

## USER STORY 1: Authorize Negotiation

**As a user who just saw my Clarity Price analysis,**
**I want to authorize Findr to negotiate my bill,**
**So I don't have to call the provider myself.**

### Acceptance Criteria

✅ I see "Negotiate For Me" button after Clarity Price analysis
✅ Button shows estimated savings ("Save ~$85")
✅ Tapping shows authorization screen with:
   - How it works (3 simple steps)
   - What I'll pay (breakdown)
   - "No success = No fee" guarantee
   - Payment method requirement

✅ I can add/select payment method (Apple Pay, card)
✅ I confirm terms and tap "Start Negotiation"
✅ I see confirmation: "We're working on it! We'll notify you in 3-7 days"

### Edge Cases

❌ Bill less than $200 → Show: "Available for bills $200+"
❌ Bill over $10,000 → Show: "For bills over $10K, contact support"
❌ No payment method → Prompt to add one first

---

## USER STORY 2: Track Progress

**As a user whose bill is being negotiated,**
**I want to see what's happening,**
**So I know when to expect results.**

### Acceptance Criteria

✅ I can open app and see progress screen anytime
✅ Screen shows:
   - Original bill amount
   - Provider name
   - Current status ("In Progress")
   - Activity timeline (what team has done)
   - Estimated completion (3-7 days)

✅ Pull-to-refresh updates status
✅ If taking longer, see reassuring message

### Edge Cases

❌ App deleted/reinstalled → Progress still visible (stored in backend)

---

## USER STORY 3: Successful Negotiation → Pay

**As a user whose bill was successfully negotiated,**
**I want to easily complete payment,**
**So I can finalize and save money.**

### Acceptance Criteria

✅ I get push notification: "🎉 We saved you $85!"
✅ Tapping notification opens success screen showing:
   - Original: $261
   - Negotiated to: $140
   - Our fee: $36.30 (30% of savings)
   - Total you pay: $176.30
   - **YOU SAVE: $84.70** (large, green, prominent)

✅ I tap "Proceed to Payment"
✅ I'm taken to checkout (existing flow) with amount pre-filled
✅ Checkout shows itemized breakdown:
   - Negotiated Bill: $140.00
   - Success Fee: $36.30
   - Total: $176.30
   - You Save: $84.70

✅ I complete payment
✅ I receive email receipt

### Edge Cases

❌ Payment declines → Show error, prompt to update payment method
❌ Don't pay within 7 days → Reminder notification

---

## USER STORY 4: Failed Negotiation

**As a user whose bill couldn't be negotiated,**
**I want to know my options,**
**So I can decide what to do next.**

### Acceptance Criteria

✅ I get notification: "Bill negotiation update"
✅ Tapping shows failure screen:
   - "We couldn't negotiate this one"
   - "You owe us nothing. No fee."
   - Reason (e.g., "Provider refused")
   - Three clear options:
     1. Try negotiating yourself (view script)
     2. Pay provider directly
     3. Request billing review

✅ Payment method NOT charged

---

## ADMIN STORY 1: Manage Queue

**As an offshore team member,**
**I want to see all pending negotiations,**
**So I can work on them efficiently.**

### Acceptance Criteria

✅ I log into admin dashboard
✅ I see "Negotiation Queue" with:
   - Status badges (pending, in progress, success, failed)
   - Bill ID (clickable)
   - Provider name
   - Original → Target amount
   - Days pending
   - Assigned to
   - Quick actions

✅ I can assign unassigned cases to myself
✅ Assigned cases move to "My Work" section

---

## ADMIN STORY 2: Update Cases

**As an offshore team member,**
**I want to update case status and log my actions,**
**So users are informed and records are accurate.**

### Acceptance Criteria

✅ I can click bill ID to see case details:
   - Full bill info
   - Provider contact (phone, email)
   - Activity timeline
   - Forms to update status and add notes

✅ After calling provider, I log: "Called provider, spoke with Jane, requested review"
✅ When provider agrees, I update:
   - Status: Success
   - Negotiated amount: $140
   - System auto-calculates fee
   - User gets notification automatically

✅ When provider refuses, I update:
   - Status: Failed
   - Reason: "Provider refused"
   - User gets notification automatically

---

## SUCCESS CRITERIA

### Before Launch

- [ ] 100 beta users complete negotiation successfully
- [ ] Success rate >75%
- [ ] Payment collection rate >95%
- [ ] User satisfaction >4.5 stars
- [ ] No critical bugs in 2 weeks

### 90 Days Post-Launch

- [ ] 10,000 negotiations initiated
- [ ] 80% success rate
- [ ] $1M ARR run rate
- [ ] 40% conversion from Clarity Price

---

## OUT OF SCOPE (V1)

❌ Automated negotiation (all manual)
❌ Bills over $10,000
❌ Non-US providers
❌ SMS notifications (push + email only)
❌ Subscription model

---

**Next:** Read `04-BUILD-ROADMAP.md` for timeline
