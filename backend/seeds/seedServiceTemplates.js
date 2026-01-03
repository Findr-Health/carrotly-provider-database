/**
 * Seed script for Service Templates
 * Run with: node seeds/seedServiceTemplates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ServiceTemplate = require('../models/ServiceTemplate');

const serviceTemplates = [
  // ============================================
  // DENTAL
  // ============================================
  // Preventive
  {
    providerType: 'Dental',
    category: 'Preventive',
    name: 'Dental Cleaning',
    description: 'Professional teeth cleaning to remove plaque and tartar buildup. Includes polishing and fluoride treatment.',
    shortDescription: 'Professional cleaning with polish and fluoride',
    suggestedPriceMin: 80,
    suggestedPriceMax: 150,
    suggestedDuration: 45,
    suggestedVariants: [
      { name: 'Standard Cleaning', priceModifier: 0, durationModifier: 0, description: 'Basic cleaning with polish' },
      { name: 'Deep Cleaning', priceModifier: 70, durationModifier: 15, description: 'Includes scaling and root planing' }
    ],
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Dental',
    category: 'Preventive',
    name: 'Exam & X-rays',
    description: 'Comprehensive dental examination with digital X-rays to assess overall oral health.',
    shortDescription: 'Full exam with digital X-rays',
    suggestedPriceMin: 75,
    suggestedPriceMax: 125,
    suggestedDuration: 30,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Dental',
    category: 'Preventive',
    name: 'Fluoride Treatment',
    description: 'Topical fluoride application to strengthen tooth enamel and prevent decay.',
    shortDescription: 'Enamel strengthening treatment',
    suggestedPriceMin: 25,
    suggestedPriceMax: 50,
    suggestedDuration: 15,
    sortOrder: 3
  },
  {
    providerType: 'Dental',
    category: 'Preventive',
    name: 'Dental Sealants',
    description: 'Protective coating applied to back teeth to prevent cavities.',
    shortDescription: 'Protective cavity prevention coating',
    suggestedPriceMin: 30,
    suggestedPriceMax: 60,
    suggestedDuration: 20,
    sortOrder: 4
  },
  // Restorative
  {
    providerType: 'Dental',
    category: 'Restorative',
    name: 'Tooth Filling',
    description: 'Repair of cavities using composite or amalgam filling material.',
    shortDescription: 'Cavity repair with filling',
    suggestedPriceMin: 150,
    suggestedPriceMax: 300,
    suggestedDuration: 45,
    suggestedVariants: [
      { name: 'Composite (Tooth-colored)', priceModifier: 0, durationModifier: 0 },
      { name: 'Amalgam (Silver)', priceModifier: -30, durationModifier: 0 }
    ],
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Dental',
    category: 'Restorative',
    name: 'Dental Crown',
    description: 'Custom-made cap to cover and protect a damaged tooth.',
    shortDescription: 'Custom protective tooth cap',
    suggestedPriceMin: 800,
    suggestedPriceMax: 1500,
    suggestedDuration: 90,
    sortOrder: 2
  },
  {
    providerType: 'Dental',
    category: 'Restorative',
    name: 'Root Canal',
    description: 'Treatment to remove infected pulp and save a damaged tooth.',
    shortDescription: 'Infected tooth treatment',
    suggestedPriceMin: 700,
    suggestedPriceMax: 1200,
    suggestedDuration: 90,
    sortOrder: 3
  },
  {
    providerType: 'Dental',
    category: 'Restorative',
    name: 'Dental Bridge',
    description: 'Fixed prosthetic to replace one or more missing teeth.',
    shortDescription: 'Fixed replacement for missing teeth',
    suggestedPriceMin: 1500,
    suggestedPriceMax: 3000,
    suggestedDuration: 120,
    sortOrder: 4
  },
  // Cosmetic
  {
    providerType: 'Dental',
    category: 'Cosmetic',
    name: 'Teeth Whitening',
    description: 'Professional whitening treatment to brighten your smile.',
    shortDescription: 'Professional smile brightening',
    suggestedPriceMin: 200,
    suggestedPriceMax: 500,
    suggestedDuration: 60,
    suggestedVariants: [
      { name: 'In-Office Whitening', priceModifier: 0, durationModifier: 0 },
      { name: 'Take-Home Kit', priceModifier: -100, durationModifier: -30 }
    ],
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Dental',
    category: 'Cosmetic',
    name: 'Veneer (Per Tooth)',
    description: 'Custom porcelain shell to improve tooth appearance.',
    shortDescription: 'Custom porcelain tooth cover',
    suggestedPriceMin: 800,
    suggestedPriceMax: 2000,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Dental',
    category: 'Cosmetic',
    name: 'Dental Bonding',
    description: 'Tooth-colored resin applied to repair chips, cracks, or gaps.',
    shortDescription: 'Repair chips and gaps',
    suggestedPriceMin: 200,
    suggestedPriceMax: 400,
    suggestedDuration: 45,
    sortOrder: 3
  },
  // Surgical
  {
    providerType: 'Dental',
    category: 'Surgical',
    name: 'Tooth Extraction',
    description: 'Removal of a damaged or decayed tooth.',
    shortDescription: 'Tooth removal procedure',
    suggestedPriceMin: 150,
    suggestedPriceMax: 350,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Dental',
    category: 'Surgical',
    name: 'Wisdom Tooth Removal',
    description: 'Surgical extraction of impacted wisdom teeth.',
    shortDescription: 'Wisdom tooth extraction',
    suggestedPriceMin: 250,
    suggestedPriceMax: 600,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Dental',
    category: 'Surgical',
    name: 'Dental Implant',
    description: 'Permanent tooth replacement with titanium post and crown.',
    shortDescription: 'Permanent tooth replacement',
    suggestedPriceMin: 2000,
    suggestedPriceMax: 4000,
    suggestedDuration: 120,
    sortOrder: 3
  },

  // ============================================
  // MEDICAL
  // ============================================
  // Consultation
  {
    providerType: 'Medical',
    category: 'Consultation',
    name: 'New Patient Visit',
    description: 'Comprehensive first visit including health history review and examination.',
    shortDescription: 'First visit with full health review',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Medical',
    category: 'Consultation',
    name: 'Follow-up Visit',
    description: 'Brief follow-up appointment to review progress and adjust treatment.',
    shortDescription: 'Progress review appointment',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 20,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Medical',
    category: 'Consultation',
    name: 'Telehealth Visit',
    description: 'Virtual consultation via video call.',
    shortDescription: 'Virtual video consultation',
    suggestedPriceMin: 50,
    suggestedPriceMax: 125,
    suggestedDuration: 20,
    sortOrder: 3
  },
  // Preventive
  {
    providerType: 'Medical',
    category: 'Preventive',
    name: 'Annual Physical',
    description: 'Comprehensive yearly health examination including vital signs and screenings.',
    shortDescription: 'Complete yearly health exam',
    suggestedPriceMin: 150,
    suggestedPriceMax: 300,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Medical',
    category: 'Preventive',
    name: 'Wellness Checkup',
    description: 'General health assessment and preventive care consultation.',
    shortDescription: 'General health assessment',
    suggestedPriceMin: 100,
    suggestedPriceMax: 200,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Medical',
    category: 'Preventive',
    name: 'Immunization',
    description: 'Vaccine administration for preventive care.',
    shortDescription: 'Vaccine administration',
    suggestedPriceMin: 25,
    suggestedPriceMax: 75,
    suggestedDuration: 15,
    sortOrder: 3
  },
  // Diagnostic
  {
    providerType: 'Medical',
    category: 'Diagnostic',
    name: 'Blood Work Panel',
    description: 'Comprehensive blood test including CBC, metabolic panel, and lipids.',
    shortDescription: 'Comprehensive blood testing',
    suggestedPriceMin: 50,
    suggestedPriceMax: 150,
    suggestedDuration: 15,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Medical',
    category: 'Diagnostic',
    name: 'EKG',
    description: 'Electrocardiogram to assess heart rhythm and function.',
    shortDescription: 'Heart rhythm assessment',
    suggestedPriceMin: 50,
    suggestedPriceMax: 150,
    suggestedDuration: 20,
    sortOrder: 2
  },
  {
    providerType: 'Medical',
    category: 'Diagnostic',
    name: 'Urinalysis',
    description: 'Urine test to screen for various conditions.',
    shortDescription: 'Urine screening test',
    suggestedPriceMin: 25,
    suggestedPriceMax: 75,
    suggestedDuration: 10,
    sortOrder: 3
  },
  // Treatment
  {
    providerType: 'Medical',
    category: 'Treatment',
    name: 'Sick Visit',
    description: 'Evaluation and treatment for acute illness symptoms.',
    shortDescription: 'Acute illness treatment',
    suggestedPriceMin: 100,
    suggestedPriceMax: 175,
    suggestedDuration: 20,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Medical',
    category: 'Treatment',
    name: 'Chronic Care Management',
    description: 'Ongoing management of chronic conditions like diabetes or hypertension.',
    shortDescription: 'Chronic condition management',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 30,
    sortOrder: 2
  },
  // Procedures
  {
    providerType: 'Medical',
    category: 'Procedures',
    name: 'Minor Procedure',
    description: 'Small office-based procedures such as mole removal or ear lavage.',
    shortDescription: 'Small office procedure',
    suggestedPriceMin: 150,
    suggestedPriceMax: 400,
    suggestedDuration: 30,
    sortOrder: 1
  },
  {
    providerType: 'Medical',
    category: 'Procedures',
    name: 'Joint Injection',
    description: 'Corticosteroid or hyaluronic acid injection for joint pain.',
    shortDescription: 'Joint pain injection',
    suggestedPriceMin: 150,
    suggestedPriceMax: 350,
    suggestedDuration: 20,
    sortOrder: 2
  },

  // ============================================
  // URGENT CARE
  // ============================================
  // Walk-in Visit
  {
    providerType: 'Urgent Care',
    category: 'Walk-in Visit',
    name: 'Basic Urgent Care Visit',
    description: 'Evaluation and treatment for common illnesses like cold, flu, sore throat, ear infections.',
    shortDescription: 'Common illness treatment',
    suggestedPriceMin: 125,
    suggestedPriceMax: 175,
    suggestedDuration: 20,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Urgent Care',
    category: 'Walk-in Visit',
    name: 'Visit + X-Ray',
    description: 'Urgent care visit with on-site X-ray imaging for suspected fractures, sprains, or chest conditions.',
    shortDescription: 'Visit with X-ray imaging',
    suggestedPriceMin: 175,
    suggestedPriceMax: 250,
    suggestedDuration: 35,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Urgent Care',
    category: 'Walk-in Visit',
    name: 'Visit + Laboratory Work',
    description: 'Urgent care visit with diagnostic lab tests to identify infections or abnormalities.',
    shortDescription: 'Visit with lab testing',
    suggestedPriceMin: 150,
    suggestedPriceMax: 225,
    suggestedDuration: 30,
    isPopular: true,
    sortOrder: 3
  },
  // Diagnostic
  {
    providerType: 'Urgent Care',
    category: 'Diagnostic',
    name: 'X-Ray',
    description: 'Digital X-ray imaging for bones, chest, or other areas.',
    shortDescription: 'Digital X-ray imaging',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 15,
    sortOrder: 1
  },
  {
    providerType: 'Urgent Care',
    category: 'Diagnostic',
    name: 'Rapid Strep Test',
    description: 'Quick test for strep throat infection.',
    shortDescription: 'Strep throat test',
    suggestedPriceMin: 25,
    suggestedPriceMax: 50,
    suggestedDuration: 15,
    sortOrder: 2
  },
  {
    providerType: 'Urgent Care',
    category: 'Diagnostic',
    name: 'Flu Test',
    description: 'Rapid influenza diagnostic test.',
    shortDescription: 'Influenza test',
    suggestedPriceMin: 25,
    suggestedPriceMax: 75,
    suggestedDuration: 15,
    sortOrder: 3
  },
  {
    providerType: 'Urgent Care',
    category: 'Diagnostic',
    name: 'COVID Test',
    description: 'COVID-19 PCR or rapid antigen test.',
    shortDescription: 'COVID-19 testing',
    suggestedPriceMin: 50,
    suggestedPriceMax: 150,
    suggestedDuration: 15,
    sortOrder: 4
  },
  // Treatment
  {
    providerType: 'Urgent Care',
    category: 'Treatment',
    name: 'IV Fluids',
    description: 'Intravenous fluid administration for dehydration.',
    shortDescription: 'IV hydration therapy',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 45,
    sortOrder: 1
  },
  {
    providerType: 'Urgent Care',
    category: 'Treatment',
    name: 'Breathing Treatment',
    description: 'Nebulizer treatment for asthma or respiratory conditions.',
    shortDescription: 'Nebulizer respiratory treatment',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 20,
    sortOrder: 2
  },
  // Minor Procedures
  {
    providerType: 'Urgent Care',
    category: 'Minor Procedures',
    name: 'Laceration Repair (Sutures)',
    description: 'Professional wound closure with stitches for cuts requiring repair.',
    shortDescription: 'Wound stitching',
    suggestedPriceMin: 200,
    suggestedPriceMax: 400,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Urgent Care',
    category: 'Minor Procedures',
    name: 'Splint/Cast Application',
    description: 'Immobilization for sprains and minor fractures.',
    shortDescription: 'Splint or cast application',
    suggestedPriceMin: 150,
    suggestedPriceMax: 300,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Urgent Care',
    category: 'Minor Procedures',
    name: 'Foreign Body Removal',
    description: 'Removal of splinters, embedded objects, or ear/nose obstructions.',
    shortDescription: 'Object removal procedure',
    suggestedPriceMin: 100,
    suggestedPriceMax: 250,
    suggestedDuration: 30,
    sortOrder: 3
  },

  // ============================================
  // MENTAL HEALTH
  // ============================================
  // Assessment
  {
    providerType: 'Mental Health',
    category: 'Assessment',
    name: 'Initial Assessment',
    description: 'Comprehensive mental health evaluation to understand your concerns and develop a treatment plan.',
    shortDescription: 'Comprehensive mental health evaluation',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Mental Health',
    category: 'Assessment',
    name: 'Psychological Testing',
    description: 'Standardized assessments for diagnosis of specific conditions.',
    shortDescription: 'Diagnostic psychological testing',
    suggestedPriceMin: 250,
    suggestedPriceMax: 500,
    suggestedDuration: 120,
    sortOrder: 2
  },
  // Individual Therapy
  {
    providerType: 'Mental Health',
    category: 'Individual Therapy',
    name: 'Therapy Session',
    description: 'One-on-one therapy session to address mental health concerns.',
    shortDescription: 'Individual therapy session',
    suggestedPriceMin: 100,
    suggestedPriceMax: 200,
    suggestedDuration: 50,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Mental Health',
    category: 'Individual Therapy',
    name: 'Extended Session',
    description: 'Longer therapy session for complex issues or intensive work.',
    shortDescription: 'Extended individual session',
    suggestedPriceMin: 150,
    suggestedPriceMax: 275,
    suggestedDuration: 80,
    sortOrder: 2
  },
  {
    providerType: 'Mental Health',
    category: 'Individual Therapy',
    name: 'EMDR Session',
    description: 'Eye Movement Desensitization and Reprocessing therapy for trauma.',
    shortDescription: 'Trauma-focused EMDR therapy',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 60,
    sortOrder: 3
  },
  // Couples/Family
  {
    providerType: 'Mental Health',
    category: 'Couples/Family',
    name: 'Couples Therapy',
    description: 'Joint session for partners to work on relationship issues.',
    shortDescription: 'Relationship therapy session',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Mental Health',
    category: 'Couples/Family',
    name: 'Family Therapy',
    description: 'Therapy session involving multiple family members.',
    shortDescription: 'Family therapy session',
    suggestedPriceMin: 175,
    suggestedPriceMax: 300,
    suggestedDuration: 75,
    sortOrder: 2
  },
  // Group
  {
    providerType: 'Mental Health',
    category: 'Group',
    name: 'Group Therapy Session',
    description: 'Facilitated group session with others facing similar challenges.',
    shortDescription: 'Facilitated group session',
    suggestedPriceMin: 40,
    suggestedPriceMax: 80,
    suggestedDuration: 90,
    sortOrder: 1
  },
  {
    providerType: 'Mental Health',
    category: 'Group',
    name: 'Support Group',
    description: 'Peer support group for specific issues (grief, addiction, anxiety).',
    shortDescription: 'Peer support group',
    suggestedPriceMin: 20,
    suggestedPriceMax: 50,
    suggestedDuration: 60,
    sortOrder: 2
  },
  // Psychiatry
  {
    providerType: 'Mental Health',
    category: 'Psychiatry',
    name: 'Psychiatric Evaluation',
    description: 'Medical assessment by psychiatrist for medication evaluation.',
    shortDescription: 'Psychiatric medication evaluation',
    suggestedPriceMin: 200,
    suggestedPriceMax: 350,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Mental Health',
    category: 'Psychiatry',
    name: 'Medication Follow-up',
    description: 'Brief appointment to review medication effectiveness and adjust dosage.',
    shortDescription: 'Medication management visit',
    suggestedPriceMin: 100,
    suggestedPriceMax: 175,
    suggestedDuration: 20,
    sortOrder: 2
  },

  // ============================================
  // SKINCARE
  // ============================================
  // Facials
  {
    providerType: 'Skincare',
    category: 'Facials',
    name: 'Basic Facial',
    description: 'Classic facial treatment including cleansing, exfoliation, and hydration.',
    shortDescription: 'Classic cleansing facial',
    suggestedPriceMin: 75,
    suggestedPriceMax: 125,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Skincare',
    category: 'Facials',
    name: 'Deep Cleansing Facial',
    description: 'Intensive facial with extractions and deep pore cleansing.',
    shortDescription: 'Deep pore cleansing treatment',
    suggestedPriceMin: 100,
    suggestedPriceMax: 175,
    suggestedDuration: 75,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Skincare',
    category: 'Facials',
    name: 'Hydrating Facial',
    description: 'Moisture-boosting treatment for dry or dehydrated skin.',
    shortDescription: 'Moisture-boosting treatment',
    suggestedPriceMin: 90,
    suggestedPriceMax: 150,
    suggestedDuration: 60,
    sortOrder: 3
  },
  {
    providerType: 'Skincare',
    category: 'Facials',
    name: 'HydraFacial',
    description: 'Multi-step treatment combining cleansing, exfoliation, extraction, and hydration.',
    shortDescription: 'Multi-step hydration treatment',
    suggestedPriceMin: 150,
    suggestedPriceMax: 300,
    suggestedDuration: 60,
    sortOrder: 4
  },
  // Injectables
  {
    providerType: 'Skincare',
    category: 'Injectables',
    name: 'Botox',
    description: 'Neuromodulator injection to reduce fine lines and wrinkles.',
    shortDescription: 'Wrinkle-reducing injection',
    suggestedPriceMin: 200,
    suggestedPriceMax: 500,
    suggestedDuration: 30,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Skincare',
    category: 'Injectables',
    name: 'Dermal Filler',
    description: 'Injectable filler to restore volume and smooth wrinkles.',
    shortDescription: 'Volume-restoring filler',
    suggestedPriceMin: 400,
    suggestedPriceMax: 800,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Skincare',
    category: 'Injectables',
    name: 'Lip Filler',
    description: 'Injectable treatment to enhance lip volume and shape.',
    shortDescription: 'Lip enhancement treatment',
    suggestedPriceMin: 400,
    suggestedPriceMax: 700,
    suggestedDuration: 30,
    sortOrder: 3
  },
  {
    providerType: 'Skincare',
    category: 'Injectables',
    name: 'Kybella',
    description: 'Injectable treatment to reduce double chin fat.',
    shortDescription: 'Double chin reduction',
    suggestedPriceMin: 600,
    suggestedPriceMax: 1200,
    suggestedDuration: 30,
    sortOrder: 4
  },
  // Acne Treatment
  {
    providerType: 'Skincare',
    category: 'Acne Treatment',
    name: 'Acne Facial',
    description: 'Specialized facial treatment targeting active acne and breakouts.',
    shortDescription: 'Acne-targeting facial',
    suggestedPriceMin: 100,
    suggestedPriceMax: 175,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Skincare',
    category: 'Acne Treatment',
    name: 'Chemical Peel',
    description: 'Exfoliating treatment to improve skin texture and reduce acne scars.',
    shortDescription: 'Exfoliating skin renewal',
    suggestedPriceMin: 150,
    suggestedPriceMax: 300,
    suggestedDuration: 45,
    sortOrder: 2
  },
  {
    providerType: 'Skincare',
    category: 'Acne Treatment',
    name: 'LED Light Therapy',
    description: 'Light-based treatment to kill acne bacteria and reduce inflammation.',
    shortDescription: 'Light-based acne treatment',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 30,
    sortOrder: 3
  },
  // Body Treatment
  {
    providerType: 'Skincare',
    category: 'Body Treatment',
    name: 'Body Wrap',
    description: 'Full body treatment for detoxification and skin tightening.',
    shortDescription: 'Detox and tightening wrap',
    suggestedPriceMin: 100,
    suggestedPriceMax: 200,
    suggestedDuration: 60,
    sortOrder: 1
  },
  {
    providerType: 'Skincare',
    category: 'Body Treatment',
    name: 'Microneedling',
    description: 'Collagen-inducing treatment to improve skin texture and reduce scars.',
    shortDescription: 'Collagen-boosting treatment',
    suggestedPriceMin: 200,
    suggestedPriceMax: 400,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Skincare',
    category: 'Body Treatment',
    name: 'Laser Hair Removal',
    description: 'Permanent hair reduction using laser technology.',
    shortDescription: 'Permanent hair reduction',
    suggestedPriceMin: 150,
    suggestedPriceMax: 400,
    suggestedDuration: 30,
    sortOrder: 3
  },

  // ============================================
  // MASSAGE
  // ============================================
  // Relaxation
  {
    providerType: 'Massage',
    category: 'Relaxation',
    name: 'Swedish Massage',
    description: 'Classic relaxation massage using long, flowing strokes.',
    shortDescription: 'Classic relaxation massage',
    suggestedPriceMin: 80,
    suggestedPriceMax: 130,
    suggestedDuration: 60,
    suggestedVariants: [
      { name: '60 Minutes', priceModifier: 0, durationModifier: 0 },
      { name: '90 Minutes', priceModifier: 40, durationModifier: 30 }
    ],
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Massage',
    category: 'Relaxation',
    name: 'Aromatherapy Massage',
    description: 'Relaxing massage enhanced with essential oils.',
    shortDescription: 'Essential oil massage',
    suggestedPriceMin: 90,
    suggestedPriceMax: 150,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Massage',
    category: 'Relaxation',
    name: 'Couples Massage',
    description: 'Side-by-side massage for two people.',
    shortDescription: 'Massage for two',
    suggestedPriceMin: 180,
    suggestedPriceMax: 300,
    suggestedDuration: 60,
    sortOrder: 3
  },
  // Therapeutic
  {
    providerType: 'Massage',
    category: 'Therapeutic',
    name: 'Deep Tissue Massage',
    description: 'Focused pressure massage targeting deep muscle layers.',
    shortDescription: 'Deep muscle pressure massage',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 60,
    suggestedVariants: [
      { name: '60 Minutes', priceModifier: 0, durationModifier: 0 },
      { name: '90 Minutes', priceModifier: 50, durationModifier: 30 }
    ],
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Massage',
    category: 'Therapeutic',
    name: 'Trigger Point Therapy',
    description: 'Targeted treatment for muscle knots and tension points.',
    shortDescription: 'Muscle knot treatment',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Massage',
    category: 'Therapeutic',
    name: 'Myofascial Release',
    description: 'Gentle sustained pressure on connective tissue restrictions.',
    shortDescription: 'Connective tissue release',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 60,
    sortOrder: 3
  },
  // Sports
  {
    providerType: 'Massage',
    category: 'Sports',
    name: 'Sports Massage',
    description: 'Massage designed for athletes to improve performance and recovery.',
    shortDescription: 'Athletic recovery massage',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Massage',
    category: 'Sports',
    name: 'Pre-Event Massage',
    description: 'Quick massage to prepare muscles before athletic activity.',
    shortDescription: 'Pre-activity preparation',
    suggestedPriceMin: 60,
    suggestedPriceMax: 100,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Massage',
    category: 'Sports',
    name: 'Post-Event Recovery',
    description: 'Massage to help muscles recover after intense activity.',
    shortDescription: 'Post-activity recovery',
    suggestedPriceMin: 80,
    suggestedPriceMax: 130,
    suggestedDuration: 45,
    sortOrder: 3
  },
  // Specialty
  {
    providerType: 'Massage',
    category: 'Specialty',
    name: 'Hot Stone Massage',
    description: 'Heated stones combined with massage for deep relaxation.',
    shortDescription: 'Heated stone therapy',
    suggestedPriceMin: 120,
    suggestedPriceMax: 180,
    suggestedDuration: 75,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Massage',
    category: 'Specialty',
    name: 'Prenatal Massage',
    description: 'Gentle massage designed for expectant mothers.',
    shortDescription: 'Pregnancy-safe massage',
    suggestedPriceMin: 90,
    suggestedPriceMax: 140,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Massage',
    category: 'Specialty',
    name: 'Thai Massage',
    description: 'Traditional Thai massage combining stretching and pressure.',
    shortDescription: 'Stretching and pressure therapy',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 90,
    sortOrder: 3
  },
  {
    providerType: 'Massage',
    category: 'Specialty',
    name: 'Lymphatic Drainage',
    description: 'Gentle massage to encourage lymph flow and reduce swelling.',
    shortDescription: 'Lymph flow encouragement',
    suggestedPriceMin: 100,
    suggestedPriceMax: 160,
    suggestedDuration: 60,
    sortOrder: 4
  },

  // ============================================
  // FITNESS
  // ============================================
  // Personal Training
  {
    providerType: 'Fitness',
    category: 'Personal Training',
    name: 'Personal Training Session',
    description: 'One-on-one training session customized to your fitness goals.',
    shortDescription: 'One-on-one fitness training',
    suggestedPriceMin: 60,
    suggestedPriceMax: 100,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Fitness',
    category: 'Personal Training',
    name: '5-Session Package',
    description: 'Package of 5 personal training sessions at a discounted rate.',
    shortDescription: '5 training sessions',
    suggestedPriceMin: 250,
    suggestedPriceMax: 450,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Fitness',
    category: 'Personal Training',
    name: '10-Session Package',
    description: 'Package of 10 personal training sessions at a discounted rate.',
    shortDescription: '10 training sessions',
    suggestedPriceMin: 450,
    suggestedPriceMax: 800,
    suggestedDuration: 60,
    sortOrder: 3
  },
  {
    providerType: 'Fitness',
    category: 'Personal Training',
    name: 'Partner Training',
    description: 'Semi-private training session for 2 people.',
    shortDescription: 'Training for two',
    suggestedPriceMin: 80,
    suggestedPriceMax: 140,
    suggestedDuration: 60,
    sortOrder: 4
  },
  // Group Class
  {
    providerType: 'Fitness',
    category: 'Group Class',
    name: 'Group Fitness Class',
    description: 'High-energy group workout class.',
    shortDescription: 'Group workout class',
    suggestedPriceMin: 15,
    suggestedPriceMax: 30,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Fitness',
    category: 'Group Class',
    name: 'Bootcamp',
    description: 'Intense full-body workout combining cardio and strength.',
    shortDescription: 'Full-body bootcamp',
    suggestedPriceMin: 20,
    suggestedPriceMax: 40,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Fitness',
    category: 'Group Class',
    name: 'HIIT Class',
    description: 'High-intensity interval training for maximum calorie burn.',
    shortDescription: 'High-intensity intervals',
    suggestedPriceMin: 20,
    suggestedPriceMax: 35,
    suggestedDuration: 45,
    sortOrder: 3
  },
  {
    providerType: 'Fitness',
    category: 'Group Class',
    name: 'Spin Class',
    description: 'Indoor cycling class with energizing music.',
    shortDescription: 'Indoor cycling',
    suggestedPriceMin: 20,
    suggestedPriceMax: 35,
    suggestedDuration: 45,
    sortOrder: 4
  },
  // Assessment
  {
    providerType: 'Fitness',
    category: 'Assessment',
    name: 'Fitness Assessment',
    description: 'Comprehensive evaluation of your current fitness level and goals.',
    shortDescription: 'Fitness level evaluation',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Fitness',
    category: 'Assessment',
    name: 'Body Composition Analysis',
    description: 'Detailed analysis of body fat, muscle mass, and metabolic rate.',
    shortDescription: 'Body composition test',
    suggestedPriceMin: 50,
    suggestedPriceMax: 100,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Fitness',
    category: 'Assessment',
    name: 'Movement Screening',
    description: 'Assessment of mobility, flexibility, and movement patterns.',
    shortDescription: 'Movement pattern analysis',
    suggestedPriceMin: 75,
    suggestedPriceMax: 125,
    suggestedDuration: 45,
    sortOrder: 3
  },

  // ============================================
  // YOGA/PILATES
  // ============================================
  // Group Class
  {
    providerType: 'Yoga/Pilates',
    category: 'Group Class',
    name: 'Drop-in Class',
    description: 'Single yoga or Pilates group class.',
    shortDescription: 'Single group class',
    suggestedPriceMin: 15,
    suggestedPriceMax: 25,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Group Class',
    name: '5-Class Pack',
    description: 'Package of 5 group classes at a discounted rate.',
    shortDescription: '5 class package',
    suggestedPriceMin: 60,
    suggestedPriceMax: 100,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Group Class',
    name: '10-Class Pack',
    description: 'Package of 10 group classes at a discounted rate.',
    shortDescription: '10 class package',
    suggestedPriceMin: 100,
    suggestedPriceMax: 180,
    suggestedDuration: 60,
    sortOrder: 3
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Group Class',
    name: 'Monthly Unlimited',
    description: 'Unlimited classes for one month.',
    shortDescription: 'Unlimited monthly access',
    suggestedPriceMin: 100,
    suggestedPriceMax: 175,
    suggestedDuration: 0,
    sortOrder: 4
  },
  // Private Session
  {
    providerType: 'Yoga/Pilates',
    category: 'Private Session',
    name: 'Private Yoga Session',
    description: 'One-on-one yoga instruction tailored to your needs.',
    shortDescription: 'Private yoga instruction',
    suggestedPriceMin: 75,
    suggestedPriceMax: 125,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Private Session',
    name: 'Private Pilates Session',
    description: 'One-on-one Pilates instruction on mat or reformer.',
    shortDescription: 'Private Pilates instruction',
    suggestedPriceMin: 80,
    suggestedPriceMax: 140,
    suggestedDuration: 60,
    sortOrder: 2
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Private Session',
    name: 'Duet Session',
    description: 'Semi-private session for 2 people.',
    shortDescription: 'Session for two',
    suggestedPriceMin: 50,
    suggestedPriceMax: 80,
    suggestedDuration: 60,
    sortOrder: 3
  },
  // Workshop
  {
    providerType: 'Yoga/Pilates',
    category: 'Workshop',
    name: 'Specialty Workshop',
    description: 'Extended workshop focusing on a specific topic or technique.',
    shortDescription: 'Topic-focused workshop',
    suggestedPriceMin: 40,
    suggestedPriceMax: 75,
    suggestedDuration: 120,
    sortOrder: 1
  },
  {
    providerType: 'Yoga/Pilates',
    category: 'Workshop',
    name: 'Yoga Teacher Training',
    description: 'Professional yoga instruction certification program.',
    shortDescription: 'Teacher certification',
    suggestedPriceMin: 2000,
    suggestedPriceMax: 4000,
    suggestedDuration: 0,
    sortOrder: 2
  },

  // ============================================
  // NUTRITION
  // ============================================
  // Consultation
  {
    providerType: 'Nutrition',
    category: 'Consultation',
    name: 'Initial Consultation',
    description: 'Comprehensive nutrition assessment and goal setting.',
    shortDescription: 'Full nutrition assessment',
    suggestedPriceMin: 100,
    suggestedPriceMax: 200,
    suggestedDuration: 60,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Nutrition',
    category: 'Consultation',
    name: 'Follow-up Session',
    description: 'Progress review and plan adjustment.',
    shortDescription: 'Progress review session',
    suggestedPriceMin: 60,
    suggestedPriceMax: 100,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Nutrition',
    category: 'Consultation',
    name: 'Virtual Consultation',
    description: 'Remote nutrition consultation via video call.',
    shortDescription: 'Virtual nutrition session',
    suggestedPriceMin: 50,
    suggestedPriceMax: 100,
    suggestedDuration: 30,
    sortOrder: 3
  },
  // Meal Planning
  {
    providerType: 'Nutrition',
    category: 'Meal Planning',
    name: 'Custom Meal Plan',
    description: 'Personalized meal plan based on your goals and preferences.',
    shortDescription: 'Personalized meal plan',
    suggestedPriceMin: 75,
    suggestedPriceMax: 150,
    suggestedDuration: 45,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Nutrition',
    category: 'Meal Planning',
    name: 'Weekly Meal Planning',
    description: 'Weekly meal planning session with grocery list.',
    shortDescription: 'Weekly meal planning',
    suggestedPriceMin: 50,
    suggestedPriceMax: 100,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Nutrition',
    category: 'Meal Planning',
    name: 'Grocery Store Tour',
    description: 'In-person guided tour of grocery store with nutrition tips.',
    shortDescription: 'Guided grocery shopping',
    suggestedPriceMin: 100,
    suggestedPriceMax: 200,
    suggestedDuration: 90,
    sortOrder: 3
  },
  // Program
  {
    providerType: 'Nutrition',
    category: 'Program',
    name: '4-Week Program',
    description: 'Month-long nutrition program with weekly check-ins.',
    shortDescription: '4-week nutrition program',
    suggestedPriceMin: 300,
    suggestedPriceMax: 500,
    suggestedDuration: 0,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Nutrition',
    category: 'Program',
    name: '12-Week Program',
    description: 'Comprehensive 3-month nutrition transformation program.',
    shortDescription: '12-week transformation',
    suggestedPriceMin: 600,
    suggestedPriceMax: 1000,
    suggestedDuration: 0,
    sortOrder: 2
  },
  {
    providerType: 'Nutrition',
    category: 'Program',
    name: 'Corporate Wellness Program',
    description: 'Group nutrition program for workplace wellness.',
    shortDescription: 'Workplace nutrition program',
    suggestedPriceMin: 500,
    suggestedPriceMax: 2000,
    suggestedDuration: 0,
    sortOrder: 3
  },

  // ============================================
  // PHARMACY/RX
  // ============================================
  // Consultation
  {
    providerType: 'Pharmacy/Rx',
    category: 'Consultation',
    name: 'Medication Review',
    description: 'Pharmacist review of all current medications for interactions and optimization.',
    shortDescription: 'Medication review session',
    suggestedPriceMin: 25,
    suggestedPriceMax: 50,
    suggestedDuration: 20,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Consultation',
    name: 'Health Consultation',
    description: 'General health consultation with pharmacist.',
    shortDescription: 'Pharmacist consultation',
    suggestedPriceMin: 30,
    suggestedPriceMax: 60,
    suggestedDuration: 30,
    sortOrder: 2
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Consultation',
    name: 'Diabetes Management',
    description: 'Diabetes education and medication management consultation.',
    shortDescription: 'Diabetes consultation',
    suggestedPriceMin: 50,
    suggestedPriceMax: 100,
    suggestedDuration: 45,
    sortOrder: 3
  },
  // Compounding
  {
    providerType: 'Pharmacy/Rx',
    category: 'Compounding',
    name: 'Custom Compound',
    description: 'Custom-formulated medication based on prescription.',
    shortDescription: 'Custom medication',
    suggestedPriceMin: 50,
    suggestedPriceMax: 200,
    suggestedDuration: 0,
    sortOrder: 1
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Compounding',
    name: 'Hormone Therapy Compound',
    description: 'Bioidentical hormone therapy preparation.',
    shortDescription: 'Hormone preparation',
    suggestedPriceMin: 75,
    suggestedPriceMax: 250,
    suggestedDuration: 0,
    sortOrder: 2
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Compounding',
    name: 'Veterinary Compound',
    description: 'Custom medication formulated for pets.',
    shortDescription: 'Pet medication',
    suggestedPriceMin: 30,
    suggestedPriceMax: 150,
    suggestedDuration: 0,
    sortOrder: 3
  },
  // Immunization
  {
    providerType: 'Pharmacy/Rx',
    category: 'Immunization',
    name: 'Flu Shot',
    description: 'Annual influenza vaccination.',
    shortDescription: 'Flu vaccination',
    suggestedPriceMin: 25,
    suggestedPriceMax: 50,
    suggestedDuration: 10,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Immunization',
    name: 'COVID Vaccine',
    description: 'COVID-19 vaccination or booster.',
    shortDescription: 'COVID vaccination',
    suggestedPriceMin: 0,
    suggestedPriceMax: 50,
    suggestedDuration: 15,
    sortOrder: 2
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Immunization',
    name: 'Shingles Vaccine',
    description: 'Shingrix vaccination for shingles prevention.',
    shortDescription: 'Shingles vaccination',
    suggestedPriceMin: 150,
    suggestedPriceMax: 250,
    suggestedDuration: 15,
    sortOrder: 3
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Immunization',
    name: 'Travel Vaccines',
    description: 'Vaccinations required or recommended for international travel.',
    shortDescription: 'Travel vaccinations',
    suggestedPriceMin: 75,
    suggestedPriceMax: 200,
    suggestedDuration: 20,
    sortOrder: 4
  },
  // Weight Loss
  {
    providerType: 'Pharmacy/Rx',
    category: 'Weight Loss',
    name: 'Weight Loss Consultation',
    description: 'Initial consultation for weight loss medication and program.',
    shortDescription: 'Weight loss consultation',
    suggestedPriceMin: 50,
    suggestedPriceMax: 150,
    suggestedDuration: 30,
    isPopular: true,
    sortOrder: 1
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Weight Loss',
    name: 'GLP-1 Medication Management',
    description: 'Management and administration of GLP-1 weight loss medications (Semaglutide, etc.).',
    shortDescription: 'GLP-1 medication program',
    suggestedPriceMin: 200,
    suggestedPriceMax: 500,
    suggestedDuration: 20,
    isPopular: true,
    sortOrder: 2
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Weight Loss',
    name: 'Weight Loss Follow-up',
    description: 'Follow-up appointment for weight loss program monitoring.',
    shortDescription: 'Weight loss follow-up',
    suggestedPriceMin: 25,
    suggestedPriceMax: 75,
    suggestedDuration: 15,
    sortOrder: 3
  },
  {
    providerType: 'Pharmacy/Rx',
    category: 'Weight Loss',
    name: 'B12 Injection',
    description: 'Vitamin B12 injection to support energy and metabolism.',
    shortDescription: 'B12 vitamin injection',
    suggestedPriceMin: 25,
    suggestedPriceMax: 50,
    suggestedDuration: 10,
    sortOrder: 4
  }
];

async function seedServiceTemplates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/findrhealth';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing templates
    await ServiceTemplate.deleteMany({});
    console.log('Cleared existing service templates');

    // Insert new templates
    const result = await ServiceTemplate.insertMany(serviceTemplates);
    console.log(`Successfully seeded ${result.length} service templates`);

    // Log summary by provider type
    const summary = {};
    for (const template of serviceTemplates) {
      if (!summary[template.providerType]) {
        summary[template.providerType] = 0;
      }
      summary[template.providerType]++;
    }
    console.log('\nTemplates by provider type:');
    for (const [type, count] of Object.entries(summary)) {
      console.log(`  ${type}: ${count} templates`);
    }

    await mongoose.disconnect();
    console.log('\nDatabase disconnected. Seeding complete!');
  } catch (error) {
    console.error('Error seeding service templates:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedServiceTemplates();
}

module.exports = { serviceTemplates, seedServiceTemplates };
