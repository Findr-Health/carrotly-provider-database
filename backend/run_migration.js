const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  console.log('🔄 Starting migration...\n');
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('migration_v2_onboarding.sql', 'utf8');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify new columns exist
    console.log('🔍 Verifying new columns...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'providers' 
      AND column_name IN (
        'verification_method', 
        'google_place_id', 
        'payment_setup_complete',
        'admin_notes'
      )
      ORDER BY column_name
    `);
    
    console.log('New columns in providers table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    // Verify new tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'provider_stripe_accounts',
        'verification_logs',
        'provider_edit_history',
        'provider_team_members'
      )
      ORDER BY table_name
    `);
    
    console.log('\nNew tables created:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log('\n🎉 All done!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();
