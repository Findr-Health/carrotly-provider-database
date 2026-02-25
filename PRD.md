# PRD — App Parity with Fresha (Search → Book → Pay)
**Run:** 2025-09-25T02:24:09.633261
**Owner:** [NOT SPECIFIED]
**Goal:** Achieve feature parity with Fresha on core flows (category/map search, provider selection, service menu, calendar booking, payments) while meeting HIPAA hygiene and PCI SAQ‑A.

## Problem & Users
- Consumers: need trustworthy, fast booking with clear pricing and availability.
- Providers: need simple onboarding, accurate calendars, fewer no‑shows, fast payouts.

## Objectives & KPIs
- Search→Booking conversion ≥ 6% by V1.0
- Repeat booking within 60 days ≥ 35%
- Booking API P99 < 600 ms; 99.9% uptime
- Cancel rate ≤ 12% with policy enforcement; No‑show ≤ 4%

## Scope (this release)
- iOS/Android + web consumer app
- Provider portal essentials
- Category + map search; provider profiles; service menus
- Two‑sided calendar booking; reschedule/cancel per policy
- Checkout (cards; Apple/Google Pay); receipts
- Notifications (push/SMS/email); basic reviews
- Analytics and audit logs

## Non‑Goals (this run)
- Full loyalty/rewards; payer integrations; complex insurance checks

## Acceptance Criteria (samples)
- User can search by category and filter on a map (open‑now, distance, price).
- Selecting a provider shows services with duration & price; user can pick a slot.
- Checkout via Stripe (tokenized), with confirmation + receipt email.
- Reschedule/cancel enforces provider policy windows with correct fees.
- Calendar prevents double bookings using slot holds and conflict detection.

## Assumptions
- Marketplace settlement via Stripe Connect (standard/on‑behalf‑of).
- Time‑zone handling via IANA TZ, stored UTC, displayed local.
- PHI avoidance: we do not store sensitive diagnosis details.

## Risks
- Calendar sync latency; payment disputes; review moderation load.

## Rollout
- Pilot → V1.0 → V1.1; feature flags for risky features (waitlist, reviews).