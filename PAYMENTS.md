# PAYMENTS.md — Checkout & Funds Flow

## Gateway
- Stripe Connect (Standard/Express)
- Tokenized payments; Apple Pay/Google Pay

## Funds Flow
- 0% platform fee at pilot; configurable take rate post-pilot
- Settlement to provider; holds for disputes
- Refunds: partial/full; fees netted; tax handling (Stripe Tax optional)

## Compliance
- PCI SAQ-A; SCA/3DS where applicable
- Receipts/Statements branding
- Disputes webhook & dashboard