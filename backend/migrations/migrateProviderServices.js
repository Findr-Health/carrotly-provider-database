/**
 * Migration script to update existing provider services to new category-based structure
 * Run with: node migrations/migrateProviderServices.js
 * 
 * This script:
 * 1. Reads all existing providers
 * 2. Maps their current services to the new schema format
 * 3. Assigns appropriate categories based on provider type and service name
 * 4. Updates the provider documents
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Category mapping by provider type
const categoryMappings = {
  'Medical': {
    keywords: {
      'Consultation': ['consult', 'visit', 'appointment', 'evaluation', 'assessment', 'new patient', 'follow-up', 'telehealth'],
      'Preventive': ['physical', 'wellness', 'checkup', 'screening', 'immunization', 'vaccine', 'preventive'],
      'Diagnostic': ['blood', 'lab', 'test', 'ekg', 'x-ray', 'imaging', 'diagnostic', 'urinalysis'],
      'Treatment': ['sick', 'treatment', 'chronic', 'management', 'therapy'],
      'Procedures': ['procedure', 'injection', 'removal', 'biopsy', 'minor surgery']
    },
    default: 'Consultation'
  },
  'Urgent Care': {
    keywords: {
      'Walk-in Visit': ['visit', 'urgent', 'walk-in', 'basic', 'sick'],
      'Diagnostic': ['x-ray', 'test', 'lab', 'strep', 'flu', 'covid', 'diagnostic'],
      'Treatment': ['iv', 'fluids', 'breathing', 'treatment', 'therapy'],
      'Minor Procedures': ['suture', 'stitch', 'laceration', 'splint', 'cast', 'removal', 'wound']
    },
    default: 'Walk-in Visit'
  },
  'Dental': {
    keywords: {
      'Preventive': ['cleaning', 'exam', 'x-ray', 'fluoride', 'sealant', 'preventive', 'hygiene'],
      'Restorative': ['filling', 'crown', 'root canal', 'bridge', 'cavity', 'repair', 'restoration'],
      'Cosmetic': ['whitening', 'veneer', 'bonding', 'cosmetic', 'smile'],
      'Surgical': ['extraction', 'implant', 'wisdom', 'surgery', 'surgical', 'oral surgery']
    },
    default: 'Preventive'
  },
  'Mental Health': {
    keywords: {
      'Assessment': ['assessment', 'evaluation', 'initial', 'intake', 'testing', 'psychological'],
      'Individual Therapy': ['therapy', 'session', 'individual', 'counseling', 'emdr', 'cbt'],
      'Couples/Family': ['couples', 'family', 'marriage', 'relationship'],
      'Group': ['group', 'support'],
      'Psychiatry': ['psychiatr', 'medication', 'med management', 'prescrib']
    },
    default: 'Individual Therapy'
  },
  'Skincare': {
    keywords: {
      'Facials': ['facial', 'cleansing', 'hydra', 'peel'],
      'Injectables': ['botox', 'filler', 'inject', 'lip', 'kybella', 'neuromod'],
      'Acne Treatment': ['acne', 'led', 'light therapy', 'extraction'],
      'Body Treatment': ['body', 'wrap', 'microneedle', 'laser', 'hair removal']
    },
    default: 'Facials'
  },
  'Massage': {
    keywords: {
      'Relaxation': ['swedish', 'relaxation', 'aromatherapy', 'couples', 'relax'],
      'Therapeutic': ['deep tissue', 'trigger', 'myofascial', 'therapeutic'],
      'Sports': ['sports', 'athletic', 'pre-event', 'post-event', 'recovery'],
      'Specialty': ['hot stone', 'prenatal', 'pregnancy', 'thai', 'lymphatic', 'specialty']
    },
    default: 'Relaxation'
  },
  'Fitness': {
    keywords: {
      'Personal Training': ['personal', 'training', 'trainer', 'one-on-one', 'package', 'session'],
      'Group Class': ['class', 'group', 'bootcamp', 'hiit', 'spin', 'cycling'],
      'Assessment': ['assessment', 'evaluation', 'body composition', 'screening', 'analysis']
    },
    default: 'Personal Training'
  },
  'Yoga/Pilates': {
    keywords: {
      'Group Class': ['class', 'drop-in', 'pack', 'unlimited', 'group'],
      'Private Session': ['private', 'one-on-one', 'duet', 'individual'],
      'Workshop': ['workshop', 'training', 'teacher', 'certification', 'retreat']
    },
    default: 'Group Class'
  },
  'Nutrition': {
    keywords: {
      'Consultation': ['consult', 'assessment', 'initial', 'follow-up', 'virtual'],
      'Meal Planning': ['meal', 'plan', 'grocery', 'food'],
      'Program': ['program', 'week', 'month', 'corporate', 'wellness']
    },
    default: 'Consultation'
  },
  'Pharmacy/Rx': {
    keywords: {
      'Consultation': ['consult', 'review', 'medication review', 'diabetes', 'health'],
      'Compounding': ['compound', 'custom', 'hormone', 'veterinary', 'pet'],
      'Immunization': ['vaccine', 'flu', 'shot', 'covid', 'shingles', 'immunization', 'travel'],
      'Weight Loss': ['weight', 'glp', 'semaglutide', 'b12', 'metabolism', 'ozempic', 'wegovy']
    },
    default: 'Consultation'
  }
};

/**
 * Determine the category for a service based on its name and provider type
 */
