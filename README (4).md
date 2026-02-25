# "Negotiate For Me" - Planning Documentation

**Project:** Findr Health Bill Negotiation  
**Created:** February 5, 2026  
**Purpose:** Strategic planning for implementation

---

## 📦 WHAT'S IN THIS PACKAGE

Strategic planning documentation for building the "Negotiate For Me" bill negotiation feature.

### Documents (Read in Order)

| # | Document | Purpose |
|---|----------|---------|
| - | **README.md** | ← You are here |
| 0 | **00-VISION-AND-STRATEGY.md** | **START HERE** - The big picture |
| 1 | **01-INVESTIGATION-GUIDE.md** | What to investigate before building |
| 2 | **02-SYSTEM-INTEGRATION-MAP.md** | How the 4 systems connect |
| 3 | **03-FEATURE-REQUIREMENTS.md** | User stories and acceptance criteria |
| 4 | **04-BUILD-ROADMAP.md** | 10-week implementation plan |

---

## 🎯 QUICK SUMMARY

### What We're Building

Users tap "Negotiate For Me" → Findr's offshore team negotiates their medical bills → Users pay only if we succeed.

**Example:**
- Bill: $261 → Negotiated to $140
- Fee: $36.30 (30% of savings)
- User pays: $176.30
- **User saves: $84.70**

### Business Model
- 30% of savings OR $75 minimum
- 80% target success rate
- Year 1: 10,000 negotiations, $1M revenue

---

## ⚡ CRITICAL: INVESTIGATE FIRST

**Before any coding**, answer these unknowns (Week 1):

1. ✅ **Stripe** - Can we charge payment methods days later?
2. ✅ **Checkout** - Can it show itemized breakdown?
3. ✅ **Notifications** - Are push notifications set up?
4. ✅ **User Data** - Do we collect email?

**See:** `01-INVESTIGATION-GUIDE.md`

---

## 🏗️ THE FOUR SYSTEMS

1. **findr-health-mobile** - User app (add button, screens, flows)
2. **Backend + Database** - APIs, Stripe, notifications
3. **Admin Dashboard** - Queue for offshore team
4. **Provider Portal** - **NOT USED** (team calls providers)

**See:** `02-SYSTEM-INTEGRATION-MAP.md`

---

## ⏱️ TIMELINE: 10 WEEKS

```
Week 1:      Investigation
Weeks 2-3:   Backend + Admin
Weeks 4-5:   Mobile App
Weeks 6-7:   Payments + Notifications
Week 8:      Beta Testing
Week 9:      Refinement
Week 10:     Launch
```

**See:** `04-BUILD-ROADMAP.md`

---

## 👥 WHO READS WHAT

### Product/Project Managers
- Start: `00-VISION-AND-STRATEGY.md`
- Then: `03-FEATURE-REQUIREMENTS.md`
- Then: `04-BUILD-ROADMAP.md`

### All Engineers
- Start: `00-VISION-AND-STRATEGY.md`
- **Do this first:** `01-INVESTIGATION-GUIDE.md` ⭐
- Then: `02-SYSTEM-INTEGRATION-MAP.md`
- Build per: `04-BUILD-ROADMAP.md`

### Designers
- Start: `00-VISION-AND-STRATEGY.md`
- Then: `03-FEATURE-REQUIREMENTS.md`

---

## ✅ SUCCESS CRITERIA

### Technical (Ready to Launch)
- User can authorize in <3 taps
- Notifications deliver
- Payment collection works
- No critical bugs

### Business (90 Days Post-Launch)
- 10,000 negotiations
- 80% success rate
- $1M ARR
- 4.5+ stars

---

## 🚀 NEXT STEPS

### This Week
1. Read all documents (2-3 hours)
2. Team kickoff meeting
3. **Begin investigation**

### Week 1
1. Complete investigation
2. Document findings
3. Start building!

---

**Ready? Start with `00-VISION-AND-STRATEGY.md`**
