# Findr Health Admin Dashboard Enhancements
## Analytics Dashboard + User Roles & Permissions

**Document Created:** December 29, 2025  
**Purpose:** Specification for admin dashboard enhancements

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Analytics Dashboard Specification](#2-analytics-dashboard-specification)
3. [User Roles & Permissions (RBAC)](#3-user-roles--permissions-rbac)
4. [MongoDB Schema Designs](#4-mongodb-schema-designs)
5. [API Endpoints](#5-api-endpoints)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Current State Assessment

### What Exists Today

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Login | ✅ Built | JWT-based, single admin type |
| Provider CRUD | ✅ Built | Full management |
| Services Management | ✅ Built | Per-provider |
| Basic Stats | ✅ Built | Provider counts only |
| Dashboard | ✅ Built | Minimal - just provider counts |

### Current Dashboard Stats (from `/admin/dashboard/stats`)

```javascript
{
  providers: {
    total: 150,
    approved: 120,
    pending: 20,
    rejected: 5,
    draft: 5
  },
  recentProviders: [...],
  providersByType: [
    { _id: 'medical', count: 45 },
    { _id: 'dental', count: 30 },
    // ...
  ]
}
```

### What's Missing

- **No consumer/user tracking** - Can't see app users
- **No booking analytics** - No transaction data
- **No search analytics** - Don't know what users search for
- **No revenue metrics** - No financial visibility
- **No AI usage metrics** - Clarity AI engagement unknown
- **Single admin role** - No permission differentiation
- **No audit logging** - No action history

---

## 2. Analytics Dashboard Specification

### 2.1 Overview Metrics (Top Cards)

Display these KPIs at the top of the analytics page:

| Metric | Description | Source |
|--------|-------------|--------|
| **Total Users** | Registered app users | Django User model |
| **Active Users (30d)** | Users with activity in last 30 days | Django sessions |
| **Total Bookings** | All-time booking count | Django Booking model |
| **Bookings (30d)** | Bookings in last 30 days | Django Booking model |
| **Total Revenue** | Gross transaction value | Stripe/Django |
| **Revenue (30d)** | Revenue in last 30 days | Stripe/Django |
| **Approved Providers** | Active marketplace providers | MongoDB Provider |
| **AI Conversations** | Clarity AI chat sessions | MongoDB |

### 2.2 Charts & Visualizations

#### Chart 1: Bookings Over Time
- **Type:** Line chart
- **X-Axis:** Date (last 30 days, daily)
- **Y-Axis:** Number of bookings
- **Lines:** Total bookings, Completed, Cancelled
- **Filter:** Date range selector

#### Chart 2: Revenue Over Time
- **Type:** Area chart
- **X-Axis:** Date (last 30 days)
- **Y-Axis:** Revenue ($)
- **Data:** Daily gross revenue
- **Filter:** Date range selector

#### Chart 3: User Acquisition
- **Type:** Line chart
- **X-Axis:** Date (last 30 days)
- **Y-Axis:** New user signups
- **Filter:** Date range selector

#### Chart 4: Provider Distribution by Type
- **Type:** Donut chart
- **Segments:** Medical, Dental, Skincare, Wellness, etc.
- **Data:** Count of approved providers per category

#### Chart 5: Top Searched Terms
- **Type:** Horizontal bar chart
- **Y-Axis:** Search term
- **X-Axis:** Search count
- **Data:** Top 10 search queries in last 30 days

#### Chart 6: Booking Completion Funnel
- **Type:** Funnel chart
- **Stages:**
  1. Provider views
  2. Service selected
  3. Booking started
  4. Payment initiated
  5. Booking confirmed
- **Shows:** Drop-off at each stage

#### Chart 7: Clarity AI Usage
- **Type:** Bar chart
- **X-Axis:** Day of week
- **Y-Axis:** Number of conversations
- **Data:** AI chat sessions by day

#### Chart 8: Top Services Booked
- **Type:** Horizontal bar chart
- **Data:** Top 10 services by booking count

### 2.3 Tables & Lists

#### Table 1: Recent Transactions
| Column | Description |
|--------|-------------|
| Date | Transaction timestamp |
| User | Customer name/email |
| Provider | Provider name |
| Service | Service booked |
| Amount | Transaction value |
| Status | completed/refunded/pending |

#### Table 2: Top Providers by Revenue
| Column | Description |
|--------|-------------|
| Rank | Position |
| Provider | Provider name |
| Bookings | Total booking count |
| Revenue | Gross revenue |
| Avg Rating | Average review score |

#### Table 3: Top Providers by Bookings
| Column | Description |
|--------|-------------|
| Rank | Position |
| Provider | Provider name |
| Bookings | Total booking count |
| Category | Provider type |

#### Table 4: Recent AI Conversations
| Column | Description |
|--------|-------------|
| Date | Conversation timestamp |
| User | User identifier |
| Messages | Message count |
| Topics | Detected topics |
| Feedback | Thumbs up/down ratio |

### 2.4 Analytics Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                        [Date Range Picker]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Users     │ │ Bookings  │ │ Revenue   │ │ Providers │       │
│  │ 12,456    │ │ 3,421     │ │ $125,430  │ │ 156       │       │
│  │ ↑ 12%     │ │ ↑ 8%      │ │ ↑ 15%     │ │ ↑ 5       │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                 │
│  ┌────────────────────────────────┐ ┌─────────────────────────┐ │
│  │ Bookings Over Time             │ │ Provider Distribution   │ │
│  │ [LINE CHART]                   │ │ [DONUT CHART]           │ │
│  │                                │ │                         │ │
│  └────────────────────────────────┘ └─────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────┐ ┌─────────────────────────┐ │
│  │ Revenue Over Time              │ │ Top Searches            │ │
│  │ [AREA CHART]                   │ │ [BAR CHART]             │ │
│  │                                │ │                         │ │
│  └────────────────────────────────┘ └─────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Recent Transactions                         [View All →] │   │
│  │ ────────────────────────────────────────────────────────│   │
│  │ Date       User           Provider        Amount  Status│   │
│  │ 12/29     john@email.com  Elite Skincare  $150   ✓     │   │
│  │ 12/29     jane@email.com  Aspen Dental    $200   ✓     │   │
│  │ 12/28     bob@email.com   Yoga Studio     $75    ✓     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Chat Analytics                           [View All →] │   │
│  │ ────────────────────────────────────────────────────────│   │
│  │ Sessions: 1,234  │  Avg Messages: 4.2  │  Feedback: 89% │   │
│  │                                                          │   │
│  │ Top Questions:                                           │   │
│  │ • How much does an MRI cost? (156)                       │   │
│  │ • Insurance vs cash pay (134)                            │   │
│  │ • Dentist near me (98)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Permissions (RBAC)

### 3.1 Role Definitions

#### Role 1: Super Admin
- **Who:** Platform owners, executives
- **Access:** Full access to everything
- **Permissions:**
  - All Provider operations
  - All User management
  - All Analytics (including revenue)
  - Admin user management
  - System settings
  - Audit logs
  - API keys management

#### Role 2: Admin
- **Who:** Full-time operations staff
- **Access:** Day-to-day operations
- **Permissions:**
  - All Provider operations
  - View users (no delete)
  - View analytics (no revenue details)
  - View audit logs (own actions only)
  - Cannot manage other admins

#### Role 3: Moderator
- **Who:** Content reviewers, part-time staff
- **Access:** Provider review only
- **Permissions:**
  - View providers
  - Approve/Reject providers
  - Add admin notes
  - Cannot edit provider details
  - Cannot view users
  - Cannot view analytics

#### Role 4: Support
- **Who:** Customer support team
- **Access:** Read-only + limited actions
- **Permissions:**
  - View providers (read-only)
  - View users (read-only)
  - View bookings (read-only)
  - Add notes to providers
  - Cannot approve/reject
  - Cannot view analytics

#### Role 5: Analyst
- **Who:** Business analysts, reporting
- **Access:** Analytics only
- **Permissions:**
  - View all analytics
  - Export reports
  - Cannot modify any data
  - Cannot view user PII

### 3.2 Permission Matrix

| Permission | Super Admin | Admin | Moderator | Support | Analyst |
|------------|:-----------:|:-----:|:---------:|:-------:|:-------:|
| **Providers** |
| View providers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create providers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit providers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete providers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve/Reject | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add notes | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Users** |
| View users | ✅ | ✅ | ❌ | ✅ | ❌ |
| View user PII | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bookings** |
| View bookings | ✅ | ✅ | ❌ | ✅ | ❌ |
| Cancel bookings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Refund bookings | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Analytics** |
| View basic stats | ✅ | ✅ | ❌ | ❌ | ✅ |
| View revenue | ✅ | ❌ | ❌ | ❌ | ✅ |
| Export reports | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Admin Management** |
| View admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System** |
| View audit logs | ✅ | ✅* | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| API keys | ✅ | ❌ | ❌ | ❌ | ❌ |

*Admin can only view their own audit logs

### 3.3 Users & Roles Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Users & Roles                                    [+ Add User]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tabs: [All Users] [Super Admins] [Admins] [Moderators] [...]  │
│                                                                 │
│  Search: [_____________________] [Role ▼] [Status ▼] [Search]   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌─────┐  admin@findrhealth.com                         │   │
│  │  │ 👤 │  Tim Wetherill                   [Super Admin]  │   │
│  │  └─────┘  Created: Jan 1, 2025  •  Last login: Today    │   │
│  │           Status: ● Active              [Edit] [...]    │   │
│  │                                                          │   │
│  ├──────────────────────────────────────────────────────────│   │
│  │                                                          │   │
│  │  ┌─────┐  sarah@findrhealth.com                         │   │
│  │  │ 👤 │  Sarah Johnson                       [Admin]    │   │
│  │  └─────┘  Created: Mar 15, 2025  •  Last login: 2h ago  │   │
│  │           Status: ● Active              [Edit] [...]    │   │
│  │                                                          │   │
│  ├──────────────────────────────────────────────────────────│   │
│  │                                                          │   │
│  │  ┌─────┐  mike@findrhealth.com                          │   │
│  │  │ 👤 │  Mike Chen                       [Moderator]    │   │
│  │  └─────┘  Created: Jun 1, 2025  •  Last login: 1d ago   │   │
│  │           Status: ● Active              [Edit] [...]    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Showing 1-10 of 15 users              [← Prev] [1] [2] [Next →]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Add/Edit User Modal

```
┌─────────────────────────────────────────────┐
│ Add New Admin User                     [X]  │
├─────────────────────────────────────────────┤
│                                             │
│  Full Name *                                │
│  [_________________________________]        │
│                                             │
│  Email *                                    │
│  [_________________________________]        │
│                                             │
│  Role *                                     │
│  [Select Role                          ▼]   │
│    ○ Super Admin                            │
│    ○ Admin                                  │
│    ○ Moderator                              │
│    ○ Support                                │
│    ○ Analyst                                │
│                                             │
│  Temporary Password *                       │
│  [_________________________________]        │
│  □ Require password change on first login   │
│                                             │
│  Status                                     │
│  ○ Active  ○ Inactive                       │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│           [Cancel]  [Create User]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4. MongoDB Schema Designs

### 4.1 Enhanced Admin Schema

```javascript
// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'support', 'analyst'],
    default: 'admin',
    required: true
  },
  
  // Custom permissions override (optional)
  customPermissions: {
    providers: {
      view: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
      approve: { type: Boolean }
    },
    users: {
      view: { type: Boolean },
      viewPII: { type: Boolean },
      delete: { type: Boolean }
    },
    bookings: {
      view: { type: Boolean },
      cancel: { type: Boolean },
      refund: { type: Boolean }
    },
    analytics: {
      viewBasic: { type: Boolean },
      viewRevenue: { type: Boolean },
      export: { type: Boolean }
    },
    admins: {
      view: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean }
    },
    system: {
      viewAuditLogs: { type: Boolean },
      settings: { type: Boolean },
      apiKeys: { type: Boolean }
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Security
  passwordChangedAt: Date,
  requirePasswordChange: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  
  // Activity Tracking
  lastLoginAt: Date,
  lastLoginIP: String,
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String,
    success: Boolean
  }],
  
  // Profile
  avatar: String,
  phone: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ status: 1 });

