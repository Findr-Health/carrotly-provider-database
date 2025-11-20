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

SEARCHES = [
    {"query": "dental clinic Upper East Side Manhattan", "type": "Dental"},
    {"query": "cosmetic dentistry Midtown Manhattan", "type": "Dental"},
    {"query": "dental office SoHo Manhattan", "type": "Dental"},
    {"query": "cosmetic surgery Upper East Side Manhattan", "type": "Cosmetic"},
    {"query": "medical spa Midtown Manhattan", "type": "Cosmetic"},
    {"query": "dermatology clinic Chelsea Manhattan", "type": "Cosmetic"},
]

def parse_address(formatted_address):
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

def search_google_places(query):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {'query': query, 'key': GOOGLE_API_KEY}
    response = requests.get(url, params=params)
    return response.json().get('results', [])[:3]

def get_place_details(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types',
        'key': GOOGLE_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json().get('result', {})

def generate_services(provider_name, provider_type):
    """Generate services with EXPLICIT pricing"""
    
    if provider_type == "Dental":
        prompt = f"""Generate 6 realistic dental services for {provider_name} in NYC.

CRITICAL: Each service MUST have a realistic price in dollars.

Return ONLY this exact JSON format:
[
  {{
    "serviceName": "Dental Cleaning",
    "description": "Professional teeth cleaning and exam",
    "duration": 60,
    "price": 175,
    "category": "Preventive"
  }},
  {{
    "serviceName": "Teeth Whitening",
    "description": "Professional in-office whitening treatment",
    "duration": 90,
    "price": 550,
    "category": "Cosmetic"
  }}
]

NYC Dental Pricing Guide:
- Cleaning: $150-200
- Exam & X-rays: $100-150
- Teeth Whitening: $400-600
- Filling: $200-350
- Crown: $1200-1500
- Root Canal: $1000-1200"""

    else:  # Cosmetic
        prompt = f"""Generate 6 realistic cosmetic/aesthetic services for {provider_name} in NYC.

CRITICAL: Each service MUST have a realistic price in dollars.

Return ONLY this exact JSON format:
[
  {{
    "serviceName": "Botox Treatment",
    "description": "Wrinkle reduction injection treatment",
    "duration": 30,
    "price": 550,
    "category": "Injectables"
  }},
  {{
    "serviceName": "Dermal Fillers",
    "description": "Volume restoration with hyaluronic acid fillers",
    "duration": 45,
    "price": 750,
    "category": "Injectables"
  }}
]

NYC Cosmetic Pricing Guide:
- Botox: $400-650 per area
- Fillers: $650-950 per syringe
- Chemical Peel: $300-500
- Laser Treatment: $400-700
- Facial: $200-400
- Consultation: $150-250"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1200
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
            
        services = json.loads(content)
        
        # VALIDATE: Ensure all services have required fields including price
        validated = []
        for svc in services:
            if all(k in svc for k in ['serviceName', 'description', 'duration', 'price', 'category']):
                # Ensure price is a number
                if isinstance(svc['price'], (int, float)) and svc['price'] > 0:
                    validated.append(svc)
                else:
                    print(f"    ⚠️  Invalid price for {svc.get('serviceName')}: {svc.get('price')}")
            else:
                print(f"    ⚠️  Missing fields in service: {svc}")
        
        return validated
        
    except Exception as e:
        print(f"    ⚠️  AI error: {e}")
        return []

def create_provider(place_data, details, provider_type):
    name = place_data.get('name', 'Unknown')[:255]
    formatted_address = details.get('formatted_address', '')
    street, city, state, zip_code = parse_address(formatted_address)
    
    email_name = re.sub(r'[^a-z0-9]', '', name.lower())[:30]
    email = f"{email_name}@example.com"
    
    print(f"  🤖 Generating services...")
    services = generate_services(name, provider_type)
    
    if not services:
        print(f"  ❌ No services generated")
        return False
    
    # Show pricing info
    prices = [f"${svc['price']}" for svc in services]
    print(f"  ✅ {len(services)} services with prices: {', '.join(prices)}")
    
    provider_data = {
        'practiceName': name,
        'email': email,
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
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            provider_id = response.json().get('provider', {}).get('id')
            
            if provider_id and services:
                success = 0
                failed = []
                
                for service in services:
                    try:
                        svc_resp = requests.post(
                            f'{BACKEND_URL}/api/admin/providers/{provider_id}/services',
                            headers={'Authorization': f'Bearer {ADMIN_TOKEN}', 'Content-Type': 'application/json'},
                            json=service,
                            timeout=10
                        )
                        
                        if svc_resp.status_code in [200, 201]:
                            success += 1
                        else:
                            failed.append(f"{service['serviceName']} ({svc_resp.status_code})")
                    except Exception as e:
                        failed.append(f"{service['serviceName']} (error)")
                
                if failed:
                    print(f"  ⚠️  {success}/{len(services)} services added. Failed: {', '.join(failed)}")
                else:
                    print(f"  ✅ Provider created with {success}/{len(services)} services")
                
                return success > 0
        
        print(f"  ❌ Failed: {response.text[:100]}")
        return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("="*60)
    print("🗽 NYC PROVIDERS - DENTAL & COSMETIC (with prices)")
    print("="*60)
    
    created = 0
    total = 0
    
    for search in SEARCHES:
        print(f"\n🔍 {search['query']}")
        places = search_google_places(search['query'])
        
        for place in places:
            total += 1
            name = place.get('name')
            place_id = place.get('place_id')
            
            print(f"\n[Processing] {name}")
            details = get_place_details(place_id)
            
            if create_provider(place, details, search['type']):
                created += 1
            
            time.sleep(1)
    
    print("\n" + "="*60)
    print(f"✅ COMPLETE: {created}/{total} providers with priced services")
    print("="*60)

if __name__ == "__main__":
    main()
