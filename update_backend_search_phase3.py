#!/usr/bin/env python3
"""
FINDR HEALTH - UX IMPROVEMENT PHASE 3: Multi-Field Search (Backend)
Adds: Location search (city, state) to existing multi-field search
Author: World-class engineering standards
"""

def update_file(filepath, old_text, new_text, description):
    """Update a specific section in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_text not in content:
            print(f"❌ Could not find expected text in {filepath}")
            print(f"   Looking for: {old_text[:50]}...")
            return False
        
        updated_content = content.replace(old_text, new_text)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ {filepath}")
        print(f"   - {description}")
        return True
    
    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    print("=" * 80)
    print("PHASE 3 - PART A: BACKEND MULTI-FIELD SEARCH")
    print("=" * 80)
    print()
    
    # Add location fields to search
    old_search_block = """    // Text search across name, services, categories
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { practiceName: searchRegex },
        { 'services.name': searchRegex },
        { 'services.category': searchRegex },
        { providerTypes: searchRegex },
        { description: searchRegex }"""
    
    new_search_block = """    // Text search across name, services, categories, locations
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { practiceName: searchRegex },
        { 'services.name': searchRegex },
        { 'services.category': searchRegex },
        { providerTypes: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex }"""
    
    print("📝 Adding location search fields to providers.js...")
    if update_file(
        "backend/routes/providers.js",
        old_search_block,
        new_search_block,
        "Added city and state to multi-field search"
    ):
        print()
        print("=" * 80)
        print("✅ BACKEND UPDATE COMPLETE")
        print("=" * 80)
        print()
        print("📋 Search now includes:")
        print("   ✅ Provider names (practiceName)")
        print("   ✅ Service names (services.name)")
        print("   ✅ Service categories (services.category)")
        print("   ✅ Provider types")
        print("   ✅ Descriptions")
        print("   ✅ Cities (address.city) - NEW")
        print("   ✅ States (address.state) - NEW")
        print()
        print("🔍 Next Steps:")
        print("   1. Deploy to Railway")
        print("   2. Test search with: 'San Francisco', 'California', 'teeth whitening'")
        print("   3. Proceed to Part B: Frontend updates")
        print()
    else:
        print()
        print("⚠️  Update failed. Please check the file manually.")
        print()

if __name__ == "__main__":
    main()
