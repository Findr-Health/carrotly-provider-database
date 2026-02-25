# Vision & Strategy - "Negotiate For Me"

**Project:** Findr Health  
**Feature:** Bill Negotiation Service  
**Status:** Planning Phase

---

## EXECUTIVE SUMMARY

### What We're Building

A feature where users tap "Negotiate For Me" and Findr's offshore team negotiates their medical bills for them. Users only pay if we succeed.

### Why It Matters

**Current Problem:** 95% of users see Clarity Price analysis showing they're overcharged but don't negotiate (even with a script).

**Our Solution:** Professional bill negotiation as a service - like RocketMoney for medical bills.

### Business Model

- **Revenue:** 30% of savings OR $75 minimum
- **Target:** 80% negotiation success rate
- **Year 1 Goal:** 10,000 negotiations, $1M revenue

---

## THE USER EXPERIENCE

### Before (Current)
1. Upload bill
2. See Clarity Price: "You're overcharged by $100+"
3. Get negotiation script
4. **Don't actually call** (too intimidating)
5. Pay full bill anyway

### After (With "Negotiate For Me")
1. Upload bill
2. See Clarity Price: "You're overcharged by $100+"
3. **Tap "Negotiate For Me" button**
4. **We handle everything** (3-7 days)
5. Get notification: "🎉 We saved you $85!"
6. Pay reduced amount
7. **Still save money, zero effort**

---

## BUSINESS MODEL EXAMPLE

**Typical Scenario:**
- Original bill: $261
- We negotiate to: $140
- Savings: $121
- Our fee (30%): $36.30
- User pays: $176.30
- **User saves: $84.70**
- **Findr earns: $36.30**

**Win-Win:** User saves money without effort, Findr captures revenue.

---

## SUCCESS METRICS

### Year 1 Targets

**Adoption:**
- 10,000 negotiations initiated
- 40% conversion from Clarity Price

**Quality:**
- 80% negotiation success rate
- 98% payment collection rate
- 4.5+ star user rating
- <5 days average negotiation time

**Revenue:**
- $1M total revenue
- $60 average fee per negotiation
- 67% gross margin

---

## STRATEGIC PHASES

### Phase 1: Prove It Works (Months 1-2)
**Goal:** Build core feature, validate model

**What to Prove:**
- Users will authorize negotiation
- Offshore team can negotiate successfully
- Users will pay after success
- Payment collection works

**Success Metrics:**
- 100 beta users complete negotiation
- 75%+ success rate
- 95%+ payment collection

---

### Phase 2: Scale & Optimize (Months 3-6)
**Goal:** Handle volume, improve efficiency

**Improvements:**
- Standardize offshore team scripts
- Improve admin dashboard analytics
- Optimize notification timing
- Reduce average negotiation time to <5 days

**Success Metrics:**
- 1,000+ negotiations/month
- 85%+ success rate
- <2% payment decline rate

---

### Phase 3: Expand Revenue (Months 7-12)
**Goal:** Grow revenue

**Opportunities:**
- B2B channel (TPAs/employers)
- Higher bill limits ($50K+)
- Proactive outreach to users
- Subscription model test

---

## THE FOUR SYSTEMS

This feature touches four parts of Findr:

### 1. findr-health-mobile (User App)
**Changes Needed:**
- Add "Negotiate For Me" button
- Build authorization flow
- Build progress tracking
- Build success/failure screens

### 2. Backend + Database
**Changes Needed:**
- Create bill_negotiations table
- Build negotiation APIs
- Integrate Stripe delayed charging
- Build notification service

### 3. Admin Dashboard
**Changes Needed:**
- Build negotiation queue
- Build case management interface

### 4. Provider Portal
**Changes Needed:** **NONE**
- Team calls providers directly via phone

---

## CRITICAL UNKNOWNS (MUST INVESTIGATE)

Before building, we need to answer:

1. **Stripe** - Can we charge payment methods days later?
2. **Checkout** - Can it show itemized breakdown?
3. **Notifications** - Are push notifications set up?
4. **User Data** - Do we collect email addresses?

**See:** `01-INVESTIGATION-GUIDE.md` for details

---

## CONSTRAINTS & ASSUMPTIONS

### V1 Constraints

- Bill size: $200-$10,000
- US providers only
- Manual negotiation (no automation)
- Payment method required upfront

### Key Assumptions

- 80% of providers will negotiate
- Users will pay after successful negotiation
- Offshore team can handle volume
- Payment methods work with delayed charging

---

## RISKS & MITIGATION

### Risk 1: Payment Collection Failures
**Impact:** We negotiate successfully but can't collect payment

**Mitigation:**
- 7-day grace period to update payment
- Clear "original bill will be reinstated" warning
- Eventually: $1 authorization test upfront

---

### Risk 2: Offshore Team Overwhelmed
**Impact:** Cases take >7 days, user satisfaction drops

**Mitigation:**
- Limited beta rollout (50 users)
- Monitor queue size daily
- Hire more negotiators proactively

---

### Risk 3: Low Success Rate
**Impact:** Only negotiate 50% vs 80% target

**Mitigation:**
- Start with clearly overpriced bills only
- Learn which providers negotiate
- Set realistic expectations with users

---

## WHAT'S OUT OF SCOPE (V1)

This feature does NOT include:

❌ Automated AI negotiation
❌ Bills over $10,000
❌ Non-US providers
❌ Provider portal integration
❌ SMS notifications
❌ Subscription model

These may come in later phases.

---

## NEXT STEPS

### This Week
1. Read all planning documents
2. Schedule team kickoff
3. Assign roles and responsibilities
4. **Begin investigation** (Week 1)

### Week 1
1. Complete investigation checklist
2. Document findings
3. Finalize technical approach
4. Update timeline if needed

### Weeks 2-10
Build, test, and launch!

---

**VISION STATEMENT:**

> "We're building the first service that makes medical bill negotiation effortless for consumers. By combining healthcare expertise, AI-powered analysis, and human negotiators, we'll save users thousands of dollars without them having to make a single phone call."

---

**Read next:** `01-INVESTIGATION-GUIDE.md`
