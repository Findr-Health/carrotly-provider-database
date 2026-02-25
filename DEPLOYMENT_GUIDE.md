# Clarity AI Provider Search - Deployment Guide

## Overview

This update adds intelligent provider search to the Clarity AI chat. When users ask to find providers, the AI will:

1. **Ask clarifying questions** if the provider type is unclear
2. **Search our provider database** for nearby approved providers
3. **Present results** with a link to view the provider profile in the app
4. **Log unmet demand** when no providers are found (for sales outreach)

## Files Created

```
clarity-updates/
├── routes/
│   ├── clarity.js          # Updated main chat endpoint with tool calling
│   ├── clarityTools.js     # API tools for direct access
│   └── inquiriesAdmin.js   # Admin API for inquiry management
├── models/
│   └── Inquiry.js          # Updated model with AI chat fields
├── prompts/
│   └── claritySystemPrompt.js  # New system prompt with tool instructions
└── pages/
    └── InquiryQueue.jsx    # Updated admin page with outreach tracking
```

## Deployment Steps

### Step 1: Copy Backend Files

```bash
cd ~/Desktop/carrotly-provider-database/backend

# Copy routes
cp ~/Downloads/clarity-updates/routes/clarity.js routes/
cp ~/Downloads/clarity-updates/routes/clarityTools.js routes/
cp ~/Downloads/clarity-updates/routes/inquiriesAdmin.js routes/

# Copy models (backup first)
cp models/Inquiry.js models/Inquiry.js.backup
cp ~/Downloads/clarity-updates/models/Inquiry.js models/

# Create prompts directory if needed and copy
mkdir -p prompts
cp ~/Downloads/clarity-updates/prompts/claritySystemPrompt.js prompts/
```

### Step 2: Update server.js

Add these imports at the top:

```javascript
const clarityRoutes = require('./routes/clarity');
const clarityToolsRoutes = require('./routes/clarityTools');
const inquiriesAdminRoutes = require('./routes/inquiriesAdmin');
```

Add these route mounts:

```javascript
// Clarity AI routes
app.use('/api/clarity', clarityRoutes);
app.use('/api/clarity', clarityToolsRoutes);

// Admin inquiries management
app.use('/api/admin/inquiries', inquiriesAdminRoutes);
```

### Step 3: Update Admin Dashboard

```bash
# Copy updated InquiryQueue page
cp ~/Downloads/clarity-updates/pages/InquiryQueue.jsx ~/Desktop/carrotly-provider-database/admin-dashboard/src/pages/
```

### Step 4: Deploy

```bash
cd ~/Desktop/carrotly-provider-database
git add .
git commit -m "Add AI provider search with tool calling and outreach tracking"
git push
```

## How It Works

### Chat Flow with Provider Search

```
User: "I need a dentist near me"

AI: [Internally calls searchProviders tool with user's location]

If providers found:
AI: "I found Aesthetic Dentistry of Manhattan, a Dental practice 2.3 miles 
     from you. Would you like to view their profile to see services and 
     book an appointment? [PROVIDER:692754d1eb3f7c1cc4266e61]"

If no providers found:
AI: [Internally calls logProviderRequest tool]
AI: "I don't see any dentists on our platform in your area yet, but we're 
     always expanding. I've noted your interest and our team will reach 
     out to local dentists to invite them. In the meantime, I can help 
     you understand typical costs for dental services."
```

### Mobile App Integration

The AI response includes a special format for provider links:
```
[PROVIDER:provider_id_here]
```

The mobile app should parse this and render a tappable button that navigates to the provider profile screen.

**Example Flutter parsing:**

```dart
final providerRegex = RegExp(r'\[PROVIDER:([^\]]+)\]');
final matches = providerRegex.allMatches(message);

for (final match in matches) {
  final providerId = match.group(1);
  // Replace with tappable widget that navigates to provider detail
}
```

### API Request Format

```javascript
POST /api/clarity/chat
{
  "message": "I need a dentist",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "state": "NY"
  },
  "userId": "optional-user-id",
  "conversationId": "optional-conversation-id"
}
```

### API Response Format

```javascript
{
  "success": true,
  "message": "I found Aesthetic Dentistry of Manhattan...[PROVIDER:abc123]",
  "providerIds": ["abc123"],
  "usage": {
    "inputTokens": 1234,
    "outputTokens": 567
  }
}
```

## Admin Dashboard Features

### Inquiry Queue Updates

- **Filter by Source**: See inquiries from AI Chat vs other sources
- **Filter by Type**: Focus on Provider Outreach requests
- **Top Requested Types**: See which provider types have unmet demand
- **Location Tracking**: See where users are searching without coverage
- **Follow-up Tracking**: Log outreach attempts to local providers
- **Outcome Tracking**: Mark when providers are onboarded or decline

## Testing

### Test Provider Search

```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/clarity/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a dentist near me",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "city": "New York",
      "state": "NY"
    }
  }'
```

### Test No Results (triggers outreach logging)

```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/clarity/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a chiropractor",
    "location": {
      "latitude": 45.6795,
      "longitude": -111.0350,
      "city": "Bozeman",
      "state": "MT"
    }
  }'
```

### Test Inquiry Stats

```bash
TOKEN="your-admin-token"
curl "https://fearless-achievement-production.up.railway.app/api/admin/inquiries/stats" \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

Ensure these are set in Railway:

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `JWT_SECRET` - For admin authentication
- `MONGODB_URI` - Database connection

## Provider Types Supported

The AI recognizes these provider types and their aliases:

| User Says | Searches For |
|-----------|--------------|
| dentist, dental | Dental |
| doctor, medical, physician | Medical |
| urgent care | Urgent Care |
| therapist, counselor, psychiatrist | Mental Health |
| skincare, aesthetics, dermatology | Skincare/Aesthetics |
| massage, chiropractor | Massage/Bodywork |
| trainer, fitness, gym | Fitness/Training |
| yoga, pilates | Yoga/Pilates |
| nutritionist, dietitian | Nutrition/Wellness |
| pharmacy | Pharmacy/RX |
