/**
 * Findr Health - Calendar Sync Service
 * 
 * Handles:
 * - Fetching events from Google/Microsoft calendars
 * - Generating available time slots
 * - Creating calendar events for bookings
 * - Token refresh automation
 * - HIPAA-compliant event masking
 */

const { google } = require('googleapis');
const axios = require('axios');
const Provider = require('../models/Provider');

class CalendarSyncService {
  
  /**
   * Fetch calendar events for a team member
   * Returns busy blocks (we don't read event details for privacy)
   */
  async fetchBusyBlocks(providerId, teamMemberId, startDate, endDate) {
    try {
      const provider = await Provider.findById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      const teamMember = provider.teamMembers.id(teamMemberId);
      if (!teamMember || !teamMember.calendar?.connected) {
        throw new Error('Calendar not connected');
      }

      const calendar = teamMember.calendar;

      // Check if token expired
      if (calendar.tokenExpiry && new Date(calendar.tokenExpiry) < new Date()) {
        console.log(`⏰ Token expired for team member ${teamMemberId}, refreshing...`);
        await this.refreshToken(provider, teamMember);
        // Reload provider after refresh
        const updatedProvider = await Provider.findById(providerId);
        const updatedMember = updatedProvider.teamMembers.id(teamMemberId);
        return this._fetchBusyBlocksInternal(updatedMember, startDate, endDate);
      }

      return this._fetchBusyBlocksInternal(teamMember, startDate, endDate);

    } catch (error) {
      console.error('Fetch busy blocks error:', error);
      throw error;
    }
  }

  /**
   * Internal method to fetch busy blocks
   */
  async _fetchBusyBlocksInternal(teamMember, startDate, endDate) {
    const calendar = teamMember.calendar;

    if (calendar.provider === 'google') {
      return await this._fetchGoogleBusyBlocks(teamMember, startDate, endDate);
    } else if (calendar.provider === 'microsoft') {
      return await this._fetchMicrosoftBusyBlocks(teamMember, startDate, endDate);
    }

    throw new Error('Unsupported calendar provider');
  }

