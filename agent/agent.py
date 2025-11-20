#!/usr/bin/env python3
"""
========================================
CARROTLY PROVIDER AI AGENT
Portable provider discovery and data enrichment
========================================

This agent is designed to be PORTABLE and work with any backend
that implements the standard REST API endpoints.

Features:
- Google Maps provider discovery
- Website scraping with AI extraction
- Intelligent duplicate detection
- Quality scoring and validation
- Standalone operation (communicates only via REST API)
"""

import os
import sys
import json
import time
import requests
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv
import googlemaps
from openai import OpenAI
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Load environment variables
load_dotenv()

# ========================================
# CONFIGURATION
# ========================================

class Config:
    # API Configuration
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
    API_ADMIN_EMAIL = os.getenv('API_ADMIN_EMAIL')
    API_ADMIN_PASSWORD = os.getenv('API_ADMIN_PASSWORD')
    
    # Google Maps
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    
    # OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
    
    # Agent Settings
    MAX_PROFILES_PER_RUN = int(os.getenv('AGENT_MAX_PROFILES_PER_RUN', 25))
    MIN_CONFIDENCE_SCORE = int(os.getenv('AGENT_MIN_CONFIDENCE_SCORE', 70))
    
    # Duplicate Thresholds
    DUPLICATE_THRESHOLD_HIGH = int(os.getenv('AGENT_DUPLICATE_THRESHOLD_HIGH', 85))
    DUPLICATE_THRESHOLD_MEDIUM = int(os.getenv('AGENT_DUPLICATE_THRESHOLD_MEDIUM', 70))
    
    # Scraping
    SCRAPER_TIMEOUT = int(os.getenv('SCRAPER_TIMEOUT_SECONDS', 30))
    SCRAPER_RATE_LIMIT = int(os.getenv('SCRAPER_RATE_LIMIT_SECONDS', 2))
    
    # Export
    EXPORT_DIRECTORY = os.getenv('EXPORT_DIRECTORY', './exports')


# ========================================
# API CLIENT (Portable - works with any REST API)
# ========================================

