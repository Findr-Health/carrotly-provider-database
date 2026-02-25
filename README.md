# 🎨 ERICA JANE - Training Platform

Expert review system for training the Erica Jane fashion assessment agent.

This platform allows Greg, Simon, and Erica (your fashion experts) to review Claude's fashion assessments and provide feedback to continuously improve the agent.

---

## 🚀 QUICK START

### Prerequisites

- Mac with Node.js 22+ installed ✅ (You have this!)
- Anthropic API Key (Claude access)

### Installation

1. **Open Terminal** and navigate to the project:
```bash
cd ~/Desktop  # or wherever you want to put this
# You'll copy the erica-jane-training folder here
```

2. **Install Backend Dependencies**:
```bash
cd erica-jane-training/backend
npm install
```

3. **Install Frontend Dependencies**:
```bash
cd ../frontend
npm install
```

4. **Set Up Your API Key**:
```bash
cd ../backend
cp .env.example .env
nano .env  # or open in any text editor
```

Add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
PORT=3001
```

Save and exit (Ctrl+O, Enter, Ctrl+X for nano).

---

## 🏃 RUNNING THE PLATFORM

### Start the Backend Server

In one Terminal window:
```bash
cd erica-jane-training/backend
npm start
```

You should see:
```
🎨 ═══════════════════════════════════════
   ERICA JANE TRAINING PLATFORM
   ═══════════════════════════════════════
   🚀 Server running on http://localhost:3001
   📊 API available at http://localhost:3001/api
   ═══════════════════════════════════════
```

### Start the Frontend App

In a **second** Terminal window:
```bash
cd erica-jane-training/frontend
npm start
```

This will automatically open your browser to http://localhost:3000

---

## 📱 HOW TO USE

### For Creating New Assessments:

1. **Upload a Photo** of an outfit
2. **Select Mode**:
   - **Default Mode**: Warm, sassy "gay best friend" feedback
   - **Anna Wintour Mode**: Professional, exacting critique
3. **Add User Context** (Optional):
   - Name, age, style preference
   - Helps personalize the assessment
4. **Click "Get Assessment"** - Claude will analyze the photo
5. **Review the Response** - This is where you teach Erica Jane!

### For Expert Review (Greg, Simon, Erica):

After getting an assessment, you'll see a review form:

1. **Rate the Quality**:
   - ✅ **Excellent**: Agent nailed it! Voice, advice, everything perfect
   - 👍 **Good**: Solid assessment, minor improvements needed
   - 🔧 **Needs Work**: Significant issues, not matching voice or giving poor advice

2. **What Was Good?**: 
   - Specific things the agent did well
   - Example: "Great use of name, specific about the belt color, warm tone"

3. **What Needs Improvement?**:
   - What could be better
   - Example: "Should have mentioned the shoe/bag coordination issue"

4. **Fashion Notes**:
   - Teach Erica Jane about fashion
   - Example: "Navy and black CAN work together if done intentionally with texture contrast"

5. **Is This a SLAY?**:
   - Check this if the outfit genuinely deserves special recognition
   - Should be rare (~10% of assessments)

### View Training Progress:

The **Stats Panel** at the top shows:
- Total assessments created
- How many have been reviewed
- Quality distribution (Excellent/Good/Needs Work)
- Number of "Slays" identified

---

## 📁 PROJECT STRUCTURE

```
erica-jane-training/
├── backend/                      # Node.js API server
│   ├── server.js                # Main server
│   ├── routes/
│   │   └── assessments.js       # API endpoints
│   ├── database/
│   │   └── db.js                # SQLite database
│   ├── uploads/                 # Photo storage
│   ├── .env                     # Your API key (you create this)
│   └── erica_jane_training.db   # Database (auto-created)
│
├── frontend/                     # React web app
│   ├── src/
│   │   ├── App.js               # Main application
│   │   ├── components/
│   │   │   ├── AssessmentCard.js
│   │   │   └── StatsPanel.js
│   │   └── styles/
│   │       └── App.css          # Styling
│   └── public/
│       └── index.html
│
└── system-prompts/              # Erica Jane's personality & rules
    ├── erica_jane_core_constitution.md
    ├── erica_jane_default_mode.md
    ├── erica_jane_anna_wintour_mode.md
    ├── erica_jane_slay_criteria.md
    └── erica_jane_knowledge_base_strategy.md
