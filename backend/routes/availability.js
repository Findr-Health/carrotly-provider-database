/**
 * Findr Health - Availability Routes
 * 
 * Exposes calendar availability to mobile app and provider portal
 * 
 * Endpoints:
 * GET /api/availability/:providerId                          - Get availability for provider
 * GET /api/availability/:providerId/member/:memberId         - Get availability for specific team member
 * POST /api/availability/verify-slot                         - Real-time slot verification
 * GET /api/availability/:providerId/range                    - Get availability for date range
 */

const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const calendarSync = require('../services/calendarSync');

// ==================== GET PROVIDER AVAILABILITY ====================

/**
 * GET /api/availability/:providerId
 * Get availability for a provider (all team members or first available)
 * 
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * - duration: service duration in minutes (default: 60)
 * - memberId: specific team member (optional)
 * - mode: 'all' | 'first_available' (default: 'all')
 */
router.get('/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const {
      date = new Date().toISOString().split('T')[0],
      duration = 60,
      memberId,
      mode = 'all'
    } = req.query;

    // Get provider
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const requestDate = new Date(date);
    const serviceDuration = parseInt(duration);

    // Get team members
    let teamMembers = provider.teamMembers.filter(m => m.acceptsBookings !== false);

    // Filter by specific member if requested
    if (memberId) {
      teamMembers = teamMembers.filter(m => m._id.toString() === memberId);
      if (teamMembers.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }
    }

    // Generate availability for each team member
    const availability = [];

    for (const member of teamMembers) {
      try {
        const slots = await calendarSync.generateAvailableSlots(
          providerId,
          member._id,
          requestDate,
          serviceDuration
        );

        availability.push({
          teamMemberId: member._id,
          teamMemberName: member.name,
          title: member.title,
          calendarConnected: member.calendar?.connected || false,
          bookingMode: member.calendar?.connected ? 'instant' : 'request',
          slots: slots.filter(s => s.available)
        });

      } catch (error) {
        console.error(`Error generating slots for member ${member._id}:`, error);
        // Continue with other members
        availability.push({
          teamMemberId: member._id,
          teamMemberName: member.name,
          error: 'Failed to load availability',
          slots: []
        });
      }
    }

    // If mode is 'first_available', merge all slots and deduplicate
    if (mode === 'first_available' && availability.length > 1) {
      const allSlots = new Map(); // time -> first member who has it

      for (const memberAvail of availability) {
        for (const slot of memberAvail.slots) {
          if (!allSlots.has(slot.startTime)) {
            allSlots.set(slot.startTime, {
              ...slot,
              teamMemberId: memberAvail.teamMemberId,
              teamMemberName: memberAvail.teamMemberName
            });
          }
        }
      }

      // Return merged availability
      return res.json({
        success: true,
        providerId,
        date,
        duration: serviceDuration,
        mode: 'first_available',
        slots: Array.from(allSlots.values()).sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        )
      });
    }

    // Return per-member availability
    res.json({
      success: true,
      providerId,
      date,
      duration: serviceDuration,
      mode,
      availability
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET TEAM MEMBER AVAILABILITY ====================

/**
 * GET /api/availability/:providerId/member/:memberId
 * Get availability for specific team member
 * 
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * - duration: service duration in minutes (default: 60)
 */
router.get('/:providerId/member/:memberId', async (req, res) => {
  try {
    const { providerId, memberId } = req.params;
    const {
      date = new Date().toISOString().split('T')[0],
      duration = 60
    } = req.query;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const teamMember = provider.teamMembers.id(memberId);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const requestDate = new Date(date);
    const serviceDuration = parseInt(duration);

    const slots = await calendarSync.generateAvailableSlots(
      providerId,
      memberId,
      requestDate,
      serviceDuration
    );

    res.json({
      success: true,
      providerId,
      teamMemberId: memberId,
      teamMemberName: teamMember.name,
      date,
      duration: serviceDuration,
      calendarConnected: teamMember.calendar?.connected || false,
      bookingMode: teamMember.calendar?.connected ? 'instant' : 'request',
      slots: slots.filter(s => s.available)
    });

  } catch (error) {
    console.error('Get team member availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET AVAILABILITY RANGE ====================

/**
 * GET /api/availability/:providerId/range
 * Get availability for multiple days
 * 
 * Query params:
 * - startDate: YYYY-MM-DD (default: today)
 * - days: number of days (default: 14, max: 60)
 * - duration: service duration in minutes (default: 60)
 * - memberId: specific team member (optional)
 */
router.get('/:providerId/range', async (req, res) => {
  try {
    const { providerId } = req.params;
    const {
      startDate = new Date().toISOString().split('T')[0],
      days = 14,
      duration = 60,
      memberId
    } = req.query;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const numDays = Math.min(parseInt(days), 60); // Cap at 60 days
    const serviceDuration = parseInt(duration);
    const start = new Date(startDate);

    // Get team member
    let teamMember;
    if (memberId) {
      teamMember = provider.teamMembers.id(memberId);
      if (!teamMember) {
        return res.status(404).json({ error: 'Team member not found' });
      }
    } else {
      // Use first available team member
      teamMember = provider.teamMembers.find(m => m.acceptsBookings !== false);
      if (!teamMember) {
        return res.status(400).json({ error: 'No available team members' });
      }
    }

    // Generate availability range
    const availability = await calendarSync.generateAvailabilityRange(
      providerId,
      teamMember._id,
      start,
      numDays,
      serviceDuration
    );

    res.json({
      success: true,
      providerId,
      teamMemberId: teamMember._id,
      teamMemberName: teamMember.name,
      startDate,
      numDays,
      duration: serviceDuration,
      calendarConnected: teamMember.calendar?.connected || false,
      bookingMode: teamMember.calendar?.connected ? 'instant' : 'request',
      availability
    });

  } catch (error) {
    console.error('Get availability range error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== VERIFY SLOT AVAILABILITY ====================

/**
 * POST /api/availability/verify-slot
 * Real-time verification that a slot is still available
 * Should be called right before booking
 * 
 * Body:
 * {
 *   "providerId": "mongo-id",
 *   "teamMemberId": "mongo-id",
 *   "date": "YYYY-MM-DD",
 *   "startTime": "HH:MM",
 *   "duration": 60
 * }
 */
router.post('/verify-slot', async (req, res) => {
  try {
    const { providerId, teamMemberId, date, startTime, duration = 60 } = req.body;

    if (!providerId || !teamMemberId || !date || !startTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['providerId', 'teamMemberId', 'date', 'startTime']
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

    // Generate slots for this date
    const requestDate = new Date(date);
    const slots = await calendarSync.generateAvailableSlots(
      providerId,
      teamMemberId,
      requestDate,
      parseInt(duration)
    );

    // Find the requested slot
    const requestedSlot = slots.find(s => s.startTime === startTime);

    if (!requestedSlot) {
      return res.json({
        success: true,
        available: false,
        reason: 'Slot not found in schedule'
      });
    }

    if (!requestedSlot.available) {
      return res.json({
        success: true,
        available: false,
        reason: requestedSlot.reason || 'Slot no longer available'
      });
    }

    // Slot is available
    res.json({
      success: true,
      available: true,
      slot: requestedSlot
    });

  } catch (error) {
    console.error('Verify slot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET CALENDAR STATUS ====================

/**
 * GET /api/availability/:providerId/calendar-status
 * Get calendar connection status for all team members
 */
router.get('/:providerId/calendar-status', async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const status = provider.teamMembers.map(member => ({
      teamMemberId: member._id,
      teamMemberName: member.name,
      calendarConnected: member.calendar?.connected || false,
      calendarProvider: member.calendar?.provider || null,
      syncStatus: member.calendar?.syncStatus || 'disconnected',
      lastSyncAt: member.calendar?.lastSyncAt || null,
      bookingMode: member.calendar?.connected ? 'instant' : 'request'
    }));

    res.json({
      success: true,
      providerId,
      teamMembers: status
    });

  } catch (error) {
    console.error('Get calendar status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
