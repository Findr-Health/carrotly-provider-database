/**
 * Calendar Availability Utility
 * Checks if a time slot is available based on provider's connected calendar
 */

const { google } = require('googleapis');

// Google OAuth Setup (same as calendar.js)
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET
);

/**
 * Check if a specific time slot is available
 * @param {Object} provider - Provider document with calendar info
async function checkTimeSlotAvailability(provider, startTime, durationMinutes, teamMemberId = null) {
  // Check team member's calendar if provided
  let calendarToCheck = null;
  
  if (teamMemberId) {
    const teamMember = provider.teamMembers.id(teamMemberId);
    if (teamMember?.calendar?.connected) {
      calendarToCheck = teamMember.calendar;
    }
  } else if (provider.calendarConnected && provider.calendar) {
    // Fallback to provider-level calendar
    calendarToCheck = provider.calendar;
  }
  
  // If no calendar connected, can't check availability
  if (!calendarToCheck) {
    return false; // Default to request mode
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  try {
    let busyTimes = [];

    if (calendarToCheck.provider === 'google') {
      busyTimes = await getGoogleBusyTimes(provider, teamMemberId, startTime, endTime);
    } else if (calendarToCheck.provider === 'microsoft') {
      busyTimes = await getMicrosoftBusyTimes(provider, teamMemberId, startTime, endTime);
    } else {
      // Manual calendar or unsupported - default to unavailable
      return false;
    }

    // Check if requested slot overlaps with any busy times
    const requestedStart = startTime.getTime();
    const requestedEnd = endTime.getTime();

    for (const busy of busyTimes) {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();

      // Check for overlap
      if (requestedStart < busyEnd && requestedEnd > busyStart) {
        console.log(`⚠️ Time slot conflicts with existing event: ${busy.start} - ${busy.end}`);
        return false; // Slot is busy
      }
    }

    console.log(`✅ Time slot available: ${startTime.toISOString()} for ${durationMinutes} minutes`);
    return true; // Slot is free

  } catch (error) {
    console.error('Calendar availability check error:', error);
    // On error, default to unavailable (safe fallback - manual request)
    return false;
  }
}

/**
 * Get busy times from Google Calendar
 */
async function getGoogleBusyTimes(provider, teamMemberId, startTime, endTime) {
  // Get calendar to check
  let calendar = provider.calendar;
  if (teamMemberId) {
    const teamMember = provider.teamMembers.id(teamMemberId);
    if (teamMember?.calendar?.connected) {
      calendar = teamMember.calendar;
    }
  }
  
  const accessToken = await getValidGoogleToken(provider, teamMemberId);
  googleOAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: calendar.refreshToken
  });
  const calendarApi = google.calendar({ version: 'v3', auth: googleOAuth2Client });
  const freeBusyResponse = await calendarApi.freebusy.query({
    requestBody: {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: calendar.calendarId || 'primary' }]
    }
  });
  
  const busyTimes = freeBusyResponse.data.calendars[calendar.calendarId || 'primary']?.busy || [];
  return busyTimes;
}

/**
 * Get busy times from Microsoft Calendar
async function getMicrosoftBusyTimes(provider, teamMemberId, startTime, endTime) {
  // Get calendar to check
  let calendar = provider.calendar;
  if (teamMemberId) {
    const teamMember = provider.teamMembers.id(teamMemberId);
    if (teamMember?.calendar?.connected) {
      calendar = teamMember.calendar;
    }
  }
  
  const accessToken = await getValidMicrosoftToken(provider, teamMemberId);
  const eventsResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startTime.toISOString())}&endDateTime=${encodeURIComponent(endTime.toISOString())}&$select=start,end,showAs`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'outlook.timezone="America/Denver"'
      }
    }
  );
  const eventsData = await eventsResponse.json();
  
  if (eventsData.error) {
    throw new Error(eventsData.error.message);
  }
  // Filter to only busy events and convert to same format as Google
  const busyTimes = (eventsData.value || [])
    .filter(event => event.showAs === 'busy' || event.showAs === 'tentative')
    .map(event => ({
      start: event.start.dateTime,
      end: event.end.dateTime
    }));
  return busyTimes;
}
}

/**
 * Get valid Google access token (refresh if expired)
 */
async function getValidGoogleToken(provider, teamMemberId = null) {
  const now = new Date();
  const expiry = new Date(provider.calendar.tokenExpiry);

  // If token expires in less than 5 minutes, refresh it
  if (expiry - now < 5 * 60 * 1000) {
    console.log('Refreshing Google access token...');
    
    googleOAuth2Client.setCredentials({
      refresh_token: provider.calendar.refreshToken
    });

    const { credentials } = await googleOAuth2Client.refreshAccessToken();

    // Update provider with new token
    const Provider = require('../models/Provider');
    await Provider.findByIdAndUpdate(provider._id, {
      'calendar.accessToken': credentials.access_token,
      'calendar.tokenExpiry': new Date(credentials.expiry_date),
      'calendar.lastTokenRefreshAt': new Date()
    });

    return credentials.access_token;
  }

  return provider.calendar.accessToken;
}

/**
 * Get valid Microsoft access token (refresh if expired)
 */
async function getValidMicrosoftToken(provider, teamMemberId = null) {
  const now = new Date();
  const expiry = new Date(provider.calendar.tokenExpiry);

  // If token expires in less than 5 minutes, refresh it
  if (expiry - now < 5 * 60 * 1000) {
    console.log('Refreshing Microsoft access token...');
    
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET,
        refresh_token: provider.calendar.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Microsoft token refresh failed: ${data.error_description}`);
    }

    // Update provider with new token
    const Provider = require('../models/Provider');
    await Provider.findByIdAndUpdate(provider._id, {
      'calendar.accessToken': data.access_token,
      'calendar.tokenExpiry': new Date(Date.now() + data.expires_in * 1000),
      'calendar.lastTokenRefreshAt': new Date()
    });

    return data.access_token;
  }

  return provider.calendar.accessToken;
}

module.exports = {
  checkTimeSlotAvailability
};
