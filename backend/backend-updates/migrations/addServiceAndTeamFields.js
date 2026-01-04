// Migration Script: Add new fields to existing providers
// Run with: node migrations/addServiceAndTeamFields.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const providersCollection = db.collection('providers');

    // ============================================
    // 1. Update services with new fields
    // ============================================
    console.log('\n📋 Updating services with new fields...');
    
    const providersWithServices = await providersCollection.find({
      'services.0': { $exists: true }
    }).toArray();
    
    console.log(`Found ${providersWithServices.length} providers with services`);
    
    let servicesUpdated = 0;
    
    for (const provider of providersWithServices) {
      let needsUpdate = false;
      
      const updatedServices = provider.services.map((service, index) => {
        const updated = { ...service };
        
        // Add shortDescription if missing
        if (!updated.shortDescription && updated.description) {
          updated.shortDescription = updated.description.substring(0, 100);
          needsUpdate = true;
        }
        
        // Add basePrice if missing (use price as default)
        if (updated.basePrice === undefined && updated.price !== undefined) {
          updated.basePrice = updated.price;
          needsUpdate = true;
        }
        
        // Add hasVariants if missing
        if (updated.hasVariants === undefined) {
          updated.hasVariants = false;
          needsUpdate = true;
        }
        
        // Add variants array if missing
        if (!updated.variants) {
          updated.variants = [];
          needsUpdate = true;
        }
        
        // Add sortOrder if missing
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
    
    console.log(`✅ Updated services for ${servicesUpdated} providers`);

    // ============================================
    // 2. Update team members with new fields
    // ============================================
    console.log('\n👥 Updating team members with new fields...');
    
    const providersWithTeam = await providersCollection.find({
      'teamMembers.0': { $exists: true }
    }).toArray();
    
    console.log(`Found ${providersWithTeam.length} providers with team members`);
    
    let teamUpdated = 0;
    
    for (const provider of providersWithTeam) {
      let needsUpdate = false;
      
      const updatedTeamMembers = provider.teamMembers.map(member => {
        const updated = { ...member };
        
        // Add rating if missing
        if (updated.rating === undefined) {
          updated.rating = 0;
          needsUpdate = true;
        }
        
        // Add reviewCount if missing
        if (updated.reviewCount === undefined) {
          updated.reviewCount = 0;
          needsUpdate = true;
        }
        
        // Add serviceIds if missing (empty = can do all services)
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
    
    console.log(`✅ Updated team members for ${teamUpdated} providers`);

    // ============================================
    // 3. Add provider-level rating fields
    // ============================================
    console.log('\n⭐ Adding provider-level rating fields...');
    
    const ratingResult = await providersCollection.updateMany(
      { rating: { $exists: false } },
      { $set: { rating: 0, reviewCount: 0 } }
    );
    
    console.log(`✅ Added rating fields to ${ratingResult.modifiedCount} providers`);

    // ============================================
    // 4. Add cancellationPolicy if missing
    // ============================================
    console.log('\n📜 Adding cancellation policy field...');
    
    const policyResult = await providersCollection.updateMany(
      { cancellationPolicy: { $exists: false } },
      { $set: { cancellationPolicy: 'standard' } }
    );
    
    console.log(`✅ Added cancellation policy to ${policyResult.modifiedCount} providers`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Services updated: ${servicesUpdated} providers`);
    console.log(`Team members updated: ${teamUpdated} providers`);
    console.log(`Rating fields added: ${ratingResult.modifiedCount} providers`);
    console.log(`Cancellation policy added: ${policyResult.modifiedCount} providers`);
    console.log('='.repeat(50));
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrate();
