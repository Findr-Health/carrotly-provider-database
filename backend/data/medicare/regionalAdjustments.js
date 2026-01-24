// backend/data/medicare/regionalAdjustments.js
// Regional Cost of Living Adjustments for Healthcare Pricing
// Based on Medicare Geographic Practice Cost Indices (GPCI) and market data

/**
 * Regional Adjustment Factors
 * 
 * Source: CMS Geographic Practice Cost Indices (GPCI)
 * URL: https://www.cms.gov/medicare/payment/fee-schedules/physician/gpci
 * 
 * Factor Explanation:
 * - 1.0 = National average
 * - 0.85 = 15% below national average (lower cost area)
 * - 1.40 = 40% above national average (higher cost area)
 * 
 * Applied to: Medicare base rates to get regional fair prices
 */

const regionalAdjustments = {
  // ==========================================
  // MONTANA
  // ==========================================
  'Billings, MT': {
    factor: 0.88,
    label: 'Billings, MT',
    metro: 'Billings',
    state: 'MT',
    population: 110000,
    description: 'Mid-size Montana city, moderate healthcare costs'
  },
  
  'Bozeman, MT': {
    factor: 0.85,
    label: 'Bozeman, MT',
    metro: 'Bozeman',
    state: 'MT',
    population: 50000,
    description: 'Smaller Montana city, below average healthcare costs'
  },
  
  'Butte, MT': {
    factor: 0.80,
    label: 'Butte, MT',
    metro: 'Butte',
    state: 'MT',
    population: 35000,
    description: 'Rural Montana, lowest healthcare costs in state'
  },
  
  'Great Falls, MT': {
    factor: 0.83,
    label: 'Great Falls, MT',
    metro: 'Great Falls',
    state: 'MT',
    population: 60000,
    description: 'Central Montana, below average costs'
  },
  
  'Missoula, MT': {
    factor: 0.86,
    label: 'Missoula, MT',
    metro: 'Missoula',
    state: 'MT',
    population: 75000,
    description: 'Western Montana, moderate costs'
  },
  
  // ==========================================
  // HIGH-COST METROS
  // ==========================================
  
  // New York
  'Manhattan, NY': {
    factor: 1.40,
    label: 'Manhattan, NY',
    metro: 'New York City',
    state: 'NY',
    population: 1600000,
    description: 'Highest healthcare costs in nation'
  },
  
  'Brooklyn, NY': {
    factor: 1.35,
    label: 'Brooklyn, NY',
    metro: 'New York City',
    state: 'NY',
    population: 2600000,
    description: 'Very high healthcare costs'
  },
  
  'Queens, NY': {
    factor: 1.32,
    label: 'Queens, NY',
    metro: 'New York City',
    state: 'NY',
    population: 2300000,
    description: 'High healthcare costs'
  },
  
  // California
  'San Francisco, CA': {
    factor: 1.35,
    label: 'San Francisco, CA',
    metro: 'San Francisco Bay Area',
    state: 'CA',
    population: 875000,
    description: 'Extremely high healthcare costs'
  },
  
  'San Jose, CA': {
    factor: 1.32,
    label: 'San Jose, CA',
    metro: 'San Francisco Bay Area',
    state: 'CA',
    population: 1000000,
    description: 'Very high healthcare costs'
  },
  
  'Los Angeles, CA': {
    factor: 1.28,
    label: 'Los Angeles, CA',
    metro: 'Los Angeles',
    state: 'CA',
    population: 4000000,
    description: 'High healthcare costs'
  },
  
  'San Diego, CA': {
    factor: 1.22,
    label: 'San Diego, CA',
    metro: 'San Diego',
    state: 'CA',
    population: 1400000,
    description: 'Above average healthcare costs'
  },
  
  // Massachusetts
  'Boston, MA': {
    factor: 1.30,
    label: 'Boston, MA',
    metro: 'Boston',
    state: 'MA',
    population: 690000,
    description: 'Very high healthcare costs, major medical hub'
  },
  
  // Washington DC
  'Washington, DC': {
    factor: 1.28,
    label: 'Washington, DC',
    metro: 'Washington DC',
    state: 'DC',
    population: 700000,
    description: 'High healthcare costs'
  },
  
  // Seattle
  'Seattle, WA': {
    factor: 1.25,
    label: 'Seattle, WA',
    metro: 'Seattle',
    state: 'WA',
    population: 750000,
    description: 'Above average healthcare costs'
  },
  
  // ==========================================
  // MID-COST METROS (Near National Average)
  // ==========================================
  
  // Texas
  'Dallas, TX': {
    factor: 1.00,
    label: 'Dallas, TX',
    metro: 'Dallas-Fort Worth',
    state: 'TX',
    population: 1300000,
    description: 'National average healthcare costs'
  },
  
  'Houston, TX': {
    factor: 0.98,
    label: 'Houston, TX',
    metro: 'Houston',
    state: 'TX',
    population: 2300000,
    description: 'Slightly below national average'
  },
  
  'Austin, TX': {
    factor: 1.05,
    label: 'Austin, TX',
    metro: 'Austin',
    state: 'TX',
    population: 950000,
    description: 'Slightly above national average'
  },
  
  // Florida
  'Miami, FL': {
    factor: 1.08,
    label: 'Miami, FL',
    metro: 'Miami',
    state: 'FL',
    population: 470000,
    description: 'Slightly above average costs'
  },
  
  'Orlando, FL': {
    factor: 0.98,
    label: 'Orlando, FL',
    metro: 'Orlando',
    state: 'FL',
    population: 285000,
    description: 'Near national average'
  },
  
  'Tampa, FL': {
    factor: 0.96,
    label: 'Tampa, FL',
    metro: 'Tampa',
    state: 'FL',
    population: 395000,
    description: 'Slightly below national average'
  },
  
  // Arizona
  'Phoenix, AZ': {
    factor: 0.97,
    label: 'Phoenix, AZ',
    metro: 'Phoenix',
    state: 'AZ',
    population: 1600000,
    description: 'Near national average'
  },
  
  // Colorado
  'Denver, CO': {
    factor: 1.08,
    label: 'Denver, CO',
    metro: 'Denver',
    state: 'CO',
    population: 710000,
    description: 'Slightly above average'
  },
  
  // Georgia
  'Atlanta, GA': {
    factor: 1.02,
    label: 'Atlanta, GA',
    metro: 'Atlanta',
    state: 'GA',
    population: 500000,
    description: 'Near national average'
  },
  
  // Illinois
  'Chicago, IL': {
    factor: 1.12,
    label: 'Chicago, IL',
    metro: 'Chicago',
    state: 'IL',
    population: 2700000,
    description: 'Above national average'
  },
  
  // Pennsylvania
  'Philadelphia, PA': {
    factor: 1.10,
    label: 'Philadelphia, PA',
    metro: 'Philadelphia',
    state: 'PA',
    population: 1600000,
    description: 'Above national average'
  },
  
  // ==========================================
  // LOW-COST METROS
  // ==========================================
  
  // Oklahoma
  'Oklahoma City, OK': {
    factor: 0.85,
    label: 'Oklahoma City, OK',
    metro: 'Oklahoma City',
    state: 'OK',
    population: 650000,
    description: 'Below average healthcare costs'
  },
  
  // Arkansas
  'Little Rock, AR': {
    factor: 0.82,
    label: 'Little Rock, AR',
    metro: 'Little Rock',
    state: 'AR',
    population: 200000,
    description: 'Low healthcare costs'
  },
  
  // Mississippi
  'Jackson, MS': {
    factor: 0.80,
    label: 'Jackson, MS',
    metro: 'Jackson',
    state: 'MS',
    population: 160000,
    description: 'Lowest healthcare costs in US'
  },
  
  // Alabama
  'Birmingham, AL': {
    factor: 0.83,
    label: 'Birmingham, AL',
    metro: 'Birmingham',
    state: 'AL',
    population: 210000,
    description: 'Low healthcare costs'
  },
  
  // Tennessee
  'Memphis, TN': {
    factor: 0.88,
    label: 'Memphis, TN',
    metro: 'Memphis',
    state: 'TN',
    population: 650000,
    description: 'Below average healthcare costs'
  },
  
  'Nashville, TN': {
    factor: 0.95,
    label: 'Nashville, TN',
    metro: 'Nashville',
    state: 'TN',
    population: 690000,
    description: 'Slightly below national average'
  },
  
  // Indiana
  'Indianapolis, IN': {
    factor: 0.90,
    label: 'Indianapolis, IN',
    metro: 'Indianapolis',
    state: 'IN',
    population: 875000,
    description: 'Below average healthcare costs'
  },
  
  // Ohio
  'Cleveland, OH': {
    factor: 0.92,
    label: 'Cleveland, OH',
    metro: 'Cleveland',
    state: 'OH',
    population: 385000,
    description: 'Below average healthcare costs'
  },
  
  'Cincinnati, OH': {
    factor: 0.93,
    label: 'Cincinnati, OH',
    metro: 'Cincinnati',
    state: 'OH',
    population: 310000,
    description: 'Below average healthcare costs'
  },
  
  'Columbus, OH': {
    factor: 0.94,
    label: 'Columbus, OH',
    metro: 'Columbus',
    state: 'OH',
    population: 900000,
    description: 'Slightly below national average'
  },
};