function determineCategory(serviceName, providerType) {
  const mapping = categoryMappings[providerType];
  if (!mapping) {
    return 'General';
  }

  const nameLower = serviceName.toLowerCase();

  for (const [category, keywords] of Object.entries(mapping.keywords)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return mapping.default;
}

/**
 * Transform old service format to new format
 */
function transformService(oldService, providerType, index) {
  // Handle different old service formats
  const name = oldService.name || oldService.serviceName || 'Unnamed Service';
  const description = oldService.description || '';
  const price = oldService.price || oldService.basePrice || 0;
  const duration = oldService.duration || oldService.durationMinutes || 60;

  return {
    _id: oldService._id || new mongoose.Types.ObjectId(),
    name: name,
    description: description,
    shortDescription: description.length > 100 ? description.substring(0, 97) + '...' : description,
    category: determineCategory(name, providerType),
    basePrice: typeof price === 'number' ? price : parseFloat(price) || 0,
    duration: typeof duration === 'number' ? duration : parseInt(duration) || 60,
    hasVariants: false,
    variants: [],
    isActive: oldService.isActive !== false,
    sortOrder: index,
    createdAt: oldService.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Get primary provider type from providerTypes array
 */
function getPrimaryProviderType(providerTypes) {
  if (!providerTypes || providerTypes.length === 0) {
    return null;
  }
  
  // Return first provider type
  const primaryType = providerTypes[0];
  
  // Normalize type names
  const typeMapping = {
    'medical': 'Medical',
    'urgent care': 'Urgent Care',
    'dental': 'Dental',
    'mental health': 'Mental Health',
    'skincare': 'Skincare',
    'skin care': 'Skincare',
    'massage': 'Massage',
    'fitness': 'Fitness',
    'yoga': 'Yoga/Pilates',
    'pilates': 'Yoga/Pilates',
    'yoga/pilates': 'Yoga/Pilates',
    'nutrition': 'Nutrition',
    'pharmacy': 'Pharmacy/Rx',
    'pharmacy/rx': 'Pharmacy/Rx'
  };

  const normalized = typeMapping[primaryType.toLowerCase()] || primaryType;
  return normalized;
}

async function migrateProviders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/findrhealth';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the providers collection directly
    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    // Fetch all providers
    const providers = await providersCollection.find({}).toArray();
    console.log(`Found ${providers.length} providers to process`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const provider of providers) {
      try {
        const providerType = getPrimaryProviderType(provider.providerTypes);
        
        if (!providerType) {
          console.log(`  Skipping ${provider.practiceName || provider._id}: No provider type`);
          skipped++;
          continue;
        }

        // Check if services exist and need migration
        if (!provider.services || provider.services.length === 0) {
          console.log(`  Skipping ${provider.practiceName || provider._id}: No services`);
          skipped++;
          continue;
        }

        // Check if already migrated (has category field)
        const alreadyMigrated = provider.services.some(s => s.category);
        if (alreadyMigrated) {
          console.log(`  Skipping ${provider.practiceName || provider._id}: Already migrated`);
          skipped++;
          continue;
        }

        // Transform services
        const newServices = provider.services.map((service, index) => 
          transformService(service, providerType, index)
        );

        // Update provider
        await providersCollection.updateOne(
          { _id: provider._id },
          { 
            $set: { 
              services: newServices,
              'migration.servicesV2': new Date()
            }
          }
        );

        console.log(`  ✓ Updated ${provider.practiceName || provider._id}: ${newServices.length} services`);
        updated++;
      } catch (err) {
        console.error(`  ✗ Error updating ${provider.practiceName || provider._id}:`, err.message);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('Migration Summary:');
    console.log(`  Total providers: ${providers.length}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log('========================================');

    await mongoose.disconnect();
    console.log('\nDatabase disconnected. Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  migrateProviders();
}

module.exports = { migrateProviders, determineCategory, transformService };
