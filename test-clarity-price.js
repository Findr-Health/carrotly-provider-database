require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    console.log('🧪 Testing Clarity Price Configuration...\n');
    
    // Test MongoDB
    console.log('1. Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected\n');
    
    // Test Google Vision API key
    console.log('2. Testing Google Vision API...');
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('   ✅ Google Vision API key found');
      console.log('   Key length:', process.env.GOOGLE_CLOUD_VISION_API_KEY.length, 'characters\n');
    } else {
      console.log('   ❌ Google Vision API key missing\n');
    }
    
    // Test Anthropic API key
    console.log('3. Testing Anthropic API...');
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('   ✅ Anthropic API key found');
      console.log('   Key starts with:', process.env.ANTHROPIC_API_KEY.substring(0, 7), '...\n');
    } else {
      console.log('   ❌ Anthropic API key missing\n');
    }
    
    // Test Cloudinary
    console.log('4. Testing Cloudinary...');
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      console.log('   ✅ Cloudinary fully configured');
      console.log('   Cloud name:', process.env.CLOUDINARY_CLOUD_NAME, '\n');
    } else {
      console.log('   ❌ Cloudinary configuration incomplete\n');
    }
    
    // Test file existence
    console.log('5. Testing Clarity Price files...');
    const fs = require('fs');
    const files = [
      'backend/models/clarityPrice/Bill.js',
      'backend/models/clarityPrice/PricingIntelligence.js',
      'backend/models/clarityPrice/Analytics.js',
      'backend/services/clarityPrice/ocrService.js',
      'backend/services/clarityPrice/billParsingService.js',
      'backend/services/clarityPrice/pricingAnalysisService.js',
      'backend/services/clarityPrice/explanationService.js',
      'backend/services/clarityPrice/imageManagementService.js',
      'backend/services/clarityPrice/billProcessingService.js',
      'backend/routes/clarityPriceRoutes.js',
      'backend/data/medicare/medicare-rates.js',
      'backend/data/medicare/regionalAdjustments.js'
    ];
    
    let allFilesExist = true;
    for (const file of files) {
      if (fs.existsSync(file)) {
        console.log('   ✅', file);
      } else {
        console.log('   ❌', file, 'MISSING');
        allFilesExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    if (allFilesExist) {
      console.log('🎉 SUCCESS! All Clarity Price systems ready!');
      console.log('='.repeat(60));
      console.log('\n📋 Next steps:');
      console.log('   1. Integrate routes into server.js');
      console.log('   2. Add cron job for image cleanup');
      console.log('   3. Commit and push to Railway\n');
    } else {
      console.log('⚠️  Some files are missing - check installation');
      console.log('='.repeat(60));
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

test();
