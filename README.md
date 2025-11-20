# 🥕 Carrotly Provider Database System

**A complete, portable provider database and AI agent system for healthcare marketplaces.**

---

## 📖 **Overview**

This system provides a complete backend infrastructure for managing healthcare provider profiles with an intelligent AI agent that automatically discovers and enriches provider data.

### **Key Features**

✅ **Portable Database** - PostgreSQL schema with export functionality  
✅ **REST API** - Standard endpoints for any frontend  
✅ **AI Agent** - Automated provider discovery via Google Maps  
✅ **Duplicate Detection** - Smart fuzzy matching prevents duplicates  
✅ **Data Enrichment** - AI-powered web scraping extracts services & pricing  
✅ **Admin Dashboard Ready** - Full CRUD API for management UI  
✅ **Public API** - Consumer app endpoints for approved providers  
✅ **Export Anytime** - JSON/CSV exports for data portability  

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────┐
│  AI AGENT (Python - Standalone)                 │
│  ├─ Google Maps API discovery                   │
│  ├─ Web scraping + AI extraction               │
│  ├─ Duplicate detection                         │
│  └─ Communicates via REST API only             │
└─────────────────────────────────────────────────┘
                     ↕ HTTP REST
┌─────────────────────────────────────────────────┐
│  BACKEND API (Node.js + Express on Railway)    │
│  ├─ Provider CRUD endpoints                    │
│  ├─ Admin authentication (JWT)                 │
│  ├─ Agent run management                       │
│  ├─ Data export endpoints                      │
│  └─ Public consumer API                        │
└─────────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL on Railway)              │
│  ├─ Provider profiles                          │
│  ├─ Services & photos                          │
│  ├─ Agent run history                          │
│  └─ Audit logs                                 │
└─────────────────────────────────────────────────┘
```

---

## 📂 **Project Structure**

```
carrotly-provider-database/
├── schema.sql                    # PostgreSQL database schema
├── DEPLOYMENT_GUIDE.md           # Step-by-step deployment instructions
├── README.md                     # This file
│
├── backend/                      # Node.js API server
│   ├── server.js                 # Main Express application
│   ├── package.json              # Node dependencies
│   ├── .env.example              # Environment template
│   └── README.md                 # Backend-specific docs
│
└── agent/                        # Python AI agent
    ├── agent.py                  # Main agent script
    ├── requirements.txt          # Python dependencies
    ├── .env.example              # Agent configuration template
    └── README.md                 # Agent-specific docs
```

---

## 🚀 **Quick Start**

### **Prerequisites**

- Railway account (for database + backend hosting)
- Google Maps API key
- OpenAI API key
- Node.js 18+
- Python 3.9+

### **1. Deploy Database & Backend (15 minutes)**

```bash
# 1. Create PostgreSQL database on Railway
# 2. Initialize schema with schema.sql
# 3. Deploy backend to Railway
# 4. Configure environment variables

# See DEPLOYMENT_GUIDE.md for detailed steps
```

### **2. Set Up AI Agent (10 minutes)**

```bash
cd agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your API keys

# Test run
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 5
```

### **3. Start Using the System**

```bash
# Run agent to populate database
python agent.py --city "Bozeman" --state "MT" --type "medical" --max 25

