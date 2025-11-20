# 🚀 QUICK START REFERENCE

## ⚡ **30-Minute Setup**

### **1. Database (5 min)**
```bash
# On Railway.app
1. Create PostgreSQL database
2. Copy connection URL
3. Run schema.sql in Railway's Query tab
```

### **2. Backend API (10 min)**
```bash
cd backend
npm install
# Create .env with DATABASE_URL from Railway
railway init
railway up
# Get your API URL: https://xxx.railway.app
```

### **3. AI Agent (10 min)**
```bash
cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env with API keys
```

### **4. Test (5 min)**
```bash
# Test backend
curl https://your-backend.railway.app/health

# Run agent
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 5
```

---

## 🔑 **Required API Keys**

| Service | Where to Get | Cost | Purpose |
|---------|-------------|------|---------|
| Railway | railway.app | ~$15/mo | Database + Backend |
| Google Maps | console.cloud.google.com | Free ($200/mo credit) | Provider discovery |
| OpenAI | platform.openai.com | ~$20/1000 providers | Data extraction |
| Cloudinary | cloudinary.com | Free (25GB) | Photo storage |

---

## 📝 **Environment Variables Checklist**

### **Backend (.env)**
```env
✅ NODE_ENV=production
✅ PORT=3000
✅ DATABASE_URL=postgresql://...
✅ FRONTEND_URL=https://...
✅ JWT_SECRET=random-32-char-string
✅ CLOUDINARY_CLOUD_NAME=...
✅ CLOUDINARY_API_KEY=...
✅ CLOUDINARY_API_SECRET=...
```

### **Agent (.env)**
```env
✅ API_BASE_URL=https://your-backend.railway.app/api
✅ API_ADMIN_EMAIL=admin@carrotly.com
✅ API_ADMIN_PASSWORD=admin123
✅ GOOGLE_MAPS_API_KEY=...
✅ OPENAI_API_KEY=sk-...
```

---

## 🤖 **Agent Commands**

```bash
# Basic run
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 25

# All provider types
--type medical | dental | cosmetic | fitness | massage | mental_health | skincare

# Examples
python agent.py --city "Missoula" --state "MT" --type "dental" --max 20
python agent.py --city "Billings" --state "MT" --type "cosmetic" --max 15
```

---

## 🔗 **Key API Endpoints**

```bash
# Admin Login
POST /api/admin/login
Body: {"email": "admin@carrotly.com", "password": "admin123"}

# List Providers
GET /api/admin/providers?city=Bozeman&status=approved

# Create Provider
POST /api/admin/providers
Body: {provider data}

# Start Agent Run
POST /api/admin/agent/run
Body: {"city": "Bozeman", "state": "MT", "categories": ["medical"], "maxProfiles": 25}

# Export Data
GET /api/admin/export/providers.json
GET /api/admin/export/providers.csv
```

---

## 🛡️ **Security Checklist**

```bash
✅ Change default admin password immediately
✅ Use strong JWT_SECRET (32+ random characters)
✅ Never commit .env files to Git
✅ Restrict Google API keys by domain/IP
✅ Enable Railway 2FA
✅ Set up database backups
```

---

## 📊 **Database Quick Queries**

```sql
-- Count providers by status
SELECT status, COUNT(*) FROM providers GROUP BY status;

-- Recent agent runs
SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 10;

-- Low confidence providers
SELECT practice_name, data_quality_score 
FROM providers 
WHERE data_quality_score < 70;

-- Providers pending approval
SELECT practice_name, city, state, created_at 
FROM providers 
WHERE status = 'draft' 
ORDER BY created_at DESC;
```

---

## 🚨 **Troubleshooting Quick Fixes**

### **Agent won't start**
```bash
# Check Python version (need 3.9+)
python3 --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Test API connection
curl https://your-backend.railway.app/health
```

### **Backend won't deploy**
```bash
# Check Railway logs
railway logs

# Verify DATABASE_URL is set
railway variables

# Test locally
npm run dev
```

### **Database errors**
```bash
# Test connection
psql "YOUR_DATABASE_URL" -c "SELECT NOW();"

# Re-run schema
psql "YOUR_DATABASE_URL" < schema.sql
```

---

## 💾 **Backup & Export**

```bash
# Export all data (do this before major changes!)
curl https://api.../api/admin/export/providers.json -H "Auth: ..." -o backup.json

# Database backup
pg_dump "DATABASE_URL" > backup-$(date +%Y%m%d).sql

# Restore
psql "DATABASE_URL" < backup.sql
```

---

## 📈 **Growth Milestones**

| Milestone | Providers | Actions |
|-----------|-----------|---------|
| Week 1 | 100 | Test in 1-2 cities |
| Week 2 | 500 | Expand to 5-10 cities |
| Month 1 | 1,000 | Launch consumer app |
| Month 2 | 5,000 | Automate agent runs |
| Month 3 | 10,000+ | Scale nationally |

---

## 🎯 **Daily Operations**

**Morning:**
```bash
# Check overnight agent runs
curl https://api.../api/admin/agent/runs | jq

# Review pending approvals
psql DATABASE_URL -c "SELECT COUNT(*) FROM providers WHERE status='draft';"
```

**Run Agent:**
```bash
cd agent
source venv/bin/activate
python agent.py --city "CityName" --state "ST" --type "TYPE" --max 25
```

**End of Day:**
```bash
# Export data backup
curl https://api.../api/admin/export/providers.json -o backup.json

# Check system health
curl https://api.../health
```

---

## 🔗 **Essential Links**

- Railway Dashboard: https://railway.app/dashboard
- Google Cloud Console: https://console.cloud.google.com
- OpenAI Platform: https://platform.openai.com
- Cloudinary Console: https://cloudinary.com/console

---

## 📞 **Emergency Contacts**

1. Railway Status: https://status.railway.app
2. Google Cloud Support: console.cloud.google.com/support
3. OpenAI Status: status.openai.com

---

## ✅ **Pre-Launch Checklist**

```bash
✅ Database schema applied
✅ Backend deployed to Railway
✅ Backend health check passes
✅ Admin login works
✅ Agent runs successfully
✅ Duplicate detection works
✅ Data export works
✅ Default password changed
✅ API keys secured
✅ Backup strategy in place
```

---

**Keep this reference handy for daily operations!** 📌
