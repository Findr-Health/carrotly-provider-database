// Connect to database
use railway;

// Provider ID
const providerId = ObjectId('697a98f3a04e359abfda111f');

// Add team member
db.providers.updateOne(
  { _id: providerId },
  {
    $push: {
      teamMembers: {
        _id: new ObjectId(),
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
      }
    }
  }
);

// Verify it was added
const provider = db.providers.findOne(
  { _id: providerId },
  { practiceName: 1, 'teamMembers.name': 1, 'teamMembers._id': 1 }
);

print('\n✅ Team member added to: ' + provider.practiceName);
print('\nTeam Members:');
provider.teamMembers.forEach((m, i) => {
  print('  ' + (i+1) + '. ' + m.name + ' (ID: ' + m._id + ')');
});
