require('dotenv').config();
const mongoose = require('mongoose');

async function fixProviderTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Fix lowercase "dental" to "Dental"
    const result = await mongoose.connection.db.collection('providers').updateMany(
      { providerTypes: 'dental' },
      { $set: { 'providerTypes.$': 'Dental' } }
    );
    
    console.log(`Updated ${result.modifiedCount} providers`);
    
    // Show current distribution
    const distribution = await mongoose.connection.db.collection('providers').aggregate([
      { $unwind: '$providerTypes' },
      { $group: { _id: '$providerTypes', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nProvider type distribution:');
    distribution.forEach(d => console.log(`  ${d._id}: ${d.count}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProviderTypes();
