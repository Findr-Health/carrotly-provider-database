const axios = require('axios');

const API_BASE = 'https://fearless-achievement-production.up.railway.app/api';

async function testAuthFlow() {
  console.log('🔍 Testing Admin Dashboard Authentication Flow\n');
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/admin/login`, {
      email: 'admin@carrotly.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Full token length:', token.length);
    console.log('Admin user:', loginResponse.data.admin.email);
    console.log();
    
    // Step 2: Test providers endpoint with token
    console.log('Step 2: Fetching providers with token...');
    const providersResponse = await axios.get(`${API_BASE}/admin/providers?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Providers fetch successful');
    console.log('Response structure:', Object.keys(providersResponse.data));
    console.log('Total providers:', providersResponse.data.providers.length);
    console.log();
    
    // Step 3: List provider names
    console.log('Step 3: Provider names:');
    providersResponse.data.providers.forEach((p, i) => {
      console.log(`${i + 1}. ${p.practice_name} (${p.city}, ${p.state}) - ${p.status}`);
    });
    console.log();
    
    // Step 4: Check WellNow specifically
    const wellnow = providersResponse.data.providers.find(p => 
      p.practice_name.toLowerCase().includes('wellnow')
    );
    
    if (wellnow) {
      console.log('✅ WellNow found!');
      console.log('ID:', wellnow._id);
      console.log('Name:', wellnow.practice_name);
      console.log('Location:', `${wellnow.city}, ${wellnow.state}`);
      console.log('Status:', wellnow.status);
      
      // Test fetching WellNow details
      console.log('\nStep 5: Fetching WellNow details...');
      const detailResponse = await axios.get(`${API_BASE}/admin/providers/${wellnow._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Detail fetch successful');
      console.log('Services count:', detailResponse.data.services.length);
    } else {
      console.log('❌ WellNow NOT found in provider list!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAuthFlow();
