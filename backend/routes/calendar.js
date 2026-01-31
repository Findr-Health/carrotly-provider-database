/**
 * Findr Health - Calendar Integration Routes
 * 
 * OAuth flow for Google Calendar and Microsoft Outlook
 * Supports individual team member calendar connections
 * 
 * Endpoints:
 * POST   /api/calendar/connect                    - Initiate OAuth
 * GET    /api/calendar/callback/google            - Google OAuth callback
 * GET    /api/calendar/callback/microsoft         - Microsoft OAuth callback
 * DELETE /api/calendar/disconnect                 - Disconnect calendar
 * GET    /api/calendar/status/:providerId/:memberId - Check connection status
 * POST   /api/calendar/test-connection            - Test calendar access
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Provider = require('../models/Provider');
const crypto = require('crypto');

// In-memory state storage (use Redis in production)
const oauthStates = new Map();

// Environment variables required:
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET
// GOOGLE_REDIRECT_URI (e.g., https://api.findrhealth.com/api/calendar/callback/google)
// MICROSOFT_CLIENT_ID
// MICROSOFT_CLIENT_SECRET
// MICROSOFT_REDIRECT_URI
// FRONTEND_URL (e.g., https://provider.findrhealth.com)

// ==================== GOOGLE OAUTH CONFIG ====================

const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Read/write calendar
  'https://www.googleapis.com/auth/calendar.events',    // Manage events
  'https://www.googleapis.com/auth/userinfo.email'      // Get email for verification
];

// ==================== MICROSOFT OAUTH CONFIG ====================

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_SCOPES = [
  'Calendars.ReadWrite',
  'User.Read'
];

// ==================== INITIATE OAUTH ====================

/**
 * POST /api/calendar/connect
 * Initiates OAuth flow for Google or Microsoft
 * 
 * Body:
 * {
 *   "provider": "google" | "microsoft",
 *   "providerId": "mongo-id",
 *   "teamMemberId": "mongo-id",
 *   "returnUrl": "/onboarding/calendar-setup"  // Optional
 * }
 */
router.post('/connect', async (req, res) => {
  try {
    const { provider, providerId, teamMemberId, returnUrl } = req.body;

    // Validate
    if (!provider || !providerId || !teamMemberId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['provider', 'providerId', 'teamMemberId']
      });
    }

    if (!['google', 'microsoft'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        validProviders: ['google', 'microsoft']
      });
    }

    // Verify provider exists
    const providerDoc = await Provider.findById(providerId);
    if (!providerDoc) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Verify team member exists
    const teamMember = providerDoc.teamMembers.id(teamMemberId);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with metadata (expires in 10 minutes)
    oauthStates.set(state, {
      provider,
      providerId: providerId.toString(),
      teamMemberId: teamMemberId.toString(),
      returnUrl: returnUrl || '/calendar-setup',
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000)
    });

    // Clean up expired states
    cleanupExpiredStates();

    let authUrl;

    if (provider === 'google') {
      // Generate Google OAuth URL
      authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',     // Get refresh token
        scope: GOOGLE_SCOPES,
        state: state,
        prompt: 'consent'            // Force consent screen to get refresh token
      });
    } else if (provider === 'microsoft') {
      // Generate Microsoft OAuth URL
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        scope: MICROSOFT_SCOPES.join(' '),
        state: state,
        prompt: 'consent'
      });
      authUrl = `${MICROSOFT_AUTH_URL}?${params.toString()}`;
    }

    console.log(`📅 OAuth initiated for ${provider} - Provider: ${providerId}, Member: ${teamMemberId}`);

    res.json({
      success: true,
      authUrl,
      state,
      message: `Redirect user to authUrl to begin ${provider} authorization`
    });

  } catch (error) {
    console.error('Calendar connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GOOGLE OAUTH CALLBACK ====================

/**
 * GET /api/calendar/callback/google
 * Handles OAuth callback from Google
 * Query params: code, state
 */
router.get('/callback/google', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth error
    if (error) {
      console.error('Google OAuth error:', error);
      return redirectToFrontend(res, state, false, error);
    }

    if (!code || !state) {
      return redirectToFrontend(res, state, false, 'Missing authorization code or state');
    }

    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return redirectToFrontend(res, null, false, 'Invalid or expired state');
    }

    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return redirectToFrontend(res, state, false, 'Failed to get access token');
    }

    // Set credentials to get user info
    googleOAuth2Client.setCredentials(tokens);
    
    // Get user's email for verification
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const calendarEmail = userInfo.data.email;

    // Get calendar list to verify access
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);

    // Update provider document
    const provider = await Provider.findById(stateData.providerId);
    if (!provider) {
      return redirectToFrontend(res, state, false, 'Provider not found');
    }

    const teamMember = provider.teamMembers.id(stateData.teamMemberId);
    if (!teamMember) {
      return redirectToFrontend(res, state, false, 'Team member not found');
    }

    // Save tokens to team member
    teamMember.calendar = {
      provider: 'google',
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
      calendarId: primaryCalendar?.id || 'primary',
      calendarEmail: calendarEmail,
      syncStatus: 'active',
      lastSyncAt: new Date(),
      bufferMinutes: teamMember.calendar?.bufferMinutes || 15,
      minNoticeHours: teamMember.calendar?.minNoticeHours || 24,
      maxDaysOut: teamMember.calendar?.maxDaysOut || 60
    };

    await provider.save();

    // Clean up state
    oauthStates.delete(state);

    console.log(`✅ Google Calendar connected - Provider: ${stateData.providerId}, Member: ${stateData.teamMemberId}`);

    // Redirect back to frontend
    return redirectToFrontend(res, state, true, 'Google Calendar connected successfully');

  } catch (error) {
    console.error('Google callback error:', error);
    return redirectToFrontend(res, req.query.state, false, error.message);
  }
});

