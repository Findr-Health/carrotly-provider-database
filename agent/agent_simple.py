#!/usr/bin/env python3
"""Simplified agent without OpenAI enrichment"""
import os
import sys
import requests
from dotenv import load_dotenv
import googlemaps

load_dotenv()

API_BASE = os.getenv('API_BASE_URL')
API_EMAIL = os.getenv('API_ADMIN_EMAIL')
API_PASSWORD = os.getenv('API_ADMIN_PASSWORD')
GMAPS_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Authenticate
response = requests.post(f'{API_BASE}/admin/login', json={
    'email': API_EMAIL,
    'password': API_PASSWORD
})
token = response.json()['token']
headers = {'Authorization': f'Bearer {token}'}

# Initialize Google Maps
gmaps = googlemaps.Client(key=GMAPS_KEY)

# Get command line args
city = sys.argv[2] if len(sys.argv) > 2 else "Bozeman"
state = sys.argv[4] if len(sys.argv) > 4 else "MT"
max_providers = int(sys.argv[8]) if len(sys.argv) > 8 else 5

print(f"🔍 Searching for medical providers in {city}, {state}...")

# Search Google Maps
query = f"medical clinic in {city}, {state}"
places = gmaps.places(query=query)['results'][:max_providers]

print(f"✅ Found {len(places)} providers")

# Create providers
for i, place in enumerate(places, 1):
    print(f"[{i}/{len(places)}] Processing: {place['name']}")
    
    # Build provider data
    provider_data = {
        'practiceName': place['name'],
        'providerTypes': ['medical'],
        'streetAddress': place.get('formatted_address', '').split(',')[0],
        'city': city,
        'state': state,
        'zipCode': '59715',  # Default
        'phone': place.get('formatted_phone_number') or '(000) 000-0000',
        'email': f"contact@{place['name'].lower().replace(' ', '')}.com",
        'status': 'draft',
        'source': 'agent',
    }
    
    # Upload to API
    response = requests.post(
        f'{API_BASE}/admin/providers',
        headers=headers,
        json=provider_data
    )
    
    if response.status_code == 201:
        print(f"  ✅ Created successfully")
    else:
        print(f"  ❌ Error: {response.status_code}: {response.text}")
        print(f"  📋 Data sent: {provider_data}")

print(f"\n✅ Completed! Added {len(places)} providers")
