#!/usr/bin/env python3
"""
Enhanced NYC Provider Agent with Website Scraping & AI Service Generation
"""
import os
import sys
import json
import requests
import time
from dotenv import load_dotenv
import googlemaps
from bs4 import BeautifulSoup
from openai import OpenAI

load_dotenv()

# Configuration
API_BASE = os.getenv('API_BASE_URL')
API_EMAIL = os.getenv('API_ADMIN_EMAIL')
API_PASSWORD = os.getenv('API_ADMIN_PASSWORD')
GMAPS_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
OPENAI_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_KEY)

# NYC Borough locations
NYC_LOCATIONS = {
    'Manhattan': [
        {'name': 'Upper East Side', 'zip': '10021'},
        {'name': 'Midtown', 'zip': '10036'},
        {'name': 'Financial District', 'zip': '10004'},
        {'name': 'Greenwich Village', 'zip': '10014'},
        {'name': 'Harlem', 'zip': '10027'},
    ],
    'Brooklyn': [
        {'name': 'Williamsburg', 'zip': '11211'},
        {'name': 'Park Slope', 'zip': '11215'},
        {'name': 'Downtown Brooklyn', 'zip': '11201'},
        {'name': 'Bushwick', 'zip': '11237'},
    ],
    'Queens': [
        {'name': 'Astoria', 'zip': '11106'},
        {'name': 'Flushing', 'zip': '11354'},
        {'name': 'Long Island City', 'zip': '11101'},
    ],
    'Bronx': [
        {'name': 'Fordham', 'zip': '10458'},
        {'name': 'Riverdale', 'zip': '10471'},
    ],
    'Staten Island': [
        {'name': 'St. George', 'zip': '10301'},
    ]
}

PROVIDER_TYPES = {
    'medical': 'urgent care clinic',
    'dental': 'dental office',
    'cosmetic': 'cosmetic surgery',
    'fitness': 'personal trainer gym',
    'massage': 'massage therapy spa',
    'mental_health': 'therapist counselor',
    'skincare': 'skincare clinic esthetician'
}

