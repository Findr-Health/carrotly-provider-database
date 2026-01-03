// migrations/normalizeProviderTypes.js
// Migration script to update legacy provider type names to new standardized names
// Run this on your backend server or directly against MongoDB

const mongoose = require('mongoose');

// Legacy to new name mapping
const PROVIDER_TYPE_MAPPING = {
  'Skincare/Aesthetics': 'Skincare',
  'Massage/Bodywork': 'Massage',
  'Fitness/Training': 'Fitness',
  'Nutrition/Wellness': 'Nutrition',
  'Pharmacy/RX': 'Pharmacy/Rx'
};

async function normalizeProviderTypes() {
  console.log('🚀 Starting provider type normalization migration...\n');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    // Get counts before migration
    const totalBefore = await providersCollection.countDocuments();
    console.log(`📊 Total providers in database: ${totalBefore}\n`);

    let totalUpdated = 0;

    // Process each legacy type
    for (const [oldName, newName] of Object.entries(PROVIDER_TYPE_MAPPING)) {
      console.log(`🔄 Updating "${oldName}" → "${newName}"...`);

      // Find providers with this legacy type
      const matchingProviders = await providersCollection.find({
        providerTypes: oldName
      }).toArray();

      if (matchingProviders.length === 0) {
        console.log(`   ℹ️  No providers found with type "${oldName}"`);
        continue;
      }

      console.log(`   📝 Found ${matchingProviders.length} provider(s)`);

      // Update each provider
      for (const provider of matchingProviders) {
        // Replace old name with new name in the array
        const updatedTypes = provider.providerTypes.map(type => 
          type === oldName ? newName : type
        );

        await providersCollection.updateOne(
          { _id: provider._id },
          { 
            $set: { 
              providerTypes: updatedTypes,
              updatedAt: new Date()
            }
          }
        );

        console.log(`   ✅ Updated: ${provider.practiceName || provider._id}`);
        totalUpdated++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration complete!`);
    console.log(`   Total providers updated: ${totalUpdated}`);
    console.log('='.repeat(50) + '\n');

    // Verify - show current distribution
    console.log('📊 Current provider type distribution:\n');
    
    const typeDistribution = await providersCollection.aggregate([
      { $unwind: '$providerTypes' },
      { $group: { _id: '$providerTypes', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    for (const { _id, count } of typeDistribution) {
      console.log(`   ${_id}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  normalizeProviderTypes()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = normalizeProviderTypes;
