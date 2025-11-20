import os
import requests
import base64
from dotenv import load_dotenv
import time

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

print(f"Backend URL: {BACKEND_URL}")
print(f"Token exists: {bool(ADMIN_TOKEN)}")

PROVIDERS = [
    {"id": "c2a9c810-298d-4977-a867-fee3cdb38f2f", "name": "Upper West Spa"},
    {"id": "a922e177-168e-4dd1-b14b-80f8f2a05ebd", "name": "Central Park West Med Spa"},
]

def search_place_id(name):
    print(f"  Searching for: {name}")
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': f"{name} Manhattan", 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    
    if data.get('status') != 'OK':
        print(f"    ❌ Google API error: {data.get('status')}")
        return None
    
    results = data.get('results', [])
    if results:
        place_id = results[0].get('place_id')
        print(f"    ✓ Found place_id: {place_id[:20]}...")
        return place_id
    print(f"    ❌ No results")
    return None

def get_photos(place_id):
    print(f"  Getting photos for place_id")
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {'place_id': place_id, 'fields': 'photos', 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    photos = response.json().get('result', {}).get('photos', [])
    print(f"    Found {len(photos)} photos")
    return photos[:3]

def download_photo(ref):
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {'photoreference': ref, 'maxwidth': 1200, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params, timeout=10)
    if response.status_code == 200:
        return response.content
    print(f"      ❌ Download failed: {response.status_code}")
    return None

def add_photos(provider_id, provider_name):
    print(f"\n📸 {provider_name} ({provider_id[:8]}...)")
    
    place_id = search_place_id(provider_name)
    if not place_id:
        return False
    
    photos = get_photos(place_id)
    if not photos:
        return False
    
    success = 0
    for i, photo in enumerate(photos):
        print(f"  Photo {i+1}...")
        photo_data = download_photo(photo.get('photo_reference'))
        
        if photo_data:
            print(f"    Downloaded {len(photo_data)} bytes")
            photo_b64 = base64.b64encode(photo_data).decode('utf-8')
            
            try:
                resp = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json={
                        'cloudinary_url': f'data:image/jpeg;base64,{photo_b64[:50]}...',  # Truncate for display
                        'is_primary': i == 0,
                        'display_order': i
                    },
                    timeout=20
                )
                
                if resp.status_code in [200, 201]:
                    print(f"    ✓ Uploaded successfully")
                    success += 1
                else:
                    print(f"    ❌ Upload failed: {resp.status_code} - {resp.text[:100]}")
            except Exception as e:
                print(f"    ❌ Exception: {e}")
        
        time.sleep(1)
    
    return success > 0

def main():
    print("="*60)
    print("📸 DEBUG: Adding photos to providers")
    print("="*60)
    
    for prov in PROVIDERS:
        add_photos(prov['id'], prov['name'])
        time.sleep(2)

if __name__ == "__main__":
    main()