# Export data anytime
curl https://your-backend.railway.app/api/admin/export/providers.json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o providers.json
```

---

## 🎯 **Core Capabilities**

### **AI Agent Features**

- 🔍 **Discovery**: Finds providers via Google Maps Places API
- 🌐 **Enrichment**: Scrapes websites for services, pricing, photos
- 🤖 **AI Extraction**: Uses GPT-4 to structure unstructured data
- ✅ **Quality Scoring**: Assigns confidence scores (0-100)
- 🚫 **Duplicate Prevention**: Multi-level matching algorithm
- 📊 **Reporting**: Detailed run summaries and exports

### **Database Features**

- 📋 **Complete Provider Profiles**: Name, location, services, photos, credentials
- 🔗 **Relational Design**: Separate tables for photos, services, team members
- 🔍 **Full-Text Search**: Fast searching with PostgreSQL pg_trgm
- 🗺️ **Geospatial**: PostGIS support for location-based queries
- 📝 **Audit Logs**: Complete change history tracking
- 💾 **Soft Deletes**: Preserves data for recovery

### **API Features**

- 🔐 **Authentication**: JWT-based admin auth
- 📡 **RESTful**: Standard HTTP methods and status codes
- 🔄 **CRUD Operations**: Full provider management
- 📤 **Data Export**: JSON and CSV formats
- 🌍 **Public API**: Read-only endpoints for consumer app
- 📊 **Agent Management**: Trigger and monitor AI runs

---

## 📊 **Data Model**

### **Core Tables**

```sql
providers                 -- Main provider profiles
├── provider_photos       -- Photo gallery (Cloudinary URLs)
├── provider_services     -- Services offered with pricing
├── provider_details      -- Optional credentials & background
├── team_members          -- Staff profiles
├── provider_agreements   -- Legal agreements & signatures
└── agent_runs            -- AI agent execution history
```

### **Provider Status Flow**

```
draft → pending → approved → live
              ↓
          rejected / suspended
```

---

## 🔒 **Security & Privacy**

- ✅ JWT authentication for all admin endpoints
- ✅ bcrypt password hashing
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Environment variable secrets
- ✅ Audit logging for all changes
- ✅ Soft deletes preserve data

---

## 🌐 **API Endpoints**

### **Admin Endpoints** (Require JWT)

```
POST   /api/admin/login                  # Authenticate
GET    /api/admin/providers              # List providers
GET    /api/admin/providers/:id          # Get provider details
POST   /api/admin/providers              # Create provider
PUT    /api/admin/providers/:id          # Update provider
PATCH  /api/admin/providers/:id/status   # Approve/reject
DELETE /api/admin/providers/:id          # Delete provider

POST   /api/admin/agent/run              # Start AI agent
GET    /api/admin/agent/runs             # List agent runs
GET    /api/admin/agent/runs/:id/status  # Check run status

GET    /api/admin/export/providers.json  # Export as JSON
GET    /api/admin/export/providers.csv   # Export as CSV
```

### **Public Endpoints** (No Auth Required)

```
GET    /api/public/providers             # Search providers
GET    /api/public/providers/:id         # Get provider profile
```

---

## 🤖 **AI Agent Usage**

### **Command Line Interface**

```bash
python agent.py \
  --city "Bozeman" \
  --state "MT" \
  --type "medical" \
  --max 25
```

### **Provider Types**

- `medical` - Primary care, urgent care, specialists
- `dental` - Dentists, orthodontists
- `cosmetic` - Med spas, cosmetic surgery
- `fitness` - Gyms, personal trainers
- `massage` - Massage therapy, spas
- `mental_health` - Therapists, counselors
- `skincare` - Dermatology, esthetics

### **Agent Output**

```
============================================================
🤖 CARROTLY PROVIDER AI AGENT
============================================================
📍 Location: Bozeman, MT
🏥 Category: medical
🎯 Max Profiles: 25
============================================================

✅ Found 47 providers from Google Maps
[1/25] Processing: Smith Family Medicine
🌐 Enriching: Smith Family Medicine...
✅ Enriched with confidence: 85%
✅ Created profile ID: 123e4567...

📊 AGENT RUN SUMMARY
⏱️  Duration: 234.5 seconds
🔍 Providers Found: 47
⏭️  Exact Duplicates Skipped: 12
✅ New Profiles Created: 25

📁 Results exported to: ./exports/agent_run_Bozeman_MT_medical_20251109.json
```

---

## 📤 **Data Portability**

### **Why Portability Matters**

This system is designed so you can **migrate to any future platform** without losing your provider data. The AI agent and database are decoupled and communicate only via standard REST APIs.

### **Export Options**

**JSON Export** (Complete data, nested structure)
```bash
curl https://api.carrotly.com/api/admin/export/providers.json \
  -H "Authorization: Bearer TOKEN" \
  -o providers-export.json
```

**CSV Export** (Flattened data, Excel-friendly)
```bash
curl https://api.carrotly.com/api/admin/export/providers.csv \
  -H "Authorization: Bearer TOKEN" \
  -o providers-export.csv
