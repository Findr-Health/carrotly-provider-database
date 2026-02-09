const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_PUBLIC_URL || 'mongodb://mongo:***@shinkansen.proxy.rlwy.net:56018';

async function updateBusinessHours() {
  try {
    await mongoose.connect(MONGO_URL + '/railway');
    console.log('✅ Connected to MongoDB');
    
    const result = await mongoose.connection.db.collection('providers').updateOne(
      { _id: new mongoose.Types.ObjectId('697a98f3a04e359abfda111f') },
      {
        $set: {
          businessHours: {
            monday: { isOpen: true, open: '09:00', close: '17:00' },
            tuesday: { isOpen: true, open: '09:00', close: '17:00' },
            wednesday: { isOpen: true, open: '09:00', close: '17:00' },
            thursday: { isOpen: true, open: '09:00', close: '17:00' },
            friday: { isOpen: true, open: '09:00', close: '17:00' },
            saturday: { isOpen: false },
            sunday: { isOpen: false }
          }
        }
      }
    );
    
    console.log('✅ Business hours updated:', result);
    
    // Verify
    const provider = await mongoose.connection.db.collection('providers')
      .findOne({ _id: new mongoose.Types.ObjectId('697a98f3a04e359abfda111f') });
    
    console.log('\n📅 Business Hours:');
    console.log(JSON.stringify(provider.businessHours, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateBusinessHours();
