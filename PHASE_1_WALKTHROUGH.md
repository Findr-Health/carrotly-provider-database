# 🚀 PHASE 1: STEP-BY-STEP TERMINAL WALKTHROUGH

Follow these steps **exactly** in your terminal.

---

## ✅ PREREQUISITES

Make sure you have:
- [ ] Your FWA Detection Platform project on your computer
- [ ] Terminal open
- [ ] Internet connection (for npm packages)

---

## 📍 STEP 1: NAVIGATE TO YOUR PROJECT

```bash
# Replace this path with YOUR actual project location
cd ~/Desktop/fwa-detection-platform

# Verify you're in the right place
ls -la

# You should see:
# - package.json
# - prisma/ folder
# - src/ folder
# - next.config.js
```

---

## 📝 STEP 2: BACKUP YOUR CURRENT SCHEMA (IMPORTANT!)

```bash
# Create a backup of your current database schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Verify backup created
ls -la prisma/

# You should now see schema.prisma.backup
```

---

## 📄 STEP 3: ADD NEW TABLES TO SCHEMA

**Option A: Using a Text Editor (RECOMMENDED)**

1. Open `prisma/schema.prisma` in your code editor (VS Code, etc.)
2. Scroll to the **very bottom** of the file
3. Add a blank line
4. Download and copy the contents of `schema-additions.txt` (I provided it)
5. Paste at the bottom
6. Save the file

**Option B: Using Command Line**

```bash
# Download the schema additions file first
# Then append it to your schema
cat schema-additions.txt >> prisma/schema.prisma
```

---

## 🔍 STEP 4: VERIFY SCHEMA (OPTIONAL BUT RECOMMENDED)

```bash
# Check if your schema is valid
npx prisma validate

# Expected output:
# ✔ The schema is valid
```

**If you see errors:**
- Check that you pasted at the END of the file
- Make sure there are no duplicate model names
- Restore from backup: `cp prisma/schema.prisma.backup prisma/schema.prisma`

---

## 🗄️ STEP 5: CREATE DATABASE MIGRATION

This creates the new tables in your database:

```bash
# Create and apply migration
npx prisma migrate dev --name add_rules_system
```

**What this does:**
1. Creates migration files in `prisma/migrations/`
2. Applies changes to your database
3. Regenerates Prisma Client

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Applying migration `20241105_add_rules_system`

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

**If you see errors:**
- Check your DATABASE_URL in `.env` file
- Make sure your database is running
- Try: `npx prisma db push` instead (skips migration history)

---

## 📦 STEP 6: ADD SEED FILE

```bash
# Download seed-rules-starter.ts (I provided it)
# Copy it to your prisma folder
cp ~/Downloads/seed-rules-starter.ts prisma/seed-rules.ts

# OR create it manually:
# Open prisma/seed-rules.ts in your editor and paste the contents
```

---

## 🌱 STEP 7: INSTALL DEPENDENCIES (IF NEEDED)

```bash
# Check if tsx is installed
npx tsx --version

# If not found, install it globally
npm install -g tsx

# OR just use npx (it will download automatically)
```

---

## 🚀 STEP 8: RUN THE SEED

```bash
# Load the 5 starter rules into your database
npx tsx prisma/seed-rules.ts
```

**Expected output:**
```
🌱 Seeding detection rules...

  ✅ Created: Upcoding Detection
  ✅ Created: Same-Day Duplicate Services
  ✅ Created: Modifier 25 Abuse
  ✅ Created: After-Hours Billing Concentration
  ✅ Created: Peer Comparison Outliers

✨ Complete! Created 5, Skipped 0
```

---

## 🔍 STEP 9: VERIFY IN DATABASE

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

**This opens in your browser at:** `http://localhost:5555`

**Check these things:**
1. Click on **DetectionRule** table (left sidebar)
2. You should see **5 rules**
3. All should have:
   - `isBuiltIn: true`
   - `isActive: true`
   - `status: ACTIVE`
4. Categories should be: BILLING (3), TEMPORAL (1), NETWORK (1)

**Take a screenshot if you want!** 📸

---

## ✅ STEP 10: CONFIRM SUCCESS

Run this query in Prisma Studio:

1. Click on **DetectionRule**
2. Click **"Add filter"** button
3. Select: `isBuiltIn` equals `true`
4. You should see 5 rules

**OR** run this in your terminal:

```bash
# Quick check
npx prisma studio &
# Then check the DetectionRule table
```

---

## 🎉 SUCCESS CRITERIA

You're done with Phase 1 if you can check all these:

- [ ] Migration completed without errors
- [ ] 5 new tables exist: DetectionRule, RuleVersion, RuleTest, RuleMatch, RuleValidation
- [ ] 5 starter rules loaded successfully
- [ ] All rules have `isBuiltIn: true` and `status: ACTIVE`
- [ ] Prisma Studio shows the data correctly
- [ ] No errors in terminal

---

## 🐛 TROUBLESHOOTING

### ❌ "Migration failed"

**Check:**
```bash
# Is your database running?
# Check .env file
cat .env | grep DATABASE_URL

# Try force push
npx prisma db push --accept-data-loss
```

### ❌ "Can't run seed file"

**Try:**
```bash
# Install tsx locally
npm install --save-dev tsx

# Then run
npx tsx prisma/seed-rules.ts
```

### ❌ "Type errors in seed file"

**Fix:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Then try seed again
npx tsx prisma/seed-rules.ts
```

### ❌ "Rules already exist"

**This is OK!** Re-running the seed is safe. It skips existing rules.

---

## 📸 WHAT SUCCESS LOOKS LIKE

**In Prisma Studio, you should see:**

```
DetectionRule Table:
┌────────────┬──────────────────────────────┬──────────┬──────────┐
│ id         │ name                         │ category │ severity │
├────────────┼──────────────────────────────┼──────────┼──────────┤
│ clxxx...   │ Upcoding Detection           │ BILLING  │ HIGH     │
│ clxxy...   │ Same-Day Duplicate Services  │ BILLING  │ HIGH     │
│ clxxz...   │ Modifier 25 Abuse            │ BILLING  │ HIGH     │
│ clxx1...   │ After-Hours Billing...       │ TEMPORAL │ MEDIUM   │
│ clxx2...   │ Peer Comparison Outliers     │ NETWORK  │ MEDIUM   │
└────────────┴──────────────────────────────┴──────────┴──────────┘
```

---

## 🎯 NEXT STEPS

Once you see all 5 rules in Prisma Studio:

**Say: "Phase 1 complete!"**

I'll guide you through Phase 2: Building the API endpoints! 🚀

---

## 💡 OPTIONAL: LOAD ALL 47 RULES

Want to load all production rules now?

```bash
# Use the full seed file (seed-rules.ts from outputs)
cp seed-rules.ts prisma/seed-rules-full.ts
npx tsx prisma/seed-rules-full.ts
```

This adds:
- 8 Network Analysis rules
- 15 Billing Pattern rules
- 12 Temporal Pattern rules
- 7 DME Fraud rules
- 5 Behavioral Pattern rules

**Total: 47 built-in rules ready to use!**

---

## 📞 NEED HELP?

If you get stuck:
1. Share the error message
2. Tell me which step you're on
3. Share relevant file contents

I'll help you debug! 🔧