class APIClient:
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.authenticate(email, password)
    
    def authenticate(self, email: str, password: str):
        """Login and get JWT token"""
        response = requests.post(
            f"{self.base_url}/admin/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        self.token = response.json()['token']
        print(f"✅ Authenticated as {email}")
    
    def _headers(self) -> Dict:
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def check_duplicate(self, name: str, address: str, zip_code: str, phone: Optional[str] = None) -> Dict:
        """Check if provider already exists in database"""
        response = requests.get(
            f"{self.base_url}/admin/providers",
            headers=self._headers(),
            params={
                'search': name,
                'zip': zip_code
            }
        )
        response.raise_for_status()
        
        providers = response.json()['providers']
        
        # Simple client-side duplicate checking
        # (In production, this would use the SQL function)
        for provider in providers:
            if (provider['practice_name'].lower() == name.lower() and 
                provider['zip_code'] == zip_code):
                return {
                    'is_duplicate': True,
                    'match_type': 'exact',
                    'confidence': 100,
                    'existing_provider': provider
                }
            
            # Fuzzy match logic would go here
            # For MVP, just check exact matches
        
        return {
            'is_duplicate': False,
            'match_type': 'none',
            'confidence': 0
        }
    
    def create_provider(self, provider_data: Dict) -> Dict:
        """Create a new provider profile"""
        response = requests.post(
            f"{self.base_url}/admin/providers",
            headers=self._headers(),
            json=provider_data
        )
        response.raise_for_status()
        return response.json()['provider']
    
    def create_agent_run(self, search_params: Dict) -> str:
        """Create agent run record and get run ID"""
        response = requests.post(
            f"{self.base_url}/admin/agent/run",
            headers=self._headers(),
            json=search_params
        )
        response.raise_for_status()
        return response.json()['runId']
    
    def update_agent_run(self, run_id: str, updates: Dict):
        """Update agent run status"""
        # Note: This endpoint would need to be added to the API
        # For now, we'll skip this in MVP
        pass


# ========================================
# GOOGLE MAPS DISCOVERY
# ========================================

class GoogleMapsDiscovery:
    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)
    
    def find_providers(self, location: str, provider_type: str, max_results: int = 50) -> List[Dict]:
        """
        Find providers using Google Maps Places API
        
        Args:
            location: City, State or ZIP code
            provider_type: 'medical', 'dental', 'cosmetic', etc.
            max_results: Maximum number of results
        
        Returns:
            List of provider dictionaries with basic info
        """
        print(f"🔍 Searching Google Maps for {provider_type} providers in {location}...")
        
        # Map provider types to Google Places search queries
        query_map = {
            'medical': ['doctor', 'medical clinic', 'primary care', 'family medicine'],
            'dental': ['dentist', 'dental clinic', 'orthodontist'],
            'cosmetic': ['medical spa', 'cosmetic surgery', 'aesthetic clinic'],
            'fitness': ['personal trainer', 'gym', 'fitness center'],
            'massage': ['massage therapy', 'spa', 'massage clinic'],
            'mental_health': ['therapist', 'psychologist', 'counseling'],
            'skincare': ['dermatology', 'skin clinic', 'esthetician']
        }
        
        queries = query_map.get(provider_type, [provider_type])
        providers = []
        seen_place_ids = set()
        
        for query in queries:
            search_query = f"{query} in {location}"
            
            try:
                # Text search
                results = self.client.places(query=search_query)
                
                for place in results.get('results', [])[:max_results]:
                    place_id = place['place_id']
                    
                    if place_id in seen_place_ids:
                        continue
                    seen_place_ids.add(place_id)
                    
                    # Get detailed place info
                    details = self.client.place(place_id)['result']
                    
                    provider = self._extract_provider_data(details, provider_type)
                    if provider:
                        providers.append(provider)
                    
                    if len(providers) >= max_results:
                        break
                
            except Exception as e:
                print(f"⚠️  Error searching for {query}: {e}")
                continue
            
            if len(providers) >= max_results:
                break
        
        print(f"✅ Found {len(providers)} providers from Google Maps")
        return providers
    
    def _extract_provider_data(self, place_details: Dict, provider_type: str) -> Optional[Dict]:
        """Extract relevant data from Google Places API response"""
        try:
            address_components = place_details.get('address_components', [])
            
            # Parse address
            street_number = ''
            street_name = ''
            city = ''
            state = ''
            zip_code = ''
            
            for component in address_components:
                types = component['types']
                if 'street_number' in types:
                    street_number = component['long_name']
                elif 'route' in types:
                    street_name = component['long_name']
                elif 'locality' in types:
                    city = component['long_name']
                elif 'administrative_area_level_1' in types:
                    state = component['short_name']
                elif 'postal_code' in types:
                    zip_code = component['long_name']
            
            street_address = f"{street_number} {street_name}".strip()
            
            if not all([street_address, city, state, zip_code]):
                return None
            
            provider = {
                'practice_name': place_details['name'],
                'phone': place_details.get('formatted_phone_number', '').replace(' ', ''),
                'street_address': street_address,
                'city': city,
                'state': state,
                'zip_code': zip_code,
                'website': place_details.get('website'),
                'latitude': place_details['geometry']['location']['lat'],
                'longitude': place_details['geometry']['location']['lng'],
                'google_rating': place_details.get('rating'),
                'google_reviews_count': place_details.get('user_ratings_total'),
                'google_place_id': place_details['place_id'],
                'provider_type': provider_type,
                'source': 'google_maps'
            }
            
            return provider
            
        except Exception as e:
            print(f"⚠️  Error extracting provider data: {e}")
            return None


# ========================================
# WEB SCRAPER & DATA ENRICHMENT
# ========================================

