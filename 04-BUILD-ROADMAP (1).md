# Build Roadmap - 10-Week Plan

**Timeline:** 8-10 weeks from investigation to launch

---

## PHASES OVERVIEW

```
Week 1:  Investigation
Weeks 2-3: Backend + Admin
Weeks 4-5: Mobile App
Weeks 6-7: Payments + Notifications
Week 8: Beta Testing
Week 9: Refinement
Week 10: Full Launch
```

---

## WEEK 1: INVESTIGATION

### Goal
Understand existing systems before building anything new.

### Tasks
- [ ] Stripe integration audit (see Investigation Guide)
- [ ] Checkout UI audit
- [ ] Notification infrastructure check
- [ ] User data collection check
- [ ] Clarity Price code review
- [ ] Admin dashboard review (if exists)
- [ ] Database architecture review

### Deliverable
**INVESTIGATION-FINDINGS.md** document with findings

### Team
- 1 backend engineer
- 1 mobile engineer
- 1 product manager

---

## WEEKS 2-3: BACKEND + ADMIN FOUNDATION

### Goal
Build core infrastructure without user-facing features yet.

### Week 2: Backend
- [ ] Create `bill_negotiations` table
- [ ] Build negotiation APIs:
  - POST /api/negotiations/initiate
  - GET /api/negotiations/:id
  - PATCH /api/admin/negotiations/:id/status
- [ ] Test with Postman/curl

### Week 3: Admin Dashboard
- [ ] Create negotiation queue view
- [ ] Create case detail view
- [ ] Build status update forms
- [ ] Test end-to-end (create → assign → update)

### Success Criteria
✅ Can create negotiation via API
✅ Offshore team can view and update cases

### Team
- 1 backend engineer (full-time)
- 1 frontend engineer (admin dashboard)

---

## WEEKS 4-5: MOBILE APP

### Goal
Build user-facing screens and flows.

### Week 4: Authorization Flow
- [ ] Add "Negotiate For Me" button to Clarity Price screen
- [ ] Create authorization screen
- [ ] Integrate with payment method system
- [ ] Wire up to backend API
- [ ] Navigate to progress screen after authorization

### Week 5: Progress & Results
- [ ] Create progress tracking screen
- [ ] Create success screen (with payment button)
- [ ] Create failure screen (with options)
- [ ] Handle deep linking from notifications

### Success Criteria
✅ User can authorize negotiation
✅ User can track progress
✅ User sees success/failure screens

### Team
- 2 mobile engineers (iOS + Android)
- 1 designer (screens and flows)

---

## WEEKS 6-7: INTEGRATION

### Goal
Connect payment processing and notifications.

### Week 6: Payment Integration
- [ ] Implement Stripe delayed charging (off_session)
- [ ] Extend checkout to show itemized breakdown
- [ ] Handle payment failures and retries
- [ ] Set up Stripe webhooks

### Week 7: Notifications
- [ ] Set up Firebase (if not exists)
- [ ] Implement push notification triggers:
  - Negotiation success
  - Negotiation failure
  - Payment failure
- [ ] Set up email notifications
- [ ] Test notification delivery

### Success Criteria
✅ Can charge saved payment method days later
✅ Users receive push and email notifications
✅ Checkout shows itemized breakdown

### Team
- 1 backend engineer (payments + notifications)
- 2 mobile engineers (notification handling)
- DevOps (Firebase setup, email service)

---

## WEEK 8: BETA TESTING

### Goal
Test with real users, find and fix issues.

### Tasks
- [ ] Internal team testing (full flow)
- [ ] Recruit 50-100 beta users
- [ ] Enable feature for beta group only
- [ ] Train offshore team
- [ ] Monitor 24/7 during beta
- [ ] Collect feedback

### Success Criteria
✅ 50+ negotiations completed
✅ Success rate >75%
✅ Payment collection >95%
✅ No critical bugs
✅ 4+ star average rating

### Team
- Full team (monitoring)
- 1 QA engineer
- Offshore team (2-3 negotiators)

