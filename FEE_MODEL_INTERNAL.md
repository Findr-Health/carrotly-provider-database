# Findr Health Fee Model - Internal Summary

**Version:** 2.0  
**Effective Date:** January 2026  
**Classification:** Internal Use Only

---

## Fee Structure

### Formula
```
Platform Fee = MIN( (Service Price × 10%) + $1.50, $35.00 )
```

### Components
| Component | Rate | Purpose |
|-----------|------|---------|
| Percentage Fee | 10% | Revenue share on transactions |
| Fixed Fee | $1.50 | Covers operational costs per transaction |
| Fee Cap | $35.00 | Maximum platform fee per transaction |

### Stripe Processing (Pass-through)
- **Rate:** ~2.9% + $0.30 per transaction
- **Cap:** $35.00 maximum
- **Note:** Passed through to provider, not Findr revenue

---

## Fee Schedule

| Service Price | Platform Fee | Stripe (~) | Total Fees | Provider Net | Provider % |
|--------------|--------------|------------|------------|--------------|------------|
| $25 | $4.00 | $1.03 | $5.03 | $19.97 | 79.9% |
| $50 | $6.50 | $1.75 | $8.25 | $41.75 | 83.5% |
| $75 | $9.00 | $2.48 | $11.48 | $63.52 | 84.7% |
| $100 | $11.50 | $3.20 | $14.70 | $85.30 | 85.3% |
| $150 | $16.50 | $4.65 | $21.15 | $128.85 | 85.9% |
| $200 | $21.50 | $6.10 | $27.60 | $172.40 | 86.2% |
| $250 | $26.50 | $7.55 | $34.05 | $215.95 | 86.4% |
| $300 | $31.50 | $9.00 | $40.50 | $259.50 | 86.5% |
| $335 | $35.00 | $10.02 | $45.02 | $289.98 | 86.6% |
| $400 | $35.00 | $11.90 | $46.90 | $353.10 | 88.3% |
| $500 | $35.00 | $14.80 | $49.80 | $450.20 | 90.0% |
| $750 | $35.00 | $22.05 | $57.05 | $692.95 | 92.4% |
| $1,000 | $35.00 | $29.30 | $64.30 | $935.70 | 93.6% |
| $1,207 | $35.00 | $35.00 | $70.00 | $1,137.00 | 94.2% |
| $2,000 | $35.00 | $35.00 | $70.00 | $1,930.00 | 96.5% |
| $5,000 | $35.00 | $35.00 | $70.00 | $4,930.00 | 98.6% |

**Note:** Cap on platform fee kicks in at $335. Cap on Stripe kicks in at ~$1,207.

---

## Competitive Analysis

### vs Previous Model (15% flat)

| Service | Old (15%) | New (10%+$1.50) | Savings |
|---------|-----------|-----------------|---------|
| $50 | $7.50 | $6.50 | $1.00 (13%) |
| $100 | $15.00 | $11.50 | $3.50 (23%) |
| $200 | $30.00 | $21.50 | $8.50 (28%) |
| $500 | $75.00 | $35.00 | $40.00 (53%) |
| $1,000 | $150.00 | $35.00 | $115.00 (77%) |
| $2,000 | $300.00 | $35.00 | $265.00 (88%) |

### vs Zocdoc ($35-$110 per new patient booking)

| Scenario | Zocdoc | Findr | Advantage |
|----------|--------|-------|-----------|
| $100 service | $70 avg | $11.50 | Findr 84% cheaper |
| $200 service | $70 avg | $21.50 | Findr 69% cheaper |
| $500 service | $70 avg | $35.00 | Findr 50% cheaper |
| Repeat booking | $0 | $11.50-$35 | Zocdoc free for repeats |

**Key Differentiator:** Zocdoc charges per NEW patient only (regardless of service price). Findr charges per transaction but at much lower rates and with a cap.

### vs ClassPass (20-30% take rate)

| Service | ClassPass (25%) | Findr | Advantage |
|---------|-----------------|-------|-----------|
| $100 | $25.00 | $11.50 | Findr 54% cheaper |
| $200 | $50.00 | $21.50 | Findr 57% cheaper |
| $500 | $125.00 | $35.00 | Findr 72% cheaper |

### vs Mindbody ($139-$699/month subscription)

Findr has no monthly fee. Break-even analysis:
- At $139/mo Mindbody: Provider needs 12+ bookings/month on Findr to exceed
- At $299/mo Mindbody: Provider needs 26+ bookings/month on Findr to exceed

---

## Revenue Projections

### Per Transaction Revenue (Platform Fee Only)

| Service Tier | Avg Price | Platform Fee | Est. Volume % |
|--------------|-----------|--------------|---------------|
| Low ($25-$75) | $50 | $6.50 | 20% |
| Medium ($75-$200) | $125 | $14.00 | 40% |
| High ($200-$400) | $300 | $31.50 | 25% |
| Premium ($400+) | $600 | $35.00 | 15% |

**Weighted Average Platform Fee:** ~$20.38 per transaction

### Monthly Revenue Scenarios

| Monthly Transactions | Avg Fee | Monthly Revenue |
|---------------------|---------|-----------------|
| 100 | $20.38 | $2,038 |
| 500 | $20.38 | $10,190 |
| 1,000 | $20.38 | $20,380 |
| 5,000 | $20.38 | $101,900 |
| 10,000 | $20.38 | $203,800 |

---

## Strategic Rationale

### Why This Model?

1. **Lower barrier to entry** - 10% vs 15% is psychologically significant
2. **Cap rewards high-value providers** - Cosmetic, specialists, surgeons benefit most
3. **Fixed fee covers costs** - $1.50 ensures profitability on small transactions
4. **Simple to understand** - "10% + $1.50, never more than $35"
5. **Competitive positioning** - Undercuts all major competitors

### Target Provider Segments

| Segment | Typical Service | Platform Fee | Value Proposition |
|---------|-----------------|--------------|-------------------|
| Mental Health | $150 | $16.50 | Lower than industry avg |
| Primary Care | $100-$200 | $11.50-$21.50 | No monthly fees like competitors |
| Dental | $100-$500 | $11.50-$35 | Transparent, capped pricing |
| Cosmetic | $500-$5,000 | $35 cap | Massive savings vs percentage models |
| Fitness | $50-$150 | $6.50-$16.50 | Better than ClassPass 25% |

---

## Implementation Notes

### Legal Documents to Update
- [ ] Provider Participation Agreement v3 → v4
- [ ] Patient Terms of Service (if fee disclosure exists)
- [ ] Website/marketing fee disclosures

### UI/UX Updates
- [ ] Onboarding fee disclosure section
- [ ] Dashboard earnings calculator
- [ ] Agreement summary in signing flow

### Backend Updates
- [ ] Payment calculation logic
- [ ] Stripe Connect fee handling
- [ ] Reporting/analytics

---

## Risk Considerations

1. **Revenue reduction from existing model** - Offset by volume growth
2. **Cap exploitation** - Monitor for fee structuring (splitting transactions)
3. **Stripe fee pass-through clarity** - Ensure providers understand total fees

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CEO | | | |
| Finance | | | |
| Legal | | | |

---

*Document Version: 2.0*  
*Last Updated: January 2026*