module.exports = mongoose.model('Admin', adminSchema);
```

### 4.2 Audit Log Schema

```javascript
// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminEmail: String,
  adminName: String,
  adminRole: String,
  
  // What action was performed
  action: {
    type: String,
    enum: [
      // Provider actions
      'provider.create',
      'provider.update',
      'provider.delete',
      'provider.approve',
      'provider.reject',
      'provider.suspend',
      
      // Service actions
      'service.create',
      'service.update',
      'service.delete',
      
      // Admin actions
      'admin.create',
      'admin.update',
      'admin.delete',
      'admin.role_change',
      'admin.status_change',
      
      // Auth actions
      'auth.login',
      'auth.logout',
      'auth.login_failed',
      'auth.password_change',
      
      // Booking actions
      'booking.cancel',
      'booking.refund',
      
      // System actions
      'system.settings_change',
      'system.export_data'
    ],
    required: true
  },
  
  // What resource was affected
  resourceType: {
    type: String,
    enum: ['provider', 'service', 'admin', 'user', 'booking', 'system'],
    required: true
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,
  
  // Change details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Context
  ip: String,
  userAgent: String,
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Optional notes
  notes: String
});

// Indexes for efficient querying
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

### 4.3 Analytics Event Schema

```javascript
// models/AnalyticsEvent.js
const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    enum: [
      // Search events
      'search.query',
      'search.filter',
      'search.result_click',
      
      // Provider events
      'provider.view',
      'provider.favorite',
      'provider.unfavorite',
      'provider.share',
      
      // Booking events
      'booking.start',
      'booking.service_select',
      'booking.time_select',
      'booking.payment_start',
      'booking.payment_complete',
      'booking.payment_fail',
      'booking.cancel',
      
      // AI events
      'ai.conversation_start',
      'ai.message_sent',
      'ai.message_received',
      'ai.feedback_positive',
      'ai.feedback_negative',
      'ai.document_upload',
      'ai.calculator_trigger',
      
      // App events
      'app.open',
      'app.background',
      'app.foreground'
    ],
    required: true,
    index: true
  },
  
  // User context (anonymous or identified)
  userId: String,
  sessionId: String,
  isAnonymous: {
    type: Boolean,
    default: true
  },
  
  // Event data
  data: {
    // Search specific
    searchQuery: String,
    searchFilters: mongoose.Schema.Types.Mixed,
    searchResultCount: Number,
    
    // Provider specific
    providerId: mongoose.Schema.Types.ObjectId,
    providerName: String,
    providerCategory: String,
    
    // Service specific
    serviceId: mongoose.Schema.Types.ObjectId,
    serviceName: String,
    servicePrice: Number,
    
    // Booking specific
    bookingId: mongoose.Schema.Types.ObjectId,
    bookingAmount: Number,
    bookingStatus: String,
    
    // AI specific
    conversationId: String,
    messageCount: Number,
    aiTopic: String,
    feedbackType: String,
    
    // Generic
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Context
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    default: 'ios'
  },
  appVersion: String,
  deviceInfo: mongoose.Schema.Types.Mixed,
  
  // Location (for regional analytics)
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for common queries
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ 'data.providerId': 1, eventType: 1 });
analyticsEventSchema.index({ 'data.searchQuery': 1, timestamp: -1 });

// TTL index - auto-delete events older than 90 days (optional)
// analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
```