  /**
   * Fetch busy blocks from Google Calendar
   */
  async _fetchGoogleBusyBlocks(teamMember, startDate, endDate) {
    const calendar = teamMember.calendar;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: calendar.accessToken,
      refresh_token: calendar.refreshToken,
      expiry_date: calendar.tokenExpiry?.getTime()
    });

    const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

    // Use freebusy API (doesn't expose event details - HIPAA safe)
    const freeBusyResponse = await calendarApi.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendar.calendarId || 'primary' }]
      }
    });

    const busyBlocks = freeBusyResponse.data.calendars[calendar.calendarId || 'primary']?.busy || [];

    return busyBlocks.map(block => ({
      start: new Date(block.start),
      end: new Date(block.end)
    }));
  }

  /**
   * Fetch busy blocks from Microsoft Calendar
   */
  async _fetchMicrosoftBusyBlocks(teamMember, startDate, endDate) {
    const calendar = teamMember.calendar;

    // Use findMeetingTimes API (doesn't expose event details)
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
      {
        schedules: [calendar.calendarEmail],
        startTime: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC'
        },
        endTime: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC'
        },
        availabilityViewInterval: 30
      },
      {
        headers: {
          'Authorization': `Bearer ${calendar.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const scheduleItems = response.data.value[0]?.scheduleItems || [];
    
    return scheduleItems
      .filter(item => item.status === 'busy' || item.status === 'tentative')
      .map(item => ({
        start: new Date(item.start.dateTime),
        end: new Date(item.end.dateTime)
      }));
  }

  /**
   * Generate available time slots
   */
  async generateAvailableSlots(providerId, teamMemberId, date, serviceDuration = 60) {
    try {
      const provider = await Provider.findById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      const teamMember = provider.teamMembers.id(teamMemberId);
      if (!teamMember) {
        throw new Error('Team member not found');
      }

      // Get business hours for this day
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const businessHours = provider.calendar?.businessHours?.[dayName];

      if (!businessHours || !businessHours.isOpen) {
        return []; // Closed on this day
      }

      // Parse business hours
      const [openHour, openMin] = businessHours.open.split(':').map(Number);
      const [closeHour, closeMin] = businessHours.close.split(':').map(Number);

      const dayStart = new Date(date);
      dayStart.setHours(openHour, openMin, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(closeHour, closeMin, 0, 0);

      // Get busy blocks for this day
      let busyBlocks = [];
      
      if (teamMember.calendar?.connected) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        busyBlocks = await this.fetchBusyBlocks(providerId, teamMemberId, startOfDay, endOfDay);
      }

      // Generate slots
      const slots = [];
      const bufferMinutes = teamMember.calendar?.bufferMinutes || 15;
      const slotDuration = serviceDuration + bufferMinutes;

      let currentTime = new Date(dayStart);

      while (currentTime < dayEnd) {
        const slotEnd = new Date(currentTime.getTime() + (serviceDuration * 60000));

        // Check if this slot overlaps with any busy block
        const isAvailable = !busyBlocks.some(block => {
          return (currentTime >= block.start && currentTime < block.end) ||
                 (slotEnd > block.start && slotEnd <= block.end) ||
                 (currentTime <= block.start && slotEnd >= block.end);
        });

        // Check minimum notice
        const minNoticeHours = teamMember.calendar?.minNoticeHours || 24;
        const minNoticeTime = new Date(Date.now() + (minNoticeHours * 60 * 60 * 1000));
        const meetsMinNotice = currentTime >= minNoticeTime;

        slots.push({
          startTime: this._formatTime(currentTime),
          endTime: this._formatTime(slotEnd),
          available: isAvailable && meetsMinNotice,
          reason: !meetsMinNotice ? 'too_soon' : !isAvailable ? 'busy' : null
        });

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + (slotDuration * 60000));
      }

      return slots;

    } catch (error) {
      console.error('Generate slots error:', error);
      throw error;
    }
  }

  /**
   * Generate slots for multiple days
   */
  async generateAvailabilityRange(providerId, teamMemberId, startDate, numDays, serviceDuration) {
    const availability = [];

    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const slots = await this.generateAvailableSlots(providerId, teamMemberId, date, serviceDuration);

      availability.push({
        date: this._formatDate(date),
        slots: slots.filter(s => s.available) // Only return available slots
      });
    }

    return availability;
  }

  /**
   * Create calendar event when booking confirmed
   * HIPAA COMPLIANT - Does not include patient name
   */
  async createCalendarEvent(booking, provider, teamMember) {
    try {
      if (!teamMember.calendar?.connected) {
        console.log('⚠️  Calendar not connected, skipping event creation');
        return null;
      }

      const calendar = teamMember.calendar;
      const appointmentDate = new Date(booking.appointmentDate);
      const [hours, minutes] = booking.appointmentTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentEnd = new Date(appointmentDate.getTime() + (booking.service.duration * 60000));

      // HIPAA COMPLIANT: Generic event title
      const event = {
        summary: 'Healthcare Appointment',
        description: `Findr Health Booking #${booking.confirmationCode}\nService: ${booking.service.name}`,
        start: {
          dateTime: appointmentDate.toISOString(),
          timeZone: provider.timezone || 'America/Denver'
        },
        end: {
          dateTime: appointmentEnd.toISOString(),
          timeZone: provider.timezone || 'America/Denver'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },  // 1 day before
            { method: 'popup', minutes: 60 }         // 1 hour before
          ]
        }
      };

      let eventId;

      if (calendar.provider === 'google') {
        eventId = await this._createGoogleEvent(teamMember, event);
      } else if (calendar.provider === 'microsoft') {
        eventId = await this._createMicrosoftEvent(teamMember, event);
      }

      console.log(`📅 Calendar event created: ${eventId}`);
      return eventId;

    } catch (error) {
      console.error('Create calendar event error:', error);
      // Don't throw - booking should succeed even if calendar event fails
      return null;
    }
  }

  /**
   * Create Google Calendar event
   */
  async _createGoogleEvent(teamMember, event) {
    const calendar = teamMember.calendar;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: calendar.accessToken,
      refresh_token: calendar.refreshToken,
      expiry_date: calendar.tokenExpiry?.getTime()
    });

    const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendarApi.events.insert({
      calendarId: calendar.calendarId || 'primary',
      resource: event,
      sendNotifications: false
    });

    return response.data.id;
  }

  /**
   * Create Microsoft Calendar event
   */
  async _createMicrosoftEvent(teamMember, event) {
    const calendar = teamMember.calendar;

    const msEvent = {
      subject: event.summary,
      body: {
        contentType: 'text',
        content: event.description
      },
      start: {
        dateTime: event.start.dateTime,
        timeZone: event.start.timeZone
      },
      end: {
        dateTime: event.end.dateTime,
        timeZone: event.end.timeZone
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: 60
    };

    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/calendar/events',
      msEvent,
      {
        headers: {
          'Authorization': `Bearer ${calendar.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  /**
   * Delete calendar event (when booking cancelled)
   */
  async deleteCalendarEvent(calendarEventId, provider, teamMember) {
    try {
      if (!teamMember.calendar?.connected || !calendarEventId) {
        return;
      }

      const calendar = teamMember.calendar;

      if (calendar.provider === 'google') {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CALENDAR_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          access_token: calendar.accessToken,
          refresh_token: calendar.refreshToken
        });

        const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });
        
        await calendarApi.events.delete({
          calendarId: calendar.calendarId || 'primary',
          eventId: calendarEventId
        });

      } else if (calendar.provider === 'microsoft') {
        await axios.delete(
          `https://graph.microsoft.com/v1.0/me/calendar/events/${calendarEventId}`,
          {
            headers: {
              'Authorization': `Bearer ${calendar.accessToken}`
            }
          }
        );
      }

      console.log(`🗑️  Calendar event deleted: ${calendarEventId}`);

    } catch (error) {
      console.error('Delete calendar event error:', error);
      // Don't throw - deletion failure shouldn't block cancellation
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(provider, teamMember) {
    try {
      const calendar = teamMember.calendar;

      if (!calendar.refreshToken) {
        throw new Error('No refresh token available');
      }

      let newTokens;

      if (calendar.provider === 'google') {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CALENDAR_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          refresh_token: calendar.refreshToken
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        
        newTokens = {
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date
        };

      } else if (calendar.provider === 'microsoft') {
        const response = await axios.post(
          'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID,
            client_secret: process.env.MICROSOFT_CLIENT_SECRET,
            refresh_token: calendar.refreshToken,
            grant_type: 'refresh_token'
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          }
        );

        newTokens = {
          access_token: response.data.access_token,
          expiry_date: Date.now() + (response.data.expires_in * 1000)
        };
      }

      // Update tokens in database
      teamMember.calendar.accessToken = newTokens.access_token;
      teamMember.calendar.tokenExpiry = new Date(newTokens.expiry_date);
      teamMember.calendar.syncStatus = 'active';
      teamMember.calendar.lastSyncAt = new Date();

      await provider.save();

      console.log(`🔄 Token refreshed for team member ${teamMember._id}`);

    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Mark as expired
      teamMember.calendar.syncStatus = 'expired';
      teamMember.calendar.syncError = error.message;
      await provider.save();

      throw error;
    }
  }

  /**
   * Helper: Format time as HH:MM
   */
  _formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper: Format date as YYYY-MM-DD
   */
  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}

module.exports = new CalendarSyncService();
