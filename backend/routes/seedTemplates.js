const express = require('express');
const router = express.Router();
const ServiceTemplate = require('../models/ServiceTemplate');

const newTemplates = [
  // MEDICAL - Labs
  { providerType: 'Medical', category: 'Labs', name: 'Comprehensive Metabolic Panel (CMP)', description: '14-test blood chemistry panel measuring kidney function, blood sugar, and electrolytes.', shortDescription: 'Complete blood chemistry', suggestedPriceMin: 40, suggestedPriceMax: 75, suggestedDuration: 15, isPopular: true, sortOrder: 1 },
  { providerType: 'Medical', category: 'Labs', name: 'Complete Blood Count (CBC)', description: 'Blood cell count analysis including red cells, white cells, and platelets.', shortDescription: 'Blood cell analysis', suggestedPriceMin: 25, suggestedPriceMax: 50, suggestedDuration: 15, isPopular: true, sortOrder: 2 },
  { providerType: 'Medical', category: 'Labs', name: 'Lipid Panel', description: 'Cholesterol and triglyceride testing for heart health assessment.', shortDescription: 'Cholesterol testing', suggestedPriceMin: 35, suggestedPriceMax: 75, suggestedDuration: 15, isPopular: true, sortOrder: 3 },
  { providerType: 'Medical', category: 'Labs', name: 'Hemoglobin A1c', description: '3-month blood sugar average test for diabetes monitoring.', shortDescription: 'Diabetes monitoring', suggestedPriceMin: 30, suggestedPriceMax: 60, suggestedDuration: 15, isPopular: true, sortOrder: 4 },
  { providerType: 'Medical', category: 'Labs', name: 'Thyroid Panel', description: 'Complete thyroid function test including TSH, T3, and T4.', shortDescription: 'Thyroid function test', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 15, isPopular: false, sortOrder: 5 },
  { providerType: 'Medical', category: 'Labs', name: 'Vitamin D Test', description: 'Vitamin D level assessment.', shortDescription: 'Vitamin D levels', suggestedPriceMin: 50, suggestedPriceMax: 90, suggestedDuration: 15, isPopular: false, sortOrder: 6 },
  { providerType: 'Medical', category: 'Labs', name: 'STD Panel', description: 'Comprehensive sexually transmitted disease screening.', shortDescription: 'STD screening', suggestedPriceMin: 100, suggestedPriceMax: 250, suggestedDuration: 15, isPopular: false, sortOrder: 7 },
  { providerType: 'Medical', category: 'Labs', name: 'Hormone Panel', description: 'Hormone level testing including testosterone or estrogen.', shortDescription: 'Hormone testing', suggestedPriceMin: 125, suggestedPriceMax: 250, suggestedDuration: 15, isPopular: false, sortOrder: 8 },

  // MEDICAL - Immunizations
  { providerType: 'Medical', category: 'Immunizations', name: 'Flu Shot', description: 'Seasonal influenza vaccination.', shortDescription: 'Annual flu vaccine', suggestedPriceMin: 25, suggestedPriceMax: 50, suggestedDuration: 15, isPopular: true, sortOrder: 1 },
  { providerType: 'Medical', category: 'Immunizations', name: 'COVID-19 Vaccine', description: 'COVID-19 vaccination or booster.', shortDescription: 'COVID vaccine', suggestedPriceMin: 0, suggestedPriceMax: 75, suggestedDuration: 20, isPopular: true, sortOrder: 2 },
  { providerType: 'Medical', category: 'Immunizations', name: 'Tdap Vaccine', description: 'Tetanus, diphtheria, and pertussis booster.', shortDescription: 'Tdap booster', suggestedPriceMin: 45, suggestedPriceMax: 85, suggestedDuration: 15, isPopular: false, sortOrder: 3 },
  { providerType: 'Medical', category: 'Immunizations', name: 'Shingles Vaccine', description: 'Shingrix shingles prevention vaccine.', shortDescription: 'Shingles prevention', suggestedPriceMin: 150, suggestedPriceMax: 250, suggestedDuration: 15, isPopular: false, sortOrder: 4 },
  { providerType: 'Medical', category: 'Immunizations', name: 'Hepatitis B Vaccine', description: 'Hepatitis B vaccination series.', shortDescription: 'Hep B vaccine', suggestedPriceMin: 60, suggestedPriceMax: 120, suggestedDuration: 15, isPopular: false, sortOrder: 5 },
  { providerType: 'Medical', category: 'Immunizations', name: 'Pneumonia Vaccine', description: 'Pneumococcal vaccination for pneumonia prevention.', shortDescription: 'Pneumonia prevention', suggestedPriceMin: 100, suggestedPriceMax: 200, suggestedDuration: 15, isPopular: false, sortOrder: 6 },

  // MEDICAL - Screenings
  { providerType: 'Medical', category: 'Screenings', name: 'Health Risk Assessment', description: 'Comprehensive health screening and risk evaluation.', shortDescription: 'Health risk evaluation', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 30, isPopular: true, sortOrder: 1 },
  { providerType: 'Medical', category: 'Screenings', name: 'Vision Screening', description: 'Basic vision acuity test.', shortDescription: 'Vision test', suggestedPriceMin: 25, suggestedPriceMax: 50, suggestedDuration: 15, isPopular: false, sortOrder: 2 },
  { providerType: 'Medical', category: 'Screenings', name: 'Hearing Test', description: 'Audiometry hearing assessment.', shortDescription: 'Hearing assessment', suggestedPriceMin: 40, suggestedPriceMax: 80, suggestedDuration: 20, isPopular: false, sortOrder: 3 },
  { providerType: 'Medical', category: 'Screenings', name: 'TB Skin Test', description: 'Tuberculosis screening via PPD test.', shortDescription: 'TB screening', suggestedPriceMin: 30, suggestedPriceMax: 60, suggestedDuration: 15, isPopular: false, sortOrder: 4 },

  // MEDICAL - Wellness
  { providerType: 'Medical', category: 'Wellness', name: 'Executive Health Panel', description: 'Comprehensive wellness panel with multiple lab tests.', shortDescription: 'Premium health panel', suggestedPriceMin: 300, suggestedPriceMax: 500, suggestedDuration: 60, isPopular: true, sortOrder: 1 },
  { providerType: 'Medical', category: 'Wellness', name: 'Mens Health Panel', description: 'Comprehensive male health screening including PSA and testosterone.', shortDescription: 'Mens screening', suggestedPriceMin: 150, suggestedPriceMax: 275, suggestedDuration: 30, isPopular: false, sortOrder: 2 },
  { providerType: 'Medical', category: 'Wellness', name: 'Womens Health Panel', description: 'Comprehensive female health screening including hormone levels.', shortDescription: 'Womens screening', suggestedPriceMin: 150, suggestedPriceMax: 300, suggestedDuration: 30, isPopular: false, sortOrder: 3 },

  // URGENT CARE - Labs
  { providerType: 'Urgent Care', category: 'Labs', name: 'Basic Metabolic Panel', description: 'Essential blood chemistry test for urgent evaluation.', shortDescription: 'Basic blood chemistry', suggestedPriceMin: 35, suggestedPriceMax: 65, suggestedDuration: 15, isPopular: true, sortOrder: 1 },
  { providerType: 'Urgent Care', category: 'Labs', name: 'Complete Blood Count', description: 'Blood cell count for infection or anemia evaluation.', shortDescription: 'Blood cell count', suggestedPriceMin: 25, suggestedPriceMax: 50, suggestedDuration: 15, isPopular: true, sortOrder: 2 },
  { providerType: 'Urgent Care', category: 'Labs', name: 'Urinalysis', description: 'Urine test for UTI or kidney issues.', shortDescription: 'Urine analysis', suggestedPriceMin: 20, suggestedPriceMax: 45, suggestedDuration: 15, isPopular: true, sortOrder: 3 },
  { providerType: 'Urgent Care', category: 'Labs', name: 'Drug Screen', description: '10-panel drug screening test.', shortDescription: 'Drug testing', suggestedPriceMin: 45, suggestedPriceMax: 85, suggestedDuration: 15, isPopular: false, sortOrder: 4 },

  // URGENT CARE - Rapid Tests
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Rapid COVID Test', description: 'COVID-19 antigen rapid test with results in 15-20 minutes.', shortDescription: 'Quick COVID results', suggestedPriceMin: 30, suggestedPriceMax: 75, suggestedDuration: 20, isPopular: true, sortOrder: 1 },
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Rapid Flu Test', description: 'Influenza A/B rapid test with quick results.', shortDescription: 'Quick flu results', suggestedPriceMin: 35, suggestedPriceMax: 65, suggestedDuration: 15, isPopular: true, sortOrder: 2 },
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Rapid Strep Test', description: 'Strep throat rapid antigen test.', shortDescription: 'Quick strep results', suggestedPriceMin: 30, suggestedPriceMax: 60, suggestedDuration: 15, isPopular: true, sortOrder: 3 },
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Rapid Mono Test', description: 'Mononucleosis rapid screening test.', shortDescription: 'Quick mono results', suggestedPriceMin: 35, suggestedPriceMax: 70, suggestedDuration: 15, isPopular: false, sortOrder: 4 },
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Pregnancy Test', description: 'Urine pregnancy test with immediate results.', shortDescription: 'Quick pregnancy test', suggestedPriceMin: 15, suggestedPriceMax: 35, suggestedDuration: 10, isPopular: false, sortOrder: 5 },
  { providerType: 'Urgent Care', category: 'Rapid Tests', name: 'Blood Glucose Test', description: 'Fingerstick blood sugar test.', shortDescription: 'Quick glucose check', suggestedPriceMin: 10, suggestedPriceMax: 30, suggestedDuration: 10, isPopular: false, sortOrder: 6 },

  // URGENT CARE - IV Therapy
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Basic Hydration IV', description: 'IV fluid hydration for dehydration.', shortDescription: 'Hydration treatment', suggestedPriceMin: 100, suggestedPriceMax: 175, suggestedDuration: 45, isPopular: true, sortOrder: 1 },
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Immune Boost IV', description: 'IV vitamin infusion with vitamin C and zinc for immune support.', shortDescription: 'Immune support', suggestedPriceMin: 150, suggestedPriceMax: 225, suggestedDuration: 45, isPopular: true, sortOrder: 2 },
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Hangover Relief IV', description: 'IV hydration with anti-nausea medication and vitamins.', shortDescription: 'Hangover recovery', suggestedPriceMin: 150, suggestedPriceMax: 225, suggestedDuration: 45, isPopular: true, sortOrder: 3 },
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Myers Cocktail IV', description: 'Classic vitamin and mineral IV infusion.', shortDescription: 'Vitamin infusion', suggestedPriceMin: 175, suggestedPriceMax: 300, suggestedDuration: 60, isPopular: false, sortOrder: 4 },
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Migraine Relief IV', description: 'IV treatment for migraine with fluids and medication.', shortDescription: 'Migraine treatment', suggestedPriceMin: 150, suggestedPriceMax: 250, suggestedDuration: 45, isPopular: false, sortOrder: 5 },
  { providerType: 'Urgent Care', category: 'IV Therapy', name: 'Energy Boost IV', description: 'B-vitamin and amino acid IV for energy.', shortDescription: 'Energy boost', suggestedPriceMin: 175, suggestedPriceMax: 275, suggestedDuration: 45, isPopular: false, sortOrder: 6 },

  // URGENT CARE - Immunizations
  { providerType: 'Urgent Care', category: 'Immunizations', name: 'Flu Shot', description: 'Seasonal influenza vaccination.', shortDescription: 'Annual flu vaccine', suggestedPriceMin: 25, suggestedPriceMax: 50, suggestedDuration: 15, isPopular: true, sortOrder: 1 },
  { providerType: 'Urgent Care', category: 'Immunizations', name: 'COVID-19 Vaccine', description: 'COVID-19 vaccination or booster.', shortDescription: 'COVID vaccine', suggestedPriceMin: 0, suggestedPriceMax: 75, suggestedDuration: 20, isPopular: true, sortOrder: 2 },
  { providerType: 'Urgent Care', category: 'Immunizations', name: 'Tetanus Shot', description: 'Tetanus booster for wound care.', shortDescription: 'Tetanus booster', suggestedPriceMin: 40, suggestedPriceMax: 80, suggestedDuration: 15, isPopular: true, sortOrder: 3 },
  { providerType: 'Urgent Care', category: 'Immunizations', name: 'Hepatitis Vaccines', description: 'Hepatitis A or B vaccination.', shortDescription: 'Hepatitis vaccine', suggestedPriceMin: 60, suggestedPriceMax: 120, suggestedDuration: 15, isPopular: false, sortOrder: 4 },

  // URGENT CARE - Screenings
  { providerType: 'Urgent Care', category: 'Screenings', name: 'Sports Physical', description: 'Physical exam for sports participation clearance.', shortDescription: 'Sports clearance', suggestedPriceMin: 50, suggestedPriceMax: 100, suggestedDuration: 30, isPopular: true, sortOrder: 1 },
  { providerType: 'Urgent Care', category: 'Screenings', name: 'DOT Physical', description: 'Department of Transportation physical for commercial drivers.', shortDescription: 'CDL physical', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 45, isPopular: true, sortOrder: 2 },
  { providerType: 'Urgent Care', category: 'Screenings', name: 'Pre-Employment Physical', description: 'Physical exam for employment requirements.', shortDescription: 'Employment physical', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 30, isPopular: true, sortOrder: 3 },
  { providerType: 'Urgent Care', category: 'Screenings', name: 'TB Skin Test', description: 'Tuberculosis PPD screening test.', shortDescription: 'TB screening', suggestedPriceMin: 30, suggestedPriceMax: 60, suggestedDuration: 15, isPopular: false, sortOrder: 4 },

  // SKINCARE - IV Therapy
  { providerType: 'Skincare', category: 'IV Therapy', name: 'Beauty Drip IV', description: 'IV infusion with biotin, vitamin C, and glutathione for skin health.', shortDescription: 'Skin glow IV', suggestedPriceMin: 175, suggestedPriceMax: 300, suggestedDuration: 45, isPopular: true, sortOrder: 1 },
  { providerType: 'Skincare', category: 'IV Therapy', name: 'Glutathione IV', description: 'Antioxidant IV for skin brightening.', shortDescription: 'Skin brightening', suggestedPriceMin: 150, suggestedPriceMax: 250, suggestedDuration: 30, isPopular: false, sortOrder: 2 },
  { providerType: 'Skincare', category: 'IV Therapy', name: 'NAD+ IV Therapy', description: 'NAD+ infusion for cellular rejuvenation.', shortDescription: 'Cellular rejuvenation', suggestedPriceMin: 400, suggestedPriceMax: 750, suggestedDuration: 90, isPopular: false, sortOrder: 3 },

  // SKINCARE - Laser
  { providerType: 'Skincare', category: 'Laser', name: 'Laser Hair Removal', description: 'Laser hair removal treatment for permanent hair reduction.', shortDescription: 'Permanent hair reduction', suggestedPriceMin: 150, suggestedPriceMax: 400, suggestedDuration: 30, isPopular: true, sortOrder: 1 },
  { providerType: 'Skincare', category: 'Laser', name: 'IPL Photofacial', description: 'Intense pulsed light treatment for sun damage and pigmentation.', shortDescription: 'Sun damage treatment', suggestedPriceMin: 250, suggestedPriceMax: 450, suggestedDuration: 45, isPopular: true, sortOrder: 2 },
  { providerType: 'Skincare', category: 'Laser', name: 'Laser Skin Resurfacing', description: 'Fractional laser treatment for wrinkles and texture.', shortDescription: 'Skin resurfacing', suggestedPriceMin: 400, suggestedPriceMax: 800, suggestedDuration: 60, isPopular: false, sortOrder: 3 },
  { providerType: 'Skincare', category: 'Laser', name: 'Laser Tattoo Removal', description: 'Laser treatment for tattoo removal.', shortDescription: 'Tattoo removal', suggestedPriceMin: 150, suggestedPriceMax: 400, suggestedDuration: 30, isPopular: false, sortOrder: 4 },

  // FITNESS - Assessment
  { providerType: 'Fitness', category: 'Assessment', name: 'Fitness Assessment', description: 'Comprehensive fitness evaluation including body composition and strength testing.', shortDescription: 'Fitness evaluation', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 60, isPopular: true, sortOrder: 1 },
  { providerType: 'Fitness', category: 'Assessment', name: 'Movement Screening', description: 'Functional movement assessment to identify imbalances.', shortDescription: 'Movement analysis', suggestedPriceMin: 50, suggestedPriceMax: 100, suggestedDuration: 45, isPopular: false, sortOrder: 2 },

  // MENTAL HEALTH - Assessment, Therapy, Virtual
  { providerType: 'Mental Health', category: 'Assessment', name: 'Mental Health Assessment', description: 'Comprehensive psychological evaluation and treatment planning.', shortDescription: 'Psych evaluation', suggestedPriceMin: 150, suggestedPriceMax: 300, suggestedDuration: 60, isPopular: true, sortOrder: 1 },
  { providerType: 'Mental Health', category: 'Therapy', name: 'Individual Therapy', description: 'One-on-one psychotherapy session.', shortDescription: 'Individual session', suggestedPriceMin: 100, suggestedPriceMax: 200, suggestedDuration: 50, isPopular: true, sortOrder: 1 },
  { providerType: 'Mental Health', category: 'Therapy', name: 'Couples Therapy', description: 'Relationship counseling session for couples.', shortDescription: 'Couples session', suggestedPriceMin: 150, suggestedPriceMax: 275, suggestedDuration: 60, isPopular: true, sortOrder: 2 },
  { providerType: 'Mental Health', category: 'Virtual', name: 'Telehealth Therapy', description: 'Virtual therapy session via video call.', shortDescription: 'Online therapy', suggestedPriceMin: 75, suggestedPriceMax: 175, suggestedDuration: 50, isPopular: true, sortOrder: 1 },

  // NUTRITION - Consultation, Coaching
  { providerType: 'Nutrition', category: 'Consultation', name: 'Initial Nutrition Consultation', description: 'Comprehensive nutrition assessment and personalized plan.', shortDescription: 'Nutrition assessment', suggestedPriceMin: 100, suggestedPriceMax: 200, suggestedDuration: 60, isPopular: true, sortOrder: 1 },
  { providerType: 'Nutrition', category: 'Consultation', name: 'Follow-up Nutrition Visit', description: 'Progress review and plan adjustment.', shortDescription: 'Progress review', suggestedPriceMin: 50, suggestedPriceMax: 100, suggestedDuration: 30, isPopular: true, sortOrder: 2 },
  { providerType: 'Nutrition', category: 'Coaching', name: 'Weight Loss Coaching', description: 'Ongoing weight management support and accountability.', shortDescription: 'Weight management', suggestedPriceMin: 75, suggestedPriceMax: 150, suggestedDuration: 45, isPopular: true, sortOrder: 1 },

  // PHARMACY - Compounding, Immunizations, Consultation
  { providerType: 'Pharmacy/Rx', category: 'Compounding', name: 'Custom Medication Compounding', description: 'Personalized medication preparation consultation.', shortDescription: 'Custom medications', suggestedPriceMin: 25, suggestedPriceMax: 75, suggestedDuration: 30, isPopular: true, sortOrder: 1 },
  { providerType: 'Pharmacy/Rx', category: 'Immunizations', name: 'Pharmacy Flu Shot', description: 'Convenient flu vaccination at pharmacy.', shortDescription: 'Flu vaccine', suggestedPriceMin: 20, suggestedPriceMax: 45, suggestedDuration: 15, isPopular: true, sortOrder: 1 },
  { providerType: 'Pharmacy/Rx', category: 'Immunizations', name: 'Pharmacy COVID Vaccine', description: 'COVID-19 vaccination at pharmacy.', shortDescription: 'COVID vaccine', suggestedPriceMin: 0, suggestedPriceMax: 50, suggestedDuration: 20, isPopular: true, sortOrder: 2 },
  { providerType: 'Pharmacy/Rx', category: 'Consultation', name: 'Medication Review', description: 'Pharmacist consultation to review all medications.', shortDescription: 'Med review', suggestedPriceMin: 25, suggestedPriceMax: 75, suggestedDuration: 30, isPopular: false, sortOrder: 1 },
];

// POST /api/service-templates/seed - One-time seed endpoint
router.post('/seed', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple protection
    if (adminKey !== 'findr-seed-2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    let added = 0;
    let skipped = 0;
    const results = [];
    
    for (const template of newTemplates) {
      const exists = await ServiceTemplate.findOne({
        providerType: template.providerType,
        category: template.category,
        name: template.name
      });
      
      if (exists) {
        skipped++;
        continue;
      }
      
      await ServiceTemplate.create(template);
      added++;
      results.push(`${template.providerType} > ${template.category} > ${template.name}`);
    }
    
    res.json({
      success: true,
      added,
      skipped,
      total: newTemplates.length,
      addedTemplates: results
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
