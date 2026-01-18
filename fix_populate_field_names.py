#!/usr/bin/env python3
"""Fix populate to use correct field names from Booking schema"""

with open('backend/routes/bookings.js', 'r') as f:
    content = f.read()

# Fix the /user/:userId endpoint populate
old_populate = """.populate('providerId', 'practiceName providerTypes address')
      .populate('serviceId', 'name price duration')"""

new_populate = """.populate('provider', 'practiceName providerTypes address')
      .select('-__v')"""

if old_populate in content:
    content = content.replace(old_populate, new_populate)
    print("✅ Fixed populate field names")
    print("   providerId → provider")
    print("   Removed serviceId populate (service is embedded)")
else:
    print("⚠️  Could not find exact populate to replace")
    print("Checking for variations...")
    
with open('backend/routes/bookings.js', 'w') as f:
    f.write(content)

