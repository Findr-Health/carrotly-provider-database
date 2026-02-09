const mongoose = require('mongoose');
const Provider = require('./models/Provider');

async function test() {
  await mongoose.connect(process.env.MONGO_PUBLIC_URL + '/railway');
  
  const provider = await Provider.findById('697a98f3a04e359abfda111f');
  
  console.log('Provider calendar object:', JSON.stringify(provider.calendar, null, 2));
  console.log('\nBusiness hours:', JSON.stringify(provider.calendar?.businessHours, null, 2));
  
  await mongoose.disconnect();
}

test();
