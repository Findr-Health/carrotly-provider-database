#!/usr/bin/env python3
"""Fix field name: patientId -> patient"""

filepath = "backend/routes/bookings.js"

with open(filepath, 'r') as f:
    content = f.read()

# Fix in our new /user route
old_line = "    let query = { patientId: userId };"
new_line = "    let query = { patient: userId };"

if old_line in content:
    content = content.replace(old_line, new_line)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("✅ Fixed field name: patientId -> patient")
    print("   - Matches Booking model schema")
    print("   - Query will now work correctly")
else:
    print("⚠️  Pattern not found - may already be fixed")
