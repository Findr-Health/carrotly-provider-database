const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('🔍 Finding expired pending requests...\n');
  
  const expiredBookings = await Booking.find({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { $lt: new Date() }
  });
  
  console.log(`Found ${expiredBookings.length} expired pending requests`);
  
  if (expiredBookings.length > 0) {
    console.log('\nSample expired bookings:');
    expiredBookings.slice(0, 3).forEach(b => {
      console.log(`- ${b.bookingNumber}: expired ${b.confirmation.expiresAt}`);
    });
    
    console.log('\n⚠️  About to DELETE these bookings permanently.');
    console.log('Run with DELETE=true to proceed\n');
    
    if (process.env.DELETE === 'true') {
      const result = await Booking.deleteMany({
        status: 'pending_confirmation',
        'confirmation.expiresAt': { $lt: new Date() }
      });
      
      console.log(`✅ Deleted ${result.deletedCount} expired pending requests`);
    }
  } else {
    console.log('✅ No expired pending requests found');
  }
  
  process.exit();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
