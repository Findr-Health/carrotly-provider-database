#!/usr/bin/env python3
"""Fix /api/users/:id to handle 'me' parameter"""

filepath = "backend/routes/users.js"

with open(filepath, 'r') as f:
    content = f.read()

# Exact replacement at line 85
old_code = """router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');"""

new_code = """router.get('/:id', async (req, res) => {
  try {
    // Handle 'me' as current user
    let userId = req.params.id;
    if (userId === 'me') {
      // Requires authentication - get from JWT token
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      userId = req.user.userId;
    }
    
    const user = await User.findById(userId).select('-password');"""

if old_code in content:
    content = content.replace(old_code, new_code)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("✅ Fixed backend/routes/users.js")
    print("   - Added 'me' parameter handling")
    print("   - Resolves 'me' to authenticated user's ID")
    print()
    print("🚀 Next: Commit, push, and deploy")
else:
    print("❌ Pattern not found - code may have changed")