### 4.4 Daily Aggregates Schema (for fast dashboard queries)

```javascript
// models/DailyStats.js
const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
  // Date (stored as start of day UTC)
  date: {
    type: Date,
    required: true,
    unique: true
  },
  
  // User metrics
  users: {
    newSignups: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 }
  },
  
  // Provider metrics
  providers: {
    newProviders: { type: Number, default: 0 },
    approved: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    totalApproved: { type: Number, default: 0 }
  },
  
  // Booking metrics
  bookings: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 }
  },
  
  // Revenue metrics
  revenue: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    fees: { type: Number, default: 0 }
  },
  
  // Search metrics
  searches: {
    totalSearches: { type: Number, default: 0 },
    uniqueSearchers: { type: Number, default: 0 },
    topQueries: [{
      query: String,
      count: Number
    }]
  },
  
  // AI metrics
  ai: {
    conversations: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    documentsAnalyzed: { type: Number, default: 0 },
    calculatorUses: { type: Number, default: 0 },
    positiveFeedback: { type: Number, default: 0 },
    negativeFeedback: { type: Number, default: 0 }
  },
  
  // Provider breakdown
  providersByType: [{
    type: String,
    count: Number
  }],
  
  // Booking by category
  bookingsByCategory: [{
    category: String,
    count: Number,
    revenue: Number
  }],
  
  // Metadata
  computedAt: {
    type: Date,
    default: Date.now
  }
});

dailyStatsSchema.index({ date: -1 });

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
```

