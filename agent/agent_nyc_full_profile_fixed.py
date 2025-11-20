import os
import requests
import json
from openai import OpenAI
from dotenv import load_dotenv
import time
import re

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

def parse_address(formatted_address):
    """Safely parse address components"""
    try:
        # Example: "123 Main St, New York, NY 10001, USA"
        parts = [p.strip() for p in formatted_address.split(',')]
        
        street = parts[0] if len(parts) > 0 else "Unknown"
        city = "New York"
        state = "NY"
        zip_code = "10001"
        
        # Try to extract ZIP code (5 digits)
        for part in parts:
            zip_match = re.search(r'\b\d{5}\b', part)
            if zip_match:
                zip_code = zip_match.group()
                break
        
        # Try to extract state (2 letter code)
        for part in parts:
            state_match = re.search(r'\b[A-Z]{2}\b', part)
            if state_match and state_match.group() != 'NY':
                state = state_match.group()
        
        # City is usually second-to-last or in the middle
        if len(parts) >= 2:
            city = parts[-2].strip() if 'NY' in parts[-1] or 'USA' in parts[-1] else parts[1].strip()
        
        return street, city, state, zip_code
        
    except Exception as e:
        print(f"    ⚠️ Address parsing error: {e}")
        return "Unknown", "New York", "NY", "10001"

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
        return data.get('results', [])[:3]
    except Exception as e:
        print(f"    ⚠️ Search error: {e}")
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
        print(f"    ⚠️ Details error: {e}")
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
            return response.content
    except Exception as e:
        print(f"    ⚠️ Photo {index} error: {e}")
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
Cosmetic: Botox ($400-600), Fillers ($600-900), Laser ($300-500), Consultation ($150-250)
Dental: Cleaning ($150-200), Whitening ($400-600), Veneers ($1200-1500), Exam ($100-150)"""

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
        print(f"    ⚠️ AI error: {e}")
        return []

def create_provider_with_full_profile(place_data, details):
    """Create provider with photos, hours, services"""
    
    name = place_data.get('name', 'Unknown Provider')
    
    # Parse address safely
    formatted_address = details.get('formatted_address', '')
    street, city, state, zip_code = parse_address(formatted_address)
    
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
    services = generate_services_with_ai(name, provider_type, details.get('website', ''))
    print(f"  ✅ {len(services)} services")
    
    # Download photos (up to 5)
    photos_data = []
    if 'photos' in details and len(details['photos']) > 0:
        photo_count = min(5, len(details['photos']))
        print(f"  📸 Downloading {photo_count} photos...")
        for i, photo in enumerate(details['photos'][:5]):
            photo_content = download_photo(photo.get('photo_reference'), i)
            if photo_content:
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
            if i < len(days):
                day_name = days[i]
                if ':' in day_text and '–' in day_text:
                    times = day_text.split(':', 1)[1].strip()
                    if times.lower() != 'closed':
                        hours[day_name] = times
    
    # Build provider data
    provider_data = {
        'practiceName': name,
        'email': details.get('email') or f"contact@{name.lower().replace(' ', '').replace(',', '')}@example.com",
        'phone': details.get('formatted_phone_number', '(212) 555-0000'),
        'providerTypes': [provider_type.capitalize()],
        'streetAddress': street,
        'city': city,
        'state': state,
        'zipCode': zip_code,
        'website': details.get('website', ''),
        'status': 'approved',
        'source': 'agent',
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
            
            # Add services
            if provider_id and services:
                success_count = 0
                for service in services:
                    try:
                        svc_response = requests.post(
                            f'{BACKEND_URL}/api/admin/providers/{provider_id}/services',
                            headers={
                                'Authorization': f'Bearer {ADMIN_TOKEN}',
                                'Content-Type': 'application/json'
                            },
                            json=service
                        )
                        if svc_response.status_code in [200, 201]:
                            success_count += 1
                    except:
                        pass
                print(f"  ✅ Provider created with {success_count}/{len(services)} services")
            else:
                print(f"  ✅ Provider created")
            
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
        print(f"\n�� {location['area']}")
        
        for provider_type in location['types']:
            print(f"  🔍 {provider_type}")
            places = search_google_places(location['area'], provider_type)
            
            for place in places:
                total += 1
                name = place.get('name')
                place_id = place.get('place_id')
                
                print(f"\n[Processing] {name}")
                
                details = get_place_details(place_id)
                
                if create_provider_with_full_profile(place, details):
                    created += 1
                
                time.sleep(1)
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {created}/{total} providers")
    print("="*60)

if __name__ == "__main__":
    main()
