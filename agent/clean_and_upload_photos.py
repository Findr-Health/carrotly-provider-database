import os
import requests
import base64
from PIL import Image
from io import BytesIO
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

def delete_all_photos(provider_id):
    """Delete all existing photos"""
    try:
        resp = requests.delete(
            f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos/all',
            headers={'Authorization': f'Bearer {ADMIN_TOKEN}'}
        )
        if resp.status_code == 200:
            deleted = resp.json().get('deleted', 0)
            print(f"  🗑️  Deleted {deleted} old photos")
            return True
    except Exception as e:
        print(f"  ⚠️  Could not delete: {e}")
    return False

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
    params = {'photoreference': ref, 'maxwidth': 400, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params, timeout=10)
    return response.content if response.status_code == 200 else None

def compress_image(image_data):
    img = Image.open(BytesIO(image_data))
    max_size = (600, 600)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    output = BytesIO()
    img.save(output, format='JPEG', quality=70, optimize=True)
    return output.getvalue()

def add_photos(provider_id, provider_name):
    print(f"\n📸 {provider_name}")
    
    # Delete old photos first
    delete_all_photos(provider_id)
    
    place_id = search_place_id(provider_name)
    if not place_id:
        print("  ❌ Place not found")
        return False
    
    photos = get_photos(place_id)
    if not photos:
        print("  ❌ No photos available")
        return False
    
    print(f"  📥 Uploading {len(photos)} new photos...")
    
    success = 0
    for i, photo in enumerate(photos):
        photo_data = download_photo(photo.get('photo_reference'))
        
        if photo_data:
            compressed = compress_image(photo_data)
            photo_b64 = base64.b64encode(compressed).decode('utf-8')
            
            try:
                resp = requests.post(
                    f'{BACKEND_URL}/api/admin/providers/{provider_id}/photos',
                    headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                    json={
                        'cloudinary_url': f'data:image/jpeg;base64,{photo_b64}',
                        'is_primary': i == 0,
                        'display_order': i
                    },
                    timeout=30
                )
                
                if resp.status_code in [200, 201]:
                    print(f"    ✓ Photo {i+1}")
                    success += 1
                else:
                    print(f"    ✗ Photo {i+1} failed")
            except Exception as e:
                print(f"    ✗ Photo {i+1} error")
        
        time.sleep(1)
    
    print(f"  ✅ {success}/{len(photos)} photos uploaded")
    return success > 0

def main():
    print("="*60)
    print("🧹 CLEAN & UPLOAD PHOTOS")
    print("="*60)
    
    for prov in PROVIDERS:
        add_photos(prov['id'], prov['name'])
        time.sleep(2)
    
    print("\n✅ Done! Refresh dashboard with Cmd+Shift+R")

if __name__ == "__main__":
    main()