---

## 5. API Endpoints

### 5.1 Analytics Endpoints

```javascript
// GET /api/admin/analytics/overview
// Returns: Top-level KPI metrics
{
  users: { total: 12456, active30d: 4521, growth: 12.5 },
  bookings: { total: 3421, last30d: 856, growth: 8.2 },
  revenue: { total: 125430, last30d: 34560, growth: 15.1 },
  providers: { total: 156, approved: 142, pending: 10 },
  ai: { conversations: 2341, avgMessages: 4.2, feedbackScore: 89 }
}

// GET /api/admin/analytics/bookings?startDate=X&endDate=Y
// Returns: Daily booking data for charts
{
  data: [
    { date: '2025-12-01', total: 45, completed: 40, cancelled: 5 },
    { date: '2025-12-02', total: 52, completed: 48, cancelled: 4 },
    // ...
  ]
}

// GET /api/admin/analytics/revenue?startDate=X&endDate=Y
// Returns: Daily revenue data
{
  data: [
    { date: '2025-12-01', gross: 4520, net: 4068, refunds: 150 },
    // ...
  ]
}

// GET /api/admin/analytics/users?startDate=X&endDate=Y
// Returns: User acquisition data
{
  data: [
    { date: '2025-12-01', newUsers: 45, activeUsers: 234 },
    // ...
  ]
}

// GET /api/admin/analytics/searches?limit=10&startDate=X&endDate=Y
// Returns: Top search queries
{
  data: [
    { query: 'dentist near me', count: 156 },
    { query: 'dermatologist', count: 134 },
    { query: 'MRI cost', count: 98 },
    // ...
  ]
}

// GET /api/admin/analytics/top-providers?metric=revenue&limit=10
// Returns: Top providers by metric
{
  data: [
    { id: 'x', name: 'Elite Skincare', bookings: 234, revenue: 23400 },
    // ...
  ]
}

// GET /api/admin/analytics/ai?startDate=X&endDate=Y
// Returns: AI usage metrics
{
  summary: { conversations: 1234, avgMessages: 4.2, feedbackScore: 89 },
  daily: [
    { date: '2025-12-01', conversations: 45, messages: 189, positive: 38, negative: 5 },
    // ...
  ],
  topQuestions: [
    { question: 'How much does an MRI cost?', count: 156 },
    // ...
  ]
}

// GET /api/admin/analytics/transactions?page=1&limit=20
// Returns: Recent transactions list
{
  transactions: [
    { date: '2025-12-29T14:30:00Z', user: 'john@email.com', provider: 'Elite Skincare', amount: 150, status: 'completed' },
    // ...
  ],
  pagination: { page: 1, limit: 20, total: 3421 }
}
```