```

**Database Dump** (Direct PostgreSQL backup)
```bash
pg_dump "YOUR_DATABASE_URL" > providers-backup.sql
```

### **Import to New Platform**

```bash
# Restore to new PostgreSQL database
psql "NEW_DATABASE_URL" < providers-backup.sql

# Or import JSON via new API
curl -X POST https://new-platform.com/api/import/providers \
  -H "Content-Type: application/json" \
  -d @providers-export.json
```

---

## 📈 **Scaling Strategy**

### **MVP (Weeks 1-2)**
- ✅ Deploy database + backend + agent
- ✅ Manually run agent for 5-10 cities
- ✅ Admin reviews and approves profiles
- ✅ Target: 100-500 providers

### **Phase 2 (Weeks 3-4)**
- ⏳ Build admin dashboard UI
- ⏳ Add provider claiming workflow
- ⏳ Integrate with consumer app
- ⏳ Target: 1,000 providers

### **Phase 3 (Month 2)**
- ⏳ Automate agent runs (cron jobs)
- ⏳ Implement email notifications
- ⏳ Add provider reviews/ratings
- ⏳ Target: 5,000 providers

### **Production (Month 3+)**
- ⏳ Multi-region deployment
- ⏳ Advanced search (filters, radius)
- ⏳ Provider analytics dashboard
- ⏳ Target: 10,000+ providers

---

## 🛠️ **Development**

### **Local Development**

```bash
# Backend
cd backend
npm install
npm run dev

# Agent
cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python agent.py --help
```

### **Testing**

```bash
# Backend tests (TODO)
cd backend
npm test

# Agent tests (TODO)
cd agent
pytest
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Agent can't authenticate**
- Check `API_BASE_URL` in agent/.env
- Verify backend is deployed and accessible
- Test login: `curl -X POST https://api.../api/admin/login -d '...'`

**Duplicate providers being created**
- Check PostgreSQL has `pg_trgm` extension enabled
- Verify `check_duplicate_provider()` function exists
- Review agent duplicate threshold settings

**Low confidence scores**
- Provider website may be blocking scrapers
- Website may require JavaScript rendering
- OpenAI API may be rate-limited
- Manually review and improve data

**Google Maps API errors**
- Verify API key is correct
- Check Places API is enabled
- Review daily quota limits
- Add billing if free tier exceeded

---

## 💰 **Cost Estimates (MVP)**

### **Monthly Costs**

- **Railway**
  - PostgreSQL: $5-10/month (512MB database)
  - Backend hosting: $5/month (512MB RAM)
  - **Total: ~$10-15/month**

- **Cloudinary**
  - Free tier: 25GB storage, 25K transformations
  - Sufficient for 5,000+ provider photos
  - **Total: $0/month (free tier)**

- **Google Maps API**
  - $0.017 per Places Text Search request
  - $0.017 per Place Details request
  - 25 providers/run × 2 requests × 40 runs/month = 2,000 requests
  - Google gives $200/month free credit
  - **Total: ~$34/month (covered by free credit)**

- **OpenAI API**
  - GPT-4 Turbo: $0.01 per 1K input tokens, $0.03 per 1K output
  - ~500 tokens per provider enrichment
  - 1,000 providers/month × $0.02 = $20
  - **Total: ~$20/month**

**Estimated Total: $30-35/month for 1,000 providers/month**

---

## 📚 **Documentation**

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete setup instructions
- [API Documentation](backend/README.md) - API endpoint reference
- [Agent Documentation](agent/README.md) - Agent usage and configuration
- [Database Schema](schema.sql) - Full schema with comments

---

## 🤝 **Contributing**

This is a proprietary project, but suggestions are welcome!

---

## 📞 **Support**

For issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Review error logs: `railway logs` or `agent logs`
3. Test API health: `https://your-backend.railway.app/health`
4. Export data before making major changes

---

## 📄 **License**

Copyright © 2025 Carrotly. All rights reserved.

---

## 🎉 **You're Ready!**

Follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to get started in under 30 minutes.

**Happy provider onboarding!** 🥕✨
