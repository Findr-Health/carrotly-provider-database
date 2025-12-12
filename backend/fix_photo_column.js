const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixColumn() {
  try {
    console.log('Changing cloudinary_url to TEXT...');
    
    await pool.query(`
      ALTER TABLE provider_photos 
      ALTER COLUMN cloudinary_url TYPE TEXT
    `);
    
    console.log('✅ Column updated!');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'provider_photos' 
      AND column_name = 'cloudinary_url'
    `);
    
    console.log('Column info:', result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixColumn();