class ProviderEnricher:
    def __init__(self, openai_api_key: str):
        self.openai_client = OpenAI(api_key=openai_api_key)
        self.driver = None
    
    def _init_browser(self):
        """Initialize headless Chrome browser"""
        if self.driver:
            return
        
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument(f'user-agent={Config.SCRAPER_USER_AGENT}')
        
        self.driver = webdriver.Chrome(options=options)
    
    def enrich_provider(self, provider: Dict) -> Dict:
        """
        Enrich provider data by scraping their website
        Uses AI to extract services, pricing, and other info
        """
        if not provider.get('website'):
            provider['confidence_score'] = 60  # Low confidence without website
            return provider
        
        print(f"🌐 Enriching: {provider['practice_name']}...")
        
        try:
            # Scrape website
            html_content = self._scrape_website(provider['website'])
            
            if not html_content:
                provider['confidence_score'] = 65
                return provider
            
            # Extract data with AI
            extracted_data = self._extract_with_ai(html_content, provider)
            
            # Merge extracted data
            provider.update(extracted_data)
            
            # Calculate confidence score
            provider['confidence_score'] = self._calculate_confidence(provider)
            
            print(f"✅ Enriched with confidence: {provider['confidence_score']}%")
            
        except Exception as e:
            print(f"⚠️  Error enriching {provider['practice_name']}: {e}")
            provider['confidence_score'] = 70
        
        return provider
    
    def _scrape_website(self, url: str) -> Optional[str]:
        """Scrape website HTML content"""
        try:
            self._init_browser()
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, Config.SCRAPER_TIMEOUT).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            time.sleep(2)  # Let JavaScript render
            
            html_content = self.driver.page_source
            return html_content
            
        except Exception as e:
            print(f"⚠️  Scraping failed for {url}: {e}")
            return None
    
    def _extract_with_ai(self, html: str, provider: Dict) -> Dict:
        """Use GPT-4 to extract structured data from HTML"""
        # Clean HTML
        soup = BeautifulSoup(html, 'html.parser')
        text_content = soup.get_text(separator='\n', strip=True)
        
        # Truncate to fit in context (roughly 4000 tokens)
        text_content = text_content[:15000]
        
        prompt = f"""
Extract information about this healthcare provider from their website content.

Provider Name: {provider['practice_name']}
Location: {provider['city']}, {provider['state']}

Website Content:
{text_content}

Please extract and return ONLY valid JSON with this exact structure:
{{
  "services": [
    {{"name": "Service Name", "category": "preventive|acute|cosmetic|etc", "duration_minutes": 30, "price_cents": 15000}}
  ],
  "bio": "Brief practice description",
  "specialties": ["specialty1", "specialty2"],
  "insurance_accepted": ["insurance1", "insurance2"],
  "years_experience": 10
}}

Rules:
- Only include information explicitly stated on the website
- Price should be in cents (e.g., $150 = 15000)
- If something is not found, omit that field
- Return valid JSON only, no other text
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            extracted_text = response.choices[0].message.content
            
            # Parse JSON
            extracted_data = json.loads(extracted_text)
            
            return extracted_data
            
        except Exception as e:
            print(f"⚠️  AI extraction failed: {e}")
            return {}
    
    def _calculate_confidence(self, provider: Dict) -> int:
        """Calculate data quality confidence score (0-100)"""
        score = 50  # Base score
        
        # Required fields present
        if all([provider.get('practice_name'), provider.get('phone'), 
                provider.get('street_address'), provider.get('city'), 
                provider.get('state'), provider.get('zip_code')]):
            score += 20
        
        # Has website
        if provider.get('website'):
            score += 10
        
        # Has services
        services = provider.get('services', [])
        if len(services) >= 3:
            score += 10
        elif len(services) >= 1:
            score += 5
        
        # Has bio/description
        if provider.get('bio'):
            score += 5
        
        # Has specialties
        if provider.get('specialties'):
            score += 5
        
        return min(score, 100)
    
    def close(self):
        """Close browser"""
        if self.driver:
            self.driver.quit()


# ========================================
# MAIN AGENT ORCHESTRATOR
# ========================================

class ProviderAgent:
    def __init__(self):
        self.api_client = APIClient(
            Config.API_BASE_URL,
            Config.API_ADMIN_EMAIL,
            Config.API_ADMIN_PASSWORD
        )
        self.maps_discovery = GoogleMapsDiscovery(Config.GOOGLE_MAPS_API_KEY)
        self.enricher = None
        
        self.results = {
            'providers_found': 0,
            'exact_duplicates': [],
            'fuzzy_duplicates': [],
            'flagged_for_review': [],
            'profiles_created': [],
            'errors': []
        }
    
    def run(self, city: str, state: str, provider_type: str, max_profiles: int = None):
        """
        Main agent execution
        
        Args:
            city: City name
            state: State abbreviation (e.g., 'MT')
            provider_type: 'medical', 'dental', etc.
            max_profiles: Maximum profiles to create (default from config)
        """
        max_profiles = max_profiles or Config.MAX_PROFILES_PER_RUN
        location = f"{city}, {state}"
        
        print(f"\n{'='*60}")
        print(f"🤖 CARROTLY PROVIDER AI AGENT")
        print(f"{'='*60}")
        print(f"📍 Location: {location}")
        print(f"🏥 Category: {provider_type}")
        print(f"🎯 Max Profiles: {max_profiles}")
        print(f"{'='*60}\n")
        
        start_time = time.time()
        
        try:
            # Step 1: Discover providers via Google Maps
            providers = self.maps_discovery.find_providers(location, provider_type, max_profiles * 2)
            self.results['providers_found'] = len(providers)
            
            # Step 2: Check for duplicates and enrich data
            for i, provider in enumerate(providers[:max_profiles], 1):
                print(f"\n[{i}/{min(len(providers), max_profiles)}] Processing: {provider['practice_name']}")
                
                # Check duplicate
                duplicate_check = self.api_client.check_duplicate(
                    provider['practice_name'],
                    provider['street_address'],
                    provider['zip_code'],
                    provider.get('phone')
                )
                
                if duplicate_check['is_duplicate']:
                    if duplicate_check['match_type'] == 'exact':
                        print(f"⏭️  Skipped: Exact duplicate found")
                        self.results['exact_duplicates'].append({
                            'name': provider['practice_name'],
                            'reason': 'Exact match in database'
                        })
                        continue
                    else:
                        print(f"⚠️  Possible duplicate (flagged for review)")
                        self.results['flagged_for_review'].append({
                            'name': provider['practice_name'],
                            'match_type': duplicate_check['match_type'],
                            'confidence': duplicate_check['confidence']
                        })
                
                # Enrich data
                  if self.enricher:
                   if self.enricher:
                    try:
                    enriched_provider = self.enricher.enrich_provider(provider)
                    except AttributeError:
                        enriched_provider = provider
                else:
                    enriched_provider = provider
                  else:
                   enriched_provider = provider  # Use basic Google Maps data
                
                # Check confidence threshold
                if enriched_provider['confidence_score'] < Config.MIN_CONFIDENCE_SCORE:
                    print(f"⚠️  Low confidence ({enriched_provider['confidence_score']}%), flagged for review")
                    enriched_provider['needs_review'] = True
                
                # Create provider profile
                try:
                    provider_data = self._format_for_api(enriched_provider, provider_type)
                    created_provider = self.api_client.create_provider(provider_data)
                    
                    self.results['profiles_created'].append({
                        'id': created_provider['id'],
                        'name': created_provider['practice_name'],
                        'confidence': enriched_provider['confidence_score']
                    })
                    
                    print(f"✅ Created profile ID: {created_provider['id']}")
                    
                except Exception as e:
                    print(f"❌ Failed to create profile: {e}")
                    self.results['errors'].append({
                        'provider': provider['practice_name'],
                        'error': str(e)
                    })
                
                # Rate limiting
                time.sleep(Config.SCRAPER_RATE_LIMIT)
            
            # Step 3: Summary
            duration = time.time() - start_time
            self._print_summary(duration)
            
            # Step 4: Export results
            self._export_results(city, state, provider_type)
            
        finally:
         if self.enricher:            
             if self.enricher:
            if self.enricher:
            self.enricher.close()
    
    def _format_for_api(self, provider: Dict, provider_type: str) -> Dict:
        """Format enriched provider data for API"""
        return {
            'practiceName': provider['practice_name'],
            'email': provider.get('email', f"contact@{provider['practice_name'].lower().replace(' ', '')}.com"),
            'phone': provider['phone'],
            'providerTypes': [provider_type],
            'streetAddress': provider['street_address'],
            'city': provider['city'],
            'state': provider['state'],
            'zipCode': provider['zip_code'],
            'website': provider.get('website'),
            'status': 'draft',
            'source': 'agent'
        }
    
    def _print_summary(self, duration: float):
        """Print execution summary"""
        print(f"\n{'='*60}")
        print(f"📊 AGENT RUN SUMMARY")
        print(f"{'='*60}")
        print(f"⏱️  Duration: {duration:.1f} seconds")
        print(f"🔍 Providers Found: {self.results['providers_found']}")
        print(f"⏭️  Exact Duplicates Skipped: {len(self.results['exact_duplicates'])}")
        print(f"⚠️  Flagged for Review: {len(self.results['flagged_for_review'])}")
        print(f"✅ New Profiles Created: {len(self.results['profiles_created'])}")
        print(f"❌ Errors: {len(self.results['errors'])}")
        print(f"{'='*60}\n")
    
    def _export_results(self, city: str, state: str, provider_type: str):
        """Export results to JSON file for portability"""
        os.makedirs(Config.EXPORT_DIRECTORY, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"agent_run_{city}_{state}_{provider_type}_{timestamp}.json"
        filepath = os.path.join(Config.EXPORT_DIRECTORY, filename)
        
        export_data = {
            'timestamp': datetime.now().isoformat(),
            'search_parameters': {
                'city': city,
                'state': state,
                'provider_type': provider_type
            },
            'results': self.results
        }
        
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"📁 Results exported to: {filepath}")


# ========================================
# CLI INTERFACE
# ========================================

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Carrotly Provider AI Agent')
    parser.add_argument('--city', required=True, help='City name (e.g., "Bozeman")')
    parser.add_argument('--state', required=True, help='State abbreviation (e.g., "MT")')
    parser.add_argument('--type', required=True, 
                       choices=['medical', 'dental', 'cosmetic', 'fitness', 'massage', 'mental_health', 'skincare'],
                       help='Provider type')
    parser.add_argument('--max', type=int, default=None, help='Maximum profiles to create')
    
    args = parser.parse_args()
    
    # Validate configuration
    if not Config.API_ADMIN_EMAIL or not Config.API_ADMIN_PASSWORD:
        print("❌ Error: API credentials not configured. Check your .env file.")
        sys.exit(1)
    
    if not Config.GOOGLE_MAPS_API_KEY:
        print("❌ Error: Google Maps API key not configured. Check your .env file.")
        sys.exit(1)
    
    if not Config.OPENAI_API_KEY:
        print("❌ Error: OpenAI API key not configured. Check your .env file.")
        sys.exit(1)
    
    # Run agent
    agent = ProviderAgent()
    agent.run(args.city, args.state, args.type, args.max)


if __name__ == '__main__':
    main()
