# TECH_SPEC — App Parity & Booking Platform

## Architecture
- Client: React Native (iOS/Android), React Web
- Backend: Node/TypeScript (Nest.js) or Python (FastAPI); GraphQL or REST
- DB: Postgres (primary); Redis (cache/locks); S3 (media)
- Search/Geo: PostGIS; or Elasticsearch with geo
- Infra: Kubernetes + CI/CD; observability (OpenTelemetry)

## Domain Model
User, Provider, Location, Staff, Service, Variant, Slot, Booking, Policy, PaymentIntent, Refund, Review, Notification

## APIs (high level)
- GET /search?query=&lat=&lng=&filters=
- GET /providers/{id}  (includes services/variants)
- GET /availability?provider_id=&service_id=&date=  (returns slots incl. buffers)
- POST /bookings  (idempotent key; atomic with PaymentIntent)
- POST /bookings/{id}/cancel|reschedule
- POST /payments/intent  → POST /payments/confirm
- POST /reviews

## Calendar
- Buffers (prep/cleanup), working hours, breaks, blackout dates
- Slot hold TTL (e.g., 5 min) with optimistic locking
- External sync (Google/Microsoft/Apple): delta tokens; conflict policy

## Payments
- Stripe Connect (separate accounts); Apple/Google Pay
- Refunds (partial/full); disputes webhooks; tax handling

## Security
- OAuth/OTP; RBAC; PII/PHI separation; encryption at rest & in transit
- Idempotency; rate limiting; audit logs; GDPR/CCPA deletion

## SLOs
- P99 search < 600ms; Availability < 400ms; Booking < 800ms
- Error budgets with alerts; chaos drills