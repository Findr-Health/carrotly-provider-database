import os
import requests
import json
from openai import OpenAI
from dotenv import load_dotenv
import time

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

client = OpenAI(api_key=OPENAI_API_KEY)

# NYC Neighborhoods & Provider Types
LOCATIONS = [
    {"area": "Upper East Side, Manhattan", "types": ["cosmetic surgery", "dental clinic"]},
    {"area": "SoHo, Manhattan", "types": ["cosmetic surgery", "spa"]},
    {"area": "Midtown, Manhattan", "types": ["dental clinic", "cosmetic dentistry"]},
]

def search_google_places(area, provider_type):
    """Search Google Places API"""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': f'{provider_type} in {area}',
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        return data.get('results', [])[:3]  # Get 3 per search
    except Exception as e:
        print(f"    ⚠️  Search error: {e}")
        return []

def get_place_details(place_id):
    """Get detailed info including photos, hours, email"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,email,types',
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        return response.json().get('result', {})
    except Exception as e:
        print(f"    ⚠️  Details error: {e}")
        return {}

def download_photo(photo_reference, index):
    """Download photo from Google Places"""
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {
        'photoreference': photo_reference,
        'maxwidth': 1200,
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.content  # Return binary image data
    except Exception as e:
        print(f"    ⚠️  Photo download error: {e}")
    return None

def generate_services_with_ai(provider_name, provider_type, website):
    """Use GPT-4 to generate realistic services"""
    prompt = f"""Generate 6-8 realistic services for {provider_name}, a {provider_type} in NYC.

Return ONLY a JSON array with this exact structure:
[
  {{
    "serviceName": "Service name",
    "description": "Brief description",
    "duration": 30,
    "price": 250,
    "category": "Category name"
  }}
]

For {provider_type}, include appropriate services with NYC pricing.
Cosmetic: Botox ($400-600), Fillers ($600-900), Laser ($300-500), etc.
Dental: Cleaning ($150-200), Whitening ($400-600), Veneers ($1200-1500), etc."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
            
        services = json.loads(content)
        return services if isinstance(services, list) else []
        
    except Exception as e:
        print(f"    ⚠️  AI failed: {e}")
        return []

def create_provider_with_full_profile(place_data, details):
    """Create provider with photos, hours, services"""
    
    # Parse address
    address_parts = details.get('formatted_address', '').split(',')
    street = address_parts[0].strip() if len(address_parts) > 0 else ""
    city = "New York"
    state = "NY"
    zip_code = address_parts[-1].strip().split()[-1] if len(address_parts) > 0 else "10001"
    
    # Determine provider type
    types = details.get('types', [])
    if any(t in ['beauty_salon', 'spa', 'hair_care'] for t in types):
        provider_type = 'cosmetic'
    elif 'dentist' in types:
        provider_type = 'dental'
    else:
        provider_type = 'medical'
    
    # Generate services with AI
    print(f"  🤖 AI generating services...")
    services = generate_services_with_ai(
        place_data.get('name'),
        provider_type,
        details.get('website', '')
    )
    print(f"  ✅ {len(services)} services")
    
    # Download photos (up to 5)
    photos_data = []
    if 'photos' in details:
        print(f"  📸 Downloading {min(5, len(details['photos']))} photos...")
        for i, photo in enumerate(details['photos'][:5]):
            photo_content = download_photo(photo.get('photo_reference'), i)
            if photo_content:
                # Convert to base64 for now (in production, upload to S3)
                import base64
                photo_base64 = base64.b64encode(photo_content).decode('utf-8')
                photos_data.append({
                    'data': f'data:image/jpeg;base64,{photo_base64}',
                    'is_primary': i == 0
                })
        print(f"  ✅ {len(photos_data)} photos downloaded")
    
    # Parse business hours
    hours = {}
    if 'opening_hours' in details and 'weekday_text' in details['opening_hours']:
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for i, day_text in enumerate(details['opening_hours']['weekday_text']):
            day_name = days[i]
            # Parse "Monday: 9:00 AM – 5:00 PM"
            if ':' in day_text and '–' in day_text:
                times = day_text.split(':',1)[1].strip()
                if times.lower() != 'closed':
                    hours[day_name] = times
    
    # Build provider data
    provider_data = {
        'practiceName': place_data.get('name'),
        'email': details.get('email') or f"contact@{place_data.get('name', '').lower().replace(' ', '')}.com",
        'phone': details.get('formatted_phone_number', '(212) 555-0000'),
        'providerTypes': [provider_type.capitalize()],
        'streetAddress': street,
        'city': city,
        'state': state,
        'zipCode': zip_code,
        'website': details.get('website', ''),
        'status': 'approved',
        'source': 'agent',
        'rating': details.get('rating'),
        'reviewCount': details.get('user_ratings_total'),
        'businessHours': hours,
        'photos': photos_data,
        'services': services
    }
    
    # Create provider
    try:
        response = requests.post(
            f'{BACKEND_URL}/api/admin/providers',
            headers={
                'Authorization': f'Bearer {ADMIN_TOKEN}',
                'Content-Type': 'application/json'
            },
            json=provider_data
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            provider_id = result.get('provider', {}).get('id')
            print(f"  ✅ Provider created: {provider_id}")
            return True
        else:
            print(f"  ❌ Error: {response.text[:100]}")
            return False
            
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def main():
    print("="*60)
    print("🗽 NYC FULL PROFILE AGENT - Cosmetic & Dental")
    print("="*60)
    
    created = 0
    total = 0
    
    for location in LOCATIONS:
        print(f"\n📍 {location['area']}")
        
        for provider_type in location['types']:
            print(f"  🔍 {provider_type}")
            places = search_google_places(location['area'], provider_type)
            
            for place in places:
                total += 1
                name = place.get('name')
                place_id = place.get('place_id')
                
                print(f"\n[Processing] {name}")
                
                # Get full details
                details = get_place_details(place_id)
                
                if create_provider_with_full_profile(place, details):
                    created += 1
                
                time.sleep(1)  # Rate limiting
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {created}/{total} providers")
    print("="*60)

if __name__ == "__main__":
    main()
