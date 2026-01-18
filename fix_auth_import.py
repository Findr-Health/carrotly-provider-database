#!/usr/bin/env python3
"""Fix missing authenticateToken import in bookings.js"""

import re

# Read the current file
with open('backend/routes/bookings.js', 'r') as f:
    content = f.read()

# Check if authenticateToken is already imported
if 'authenticateToken' in content.split('\n')[0:20]:  # Check top of file
    print("❌ authenticateToken already imported - different issue!")
    exit(1)

# Find the router require line (should be near top)
# We need to add the auth middleware import before it
lines = content.split('\n')

# Find where to insert the import (after other requires, before router)
insert_index = 0
for i, line in enumerate(lines):
    if "const router = require('express').Router()" in line or "const express = require('express')" in line:
        insert_index = i
        break

if insert_index == 0:
    print("❌ Could not find router initialization")
    exit(1)

# Insert the auth middleware import
auth_import = "const { authenticateToken } = require('../middleware/auth');"

# Check if line doesn't already exist
if auth_import not in content:
    lines.insert(insert_index, auth_import)
    
    # Write back
    with open('backend/routes/bookings.js', 'w') as f:
        f.write('\n'.join(lines))
    
    print("✅ Added authenticateToken import to bookings.js")
    print(f"   Inserted at line {insert_index + 1}")
else:
    print("✅ Import already exists")

