import os
import requests
import json
from openai import OpenAI
from dotenv import load_dotenv
import time
import re
import base64

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

client = OpenAI(api_key=OPENAI_API_KEY)

def parse_address(formatted_address):
    try:
        parts = [p.strip() for p in formatted_address.split(',')]
        street = parts[0] if len(parts) > 0 else "Unknown"
        city, state, zip_code = "New York", "NY", "10001"
        for part in parts:
            zip_match = re.search(r'\d{5}', part)
            if zip_match:
                zip_code = zip_match.group()
                break
        return street, city, state, zip_code
    except:
        return "Unknown", "New York", "NY", "10001"

def search_google_places(query):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': query, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    return response.json().get('results', [])[:2]

def get_place_details(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,formatted_phone_number,website,photos,types',
        'key': GOOGLE_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json().get('result', {})

def download_photo(photo_reference):
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {'photoreference': photo_reference, 'maxwidth': 1200, 'key': GOOGLE_API_KEY}
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.content
    except:
        pass
    return None

def get_photos(details):
    photos = []
    if 'photos' not in details or not details['photos']:
        return photos
    
    photo_refs = details['photos'][:3]
    print(f"  📸 Downloading {len(photo_refs)} photos...")
    
    for i, photo in enumerate(photo_refs):
        photo_data = download_photo(photo.get('photo_reference'))
        if photo_data:
            photo_b64 = base64.b64encode(photo_data).decode('utf-8')
            photos.append({
                'cloudinary_url': f'data:image/jpeg;base64,{photo_b64}',
                'is_primary': i == 0,
                'display_order': i
            })
            print(f"      ✓ Photo {i+1}")
    return photos

def generate_services(provider_name, provider_type):
    if provider_type == "Dental":
        prompt = f"Generate 5 dental services for {provider_name} NYC. JSON only: [{{'serviceName':'Dental Cleaning','description':'Professional cleaning','duration':60,'price':175,'category':'Preventive'}}]"
    else:
        prompt = f"Generate 5 cosmetic services for {provider_name} NYC. JSON only: [{{'serviceName':'Botox','description':'Wrinkle reduction','duration':30,'price':550,'category':'Injectables'}}]"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800
        )
        content = response.choices[0].message.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        services = json.loads(content)
        return [s for s in services if all(k in s for k in ['serviceName', 'description', 'duration', 'price', 'category'])]
    except:
        return []

def create_provider(place_data, details, provider_type):
    name = place_data.get('name', 'Unknown')[:255]
    street, city, state, zip_code = parse_address(details.get('formatted_address', ''))
    email_name = re.sub(r'[^a-z0-9]', '', name.lower())[:30]
    
    photos = get_photos(details)
    services = generate_services(name, provider_type)
    
    if not services:
        print(f"  ❌ No services")
        return False
    
    print(f"  ✅ {len(services)} services, {len(photos)} photos")
    
    provider_data = {
        'practiceName': name,
        'email': f"{email_name}@example.com",
        'phone': details.get('formatted_phone_number', '(212) 555-0000'),
        'providerTypes': [provider_type],
        'streetAddress': street[:255],
        'city': city,
        'state': state,
        'zipCode': zip_code,
        'website': details.get('website', '')[:500] if details.get('website') else '',
        'status': 'approved',
        'source': 'agent'
    }
    
    try:
        response = requests.post(
            f'{BACKEND_URL}/api/admin/providers',
            headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
            json=provider_data,
            timeout=15
        )
        
        if response.status_code not in [200, 201]:
            print(f"  ❌ Failed: {response.text[:100]}")
            return False
        
        provider_id = response.json().get('provider', {}).get('id')
        
        photo_count = 0
        for photo in photos:
            try:
                r = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json=photo,
                    timeout=20
                )
                if r.status_code in [200, 201]:
                    photo_count += 1
            except:
                pass
        
        service_count = 0
        for service in services:
            try:
                r = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/services',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json=service,
                    timeout=10
                )
                if r.status_code in [200, 201]:
                    service_count += 1
            except:
                pass
        
        print(f"  ✅ Created: {photo_count}/{len(photos)} photos, {service_count}/{len(services)} services")
        return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("="*60)
    print("📸 NYC PROVIDERS WITH PHOTOS - Test")
    print("="*60)
    
    searches = [
        {"query": "dental office West Village Manhattan", "type": "Dental"},
        {"query": "med spa Upper West Side Manhattan", "type": "Cosmetic"},
    ]
    
    created, total = 0, 0
    
    for search in searches:
        print(f"\n🔍 {search['query']}")
        places = search_google_places(search['query'])
        
        for place in places:
            total += 1
            print(f"\n[{total}] {place.get('name')}")
            details = get_place_details(place.get('place_id'))
            
            if create_provider(place, details, search['type']):
                created += 1
            
            time.sleep(2)
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {created}/{total} providers")
    print("="*60)

if __name__ == "__main__":
    main()