// ==================== MICROSOFT OAUTH CALLBACK ====================

/**
 * GET /api/calendar/callback/microsoft
 * Handles OAuth callback from Microsoft
 * Query params: code, state
 */
router.get('/callback/microsoft', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth error
    if (error) {
      console.error('Microsoft OAuth error:', error, error_description);
      return redirectToFrontend(res, state, false, error_description || error);
    }

    if (!code || !state) {
      return redirectToFrontend(res, state, false, 'Missing authorization code or state');
    }

    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return redirectToFrontend(res, null, false, 'Invalid or expired state');
    }

    // Exchange code for tokens
    const axios = require('axios');
    const tokenResponse = await axios.post(MICROSOFT_TOKEN_URL, new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;
    
    if (!tokens.access_token) {
      return redirectToFrontend(res, state, false, 'Failed to get access token');
    }

    // Get user info
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    
    const calendarEmail = userResponse.data.mail || userResponse.data.userPrincipalName;

    // Update provider document
    const provider = await Provider.findById(stateData.providerId);
    if (!provider) {
      return redirectToFrontend(res, state, false, 'Provider not found');
    }

    const teamMember = provider.teamMembers.id(stateData.teamMemberId);
    if (!teamMember) {
      return redirectToFrontend(res, state, false, 'Team member not found');
    }

    // Calculate token expiry
    const expiresIn = tokens.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));

    // Save tokens to team member
    teamMember.calendar = {
      provider: 'microsoft',
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokenExpiry,
      calendarId: 'primary', // Microsoft doesn't require calendar ID
      calendarEmail: calendarEmail,
      syncStatus: 'active',
      lastSyncAt: new Date(),
      bufferMinutes: teamMember.calendar?.bufferMinutes || 15,
      minNoticeHours: teamMember.calendar?.minNoticeHours || 24,
      maxDaysOut: teamMember.calendar?.maxDaysOut || 60
    };

    await provider.save();

    // Clean up state
    oauthStates.delete(state);

    console.log(`✅ Microsoft Calendar connected - Provider: ${stateData.providerId}, Member: ${stateData.teamMemberId}`);

    // Redirect back to frontend
    return redirectToFrontend(res, state, true, 'Microsoft Calendar connected successfully');

  } catch (error) {
    console.error('Microsoft callback error:', error);
    return redirectToFrontend(res, req.query.state, false, error.message);
  }
});

// ==================== DISCONNECT CALENDAR ====================

