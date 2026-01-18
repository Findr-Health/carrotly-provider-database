#!/usr/bin/env python3
"""Fix /bookings/user route to accept userId parameter"""

# Read current file
with open('backend/routes/bookings.js', 'r') as f:
    content = f.read()

# Find and replace the route definition
old_route = "router.get('/user', authenticateToken, async (req, res) => {"
new_route = "router.get('/user/:userId', authenticateToken, async (req, res) => {"

if old_route not in content:
    print("❌ Could not find route to fix")
    exit(1)

content = content.replace(old_route, new_route)

# Also need to update the userId extraction - change from req.user.userId to req.params.userId
# But keep validation that it matches the authenticated user
old_userid = "const userId = req.user.userId;"
new_userid = """const userId = req.params.userId;
    
    // Security: Verify authenticated user matches requested user
    if (userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Cannot access another user\\'s bookings' 
      });
    }"""

content = content.replace(old_userid, new_userid)

# Write back
with open('backend/routes/bookings.js', 'w') as f:
    f.write(content)

print("✅ Fixed /bookings/user route")
print("   - Now accepts: /bookings/user/:userId")
print("   - Added security check: userId must match JWT token")

