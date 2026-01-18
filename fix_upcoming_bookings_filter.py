#!/usr/bin/env python3
"""Fix upcoming bookings filter to include all active statuses"""

with open('backend/routes/bookings.js', 'r') as f:
    content = f.read()

old_logic = """    let query = { patient: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
    }"""

new_logic = """    let query = { patient: userId };
    
    // Handle special status filters
    if (status === 'upcoming') {
      // Upcoming includes all active statuses
      query.status = { 
        $in: ['pending_confirmation', 'confirmed', 'pending_payment'] 
      };
      query['dateTime.requestedStart'] = { $gte: new Date() };
    } else if (status === 'completed') {
      query.status = { $in: ['completed', 'no_show'] };
    } else if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'declined', 'expired'] };
    } else if (status) {
      // Exact status match
      query.status = status;
    }
    
    if (upcoming === 'true' && !status) {
      query['dateTime.requestedStart'] = { $gte: new Date() };
    }"""

if old_logic not in content:
    print("❌ Could not find exact query logic to replace")
    exit(1)

content = content.replace(old_logic, new_logic)

with open('backend/routes/bookings.js', 'w') as f:
    f.write(content)

print("✅ Fixed upcoming bookings filter")
print("   Now 'upcoming' includes:")
print("   - pending_confirmation (request bookings)")
print("   - confirmed (instant bookings)")
print("   - pending_payment")
print()
print("   'completed' includes: completed, no_show")
print("   'cancelled' includes: cancelled, declined, expired")

