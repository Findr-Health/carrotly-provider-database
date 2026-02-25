# System Integration Map - How The 4 Systems Connect

**Purpose:** Understand how findr-health-mobile, backend, admin dashboard, and provider portal interact

---

## THE FOUR SYSTEMS

```
┌──────────────────────┐
│ 1. MOBILE APP        │ ← Users interact here
│    findr-health-     │
│    mobile            │
└──────────┬───────────┘
           │
           │ REST API calls
           │
┌──────────▼───────────┐
│ 2. BACKEND +         │ ← Business logic
│    DATABASE          │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐  ┌──▼──────────────┐
│3. ADMIN │  │4. PROVIDER      │
│DASHBOARD│  │   PORTAL        │
│         │  │   (NOT USED)    │
└─────────┘  └─────────────────┘
```

**Key Point:** Provider portal is NOT involved. Offshore team calls providers directly via phone.

---

## COMPLETE USER FLOW

### Step 1: User Authorizes

**Mobile App:**
- User sees Clarity Price analysis
- Taps "Negotiate For Me" button
- Adds/selects payment method
- Confirms authorization

**Backend:**
- Receives: POST /api/negotiations/initiate
- Saves payment token (Stripe)
- Creates negotiation record in database
- Returns: negotiation_id

**Database:**
```sql
INSERT INTO bill_negotiations
(id, user_id, bill_id, status, stripe_payment_method_id, ...)
```

---

### Step 2: Offshore Team Works Case

**Admin Dashboard:**
- Shows queue of pending negotiations
- Team member assigns case to self
- Views provider contact info (from bill)

**Team Member Action (EXTERNAL):**
- **Calls provider** via phone (not through portal)
- Negotiates over 3-7 days
- Returns to dashboard to update status

**Admin Dashboard:**
- Team updates: status = 'success', negotiated_amount = $140
- Calls: PATCH /api/admin/negotiations/:id/status

**Backend:**
- Updates database
- Triggers notification to user

---

### Step 3: User Pays

**Backend:**
- Sends push notification: "We saved you $85!"
- Sends email with details

**Mobile App:**
- User taps notification
- Sees success screen with breakdown
- Taps "Pay Now"
- Goes to checkout (existing flow)

**Backend:**
- Receives: POST /api/negotiations/:id/process-payment
- Charges saved Stripe payment method (off_session)
- Updates status to 'paid'

---

## DATA FLOW

### What Each System Needs

**Mobile App needs:**
- Bill data (from Clarity Price analysis)
- Negotiation status updates
- Payment breakdown for checkout
- Push notification handling

**Backend needs:**
- Stripe integration (tokenize + charge)
- Notification service (push + email)
- Negotiation state management
- Admin authentication

**Admin Dashboard needs:**
- Queue of pending cases
- Provider contact info
- Status update forms
- Activity logging

**Provider Portal needs:**
- NOTHING (not used for this feature)

---

## API ENDPOINTS OVERVIEW

### User-Facing (Mobile → Backend)

```
POST   /api/negotiations/initiate
       Body: { bill_id, payment_method_token }
       Returns: { negotiation_id, status }

GET    /api/negotiations/:id
       Returns: { status, timeline, amounts }

POST   /api/negotiations/:id/process-payment
       Body: { confirm: true }
       Returns: { payment_status, receipt }
```

### Admin-Facing (Dashboard → Backend)

```
GET    /api/admin/negotiations/queue
       Returns: [{ id, provider, amount, status }, ...]

PATCH  /api/admin/negotiations/:id/assign
       Body: { team_member_id }

PATCH  /api/admin/negotiations/:id/status
       Body: { status: 'success', negotiated_amount: 14000 }
```

---

## DATABASE TABLES

### New Table: bill_negotiations

```
id                        (Primary Key)
user_id                   (Foreign Key → users)
bill_id                   (Foreign Key → bills)
status                    (initiated, in_progress, success, failed, paid)
original_bill_amount      (cents)
negotiated_bill_amount    (cents, nullable)
savings_amount            (cents, nullable)
success_fee_amount        (cents, nullable)
total_charge_amount       (cents, nullable)
stripe_payment_method_id  (saved token)
stripe_payment_intent_id  (for actual charge)
assigned_to_user_id       (Foreign Key → admin_users)
created_at
updated_at
completed_at
```

### Existing Tables Used

- **users** - User info, email
- **bills** - Uploaded bills, Clarity Price analysis
- **admin_users** - Offshore team members (might need to create)

---

## EXTERNAL INTEGRATIONS

### Stripe
- **What:** Payment processing
- **When:** User authorizes (save method), negotiation succeeds (charge)
- **How:** Stripe SDK in backend
- **Key feature:** `off_session: true` for delayed charging

### Firebase Cloud Messaging
- **What:** Push notifications (Android)
- **When:** Negotiation succeeds/fails
- **How:** Firebase Admin SDK in backend

### Apple Push Notification Service
- **What:** Push notifications (iOS)
- **When:** Negotiation succeeds/fails
- **How:** APNs certificates + Firebase

### Email Service (SendGrid/Mailgun)
- **What:** Email notifications
- **When:** Success, failure, payment receipts
- **How:** REST API from backend

---

## SECURITY CONSIDERATIONS

**Payment Data:**
- ❌ Never store raw card numbers
- ✅ Store only Stripe tokens
- ✅ Transmit over HTTPS only

**Bill Images:**
- ✅ Encrypt at rest (PHI - protected health information)
- ✅ Access logged for HIPAA compliance

**Admin Access:**
- ✅ Role-based permissions
- ✅ Audit trail for all actions

---

## WHAT'S NOT IN SCOPE

This feature does NOT:
- ❌ Integrate with provider portal (team calls directly)
- ❌ Automate negotiation (all manual via offshore team)
- ❌ Handle bills over $10,000 (cap for v1)
- ❌ Support non-US providers (initially)

---

**Next:** Read `03-FEATURE-REQUIREMENTS.md` for user stories
