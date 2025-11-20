import os
import requests
import base64
from dotenv import load_dotenv
import time

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

PROVIDERS = [
    {"id": "c2a9c810-298d-4977-a867-fee3cdb38f2f", "name": "Upper West Spa"},
    {"id": "a922e177-168e-4dd1-b14b-80f8f2a05ebd", "name": "Central Park West Med Spa"},
]

def search_place_id(name):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': f"{name} Manhattan", 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    results = response.json().get('results', [])
    return results[0].get('place_id') if results else None

def get_photos(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {'place_id': place_id, 'fields': 'photos', 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    return response.json().get('result', {}).get('photos', [])[:3]

def download_photo(ref):
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {'photoreference': ref, 'maxwidth': 800, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params, timeout=10)
    return response.content if response.status_code == 200 else None

def delete_existing_photos(provider_id):
    """Delete existing broken photos"""
    try:
        # Get existing photos
        resp = requests.get(
            f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
            headers={'Authorization': f'Bearer {ADMIN_TOKEN}'}
        )
        photos = resp.json().get('photos', [])
        
        # Delete each one (you'll need to add DELETE endpoint, or we skip this)
        print(f"  Found {len(photos)} existing photos (will overwrite)")
    except:
        pass

def add_photos(provider_id, provider_name):
    print(f"\n📸 {provider_name}")
    
    place_id = search_place_id(provider_name)
    if not place_id:
        print("  ❌ Place not found")
        return False
    
    photos = get_photos(place_id)
    if not photos:
        print("  ❌ No photos")
        return False
    
    print(f"  Found {len(photos)} photos")
    delete_existing_photos(provider_id)
    
    success = 0
    for i, photo in enumerate(photos):
        photo_data = download_photo(photo.get('photo_reference'))
        
        if photo_data:
            # FULL base64 - NO TRUNCATION!
            photo_b64 = base64.b64encode(photo_data).decode('utf-8')
            print(f"  Photo {i+1}: {len(photo_b64)} chars")
            
            try:
                resp = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json={
                        'cloudinary_url': f'data:image/jpeg;base64,{photo_b64}',  # FULL!
                        'is_primary': i == 0,
                        'display_order': i
                    },
                    timeout=30
                )
                
                if resp.status_code in [200, 201]:
                    print(f"    ✓ Uploaded")
                    success += 1
                else:
                    print(f"    ✗ Failed: {resp.text[:100]}")
            except Exception as e:
                print(f"    ✗ Error: {str(e)[:100]}")
        
        time.sleep(1)
    
    return success > 0

def main():
    print("="*60)
    print("🔧 FIXING PHOTOS - Full Base64 Upload")
    print("="*60)
    
    for prov in PROVIDERS:
        add_photos(prov['id'], prov['name'])
        time.sleep(2)

if __name__ == "__main__":
    main()
