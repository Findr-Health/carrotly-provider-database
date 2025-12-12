const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTeamTable() {
  try {
    console.log('Creating team_members table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        photo_url TEXT,
        bio TEXT,
        specialties TEXT[],
        credentials TEXT[],
        email VARCHAR(255),
        phone VARCHAR(50),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Table created!');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team_members_provider ON team_members(provider_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active)`);
    
    console.log('✅ Indexes created!');
    
    // Verify
    const result = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'team_members'`);
    console.log('Columns:', result.rows.map(r => r.column_name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTeamTable();