```

---

## 🎯 TRAINING WORKFLOW

### Week 1: Build the Dataset

**Goal**: Create 30-50 assessments with expert reviews

1. **Gather diverse outfit photos**:
   - Different styles (casual, formal, streetwear)
   - Different ages (20s, 30s, 40s, 50s+)
   - Different body types
   - Both modes (mostly Default, some Anna Wintour)

2. **Run assessments** through the platform

3. **Have Greg, Simon, and Erica review them**:
   - Each person can review the same assessments
   - Compare notes on what good looks like
   - Identify patterns in what Erica Jane does well/poorly

### Week 2: Refine the Prompts

Based on expert feedback:

1. **Identify common issues**:
   - Is the tone too formal/casual?
   - Missing fashion knowledge?
   - Not using names enough?
   - Too verbose/too brief?

2. **Update system prompts**:
   - Edit the `.md` files in `system-prompts/`
   - Test with new assessments
   - Compare to previous responses

3. **Build "golden examples"**:
   - Save the best assessments as reference
   - Use them to show what "Excellent" looks like

### Ongoing: Continuous Improvement

- Weekly review sessions with experts
- Track improvement in stats
- Collect edge cases for the system prompts
- Refine Slay criteria based on what you see

---

## 🔧 TROUBLESHOOTING

### Backend won't start

**Error**: "Cannot find module..."
```bash
cd backend
rm -rf node_modules
npm install
npm start
```

**Error**: "ANTHROPIC_API_KEY is not defined"
- Make sure you created `.env` file in `backend/` folder
- Check that your API key is correct
- Don't include quotes around the key

### Frontend won't start

**Error**: Port 3000 already in use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
npm start
```

**Error**: "Cannot find module..."
```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

### Can't connect to backend

- Make sure backend is running (check Terminal window)
- Backend should be on port 3001
- Frontend makes requests to http://localhost:3001/api

### Photos won't upload

- Check file size (max 10MB)
- Only JPEG, PNG, WebP supported
- Try a different photo format

---

## 📊 API ENDPOINTS

For reference, here's what the backend provides:

```
POST   /api/assess                    # Get assessment from Claude
GET    /api/assessments               # Get all assessments
GET    /api/assessments/:id           # Get single assessment
POST   /api/assessments/:id/review    # Add expert review
GET    /api/stats                     # Get training statistics
POST   /api/upload                    # Upload photo file
GET    /api/health                    # Check if API is running
```

---

## 💾 DATABASE

The platform uses SQLite (no setup needed!). The database file is created automatically at:
```
backend/erica_jane_training.db
```

**Tables**:
- `assessments`: All outfit assessments and expert reviews
- `prompt_versions`: Track system prompt changes over time

**To view the database** (optional):
```bash
sqlite3 backend/erica_jane_training.db
.schema    # See table structure
SELECT * FROM assessments LIMIT 5;    # View recent assessments
.quit
```

---

## 🎓 TRAINING TIPS

### For Expert Reviewers:

**DO**:
- ✅ Be specific in feedback ("mention the color coordination" not "be more helpful")
- ✅ Teach fashion principles in the notes
- ✅ Rate honestly - this helps the agent improve
- ✅ Look for consistent issues across assessments
- ✅ Celebrate when Erica Jane nails it!

**DON'T**:
- ❌ Rate everything "Excellent" (that doesn't help)
- ❌ Be vague ("this is bad" vs. "tone is too harsh here")
- ❌ Give conflicting feedback (align with other experts)
- ❌ Overuse "Slay" - keep it special!

### Calibration Session:

Have all 3 experts review the same 10 assessments together:
- Discuss ratings
- Align on what "Excellent" vs "Good" means
- Identify what matters most (tone, accuracy, usefulness)
- Create shared understanding of quality

---

## 🔮 NEXT STEPS

Once you have 50-100 expert-reviewed assessments:

1. **Analyze patterns** in the feedback
2. **Update system prompts** based on learnings
3. **Test improvements** with new assessments
4. **Begin mobile app development** (Phase 2 of roadmap)

---

## 🆘 GETTING HELP

If you get stuck:

1. **Check logs**:
   - Backend Terminal window shows API errors
   - Frontend Terminal shows React errors
   - Browser console (F12) shows JavaScript errors

2. **Ask for help**: Share the error message and what you were trying to do

3. **Reset everything**:
```bash
# Stop both servers (Ctrl+C in each Terminal)
cd backend
rm erica_jane_training.db  # Deletes database (fresh start)
npm start

# In another Terminal
cd ../frontend
npm start
```

---

## 📞 SUPPORT

Questions? Issues? Let me know and I'll help you debug!

**Important Files to Edit**:
- System prompts: `system-prompts/*.md`
- API key: `backend/.env`
- Styling: `frontend/src/styles/App.css`

**Don't Edit** (unless you know what you're doing):
- `node_modules/` folders
- Database file while server is running

---

## ✨ YOU'RE READY TO TRAIN!

1. Start the backend server
2. Start the frontend app
3. Upload your first outfit photo
4. Get an assessment from Erica Jane
5. Add your expert review
6. Repeat and watch the magic happen! 🎨👔

Good luck training Erica Jane! This is the foundation of something amazing.
