const providers = [
  // Manhattan - Medical
  {
    practiceName: "Union Square Family Medicine",
    name: "Union Square Family Medicine",
    providerTypes: ["Medical"],
    contactInfo: { email: "contact@unionmedical.com", phone: "(212) 555-0101" },
    address: { street: "45 E 14th St", suite: "Suite 300", city: "New York", state: "NY", zip: "10003" },
    location: { type: "Point", coordinates: [-73.9903, 40.7348] },
    services: [
      { name: "Primary Care Visit", category: "Medical", price: 135, duration: 30 },
      { name: "Annual Physical", category: "Preventive", price: 175, duration: 45 }
    ]
  },
  
  // Brooklyn - Dental
  {
    practiceName: "Brooklyn Heights Dental Care",
    name: "Brooklyn Heights Dental Care",
    providerTypes: ["Dental"],
    contactInfo: { email: "smile@brooklyndental.com", phone: "(718) 555-0202" },
    address: { street: "185 Montague St", city: "Brooklyn", state: "NY", zip: "11201" },
    location: { type: "Point", coordinates: [-73.9936, 40.6950] },
    services: [
      { name: "Dental Cleaning", category: "Preventive", price: 105, duration: 60 },
      { name: "Dental Exam", category: "Preventive", price: 85, duration: 30 },
      { name: "Teeth Whitening", category: "Cosmetic", price: 325, duration: 90 }
    ]
  },
  
  // Manhattan - Mental Health
  {
    practiceName: "Chelsea Counseling Group",
    name: "Chelsea Counseling Group",
    providerTypes: ["Mental Health"],
    contactInfo: { email: "info@chelseacounseling.com", phone: "(212) 555-0303" },
    address: { street: "242 W 27th St", suite: "4th Floor", city: "New York", state: "NY", zip: "10001" },
    location: { type: "Point", coordinates: [-73.9950, 40.7480] },
    services: [
      { name: "Therapy Session", category: "Mental Health", price: 150, duration: 50 },
      { name: "Initial Consultation", category: "Mental Health", price: 175, duration: 60 }
    ]
  },
  
  // Queens - Massage
  {
    practiceName: "Astoria Wellness & Massage",
    name: "Astoria Wellness & Massage",
    providerTypes: ["Massage"],
    contactInfo: { email: "relax@astoriamassage.com", phone: "(718) 555-0404" },
    address: { street: "31-12 Steinway St", city: "Queens", state: "NY", zip: "11103" },
    location: { type: "Point", coordinates: [-73.9200, 40.7620] },
    services: [
      { name: "Swedish Massage", category: "Relaxation", price: 95, duration: 60 },
      { name: "Deep Tissue Massage", category: "Therapeutic", price: 110, duration: 60 },
      { name: "Hot Stone Massage", category: "Relaxation", price: 125, duration: 75 }
    ]
  },
  
  // Bronx - Urgent Care
  {
    practiceName: "Riverdale Urgent Care Center",
    name: "Riverdale Urgent Care Center",
    providerTypes: ["Medical", "Urgent Care"],
    contactInfo: { email: "care@riverdaleurgent.com", phone: "(718) 555-0505" },
    address: { street: "3765 Riverdale Ave", city: "Bronx", state: "NY", zip: "10463" },
    location: { type: "Point", coordinates: [-73.9052, 40.8848] },
    services: [
      { name: "Urgent Care Visit", category: "Urgent", price: 165, duration: 30 },
      { name: "X-Ray", category: "Diagnostic", price: 225, duration: 20 }
    ]
  },
  
  // Manhattan - Dermatology
  {
    practiceName: "SoHo Skin & Laser Center",
    name: "SoHo Skin & Laser Center",
    providerTypes: ["Skincare"],
    contactInfo: { email: "glow@sohoskin.com", phone: "(212) 555-0606" },
    address: { street: "110 Greene St", suite: "Suite 500", city: "New York", state: "NY", zip: "10012" },
    location: { type: "Point", coordinates: [-74.0030, 40.7240] },
    services: [
      { name: "Skin Consultation", category: "Dermatology", price: 195, duration: 30 },
      { name: "Acne Treatment", category: "Medical", price: 145, duration: 20 }
    ]
  },
  
  // Manhattan - Fitness
  {
    practiceName: "Midtown Fitness & Training",
    name: "Midtown Fitness & Training",
    providerTypes: ["Fitness"],
    contactInfo: { email: "fit@midtowntraining.com", phone: "(212) 555-0707" },
    address: { street: "350 5th Ave", suite: "Suite 2510", city: "New York", state: "NY", zip: "10118" },
    location: { type: "Point", coordinates: [-73.9850, 40.7484] },
    services: [
      { name: "Personal Training Session", category: "Fitness", price: 85, duration: 60 },
      { name: "Nutrition Consultation", category: "Nutrition", price: 125, duration: 45 }
    ]
  },
  
  // Brooklyn - Chiropractic
  {
    practiceName: "Park Slope Chiropractic",
    name: "Park Slope Chiropractic",
    providerTypes: ["Medical"],
    contactInfo: { email: "adjust@parkslopechiro.com", phone: "(718) 555-0808" },
    address: { street: "285 Prospect Park West", city: "Brooklyn", state: "NY", zip: "11215" },
    location: { type: "Point", coordinates: [-73.9800, 40.6650] },
    services: [
      { name: "Chiropractic Adjustment", category: "Chiropractic", price: 75, duration: 30 },
      { name: "Initial Consultation", category: "Chiropractic", price: 95, duration: 45 }
    ]
  },
  
  // Manhattan - Dental (Uptown)
  {
    practiceName: "Upper East Side Dental Studio",
    name: "Upper East Side Dental Studio",
    providerTypes: ["Dental"],
    contactInfo: { email: "care@uesdental.com", phone: "(212) 555-0909" },
    address: { street: "1040 Park Ave", suite: "1B", city: "New York", state: "NY", zip: "10028" },
    location: { type: "Point", coordinates: [-73.9580, 40.7820] },
    services: [
      { name: "Dental Cleaning", category: "Preventive", price: 115, duration: 60 },
      { name: "Dental Exam", category: "Preventive", price: 90, duration: 30 },
      { name: "Filling", category: "Restorative", price: 195, duration: 45 }
    ]
  },
  
  // Queens - Physical Therapy
  {
    practiceName: "Long Island City Physical Therapy",
    name: "Long Island City Physical Therapy",
    providerTypes: ["Medical"],
    contactInfo: { email: "recovery@licpt.com", phone: "(718) 555-1010" },
    address: { street: "47-10 Vernon Blvd", city: "Queens", state: "NY", zip: "11101" },
    location: { type: "Point", coordinates: [-73.9560, 40.7450] },
    services: [
      { name: "Physical Therapy Session", category: "Rehabilitation", price: 125, duration: 60 },
      { name: "Initial Evaluation", category: "Assessment", price: 175, duration: 75 }
    ]
  }
];

