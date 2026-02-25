# Investigation Guide - Check Before Building

**Purpose:** Understand existing Findr systems to prevent bugs and duplicate work

---

## WHY INVESTIGATE FIRST

You can't build a feature properly without knowing:
- What already works (don't rebuild it)
- What's missing (know what to build)
- What might break (prevent bugs)

**Time investment:** 1-2 days saves weeks of rework.

---

## CRITICAL UNKNOWNS

### 1. Stripe Payment Integration

**Question:** Does our Stripe setup support delayed, off-session charging?

**Why it matters:** We need to charge users 3-7 days AFTER they authorize, without them being present.

**How to check:**
- Find Stripe integration code in backend
- Look for `stripe` in package.json or imports
- Check if payment methods are saved (tokenized)
- Test: Book a wellness service, check if payment method is saved for reuse

**What to document:**
- ✅ Stripe version number
- ✅ Can we save payment methods? (YES/NO)
- ✅ Can we charge saved methods later? (YES/NO)

**If YES:** Great, extend existing setup with `off_session: true`
**If NO:** Need to implement payment method tokenization from scratch

---

### 2. Payment Checkout UI

**Question:** Can our checkout page show itemized line items?

**Why it matters:** Need to show "Bill: $140 + Fee: $36.30 = Total: $176.30"

**How to check:**
- Find checkout screen code in findr-health-mobile
- Book a wellness service, screenshot the checkout
- Check: Does it show subtotals, taxes, or just one total?

**What to document:**
- ✅ File path of checkout screen
- ✅ Shows line items? (YES/NO)
- ✅ Screenshot of current checkout

**If YES:** Reuse the pattern
**If NO:** Extend checkout to support multiple line items

---

### 3. Push Notifications

**Question:** Is push notification infrastructure set up?

**Why it matters:** Users need updates like "We saved you $85!" without opening app.

**How to check:**
- Look for Firebase config files (google-services.json, GoogleService-Info.plist)
- Check for notification permissions in app
- Send a test push notification

**What to document:**
- ✅ FCM set up? (YES/NO - Android)
- ✅ APNs set up? (YES/NO - iOS)
- ✅ Can receive pushes? (YES/NO)

**If YES:** Add bill negotiation notification types
**If NO:** Set up Firebase Cloud Messaging and APNs

---

### 4. User Contact Information

**Question:** Do we collect email addresses from users?

**Why it matters:** Need email for receipts, payment failure notifications.

**How to check:**
- Query users table: `SELECT email FROM users LIMIT 1;`
- Check registration/onboarding screens
- Verify: Is email required or optional?

**What to document:**
- ✅ Email collected? (YES/NO)
- ✅ Email verified? (YES/NO)
- ✅ Phone collected? (YES/NO)

**If YES:** Use for notifications
**If NO:** Add email collection during payment setup or onboarding

---

## EXISTING SYSTEMS TO UNDERSTAND

### Clarity Price Code

**Where to look:**
- Mobile app: Bill upload and analysis screens
- Backend: Analysis API endpoints
- Database: bills table

**What to find:**
- How bills are uploaded
- Where analysis results are shown
- What bill data is available (provider name, contact info, amounts)

**Why:** We'll extend the analysis screen with "Negotiate For Me" button

---

### Admin Dashboard

**Where to look:**
- Ask team: "Do we have an admin panel?"
- Check for separate admin repo or Retool/similar

**What to find:**
- Does it exist?
- What framework? (React, Retool, etc.)
- Can we add new sections?

**Why:** Offshore team needs negotiation queue interface

---

### Database Architecture

**Where to look:**
- Database connection config
- Migration files
- Existing table schemas

**What to find:**
- What database? (PostgreSQL, MySQL, etc.)
- Primary key format? (UUIDs, auto-increment integers)
- How to add new tables?

**Why:** We need to create `bill_negotiations` table using same patterns

---

## INVESTIGATION DELIVERABLE

Create a document called **INVESTIGATION-FINDINGS.md** with:

```markdown
## Payment System
- Stripe integrated: YES/NO
- Version: X.X.X
- Payment methods saved: YES/NO
- Off-session charging: READY / NEEDS WORK

## Checkout
- Can show line items: YES/NO
- File location: src/screens/Checkout.js
- Action needed: REUSE / EXTEND / BUILD NEW

## Notifications
- Push working: YES/NO
- FCM configured: YES/NO
- APNs configured: YES/NO

## User Data
- Email collected: YES/NO
- Email verified: YES/NO

## Database
- Type: PostgreSQL/MySQL/etc
- Primary keys: UUID/Integer
- Migration tool: Prisma/Sequelize/etc
```

---

**Estimated time:** 1-2 days
**Next step:** Review findings with team, then start building

---
