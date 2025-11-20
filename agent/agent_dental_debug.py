import os
import requests
import json
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

def parse_address(formatted_address):
    """Safely parse address"""
    try:
        parts = [p.strip() for p in formatted_address.split(',')]
        street = parts[0] if len(parts) > 0 else "Unknown"
        city = "New York"
        state = "NY"
        zip_code = "10001"
        
        for part in parts:
            zip_match = re.search(r'\b\d{5}\b', part)
            if zip_match:
                zip_code = zip_match.group()
                break
        
        return street, city, state, zip_code
    except:
        return "Unknown", "New York", "NY", "10001"

def search_google_places():
    """Search for dental clinics in NYC"""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': 'dental clinic in Upper East Side Manhattan',
        'key': GOOGLE_API_KEY
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    return data.get('results', [])[:3]  # Just 3 for testing

def get_place_details(place_id):
    """Get detailed info"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,formatted_phone_number,website,types',
        'key': GOOGLE_API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json().get('result', {})

def generate_dental_services(provider_name):
    """Generate dental services with AI"""
    prompt = f"""Generate 6 realistic dental services for {provider_name} in NYC.

Return ONLY a JSON array:
[
  {{
    "serviceName": "Dental Cleaning",
    "description": "Professional teeth cleaning",
    "duration": 60,
    "price": 150,
    "category": "Preventive"
  }}
]

Include: Cleaning ($150-200), Whitening ($400-600), Filling ($200-300), Crown ($1200), Exam ($100-150), X-rays ($100-150)"""

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
        print(f"    ⚠️  AI error: {e}")
        return []

def create_provider(place_data, details):
    """Create provider with debug output"""
    
    name = place_data.get('name', 'Unknown')
    print(f"\n[DEBUG] Processing: {name}")
    
    # Parse address
    formatted_address = details.get('formatted_address', '')
    street, city, state, zip_code = parse_address(formatted_address)
    
    # Clean email generation - SIMPLIFIED
    email_name = name.lower()
    email_name = re.sub(r'[^a-z0-9]', '', email_name)[:30]  # Remove special chars, max 30
    email = f"{email_name}@example.com"
    
    # Generate services
    print(f"  🤖 Generating services...")
    services = generate_dental_services(name)
    print(f"  ✅ {len(services)} services generated")
    
    # Build provider data
    provider_data = {
        'practiceName': name[:255],  # Limit length
        'email': email,
        'phone': details.get('formatted_phone_number', '(212) 555-0000'),
        'providerTypes': ['Dental'],
        'streetAddress': street[:255],
        'city': city,
        'state': state,
        'zipCode': zip_code,
        'website': details.get('website', '')[:500] if details.get('website') else '',
        'status': 'approved',
        'source': 'agent'
    }
    
    print("\n[DEBUG] Sending provider data:")
    print(json.dumps(provider_data, indent=2))
    
    # Create provider
    try:
        response = requests.post(
            f'{BACKEND_URL}/api/admin/providers',
            headers={
                'Authorization': f'Bearer {ADMIN_TOKEN}',
                'Content-Type': 'application/json'
            },
            json=provider_data,
            timeout=10
        )
        
        print(f"\n[DEBUG] Response status: {response.status_code}")
        print(f"[DEBUG] Response body: {response.text[:500]}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            provider_id = result.get('provider', {}).get('id')
            print(f"  ✅ Provider created: {provider_id}")
            
            # Add services
            if provider_id and services:
                success = 0
                for service in services:
                    try:
                        svc_resp = requests.post(
                            f'{BACKEND_URL}/api/admin/providers/{provider_id}/services',
                            headers={
                                'Authorization': f'Bearer {ADMIN_TOKEN}',
                                'Content-Type': 'application/json'
                            },
                            json=service,
                            timeout=10
                        )
                        if svc_resp.status_code in [200, 201]:
                            success += 1
                    except Exception as e:
                        print(f"    ⚠️  Service error: {e}")
                
                print(f"  ✅ {success}/{len(services)} services added")
            
            return True
        else:
            print(f"  ❌ Failed to create provider")
            return False
            
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def main():
    print("="*60)
    print("🦷 NYC DENTAL AGENT - DEBUG VERSION")
    print("="*60)
    
    places = search_google_places()
    print(f"\nFound {len(places)} dental clinics\n")
    
    created = 0
    for place in places:
        place_id = place.get('place_id')
        details = get_place_details(place_id)
        
        if create_provider(place, details):
            created += 1
        
        time.sleep(2)  # Rate limiting
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {created}/{len(places)} providers")
    print("="*60)

if __name__ == "__main__":
    main()
