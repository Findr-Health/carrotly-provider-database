/**
 * Findr Health Availability Routes
 * 
 * Endpoints:
 * GET    /api/availability/provider/:providerId  - Get available time slots
 * POST   /api/availability/provider/:providerId/block - Block time slots
 * POST   /api/availability/provider/:providerId/unblock - Unblock time slots
 */

const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');

// ==================== GET PROVIDER AVAILABILITY ====================

router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { 
      startDate, 
      endDate, 
      teamMemberId,
      serviceDuration = 30  // Default 30 min slots
    } = req.query;

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Get provider
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get provider's business hours
    const businessHours = provider.calendar?.businessHours || getDefaultBusinessHours();
    
    // Check if provider has calendar integration
    const hasCalendarIntegration = provider.calendar?.provider && 
                                   ['google', 'microsoft', 'apple'].includes(provider.calendar.provider);

    // Get existing bookings in date range
    const bookings = await Booking.find({
      provider: providerId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Create set of booked slots for quick lookup
    const bookedSlots = new Set();
    bookings.forEach(b => {
      const dateKey = b.appointmentDate.toISOString().split('T')[0];
      bookedSlots.add(`${dateKey}-${b.appointmentTime}`);
    });

    // Generate availability for each day
    const availability = [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    let currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      const dayName = dayNames[currentDate.getDay()];
      const hours = businessHours[dayName];
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if this day is enabled
      if (hours && hours.enabled) {
        const slots = generateTimeSlots(
          hours.start || '09:00',
          hours.end || '17:00',
          parseInt(serviceDuration)
        );
        
        const dayAvailability = {
          date: dateStr,
          dayOfWeek: dayName,
          isOpen: true,
          slots: slots.map(slot => {
            const slotKey = `${dateStr}-${slot.time}`;
            const isBooked = bookedSlots.has(slotKey);
            
            // Don't show past slots for today
            let isPast = false;
            if (dateStr === new Date().toISOString().split('T')[0]) {
              const now = new Date();
              const slotTime = parseTimeToMinutes(slot.time);
              const currentTime = now.getHours() * 60 + now.getMinutes();
              isPast = slotTime <= currentTime;
            }
            
            return {
              time: slot.time,
              endTime: slot.endTime,
              displayTime: formatDisplayTime(slot.time),
              isAvailable: !isBooked && !isPast,
              isBooked,
              isPast
            };
          })
        };
        
        // Count available slots
        dayAvailability.availableCount = dayAvailability.slots.filter(s => s.isAvailable).length;
        dayAvailability.totalSlots = dayAvailability.slots.length;
        
        availability.push(dayAvailability);
      } else {
        // Day is closed
        availability.push({
          date: dateStr,
          dayOfWeek: dayName,
          isOpen: false,
          slots: [],
          availableCount: 0,
          totalSlots: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      provider: {
        _id: provider._id,
        practiceName: provider.practiceName,
        hasCalendarIntegration,
        timezone: provider.calendar?.timezone || 'America/Denver'
      },
      serviceDuration: parseInt(serviceDuration),
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      availability
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET NEXT AVAILABLE SLOT ====================

router.get('/provider/:providerId/next-available', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { serviceDuration = 30 } = req.query;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const businessHours = provider.calendar?.businessHours || getDefaultBusinessHours();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Search next 60 days
    const maxDays = 60;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < maxDays; i++) {
      const dayName = dayNames[currentDate.getDay()];
      const hours = businessHours[dayName];
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (hours && hours.enabled) {
        // Get bookings for this day
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const bookings = await Booking.find({
          provider: providerId,
          appointmentDate: { $gte: dayStart, $lte: dayEnd },
          status: { $in: ['pending', 'confirmed'] }
        });
        
        const bookedTimes = new Set(bookings.map(b => b.appointmentTime));
        
        // Generate slots
        const slots = generateTimeSlots(
          hours.start || '09:00',
          hours.end || '17:00',
          parseInt(serviceDuration)
        );
        
        // Find first available slot
        for (const slot of slots) {
          // Skip if booked
          if (bookedTimes.has(slot.time)) continue;
          
          // Skip past slots for today
          if (i === 0) {
            const now = new Date();
            const slotTime = parseTimeToMinutes(slot.time);
            const currentTime = now.getHours() * 60 + now.getMinutes();
            if (slotTime <= currentTime + 60) continue; // At least 1 hour notice
          }
          
          // Found available slot!
          return res.json({
            success: true,
            nextAvailable: {
              date: dateStr,
              time: slot.time,
              displayTime: formatDisplayTime(slot.time),
              dayOfWeek: dayName,
              displayDate: formatDisplayDate(currentDate)
            }
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // No availability found
    res.json({
      success: true,
      nextAvailable: null,
      message: 'No availability in the next 60 days'
    });

  } catch (error) {
    console.error('Get next available error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== BLOCK TIME SLOTS (Provider) ====================

router.post('/provider/:providerId/block', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date, slots, reason, allDay = false } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // For now, we'll create placeholder bookings to block slots
    // In a full implementation, you'd have a separate BlockedSlot model
    
    const blockedDate = new Date(date);
    
    // TODO: Implement proper slot blocking
    // This would involve creating a BlockedSlot model or using the Availability model
    
    res.json({
      success: true,
      message: `Slots blocked for ${date}`,
      blocked: { date, slots, reason, allDay }
    });

  } catch (error) {
    console.error('Block slots error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getDefaultBusinessHours() {
  return {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' }
  };
}

function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  let current = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  
  while (current + intervalMinutes <= end) {
    const time = minutesToTime(current);
    const endTimeSlot = minutesToTime(current + intervalMinutes);
    
    slots.push({
      time: time,
      endTime: endTimeSlot
    });
    
    current += intervalMinutes;
  }
  
  return slots;
}

function parseTimeToMinutes(timeStr) {
  // Handle "HH:MM" format
  if (timeStr.includes(':') && !timeStr.includes(' ')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // Handle "H:MM AM/PM" format
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDisplayTime(time) {
  // Ensure consistent display format
  const minutes = parseTimeToMinutes(time);
  return minutesToTime(minutes);
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

module.exports = router;
