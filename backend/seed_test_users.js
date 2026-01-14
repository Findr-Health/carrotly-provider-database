const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const testUsers = [
  {
    email: 'tim@findrhealth.com',
    password: 'Test1234!',
    firstName: 'Tim',
    lastName: 'Wetherill',
    phone: '(406) 555-0101',
    authProvider: 'email',
    dateOfBirth: new Date('1985-06-15'),
    location: {
      city: 'Bozeman',
      state: 'MT',
      zip: '59715'
    },
    notificationPreferences: {
      bookingReminders: true,
      bookingConfirmations: true,
      promotions: true,
      newsletter: true,
      smsEnabled: true,
      pushEnabled: true
    },
    status: 'active',
    agreement: {
      signed: true,
      version: '2.0',
      signedAt: new Date('2025-12-01'),
    }
  },
  {
    email: 'gagi@findrhealth.com',
    password: 'Test1234!',
    firstName: 'Gagi',
    lastName: 'Tester',
    phone: '(406) 555-0202',
    authProvider: 'email',
    dateOfBirth: new Date('1990-03-22'),
    location: {
      city: 'Belgrade',
      state: 'MT',
      zip: '59714'
    },
    notificationPreferences: {
      bookingReminders: true,
      bookingConfirmations: true,
      promotions: false,
      newsletter: false,
      smsEnabled: true,
      pushEnabled: true
    },
    status: 'active',
    agreement: {
      signed: true,
      version: '2.0',
      signedAt: new Date('2025-12-15'),
    }
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of testUsers) {
      const { password, ...rest } = userData;
      
      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        // Update existing user (but not password)
        await User.findByIdAndUpdate(user._id, rest);
        console.log(`✓ Updated: ${userData.email}`);
      } else {
        // Create new user with hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          ...rest,
          password: hashedPassword
        });
        await user.save();
        console.log(`✓ Created: ${userData.email}`);
      }
    }

    // List all users
    const allUsers = await User.find().select('email firstName lastName status');
    console.log('\nAll users in database:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) [${u.status}]`);
    });

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedUsers();
