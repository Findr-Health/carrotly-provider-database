# QA.md — Test Plan

## Functional
- Search by category; map filters (open-now, distance, price)
- Provider profile; service selection with variants
- Calendar booking; reschedule/cancel respecting policy
- Checkout success; 3DS; receipts; refunds (partial/full)

## Edge Cases
- Time zones & DST transitions
- Overbooking attempts during slot hold TTL
- Payment failures; retries; dispute webhook
- Network timeouts; idempotency replays

## Performance
- Load test search (qps), availability, and booking spikes
- P99 latency thresholds; alerting hooks