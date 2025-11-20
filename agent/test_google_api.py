import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

print(f"API Key: {GOOGLE_API_KEY[:20]}..." if GOOGLE_API_KEY else "No API key found!")

url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
params = {
    'query': 'cosmetic surgery in Upper East Side, Manhattan',
    'key': GOOGLE_API_KEY
}

print("\nTesting Google Places API...")
response = requests.get(url, params=params)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

data = response.json()
print(f"\nResults found: {len(data.get('results', []))}")
if 'error_message' in data:
    print(f"ERROR: {data['error_message']}")