/**
 * DELETE /api/calendar/disconnect
 * Disconnects calendar for a team member
 * 
 * Body:
 * {
 *   "providerId": "mongo-id",
 *   "teamMemberId": "mongo-id"
 * }
 */
router.delete('/disconnect', async (req, res) => {
  try {
    const { providerId, teamMemberId } = req.body;

    if (!providerId || !teamMemberId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['providerId', 'teamMemberId']
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const teamMember = provider.teamMembers.id(teamMemberId);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // TODO: Revoke token with Google/Microsoft (optional but recommended)
    
    // Clear calendar connection
    teamMember.calendar = {
      provider: null,
      connected: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      calendarId: null,
      calendarEmail: null,
      syncStatus: 'disconnected',
      lastSyncAt: null
    };

    await provider.save();

    console.log(`🔌 Calendar disconnected - Provider: ${providerId}, Member: ${teamMemberId}`);

    res.json({
      success: true,
      message: 'Calendar disconnected successfully'
    });

  } catch (error) {
    console.error('Disconnect calendar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHECK CONNECTION STATUS ====================

/**
 * GET /api/calendar/status/:providerId/:memberId
 * Check calendar connection status for a team member
 */
router.get('/status/:providerId/:memberId', async (req, res) => {
  try {
    const { providerId, memberId } = req.params;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const teamMember = provider.teamMembers.id(memberId);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const calendar = teamMember.calendar;

    res.json({
      success: true,
      connected: calendar?.connected || false,
      provider: calendar?.provider || null,
      calendarEmail: calendar?.calendarEmail || null,
      syncStatus: calendar?.syncStatus || 'disconnected',
      lastSyncAt: calendar?.lastSyncAt || null,
      syncError: calendar?.syncError || null,
      tokenExpiry: calendar?.tokenExpiry || null,
      isExpired: calendar?.tokenExpiry ? new Date(calendar.tokenExpiry) < new Date() : null
    });

  } catch (error) {
    console.error('Get calendar status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TEST CONNECTION ====================

/**
 * POST /api/calendar/test-connection
 * Test if calendar access is working
 * 
 * Body:
 * {
 *   "providerId": "mongo-id",
 *   "teamMemberId": "mongo-id"
 * }
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { providerId, teamMemberId } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const teamMember = provider.teamMembers.id(teamMemberId);
    if (!teamMember || !teamMember.calendar?.connected) {
      return res.status(400).json({ error: 'Calendar not connected' });
    }

    const calendar = teamMember.calendar;

    // Test connection based on provider
    if (calendar.provider === 'google') {
      googleOAuth2Client.setCredentials({
        access_token: calendar.accessToken,
        refresh_token: calendar.refreshToken,
        expiry_date: calendar.tokenExpiry?.getTime()
      });

      const calendarApi = google.calendar({ version: 'v3', auth: googleOAuth2Client });
      const result = await calendarApi.calendarList.list();

      res.json({
        success: true,
        connected: true,
        calendarsFound: result.data.items?.length || 0,
        message: 'Google Calendar connection is working'
      });

    } else if (calendar.provider === 'microsoft') {
      const axios = require('axios');
      const result = await axios.get('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: { 'Authorization': `Bearer ${calendar.accessToken}` }
      });

      res.json({
        success: true,
        connected: true,
        calendarsFound: result.data.value?.length || 0,
        message: 'Microsoft Calendar connection is working'
      });
    }

  } catch (error) {
    console.error('Test connection error:', error);
    
    // Token might be expired
    if (error.code === 401 || error.status === 401) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please reconnect your calendar'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Redirect user back to frontend with OAuth result
 */
function redirectToFrontend(res, state, success, message) {
  const stateData = oauthStates.get(state);
  const returnUrl = stateData?.returnUrl || '/calendar-setup';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const params = new URLSearchParams({
    success: success.toString(),
    message: message
  });

  const redirectUrl = `${frontendUrl}${returnUrl}?${params.toString()}`;
  
  console.log(`↩️  Redirecting to: ${redirectUrl}`);
  
  res.redirect(redirectUrl);
}

/**
 * Clean up expired OAuth states (run periodically)
 */
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}

// Clean up expired states every 5 minutes
setInterval(cleanupExpiredStates, 5 * 60 * 1000);

module.exports = router;
