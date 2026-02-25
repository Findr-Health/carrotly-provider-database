# RISKS.md — Risk Log (seed)

| Risk | Trigger | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---:|---|---|
| Calendar conflicts | sync lag | double-booking | Med | slot holds; optimistic locks; manual override | Eng |
| Payment disputes | cardholder chargeback | revenue loss | Med | clear receipts; dispute playbook; evidence automation | Ops |
| Search quality | poor ranking/geo | conversion drop | Med | hybrid ranking (distance × open × rating × price) | PM |
| Policy variance | per-provider rules | UX inconsistency | Med | policy engine with templates; QA checklists | Ops |