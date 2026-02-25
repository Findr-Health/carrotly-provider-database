# Findr Health Clarity Tool - Integration Plan

**Target:** Add to existing infrastructure  
**Backend:** fearless-achievement-production (Railway)  
**Frontend:** findrhealth.com (Vercel - first consumer feature)  
**Database:** Existing MongoDB Atlas (providers + users collections)

---

## Architecture After Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      FINDR HEALTH PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   findrhealth.com       provider.findrhealth    admin.findrhealth
│   (Consumer App)        (Provider Portal)       (Admin Dashboard)
│   NEW - Clarity Tool    EXISTING                EXISTING         │
│         │                    │                       │           │
│         └────────────────────┴───────────────────────┘           │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │        fearless-achievement-production.up.railway.app   │   │
│   │                                                         │   │
│   │   EXISTING ROUTES:           NEW ROUTES:                │   │
│   │   /api/providers             /api/clarity/analyze       │   │
│   │   /api/users                 /api/clarity/classify      │   │
│   │   /api/admin                 /api/clarity/price-check   │   │
│   │   /api/auth                  /api/clarity/expert-*      │   │
│   │                                                         │   │
│   │   NEW FILES TO ADD:                                     │   │
│   │   services/clarityService.js                            │   │
│   │   services/multiDocumentService.js                      │   │
│   │   services/geoPricingService.js                         │   │
│   │   routes/clarity.js                                     │   │
│   │   data/cptCodes.json, hcpcsCodes.json, etc.            │   │
│   │                                                         │   │
│   │   NEW ENV VAR:                                          │   │
│   │   ANTHROPIC_API_KEY=sk-ant-xxx                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    MongoDB Atlas                         │   │
│   │                                                         │   │
│   │   providers collection ← Clarity suggests trusted ones  │   │
│   │   users collection ← Track who's using Clarity          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration

### PART 1: Backend (Railway)

#### Step 1.1: Add Files to Your Backend Repository

In your `carrotly-provider-database` repo, add these files:

```
backend/
├── services/
│   ├── clarityService.js        ← NEW (main AI analysis)
│   ├── multiDocumentService.js  ← NEW (bill vs EOB comparison)
│   └── geoPricingService.js     ← NEW (regional pricing)
├── routes/
│   ├── clarity.js               ← NEW (all /api/clarity/* endpoints)
│   └── ... (your existing routes)
├── data/
│   ├── cptCodes.json            ← NEW (150+ procedure codes)
│   ├── hcpcsCodes.json          ← NEW (100+ supply codes)
│   ├── icd10Codes.json          ← NEW (200+ diagnosis codes)
│   ├── regionalPricing.json     ← NEW (price benchmarks)
│   ├── billingRules.json        ← NEW (anomaly detection)
│   └── clarityKnowledgeBase.json ← NEW (billing rules)
└── server.js                     ← MODIFY (add clarity routes)
```

#### Step 1.2: Install New Dependencies

```bash
cd backend
npm install @anthropic-ai/sdk multer --save
```

Your package.json should add:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

#### Step 1.3: Update server.js

Add to your existing server.js:

```javascript
// Near top with other requires
const clarityRoutes = require('./routes/clarity');

// With your other app.use() statements (after CORS, body-parser, etc.)
app.use('/api/clarity', clarityRoutes);

// Make sure db is available to routes (you may already have this)
// After mongoose connects:
mongoose.connection.once('open', () => {
  console.log('MongoDB connected');
  app.locals.db = mongoose.connection.db;
});
```

#### Step 1.4: Add Environment Variable in Railway

In Railway dashboard → Your project → Variables:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

#### Step 1.5: Update CORS for findrhealth.com