// Helper: Get regional adjustment
function getRegionalAdjustment(location) {
  // Try exact match first
  if (regionalAdjustments[location]) {
    return regionalAdjustments[location];
  }
  
  // Try matching by metro or state
  const locationLower = location.toLowerCase();
  
  for (const [key, data] of Object.entries(regionalAdjustments)) {
    if (key.toLowerCase().includes(locationLower) ||
        data.metro.toLowerCase().includes(locationLower) ||
        data.state.toLowerCase() === locationLower) {
      return data;
    }
  }
  
  // Default to national average
  return {
    factor: 1.0,
    label: 'National Average',
    metro: 'Unknown',
    state: 'Unknown',
    description: 'Using national average (no regional data available)'
  };
}

// Helper: Get adjustment by ZIP code (requires ZIP database)
function getAdjustmentByZip(zipCode) {
  // TODO: Implement ZIP to metro mapping
  // For now, return national average
  return {
    factor: 1.0,
    label: 'National Average',
    metro: 'Unknown',
    state: 'Unknown',
    description: 'ZIP code mapping not yet implemented'
  };
}

// Helper: Apply regional adjustment to rate
function applyRegionalAdjustment(baseRate, location) {
  const adjustment = getRegionalAdjustment(location);
  return {
    baseRate: baseRate,
    adjustedRate: Math.round(baseRate * adjustment.factor * 100) / 100,
    factor: adjustment.factor,
    location: adjustment.label,
    description: adjustment.description
  };
}

// Export
module.exports = {
  regionalAdjustments,
  getRegionalAdjustment,
  getAdjustmentByZip,
  applyRegionalAdjustment,
};
