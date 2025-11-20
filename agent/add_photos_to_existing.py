import os
import requests
import base64
from dotenv import load_dotenv
import time

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
BACKEND_URL = os.getenv('BACKEND_URL')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

# The 4 providers that need photos
PROVIDERS = [
    {
        "id": "c2a9c810-298d-4977-a867-fee3cdb38f2f",
        "name": "Upper West Spa",
        "place_id": "ChIJEQi5EWxYwokRkFqJFXXxP0c"  # You'll need to get this
    },
    {
        "id": "a922e177-168e-4dd1-b14b-80f8f2a05ebd",
        "name": "Central Park West Med Spa",
        "place_id": "ChIJbwT3CRZYWOKR6vXTaHcNQ4w"
    },
    {
        "id": "0824695e-4d07-4a6d-bb96-8f3a0dcd3afc",
        "name": "Village Dental Medicine",
        "place_id": "ChIJAQDAD6xZwokRXqT4NqYxE5c"
    },
    {
        "id": "c1d492cc-a050-43b4-91fa-0a54f389bed0",
        "name": "West Village Dental Studio",
        "place_id": "ChIJmQVXzKpZwokROIqXdw7u-8A"
    }
]

def search_place_id(name):
    """Search for place ID by name"""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': f"{name} Manhattan", 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    results = response.json().get('results', [])
    if results:
        return results[0].get('place_id')
    return None

def get_place_photos(place_id):
    """Get photos for a place"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'photos',
        'key': GOOGLE_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json().get('result', {}).get('photos', [])

def download_photo(photo_reference):
    """Download photo from Google"""
    url = "https://maps.googleapis.com/maps/api/place/photo"
    params = {'photoreference': photo_reference, 'maxwidth': 1200, 'key': GOOGLE_API_KEY}
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.content
    except:
        pass
    return None

def add_photos_to_provider(provider_id, provider_name):
    """Add photos to a provider"""
    print(f"\n📸 {provider_name}")
    
    # Search for place ID
    place_id = search_place_id(provider_name)
    if not place_id:
        print(f"  ❌ Could not find place")
        return False
    
    # Get photos
    photos = get_place_photos(place_id)
    if not photos:
        print(f"  ⚠️  No photos available")
        return False
    
    print(f"  Found {len(photos)} photos")
    
    # Download and upload up to 3 photos
    success = 0
    for i, photo in enumerate(photos[:3]):
        photo_data = download_photo(photo.get('photo_reference'))
        if photo_data:
            photo_b64 = base64.b64encode(photo_data).decode('utf-8')
            
            try:
                response = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json={
                        'cloudinary_url': f'data:image/jpeg;base64,{photo_b64}',
                        'is_primary': i == 0,
                        'display_order': i
                    },
                    timeout=20
                )
                
                if response.status_code in [200, 201]:
                    print(f"    ✓ Photo {i+1} uploaded")
                    success += 1
                else:
                    print(f"    ✗ Photo {i+1} failed: {response.text[:50]}")
            except Exception as e:
                print(f"    ✗ Photo {i+1} error: {e}")
        
        time.sleep(1)
    
    print(f"  ✅ {success}/3 photos added")
    return success > 0

def main():
    print("="*60)
    print("📸 ADDING PHOTOS TO EXISTING PROVIDERS")
    print("="*60)
    
    success = 0
    for provider in PROVIDERS:
        if add_photos_to_provider(provider['id'], provider['name']):
            success += 1
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {success}/{len(PROVIDERS)} providers updated")
    print("="*60)

if __name__ == "__main__":
    main()
