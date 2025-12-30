/**
 * Geocode Providers Script
 * Adds lat/lng coordinates to providers using OpenStreetMap Nominatim API
 * 
 * Usage: node geocode-providers.js
 */

const API_BASE = 'https://fearless-achievement-production.up.railway.app/api';

// Get admin token first
async function getAdminToken() {
  const response = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@findrhealth.com',
      password: 'admin123'
    })
  });
  const data = await response.json();
  return data.token;
}

// Geocode an address using OpenStreetMap Nominatim
async function geocodeAddress(address) {
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FindrHealth-Geocoder/1.0'  // Required by Nominatim
    }
  });
  
  const results = await response.json();
  
  if (results && results.length > 0) {
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name
    };
  }
  return null;
}

// Get all providers
async function getProviders(token) {
  const response = await fetch(`${API_BASE}/admin/providers?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.providers || data;
}

// Update provider coordinates
async function updateProviderCoordinates(token, providerId, lat, lng) {
  const response = await fetch(`${API_BASE}/admin/providers/${providerId}/coordinates`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ latitude: lat, longitude: lng })
  });
  return response.json();
}

// Build address string from provider
function buildAddressString(provider) {
  const parts = [];
  if (provider.address?.street) parts.push(provider.address.street);
  if (provider.address?.city) parts.push(provider.address.city);
  if (provider.address?.state) parts.push(provider.address.state);
  if (provider.address?.zip) parts.push(provider.address.zip);
  return parts.join(', ');
}

// Check if provider has valid coordinates
function hasCoordinates(provider) {
  return provider.location?.coordinates?.length === 2 &&
         provider.location.coordinates[0] !== 0 &&
         provider.location.coordinates[1] !== 0;
}

// Main function
async function main() {
  console.log('🚀 Starting provider geocoding...\n');
  
  // Get admin token
  console.log('🔐 Logging in...');
  const token = await getAdminToken();
  console.log('✅ Logged in\n');
  
  // Get all providers
  console.log('📋 Fetching providers...');
  const providers = await getProviders(token);
  console.log(`✅ Found ${providers.length} providers\n`);
  
  // Filter providers without coordinates
  const needsGeocode = providers.filter(p => !hasCoordinates(p));
  console.log(`📍 ${needsGeocode.length} providers need geocoding\n`);
  
  if (needsGeocode.length === 0) {
    console.log('✅ All providers already have coordinates!');
    return;
  }
  
  // Geocode each provider
  let success = 0;
  let failed = 0;
  
  for (const provider of needsGeocode) {
    const address = buildAddressString(provider);
    
    if (!address || address.length < 5) {
      console.log(`⚠️  ${provider.practiceName}: No address to geocode`);
      failed++;
      continue;
    }
    
    console.log(`🔍 ${provider.practiceName}`);
    console.log(`   Address: ${address}`);
    
    try {
      // Nominatim rate limit: 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const coords = await geocodeAddress(address);
      
      if (coords) {
        console.log(`   Found: ${coords.lat}, ${coords.lng}`);
        
        // Update provider
        await updateProviderCoordinates(token, provider._id, coords.lat, coords.lng);
        console.log(`   ✅ Updated!\n`);
        success++;
      } else {
        console.log(`   ❌ No results found\n`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n========== SUMMARY ==========');
  console.log(`✅ Successfully geocoded: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total processed: ${needsGeocode.length}`);
}

main().catch(console.error);
