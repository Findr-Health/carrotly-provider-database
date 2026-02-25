# 🚀 QUICK FIX: Get Carrotly Agent Working in 5 Minutes

## Problem: "what is lupus" returns generic response instead of detailed medical info

**Root Cause:** Browser CORS blocks direct OpenAI API calls

**Solution:** Use backend proxy server (already created for you!)

---

## ✅ OPTION 1: Production Setup (Recommended)

### Step 1: Install dependencies

```bash
npm install express cors
```

### Step 2: Start the proxy server

**In Terminal 1:**
```bash
node proxy-server.js
```

You should see:
```
╔═══════════════════════════════════════╗
║   Carrotly API Proxy Server Ready    ║
╚═══════════════════════════════════════╝

🚀 Server running on: http://localhost:3001
```

### Step 3: Update carrotly-app.jsx

Find line ~736 (in the `callOpenAI` function):

**CHANGE THIS:**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  mode: 'cors',
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

**TO THIS:**
```javascript
const response = await fetch('http://localhost:3001/api/chat', {  // ← Changed URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ← Removed Authorization header (proxy handles it)
  },
  // ← Removed mode: 'cors' (not needed with proxy)
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

Do the same for line ~785 (the follow-up API call):

**CHANGE THIS:**
```javascript
const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  mode: 'cors',
  body: JSON.stringify({
    model: OPENAI_MODEL,
    messages: followUpHistory,
    temperature: 0.7,
    max_tokens: 2000
  })
});
```

**TO THIS:**
```javascript
const followUpResponse = await fetch('http://localhost:3001/api/chat', {  // ← Changed URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ← Removed Authorization header
  },
  // ← Removed mode: 'cors'
  body: JSON.stringify({
    model: OPENAI_MODEL,
    messages: followUpHistory,
    temperature: 0.7,
    max_tokens: 2000
  })
});
```

### Step 4: Restart your frontend

**In Terminal 2:**
```bash
npm start
```

### Step 5: Test

1. Open http://localhost:3000
2. Ask: "what is lupus"
3. Should now get comprehensive GPT response! ✅

---

## ✅ OPTION 2: Quick Test (Chrome with CORS Disabled)

⚠️ **For testing only - not for production!**

### Mac/Linux:
```bash
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-dev --disable-web-security --disable-features=IsolateOrigins,site-per-process
```

### Windows:
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\temp-chrome" --disable-web-security --disable-features=IsolateOrigins,site-per-process
```

Then open http://localhost:3000 in that Chrome window and test "what is lupus".

---

## 📊 How to Verify It's Working

### Before Fix:
```
User: "what is lupus"
Agent: "I apologize - I need an active connection to provide 
        detailed medical information..."
```
❌ Generic response
❌ No detailed medical info
❌ Agent uses fallback system

### After Fix:
```
User: "what is lupus"
Agent: "Lupus (systemic lupus erythematosus or SLE) is a chronic 
        autoimmune disease where the immune system attacks healthy 
        tissues...

        KEY FACTS:
        • Autoimmune disease affecting multiple organ systems 
          (American College of Rheumatology, 2024) (Grade A)
        • More common in women (9:1 ratio) and people of color
        • Symptoms include butterfly rash, joint pain, fatigue...
        
        [5-7 detailed points with citations]
        
        WHEN TO SEEK CARE:
        • Emergency: severe symptoms...
        • Urgent: new rash, fever, joint swelling...
        
        NEXT STEPS:
        • See rheumatologist for diagnosis
        • Blood tests (ANA, anti-dsDNA)...
        
        Would you like me to help you find a rheumatologist near you?"
```
✅ Comprehensive response
✅ Evidence grades (A/B/C)
✅ Citations with sources
✅ When to seek care section
✅ Actionable next steps

---

## 🔍 Debugging

### Check if proxy is running:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "Carrotly API Proxy",
  "timestamp": "2025-10-25T..."
}
```

### Check browser console (F12):

**If proxy working:**
- No CORS errors
- Requests to `localhost:3001/api/chat` succeed

**If proxy not running:**
- Error: `Failed to fetch`
- `net::ERR_CONNECTION_REFUSED`

**If still using direct OpenAI:**
- CORS error: `No 'Access-Control-Allow-Origin' header`

---

## 📁 Files Needed

All files already created for you:

1. **[proxy-server.js](computer:///mnt/user-data/outputs/proxy-server.js)** - Backend proxy
2. **[carrotly-app.jsx](computer:///mnt/user-data/outputs/carrotly-app.jsx)** - Frontend (needs 2 URL changes)
3. **[TROUBLESHOOTING_CORS.md](computer:///mnt/user-data/outputs/TROUBLESHOOTING_CORS.md)** - Full documentation

---

## 🚀 Deployment to Production

### Vercel (Recommended):

**1. Create `api/chat.js`:**
```javascript
export default async function handler(req, res) {
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
}
```

**2. Update frontend URL:**
```javascript
fetch('/api/chat', { ... })  // Relative URL
```

**3. Add environment variable in Vercel dashboard:**
```
OPENAI_API_KEY=sk-proj-...
```

**4. Deploy:**
```bash
vercel deploy
```

---

## ✅ Success Checklist

Run through this to confirm working:

- [ ] Proxy server running (see startup message)
- [ ] Frontend running (npm start)
- [ ] Updated 2 fetch URLs in carrotly-app.jsx
- [ ] No CORS errors in browser console
- [ ] Query "what is lupus" returns 5-7 detailed points
- [ ] Response includes evidence grades (A/B/C)
- [ ] Response cites sources (ACR, NIH, etc.)
- [ ] Response includes "when to seek care"
- [ ] Response NOT using fallback system

**If all checked → Working perfectly! ✅**

---

## 💡 Quick Summary

**Current issue:** CORS blocks OpenAI API → fallback activates → generic response

**Solution:** Use proxy server (proxy-server.js) as intermediary

**Changes needed:**
1. Run `node proxy-server.js`
2. Update 2 fetch URLs in carrotly-app.jsx
3. Test with "what is lupus"

**Time:** 5 minutes

**Result:** Agent can now answer ANY clinical question with full GPT knowledge! ✅