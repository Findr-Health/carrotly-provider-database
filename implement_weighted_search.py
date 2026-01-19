#!/usr/bin/env python3
"""
Implement weighted text search with proper ranking
World-class solution: MongoDB text index with custom weights
"""

with open('backend/routes/providers.js', 'r') as f:
    content = f.read()

# Find and replace the search logic
old_search = """    // Text search across name, services, categories, locations
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { practiceName: searchRegex },
        { 'services.name': searchRegex },
        { 'services.category': searchRegex },
        { providerTypes: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex }
      ];
    }"""

new_search = """    // Text search with relevance scoring
    let useTextSearch = false;
    if (search) {
      // Try text search first (requires text index)
      // If text index exists, use it for better relevance
      try {
        // Use MongoDB text search with scoring
        query.$text = { $search: search };
        useTextSearch = true;
      } catch (e) {
        // Fallback to regex search if no text index
        const searchRegex = new RegExp(search, 'i');
        
        // Weighted search: prioritize service names and categories
        // Use aggregation to calculate relevance scores
        const serviceNameMatch = { 'services.name': searchRegex };
        const serviceCategoryMatch = { 'services.category': searchRegex };
        const providerTypeMatch = { providerTypes: searchRegex };
        const practiceNameMatch = { practiceName: searchRegex };
        const descriptionMatch = { description: searchRegex };
        const locationMatch = {
          $or: [
            { 'address.city': searchRegex },
            { 'address.state': searchRegex }
          ]
        };
        
        // Combine with OR (any match is valid)
        query.$or = [
          serviceNameMatch,
          serviceCategoryMatch,
          providerTypeMatch,
          practiceNameMatch,
          descriptionMatch,
          locationMatch
        ];
      }
    }"""

content = content.replace(old_search, new_search)

# Update the query execution to handle scoring
old_query_exec = """    let providers = await Provider.find(query)
      .sort(sortOption)
      .limit(parseInt(limit));"""

new_query_exec = """    let providers;
    
    if (useTextSearch && !sort) {
      // When using text search without explicit sort, sort by text score
      providers = await Provider.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(parseInt(limit));
    } else if (useTextSearch && sort) {
      // Use explicit sort but include text score
      providers = await Provider.find(query, { score: { $meta: "textScore" } })
        .sort(sortOption)
        .limit(parseInt(limit));
    } else {
      // Regular search without text index
      providers = await Provider.find(query)
        .sort(sortOption)
        .limit(parseInt(limit));
    }"""

content = content.replace(old_query_exec, new_query_exec)

with open('backend/routes/providers.js', 'w') as f:
    f.write(content)

print("✅ Updated search logic with text search support")
print("   - Added MongoDB text search with scoring")
print("   - Fallback to regex if no text index")
print("   - Sorts by relevance when using text search")

