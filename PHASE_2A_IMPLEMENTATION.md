# Phase 2A Implementation - Ready to Apply

**Date:** December 25, 2024  
**Status:** Files ready for your local repository

---

## Files Created

### Backend Files

| File | Path | Description |
|------|------|-------------|
| `costNavigator.js` | `backend/prompts/costNavigator.js` | Cost Navigator system prompt |
| `documentAnalysis.js` | `backend/prompts/documentAnalysis.js` | Document Analysis system prompt |
| `index.js` | `backend/prompts/index.js` | Prompts export file |
| `clarity.js` | `backend/routes/clarity.js` | **Updated** - Now with conversation history |

### Frontend Files

| File | Path | Description |
|------|------|-------------|
| `clarityApi.js` | `consumer-app/src/services/clarityApi.js` | **Updated** - Geolocation + history |
| `ClarityChat.jsx` | `consumer-app/src/pages/ClarityChat.jsx` | **Updated** - History management |

---

## How to Apply

### Step 1: Create the prompts folder (backend)

```bash
cd ~/Desktop/carrotly-provider-database
mkdir -p backend/prompts
```

### Step 2: Copy the files

Copy these files from the outputs to your project:

1. **Backend prompts folder** (NEW):
   - `backend/prompts/costNavigator.js`
   - `backend/prompts/documentAnalysis.js`
   - `backend/prompts/index.js`

2. **Backend routes** (REPLACE existing):
   - `backend/routes/clarity.js`

3. **Frontend services** (REPLACE existing):
   - `consumer-app/src/services/clarityApi.js`

4. **Frontend pages** (REPLACE existing):
   - `consumer-app/src/pages/ClarityChat.jsx`

### Step 3: Install dependencies (if not already installed)

```bash
cd backend
npm install @anthropic-ai/sdk multer
```

### Step 4: Verify environment variables

Make sure your Railway backend has:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 5: Commit and deploy

```bash
cd ~/Desktop/carrotly-provider-database
git add .
git commit -m "Phase 2A: Add LLM system prompts with conversation history and geolocation"
git push origin main
```

Railway and Vercel will auto-deploy.

---

## What's New in This Update

### 1. System Prompts (`backend/prompts/`)

**Cost Navigator Prompt** includes:
- Direct, actionable personality
- Key knowledge about discounts, negotiation, bills
- Fair price references (MRI, CT, labs, etc.)
- International price estimates
- Conversation flows for provider outreach, international validation
- Consultation triggers
- Location-aware responses

**Document Analysis Prompt** includes:
- Bill analysis with line item extraction
- EOB explanation (clarifies it's NOT a bill)
- Lab result interpretation with caveats
- Upcoding detection for inpatient bills
- Collection letter rights explanation
- Structured output formats

### 2. Conversation History

**Backend (`clarity.js`):**
- Accepts `history` array in request body
- Sends last 10 messages to Claude API
- Proper message format validation
- Trigger detection (provider outreach, consultation needed, etc.)

**Frontend (`clarityApi.js`):**
- Formats history for API
- Filters to only user/assistant messages
- Manages message count (max 50 stored)

### 3. Geolocation

**Features:**
- Browser geolocation API request on load
- Reverse geocoding via OpenStreetMap/Nominatim
- Manual location parsing ("I live in Denver, CO")
- Location sent with every request
- Session-only storage (not persisted)

**Fallback:**
- If geolocation denied, LLM asks "What city or zip code are you in?"
- User response is parsed and stored

### 4. Trigger Detection

The API now returns `triggers` object:
```javascript
{
  providerOutreach: boolean,    // User mentioned a provider
  internationalValidation: boolean, // User interested in intl care
  consultationSuggested: boolean,   // Complex case detected
  calculatorFlow: boolean,      // Insurance vs cash question
  locationNeeded: boolean       // LLM needs location
}
```

Frontend can use these for future UI enhancements (Phase 2B+).

---

## Testing After Deployment

### Test Chat Flow

1. Go to https://carrotly-provider-database.vercel.app/clarity
2. Ask: "How do I negotiate a hospital bill?"
3. Follow up: "What if they say no?"
4. Verify the second response references the first (conversation context)

### Test Location

1. Allow location permission when prompted
2. Ask: "What's a fair price for an MRI near me?"
3. Response should reference your area

### Test Document Upload

1. Upload a medical bill image
2. Verify detailed analysis with:
   - Line items explained
   - Potential flags
   - Action items
   - Questions to ask

### Test Upcoding Detection

1. Upload a bill with "sepsis" diagnosis
2. Verify the LLM flags it and asks user to confirm

---

## Next Steps (Phase 2B)

After testing Phase 2A, move to:
- Admin dashboard Inquiry Queue page
- Price Database management page
- API endpoints for inquiries CRUD

---

**Files are ready in `/mnt/user-data/outputs/`**
