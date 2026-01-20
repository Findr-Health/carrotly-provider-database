#!/usr/bin/env python3
"""Fix admin endpoint to properly drop old index"""

with open('routes/admin.js', 'r') as f:
    content = f.read()

# Replace the index checking/dropping logic
old_logic = """    // Check if text index exists
    const indexes = await providers.indexes();
    const hasTextIndex = indexes.some(idx => idx.key && idx.key._fts === 'text');
    
    if (hasTextIndex) {
      await providers.dropIndex('text_search_idx').catch(() => {});
    }"""

new_logic = """    // Drop ALL text indexes first
    const indexes = await providers.indexes();
    const textIndexes = indexes.filter(idx => idx.key && idx.key._fts === 'text');
    
    for (const idx of textIndexes) {
      console.log(`Dropping old text index: ${idx.name}`);
      await providers.dropIndex(idx.name).catch(e => {
        console.log(`Could not drop ${idx.name}:`, e.message);
      });
    }"""

content = content.replace(old_logic, new_logic)

with open('routes/admin.js', 'w') as f:
    f.write(content)

print("✅ Updated admin endpoint to drop ALL old text indexes")

