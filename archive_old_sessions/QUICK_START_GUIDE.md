# 🚀 ERICA JANE TRAINING PLATFORM - QUICK SETUP

**You're ready to start training! Here's exactly what to do next.**

---

## ✅ WHAT YOU JUST RECEIVED

1. **Complete Training Platform** (Full-stack web application)
2. **All System Prompts** (Erica Jane's personality and rules)
3. **Development Roadmap** (3-month plan)
4. **This Quick Start Guide** (You are here!)

---

## 🎯 YOUR IMMEDIATE NEXT STEPS (10 minutes)

### Step 1: Extract the Project (2 min)

The training platform is in: `erica-jane-training/` folder (or download the `.tar.gz` file)

If you downloaded the compressed version:
```bash
cd ~/Desktop  # or your preferred location
tar -xzf erica-jane-training.tar.gz
cd erica-jane-training
```

### Step 2: Install Dependencies (5 min)

**Backend**:
```bash
cd backend
npm install
```

**Frontend** (open a new Terminal tab/window):
```bash
cd frontend
npm install
```

### Step 3: Add Your API Key (1 min)

```bash
cd backend
cp .env.example .env
nano .env  # or open in TextEdit
```

Replace `your_api_key_here` with your actual Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
PORT=3001
```

Save and close.

### Step 4: Start Everything! (2 min)

**Terminal 1 - Backend**:
```bash
cd backend
npm start
```

Wait until you see:
```
🎨 ═══════════════════════════════════════
   ERICA JANE TRAINING PLATFORM
   🚀 Server running on http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
cd frontend  
npm start
```

Your browser will automatically open to http://localhost:3000

---

## 🎨 TEST IT OUT (5 minutes)

### Your First Assessment:

1. **Click "New Assessment" tab** (should be selected by default)

2. **Upload a photo**:
   - Any outfit photo from your camera roll
   - Or google "street style fashion" and save an image

3. **Select "Default Mode"**

4. **Add optional context**:
   - Name: Sarah
   - Age: 28
   - Style: Feminine

5. **Click "Get Assessment"**

6. **Wait 10-20 seconds** for Claude to analyze

7. **Read Erica Jane's response** - This is what your fashion agent sounds like!

8. **Add Your Expert Review**:
   - Rate it (Excellent/Good/Needs Work)
   - Note what was good
   - Note what could improve
   - Add fashion notes to teach the agent

9. **Click "Save Review"**

10. **Check the Stats Panel** at the top - You just created your first training example!

---

## 📊 WHAT HAPPENS NEXT

### This Week - Initial Training Phase:

**Goal**: Create 30-50 expert-reviewed assessments

**Who does what**:
- **You**: Project manager, oversee the process
- **Greg, Simon, Erica**: Fashion expert reviewers

**Process**:
1. **Collect ~50 diverse outfit photos**:
   - Mix of styles, ages, occasions
   - Include both good and problematic outfits
   - Variety helps the agent learn better

2. **Run all photos through the platform**:
   - Try both Default and Anna Wintour modes
   - Use different user contexts
   - Save all assessments

3. **Expert review sessions**:
   - Have each reviewer assess 15-20 examples
   - Compare notes on quality standards
   - Identify patterns in what works/doesn't

4. **Analyze the results**:
   - What's Erica Jane doing well?
   - What needs improvement?
   - Are there consistent gaps in fashion knowledge?

---

## 🎓 TRAINING YOUR EXPERTS (Greg, Simon, Erica)

### Send Them:
1. Link to the training platform (http://localhost:3000)
2. The system prompt documents (so they understand Erica Jane's goals)
3. The "Slay Criteria" document (so they know what excellence means)

### Their Job:
- Review 15-20 assessments each
- Provide specific, actionable feedback
- Teach Erica Jane about fashion through their notes
- Help calibrate quality standards

### Calibration Exercise:
Have all 3 review the same 5 assessments:
- Everyone rates independently
- Then discuss as a group
- Align on what "Excellent" vs "Good" vs "Needs Work" means
- This ensures consistency

---

## 💡 TIPS FOR SUCCESS

### Week 1 Focus:
✅ **Quantity first** - Get 30-50 assessments done
✅ **Learn the tool** - Get comfortable with the interface  
✅ **Identify patterns** - What keeps coming up?
✅ **Have fun!** - This is exciting!

### Don't Worry About:
❌ Perfect prompts yet (you'll refine based on feedback)
❌ The mobile app (that's Phase 2, weeks from now)
❌ Automated scraping (that's Phase 3)
❌ Making it public (this is just training)

---

## 🔄 THE TRAINING LOOP

```
1. Upload photo → 2. Get assessment → 3. Expert reviews → 
4. Analyze patterns → 5. Update prompts → (REPEAT)
```

This is continuous improvement. With each cycle:
- Erica Jane gets better at matching the desired voice
- You understand what works and what doesn't
- The prompts get more refined
- Quality improves

---

## 📈 SUCCESS METRICS

After Week 1, you should have:
- ✅ 30-50 assessments in the database
- ✅ All (or most) reviewed by experts
- ✅ Clear understanding of what Erica Jane does well
- ✅ List of improvements needed
- ✅ Expert reviewers aligned on quality standards

Target quality distribution:
- **60-70% "Good" or "Excellent"** (means prompts are working)
- **30-40% "Needs Work"** (gives you improvement targets)
- **8-10% "Slay"** (special recognition should be rare)

---

## 🆘 COMMON ISSUES & FIXES

### "API Key Not Working"
- Make sure you created `.env` file in `backend/` folder
- Check for typos in the API key
- No quotes needed around the key
- Save the file and restart the backend server

### "Can't Upload Photos"
- Only JPEG, PNG, WebP supported
- Max size 10MB
- Try a different photo to test

### "Assessment Takes Forever"
- First request is slower (Claude API warmup)
- Should be 10-20 seconds normally
- Check your internet connection
- Check backend Terminal for errors

### "Page Won't Load"
- Make sure both servers are running
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Try restarting both servers

---

## 🎉 YOU'RE ALL SET!

Everything you need is in place:
- ✅ Training platform built and ready
- ✅ System prompts defining Erica Jane's personality
- ✅ Database ready to store assessments
- ✅ Expert review workflow set up
- ✅ Clear path forward

**Next action**: Open Terminal, follow Step 2 (install dependencies), and run your first assessment!

---

## 📞 NEED HELP?

If you get stuck:
1. Check the full README.md in the project folder
2. Look at the error message in Terminal
3. Ask me for help with specific error messages

**You're about to train a fashion AI from scratch. How cool is that?! Let's do this! 🎨✨**
