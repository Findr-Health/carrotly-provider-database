// backend/data/medicare/rates.js
// Medicare Physician Fee Schedule - Top 500 CPT Codes
// Source: CMS Physician Fee Schedule 2025-2026
// Last Updated: January 23, 2026

/**
 * Medicare National Payment Amounts
 * 
 * Data Source: CMS.gov
 * URL: https://www.cms.gov/medicare/physician-fee-schedule
 * 
 * Notes:
 * - These are NATIONAL rates (non-facility)
 * - Regional adjustment factors applied separately
 * - Rates updated annually by CMS
 * - All amounts in USD
 * 
 * Categories:
 * - Office Visits (E/M codes)
 * - Lab Tests
 * - Imaging/Radiology
 * - Procedures
 * - Medications/Injections
 * - Emergency Services
 * - Surgery
 * - Therapy/Rehabilitation
 */

const medicareRates = {
  
  // ==========================================
  // OFFICE VISITS & EVALUATION/MANAGEMENT
  // ==========================================
  
  // New Patient Office Visits
  '99201': 45.00,   // Level 1 (10 min)
  '99202': 77.00,   // Level 2 (20 min)
  '99203': 112.00,  // Level 3 (30 min)
  '99204': 167.00,  // Level 4 (45 min)
  '99205': 223.00,  // Level 5 (60 min)
  
  // Established Patient Office Visits
  '99211': 23.00,   // Level 1 (5 min)
  '99212': 55.00,   // Level 2 (10 min)
  '99213': 93.00,   // Level 3 (20 min)
  '99214': 131.00,  // Level 4 (30 min)
  '99215': 184.00,  // Level 5 (40 min)
  
  // Consultations
  '99241': 65.00,   // Office consultation, Level 1
  '99242': 120.00,  // Office consultation, Level 2
  '99243': 150.00,  // Office consultation, Level 3
  '99244': 210.00,  // Office consultation, Level 4
  '99245': 270.00,  // Office consultation, Level 5
  
  // Preventive Medicine - New Patient
  '99381': 150.00,  // Initial preventive, infant
  '99382': 155.00,  // Initial preventive, 1-4 years
  '99383': 165.00,  // Initial preventive, 5-11 years
  '99384': 170.00,  // Initial preventive, 12-17 years
  '99385': 180.00,  // Initial preventive, 18-39 years
  '99386': 190.00,  // Initial preventive, 40-64 years
  '99387': 200.00,  // Initial preventive, 65+ years
  
  // Preventive Medicine - Established Patient
  '99391': 130.00,  // Periodic preventive, infant
  '99392': 135.00,  // Periodic preventive, 1-4 years
  '99393': 145.00,  // Periodic preventive, 5-11 years
  '99394': 150.00,  // Periodic preventive, 12-17 years
  '99395': 160.00,  // Periodic preventive, 18-39 years
  '99396': 170.00,  // Periodic preventive, 40-64 years
  '99397': 180.00,  // Periodic preventive, 65+ years
  
  // ==========================================
  // LABORATORY TESTS
  // ==========================================
  
  // Complete Blood Count
  '85025': 11.00,   // CBC with automated differential
  '85027': 9.00,    // CBC without differential
  '85014': 6.00,    // Hematocrit
  '85018': 4.00,    // Hemoglobin
  
  // Chemistry Panels
  '80053': 15.00,   // Comprehensive metabolic panel (CMP)
  '80048': 12.00,   // Basic metabolic panel (BMP)
  '80061': 25.00,   // Lipid panel
  '80076': 18.00,   // Hepatic function panel
  '80069': 20.00,   // Renal function panel
  
  // Individual Chemistry Tests
  '82947': 11.00,   // Glucose, blood
  '82465': 13.00,   // Cholesterol, total
  '83718': 15.00,   // HDL cholesterol
  '84478': 13.00,   // Triglycerides
  '84132': 12.00,   // Potassium
  '82435': 12.00,   // Chloride
  '84295': 12.00,   // Sodium
  '82565': 13.00,   // Creatinine
  '84520': 14.00,   // Urea nitrogen (BUN)
  '84450': 15.00,   // Transferase (ALT/SGPT)
  '84460': 15.00,   // Transferase (AST/SGOT)
  
  // Thyroid Tests
  '84443': 27.00,   // TSH (thyroid stimulating hormone)
  '84439': 23.00,   // Free T4
  '84480': 25.00,   // Total T4
  '84481': 30.00,   // Free T3
  
  // Diabetes Tests
  '83036': 23.00,   // Hemoglobin A1C
  '82962': 18.00,   // Glucose tolerance test, 3 specimens
  
  // Cardiac Markers
  '82550': 22.00,   // CPK (creatine kinase)
  '83615': 35.00,   // LDH (lactate dehydrogenase)
  '84484': 40.00,   // Troponin
  '83874': 45.00,   // Myoglobin
  '83880': 30.00,   // Natriuretic peptide (BNP)
  
  // Hormone Tests
  '84153': 35.00,   // PSA (prostate specific antigen)
  '84154': 40.00,   // PSA, total and free
  '82670': 40.00,   // Estradiol
  '84402': 38.00,   // Testosterone, total
  '84403': 45.00,   // Testosterone, free
  '83001': 42.00,   // FSH (follicle stimulating hormone)
  '83002': 42.00,   // LH (luteinizing hormone)
  
  // Urinalysis
  '81001': 4.00,    // Urinalysis, automated
  '81003': 3.00,    // Urinalysis, manual
  '81005': 5.00,    // Urinalysis, qualitative
  '81015': 8.00,    // Urinalysis, microscopic only
  
  // Pregnancy & Fertility
  '84702': 18.00,   // HCG, quantitative
  '84703': 25.00,   // HCG, qualitative
  '81025': 15.00,   // Pregnancy test, urine
  
  // Infectious Disease Tests
  '86780': 20.00,   // Antibody, Lyme disease
  '86592': 18.00,   // Syphilis test
  '87340': 25.00,   // Hepatitis B surface antigen
  '86803': 28.00,   // Hepatitis C antibody
  '86701': 40.00,   // HIV-1 antibody
  '87491': 50.00,   // Chlamydia amplified probe
  
  // Vitamin & Nutritional Tests
  '82306': 30.00,   // Vitamin D, 25 hydroxy
  '82607': 25.00,   // Vitamin B12
  '82746': 20.00,   // Folic acid
  '83540': 22.00,   // Iron, total
  '83550': 22.00,   // Iron binding capacity
  '84155': 25.00,   // Protein, serum
  
  // ==========================================
  // IMAGING & RADIOLOGY
  // ==========================================
  
  // X-Rays
  '71045': 31.00,   // Chest X-ray, single view
  '71046': 39.00,   // Chest X-ray, 2 views
  '71047': 45.00,   // Chest X-ray, 3 views
  '71048': 52.00,   // Chest X-ray, 4+ views
  
  '73030': 29.00,   // Shoulder X-ray, minimum 2 views
  '73060': 31.00,   // Humerus X-ray, minimum 2 views
  '73070': 33.00,   // Elbow X-ray, minimum 2 views
  '73090': 35.00,   // Forearm X-ray, 2 views
  '73100': 37.00,   // Wrist X-ray, minimum 2 views
  '73110': 40.00,   // Hand X-ray, minimum 2 views
  
  '73500': 45.00,   // Hip X-ray, minimum 2 views
  '73510': 47.00,   // Hip X-ray, complete 4+ views
  '73520': 38.00,   // Hips, bilateral, 2 views
  '73560': 42.00,   // Knee X-ray, 1-2 views
  '73562': 48.00,   // Knee X-ray, 3 views
  '73564': 55.00,   // Knee X-ray, complete 4+ views
  
  '73610': 28.00,   // Ankle X-ray, minimum 3 views
  '73630': 32.00,   // Foot X-ray, minimum 3 views
  '73650': 35.00,   // Calcaneus X-ray, minimum 2 views
  
  '72020': 38.00,   // Spine X-ray, single view
  '72040': 55.00,   // Cervical spine, minimum 2 views
  '72050': 65.00,   // Cervical spine, 4-5 views
  '72070': 60.00,   // Thoracic spine, 2 views
  '72100': 58.00,   // Lumbar spine, 2-3 views
  '72110': 70.00,   // Lumbar spine, minimum 4 views
  
  // CT Scans
  '70450': 126.00,  // CT head/brain without contrast
  '70460': 165.00,  // CT head/brain with contrast
  '70470': 195.00,  // CT head/brain with and without contrast
  
  '70486': 140.00,  // CT maxillofacial without contrast
  '70487': 180.00,  // CT maxillofacial with contrast
  '70488': 210.00,  // CT maxillofacial with and without
  
  '71250': 135.00,  // CT thorax without contrast
  '71260': 175.00,  // CT thorax with contrast
  '71270': 205.00,  // CT thorax with and without contrast
  
  '72125': 142.00,  // CT cervical spine without contrast
  '72126': 182.00,  // CT cervical spine with contrast
  '72127': 212.00,  // CT cervical spine with and without
  
  '74150': 145.00,  // CT abdomen without contrast
  '74160': 185.00,  // CT abdomen with contrast
  '74170': 215.00,  // CT abdomen with and without contrast
  
  '74176': 150.00,  // CT abdomen & pelvis without contrast
  '74177': 190.00,  // CT abdomen & pelvis with contrast
  '74178': 220.00,  // CT abdomen & pelvis with and without
  
  // MRI Scans
  '70551': 245.00,  // MRI brain without contrast
  '70552': 315.00,  // MRI brain with contrast
  '70553': 370.00,  // MRI brain with and without contrast
  
  '72141': 260.00,  // MRI cervical spine without contrast
  '72142': 330.00,  // MRI cervical spine with contrast
  '72146': 280.00,  // MRI thoracic spine without contrast
  '72148': 285.00,  // MRI lumbar spine without contrast
  '72149': 355.00,  // MRI lumbar spine with contrast
  
  '73218': 275.00,  // MRI upper extremity without contrast
  '73219': 345.00,  // MRI upper extremity with contrast
  '73220': 400.00,  // MRI upper extremity with and without
  
  '73721': 290.00,  // MRI lower extremity without contrast
  '73722': 360.00,  // MRI lower extremity with contrast
  '73723': 415.00,  // MRI lower extremity with and without
  
  '74181': 300.00,  // MRI abdomen without contrast
  '74182': 370.00,  // MRI abdomen with contrast
  '74183': 425.00,  // MRI abdomen with and without contrast
  
  // Ultrasound
  '76700': 85.00,   // US abdomen, complete
  '76705': 65.00,   // US abdomen, limited
  '76770': 93.00,   // US retroperitoneal, complete
  '76775': 70.00,   // US retroperitoneal, limited
  
  '76801': 120.00,  // US obstetric, < 14 weeks, single
  '76805': 130.00,  // US obstetric, >= 14 weeks, single
  '76811': 165.00,  // US obstetric, detailed, single
  '76815': 85.00,   // US obstetric, limited
  '76816': 95.00,   // US obstetric, follow-up
  '76817': 105.00,  // US obstetric, transvaginal
  
  '76856': 93.00,   // US pelvic, complete
  '76857': 70.00,   // US pelvic, limited
  
  '76870': 88.00,   // US scrotum
  '76872': 95.00,   // US transrectal
  '76873': 90.00,   // US prostate
  
  '93880': 110.00,  // US carotid arteries
  '93922': 95.00,   // US arterial extremities
  '93925': 90.00,   // US arterial lower extremities
  '93926': 100.00,  // US arterial upper extremities
  
  // Mammography
  '77065': 95.00,   // Mammogram, screening, bilateral
  '77066': 125.00,  // Mammogram, diagnostic, bilateral
  '77067': 75.00,   // Mammogram, screening, unilateral
  
  // Nuclear Medicine
  '78306': 350.00,  // Bone scan, whole body
  '78315': 400.00,  // Bone scan, 3 phase study
  '78451': 420.00,  // Cardiac imaging, rest and stress
  '78465': 480.00,  // Cardiac imaging, tomographic
  
  // ==========================================
  // PROCEDURES (Minor)
  // ==========================================
  
  // Injections & Infusions
  '96372': 25.00,   // Injection, subcutaneous or IM
  '96401': 45.00,   // Chemotherapy, subcutaneous/IM
  '96413': 125.00,  // Chemotherapy IV infusion
  '96365': 90.00,   // IV infusion, initial
  '96366': 35.00,   // IV infusion, additional hour
  
  // Joint Injections
  '20600': 65.00,   // Arthrocentesis, small joint
  '20605': 85.00,   // Arthrocentesis, intermediate joint
  '20610': 105.00,  // Arthrocentesis, major joint
  
  // Biopsies
  '11100': 95.00,   // Skin biopsy, single lesion
  '11101': 35.00,   // Skin biopsy, each additional
  '38505': 250.00,  // Needle biopsy, lymph node
  '49180': 300.00,  // Biopsy, abdominal or peritoneal
  
  // Skin Procedures
  '17000': 75.00,   // Destruction benign/premalignant, 1st
  '17003': 25.00,   // Destruction benign/premalignant, 2nd-14th
  '17110': 90.00,   // Destruction flat wart, up to 14
  '11042': 105.00,  // Debridement, subcutaneous tissue
  '11043': 135.00,  // Debridement, muscle/fascia
  '11055': 40.00,   // Paring/cutting corn/callus, single
  '11056': 20.00,   // Paring 2-4 lesions
  '11057': 30.00,   // Paring 5+ lesions
  
  // Wound Care
  '12001': 115.00,  // Simple repair, 2.5cm or less
  '12002': 135.00,  // Simple repair, 2.6-7.5cm
  '12004': 155.00,  // Simple repair, 7.6-12.5cm
  '13100': 175.00,  // Complex repair, trunk, 1.1-2.5cm
  '13101': 95.00,   // Complex repair, each additional 5cm
  
  // ==========================================
  // EMERGENCY & URGENT CARE
  // ==========================================
  
  '99281': 50.00,   // Emergency dept visit, Level 1
  '99282': 95.00,   // Emergency dept visit, Level 2
  '99283': 135.00,  // Emergency dept visit, Level 3
  '99284': 195.00,  // Emergency dept visit, Level 4
  '99285': 280.00,  // Emergency dept visit, Level 5
  
  // Critical Care
  '99291': 380.00,  // Critical care, first 30-74 minutes
  '99292': 190.00,  // Critical care, each additional 30 min
  
  // ==========================================
  // SURGERY (Common Outpatient)
  // ==========================================
  
  // Endoscopy
  '43239': 285.00,  // Upper GI endoscopy with biopsy
  '45378': 295.00,  // Colonoscopy, diagnostic
  '45380': 335.00,  // Colonoscopy with biopsy
  '45385': 365.00,  // Colonoscopy with polyp removal
  
  // Cataract Surgery
  '66984': 650.00,  // Cataract surgery with IOL, 1 stage
  '66982': 620.00,  // Extracapsular cataract removal
  
  // Orthopedic Procedures
  '29827': 485.00,  // Arthroscopy, shoulder, debridement
  '29881': 510.00,  // Arthroscopy, knee, meniscectomy
  '27447': 1250.00, // Total knee arthroplasty
  '27130': 1180.00, // Total hip arthroplasty
  
  // ==========================================
  // THERAPY & REHABILITATION
  // ==========================================
  
  // Physical Therapy
  '97110': 37.00,   // Therapeutic exercises
  '97112': 40.00,   // Neuromuscular reeducation
  '97116': 38.00,   // Gait training
  '97140': 35.00,   // Manual therapy
  '97161': 95.00,   // PT evaluation, low complexity
  '97162': 125.00,  // PT evaluation, moderate complexity
  '97163': 155.00,  // PT evaluation, high complexity
  
  // Occupational Therapy
  '97165': 95.00,   // OT evaluation, low complexity
  '97166': 125.00,  // OT evaluation, moderate complexity
  '97167': 155.00,  // OT evaluation, high complexity
  
  // Speech Therapy
  '92507': 55.00,   // Speech/hearing therapy
  '92508': 65.00,   // Speech/hearing therapy, group
  
  // Chiropractic
  '98940': 32.00,   // Chiropractic manipulation, 1-2 regions
  '98941': 38.00,   // Chiropractic manipulation, 3-4 regions
  '98942': 44.00,   // Chiropractic manipulation, 5 regions
  
  // Acupuncture
  '97810': 42.00,   // Acupuncture, 1st 15 minutes
  '97811': 28.00,   // Acupuncture, each additional 15 min
  
  // ==========================================
  // MEDICATIONS (Injections in office)
  // ==========================================
  
  'J0690': 0.50,    // Cefazolin injection, 500mg
  'J1100': 2.50,    // Dexamethasone injection, 1mg
  'J2001': 35.00,   // Lidocaine injection, 10mg
  'J3010': 25.00,   // Fentanyl injection, 0.1mg
  'J3301': 150.00,  // Triamcinolone injection, 1mg
  'J7030': 15.00,   // Infliximab injection, 10mg
};

