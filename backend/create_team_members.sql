-- Create team_members table
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
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_members_provider ON team_members(provider_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- Show structure
\d team_members