In your server.js, ensure CORS includes the consumer domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://findrhealth-provider.vercel.app',
    'https://admin-findrhealth-dashboard.vercel.app',
    'https://findrhealth.com',           // ADD THIS
    'https://www.findrhealth.com',       // ADD THIS
    'https://app.findrhealth.com',       // ADD THIS (if using subdomain)
  ],
  credentials: true
}));
```

#### Step 1.6: Deploy Backend

```bash
git add .
git commit -m "Add Healthcare Clarity Tool API"
git push origin main
# Railway auto-deploys
```

#### Step 1.7: Verify Backend

```bash
curl https://fearless-achievement-production.up.railway.app/api/clarity/health
```

Expected response:
```json
{
  "success": true,
  "service": "clarity",
  "status": "operational",
  "version": "1.1.0",
  "features": {
    "singleDocument": true,
    "multiDocument": true,
    "geoPricing": true,
    "expertConsult": true
  }
}
```

---

### PART 2: Frontend (Vercel)

#### Step 2.1: Add Consumer App to Your Vercel Project

Since Provider Portal and Admin Dashboard are under "findrhealth" in Vercel, add the consumer app the same way:

**Option A: Same repo, different directory**
If your Vercel project deploys from a monorepo:
```
findrhealth/
├── admin-dashboard/     ← deployed to admin.findrhealth.com
├── provider-portal/     ← deployed to provider.findrhealth.com  
└── consumer-app/        ← NEW: deploy to findrhealth.com
```

**Option B: Separate repo**
Create new repo `findr-health-consumer` and add to same Vercel team.

#### Step 2.2: Configure Vercel Build

In Vercel dashboard for the consumer app:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Root Directory | `consumer-app` (if monorepo) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

#### Step 2.3: Set Environment Variable

In Vercel → Project Settings → Environment Variables:

```
VITE_API_URL=https://fearless-achievement-production.up.railway.app
```

**Note:** No `/api` at the end - the app adds that.

#### Step 2.4: Configure Domain

In Vercel → Project Settings → Domains:

1. Add `findrhealth.com`
2. Add `www.findrhealth.com`
3. Follow DNS instructions if not already configured

#### Step 2.5: Deploy

Push to GitHub → Vercel auto-deploys

---

### PART 3: Database Integration

The Clarity Tool needs to:
1. **Read from `providers`** - To suggest trusted providers
2. **Read from `users`** - To know if someone is registered

#### Provider Suggestions Integration

The clarity routes already query `req.app.locals.db`. Update the provider suggestion logic in `routes/clarity.js`:

```javascript
// In /api/clarity/suggest-providers endpoint
router.post('/suggest-providers', async (req, res) => {
  try {
    const { analysisContext, category, userLocation } = req.body;
    const db = req.app.locals.db;
    
    if (!db) {
      return res.json({ success: true, providers: [] });
    }

    // Query your actual providers collection
    let query = { 
      status: 'approved',
      // Add location filtering if needed
    };
    
    // For billing issues, find patient advocates
    if (category === 'billing_dispute' || analysisContext?.hasBillingIssues) {
      query.$or = [
        { 'services.name': { $regex: /billing|advocacy|patient rights/i } },
        { specialty: { $regex: /patient advocate|billing specialist/i } },
        { tags: { $in: ['billing-help', 'patient-advocacy'] } }
      ];
    }

    const providers = await db.collection('providers')
      .find(query)
      .limit(5)
      .toArray();

    res.json({
      success: true,
      providers: providers.map(p => ({
        id: p._id,
        name: p.practiceName || p.name,
        specialty: p.specialty,
        location: p.location,
        phone: p.contactInfo?.phone || p.phone,
        profileUrl: `https://findrhealth.com/provider/${p._id}`
      }))
    });
  } catch (error) {
    console.error('[Clarity] Provider suggestion error:', error);
    res.status(500).json({ success: false, providers: [] });
  }
});
```

#### User Context Integration (Optional)

To track Clarity usage per user:

```javascript
// Add to analyze endpoint
router.post('/analyze', upload.single('document'), async (req, res) => {
  try {
    // ... existing code ...
    
    // Log usage (optional - for analytics)
    const db = req.app.locals.db;
    if (db && req.user?.id) {
      await db.collection('clarityUsage').insertOne({
        userId: req.user.id,
        documentType: result.documentType,
        timestamp: new Date(),
        // Don't store the actual document!
      });
    }
    
    // ... rest of code ...
  }
});
```

---

## Files to Copy

From the `findr-health-clarity.zip` package:

### To Your Backend (`carrotly-provider-database/backend/`)

| Source | Destination |
|--------|-------------|
| `backend/services/clarityService.js` | `services/clarityService.js` |
| `backend/services/multiDocumentService.js` | `services/multiDocumentService.js` |
| `backend/services/geoPricingService.js` | `services/geoPricingService.js` |
| `backend/routes/clarity.js` | `routes/clarity.js` |
| `backend/data/*` (all JSON files) | `data/` |

### Consumer App Options

**If adding to monorepo:**
| Source | Destination |
|--------|-------------|
| `consumer-app/*` | `your-monorepo/consumer-app/` |

**If separate repo:**
| Source | Destination |
|--------|-------------|
| `consumer-app/*` | New `findr-health-consumer` repo |

---

## Verification Checklist

### Backend ✓
- [ ] Files copied to `carrotly-provider-database/backend/`
- [ ] `npm install @anthropic-ai/sdk multer` run
- [ ] `server.js` updated with clarity routes
- [ ] `ANTHROPIC_API_KEY` added in Railway
- [ ] CORS updated for findrhealth.com
- [ ] Deployed and health check passes

### Frontend ✓
- [ ] Consumer app added to Vercel
- [ ] `VITE_API_URL` set to Railway URL
- [ ] Domain configured (findrhealth.com)
- [ ] SSL certificate active

### Integration ✓
- [ ] Can upload document and get analysis
- [ ] Provider suggestions show real providers
- [ ] Expert consult request works

---

## Quick Commands Summary

```bash
# Backend
cd carrotly-provider-database/backend
npm install @anthropic-ai/sdk multer
# Copy files from package
git add .
git commit -m "Add Healthcare Clarity Tool"
git push

# Test
curl https://fearless-achievement-production.up.railway.app/api/clarity/health
```

---

## Domain Structure After Launch

| URL | Purpose |
|-----|---------|
| `findrhealth.com` | Consumer app (Clarity Tool) |
| `provider.findrhealth.com` | Provider Portal |
| `admin.findrhealth.com` | Admin Dashboard |
| `api.findrhealth.com` | (Optional) API subdomain |

---

## Support

If you hit issues:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend build errors
3. Verify CORS allows the domain
4. Verify ANTHROPIC_API_KEY is set correctly

---

*Integration plan for Findr Health existing infrastructure*
*December 23, 2025*
