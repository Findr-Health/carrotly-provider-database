#!/usr/bin/env python3
"""Fix route order in users.js - specific routes before parameterized"""

with open('backend/routes/users.js', 'r') as f:
    lines = f.readlines()

# Find the line numbers
generic_id_route_line = None
favorites_route_line = None
favorites_check_line = None

for i, line in enumerate(lines):
    if "router.get('/:id'," in line and generic_id_route_line is None:
        generic_id_route_line = i
    if "router.get('/favorites'," in line and "auth" in line:
        favorites_route_line = i
    if "router.get('/favorites/:providerId/check'" in line:
        favorites_check_line = i

print(f"Found routes:")
print(f"  /:id at line {generic_id_route_line + 1}")
print(f"  /favorites at line {favorites_route_line + 1}")
print(f"  /favorites/:providerId/check at line {favorites_check_line + 1}")

if generic_id_route_line > favorites_route_line:
    print("\n❌ Routes already in wrong order - /:id comes after /favorites")
    print("   This is actually backwards from expected!")
    exit(1)

# Extract the /:id route (find its end by looking for next router. or end of file)
id_route_start = generic_id_route_line
id_route_end = None

for i in range(id_route_start + 1, len(lines)):
    if lines[i].strip().startswith('router.') and i > id_route_start:
        id_route_end = i - 1
        break

if id_route_end is None:
    id_route_end = len(lines) - 1

# Find end of /:id route more carefully (look for closing brace at same indent level)
brace_count = 0
for i in range(id_route_start, min(id_route_start + 200, len(lines))):
    line = lines[i]
    brace_count += line.count('{') - line.count('}')
    if brace_count == 0 and i > id_route_start and '});' in line:
        id_route_end = i
        break

print(f"\n/:id route spans lines {id_route_start + 1} to {id_route_end + 1}")

# Extract the /:id route
id_route_lines = lines[id_route_start:id_route_end + 1]

# Remove it from current position
lines_without_id = lines[:id_route_start] + lines[id_route_end + 1:]

# Find where to insert it (after /favorites/:providerId/check)
# Find the end of /favorites/:providerId/check route
insert_after_line = None
brace_count = 0
for i in range(len(lines_without_id)):
    if "router.get('/favorites/:providerId/check'" in lines_without_id[i]:
        # Find end of this route
        for j in range(i, min(i + 200, len(lines_without_id))):
            line = lines_without_id[j]
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0 and j > i and '});' in line:
                insert_after_line = j + 1
                break
        break

if insert_after_line is None:
    print("❌ Could not find where to insert /:id route")
    exit(1)

print(f"Will insert /:id route after line {insert_after_line}")

# Insert with blank line before it
new_lines = (
    lines_without_id[:insert_after_line] + 
    ['\n'] +
    id_route_lines + 
    lines_without_id[insert_after_line:]
)

# Write back
with open('backend/routes/users.js', 'w') as f:
    f.writelines(new_lines)

print("\n✅ Fixed route order!")
print("   New order:")
print("   1. /favorites")
print("   2. /favorites/:providerId/check")
print("   3. /:id (now comes AFTER specific routes)")

