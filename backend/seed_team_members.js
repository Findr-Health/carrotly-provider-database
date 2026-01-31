/**
 * Findr Health - Team Members Seed Script
 * 
 * Adds test team members to existing provider for:
 * - Multi-team member booking flow testing
 * - Calendar integration testing
 * - Provider portal team management testing
 * 
 * Usage: node seed_team_members.js
 */

const mongoose = require('mongoose');
const Provider = require('./models/Provider');

// Use public MongoDB URL for external connections
const MONGODB_URI = process.env.MONGO_PUBLIC_URL || process.env.MONGODB_URI || process.env.MONGO_URL;

if (!MONGODB_URI) {
  console.error('❌ Error: MongoDB URI not found in environment');
  console.log('💡 Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
  process.exit(1);
}

// Provider to update
const PROVIDER_ID = '697a98f3a04e359abfda111f';

// Team members to add
const TEAM_MEMBERS = [
  {
    name: 'Dr. Sarah Johnson',
    title: 'Lead Physical Therapist',
    credentials: 'DPT, OCS, CSCS',
    bio: 'Dr. Johnson specializes in sports injuries and post-surgical rehabilitation. With over 10 years of experience, she has worked with professional athletes and weekend warriors alike, helping them return to peak performance.',
    specialties: ['Sports Medicine', 'Post-Surgical Rehab', 'Manual Therapy'],
    yearsExperience: 10,
    acceptsBookings: true,
    calendar: {
      provider: null,
      connected: false,
      syncStatus: 'disconnected',
      bufferMinutes: 15,
      minNoticeHours: 24,
      maxDaysOut: 60
    }
  },
  {
    name: 'Mike Chen',
    title: 'Physical Therapist',
    credentials: 'DPT, CMPT',
    bio: 'Mike focuses on chronic pain management and movement optimization. He uses evidence-based manual therapy techniques combined with therapeutic exercise to help patients achieve lasting relief and improved function.',
    specialties: ['Chronic Pain', 'Manual Therapy', 'Movement Assessment'],
    yearsExperience: 7,
    acceptsBookings: true,
    calendar: {
      provider: null,
      connected: false,
      syncStatus: 'disconnected',
      bufferMinutes: 15,
      minNoticeHours: 48,
      maxDaysOut: 45
    }
  }
];

async function seedTeamMembers() {
  console.log('🌱 Findr Health - Team Members Seed Script');
  console.log('==========================================\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find provider
    console.log(`🔍 Finding provider: ${PROVIDER_ID}`);
    const provider = await Provider.findById(PROVIDER_ID);

    if (!provider) {
      console.error(`❌ Provider not found: ${PROVIDER_ID}`);
      console.log('💡 Available providers:');
      const providers = await Provider.find({}, { _id: 1, practiceName: 1 }).limit(5);
      providers.forEach(p => console.log(`   - ${p.practiceName} (${p._id})`));
      process.exit(1);
    }

    console.log(`✅ Found: ${provider.practiceName}`);
    console.log(`   Location: ${provider.address.city}, ${provider.address.state}`);
    console.log(`   Current team size: ${provider.teamMembers.length}\n`);

    // Check if team members already exist
    const existingNames = provider.teamMembers.map(m => m.name);
    const newMembers = TEAM_MEMBERS.filter(m => !existingNames.includes(m.name));

    if (newMembers.length === 0) {
      console.log('ℹ️  All team members already exist. Skipping...');
      console.log('\n📋 Current Team Members:');
      provider.teamMembers.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name} - ${m.title}`);
        console.log(`      ID: ${m._id}`);
        console.log(`      Calendar: ${m.calendar?.connected ? '✅ Connected' : '⚠️  Not connected'}`);
      });
      process.exit(0);
    }

    // Add new team members
    console.log(`➕ Adding ${newMembers.length} new team member(s)...\n`);
    
    newMembers.forEach((member, index) => {
      provider.teamMembers.push(member);
      console.log(`   ${index + 1}. ${member.name} - ${member.title}`);
      console.log(`      Specialties: ${member.specialties.join(', ')}`);
      console.log(`      Experience: ${member.yearsExperience} years`);
    });

    // Save provider with new team members
    console.log('\n💾 Saving to database...');
    await provider.save();
    console.log('✅ Saved successfully!\n');

    // Display final team roster
    console.log('📋 Updated Team Members:');
    provider.teamMembers.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} - ${m.title}`);
      console.log(`      ID: ${m._id}`);
      console.log(`      Accepts Bookings: ${m.acceptsBookings ? '✅' : '❌'}`);
      console.log(`      Calendar Status: ${m.calendar?.syncStatus || 'not configured'}`);
    });

    console.log('\n✅ Team members seeded successfully!');
    console.log('\n🧪 Next Steps for Testing:');
    console.log('   1. Test OAuth: Use any team member ID above');
    console.log('   2. Test Booking: Select different team members in booking flow');
    console.log('   3. Test Availability: Check /api/availability endpoint');
    console.log(`\n💡 Provider ID: ${PROVIDER_ID}`);
    console.log(`💡 Team Member IDs: ${provider.teamMembers.map(m => m._id).join(', ')}`);

  } catch (error) {
    console.error('\n❌ Error seeding team members:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the seed script
seedTeamMembers();
