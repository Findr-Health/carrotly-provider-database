const mongoose = require('mongoose');
require('dotenv').config();

const Provider = require('./models/Provider');

async function addTeamMember() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const providerId = '697a98f3a04e359abfda111f';
    
    // Find provider
    const provider = await Provider.findById(providerId);
    if (!provider) {
      console.log('❌ Provider not found');
      process.exit(1);
    }

    console.log(`📋 Provider: ${provider.practiceName}`);

    // Add team member
    provider.teamMembers.push({
      name: 'Dr. Sarah Johnson',
      title: 'Physical Therapist',
      credentials: 'DPT, OCS',
      bio: 'Specializes in sports injuries and rehabilitation',
      specialties: ['Sports Medicine', 'Rehabilitation'],
      yearsExperience: 8,
      acceptsBookings: true,
      calendar: {
        provider: null,
        connected: false,
        syncStatus: 'disconnected'
      }
    });

    await provider.save();

    console.log('\n✅ Team member added successfully!');
    console.log('\nTeam Members:');
    provider.teamMembers.forEach((m, i) => {
      console.log(`  ${i+1}. ${m.name} (ID: ${m._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTeamMember();
