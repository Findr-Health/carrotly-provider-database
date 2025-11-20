import os
import requests
import json
import base64
from PIL import Image
from io import BytesIO
from openai import OpenAI
from dotenv import load_dotenv
import time
import re

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

client = OpenAI(api_key=OPENAI_API_KEY)

def search_specific_place(query):
    """Search for the specific clinic"""
    print(f"🔍 Searching: {query}")
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': query, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    results = response.json()
    
    if results.get('status') != 'OK':
        print(f"  ❌ Search failed: {results.get('status')}")
        return None
    
    places = results.get('results', [])
    if not places:
        print("  ❌ No results found")
        return None
    
    # Return first result
    place = places[0]
    print(f"  ✓ Found: {place.get('name')}")
    print(f"    Address: {place.get('formatted_address')}")
    print(f"    Rating: {place.get('rating')} ({place.get('user_ratings_total')} reviews)")
    return place

def get_place_details(place_id):
    """Get detailed information"""
    print(f"\n📋 Getting details...")
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,photos,opening_hours,types',
        'key': GOOGLE_API_KEY
    }
    response = requests.get(url, params=params)
    result = response.json().get('result', {})
    
    print(f"  Name: {result.get('name')}")
    print(f"  Phone: {result.get('formatted_phone_number')}")
    print(f"  Website: {result.get('website', 'N/A')}")
    print(f"  Photos: {len(result.get('photos', []))} available")
    
    return result

def parse_address(formatted_address):
    """Parse address into components"""
    parts = [p.strip() for p in formatted_address.split(',')]
    
    # For Albania
    street = parts[0] if len(parts) > 0 else "Unknown"
    city = "Prishtina"
    state = "XK"  # Kosovo code
    zip_code = "10000"
    
    # Try to extract city from address
    for part in parts:
        if 'Prishtina' in part or 'Pristina' in part:
            city = 'Prishtina'
    
    return street, city, state, zip_code

def download_photo(ref):
    """Download photo from Google"""
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {'photoreference': ref, 'maxwidth': 400, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params, timeout=10)
    return response.content if response.status_code == 200 else None

def compress_image(image_data):
    """Compress image"""
    img = Image.open(BytesIO(image_data))
    max_size = (600, 600)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    output = BytesIO()
    img.save(output, format='JPEG', quality=70, optimize=True)
    return output.getvalue()

def get_photos(details):
    """Download and compress photos"""
    photos = []
    photo_list = details.get('photos', [])[:5]  # Up to 5 photos
    
    if not photo_list:
        return photos
    
    print(f"\n�� Downloading {len(photo_list)} photos...")
    
    for i, photo in enumerate(photo_list):
        photo_data = download_photo(photo.get('photo_reference'))
        if photo_data:
            compressed = compress_image(photo_data)
            photo_b64 = base64.b64encode(compressed).decode('utf-8')
            photos.append({
                'cloudinary_url': f'data:image/jpeg;base64,{photo_b64}',
                'is_primary': i == 0,
                'display_order': i
            })
            print(f"  ✓ Photo {i+1}")
        time.sleep(1)
    
    return photos

def generate_dental_services():
    """Generate dental services"""
    print(f"\n🤖 Generating dental services...")
    
    prompt = """Generate 6-8 realistic dental services for a dental clinic in Albania.
Prices should be in USD but appropriate for Albanian market (lower than US prices).

Return ONLY valid JSON array:
[
  {
    "serviceName": "Dental Cleaning",
    "description": "Professional teeth cleaning and plaque removal",
    "duration": 45,
    "price": 30,
    "category": "Preventive"
  }
]

Include services like:
- Dental Cleaning ($25-40)
- Dental Exam ($20-35)
- Filling ($40-80)
- Teeth Whitening ($100-150)
- Crown ($200-350)
- Root Canal ($150-250)
- Extraction ($30-60)
- X-rays ($15-30)"""

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
        validated = [s for s in services if all(k in s for k in ['serviceName', 'description', 'duration', 'price', 'category'])]
        
        print(f"  ✅ Generated {len(validated)} services")
        for s in validated:
            print(f"    - {s['serviceName']}: ${s['price']}")
        
        return validated
    except Exception as e:
        print(f"  ❌ AI error: {e}")
        return []

def create_provider(place_data, details):
    """Create provider in database"""
    print(f"\n💾 Creating provider...")
    
    name = place_data.get('name', 'Unknown')[:255]
    formatted_address = place_data.get('formatted_address', '')
    street, city, state, zip_code = parse_address(formatted_address)
    
    email_name = re.sub(r'[^a-z0-9]', '', name.lower())[:30]
    email = f"{email_name}@example.com"
    
    # Get photos
    photos = get_photos(details)
    
    # Generate services
    services = generate_dental_services()
    
    if not services:
        print("  ❌ No services generated")
        return False
    
    # Create provider
    provider_data = {
        'practiceName': name,
        'email': email,
        'phone': details.get('formatted_phone_number') or details.get('international_phone_number') or '+383 XX XXX XXX',
        'providerTypes': ['Dental'],
        'streetAddress': street[:255],
        'city': city,
        'state': state,
        'zipCode': zip_code,
        'website': details.get('website', '')[:500] if details.get('website') else '',
        'status': 'approved',
        'source': 'agent'
    }
    
    try:
        # Create provider
        response = requests.post(
            f'{BACKEND_URL}/api/admin/providers',
            headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
            json=provider_data,
            timeout=15
        )
        
        if response.status_code not in [200, 201]:
            print(f"  ❌ Failed to create provider: {response.text[:200]}")
            return False
        
        provider_id = response.json().get('provider', {}).get('id')
        print(f"  ✅ Provider created: {provider_id}")
        
        # Add photos
        photo_success = 0
        for photo in photos:
            try:
                r = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json=photo,
                    timeout=30
                )
                if r.status_code in [200, 201]:
                    photo_success += 1
            except:
                pass
        
        print(f"  📸 {photo_success}/{len(photos)} photos uploaded")
        
        # Add services
        service_success = 0
        for service in services:
            try:
                r = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/services',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json=service,
                    timeout=10
                )
                if r.status_code in [200, 201]:
                    service_success += 1
            except:
                pass
        
        print(f"  🦷 {service_success}/{len(services)} services added")
        
        print(f"\n✅ SUCCESS! Provider ID: {provider_id}")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("="*60)
    print("🇦🇱 DUA DENT - PRISHTINA, ALBANIA")
    print("="*60)
    
    # Search for the clinic
    place = search_specific_place("Dua Dent Dentist Stomatolog Dental Clinic Prishtina Albania")
    
    if not place:
        print("\n❌ Could not find clinic")
        return
    
    # Get detailed information
    place_id = place.get('place_id')
    details = get_place_details(place_id)
    
    # Create provider
    if create_provider(place, details):
        print("\n" + "="*60)
        print("✅ DUA DENT ADDED TO DATABASE!")
        print("="*60)
        print("\n📊 View in dashboard: http://localhost:5173")
    else:
        print("\n❌ Failed to create provider")

if __name__ == "__main__":
    main()
