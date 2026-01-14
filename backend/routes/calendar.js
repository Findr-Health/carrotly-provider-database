/**
 * Calendar Integration Routes
 * 
 * Handles Google Calendar OAuth and FreeBusy API
 * For real-time provider availability
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Provider = require('../models/Provider');

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://fearless-achievement-production.up.railway.app/api/calendar/google/callback'
    : 'http://localhost:3000/api/calendar/google/callback'
);

// Scopes for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * GET /api/calendar/google/auth/:providerId
 * Initiate Google OAuth flow
 */
router.get('/google/auth/:providerId', (req, res) => {
  const { providerId } = req.params;
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: providerId // Pass providerId through OAuth flow
  });
  
  res.json({ authUrl });
});

/**
 * GET /api/calendar/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', async (req, res) => {
  const { code, state: providerId } = req.query;
  
  if (!code || !providerId) {
    return res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=missing_params');
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user's email from token
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Get primary calendar ID
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary) || calendarList.data.items[0];
    
    // Update provider with calendar credentials
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.provider': 'google',
      'calendar.accessToken': tokens.access_token,
      'calendar.refreshToken': tokens.refresh_token,
      'calendar.tokenExpiry': new Date(tokens.expiry_date),
      'calendar.calendarEmail': userInfo.data.email,
      'calendar.calendarId': primaryCalendar?.id || 'primary',
      'calendar.syncDirection': 'two-way',
      'calendar.syncBusyOnly': true,
      calendarConnected: true
    });
    
    res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=success');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=${encodeURIComponent(error.message)}`);  }
});

/**
 * GET /api/calendar/status/:providerId
 * Get calendar connection status
 */
router.get('/status/:providerId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      connected: provider.calendarConnected || false,
      provider: provider.calendar?.provider || null,
      email: provider.calendar?.calendarEmail || null,
      calendarId: provider.calendar?.calendarId || null,
      syncDirection: provider.calendar?.syncDirection || null
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/disconnect/:providerId
 * Disconnect calendar integration
 */
router.post('/disconnect/:providerId', async (req, res) => {
  try {
    await Provider.findByIdAndUpdate(req.params.providerId, {
      'calendar.provider': null,
      'calendar.accessToken': null,
      'calendar.refreshToken': null,
      'calendar.tokenExpiry': null,
      'calendar.calendarEmail': null,
      'calendar.calendarId': null,
      calendarConnected: false
    });
    
    res.json({ success: true, message: 'Calendar disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Refresh access token if expired
 */
async function getValidTokens(provider) {
  if (!provider.calendar?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const tokenExpiry = new Date(provider.calendar.tokenExpiry);
  const now = new Date();
  
  // If token expires within 5 minutes, refresh it
  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    oauth2Client.setCredentials({
      refresh_token: provider.calendar.refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update stored tokens
    await Provider.findByIdAndUpdate(provider._id, {
      'calendar.accessToken': credentials.access_token,
      'calendar.tokenExpiry': new Date(credentials.expiry_date)
    });
    
    return credentials.access_token;
  }
  
  return provider.calendar.accessToken;
}

/**
 * GET /api/calendar/freebusy/:providerId
 * Get provider's busy times for a date range
 */
router.get('/freebusy/:providerId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const provider = await Provider.findById(req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    if (!provider.calendarConnected || provider.calendar?.provider !== 'google') {
      // Return empty if no calendar connected - use manual availability
      return res.json({ busy: [], source: 'manual' });
    }
    
    // Get valid access token
    const accessToken = await getValidTokens(provider);
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: provider.calendar.refreshToken
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate || new Date().toISOString(),
        timeMax: endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        items: [{ id: provider.calendar.calendarId || 'primary' }]
      }
    });
    
    const busyTimes = freeBusyResponse.data.calendars[provider.calendar.calendarId || 'primary']?.busy || [];
    
    res.json({ 
      busy: busyTimes,
      source: 'google',
      calendarId: provider.calendar.calendarId
    });
  } catch (error) {
    console.error('FreeBusy error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/create-event/:providerId
 * Create a calendar event when booking is made
 */
router.post('/create-event/:providerId', async (req, res) => {
  try {
    const { title, description, startTime, endTime, patientName, patientEmail, bookingId } = req.body;
    const provider = await Provider.findById(req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    if (!provider.calendarConnected || provider.calendar?.provider !== 'google') {
      return res.json({ success: true, message: 'No calendar connected - skipping event creation' });
    }
    
    const accessToken = await getValidTokens(provider);
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: provider.calendar.refreshToken
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title || `Findr Health: ${patientName}`,
      description: description || `Booking via Findr Health\nPatient: ${patientName}\nBooking ID: ${bookingId}`,
      start: {
        dateTime: startTime,
        timeZone: 'America/Denver'
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Denver'
      },
      attendees: patientEmail ? [{ email: patientEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId: provider.calendar.calendarId || 'primary',
      requestBody: event,
      sendUpdates: 'all'
    });
    
    res.json({ 
      success: true, 
      eventId: createdEvent.data.id,
      eventLink: createdEvent.data.htmlLink
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