### 5.2 Admin User Management Endpoints

```javascript
// GET /api/admin/admins
// Returns: List of admin users (super_admin only)
{
  admins: [
    { id: 'x', email: 'admin@findr.com', name: 'Tim', role: 'super_admin', status: 'active', lastLogin: '2025-12-29T10:00:00Z' },
    // ...
  ],
  pagination: { page: 1, limit: 20, total: 15 }
}

// GET /api/admin/admins/:id
// Returns: Single admin details

// POST /api/admin/admins
// Body: { email, name, role, password, requirePasswordChange }
// Creates new admin user

// PUT /api/admin/admins/:id
// Body: { name, role, status, customPermissions }
// Updates admin user

// DELETE /api/admin/admins/:id
// Deletes admin user (super_admin only)

// POST /api/admin/admins/:id/reset-password
// Triggers password reset email

// GET /api/admin/admins/:id/activity
// Returns: Admin's recent activity/audit log
```

### 5.3 Audit Log Endpoints

```javascript
// GET /api/admin/audit-logs?adminId=X&action=Y&startDate=X&endDate=Y&page=1
// Returns: Filtered audit logs
{
  logs: [
    { 
      id: 'x',
      admin: { id: 'y', email: 'admin@findr.com', name: 'Tim' },
      action: 'provider.approve',
      resource: { type: 'provider', id: 'z', name: 'Elite Skincare' },
      timestamp: '2025-12-29T14:30:00Z',
      ip: '192.168.1.1'
    },
    // ...
  ],
  pagination: { page: 1, limit: 50, total: 1234 }
}
```

