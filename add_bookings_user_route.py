#!/usr/bin/env python3
"""Add /bookings/user route that uses authenticated user"""

filepath = "backend/routes/bookings.js"

with open(filepath, 'r') as f:
    content = f.read()

# Find the /patient/:patientId route to insert our new route before it
insert_marker = "router.get('/patient/:patientId', async (req, res) => {"

if insert_marker not in content:
    print("❌ Could not find insertion point")
    exit(1)

# New route that gets current user's bookings
new_route = """// Get current authenticated user's bookings
router.get('/user', authenticateToken, async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status, upcoming, limit = 20, skip = 0 } = req.query;
    
    let query = { patientId: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('providerId', 'practiceName providerTypes address')
      .populate('serviceId', 'name price duration')
      .sort({ appointmentDate: upcoming === 'true' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ 
      bookings,
      total: await Booking.countDocuments(query)
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

"""

# Insert the new route before /patient/:patientId
content = content.replace(insert_marker, new_route + insert_marker)

with open(filepath, 'w') as f:
    f.write(content)

print("✅ Added /bookings/user route")
print("   - Uses authenticateToken middleware")
print("   - Gets userId from JWT token")
print("   - Fetches bookings for authenticated user")
print()
print("🚀 Next: Commit, push, deploy, test")
