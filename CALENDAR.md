# CALENDAR.md — Two-Sided Scheduling

## Concepts
- Service duration + prep/cleanup buffers
- Provider working hours, breaks, blackout dates
- Time zones (IANA); DST aware

## Rules
- Minimum booking notice (freeze window): default 30 min
- Slot hold TTL: 5 min; prevent double booking with optimistic locks
- Overlap policy: disallow overlap unless multi-staff capacity >= 2

## Sync
- Google/Outlook/Apple support
- Pull cadence: baseline + delta tokens
- Conflicts: external vs platform rules; admin overrides