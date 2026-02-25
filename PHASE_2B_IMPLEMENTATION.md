# Phase 2B Implementation Guide

**Date:** December 25, 2024  
**Status:** Ready to Apply

---

## Files Created

### Backend Models (NEW - create `/backend/models/`)

| File | Description |
|------|-------------|
| `Inquiry.js` | User inquiries (provider outreach, international validation, consultations) |
| `Service.js` | Healthcare services (MRI, CBC, etc.) |
| `ClarityProvider.js` | Providers for price database (different from onboarding Provider) |
| `Price.js` | Links services to providers with cash prices |

### Backend Routes (NEW)

| File | Description |
|------|-------------|
| `clarityAdmin.js` | API endpoints for inquiries, services, providers, prices |

### Admin Dashboard Pages (NEW)

| File | Description |
|------|-------------|
| `InquiryQueue.jsx` | View and manage user inquiries |
| `PriceDatabase.jsx` | Manage services, providers, and prices |

---

## How to Apply

### Step 1: Create Backend Models

```bash
cd ~/Desktop/carrotly-provider-database

# Copy model files
cp ~/Downloads/Inquiry.js backend/models/
cp ~/Downloads/Service.js backend/models/
cp ~/Downloads/ClarityProvider.js backend/models/
cp ~/Downloads/Price.js backend/models/
```

### Step 2: Copy Backend Route

```bash
cp ~/Downloads/clarityAdmin.js backend/routes/
```

### Step 3: Update Backend server.js

Add this line after other route imports (around line 15-20):

```javascript
const clarityAdminRoutes = require('./routes/clarityAdmin');
```

Add this line after other app.use statements (around line 40-50):

```javascript
app.use('/api/clarity-admin', clarityAdminRoutes);
```

### Step 4: Copy Admin Dashboard Pages

```bash
cp ~/Downloads/InquiryQueue.jsx admin-dashboard/src/pages/
cp ~/Downloads/PriceDatabase.jsx admin-dashboard/src/pages/
```

### Step 5: Update Admin Dashboard App.jsx

Add imports at top:

```javascript
import InquiryQueue from './pages/InquiryQueue';
import PriceDatabase from './pages/PriceDatabase';
```

Add routes inside the Routes component:

```jsx
<Route path="/inquiries" element={<ProtectedRoute><InquiryQueue /></ProtectedRoute>} />
<Route path="/price-database" element={<ProtectedRoute><PriceDatabase /></ProtectedRoute>} />
```

### Step 6: Update Admin Navbar

Add navigation links in `admin-dashboard/src/components/Navbar.jsx`:

```jsx
<Link to="/inquiries" className="...">Inquiries</Link>
<Link to="/price-database" className="...">Price Database</Link>
```

### Step 7: Commit and Deploy

```bash
cd ~/Desktop/carrotly-provider-database
git add .
git commit -m "Phase 2B: Add inquiry queue and price database admin infrastructure"
git push origin main
```

---

## API Endpoints Added

### Inquiries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/inquiries` | List all inquiries (with filters) |
| GET | `/api/clarity-admin/inquiries/:id` | Get single inquiry |
| POST | `/api/clarity-admin/inquiries` | Create inquiry (from chat) |
| PUT | `/api/clarity-admin/inquiries/:id` | Update inquiry |
| PATCH | `/api/clarity-admin/inquiries/:id/status` | Update status |
| DELETE | `/api/clarity-admin/inquiries/:id` | Delete inquiry |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/services` | List all services |
| GET | `/api/clarity-admin/services/:id` | Get single service |
| POST | `/api/clarity-admin/services` | Create service |
| PUT | `/api/clarity-admin/services/:id` | Update service |
| DELETE | `/api/clarity-admin/services/:id` | Delete service |

### Clarity Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/clarity-providers` | List all providers |
| GET | `/api/clarity-admin/clarity-providers/:id` | Get single provider |
| POST | `/api/clarity-admin/clarity-providers` | Create provider |
| PUT | `/api/clarity-admin/clarity-providers/:id` | Update provider |
| DELETE | `/api/clarity-admin/clarity-providers/:id` | Delete provider |

### Prices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/prices` | List all prices |
| GET | `/api/clarity-admin/prices/:id` | Get single price |
| POST | `/api/clarity-admin/prices` | Create price |
| PUT | `/api/clarity-admin/prices/:id` | Update price |
| DELETE | `/api/clarity-admin/prices/:id` | Delete price |

### Public (for LLM)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/lookup/price` | Lookup price by service and location |

### Dashboard Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clarity-admin/dashboard/clarity-stats` | Get clarity platform stats |

---

## Testing Checklist

After deployment:

1. **Admin Dashboard Access**
   - [ ] Login to admin dashboard
   - [ ] Navigate to Inquiries page
   - [ ] Navigate to Price Database page

2. **Services CRUD**
   - [ ] Add a new service (e.g., "MRI Brain without contrast")
   - [ ] Edit the service
   - [ ] Delete the service

3. **Providers CRUD**
   - [ ] Add a new provider (e.g., "Valley Imaging Center")
   - [ ] Edit the provider
   - [ ] Delete the provider

4. **Prices CRUD**
   - [ ] Add a price linking a service to a provider
   - [ ] Edit the price
   - [ ] Delete the price

5. **Inquiries**
   - [ ] View inquiry list
   - [ ] Filter by type
   - [ ] Filter by status
   - [ ] Update inquiry status
   - [ ] Add admin notes

---

## Next Steps (Phase 2C)

Once Phase 2B is deployed:

1. **Populate Price Database**
   - Add common imaging services (MRI, CT, X-ray, Ultrasound)
   - Add lab services (CBC, CMP, Lipid Panel, etc.)
   - Add dental services
   - Add providers in major metros
   - Research and enter cash prices

2. **Connect LLM to Price Database**
   - Update clarity.js to call `/api/clarity-admin/lookup/price`
   - Integrate price results into LLM responses

3. **Connect LLM to Inquiry Creation**
   - When user confirms provider outreach, create inquiry
   - When user provides email for international validation, create inquiry
