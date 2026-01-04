// Migration Script: Add new fields to existing providers
// Run with: node migrations/addServiceAndTeamFields.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    console.log('\nUpdating services with new fields...');
    
    const providersWithServices = await providersCollection.find({
      'services.0': { $exists: true }
    }).toArray();
    
    console.log(`Found ${providersWithServices.length} providers with services`);
    
    let servicesUpdated = 0;
    
    for (const provider of providersWithServices) {
      let needsUpdate = false;
      
      const updatedServices = provider.services.map((service, index) => {
        const updated = { ...service };
        
        if (!updated.shortDescription && updated.description) {
          updated.shortDescription = updated.description.substring(0, 100);
          needsUpdate = true;
        }
        
        if (updated.basePrice === undefined && updated.price !== undefined) {
          updated.basePrice = updated.price;
          needsUpdate = true;
        }
        
        if (updated.hasVariants === undefined) {
          updated.hasVariants = false;
          needsUpdate = true;
        }
        
        if (!updated.variants) {
          updated.variants = [];
          needsUpdate = true;
        }
        
        if (updated.sortOrder === undefined) {
          updated.sortOrder = index;
          needsUpdate = true;
        }
        
        return updated;
      });
      
      if (needsUpdate) {
        await providersCollection.updateOne(
          { _id: provider._id },
          { $set: { services: updatedServices } }
        );
        servicesUpdated++;
      }
    }
    
    console.log(`Updated services for ${servicesUpdated} providers`);

    console.log('\nUpdating team members with new fields...');
    
    const providersWithTeam = await providersCollection.find({
      'teamMembers.0': { $exists: true }
    }).toArray();
    
    console.log(`Found ${providersWithTeam.length} providers with team members`);
    
    let teamUpdated = 0;
    
    for (const provider of providersWithTeam) {
      let needsUpdate = false;
      
      const updatedTeamMembers = provider.teamMembers.map(member => {
        const updated = { ...member };
        
        if (updated.rating === undefined) {
          updated.rating = 0;
          needsUpdate = true;
        }
        
        if (updated.reviewCount === undefined) {
          updated.reviewCount = 0;
          needsUpdate = true;
        }
        
        if (!updated.serviceIds) {
          updated.serviceIds = [];
          needsUpdate = true;
        }
        
        return updated;
      });
      
      if (needsUpdate) {
        await providersCollection.updateOne(
          { _id: provider._id },
          { $set: { teamMembers: updatedTeamMembers } }
        );
        teamUpdated++;
      }
    }
    
    console.log(`Updated team members for ${teamUpdated} providers`);

    console.log('\nAdding provider-level rating fields...');
    
    const ratingResult = await providersCollection.updateMany(
      { rating: { $exists: false } },
      { $set: { rating: 0, reviewCount: 0 } }
    );
    
    console.log(`Added rating fields to ${ratingResult.modifiedCount} providers`);

    console.log('\nAdding cancellation policy field...');
    
    const policyResult = await providersCollection.updateMany(
      { cancellationPolicy: { $exists: false } },
      { $set: { cancellationPolicy: 'standard' } }
    );
    
    console.log(`Added cancellation policy to ${policyResult.modifiedCount} providers`);

    console.log('\n==================================================');
    console.log('MIGRATION SUMMARY');
    console.log('==================================================');
    console.log(`Services updated: ${servicesUpdated} providers`);
    console.log(`Team members updated: ${teamUpdated} providers`);
    console.log(`Rating fields added: ${ratingResult.modifiedCount} providers`);
    console.log(`Cancellation policy added: ${policyResult.modifiedCount} providers`);
    console.log('==================================================');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrate();