---

## WEEK 9: REFINEMENT

### Goal
Fix issues, optimize flows.

### Tasks
- [ ] Analyze beta metrics
- [ ] Fix bugs found in beta
- [ ] Improve UX based on feedback
- [ ] Load testing
- [ ] Customer support training
- [ ] Prepare for scale

### Success Criteria
✅ All P0/P1 bugs fixed
✅ User satisfaction >4.5 stars
✅ Ready for 10x volume

---

## WEEK 10: FULL LAUNCH

### Goal
Roll out to all users.

### Rollout Plan
- **Day 1:** 10% of users
- **Day 3:** 25% of users
- **Day 5:** 50% of users
- **Day 7:** 100% of users

### Tasks
- [ ] Gradual rollout
- [ ] Monitor metrics in real-time
- [ ] Marketing push (in-app, email, blog)
- [ ] Daily team reviews
- [ ] Iterate based on data

### Success Criteria
✅ 100% rollout complete
✅ No critical incidents
✅ Metrics meet targets

---

## TEAM REQUIREMENTS

### Development Team

- **1 Backend Engineer** - Full-time, 8 weeks
- **2 Mobile Engineers** (iOS + Android) - Full-time, 6 weeks
- **1 Frontend Engineer** (Admin) - Half-time, 3 weeks
- **1 Designer** - Half-time, 4 weeks
- **1 Product Manager** - Part-time, 10 weeks
- **1 QA Engineer** - Part-time, 4 weeks
- **DevOps** - As needed

### Offshore Team (Ramp up Week 7-8)

- **2-3 Negotiators** - Full-time
- **1 Manager** - Full-time

---

## CRITICAL DEPENDENCIES

### External
✅ Stripe account access (request Week 1)
✅ Firebase project (set up Week 1 if needed)
✅ Email service account (SendGrid/Mailgun, Week 1)
✅ Admin domain (admin.findr.health, Week 2)

### Internal
✅ Legal review of terms (submit Week 2, approve by Week 4)
✅ Offshore team hiring (start Week 5, trained by Week 8)
✅ Customer support training (Week 8)

---

## RISK MITIGATION

### Risk 1: Payment System Needs Major Work
**If investigation reveals Stripe not ready:**
- Add 2 weeks to timeline
- Implement tokenization from scratch

### Risk 2: No Notification Infrastructure
**If push notifications don't exist:**
- Add 1 week to timeline
- Set up Firebase from scratch

### Risk 3: Beta Uncovers Critical Issues
**If major bugs found:**
- Use Week 9 buffer for fixes
- Delay launch if needed

---

## SUCCESS METRICS

### Week-by-Week Milestones

| Week | Milestone | Check |
|------|-----------|-------|
| 1 | Investigation complete | Findings documented |
| 2 | Backend APIs working | Can create via API |
| 3 | Admin dashboard functional | Team can manage queue |
| 4 | Authorization flow done | Can authorize |
| 5 | All mobile screens done | Full flow navigable |
| 6 | Payment working | Can charge later |
| 7 | Notifications working | Users receive push |
| 8 | Beta complete | 50+ negotiations |
| 9 | Refinement done | 4.5+ stars |
| 10 | Launch complete | 100% rollout |

---

## POST-LAUNCH (Months 2-3)

### Month 2: Optimize
- Improve success rate
- Reduce negotiation time
- Optimize notification timing

### Month 3: Scale
- Increase bill limits to $25K
- Hire more offshore team if needed
- Build automation helpers

---

## COMMUNICATION PLAN

### Weekly
- **Monday 10am:** Team standup
- **Thursday 2pm:** Stakeholder review

### During Launch (Week 10)
- **Daily 9am:** Launch status sync

### Slack
- #bill-negotiation-dev (dev team)
- #bill-negotiation-launch (broader)

---

**Next Steps:**

1. Read all documents (2-3 hours)
2. Team kickoff meeting
3. Begin Week 1 investigation
4. Create INVESTIGATION-FINDINGS.md
5. Start building!

---