async function createProviders() {
  console.log('Creating NYC test providers...\n');
  
  for (const p of providers) {
    const providerData = {
      ...p,
      status: 'approved',
      isVerified: true,
      onboardingCompleted: true,
      onboardingStep: 10,
      calendar: {
        provider: 'manual',
        businessHours: {
          monday: { enabled: true, start: "09:00", end: "18:00" },
          tuesday: { enabled: true, start: "09:00", end: "18:00" },
          wednesday: { enabled: true, start: "09:00", end: "18:00" },
          thursday: { enabled: true, start: "09:00", end: "18:00" },
          friday: { enabled: true, start: "09:00", end: "17:00" },
          saturday: { enabled: true, start: "10:00", end: "14:00" },
          sunday: { enabled: false }
        }
      },
      agreement: {
        signature: 'Test Provider',
        title: 'Owner',
        agreedDate: new Date(),
        version: 'test'
      }
    };
    
    try {
      const response = await fetch('https://fearless-achievement-production.up.railway.app/api/providers/admin/create-test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData)
      });
      
      if (response.ok) {
        console.log(`✅ ${p.practiceName} (${p.address.city})`);
      } else {
        console.log(`❌ ${p.practiceName}: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`❌ ${p.practiceName}: ${error.message}`);
    }
  }
  
  console.log('\n✅ NYC providers created!');
  console.log('Distance from Darien, CT: ~40-50 miles');
}

createProviders();
