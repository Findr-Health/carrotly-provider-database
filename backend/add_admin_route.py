#!/usr/bin/env python3
"""Add admin route registration to server.js"""

with open('server.js', 'r') as f:
    content = f.read()

# Find where routes are registered (look for app.use patterns)
# Add admin route before other routes
old_routes_section = "// Routes"

new_routes_section = """// Routes
const adminRoutes = require('./routes/admin');"""

# First add the require
if 'const adminRoutes' not in content:
    content = content.replace(old_routes_section, new_routes_section)
    print("✅ Added admin routes import")
else:
    print("✅ Admin routes import already exists")

# Now add the app.use
# Find where other routes are registered
if "app.use('/api/admin', adminRoutes);" not in content:
    # Find a good place to insert (after other app.use statements)
    lines = content.split('\n')
    new_lines = []
    inserted = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        # Insert after the first app.use('/api/...') line
        if not inserted and "app.use('/api/" in line and "bookings" in line:
            new_lines.append("app.use('/api/admin', adminRoutes);")
            inserted = True
            print("✅ Added admin route registration")
    
    if inserted:
        content = '\n'.join(new_lines)
    else:
        print("⚠️  Could not find insertion point - will need manual addition")
        print("Add this line after other app.use statements:")
        print("app.use('/api/admin', adminRoutes);")

with open('server.js', 'w') as f:
    f.write(content)