---

## 6. Implementation Plan

### Phase 1: Database & Backend (Days 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Update Admin schema with roles | High | 2 hrs |
| Create AuditLog schema | High | 1 hr |
| Create AnalyticsEvent schema | High | 1 hr |
| Create DailyStats schema | Medium | 1 hr |
| Add permission middleware | High | 3 hrs |
| Update existing admin routes with permissions | High | 2 hrs |

### Phase 2: Analytics Backend (Days 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Create analytics aggregation functions | High | 4 hrs |
| Build /analytics/overview endpoint | High | 2 hrs |
| Build /analytics/bookings endpoint | High | 2 hrs |
| Build /analytics/revenue endpoint | High | 2 hrs |
| Build /analytics/searches endpoint | Medium | 2 hrs |
| Build /analytics/ai endpoint | Medium | 2 hrs |
| Build /analytics/transactions endpoint | Medium | 2 hrs |
| Create daily stats cron job | Medium | 3 hrs |

### Phase 3: Admin Management Backend (Day 5)

| Task | Priority | Effort |
|------|----------|--------|
| Build admin CRUD endpoints | High | 3 hrs |
| Build audit log endpoints | High | 2 hrs |
| Add audit logging to all admin actions | High | 3 hrs |

### Phase 4: Frontend - Analytics (Days 6-8)

| Task | Priority | Effort |
|------|----------|--------|
| Create Analytics page layout | High | 2 hrs |
| Build KPI cards component | High | 2 hrs |
| Add chart library (Recharts) | High | 1 hr |
| Build bookings line chart | High | 2 hrs |
| Build revenue area chart | High | 2 hrs |
| Build provider distribution donut | Medium | 2 hrs |
| Build top searches bar chart | Medium | 2 hrs |
| Build transactions table | High | 3 hrs |
| Build AI metrics section | Medium | 2 hrs |
| Add date range picker | High | 2 hrs |

### Phase 5: Frontend - Users & Roles (Days 9-10)

| Task | Priority | Effort |
|------|----------|--------|
| Create Users list page | High | 3 hrs |
| Build user card component | High | 2 hrs |
| Build Add/Edit user modal | High | 3 hrs |
| Add role-based UI hiding | High | 3 hrs |
| Build user detail view | Medium | 2 hrs |
| Build activity/audit section | Medium | 2 hrs |

### Phase 6: Testing & Polish (Day 11-12)

| Task | Priority | Effort |
|------|----------|--------|
| Test all permission scenarios | High | 4 hrs |
| Test analytics accuracy | High | 3 hrs |
| Add loading states | Medium | 2 hrs |
| Add error handling | Medium | 2 hrs |
| Mobile responsiveness | Medium | 2 hrs |

---

## Next Steps

1. **Confirm data sources:**
   - Do you have access to Django booking/user data via API?
   - Should analytics pull from Django or should we create a data sync?

2. **Confirm scope:**
   - Build analytics on Node.js/MongoDB (tracking events ourselves)?
   - OR integrate with Django analytics (if they have it)?

3. **Design approval:**
   - Review the layouts above
   - Any additional metrics you want?

4. **Start building:**
   - Once confirmed, I can generate the complete backend code
   - Then the React frontend components

---

**Ready to start building when you confirm the approach!**
