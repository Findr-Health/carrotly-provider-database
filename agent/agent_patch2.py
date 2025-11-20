import sys

with open('agent.py', 'r') as f:
    lines = f.readlines()

# Find and replace the line with enrich_provider
new_lines = []
for i, line in enumerate(lines):
    if 'enriched_provider = self.enricher.enrich_provider(provider)' in line:
        # Get the indentation of this line
        indent = len(line) - len(line.lstrip())
        spaces = ' ' * indent
        
        # Replace with try-except block
        new_lines.append(f'{spaces}try:\n')
        new_lines.append(line)
        new_lines.append(f'{spaces}except AttributeError:\n')
        new_lines.append(f'{spaces}    enriched_provider = provider\n')
    elif 'self.enricher.close()' in line and 'if' not in line:
        indent = len(line) - len(line.lstrip())
        spaces = ' ' * indent
        new_lines.append(f'{spaces}if self.enricher:\n')
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('agent.py', 'w') as f:
    f.writelines(new_lines)

print("✅ Patched with try-except!")
