# 🚀 CARROTLY PROVIDER DATABASE - DEPLOYMENT GUIDE

Complete step-by-step guide to deploy the provider database system to Railway + Vercel.

---

## 📋 **PREREQUISITES**

### Required Accounts
- [ ] Railway account (railway.app) - You already have this! ✅
- [ ] Vercel account (vercel.com) - You already have this! ✅
- [ ] Cloudinary account (cloudinary.com) - Free tier
- [ ] Google Cloud Platform account (for Maps API)
- [ ] OpenAI account (for AI agent)

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Git installed
- [ ] PostgreSQL client (optional, for local testing)

---

## 🗄️ **STEP 1: SET UP DATABASE (Railway)**

### 1.1 Create PostgreSQL Database

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Provision PostgreSQL"
4. Railway will create a database instance automatically

### 1.2 Get Database Credentials

1. Click on your PostgreSQL service
2. Go to "Variables" tab
3. Copy these values (you'll need them):
   ```
   DATABASE_URL=postgresql://...
   PGHOST=...
   PGPORT=...
   PGUSER=...
   PGPASSWORD=...
   PGDATABASE=...
   ```

### 1.3 Initialize Database Schema

**Option A: Using Railway's PostgreSQL client**
1. In Railway, click your PostgreSQL service
2. Click "Data" tab
3. Click "Query" 
4. Copy the entire contents of `schema.sql`
5. Paste and execute

**Option B: Using local psql client**
```bash
# Install PostgreSQL client if needed
brew install postgresql  # macOS
# or: sudo apt-get install postgresql-client  # Linux

# Connect to Railway database
psql "postgresql://your-connection-string-here"

# Once connected, run the schema
\i /path/to/schema.sql

# Verify tables were created
\dt
```

### 1.4 Verify Setup

```sql
-- Check that tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- You should see:
-- - providers
-- - provider_photos
-- - provider_services
-- - provider_details
-- - team_members
-- - provider_agreements
-- - admin_users
-- - agent_runs
-- - audit_log
-- - export_logs

-- Check default admin was created
SELECT email, role FROM admin_users;
-- Should see: admin@carrotly.com | super_admin
```

---

## 🖥️ **STEP 2: DEPLOY BACKEND API (Railway)**

### 2.1 Prepare Backend Code

```bash
# Create a new directory for your project
mkdir carrotly-provider-database
cd carrotly-provider-database

# Copy the backend folder
cp -r /path/to/backend ./

cd backend

# Install dependencies
npm install
```

### 2.2 Configure Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

Fill in:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://... (from Railway PostgreSQL)
FRONTEND_URL=https://your-admin-dashboard.vercel.app
JWT_SECRET=generate-a-random-string-here
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Deploy to Railway

**Option A: Using Railway CLI (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your existing project
railway link

# Deploy
railway up
```

**Option B: Using GitHub (Alternative)**
1. Push your backend code to GitHub
2. In Railway, click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Node.js and deploy

### 2.4 Add Environment Variables in Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add all variables from your .env file
5. Railway will automatically restart

### 2.5 Test API

```bash
# Get your Railway URL (it will be something like: xxx.railway.app)
# Test health endpoint
curl https://your-backend.railway.app/health

# Should return: {"status":"healthy","database":"connected"}

# Test admin login
curl -X POST https://your-backend.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carrotly.com","password":"admin123"}'

# Should return a JWT token
```

⚠️ **IMPORTANT:** Change the default admin password immediately!

---

## 🤖 **STEP 3: SET UP AI AGENT (Local Machine)**

The AI agent runs on your local machine or a server you control. It's designed to be portable.

### 3.1 Install Python Dependencies

```bash
cd ../agent  # Navigate to agent folder

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Chrome/Chromium for Selenium
# macOS: brew install chromedriver
# Linux: sudo apt-get install chromium-chromedriver
# Windows: Download from https://chromedriver.chromium.org/
```

### 3.2 Get API Keys

**Google Maps API:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Maps JavaScript API" and "Places API"
4. Go to "Credentials" → Create API Key
5. Restrict the key (optional but recommended):
   - Application restrictions: None (or IP addresses)
   - API restrictions: Select only Maps and Places APIs

**OpenAI API:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. Go to "API Keys" section
4. Create new secret key
5. Copy and save it securely

### 3.3 Configure Agent

```bash
# Copy example config
cp .env.example .env

# Edit configuration
nano .env
```

Fill in:
```env
# Your Railway backend URL
API_BASE_URL=https://your-backend.railway.app/api
API_ADMIN_EMAIL=admin@carrotly.com
API_ADMIN_PASSWORD=admin123

# Google Maps API key
GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# OpenAI API key
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Agent settings (optional, has defaults)
AGENT_MAX_PROFILES_PER_RUN=25
AGENT_MIN_CONFIDENCE_SCORE=70
```

### 3.4 Test Agent

```bash
# Run agent with test query
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 5

# This will:
# 1. Search Google Maps for medical providers in Bozeman, MT
# 2. Check for duplicates against your database
# 3. Scrape provider websites for additional data
# 4. Create draft profiles in your database
# 5. Export results to ./exports/
```

**Expected Output:**
```
============================================================
🤖 CARROTLY PROVIDER AI AGENT
============================================================
📍 Location: Bozeman, MT
🏥 Category: medical
🎯 Max Profiles: 5
============================================================

✅ Authenticated as admin@carrotly.com
🔍 Searching Google Maps for medical providers in Bozeman, MT...
✅ Found 47 providers from Google Maps

[1/5] Processing: Smith Family Medicine
🌐 Enriching: Smith Family Medicine...
✅ Enriched with confidence: 85%
✅ Created profile ID: 123e4567-e89b-12d3-a456-426614174000

... (continues for each provider)

============================================================
📊 AGENT RUN SUMMARY
============================================================
⏱️  Duration: 234.5 seconds
🔍 Providers Found: 47
⏭️  Exact Duplicates Skipped: 0
⚠️  Flagged for Review: 2
✅ New Profiles Created: 5
❌ Errors: 0
============================================================

📁 Results exported to: ./exports/agent_run_Bozeman_MT_medical_20251109_103045.json
```

---

## ☁️ **STEP 4: SET UP PHOTO STORAGE (Cloudinary)**

### 4.1 Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. After signup, you'll see your dashboard

### 4.2 Get Credentials

1. On dashboard, find:
   - Cloud Name
   - API Key
   - API Secret
2. Copy these values

### 4.3 Add to Backend

In Railway:
1. Go to your backend service
2. Variables tab
3. Add:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### 4.4 Configure Upload Preset (Optional)

1. In Cloudinary dashboard, go to "Settings" → "Upload"
2. Scroll to "Upload presets"
3. Create unsigned preset named "carrotly-providers"
4. Set folder: "providers"
5. Save

---

## 🎨 **STEP 5: DEPLOY ADMIN DASHBOARD (Vercel)**

*Note: We'll create a simple React admin dashboard in the next step*

### 5.1 Create Admin Dashboard (To be built)

The admin dashboard will be a React app with:
- Provider list/search/filter
- Provider detail view with edit
- Agent control panel to trigger runs
- Approval workflow
- Data export buttons

### 5.2 Deploy to Vercel

```bash
# Navigate to frontend folder (once created)
cd ../admin-dashboard

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account
# - Link to existing project? No
# - Project name: carrotly-admin
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist

# Set environment variables
vercel env add VITE_API_URL
# Enter: https://your-backend.railway.app
```

---

## ✅ **STEP 6: VERIFY COMPLETE SYSTEM**

### 6.1 Test Backend API

```bash
# Health check
curl https://your-backend.railway.app/health

# Login
curl -X POST https://your-backend.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carrotly.com","password":"admin123"}'

# Get providers (using token from login)
curl https://your-backend.railway.app/api/admin/providers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6.2 Test AI Agent

```bash
# Run small test
python agent.py --city "Bozeman" --state "MT" --type "dental" --max 3
```

### 6.3 Test Data Export

```bash
# Export providers as JSON
curl https://your-backend.railway.app/api/admin/export/providers.json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o providers-export.json

# Check file
cat providers-export.json
```

---

## 🔐 **STEP 7: SECURITY & BEST PRACTICES**

### 7.1 Change Default Admin Password

```sql
-- Connect to your Railway PostgreSQL
-- Update admin password (bcrypt hash of 'your-new-secure-password')
UPDATE admin_users 
SET password_hash = '$2b$10$NEW_BCRYPT_HASH_HERE'
WHERE email = 'admin@carrotly.com';
```

Generate new bcrypt hash:
```bash
node -e "console.log(require('bcrypt').hashSync('your-new-password', 10))"
```

### 7.2 Secure API Keys

- ✅ Never commit .env files to Git
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically
- ✅ Set API key restrictions in Google Cloud Console

### 7.3 Database Backups

Railway automatically backs up PostgreSQL, but you should also:

```bash
# Manual backup
pg_dump "postgresql://your-railway-db-url" > backup.sql

# Restore if needed
psql "postgresql://your-railway-db-url" < backup.sql
```

### 7.4 Monitor Usage

- Check Railway usage/billing
- Monitor OpenAI API usage/costs
- Monitor Google Maps API usage
- Set up alerts for high usage

---

## 📊 **STEP 8: ONGOING OPERATIONS**

### Running Agent Regularly

**Option A: Manual Runs (MVP approach)**
```bash
# Activate virtual environment
cd agent
source venv/bin/activate

# Run for different locations/types
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 25
python agent.py --city "Missoula" --state "MT" --type "dental" --max 25
python agent.py --city "Billings" --state "MT" --type "cosmetic" --max 25
```

**Option B: Scheduled Runs (Future)**
- Set up cron job on server
- Use GitHub Actions for scheduled runs
- Use Railway Cron Jobs (when available)

### Monitoring

```bash
# Check agent run history
curl https://your-backend.railway.app/api/admin/agent/runs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check provider counts
psql "YOUR_DATABASE_URL" -c "SELECT status, COUNT(*) FROM providers GROUP BY status;"
```

### Data Quality

```bash
# Find low-confidence providers
psql "YOUR_DATABASE_URL" -c "
  SELECT practice_name, data_quality_score, needs_review 
  FROM providers 
  WHERE data_quality_score < 70 
  ORDER BY data_quality_score;
"

# Find providers needing approval
psql "YOUR_DATABASE_URL" -c "
  SELECT practice_name, city, state, source 
  FROM providers 
  WHERE status = 'draft' 
  ORDER BY created_at DESC;
"
```

---

## 🆘 **TROUBLESHOOTING**

### Database Connection Issues

```bash
# Test connection
psql "YOUR_DATABASE_URL" -c "SELECT NOW();"

# Check Railway logs
railway logs
```

### Agent Errors

**"Authentication failed"**
- Check API_ADMIN_EMAIL and API_ADMIN_PASSWORD in agent/.env
- Verify backend is deployed and accessible

**"Google Maps API error"**
- Verify API key is correct
- Check that Places API is enabled in Google Cloud Console
- Check API key restrictions

**"OpenAI API error"**
- Verify API key is valid
- Check your OpenAI account has credits
- Try a simpler model (gpt-3.5-turbo)

**"Selenium/ChromeDriver error"**
- Install ChromeDriver: `brew install chromedriver`
- Or use Playwright: `pip install playwright; playwright install`

### Export Data Before Rebuilding

```bash
# Always export before major changes
curl https://your-backend.railway.app/api/admin/export/providers.json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o providers-backup-$(date +%Y%m%d).json
```

---

## 🎯 **SUCCESS CHECKLIST**

- [ ] Railway PostgreSQL database created
- [ ] Schema initialized with all tables
- [ ] Backend API deployed to Railway
- [ ] Backend health check returns "healthy"
- [ ] Admin login works
- [ ] Cloudinary account configured
- [ ] Google Maps API key working
- [ ] OpenAI API key working
- [ ] Agent runs successfully on local machine
- [ ] Agent can create provider profiles
- [ ] Data export endpoints working
- [ ] Default admin password changed
- [ ] Backup strategy in place

---

## 📚 **NEXT STEPS**

1. **Build Admin Dashboard React App** (we'll do this next)
2. **Set up provider claiming workflow**
3. **Configure email notifications**
4. **Implement consumer app API integration**
5. **Scale to more cities**

---

## 🔗 **USEFUL LINKS**

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app/
- Vercel Dashboard: https://vercel.com/dashboard
- Cloudinary Dashboard: https://cloudinary.com/console
- Google Cloud Console: https://console.cloud.google.com
- OpenAI Platform: https://platform.openai.com

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check backend health: `https://your-backend.railway.app/health`
3. Check agent error messages
4. Export your data before making changes
5. Review this guide step-by-step

---

**You're now ready to start populating your provider database!** 🎉
