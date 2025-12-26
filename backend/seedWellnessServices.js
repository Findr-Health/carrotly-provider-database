/**
 * Seed Script for Wellness & Cosmetic Services
 * Run with: MONGODB_URI="..." node seedWellnessServices.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// --- MODEL (with subcategory) ---
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: 'Other' },
  cptCodes: [String],
  description: String,
  typicalDuration: Number,
  typicalPriceRange: { low: Number, high: Number },
  keywords: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Service = mongoose.model('Service', serviceSchema);

const clarityProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  address: { street: String, city: String, state: String, zip: String, country: { type: String, default: 'US' } },
  contact: { phone: String, email: String, website: String },
  isPartner: { type: Boolean, default: false },
  isInternational: { type: Boolean, default: false },
  accreditation: [String],
  notes: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const ClarityProvider = mongoose.model('ClarityProvider', clarityProviderSchema);

const priceSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClarityProvider', required: true },
  cashPrice: { type: Number, required: true },
  priceSource: { type: String, default: 'other' },
  verified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
priceSchema.index({ serviceId: 1, providerId: 1 }, { unique: true });
const Price = mongoose.model('Price', priceSchema);

// --- WELLNESS & COSMETIC SERVICES ---
const wellnessServices = [
  // COSMETIC - Injectables
  { name: 'Botox - Forehead Lines', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 30, typicalPriceRange: { low: 200, high: 400 }, keywords: ['botox', 'wrinkles', 'forehead', 'anti-aging'] },
  { name: 'Botox - Crows Feet', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 30, typicalPriceRange: { low: 200, high: 400 }, keywords: ['botox', 'wrinkles', 'eyes', 'crows feet'] },
  { name: 'Botox - Frown Lines (Glabella)', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 30, typicalPriceRange: { low: 200, high: 400 }, keywords: ['botox', 'wrinkles', 'frown', 'glabella'] },
  { name: 'Botox - Full Face', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 45, typicalPriceRange: { low: 400, high: 800 }, keywords: ['botox', 'wrinkles', 'full face', 'anti-aging'] },
  { name: 'Lip Filler (1 syringe)', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 45, typicalPriceRange: { low: 500, high: 900 }, keywords: ['filler', 'lips', 'juvederm', 'restylane'] },
  { name: 'Cheek Filler (per syringe)', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 45, typicalPriceRange: { low: 600, high: 1000 }, keywords: ['filler', 'cheeks', 'juvederm', 'volume'] },
  { name: 'Jawline Filler', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 60, typicalPriceRange: { low: 800, high: 1500 }, keywords: ['filler', 'jawline', 'contour'] },
  { name: 'Under Eye Filler', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 45, typicalPriceRange: { low: 600, high: 1200 }, keywords: ['filler', 'under eye', 'tear trough', 'dark circles'] },
  { name: 'Kybella (Double Chin)', category: 'Cosmetic', subcategory: 'Injectables', typicalDuration: 30, typicalPriceRange: { low: 600, high: 1200 }, keywords: ['kybella', 'chin', 'fat dissolving'] },
  
  // COSMETIC - Skin Treatments
  { name: 'Chemical Peel - Light', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 30, typicalPriceRange: { low: 100, high: 200 }, keywords: ['peel', 'skin', 'exfoliation', 'light'] },
  { name: 'Chemical Peel - Medium', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 45, typicalPriceRange: { low: 150, high: 350 }, keywords: ['peel', 'skin', 'exfoliation', 'medium'] },
  { name: 'Chemical Peel - Deep', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 60, typicalPriceRange: { low: 300, high: 600 }, keywords: ['peel', 'skin', 'exfoliation', 'deep'] },
  { name: 'Microneedling', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 60, typicalPriceRange: { low: 200, high: 500 }, keywords: ['microneedling', 'collagen', 'skin', 'texture'] },
  { name: 'Microneedling with PRP', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 90, typicalPriceRange: { low: 400, high: 800 }, keywords: ['microneedling', 'prp', 'vampire facial', 'collagen'] },
  { name: 'HydraFacial', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 60, typicalPriceRange: { low: 150, high: 300 }, keywords: ['hydrafacial', 'hydration', 'cleansing', 'facial'] },
  { name: 'Dermaplaning', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 45, typicalPriceRange: { low: 75, high: 200 }, keywords: ['dermaplaning', 'exfoliation', 'peach fuzz'] },
  { name: 'Microdermabrasion', category: 'Cosmetic', subcategory: 'Skin Treatments', typicalDuration: 45, typicalPriceRange: { low: 100, high: 250 }, keywords: ['microdermabrasion', 'exfoliation', 'skin'] },
  
  // COSMETIC - Laser
  { name: 'Laser Hair Removal - Small Area', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 15, typicalPriceRange: { low: 75, high: 200 }, keywords: ['laser', 'hair removal', 'small', 'upper lip', 'underarm'] },
  { name: 'Laser Hair Removal - Medium Area', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 30, typicalPriceRange: { low: 150, high: 350 }, keywords: ['laser', 'hair removal', 'bikini', 'arms'] },
  { name: 'Laser Hair Removal - Large Area', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 60, typicalPriceRange: { low: 250, high: 500 }, keywords: ['laser', 'hair removal', 'legs', 'back', 'full'] },
  { name: 'IPL Photofacial', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 45, typicalPriceRange: { low: 200, high: 500 }, keywords: ['ipl', 'photofacial', 'sun damage', 'pigmentation'] },
  { name: 'Laser Skin Resurfacing', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 60, typicalPriceRange: { low: 500, high: 2000 }, keywords: ['laser', 'resurfacing', 'wrinkles', 'scars'] },
  { name: 'Laser Tattoo Removal (per session)', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 30, typicalPriceRange: { low: 100, high: 500 }, keywords: ['laser', 'tattoo', 'removal'] },
  { name: 'Laser Vein Treatment', category: 'Cosmetic', subcategory: 'Laser', typicalDuration: 30, typicalPriceRange: { low: 200, high: 500 }, keywords: ['laser', 'veins', 'spider veins'] },
  
  // COSMETIC - Body Contouring
  { name: 'CoolSculpting - Small Area', category: 'Cosmetic', subcategory: 'Body Contouring', typicalDuration: 35, typicalPriceRange: { low: 600, high: 1000 }, keywords: ['coolsculpting', 'fat', 'freezing', 'body'] },
  { name: 'CoolSculpting - Large Area', category: 'Cosmetic', subcategory: 'Body Contouring', typicalDuration: 60, typicalPriceRange: { low: 1000, high: 1800 }, keywords: ['coolsculpting', 'fat', 'freezing', 'body'] },
  { name: 'Body Sculpting - RF Treatment', category: 'Cosmetic', subcategory: 'Body Contouring', typicalDuration: 45, typicalPriceRange: { low: 300, high: 800 }, keywords: ['body sculpting', 'radiofrequency', 'tightening'] },
  { name: 'Liposuction Consultation', category: 'Cosmetic', subcategory: 'Consultations', typicalDuration: 60, typicalPriceRange: { low: 0, high: 200 }, keywords: ['liposuction', 'consultation', 'fat removal'] },
  
  // FITNESS - Personal Training
  { name: 'Personal Training Session (1 hour)', category: 'Fitness', subcategory: 'Personal Training', typicalDuration: 60, typicalPriceRange: { low: 50, high: 150 }, keywords: ['personal training', 'fitness', 'workout', 'trainer'] },
  { name: 'Personal Training (5 session pack)', category: 'Fitness', subcategory: 'Personal Training', typicalDuration: 60, typicalPriceRange: { low: 225, high: 600 }, keywords: ['personal training', 'package', 'fitness'] },
  { name: 'Personal Training (10 session pack)', category: 'Fitness', subcategory: 'Personal Training', typicalDuration: 60, typicalPriceRange: { low: 400, high: 1000 }, keywords: ['personal training', 'package', 'fitness'] },
  { name: 'Partner Training Session', category: 'Fitness', subcategory: 'Personal Training', typicalDuration: 60, typicalPriceRange: { low: 70, high: 180 }, keywords: ['partner training', 'couples', 'fitness'] },
  
  // FITNESS - Assessment
  { name: 'Fitness Assessment', category: 'Fitness', subcategory: 'Assessment', typicalDuration: 60, typicalPriceRange: { low: 50, high: 150 }, keywords: ['fitness', 'assessment', 'evaluation', 'baseline'] },
  { name: 'Body Composition Analysis', category: 'Fitness', subcategory: 'Assessment', typicalDuration: 30, typicalPriceRange: { low: 25, high: 75 }, keywords: ['body composition', 'body fat', 'inbody', 'dexa'] },
  { name: 'VO2 Max Testing', category: 'Fitness', subcategory: 'Assessment', typicalDuration: 45, typicalPriceRange: { low: 100, high: 300 }, keywords: ['vo2 max', 'cardio', 'endurance', 'testing'] },
  { name: 'Movement Screening', category: 'Fitness', subcategory: 'Assessment', typicalDuration: 45, typicalPriceRange: { low: 75, high: 200 }, keywords: ['movement', 'screening', 'functional', 'fms'] },
  
  // FITNESS - Group Classes
  { name: 'Group Fitness Class (Drop-in)', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 60, typicalPriceRange: { low: 15, high: 35 }, keywords: ['group fitness', 'class', 'workout'] },
  { name: 'Yoga Class (Drop-in)', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 60, typicalPriceRange: { low: 15, high: 30 }, keywords: ['yoga', 'class', 'stretch', 'flexibility'] },
  { name: 'Pilates Class (Drop-in)', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 60, typicalPriceRange: { low: 20, high: 40 }, keywords: ['pilates', 'class', 'core', 'strength'] },
  { name: 'Spin/Cycling Class', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 45, typicalPriceRange: { low: 20, high: 35 }, keywords: ['spin', 'cycling', 'cardio', 'class'] },
  { name: 'HIIT Class', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 45, typicalPriceRange: { low: 20, high: 35 }, keywords: ['hiit', 'high intensity', 'interval', 'class'] },
  { name: 'Monthly Unlimited Classes', category: 'Fitness', subcategory: 'Group Classes', typicalDuration: 0, typicalPriceRange: { low: 100, high: 250 }, keywords: ['unlimited', 'membership', 'monthly'] },
  
  // FITNESS - Nutrition
  { name: 'Nutrition Consultation', category: 'Fitness', subcategory: 'Nutrition', typicalDuration: 60, typicalPriceRange: { low: 75, high: 200 }, keywords: ['nutrition', 'diet', 'consultation', 'meal plan'] },
  { name: 'Meal Planning Package', category: 'Fitness', subcategory: 'Nutrition', typicalDuration: 0, typicalPriceRange: { low: 100, high: 300 }, keywords: ['meal plan', 'nutrition', 'diet', 'package'] },
  { name: 'Nutrition Follow-up', category: 'Fitness', subcategory: 'Nutrition', typicalDuration: 30, typicalPriceRange: { low: 50, high: 100 }, keywords: ['nutrition', 'follow-up', 'check-in'] },
  
  // MASSAGE - Therapeutic
  { name: 'Deep Tissue Massage (60 min)', category: 'Massage', subcategory: 'Therapeutic', typicalDuration: 60, typicalPriceRange: { low: 80, high: 150 }, keywords: ['deep tissue', 'massage', 'therapeutic', 'muscle'] },
  { name: 'Deep Tissue Massage (90 min)', category: 'Massage', subcategory: 'Therapeutic', typicalDuration: 90, typicalPriceRange: { low: 110, high: 200 }, keywords: ['deep tissue', 'massage', 'therapeutic', 'muscle'] },
  { name: 'Trigger Point Therapy', category: 'Massage', subcategory: 'Therapeutic', typicalDuration: 60, typicalPriceRange: { low: 80, high: 150 }, keywords: ['trigger point', 'massage', 'knots', 'pain'] },
  { name: 'Myofascial Release', category: 'Massage', subcategory: 'Therapeutic', typicalDuration: 60, typicalPriceRange: { low: 90, high: 160 }, keywords: ['myofascial', 'fascia', 'release', 'massage'] },
  
  // MASSAGE - Relaxation
  { name: 'Swedish Massage (60 min)', category: 'Massage', subcategory: 'Relaxation', typicalDuration: 60, typicalPriceRange: { low: 70, high: 130 }, keywords: ['swedish', 'massage', 'relaxation', 'gentle'] },
  { name: 'Swedish Massage (90 min)', category: 'Massage', subcategory: 'Relaxation', typicalDuration: 90, typicalPriceRange: { low: 100, high: 180 }, keywords: ['swedish', 'massage', 'relaxation', 'gentle'] },
  { name: 'Hot Stone Massage', category: 'Massage', subcategory: 'Relaxation', typicalDuration: 75, typicalPriceRange: { low: 100, high: 180 }, keywords: ['hot stone', 'massage', 'relaxation', 'heated'] },
  { name: 'Aromatherapy Massage', category: 'Massage', subcategory: 'Relaxation', typicalDuration: 60, typicalPriceRange: { low: 80, high: 150 }, keywords: ['aromatherapy', 'massage', 'essential oils', 'relaxation'] },
  { name: 'Couples Massage', category: 'Massage', subcategory: 'Relaxation', typicalDuration: 60, typicalPriceRange: { low: 150, high: 300 }, keywords: ['couples', 'massage', 'together', 'relaxation'] },
  
  // MASSAGE - Sports
  { name: 'Sports Massage (60 min)', category: 'Massage', subcategory: 'Sports', typicalDuration: 60, typicalPriceRange: { low: 80, high: 150 }, keywords: ['sports', 'massage', 'athletic', 'recovery'] },
  { name: 'Pre-Event Massage', category: 'Massage', subcategory: 'Sports', typicalDuration: 30, typicalPriceRange: { low: 50, high: 90 }, keywords: ['pre-event', 'sports', 'massage', 'warm-up'] },
  { name: 'Post-Event Recovery Massage', category: 'Massage', subcategory: 'Sports', typicalDuration: 45, typicalPriceRange: { low: 60, high: 110 }, keywords: ['post-event', 'recovery', 'sports', 'massage'] },
  
  // MENTAL HEALTH - Therapy
  { name: 'Individual Therapy Session (50 min)', category: 'Mental Health', subcategory: 'Therapy', typicalDuration: 50, typicalPriceRange: { low: 100, high: 250 }, keywords: ['therapy', 'counseling', 'individual', 'mental health'] },
  { name: 'Individual Therapy Session (90 min)', category: 'Mental Health', subcategory: 'Therapy', typicalDuration: 90, typicalPriceRange: { low: 175, high: 400 }, keywords: ['therapy', 'counseling', 'extended', 'mental health'] },
  { name: 'Couples Therapy Session', category: 'Mental Health', subcategory: 'Therapy', typicalDuration: 60, typicalPriceRange: { low: 150, high: 300 }, keywords: ['couples', 'therapy', 'relationship', 'marriage'] },
  { name: 'Family Therapy Session', category: 'Mental Health', subcategory: 'Therapy', typicalDuration: 60, typicalPriceRange: { low: 150, high: 300 }, keywords: ['family', 'therapy', 'counseling'] },
  { name: 'EMDR Session', category: 'Mental Health', subcategory: 'Therapy', typicalDuration: 60, typicalPriceRange: { low: 150, high: 300 }, keywords: ['emdr', 'trauma', 'therapy', 'ptsd'] },
  
  // MENTAL HEALTH - Counseling
  { name: 'Initial Mental Health Assessment', category: 'Mental Health', subcategory: 'Counseling', typicalDuration: 90, typicalPriceRange: { low: 150, high: 350 }, keywords: ['assessment', 'intake', 'mental health', 'evaluation'] },
  { name: 'Life Coaching Session', category: 'Mental Health', subcategory: 'Counseling', typicalDuration: 60, typicalPriceRange: { low: 75, high: 200 }, keywords: ['coaching', 'life coach', 'goals', 'motivation'] },
  { name: 'Career Counseling', category: 'Mental Health', subcategory: 'Counseling', typicalDuration: 60, typicalPriceRange: { low: 100, high: 200 }, keywords: ['career', 'counseling', 'job', 'professional'] },
  
  // MENTAL HEALTH - Psychiatry
  { name: 'Psychiatric Evaluation', category: 'Mental Health', subcategory: 'Psychiatry', typicalDuration: 60, typicalPriceRange: { low: 200, high: 500 }, keywords: ['psychiatry', 'evaluation', 'diagnosis', 'medication'] },
  { name: 'Medication Management', category: 'Mental Health', subcategory: 'Psychiatry', typicalDuration: 20, typicalPriceRange: { low: 100, high: 300 }, keywords: ['medication', 'management', 'psychiatry', 'prescription'] },
  
  // MENTAL HEALTH - Group
  { name: 'Group Therapy Session', category: 'Mental Health', subcategory: 'Group', typicalDuration: 90, typicalPriceRange: { low: 40, high: 80 }, keywords: ['group', 'therapy', 'support', 'mental health'] },
  { name: 'Support Group (Drop-in)', category: 'Mental Health', subcategory: 'Group', typicalDuration: 90, typicalPriceRange: { low: 0, high: 30 }, keywords: ['support group', 'group', 'community'] },
  
  // SKINCARE - Facials
  { name: 'Basic Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 60, typicalPriceRange: { low: 60, high: 120 }, keywords: ['facial', 'skincare', 'cleansing', 'basic'] },
  { name: 'Deep Cleansing Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 75, typicalPriceRange: { low: 80, high: 150 }, keywords: ['facial', 'deep cleansing', 'extraction', 'acne'] },
  { name: 'Anti-Aging Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 75, typicalPriceRange: { low: 100, high: 200 }, keywords: ['facial', 'anti-aging', 'wrinkles', 'collagen'] },
  { name: 'Hydrating Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 60, typicalPriceRange: { low: 80, high: 150 }, keywords: ['facial', 'hydrating', 'moisture', 'dry skin'] },
  { name: 'LED Light Therapy Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 45, typicalPriceRange: { low: 75, high: 150 }, keywords: ['led', 'light therapy', 'facial', 'acne', 'anti-aging'] },
  { name: 'Oxygen Facial', category: 'Skincare', subcategory: 'Facials', typicalDuration: 60, typicalPriceRange: { low: 100, high: 200 }, keywords: ['oxygen', 'facial', 'glow', 'hydration'] },
  
  // SKINCARE - Treatments
  { name: 'Acne Treatment', category: 'Skincare', subcategory: 'Treatments', typicalDuration: 45, typicalPriceRange: { low: 75, high: 175 }, keywords: ['acne', 'treatment', 'breakout', 'blemish'] },
  { name: 'Rosacea Treatment', category: 'Skincare', subcategory: 'Treatments', typicalDuration: 45, typicalPriceRange: { low: 100, high: 200 }, keywords: ['rosacea', 'redness', 'treatment', 'sensitive'] },
  { name: 'Hyperpigmentation Treatment', category: 'Skincare', subcategory: 'Treatments', typicalDuration: 45, typicalPriceRange: { low: 100, high: 200 }, keywords: ['hyperpigmentation', 'dark spots', 'melasma', 'brightening'] },
  { name: 'Skin Consultation', category: 'Skincare', subcategory: 'Treatments', typicalDuration: 30, typicalPriceRange: { low: 0, high: 75 }, keywords: ['consultation', 'skin analysis', 'skincare', 'routine'] },
  
  // WELLNESS - General
  { name: 'IV Vitamin Therapy', category: 'Wellness', subcategory: 'Other', typicalDuration: 45, typicalPriceRange: { low: 100, high: 300 }, keywords: ['iv', 'vitamin', 'hydration', 'drip', 'infusion'] },
  { name: 'B12 Injection', category: 'Wellness', subcategory: 'Other', typicalDuration: 15, typicalPriceRange: { low: 20, high: 50 }, keywords: ['b12', 'injection', 'vitamin', 'energy'] },
  { name: 'Cryotherapy Session', category: 'Wellness', subcategory: 'Other', typicalDuration: 15, typicalPriceRange: { low: 40, high: 100 }, keywords: ['cryotherapy', 'cold', 'recovery', 'inflammation'] },
  { name: 'Float Tank Session', category: 'Wellness', subcategory: 'Other', typicalDuration: 60, typicalPriceRange: { low: 60, high: 100 }, keywords: ['float', 'sensory deprivation', 'relaxation', 'meditation'] },
  { name: 'Infrared Sauna Session', category: 'Wellness', subcategory: 'Other', typicalDuration: 45, typicalPriceRange: { low: 30, high: 60 }, keywords: ['sauna', 'infrared', 'detox', 'relaxation'] },
  { name: 'Acupuncture Session', category: 'Wellness', subcategory: 'Other', typicalDuration: 60, typicalPriceRange: { low: 75, high: 150 }, keywords: ['acupuncture', 'traditional', 'needles', 'pain'] },
  { name: 'Cupping Therapy', category: 'Wellness', subcategory: 'Other', typicalDuration: 45, typicalPriceRange: { low: 50, high: 100 }, keywords: ['cupping', 'therapy', 'circulation', 'muscle'] },
];

// --- WELLNESS/COSMETIC PROVIDERS ---
const wellnessProviders = [
  // Med Spas
  { name: 'Glow Med Spa Denver', type: 'Clinic', address: { city: 'Denver', state: 'CO', zip: '80206' }, contact: { phone: '303-555-1000' }, isPartner: true },
  { name: 'Rejuvenate Aesthetics', type: 'Clinic', address: { city: 'Denver', state: 'CO', zip: '80209' }, contact: { phone: '303-555-1001' }, isPartner: false },
  { name: 'Desert Glow Med Spa', type: 'Clinic', address: { city: 'Phoenix', state: 'AZ', zip: '85016' }, contact: { phone: '602-555-1000' }, isPartner: true },
  { name: 'Scottsdale Aesthetics', type: 'Clinic', address: { city: 'Scottsdale', state: 'AZ', zip: '85254' }, contact: { phone: '480-555-1000' }, isPartner: false },
  { name: 'Mountain Glow Bozeman', type: 'Clinic', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-555-1000' }, isPartner: true },
  
  // Fitness Centers
  { name: 'Peak Performance Fitness', type: 'Other', address: { city: 'Denver', state: 'CO', zip: '80205' }, contact: { phone: '303-555-2000' }, isPartner: true },
  { name: 'Bozeman Strength & Conditioning', type: 'Other', address: { city: 'Bozeman', state: 'MT', zip: '59718' }, contact: { phone: '406-555-2000' }, isPartner: true },
  { name: 'Phoenix Fit Studio', type: 'Other', address: { city: 'Phoenix', state: 'AZ', zip: '85004' }, contact: { phone: '602-555-2000' }, isPartner: false },
  { name: 'Dallas Elite Training', type: 'Other', address: { city: 'Dallas', state: 'TX', zip: '75201' }, contact: { phone: '214-555-2000' }, isPartner: true },
  
  // Massage & Wellness
  { name: 'Serenity Massage Denver', type: 'Other', address: { city: 'Denver', state: 'CO', zip: '80202' }, contact: { phone: '303-555-3000' }, isPartner: true },
  { name: 'Mountain Massage Bozeman', type: 'Other', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-555-3000' }, isPartner: true },
  { name: 'Desert Oasis Spa Phoenix', type: 'Other', address: { city: 'Phoenix', state: 'AZ', zip: '85008' }, contact: { phone: '602-555-3000' }, isPartner: false },
  
  // Mental Health
  { name: 'Denver Counseling Center', type: 'Clinic', address: { city: 'Denver', state: 'CO', zip: '80203' }, contact: { phone: '303-555-4000' }, isPartner: false },
  { name: 'Mind & Body Wellness Phoenix', type: 'Clinic', address: { city: 'Phoenix', state: 'AZ', zip: '85012' }, contact: { phone: '602-555-4000' }, isPartner: true },
  { name: 'Mountain Mind Therapy', type: 'Clinic', address: { city: 'Bozeman', state: 'MT', zip: '59715' }, contact: { phone: '406-555-4000' }, isPartner: true },
  
  // Skincare
  { name: 'Pure Skin Studio Denver', type: 'Other', address: { city: 'Denver', state: 'CO', zip: '80210' }, contact: { phone: '303-555-5000' }, isPartner: true },
  { name: 'Arizona Skin Wellness', type: 'Other', address: { city: 'Scottsdale', state: 'AZ', zip: '85251' }, contact: { phone: '480-555-5000' }, isPartner: false },
];

// --- PRICE MAPPING ---
const wellnessPriceMap = {
  'Clinic': {
    // Cosmetic - Injectables
    'Botox - Forehead Lines': { base: 280, variance: 50 },
    'Botox - Crows Feet': { base: 280, variance: 50 },
    'Botox - Frown Lines (Glabella)': { base: 280, variance: 50 },
    'Botox - Full Face': { base: 550, variance: 100 },
    'Lip Filler (1 syringe)': { base: 650, variance: 100 },
    'Cheek Filler (per syringe)': { base: 750, variance: 150 },
    'Jawline Filler': { base: 1100, variance: 200 },
    'Under Eye Filler': { base: 850, variance: 150 },
    'Kybella (Double Chin)': { base: 850, variance: 200 },
    // Skin Treatments
    'Chemical Peel - Light': { base: 125, variance: 30 },
    'Chemical Peel - Medium': { base: 225, variance: 50 },
    'Chemical Peel - Deep': { base: 400, variance: 100 },
    'Microneedling': { base: 300, variance: 75 },
    'Microneedling with PRP': { base: 550, variance: 100 },
    'HydraFacial': { base: 200, variance: 50 },
    'Dermaplaning': { base: 125, variance: 30 },
    'Microdermabrasion': { base: 150, variance: 40 },
    // Laser
    'Laser Hair Removal - Small Area': { base: 125, variance: 30 },
    'Laser Hair Removal - Medium Area': { base: 225, variance: 50 },
    'Laser Hair Removal - Large Area': { base: 350, variance: 75 },
    'IPL Photofacial': { base: 325, variance: 75 },
    'Laser Skin Resurfacing': { base: 1000, variance: 300 },
    // Body
    'CoolSculpting - Small Area': { base: 750, variance: 150 },
    'CoolSculpting - Large Area': { base: 1300, variance: 250 },
    'Body Sculpting - RF Treatment': { base: 500, variance: 100 },
    // Mental Health
    'Individual Therapy Session (50 min)': { base: 150, variance: 40 },
    'Individual Therapy Session (90 min)': { base: 250, variance: 60 },
    'Couples Therapy Session': { base: 200, variance: 50 },
    'Family Therapy Session': { base: 200, variance: 50 },
    'EMDR Session': { base: 200, variance: 50 },
    'Initial Mental Health Assessment': { base: 225, variance: 60 },
    'Life Coaching Session': { base: 125, variance: 40 },
    'Psychiatric Evaluation': { base: 350, variance: 100 },
    'Medication Management': { base: 175, variance: 50 },
    'Group Therapy Session': { base: 55, variance: 15 },
  },
  'Other': {
    // Fitness
    'Personal Training Session (1 hour)': { base: 85, variance: 25 },
    'Personal Training (5 session pack)': { base: 375, variance: 75 },
    'Personal Training (10 session pack)': { base: 650, variance: 150 },
    'Partner Training Session': { base: 110, variance: 30 },
    'Fitness Assessment': { base: 85, variance: 25 },
    'Body Composition Analysis': { base: 45, variance: 15 },
    'VO2 Max Testing': { base: 175, variance: 50 },
    'Movement Screening': { base: 125, variance: 35 },
    'Group Fitness Class (Drop-in)': { base: 22, variance: 8 },
    'Yoga Class (Drop-in)': { base: 20, variance: 7 },
    'Pilates Class (Drop-in)': { base: 28, variance: 8 },
    'Spin/Cycling Class': { base: 25, variance: 8 },
    'HIIT Class': { base: 25, variance: 8 },
    'Monthly Unlimited Classes': { base: 160, variance: 40 },
    'Nutrition Consultation': { base: 125, variance: 35 },
    'Meal Planning Package': { base: 175, variance: 50 },
    'Nutrition Follow-up': { base: 70, variance: 20 },
    // Massage
    'Deep Tissue Massage (60 min)': { base: 100, variance: 25 },
    'Deep Tissue Massage (90 min)': { base: 145, variance: 35 },
    'Trigger Point Therapy': { base: 105, variance: 25 },
    'Myofascial Release': { base: 115, variance: 30 },
    'Swedish Massage (60 min)': { base: 90, variance: 20 },
    'Swedish Massage (90 min)': { base: 130, variance: 30 },
    'Hot Stone Massage': { base: 130, variance: 30 },
    'Aromatherapy Massage': { base: 105, variance: 25 },
    'Couples Massage': { base: 200, variance: 50 },
    'Sports Massage (60 min)': { base: 105, variance: 25 },
    'Pre-Event Massage': { base: 65, variance: 15 },
    'Post-Event Recovery Massage': { base: 80, variance: 20 },
    // Skincare
    'Basic Facial': { base: 85, variance: 20 },
    'Deep Cleansing Facial': { base: 110, variance: 25 },
    'Anti-Aging Facial': { base: 140, variance: 35 },
    'Hydrating Facial': { base: 110, variance: 25 },
    'LED Light Therapy Facial': { base: 100, variance: 25 },
    'Oxygen Facial': { base: 140, variance: 35 },
    'Acne Treatment': { base: 115, variance: 30 },
    'Rosacea Treatment': { base: 140, variance: 35 },
    'Hyperpigmentation Treatment': { base: 140, variance: 35 },
    // Wellness
    'IV Vitamin Therapy': { base: 175, variance: 50 },
    'B12 Injection': { base: 30, variance: 10 },
    'Cryotherapy Session': { base: 60, variance: 20 },
    'Float Tank Session': { base: 75, variance: 20 },
    'Infrared Sauna Session': { base: 40, variance: 15 },
    'Acupuncture Session': { base: 100, variance: 30 },
    'Cupping Therapy': { base: 70, variance: 20 },
  }
};

// --- SEED FUNCTION ---
async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!\n');

    // Insert wellness services (don't delete existing)
    console.log('Inserting wellness & cosmetic services...');
    let insertedCount = 0;
    const serviceMap = {};
    
    for (const service of wellnessServices) {
      try {
        const existing = await Service.findOne({ name: service.name });
        if (existing) {
          serviceMap[service.name] = existing._id;
          console.log(`  Skipping (exists): ${service.name}`);
        } else {
          const newService = await Service.create(service);
          serviceMap[service.name] = newService._id;
          insertedCount++;
        }
      } catch (err) {
        console.log(`  Error inserting ${service.name}: ${err.message}`);
      }
    }
    console.log(`  Inserted ${insertedCount} new services\n`);

    // Insert wellness providers
    console.log('Inserting wellness providers...');
    let providerCount = 0;
    const insertedProviders = [];
    
    for (const provider of wellnessProviders) {
      try {
        const existing = await ClarityProvider.findOne({ name: provider.name });
        if (existing) {
          insertedProviders.push(existing);
          console.log(`  Skipping (exists): ${provider.name}`);
        } else {
          const newProvider = await ClarityProvider.create(provider);
          insertedProviders.push(newProvider);
          providerCount++;
        }
      } catch (err) {
        console.log(`  Error inserting ${provider.name}: ${err.message}`);
      }
    }
    console.log(`  Inserted ${providerCount} new providers\n`);

    // Generate prices
    console.log('Generating prices...');
    let priceCount = 0;
    
    for (const provider of insertedProviders) {
      const providerPrices = wellnessPriceMap[provider.type];
      if (!providerPrices) continue;

      for (const [serviceName, priceInfo] of Object.entries(providerPrices)) {
        const serviceId = serviceMap[serviceName];
        if (!serviceId) continue;

        // Check if price already exists
        const existingPrice = await Price.findOne({ serviceId, providerId: provider._id });
        if (existingPrice) continue;

        let price = priceInfo.base + Math.floor(Math.random() * priceInfo.variance * 2) - priceInfo.variance;
        
        if (provider.isPartner) {
          price = Math.round(price * 0.9);
        }

        try {
          await Price.create({
            serviceId,
            providerId: provider._id,
            cashPrice: price,
            priceSource: 'price_list',
            verified: provider.isPartner
          });
          priceCount++;
        } catch (err) {
          // Likely duplicate, skip
        }
      }
    }
    console.log(`  Inserted ${priceCount} new prices\n`);

    // Summary
    const totalServices = await Service.countDocuments();
    const totalProviders = await ClarityProvider.countDocuments();
    const totalPrices = await Price.countDocuments();
    
    console.log('=== SEED COMPLETE ===');
    console.log(`Total Services: ${totalServices}`);
    console.log(`Total Providers: ${totalProviders}`);
    console.log(`Total Prices: ${totalPrices}`);

    await mongoose.disconnect();
    console.log('\nDone!');
    
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