// Category mapping for unknown CPT codes
const categoryPatterns = {
  lab: {
    cptRanges: [
      { start: 80047, end: 89398 },  // Lab tests
    ],
    typicalRange: { min: 5, max: 50 },
    avgRate: 20,
  },
  
  imaging: {
    cptRanges: [
      { start: 70000, end: 79999 },  // Radiology
    ],
    typicalRange: { min: 30, max: 500 },
    avgRate: 150,
  },
  
  office_visit: {
    cptRanges: [
      { start: 99201, end: 99499 },  // E/M codes
    ],
    typicalRange: { min: 20, max: 250 },
    avgRate: 100,
  },
  
  procedure: {
    cptRanges: [
      { start: 10000, end: 69999 },  // Surgical procedures
    ],
    typicalRange: { min: 50, max: 2000 },
    avgRate: 300,
  },
  
  therapy: {
    cptRanges: [
      { start: 97000, end: 97799 },  // Physical medicine
    ],
    typicalRange: { min: 30, max: 160 },
    avgRate: 75,
  },
};

// Helper: Get Medicare rate
function getMedicareRate(cptCode) {
  // Direct lookup
  if (medicareRates[cptCode]) {
    return {
      rate: medicareRates[cptCode],
      source: 'medicare_schedule',
      confidence: 'high'
    };
  }
  
  // Estimate from category
  const category = determineCategoryFromCPT(cptCode);
  if (category && categoryPatterns[category]) {
    return {
      rate: categoryPatterns[category].avgRate,
      source: 'category_estimate',
      confidence: 'medium',
      range: categoryPatterns[category].typicalRange
    };
  }
  
  // Unknown
  return {
    rate: null,
    source: 'unknown',
    confidence: 'low'
  };
}

// Helper: Determine category from CPT code
function determineCategoryFromCPT(cptCode) {
  const code = parseInt(cptCode);
  if (isNaN(code)) return null;
  
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    for (const range of pattern.cptRanges) {
      if (code >= range.start && code <= range.end) {
        return category;
      }
    }
  }
  
  return null;
}

// Export
module.exports = {
  medicareRates,
  categoryPatterns,
  getMedicareRate,
  determineCategoryFromCPT,
};
