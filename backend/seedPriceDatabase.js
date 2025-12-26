/**
 * Seed Script for Findr Health Price Database
 * Run with: node seedPriceDatabase.js
 * 
 * Requires MONGODB_URI environment variable
 */

const mongoose = require('mongoose');
require('dotenv').config();

// --- MODELS (inline for portability) ---

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Imaging', 'Labs', 'Procedure', 'Dental', 'Vision', 'Preventive', 'Specialty', 'Other'], required: true },
  cptCodes: [String],
  description: String,
  typicalPriceRange: { low: Number, high: Number },
  keywords: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Service = mongoose.model('Service', serviceSchema);

const clarityProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Imaging Center', 'Lab', 'Surgery Center', 'Hospital', 'Clinic', 'Dental', 'Pharmacy', 'Other'], required: true },
  address: { street: String, city: String, state: String, zip: String, country: { type: String, default: 'US' } },
  contact: { phone: String, email: String, website: String },
  isPartner: { type: Boolean, default: false },
  isInternational: { type: Boolean, default: false },
  accreditation: [String],
  notes: String,
  rating: { score: Number, source: String, reviewCount: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const ClarityProvider = mongoose.model('ClarityProvider', clarityProviderSchema);

const priceSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClarityProvider', required: true },
  cashPrice: { type: Number, required: true },
  priceSource: { type: String, enum: ['website', 'phone_call', 'user_report', 'price_list', 'other'], default: 'other' },
  sourceUrl: String,
  dateCollected: { type: Date, default: Date.now },
  notes: String,
  verified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
priceSchema.index({ serviceId: 1, providerId: 1 }, { unique: true });
const Price = mongoose.model('Price', priceSchema);

// --- SEED DATA ---

const services = [
  // IMAGING
  { name: 'MRI Brain without Contrast', category: 'Imaging', cptCodes: ['70551'], description: 'Magnetic resonance imaging of brain without contrast material', typicalPriceRange: { low: 400, high: 2500 }, keywords: ['mri', 'brain', 'head', 'neurological'] },
  { name: 'MRI Brain with Contrast', category: 'Imaging', cptCodes: ['70552'], description: 'Magnetic resonance imaging of brain with contrast material', typicalPriceRange: { low: 500, high: 3000 }, keywords: ['mri', 'brain', 'head', 'contrast'] },
  { name: 'MRI Brain with and without Contrast', category: 'Imaging', cptCodes: ['70553'], description: 'MRI brain with and without contrast', typicalPriceRange: { low: 600, high: 3500 }, keywords: ['mri', 'brain', 'complete'] },
  { name: 'MRI Lumbar Spine without Contrast', category: 'Imaging', cptCodes: ['72148'], description: 'MRI of lower back/lumbar spine', typicalPriceRange: { low: 400, high: 2500 }, keywords: ['mri', 'spine', 'back', 'lumbar', 'lower back'] },
  { name: 'MRI Cervical Spine without Contrast', category: 'Imaging', cptCodes: ['72141'], description: 'MRI of neck/cervical spine', typicalPriceRange: { low: 400, high: 2500 }, keywords: ['mri', 'spine', 'neck', 'cervical'] },
  { name: 'MRI Knee without Contrast', category: 'Imaging', cptCodes: ['73721'], description: 'MRI of knee joint', typicalPriceRange: { low: 400, high: 2000 }, keywords: ['mri', 'knee', 'joint', 'leg'] },
  { name: 'MRI Shoulder without Contrast', category: 'Imaging', cptCodes: ['73221'], description: 'MRI of shoulder joint', typicalPriceRange: { low: 400, high: 2000 }, keywords: ['mri', 'shoulder', 'joint', 'arm'] },
  { name: 'CT Scan Head/Brain without Contrast', category: 'Imaging', cptCodes: ['70450'], description: 'Computed tomography of head', typicalPriceRange: { low: 200, high: 1500 }, keywords: ['ct', 'cat scan', 'head', 'brain'] },
  { name: 'CT Scan Abdomen/Pelvis with Contrast', category: 'Imaging', cptCodes: ['74177'], description: 'CT of abdomen and pelvis with contrast', typicalPriceRange: { low: 300, high: 2000 }, keywords: ['ct', 'abdomen', 'pelvis', 'stomach'] },
  { name: 'CT Scan Chest without Contrast', category: 'Imaging', cptCodes: ['71250'], description: 'CT of chest/thorax', typicalPriceRange: { low: 200, high: 1500 }, keywords: ['ct', 'chest', 'lung', 'thorax'] },
  { name: 'X-Ray Chest 2 Views', category: 'Imaging', cptCodes: ['71046'], description: 'Chest x-ray, 2 views', typicalPriceRange: { low: 40, high: 300 }, keywords: ['xray', 'x-ray', 'chest', 'lung'] },
  { name: 'Ultrasound Abdomen Complete', category: 'Imaging', cptCodes: ['76700'], description: 'Complete abdominal ultrasound', typicalPriceRange: { low: 150, high: 800 }, keywords: ['ultrasound', 'sonogram', 'abdomen'] },
  { name: 'Mammogram Screening Bilateral', category: 'Imaging', cptCodes: ['77067'], description: 'Screening mammogram both breasts', typicalPriceRange: { low: 100, high: 500 }, keywords: ['mammogram', 'breast', 'screening'] },
  { name: 'DEXA Bone Density Scan', category: 'Imaging', cptCodes: ['77080'], description: 'Bone density scan for osteoporosis', typicalPriceRange: { low: 75, high: 350 }, keywords: ['dexa', 'bone density', 'osteoporosis'] },
  
  // LABS
  { name: 'Complete Blood Count (CBC)', category: 'Labs', cptCodes: ['85025'], description: 'Basic blood cell count with differential', typicalPriceRange: { low: 10, high: 100 }, keywords: ['cbc', 'blood count', 'blood test'] },
  { name: 'Comprehensive Metabolic Panel (CMP)', category: 'Labs', cptCodes: ['80053'], description: '14 blood tests for metabolism, kidney, liver function', typicalPriceRange: { low: 15, high: 150 }, keywords: ['cmp', 'metabolic', 'chemistry panel'] },
  { name: 'Basic Metabolic Panel (BMP)', category: 'Labs', cptCodes: ['80048'], description: '8 blood tests for metabolism and kidney function', typicalPriceRange: { low: 12, high: 100 }, keywords: ['bmp', 'metabolic', 'chemistry'] },
  { name: 'Lipid Panel', category: 'Labs', cptCodes: ['80061'], description: 'Cholesterol and triglycerides test', typicalPriceRange: { low: 15, high: 150 }, keywords: ['cholesterol', 'lipid', 'triglycerides', 'hdl', 'ldl'] },
  { name: 'Hemoglobin A1c', category: 'Labs', cptCodes: ['83036'], description: 'Diabetes blood sugar control test', typicalPriceRange: { low: 15, high: 100 }, keywords: ['a1c', 'diabetes', 'blood sugar', 'glucose'] },
  { name: 'Thyroid Panel (TSH, T3, T4)', category: 'Labs', cptCodes: ['84443', '84480', '84436'], description: 'Complete thyroid function tests', typicalPriceRange: { low: 30, high: 200 }, keywords: ['thyroid', 'tsh', 't3', 't4'] },
  { name: 'TSH (Thyroid Stimulating Hormone)', category: 'Labs', cptCodes: ['84443'], description: 'Basic thyroid screening test', typicalPriceRange: { low: 15, high: 100 }, keywords: ['tsh', 'thyroid'] },
  { name: 'Vitamin D, 25-Hydroxy', category: 'Labs', cptCodes: ['82306'], description: 'Vitamin D level test', typicalPriceRange: { low: 30, high: 150 }, keywords: ['vitamin d', 'vitamins'] },
  { name: 'Vitamin B12', category: 'Labs', cptCodes: ['82607'], description: 'Vitamin B12 level test', typicalPriceRange: { low: 20, high: 100 }, keywords: ['b12', 'vitamin b', 'vitamins'] },
  { name: 'Iron Panel with Ferritin', category: 'Labs', cptCodes: ['83540', '82728'], description: 'Iron and ferritin levels', typicalPriceRange: { low: 25, high: 150 }, keywords: ['iron', 'ferritin', 'anemia'] },
  { name: 'PSA (Prostate Specific Antigen)', category: 'Labs', cptCodes: ['84153'], description: 'Prostate cancer screening test', typicalPriceRange: { low: 20, high: 150 }, keywords: ['psa', 'prostate'] },
  { name: 'Urinalysis', category: 'Labs', cptCodes: ['81003'], description: 'Urine test for infection and other conditions', typicalPriceRange: { low: 5, high: 50 }, keywords: ['urine', 'urinalysis', 'uti'] },
  { name: 'STD Panel (Comprehensive)', category: 'Labs', cptCodes: ['87491', '87591', '86703'], description: 'Comprehensive STD testing including HIV, chlamydia, gonorrhea', typicalPriceRange: { low: 100, high: 400 }, keywords: ['std', 'sti', 'hiv', 'chlamydia', 'gonorrhea'] },
  
  // PROCEDURES
  { name: 'Colonoscopy (Screening)', category: 'Procedure', cptCodes: ['45378'], description: 'Screening colonoscopy for colon cancer', typicalPriceRange: { low: 1000, high: 5000 }, keywords: ['colonoscopy', 'colon', 'screening'] },
  { name: 'Upper Endoscopy (EGD)', category: 'Procedure', cptCodes: ['43239'], description: 'Upper GI endoscopy', typicalPriceRange: { low: 1000, high: 4000 }, keywords: ['endoscopy', 'egd', 'stomach', 'esophagus'] },
  { name: 'Cataract Surgery', category: 'Procedure', cptCodes: ['66984'], description: 'Cataract removal with lens implant', typicalPriceRange: { low: 3000, high: 7000 }, keywords: ['cataract', 'eye surgery', 'lens'] },
  { name: 'Knee Arthroscopy', category: 'Procedure', cptCodes: ['29881'], description: 'Knee scope surgery', typicalPriceRange: { low: 5000, high: 15000 }, keywords: ['knee', 'arthroscopy', 'scope'] },
  { name: 'Carpal Tunnel Release', category: 'Procedure', cptCodes: ['64721'], description: 'Carpal tunnel surgery', typicalPriceRange: { low: 2000, high: 8000 }, keywords: ['carpal tunnel', 'hand', 'wrist'] },
  { name: 'Vasectomy', category: 'Procedure', cptCodes: ['55250'], description: 'Male sterilization procedure', typicalPriceRange: { low: 500, high: 2000 }, keywords: ['vasectomy', 'sterilization'] },
  
  // DENTAL
  { name: 'Dental Cleaning (Adult)', category: 'Dental', cptCodes: ['D1110'], description: 'Routine dental cleaning for adults', typicalPriceRange: { low: 75, high: 200 }, keywords: ['dental', 'cleaning', 'teeth'] },
  { name: 'Dental Exam (Comprehensive)', category: 'Dental', cptCodes: ['D0150'], description: 'Comprehensive dental exam', typicalPriceRange: { low: 50, high: 150 }, keywords: ['dental', 'exam', 'checkup'] },
  { name: 'Dental X-Rays (Full Mouth)', category: 'Dental', cptCodes: ['D0210'], description: 'Complete series dental x-rays', typicalPriceRange: { low: 100, high: 250 }, keywords: ['dental', 'xray', 'x-ray'] },
  { name: 'Tooth Extraction (Simple)', category: 'Dental', cptCodes: ['D7140'], description: 'Simple tooth extraction', typicalPriceRange: { low: 100, high: 300 }, keywords: ['extraction', 'tooth', 'pull'] },
  { name: 'Root Canal (Molar)', category: 'Dental', cptCodes: ['D3330'], description: 'Root canal treatment on molar', typicalPriceRange: { low: 800, high: 1500 }, keywords: ['root canal', 'molar', 'endodontic'] },
  { name: 'Dental Crown (Porcelain)', category: 'Dental', cptCodes: ['D2740'], description: 'Porcelain dental crown', typicalPriceRange: { low: 800, high: 1500 }, keywords: ['crown', 'cap', 'porcelain'] },
  { name: 'Dental Implant (Single)', category: 'Dental', cptCodes: ['D6010'], description: 'Single dental implant', typicalPriceRange: { low: 2000, high: 5000 }, keywords: ['implant', 'dental implant'] },
  
  // VISION
  { name: 'Eye Exam (Comprehensive)', category: 'Vision', cptCodes: ['92004'], description: 'Complete eye examination', typicalPriceRange: { low: 75, high: 250 }, keywords: ['eye exam', 'vision', 'optometry'] },
  { name: 'Contact Lens Fitting', category: 'Vision', cptCodes: ['92310'], description: 'Contact lens fitting and evaluation', typicalPriceRange: { low: 50, high: 150 }, keywords: ['contacts', 'contact lens', 'fitting'] },
  { name: 'LASIK (Per Eye)', category: 'Vision', cptCodes: ['66999'], description: 'LASIK vision correction surgery', typicalPriceRange: { low: 1500, high: 3000 }, keywords: ['lasik', 'laser', 'vision correction'] },
  
  // PREVENTIVE
  { name: 'Annual Physical Exam', category: 'Preventive', cptCodes: ['99395', '99396'], description: 'Annual wellness exam', typicalPriceRange: { low: 150, high: 400 }, keywords: ['physical', 'wellness', 'checkup', 'annual'] },
  { name: 'Flu Shot', category: 'Preventive', cptCodes: ['90686'], description: 'Influenza vaccine', typicalPriceRange: { low: 0, high: 50 }, keywords: ['flu', 'vaccine', 'shot', 'influenza'] },
  { name: 'COVID-19 Vaccine', category: 'Preventive', cptCodes: ['91300'], description: 'COVID-19 vaccination', typicalPriceRange: { low: 0, high: 0 }, keywords: ['covid', 'vaccine', 'coronavirus'] },
];

const providers = [
  // IMAGING CENTERS
  { name: 'Denver Imaging Center', type: 'Imaging Center', address: { city: 'Denver', state: 'CO', zip: '80202' }, contact: { phone: '303-555-0100' }, isPartner: false },
  { name: 'Mile High MRI', type: 'Imaging Center', address: { city: 'Denver', state: 'CO', zip: '80210' }, contact: { phone: '303-555-0101' }, isPartner: true },
  { name: 'RadNet Imaging Aurora', type: 'Imaging Center', address: { city: 'Aurora', state: 'CO', zip: '80012' }, contact: { phone: '303-555-0102' }, isPartner: false },
  { name: 'Phoenix Open MRI', type: 'Imaging Center', address: { city: 'Phoenix', state: 'AZ', zip: '85004' }, contact: { phone: '602-555-0100' }, isPartner: true },
  { name: 'Valley Imaging Scottsdale', type: 'Imaging Center', address: { city: 'Scottsdale', state: 'AZ', zip: '85251' }, contact: { phone: '480-555-0100' }, isPartner: false },
  { name: 'Bozeman Imaging Center', type: 'Imaging Center', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-555-0100' }, isPartner: true },
  { name: 'SimonMed Imaging Dallas', type: 'Imaging Center', address: { city: 'Dallas', state: 'TX', zip: '75201' }, contact: { phone: '214-555-0100' }, isPartner: false },
  { name: 'Affordable MRI Houston', type: 'Imaging Center', address: { city: 'Houston', state: 'TX', zip: '77002' }, contact: { phone: '713-555-0100' }, isPartner: true },
  
  // LABS
  { name: 'Quest Diagnostics Denver', type: 'Lab', address: { city: 'Denver', state: 'CO', zip: '80203' }, contact: { phone: '303-555-0200', website: 'questdiagnostics.com' }, isPartner: false },
  { name: 'Labcorp Aurora', type: 'Lab', address: { city: 'Aurora', state: 'CO', zip: '80014' }, contact: { phone: '303-555-0201', website: 'labcorp.com' }, isPartner: false },
  { name: 'Any Lab Test Now Phoenix', type: 'Lab', address: { city: 'Phoenix', state: 'AZ', zip: '85006' }, contact: { phone: '602-555-0200' }, isPartner: true },
  { name: 'Direct Labs Bozeman', type: 'Lab', address: { city: 'Bozeman', state: 'MT', zip: '59718' }, contact: { phone: '406-555-0200' }, isPartner: true },
  { name: 'Ulta Lab Tests Dallas', type: 'Lab', address: { city: 'Dallas', state: 'TX', zip: '75202' }, contact: { phone: '214-555-0200' }, isPartner: false },
  
  // SURGERY CENTERS
  { name: 'Denver Outpatient Surgery', type: 'Surgery Center', address: { city: 'Denver', state: 'CO', zip: '80206' }, contact: { phone: '303-555-0300' }, isPartner: true },
  { name: 'Arizona Surgical Center', type: 'Surgery Center', address: { city: 'Phoenix', state: 'AZ', zip: '85008' }, contact: { phone: '602-555-0300' }, isPartner: false },
  { name: 'Texas Ambulatory Surgery', type: 'Surgery Center', address: { city: 'Dallas', state: 'TX', zip: '75204' }, contact: { phone: '214-555-0300' }, isPartner: true },
  
  // HOSPITALS (reference pricing)
  { name: 'UCHealth University of Colorado Hospital', type: 'Hospital', address: { city: 'Aurora', state: 'CO', zip: '80045' }, contact: { phone: '720-848-0000' }, isPartner: false },
  { name: 'Banner University Medical Center', type: 'Hospital', address: { city: 'Phoenix', state: 'AZ', zip: '85006' }, contact: { phone: '602-839-2000' }, isPartner: false },
  { name: 'Bozeman Health Deaconess Hospital', type: 'Hospital', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-585-5000' }, isPartner: false },
  
  // DENTAL
  { name: 'Affordable Dental Denver', type: 'Dental', address: { city: 'Denver', state: 'CO', zip: '80204' }, contact: { phone: '303-555-0400' }, isPartner: true },
  { name: 'Bright Smile Phoenix', type: 'Dental', address: { city: 'Phoenix', state: 'AZ', zip: '85012' }, contact: { phone: '602-555-0400' }, isPartner: false },
  { name: 'Family Dental Bozeman', type: 'Dental', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-555-0400' }, isPartner: true },
  
  // INTERNATIONAL
  { name: 'Hospital Angeles Tijuana', type: 'Hospital', address: { city: 'Tijuana', state: 'BC', country: 'Mexico' }, contact: { phone: '+52-664-635-1900' }, isPartner: true, isInternational: true, accreditation: ['JCI'] },
  { name: 'Mercy Medical Bangkok', type: 'Hospital', address: { city: 'Bangkok', state: '', country: 'Thailand' }, contact: { phone: '+66-2-429-2000' }, isPartner: false, isInternational: true, accreditation: ['JCI'] },
  { name: 'Dental Art Costa Rica', type: 'Dental', address: { city: 'San Jose', state: '', country: 'Costa Rica' }, contact: { phone: '+506-2291-5151' }, isPartner: true, isInternational: true },
];

// --- PRICE MAPPING ---
// Maps service names to provider types and price multipliers
const priceMap = {
  'Imaging Center': {
    'MRI Brain without Contrast': { base: 450, variance: 100 },
    'MRI Brain with Contrast': { base: 550, variance: 100 },
    'MRI Brain with and without Contrast': { base: 650, variance: 150 },
    'MRI Lumbar Spine without Contrast': { base: 450, variance: 100 },
    'MRI Cervical Spine without Contrast': { base: 450, variance: 100 },
    'MRI Knee without Contrast': { base: 400, variance: 100 },
    'MRI Shoulder without Contrast': { base: 400, variance: 100 },
    'CT Scan Head/Brain without Contrast': { base: 250, variance: 75 },
    'CT Scan Abdomen/Pelvis with Contrast': { base: 350, variance: 100 },
    'CT Scan Chest without Contrast': { base: 250, variance: 75 },
    'X-Ray Chest 2 Views': { base: 50, variance: 20 },
    'Ultrasound Abdomen Complete': { base: 200, variance: 50 },
    'Mammogram Screening Bilateral': { base: 150, variance: 50 },
    'DEXA Bone Density Scan': { base: 100, variance: 30 },
  },
  'Hospital': {
    'MRI Brain without Contrast': { base: 1800, variance: 500 },
    'MRI Brain with Contrast': { base: 2200, variance: 500 },
    'MRI Brain with and without Contrast': { base: 2800, variance: 600 },
    'MRI Lumbar Spine without Contrast': { base: 1800, variance: 500 },
    'MRI Cervical Spine without Contrast': { base: 1800, variance: 500 },
    'MRI Knee without Contrast': { base: 1500, variance: 400 },
    'CT Scan Head/Brain without Contrast': { base: 1200, variance: 300 },
    'CT Scan Abdomen/Pelvis with Contrast': { base: 1500, variance: 400 },
    'Colonoscopy (Screening)': { base: 3500, variance: 1000 },
    'Upper Endoscopy (EGD)': { base: 3000, variance: 800 },
  },
  'Lab': {
    'Complete Blood Count (CBC)': { base: 15, variance: 10 },
    'Comprehensive Metabolic Panel (CMP)': { base: 20, variance: 15 },
    'Basic Metabolic Panel (BMP)': { base: 15, variance: 10 },
    'Lipid Panel': { base: 25, variance: 15 },
    'Hemoglobin A1c': { base: 20, variance: 10 },
    'Thyroid Panel (TSH, T3, T4)': { base: 50, variance: 25 },
    'TSH (Thyroid Stimulating Hormone)': { base: 25, variance: 10 },
    'Vitamin D, 25-Hydroxy': { base: 45, variance: 20 },
    'Vitamin B12': { base: 30, variance: 15 },
    'Iron Panel with Ferritin': { base: 40, variance: 20 },
    'PSA (Prostate Specific Antigen)': { base: 35, variance: 15 },
    'Urinalysis': { base: 10, variance: 5 },
    'STD Panel (Comprehensive)': { base: 150, variance: 75 },
  },
  'Surgery Center': {
    'Colonoscopy (Screening)': { base: 1500, variance: 400 },
    'Upper Endoscopy (EGD)': { base: 1400, variance: 350 },
    'Cataract Surgery': { base: 3500, variance: 800 },
    'Knee Arthroscopy': { base: 6000, variance: 1500 },
    'Carpal Tunnel Release': { base: 3000, variance: 800 },
    'Vasectomy': { base: 800, variance: 200 },
  },
  'Dental': {
    'Dental Cleaning (Adult)': { base: 100, variance: 30 },
    'Dental Exam (Comprehensive)': { base: 75, variance: 25 },
    'Dental X-Rays (Full Mouth)': { base: 125, variance: 40 },
    'Tooth Extraction (Simple)': { base: 150, variance: 50 },
    'Root Canal (Molar)': { base: 1000, variance: 200 },
    'Dental Crown (Porcelain)': { base: 1000, variance: 200 },
    'Dental Implant (Single)': { base: 3000, variance: 800 },
  },
};

// International pricing (generally 50-70% cheaper)
const internationalMultiplier = 0.35;

// --- SEED FUNCTION ---
async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI environment variable not set');
      console.log('Usage: MONGODB_URI="mongodb+srv://..." node seedPriceDatabase.js');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!\n');

    // Clear existing data (optional - comment out to append)
    console.log('Clearing existing data...');
    await Service.deleteMany({});
    await ClarityProvider.deleteMany({});
    await Price.deleteMany({});
    console.log('Cleared!\n');

    // Insert services
    console.log('Inserting services...');
    const insertedServices = await Service.insertMany(services);
    console.log(`  Inserted ${insertedServices.length} services`);

    // Create service lookup by name
    const serviceMap = {};
    insertedServices.forEach(s => { serviceMap[s.name] = s._id; });

    // Insert providers
    console.log('Inserting providers...');
    const insertedProviders = await ClarityProvider.insertMany(providers);
    console.log(`  Inserted ${insertedProviders.length} providers`);

    // Generate prices
    console.log('Generating prices...');
    const prices = [];
    
    for (const provider of insertedProviders) {
      const providerPrices = priceMap[provider.type];
      if (!providerPrices) continue;

      for (const [serviceName, priceInfo] of Object.entries(providerPrices)) {
        const serviceId = serviceMap[serviceName];
        if (!serviceId) continue;

        // Calculate price with variance
        let price = priceInfo.base + Math.floor(Math.random() * priceInfo.variance * 2) - priceInfo.variance;
        
        // Apply international discount
        if (provider.isInternational) {
          price = Math.round(price * internationalMultiplier);
        }
        
        // Partner discount (10% off)
        if (provider.isPartner) {
          price = Math.round(price * 0.9);
        }

        prices.push({
          serviceId,
          providerId: provider._id,
          cashPrice: price,
          priceSource: 'price_list',
          verified: provider.isPartner,
          notes: provider.isPartner ? 'Partner pricing' : null
        });
      }
    }

    const insertedPrices = await Price.insertMany(prices);
    console.log(`  Inserted ${insertedPrices.length} prices\n`);

    // Summary
    console.log('=== SEED COMPLETE ===');
    console.log(`Services: ${insertedServices.length}`);
    console.log(`Providers: ${insertedProviders.length}`);
    console.log(`Prices: ${insertedPrices.length}`);
    
    // Show some sample data
    console.log('\n--- Sample Prices ---');
    const samplePrices = await Price.find()
      .populate('serviceId', 'name')
      .populate('providerId', 'name address.city')
      .limit(10);
    
    samplePrices.forEach(p => {
      console.log(`  ${p.serviceId.name} @ ${p.providerId.name} (${p.providerId.address.city}): $${p.cashPrice}`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
    
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