class NYCProviderAgent:
    def __init__(self):
        # Authenticate
        response = requests.post(f'{API_BASE}/admin/login', json={
            'email': API_EMAIL,
            'password': API_PASSWORD
        })
        self.token = response.json()['token']
        self.headers = {'Authorization': f'Bearer {self.token}'}
        
        # Initialize Google Maps
        self.gmaps = googlemaps.Client(key=GMAPS_KEY)
        
    def scrape_website(self, url):
        """Scrape provider website"""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; FindrHealthBot/1.0)'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                text_content = soup.get_text(separator=' ', strip=True)
                return text_content[:3000]
            return None
        except Exception as e:
            print(f"    ⚠️  Scraping failed: {str(e)}")
            return None
    
    def extract_services_with_ai(self, website_content, provider_name, provider_type):
        """Use OpenAI to extract or generate services"""
        try:
            if website_content:
                prompt = f"""Based on this NYC provider's website, extract 5-8 services they offer.
For each service: name, description (1 sentence), price (realistic NYC pricing), duration (minutes).

Provider: {provider_name}
Type: {provider_type}
Website: {website_content}

Return ONLY valid JSON array:
[
  {{"name": "Service Name", "description": "Brief description", "price": 150, "duration": 60}},
]"""
            else:
                prompt = f"""Generate 5-8 realistic services for this NYC provider.
For each service: name, description (1 sentence), price (realistic NYC pricing), duration (minutes).

Provider: {provider_name}
Type: {provider_type}
Location: New York City

Return ONLY valid JSON array:
[
  {{"name": "Service Name", "description": "Brief description", "price": 150, "duration": 60}},
]"""
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a healthcare services expert. Return only valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            services_text = response.choices[0].message.content.strip()
            
            # Clean JSON
            if services_text.startswith('```'):
                services_text = services_text.split('```')[1]
                if services_text.startswith('json'):
                    services_text = services_text[4:]
            
            services = json.loads(services_text)
            return services
            
        except Exception as e:
            print(f"    ⚠️  AI failed: {str(e)}")
            return self.fallback_services(provider_type)
    
    def fallback_services(self, provider_type):
        """Fallback services"""
        templates = {
            'medical': [
                {"name": "Urgent Care Visit", "description": "Non-emergency treatment", "price": 150, "duration": 30},
                {"name": "Physical Exam", "description": "Health evaluation", "price": 200, "duration": 45},
                {"name": "Lab Work", "description": "Blood tests", "price": 75, "duration": 15},
            ],
            'dental': [
                {"name": "Dental Cleaning", "description": "Professional cleaning", "price": 150, "duration": 60},
                {"name": "Exam & X-rays", "description": "Dental exam", "price": 200, "duration": 45},
            ],
        }
        return templates.get(provider_type, templates['medical'])
    
    def find_providers(self, provider_type, location):
        """Find providers"""
        search_query = PROVIDER_TYPES.get(provider_type, 'medical clinic')
        query = f"{search_query} in {location['name']}, New York, NY {location['zip']}"
        
        print(f"  🔍 {location['name']} ({search_query})")
        
        try:
            places = self.gmaps.places(query=query)['results']
            return places
        except Exception as e:
            print(f"  ❌ Failed: {str(e)}")
            return []
    
    def create_provider(self, place, provider_type):
        """Create provider with services"""
        print(f"\n[Processing] {place['name']}")
        
        # Extract info
        address_parts = place.get('formatted_address', '').split(',')
        street = address_parts[0] if address_parts else ''
        zip_code = address_parts[-2].strip().split()[-1] if len(address_parts) >= 2 else '10001'
        website = place.get('website', '')
        
        # Scrape website
        website_content = None
        if website:
            print(f"  🌐 Scraping...")
            website_content = self.scrape_website(website)
            if website_content:
                print(f"  ✅ Scraped")
        
        # Generate services
        print(f"  🤖 AI generating services...")
        services = self.extract_services_with_ai(website_content, place['name'], provider_type)
        print(f"  ✅ {len(services)} services")
        
        # Create provider
        provider_data = {
            'practiceName': place['name'],
            'providerTypes': [provider_type.replace('_', ' ').title()],
            'streetAddress': street,
            'city': 'New York',
            'state': 'NY',
            'zipCode': zip_code,
            'phone': place.get('formatted_phone_number') or '(212) 555-0000',
            'email': f"contact@{place['name'].lower().replace(' ', '')[:30]}.com",
            'website': website,
            'status': 'approved',
            'source': 'agent',
        }
        
        response = requests.post(
            f'{API_BASE}/admin/providers',
            headers=self.headers,
            json=provider_data
        )
        
        if response.status_code == 201:
            provider_id = response.json()['provider']['id']
            print(f"  ✅ Provider created")
            self.add_services(provider_id, services)
            return True
        else:
            print(f"  ❌ Error: {response.text}")
            return False
    
    def add_services(self, provider_id, services):
        """Add services"""
        for service in services:
            service_data = {
                'serviceName': service['name'],
                'description': service.get('description', ''),
                'price': service.get('price', 100),
                'duration': service.get('duration', 60),
                'category': 'General',
                'isActive': True
            }
            
            response = requests.post(
                f'{API_BASE}/admin/providers/{provider_id}/services',
                headers=self.headers,
                json=service_data
            )
            
            if response.status_code == 201:
                print(f"    ✅ {service['name']}")

def main():
    """Pilot run"""
    agent = NYCProviderAgent()
    
    print("=" * 60)
    print("🗽 NYC PROVIDER AGENT - PILOT (5 Providers)")
    print("=" * 60)
    
    providers_created = 0
    target = 5
    
    for location in NYC_LOCATIONS['Manhattan'][:2]:
        if providers_created >= target:
            break
            
        print(f"\n📍 {location['name']}, Manhattan")
        places = agent.find_providers('medical', location)[:3]
        
        for place in places:
            if providers_created >= target:
                break
                
            success = agent.create_provider(place, 'medical')
            if success:
                providers_created += 1
                time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"✅ COMPLETE: {providers_created}/{target} providers")
    print("=" * 60)

if __name__ == "__main__":
    main()
