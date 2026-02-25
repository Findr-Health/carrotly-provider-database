# Findr Health - Clarity Platform
## Phase 2 Development Summary

**Document Date:** December 28, 2025  
**Platform:** Findr Health Clarity - Healthcare Cost Transparency Tool  
**URLs:**
- Consumer App: https://clarity.findrhealth.com
- Admin Dashboard: https://admin.findrhealth.com
- Backend API: https://fearless-achievement-production.up.railway.app

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 2A: Core Infrastructure](#phase-2a-core-infrastructure)
3. [Phase 2B: Admin Infrastructure](#phase-2b-admin-infrastructure)
4. [Phase 2C: Database Expansion](#phase-2c-database-expansion)
5. [Phase 2D: Calculator & Feedback System](#phase-2d-calculator--feedback-system)
6. [Technical Architecture](#technical-architecture)
7. [File Inventory](#file-inventory)
8. [Known Issues & Limitations](#known-issues--limitations)
9. [Future Engineering Upgrades](#future-engineering-upgrades)
10. [Phase 3 Roadmap](#phase-3-roadmap)

---

## Executive Summary

Phase 2 transformed Clarity from a basic chat interface into a comprehensive healthcare decision-support platform. Key achievements include:

- **Healthcare Financial Risk Calculator** - Personalized insurance vs cash-pay analysis
- **Intelligent Research Assistance** - Industry benchmarks, quality standards, market context
- **User Feedback System** - Thumbs up/down, copy, retry functionality
- **Admin Dashboard** - Feedback monitoring with stats and trends
- **Conversation History** - 10-message context for continuity
- **Geolocation Services** - Location-aware pricing and recommendations

### Impact Metrics (Projected)

| Metric | Before Phase 2 | After Phase 2 |
|--------|---------------|---------------|
| AI Response Helpfulness | 10-15% | 80-95% |
| User Engagement | Basic Q&A | Personalized analysis |
| Admin Visibility | None | Full feedback dashboard |
| Calculator Accuracy | N/A | 80%+ with public data |

---

## Phase 2A: Core Infrastructure

### Conversation History

**Purpose:** Maintain context across multi-turn conversations

**Implementation:**
- Last 10 messages stored and sent with each request
- Enables follow-up questions without re-explaining
- Improves recommendation personalization

**Files Modified:**
- `backend/routes/clarity.js` - History handling
- `consumer-app/src/pages/ClarityChat.jsx` - Message state management
- `consumer-app/src/services/clarityApi.js` - API integration

### Geolocation Services

**Purpose:** Location-aware pricing and provider recommendations

**Implementation:**
- Browser-based geolocation (navigator.geolocation)
- OpenStreetMap Nominatim for reverse geocoding
- State detection for insurance pricing
- ZIP code parsing from user input

**Features:**
- Automatic location detection on app load
- Manual location input ("I live in Davis, CA")
- State-specific premium multipliers
- Regional provider recommendations

**Files:**
- `consumer-app/src/services/clarityApi.js` - Location functions
- `backend/routes/clarity.js` - Location context handling

---

## Phase 2B: Admin Infrastructure

### MongoDB Models

**Purpose:** Data persistence for admin operations

**Models Created:**

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Inquiry | User questions log | query, response, timestamp, userId |
| Service | Healthcare services | name, category, avgCost, description |
| Provider | Healthcare providers | name, specialty, location, pricing |
| Pricing | Cost benchmarks | service, region, lowPrice, highPrice |
| Feedback | User feedback | rating, aiResponse, userPrompt, status |

### CRUD API Endpoints

**Base URL:** `/api/clarity-admin/`

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/inquiries` | GET, POST | User inquiry management |
| `/services` | GET, POST, PUT, DELETE | Service catalog |
| `/providers` | GET, POST, PUT, DELETE | Provider database |
| `/pricing` | GET, POST, PUT, DELETE | Pricing benchmarks |
| `/feedback` | GET, PATCH, DELETE | Feedback management |

---

## Phase 2C: Database Expansion

### Wellness & Cosmetic Services

**Purpose:** Expand beyond medical to include wellness, fitness, and cosmetic services

**Categories Added:**
- Med Spa (Botox, fillers, laser treatments)
- Dental (implants, veneers, orthodontics)
- Vision (LASIK, cataract surgery)
- Mental Health (therapy, psychiatry)
- Fitness & Wellness (personal training, nutrition)
- Hair Restoration (transplants, PRP)
- Weight Loss (bariatric surgery, medical programs)

**Data Points Per Service:**
- National average cost
- Cost range (low-high)
- Quality indicators
- Certification requirements
- Red flags to watch for

---

## Phase 2D: Calculator & Feedback System

### Healthcare Financial Risk Calculator

**Purpose:** Help users decide between insurance options and cash-pay

**Features:**
- Personalized risk assessment based on health profile
- 1-year and 3-year cost projections
- Insurance vs cash-pay comparison
- Probability calculations for major/catastrophic expenses
- Premium estimates with ACA subsidy calculations
- Bronze/Silver/Gold plan comparisons

**Prompt Files:**

| File | Purpose | Key Features |
|------|---------|--------------|
| `calculatorPrompt.js` | Main calculator logic | Conversational flow, risk assessment |
| `costNavigator.js` | General chat + research | Industry benchmarks, quality standards |
| `documentAnalysis.js` | Bill/EOB analysis | OCR interpretation, cost breakdown |

### Premium Reference Data (2024-2025)

**Individual Monthly Premiums (National Baseline):**

| Age | Bronze | Silver | Gold |
|-----|--------|--------|------|
| 21 | $310 | $390 | $480 |
| 30 | $375 | $475 | $585 |
| 40 | $475 | $600 | $740 |
| 50 | $680 | $860 | $1,060 |
| 55 | $850 | $1,080 | $1,325 |
| 60 | $1,020 | $1,295 | $1,590 |
| 64 | $1,150 | $1,460 | $1,795 |

**State Multipliers:**
- AK, WY: +40-75%
- NY, VT, WV: +30-35%
- CA, MD, WA: +10-15%
- TX, FL, AZ: -5% to +5%
- Midwest: -8-12%

### Probability Calculation System

**Base Rates by Age (Annual):**

| Age Group | Major (>$5K) | Catastrophic (>$50K) |
|-----------|--------------|---------------------|
| 18-29 | 5% | 1% |
| 30-39 | 8% | 2% |
| 40-49 | 12% | 3% |
| 50-59 | 18% | 4% |
| 60-64 | 25% | 6% |

**Condition Multipliers:**

| Condition | Major | Catastrophic |
|-----------|-------|--------------|
| Diabetes Type 2 | 1.8x | 2.2x |
| Hypertension | 1.4x | 1.6x |
| Heart Disease | 2.0x | 2.5x |
| Obesity (BMI 30+) | 1.3x | 1.4x |
| Current Smoker | 1.5x | 1.8x |
| Family Cardiac History | 1.4x | 1.6x |

**Calculation Method:**
1. Start with base rate for age group
2. Apply top 3 condition/lifestyle multipliers
3. Cap at 85% major, 40% catastrophic
4. Calculate 3-year: `1 - (1 - annual)³`

### Cost Navigator - Research Assistance

**Purpose:** Provide genuinely helpful research data, not vague disclaimers

**What It Now Provides:**
- Price benchmarks (national, regional, by provider type)
- Industry standards (success rates, certifications)
- Market comparisons (US vs international, hospital vs clinic)
- Quality indicators and red flags
- Specific questions to ask providers
- Research resources (forums, databases, verification sites)

**Example - Hair Transplant Query:**

Before:
> "I can't recommend specific providers, but you should do your research carefully."

After:
> "Hair transplants in Turkey typically run $1.50-3.00 per graft, so a 2,500 graft procedure would be $3,750-7,500 total. Quality indicators to research: ISHRS membership, surgeon personally does extraction, <2,500 grafts/day. Best research sources: HairLossTalk forum, Reddit r/HairTransplants..."

### Feedback System

**Consumer App Features:**
- 📋 Copy button - Copy AI response to clipboard
- 👍 Thumbs up - Mark response as helpful
- 👎 Thumbs down - Mark response as not helpful
- 🔄 Retry - Regenerate AI response

**Backend API:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/feedback` | POST | Submit feedback |
| `/api/feedback/admin` | GET | List all feedback |
| `/api/feedback/admin/stats` | GET | Get stats + trends |
| `/api/feedback/admin/:id` | PATCH | Update status/notes |
| `/api/feedback/admin/:id` | DELETE | Delete feedback |

**Feedback Schema:**
```javascript
{
  messageId: String,
  rating: 'positive' | 'negative',
  userPrompt: String,
  aiResponse: String,
  sessionId: String,
  interactionType: 'chat' | 'document_analysis' | 'calculator',
  status: 'new' | 'reviewed' | 'actioned' | 'dismissed',
  adminNotes: String,
  tags: [String],
  createdAt: Date,
  reviewedAt: Date
}
```

### Admin Dashboard - Feedback Page

**URL:** https://admin.findrhealth.com/feedback

**Features:**
1. **Stats Overview Cards**
   - Total feedback count
   - Positive count + percentage
   - Negative count
   - Pending review count

2. **30-Day Trend Chart**
   - Daily positive/negative visualization
   - Color-coded bars

3. **Filterable Feedback List**
   - Filter by rating
   - Filter by status
   - Filter by interaction type
   - Search in prompts/responses
   - Pagination (20 per page)

4. **Detail Modal**
   - Full user prompt
   - Full AI response
   - Admin notes textarea
   - Status action buttons

---

## Technical Architecture

### Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Railway) |
| AI | Anthropic Claude API |
| Hosting - Consumer | Vercel |
| Hosting - Admin | Vercel |
| Hosting - Backend | Railway |

### Repository Structure

```
carrotly-provider-database/
├── consumer-app/
│   ├── src/
│   │   ├── pages/
│   │   │   └── ClarityChat.jsx
│   │   ├── components/
│   │   │   └── clarity/
│   │   │       ├── DocumentUpload.jsx
│   │   │       ├── LoadingIndicator.jsx
│   │   │       └── CalculatorResults.jsx
│   │   ├── services/
│   │   │   └── clarityApi.js
│   │   └── utils/
│   │       └── calculatorParser.js
│   └── package.json
├── admin-dashboard/
│   ├── src/
│   │   ├── pages/
│   │   │   └── FeedbackDashboard.jsx
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── App.jsx
│   ├── vercel.json
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── clarity.js
│   │   └── feedback.js
│   ├── models/
│   │   └── Feedback.js
│   ├── prompts/
│   │   ├── index.js
│   │   ├── costNavigator.js
│   │   ├── calculatorPrompt.js
│   │   └── documentAnalysis.js
│   ├── data/
│   │   ├── riskData.json
│   │   └── insuranceBenchmarks.json
│   ├── services/
│   │   └── riskCalculator.js
│   └── server.js
└── package.json
```

### API Flow

```
User Input
    ↓
Consumer App (React)
    ↓
clarityApi.js → POST /api/clarity/chat
    ↓
Backend (Express)
    ↓
routes/clarity.js
    ↓
Prompt Selection (costNavigator/calculator/documentAnalysis)
    ↓
Anthropic Claude API
    ↓
Response Processing
    ↓
JSON Response → Consumer App → Render
```

---

## File Inventory

### Backend Files

| File | Purpose | Last Updated |
|------|---------|--------------|
| `prompts/calculatorPrompt.js` | Calculator system prompt | Phase 2D |
| `prompts/costNavigator.js` | Chat + research prompt | Phase 2D |
| `prompts/documentAnalysis.js` | Document analysis prompt | Phase 2C |
| `prompts/index.js` | Prompt exports | Phase 2D |
| `models/Feedback.js` | Feedback MongoDB model | Phase 2D |
| `routes/feedback.js` | Feedback API endpoints | Phase 2D |
| `routes/clarity.js` | Main chat API | Phase 2A |
| `data/insuranceBenchmarks.json` | Premium data | Phase 2D |
| `data/riskData.json` | Risk calculation data | Phase 2D |

### Frontend Files (Consumer)

| File | Purpose | Last Updated |
|------|---------|--------------|
| `pages/ClarityChat.jsx` | Main chat interface | Phase 2D |
| `components/clarity/CalculatorResults.jsx` | Calculator UI | Phase 2D |
| `services/clarityApi.js` | API service layer | Phase 2D |
| `utils/calculatorParser.js` | JSON parser utility | Phase 2D |

### Frontend Files (Admin)

| File | Purpose | Last Updated |
|------|---------|--------------|
| `pages/FeedbackDashboard.jsx` | Feedback admin page | Phase 2D |
| `components/Navbar.jsx` | Navigation with feedback link | Phase 2D |
| `App.jsx` | Routing with feedback route | Phase 2D |
| `vercel.json` | Vercel config (root directory fix) | Phase 2D |

---

## Known Issues & Limitations

### Calculator Output Format

**Issue:** LLM does not consistently follow structured JSON output instructions  
**Impact:** Calculator results render as plain text instead of polished UI cards  
**Workaround:** Plain text output is still helpful and readable  
**Future Fix:** Server-side post-processing to extract/generate structured data

### Premium Estimate Accuracy

**Issue:** Estimates may vary ±15% from actual marketplace quotes  
**Cause:** Using national averages + state multipliers instead of real-time data  
**Impact:** Users should verify with actual marketplace quotes  
**Future Fix:** Integration with Healthcare.gov API or CMS data feeds

### Probability Calculations

**Issue:** Uses simplified "top 3 multipliers" approach  
**Cause:** Avoiding unrealistic 99%+ probabilities from multiplicative factors  
**Impact:** Probabilities are directionally correct but not actuarially precise  
**Future Fix:** Consult with actuary for proper risk modeling

### Document Analysis

**Issue:** Homepage upload modal opens but analysis fails  
**Status:** Bug identified, not yet resolved  
**Workaround:** Upload documents from within chat interface

---

## Future Engineering Upgrades

### High Priority

#### 1. Structured Calculator Output (Server-Side)

**Current State:** Prompt instructs JSON output, LLM ignores it  
**Proposed Solution:**
```javascript
// In routes/clarity.js
const response = await callClaude(prompt, message);

// Post-process to extract/generate structured data
const structuredData = extractCalculatorData(response);

return {
  text: response,
  calculator: structuredData // Always consistent
};
```

**Effort:** 4-6 hours  
**Impact:** Consistent, polished UI rendering

#### 2. Real-Time Premium Data Integration

**Current State:** Static 2024-2025 benchmark data  
**Proposed Solution:**
- Integrate Healthcare.gov API for marketplace quotes
- Cache results by ZIP code + age + household size
- Update cache weekly during open enrollment

**Effort:** 8-12 hours  
**Impact:** Accurate, location-specific quotes

#### 3. User Accounts & History

**Current State:** Anonymous sessions, no persistence  
**Proposed Solution:**
- Google/Apple OAuth login
- Save assessment history
- Track health profile over time
- Enable "continue where I left off"

**Effort:** 16-24 hours  
**Impact:** Personalization, retention

### Medium Priority

#### 4. A/B Testing Framework for Prompts

**Purpose:** Systematically improve AI responses  
**Implementation:**
- Version tracking for all prompts
- Random assignment to prompt variants
- Correlation with feedback ratings
- Statistical significance testing

**Effort:** 12-16 hours  
**Impact:** Data-driven prompt optimization

#### 5. Provider Directory Integration

**Current State:** No specific provider recommendations  
**Proposed Solution:**
- NPI database integration
- Medicare Compare ratings
- Yelp/Google reviews aggregation
- Network status by insurance plan

**Effort:** 20-30 hours  
**Impact:** Actionable provider recommendations

#### 6. Mobile App (React Native)

**Current State:** Mobile web only  
**Proposed Solution:**
- React Native app sharing web components
- Push notifications for open enrollment
- Document camera integration
- Health app integrations

**Effort:** 40-60 hours  
**Impact:** App store presence, better UX

### Lower Priority

#### 7. Multi-Language Support

**Languages:** Spanish, Mandarin, Vietnamese, Korean  
**Implementation:** i18n framework + translated prompts  
**Effort:** 20-30 hours per language

#### 8. Voice Interface

**Purpose:** Accessibility, hands-free use  
**Implementation:** Speech-to-text + text-to-speech  
**Effort:** 12-16 hours

#### 9. Insurance Plan Comparison Tool

**Purpose:** Side-by-side plan comparison  
**Implementation:** Structured plan database + comparison UI  
**Effort:** 24-32 hours

---

## Phase 3 Roadmap

### Phase 3A: User Accounts (Weeks 1-2)

- [ ] OAuth implementation (Google, Apple)
- [ ] User profile database model
- [ ] Assessment history storage
- [ ] "My Assessments" dashboard

### Phase 3B: Enhanced Calculator (Weeks 3-4)

- [ ] Server-side structured output
- [ ] Healthcare.gov API integration
- [ ] Subsidy calculator with real data
- [ ] PDF export of assessments

### Phase 3C: Provider Directory (Weeks 5-6)

- [ ] NPI database integration
- [ ] Provider search by specialty + location
- [ ] Quality ratings display
- [ ] Insurance network verification

### Phase 3D: Analytics & Optimization (Weeks 7-8)

- [ ] User journey analytics
- [ ] A/B testing framework
- [ ] Prompt performance dashboard
- [ ] Conversion funnel tracking

---

## Deployment Checklist

### Consumer App (Vercel)

```bash
# Deploy automatically on git push
cd ~/Desktop/carrotly-provider-database
git add .
git commit -m "Description"
git push origin main
```

**Vercel Settings:**
- Root Directory: `consumer-app`
- Build Command: `npm run build`
- Output Directory: `dist`

### Admin Dashboard (Vercel)

**Vercel Settings:**
- Root Directory: `admin-dashboard`
- Build Command: `npm run build` (or `npx vite build`)
- Output Directory: `dist`

**Note:** Root directory was initially empty causing build failures

### Backend (Railway)

- Auto-deploys from GitHub main branch
- Environment variables configured in Railway dashboard
- MongoDB connection string in `MONGODB_URI`
- Anthropic API key in `ANTHROPIC_API_KEY`

---

## Testing Scenarios

### Calculator Test

**Input:**
```
Should I get health insurance? I'm a 54-year-old female in California with $70K income, Type 2 diabetes, hypertension, and high cholesterol. Former smoker, BMI 31, sedentary. Father had heart attack at 58. I have $5000 saved for emergencies.
```

**Expected Output:**
- Risk profile assessment
- Cash pay vs insurance comparison
- Premium estimates with subsidies
- Probability percentages
- Clear recommendation
- Next steps

### Research Test

**Input:**
```
I'm researching hair transplants in Albania. What can you tell me?
```

**Expected Output:**
- Price benchmarks (€1,200-2,500 range)
- Quality standards (ISHRS, graft survival rates)
- Albania vs Turkey comparison
- Research resources (forums, YouTube)
- Red flags list
- Questions to ask clinics

### Feedback Test

1. Send message in consumer app
2. Click thumbs up/down on response
3. Verify in admin dashboard at /feedback
4. Check stats update correctly

---

## Contact & Resources

**Repository:** github.com/Findr-Health/carrotly-provider-database  
**Developer:** Tim Wetherill  
**AI Development Partner:** Claude (Anthropic)

**Key Documentation:**
- `/mnt/project/DEVELOPER_HANDOFF.md`
- `/mnt/project/HEALTHCARE_CLARITY_TOOL_SPEC.md`
- `/mnt/project/PHASE_2A_IMPLEMENTATION.md`

---

*Document generated: December 28, 2025*  
*Phase 2 Status: Complete*  
*Next Phase: 3A - User Accounts*
