# Carrotly Agent - Troubleshooting Guide

## 🚨 ISSUE IDENTIFIED: CORS Error Blocking OpenAI API

### What You're Seeing:
- User asks: "what is lupus"
- Agent responds with generic "I need more information" instead of medical details
- No comprehensive medical response appears

### Root Cause:
**Browser CORS Restriction** - Browsers block direct API calls from web apps to OpenAI's servers for security reasons.

When the app tries to call:
```javascript
fetch('https://api.openai.com/v1/chat/completions', ...)
```

The browser blocks it with:
```
Access to fetch at 'https://api.openai.com/v1/chat/completions' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

Then the fallback system activates (which has limited medical knowledge).

---

## ✅ SOLUTION OPTIONS

### Option 1: Backend Proxy Server (RECOMMENDED FOR PRODUCTION)

**How it works:**
```
Browser → Your Backend Server → OpenAI API → Backend → Browser
```

**Implementation:**

1. **Create simple Express proxy server:**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, tools } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000
    });
    
    res.json(completion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
});
```

2. **Update carrotly-app.jsx to use proxy:**

```javascript
// Change line ~736
const response = await fetch('http://localhost:3001/api/chat', {  // Use proxy instead
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: newHistory,
    tools: AGENT_FUNCTIONS
  })
});
```

3. **Run both servers:**
```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm start
```

---

### Option 2: Use OpenAI SDK (Server-Side Only)

If deploying to Vercel, Netlify, or similar:

**Vercel Serverless Function:**
```javascript
// /api/chat.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const { messages, tools } = req.body;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    max_tokens: 2000
  });
  
  res.json(completion);
}
```

---

### Option 3: Develop Mode with Chrome CORS Disabled (TESTING ONLY)

⚠️ **WARNING: Only for local testing, never in production**

**Mac/Linux:**
```bash
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-dev --disable-web-security --disable-features=IsolateOrigins,site-per-process
```

**Windows:**
```bash
chrome.exe --user-data-dir="C:\temp-chrome" --disable-web-security --disable-features=IsolateOrigins,site-per-process
```

Then open http://localhost:3000 in that Chrome window.

---

### Option 4: Improve Fallback System (CURRENT WORKAROUND)

Since the OpenAI API can't be called from browser, make the fallback system handle all medical questions comprehensively.

**I've already improved the fallback to:**
- Detect "what is X" queries
- Provide clear error message about API requirement
- Suggest reliable medical sources (CDC.gov, NIH.gov, MayoClinic.org)

**But the fallback has fundamental limitations:**
- Can't access GPT's full medical knowledge
- Limited to pre-programmed responses
- Not as comprehensive as OpenAI API

---

## 🔧 RECOMMENDED IMPLEMENTATION STEPS

### For Testing/Demo (Quick Fix):

**1. Use CORS-disabled Chrome (5 minutes):**
```bash
# Mac
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-dev --disable-web-security

# Open app
# Test "what is lupus" - should now work
```

### For Production (Proper Fix):

**1. Create backend proxy (30 minutes):**

Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

**2. Update frontend API call:**

In `carrotly-app.jsx` line ~736:
```javascript
const response = await fetch('http://localhost:3001/api/chat', { // Changed
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Remove Authorization header - backend handles it
  },
  body: JSON.stringify({
    model: OPENAI_MODEL,
    messages: newHistory,
    tools: AGENT_FUNCTIONS,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 2000
  })
});
```

**3. Deploy:**
- Frontend → Vercel/Netlify
- Backend → Vercel Serverless Functions or Railway

---

## 🧪 HOW TO TEST IF IT'S WORKING

### Test 1: Check Console for Errors

Open browser DevTools (F12) → Console tab

**If you see:**
```
CORS policy: No 'Access-Control-Allow-Origin' header
```
→ API is blocked, fallback is active

**If you see:**
```
⚠️ API Error - Using fallback system
```
→ API call failed, fallback is active

**If you DON'T see errors:**
→ API is working correctly

### Test 2: Query "what is lupus"

**If API working:**
✅ Get 5-7 detailed points about lupus
✅ Evidence grades (A/B/C) shown
✅ Citations (ACR, NIH, etc.)
✅ When to seek care section
✅ Actionable next steps

**If API blocked (fallback active):**
❌ Generic "I need OpenAI API configured" message
❌ Only basic guidance
❌ No detailed medical information

### Test 3: Check Network Tab

DevTools → Network tab → Try a query

**If API working:**
✅ See request to `localhost:3001/api/chat` (if using proxy)
✅ Or request to OpenAI with 200 status

**If API blocked:**
❌ Request to OpenAI fails with CORS error
❌ See red error in Network tab

---

## 📊 CURRENT STATE

Based on your screenshot showing generic response to "what is lupus":

### Status: ❌ OpenAI API Not Working
- **Cause:** CORS blocking browser → OpenAI direct calls
- **Effect:** Fallback system activated
- **Result:** Generic responses instead of comprehensive medical info

### What Needs to Happen:
1. Set up backend proxy server (Option 1 - RECOMMENDED)
2. OR use CORS-disabled browser for testing (Option 3 - QUICK TEST)
3. OR deploy with serverless functions (Option 2 - PRODUCTION)

---

## 🎯 QUICK START: Test in 2 Minutes

**Run with CORS disabled (testing only):**

```bash
# Mac
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-dev --disable-web-security --disable-features=IsolateOrigins,site-per-process

# Open your app
# Test: "what is lupus"
# Should now get full GPT response!
```

**To verify it worked:**
- Response should be 5-7 detailed points
- Should include evidence grades
- Should cite sources (ACR, NIH, etc.)
- Should NOT say "I need more information"

---

## ✅ FALLBACK IMPROVEMENTS MADE

Even when API isn't available, I improved the fallback to:

1. **Detect "what is X" queries** and explain API is needed
2. **Provide helpful alternatives** (CDC.gov, NIH.gov, etc.)
3. **Clear error messaging** instead of confusing generic response

So now instead of:
```
"I need more information about your symptoms..."
```

User gets:
```
"I apologize - I need an active connection to provide detailed medical 
information about 'lupus'. My full medical knowledge requires the OpenAI API.

In the meantime, you can visit:
- CDC.gov
- NIH.gov  
- MayoClinic.org

Or consult a healthcare provider for personalized advice."
```

Much better than before, but still limited compared to full GPT access.

---

## 📁 FILES UPDATED

1. **carrotly-app.jsx** 
   - Better error handling
   - Improved fallback for "what is X" queries
   - Console logging for debugging

---

## 🚀 NEXT STEPS

### To Fix Immediately (Testing):
1. Launch Chrome with CORS disabled
2. Test "what is lupus" query
3. Should now work with full GPT response

### To Fix Properly (Production):
1. Create backend proxy server (server.js)
2. Update API endpoint in app
3. Deploy backend + frontend separately
4. Test end-to-end

---

## ❓ COMMON QUESTIONS

**Q: Why can't I call OpenAI directly from browser?**
A: Browser security (CORS) blocks cross-origin API requests. You need a backend server as intermediary.

**Q: Will this work once deployed?**
A: Only if you deploy a backend server or use serverless functions. Static hosting (GitHub Pages) won't work.

**Q: Can I just disable CORS in production?**
A: No - CORS is a browser security feature. Users can't disable it. You must use a backend.

**Q: What's the fastest way to test?**
A: Launch Chrome with `--disable-web-security` flag (testing only).

**Q: What's the proper production solution?**
A: Backend proxy server or serverless functions (Vercel/Netlify).

---

**STATUS: Issue identified and documented. Backend proxy needed for full functionality.**