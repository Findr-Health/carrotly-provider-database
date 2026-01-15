/**
 * Calendar Integration Routes
 * Google Calendar + Microsoft Outlook OAuth
 * With diagnostic field tracking
 * Updated: January 15, 2026
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Provider = require('../models/Provider');

// Google OAuth Setup
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://fearless-achievement-production.up.railway.app/api/calendar/google/callback'
    : 'http://localhost:3000/api/calendar/google/callback'
);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

// Microsoft OAuth Setup
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? 'https://fearless-achievement-production.up.railway.app/api/calendar/microsoft/callback'
  : 'http://localhost:3000/api/calendar/microsoft/callback';

const MICROSOFT_SCOPES = [
  'openid',
  'profile', 
  'email',
  'offline_access',
  'Calendars.ReadWrite',
  'User.Read'
];

// ==================== GOOGLE ROUTES ====================

router.get('/google/auth/:providerId', (req, res) => {
  const { providerId } = req.params;
  
  const authUrl = googleOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state: providerId
  });
  
  res.json({ authUrl });
});

router.get('/google/callback', async (req, res) => {
  const { code, state: providerId } = req.query;
  
  if (!code || !providerId) {
    return res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=missing_params');
  }
  
  try {
    const { tokens } = await googleOAuth2Client.getToken(code);
    
    googleOAuth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary) || calendarList.data.items[0];
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.provider': 'google',
      'calendar.accessToken': tokens.access_token,
      'calendar.refreshToken': tokens.refresh_token,
      'calendar.tokenExpiry': new Date(tokens.expiry_date),
      'calendar.calendarEmail': userInfo.data.email,
      'calendar.calendarId': primaryCalendar?.id || 'primary',
      'calendar.syncDirection': 'two-way',
      'calendar.syncBusyOnly': true,
      'calendar.connectedAt': new Date(),
      'calendar.disconnectedAt': null,
      'calendar.scopesGranted': GOOGLE_SCOPES,
      'calendar.lastSyncAt': new Date(),
      'calendar.lastSyncStatus': 'success',
      'calendar.lastSyncError': null,
      'calendar.syncFailureCount': 0,
      'calendar.lastTokenRefreshAt': new Date(),
      'calendar.tokenRefreshFailures': 0,
      calendarConnected: true
    });
    
    res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=success');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=' + encodeURIComponent(error.message));
  }
});

// ==================== MICROSOFT ROUTES ====================

router.get('/microsoft/auth/:providerId', (req, res) => {
  const { providerId } = req.params;
  
  if (!MICROSOFT_CLIENT_ID) {
    return res.status(500).json({ 
      error: 'Microsoft Calendar not configured. Add MICROSOFT_CALENDAR_CLIENT_ID and MICROSOFT_CALENDAR_CLIENT_SECRET to Railway.' 
    });
  }
  
  const authUrl = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?' +
    'client_id=' + encodeURIComponent(MICROSOFT_CLIENT_ID) +
    '&response_type=code' +
    '&redirect_uri=' + encodeURIComponent(MICROSOFT_REDIRECT_URI) +
    '&response_mode=query' +
    '&scope=' + encodeURIComponent(MICROSOFT_SCOPES.join(' ')) +
    '&state=' + encodeURIComponent(providerId) +
    '&prompt=consent';
  
  res.json({ authUrl });
});

router.get('/microsoft/callback', async (req, res) => {
  const { code, state: providerId, error: oauthError } = req.query;
  
  if (oauthError) {
    return res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=' + encodeURIComponent(oauthError));
  }
  
  if (!code || !providerId) {
    return res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=missing_params');
  }
  
  try {
    const tokenResponse = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code: code,
        redirect_uri: MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }
    
    // Get user info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': 'Bearer ' + tokens.access_token }
    });
    const userInfo = await userResponse.json();
    
    // Get calendars
    const calendarsResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
      headers: { 'Authorization': 'Bearer ' + tokens.access_token }
    });
    const calendarsData = await calendarsResponse.json();
    const primaryCalendar = calendarsData.value?.find(cal => cal.isDefaultCalendar) || calendarsData.value?.[0];
    
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.provider': 'microsoft',
      'calendar.accessToken': tokens.access_token,
      'calendar.refreshToken': tokens.refresh_token,
      'calendar.tokenExpiry': tokenExpiry,
      'calendar.calendarEmail': userInfo.mail || userInfo.userPrincipalName,
      'calendar.calendarId': primaryCalendar?.id || 'primary',
      'calendar.syncDirection': 'two-way',
      'calendar.syncBusyOnly': true,
      'calendar.connectedAt': new Date(),
      'calendar.disconnectedAt': null,
      'calendar.scopesGranted': MICROSOFT_SCOPES,
      'calendar.lastSyncAt': new Date(),
      'calendar.lastSyncStatus': 'success',
      'calendar.lastSyncError': null,
      'calendar.syncFailureCount': 0,
      'calendar.lastTokenRefreshAt': new Date(),
      'calendar.tokenRefreshFailures': 0,
      calendarConnected: true
    });
    
    res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=success&provider=microsoft');
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    res.redirect('https://findrhealth-provider.vercel.app/calendar?calendar=error&reason=' + encodeURIComponent(error.message));
  }
});

// ==================== SHARED ROUTES ====================

router.get('/status/:providerId', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const cal = provider.calendar || {};
    
    res.json({
      connected: provider.calendarConnected || false,
      provider: cal.provider || null,
      email: cal.calendarEmail || null,
      calendarId: cal.calendarId || null,
      syncDirection: cal.syncDirection || null,
      connectedAt: cal.connectedAt || null,
      tokenExpiry: cal.tokenExpiry || null,
      tokenValid: cal.tokenExpiry ? new Date(cal.tokenExpiry) > new Date() : false,
      lastSyncAt: cal.lastSyncAt || null,
      lastSyncStatus: cal.lastSyncStatus || null,
      lastSyncError: cal.lastSyncError || null,
      syncFailureCount: cal.syncFailureCount || 0,
      lastFreeBusyQueryAt: cal.lastFreeBusyQueryAt || null,
      lastFreeBusyStatus: cal.lastFreeBusyStatus || null,
      eventsCreatedCount: cal.eventsCreatedCount || 0
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/disconnect/:providerId', async (req, res) => {
  try {
    await Provider.findByIdAndUpdate(req.params.providerId, {
      'calendar.provider': null,
      'calendar.accessToken': null,
      'calendar.refreshToken': null,
      'calendar.tokenExpiry': null,
      'calendar.calendarEmail': null,
      'calendar.calendarId': null,
      'calendar.scopesGranted': [],
      'calendar.disconnectedAt': new Date(),
      calendarConnected: false
    });
    
    res.json({ success: true, message: 'Calendar disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TOKEN REFRESH ====================

async function refreshGoogleToken(provider) {
  googleOAuth2Client.setCredentials({ refresh_token: provider.calendar.refreshToken });
  const { credentials } = await googleOAuth2Client.refreshAccessToken();
  
  await Provider.findByIdAndUpdate(provider._id, {
    'calendar.accessToken': credentials.access_token,
    'calendar.tokenExpiry': new Date(credentials.expiry_date),
    'calendar.lastTokenRefreshAt': new Date(),
    'calendar.tokenRefreshFailures': 0
  });
  
  return credentials.access_token;
}

async function refreshMicrosoftToken(provider) {
  const tokenResponse = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: provider.calendar.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const tokens = await tokenResponse.json();
  if (tokens.error) throw new Error(tokens.error_description || tokens.error);
  
  const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
  
  await Provider.findByIdAndUpdate(provider._id, {
    'calendar.accessToken': tokens.access_token,
    'calendar.refreshToken': tokens.refresh_token || provider.calendar.refreshToken,
    'calendar.tokenExpiry': tokenExpiry,
    'calendar.lastTokenRefreshAt': new Date(),
    'calendar.tokenRefreshFailures': 0
  });
  
  return tokens.access_token;
}

async function getValidTokens(provider) {
  if (!provider.calendar?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const tokenExpiry = new Date(provider.calendar.tokenExpiry);
  const now = new Date();
  
  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    if (provider.calendar.provider === 'google') {
      return await refreshGoogleToken(provider);
    } else if (provider.calendar.provider === 'microsoft') {
      return await refreshMicrosoftToken(provider);
    }
  }
  
  return provider.calendar.accessToken;
}

// ==================== FREEBUSY ====================

router.get('/freebusy/:providerId', async (req, res) => {
  const providerId = req.params.providerId;
  
  try {
    const { startDate, endDate } = req.query;
    const provider = await Provider.findById(providerId);
    
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (!provider.calendarConnected) return res.json({ busy: [], source: 'manual' });
    
    let busyTimes = [];
    
    if (provider.calendar?.provider === 'google') {
      busyTimes = await getGoogleFreeBusy(provider, startDate, endDate);
    } else if (provider.calendar?.provider === 'microsoft') {
      busyTimes = await getMicrosoftFreeBusy(provider, startDate, endDate);
    }
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.lastFreeBusyQueryAt': new Date(),
      'calendar.lastFreeBusyStatus': 'success',
      'calendar.lastFreeBusyError': null
    });
    
    res.json({ busy: busyTimes, source: provider.calendar?.provider, calendarId: provider.calendar?.calendarId });
  } catch (error) {
    console.error('FreeBusy error:', error);
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.lastFreeBusyQueryAt': new Date(),
      'calendar.lastFreeBusyStatus': 'failed',
      'calendar.lastFreeBusyError': error.message
    }).catch(e => console.error('Failed to update diagnostic:', e));
    
    res.status(500).json({ error: error.message });
  }
});

async function getGoogleFreeBusy(provider, startDate, endDate) {
  const accessToken = await getValidTokens(provider);
  
  googleOAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: provider.calendar.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
  
  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate || new Date().toISOString(),
      timeMax: endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ id: provider.calendar.calendarId || 'primary' }]
    }
  });
  
  return freeBusyResponse.data.calendars[provider.calendar.calendarId || 'primary']?.busy || [];
}

async function getMicrosoftFreeBusy(provider, startDate, endDate) {
  const accessToken = await getValidTokens(provider);
  
  const start = startDate || new Date().toISOString();
  const end = endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  
  const eventsResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=' + encodeURIComponent(start) + '&endDateTime=' + encodeURIComponent(end) + '&$select=start,end,showAs',
    {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Prefer': 'outlook.timezone="America/Denver"'
      }
    }
  );
  
  const eventsData = await eventsResponse.json();
  if (eventsData.error) throw new Error(eventsData.error.message);
  
  return (eventsData.value || [])
    .filter(event => event.showAs === 'busy' || event.showAs === 'tentative')
    .map(event => ({ start: event.start.dateTime, end: event.end.dateTime }));
}

// ==================== EVENT CREATION ====================

router.post('/create-event/:providerId', async (req, res) => {
  const providerId = req.params.providerId;
  
  try {
    const { title, description, startTime, endTime, patientName, patientEmail, bookingId } = req.body;
    const provider = await Provider.findById(providerId);
    
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (!provider.calendarConnected) return res.json({ success: true, message: 'No calendar connected' });
    
    let result;
    
    if (provider.calendar?.provider === 'google') {
      result = await createGoogleEvent(provider, { title, description, startTime, endTime, patientName, patientEmail, bookingId });
    } else if (provider.calendar?.provider === 'microsoft') {
      result = await createMicrosoftEvent(provider, { title, description, startTime, endTime, patientName, patientEmail, bookingId });
    }
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.lastEventCreatedAt': new Date(),
      'calendar.lastEventCreationStatus': 'success',
      'calendar.lastEventCreationError': null,
      $inc: { 'calendar.eventsCreatedCount': 1 }
    });
    
    res.json({ success: true, eventId: result?.eventId, eventLink: result?.eventLink });
  } catch (error) {
    console.error('Create event error:', error);
    
    await Provider.findByIdAndUpdate(providerId, {
      'calendar.lastEventCreatedAt': new Date(),
      'calendar.lastEventCreationStatus': 'failed',
      'calendar.lastEventCreationError': error.message
    }).catch(e => console.error('Failed to update diagnostic:', e));
    
    res.status(500).json({ error: error.message });
  }
});

async function createGoogleEvent(provider, eventData) {
  const accessToken = await getValidTokens(provider);
  
  googleOAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: provider.calendar.refreshToken
  });
  
  const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
  
  const event = {
    summary: eventData.title || 'Findr Health: ' + eventData.patientName,
    description: eventData.description || 'Booking via Findr Health\nPatient: ' + eventData.patientName + '\nBooking ID: ' + eventData.bookingId,
    start: { dateTime: eventData.startTime, timeZone: 'America/Denver' },
    end: { dateTime: eventData.endTime, timeZone: 'America/Denver' },
    attendees: eventData.patientEmail ? [{ email: eventData.patientEmail }] : [],
    reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 30 }] }
  };
  
  const createdEvent = await calendar.events.insert({
    calendarId: provider.calendar.calendarId || 'primary',
    requestBody: event,
    sendUpdates: 'all'
  });
  
  return { eventId: createdEvent.data.id, eventLink: createdEvent.data.htmlLink };
}

async function createMicrosoftEvent(provider, eventData) {
  const accessToken = await getValidTokens(provider);
  
  const event = {
    subject: eventData.title || 'Findr Health: ' + eventData.patientName,
    body: { contentType: 'text', content: eventData.description || 'Booking via Findr Health\nPatient: ' + eventData.patientName + '\nBooking ID: ' + eventData.bookingId },
    start: { dateTime: eventData.startTime, timeZone: 'America/Denver' },
    end: { dateTime: eventData.endTime, timeZone: 'America/Denver' },
    attendees: eventData.patientEmail ? [{ emailAddress: { address: eventData.patientEmail }, type: 'required' }] : [],
    reminderMinutesBeforeStart: 30,
    isReminderOn: true
  };
  
  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  
  const createdEvent = await response.json();
  if (createdEvent.error) throw new Error(createdEvent.error.message);
  
  return { eventId: createdEvent.id, eventLink: createdEvent.webLink };
}

module.exports = router;
