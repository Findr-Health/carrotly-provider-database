-- ========================================
-- CARROTLY PROVIDER DATABASE SCHEMA
-- Version: 1.0 MVP
-- Database: PostgreSQL 14+
-- Purpose: Portable provider database for marketplace
-- ========================================

-- Enable extensions for advanced features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text matching
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geospatial queries (optional)

-- ========================================
-- CORE TABLES
-- ========================================

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_email ON admin_users(email);

-- Insert default admin (password: admin123 - CHANGE THIS!)
INSERT INTO admin_users (email, password_hash, full_name, role) 
VALUES (
  'admin@carrotly.com',
  '$2b$10$rHz5C.gYL6K4.9x0K6YvJOXKZ5YQXx3.zWQF0KvY8GRbYGBYvqF3u', -- bcrypt hash of 'admin123'
  'System Administrator',
  'super_admin'
);


-- ========================================
-- PROVIDER PROFILES (Main table)
-- ========================================
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information (Step 1)
  practice_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  provider_types TEXT[] NOT NULL, -- ['medical', 'dental', 'cosmetic', etc.]
  
  -- Location (Step 2)
  street_address VARCHAR(255) NOT NULL,
  suite_number VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website VARCHAR(500),
  
  -- Status & Source
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'live', 'suspended', 'rejected')),
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'agent', 'import', 'claimed')),
  
  -- Data quality (for agent-generated profiles)
  data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  agent_confidence_score INTEGER,
  needs_review BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES admin_users(id),
  last_verified_at TIMESTAMP,
  
  -- Soft delete
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_providers_status ON providers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_providers_location ON providers(city, state, zip_code);
CREATE INDEX idx_providers_types ON providers USING GIN(provider_types);
CREATE INDEX idx_providers_email ON providers(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_providers_source ON providers(source);

-- Full-text search index
CREATE INDEX idx_providers_name_trgm ON providers USING gin (practice_name gin_trgm_ops);
CREATE INDEX idx_providers_address_trgm ON providers USING gin (street_address gin_trgm_ops);

-- Geospatial index (if using PostGIS)
-- CREATE INDEX idx_providers_location_geo ON providers USING GIST (geography(ST_MakePoint(longitude, latitude)));


-- ========================================
-- PROVIDER PHOTOS
-- ========================================
CREATE TABLE provider_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  -- Cloudinary URLs
  cloudinary_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  cloudinary_secure_url VARCHAR(500),
  
  -- Photo details
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  format VARCHAR(10), -- jpg, png, webp
  
  -- Source tracking
  source VARCHAR(50) DEFAULT 'manual', -- manual/agent_scraped/provider_upload/admin_upload
  original_url VARCHAR(500), -- If scraped from provider website
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT one_primary_per_provider UNIQUE (provider_id, is_primary) 
    WHERE is_primary = TRUE
);

CREATE INDEX idx_photos_provider ON provider_photos(provider_id);
CREATE INDEX idx_photos_primary ON provider_photos(provider_id, is_primary);


-- ========================================
-- SERVICES OFFERED
-- ========================================
CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  service_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'preventive', 'restorative', 'cosmetic', etc.
  description TEXT,
  
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- Store as cents to avoid float precision issues
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_services_provider ON provider_services(provider_id);
CREATE INDEX idx_services_category ON provider_services(category);
CREATE INDEX idx_services_active ON provider_services(is_active);


-- ========================================
-- OPTIONAL PROVIDER DETAILS
-- ========================================
CREATE TABLE provider_details (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  
  -- License Information (Step 5)
  license_number VARCHAR(100),
  license_state VARCHAR(2),
  license_expiration DATE,
  
  -- Professional Background
  years_experience INTEGER,
  education TEXT,
  bio TEXT,
  certifications TEXT[], -- Array of certification names
  specialties TEXT[],
  
  -- Insurance & Languages
  insurance_accepted TEXT[],
  languages_spoken TEXT[],
  
  -- Business Details
  business_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
  payment_methods TEXT[], -- ['cash', 'credit', 'insurance']
  
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ========================================
-- TEAM MEMBERS (Future - Step 8)
-- ========================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  photo_url VARCHAR(500),
  credentials VARCHAR(100),
  years_experience INTEGER,
  bio TEXT,
  specialties TEXT[],
  accepts_bookings BOOLEAN DEFAULT FALSE,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_provider ON team_members(provider_id);


-- ========================================
-- LEGAL AGREEMENTS
-- ========================================
CREATE TABLE provider_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  signature VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  initials JSONB NOT NULL, -- {"1": "JS", "2": "JS", ..., "16": "JS"}
  
  agreed_date TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  version VARCHAR(20) DEFAULT '2025',
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agreements_provider ON provider_agreements(provider_id);


-- ========================================
-- AI AGENT TRACKING
-- ========================================
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Search parameters
  search_city VARCHAR(100),
  search_state VARCHAR(2),
  search_zip VARCHAR(10),
  categories TEXT[], -- ['medical', 'dental']
  max_profiles INTEGER DEFAULT 25,
  
  -- Results summary
  providers_found INTEGER DEFAULT 0,
  exact_duplicates INTEGER DEFAULT 0,
  fuzzy_duplicates INTEGER DEFAULT 0,
  similar_flagged INTEGER DEFAULT 0,
  profiles_created INTEGER DEFAULT 0,
  low_confidence_count INTEGER DEFAULT 0,
  
  -- Detailed results (JSON)
  skipped_providers JSONB, -- [{name, reason, match_type, existing_id}]
  flagged_providers JSONB, -- [{name, similarity, existing_name, needs_review}]
  created_providers JSONB, -- [{id, name, confidence_score}]
  
  -- Performance metrics
  duration_seconds INTEGER,
  api_calls_made INTEGER,
  websites_scraped INTEGER,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Audit
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  executed_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_agent_runs_date ON agent_runs(started_at DESC);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_location ON agent_runs(search_city, search_state);


-- ========================================
-- AUDIT LOG (Track all changes)
-- ========================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type VARCHAR(50), -- 'provider', 'service', 'photo', 'agreement'
  entity_id UUID,
  action VARCHAR(50), -- 'created', 'updated', 'deleted', 'approved', 'rejected'
  
  changed_by UUID REFERENCES admin_users(id),
  changes JSONB, -- {"field": {"old": "value", "new": "value"}}
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(changed_by);


-- ========================================
-- DATA EXPORT LOGS
-- ========================================
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  export_type VARCHAR(50), -- 'json', 'csv', 'sql'
  format VARCHAR(50),
  record_count INTEGER,
  file_size_kb INTEGER,
  file_url VARCHAR(500),
  
  filters JSONB, -- What was exported (e.g., {"status": "approved", "city": "Bozeman"})
  
  exported_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exports_date ON export_logs(created_at DESC);


-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check for duplicate providers
CREATE OR REPLACE FUNCTION check_duplicate_provider(
  p_name VARCHAR,
  p_address VARCHAR,
  p_zip VARCHAR,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  provider_id UUID,
  match_type VARCHAR,
  similarity_score FLOAT,
  existing_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH input AS (
    SELECT 
      p_name as search_name,
      p_address as search_address,
      p_zip as search_zip,
      p_phone as search_phone
  )
  SELECT 
    p.id,
    CASE
      -- Exact match
      WHEN LOWER(p.practice_name) = LOWER(i.search_name)
           AND LOWER(p.street_address) = LOWER(i.search_address)
           AND p.zip_code = i.search_zip
      THEN 'exact'
      
      -- Phone match
      WHEN i.search_phone IS NOT NULL AND p.phone = i.search_phone
      THEN 'phone'
      
      -- High fuzzy match
      WHEN similarity(p.practice_name, i.search_name) > 0.85
           AND p.zip_code = i.search_zip
      THEN 'fuzzy_high'
      
      -- Medium fuzzy match
      WHEN similarity(p.practice_name, i.search_name) > 0.70
           AND p.zip_code = i.search_zip
      THEN 'fuzzy_medium'
      
      -- Same address only
      WHEN LOWER(p.street_address) = LOWER(i.search_address)
           AND p.zip_code = i.search_zip
      THEN 'address_only'
      
      ELSE 'no_match'
    END as match_type,
    similarity(p.practice_name, i.search_name) as similarity_score,
    p.practice_name as existing_name
  FROM providers p, input i
  WHERE 
    p.deleted_at IS NULL
    AND (
      p.zip_code = i.search_zip
      OR (i.search_phone IS NOT NULL AND p.phone = i.search_phone)
      OR similarity(p.practice_name, i.search_name) > 0.6
    )
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;


-- Function to update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON provider_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_details_updated_at BEFORE UPDATE ON provider_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Complete provider profile view
CREATE VIEW provider_profiles AS
SELECT 
  p.*,
  pd.license_number,
  pd.years_experience,
  pd.bio,
  pd.certifications,
  pd.insurance_accepted,
  pd.languages_spoken,
  
  -- Count relationships
  (SELECT COUNT(*) FROM provider_photos WHERE provider_id = p.id) as photo_count,
  (SELECT COUNT(*) FROM provider_services WHERE provider_id = p.id) as service_count,
  (SELECT COUNT(*) FROM team_members WHERE provider_id = p.id AND is_active = TRUE) as team_member_count,
  
  -- Primary photo
  (SELECT cloudinary_url FROM provider_photos WHERE provider_id = p.id AND is_primary = TRUE LIMIT 1) as primary_photo_url,
  
  -- Agreement status
  (SELECT COUNT(*) > 0 FROM provider_agreements WHERE provider_id = p.id) as has_signed_agreement
  
FROM providers p
LEFT JOIN provider_details pd ON pd.provider_id = p.id
WHERE p.deleted_at IS NULL;


-- Public provider list (for consumer app API)
CREATE VIEW public_providers AS
SELECT 
  p.id,
  p.practice_name,
  p.provider_types,
  p.street_address,
  p.city,
  p.state,
  p.zip_code,
  p.latitude,
  p.longitude,
  p.website,
  
  pd.bio,
  pd.years_experience,
  pd.languages_spoken,
  
  (SELECT cloudinary_url FROM provider_photos WHERE provider_id = p.id AND is_primary = TRUE LIMIT 1) as primary_photo,
  (SELECT COUNT(*) FROM provider_photos WHERE provider_id = p.id) as photo_count,
  
  -- Aggregate services
  (
    SELECT json_agg(json_build_object(
      'name', service_name,
      'category', category,
      'duration', duration_minutes,
      'price', price_cents
    ))
    FROM provider_services 
    WHERE provider_id = p.id AND is_active = TRUE
  ) as services
  
FROM providers p
LEFT JOIN provider_details pd ON pd.provider_id = p.id
WHERE p.status = 'live' 
  AND p.deleted_at IS NULL;


-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Uncomment to insert sample data
/*
INSERT INTO providers (
  practice_name, email, phone, provider_types,
  street_address, city, state, zip_code,
  status, source, data_quality_score
) VALUES 
  (
    'Smith Family Medicine',
    'contact@smithfamilymedicine.com',
    '(406) 555-0123',
    ARRAY['medical'],
    '123 Main Street',
    'Bozeman',
    'MT',
    '59715',
    'approved',
    'manual',
    95
  ),
  (
    'Bozeman Dental Care',
    'info@bozemandentalcare.com',
    '(406) 555-0456',
    ARRAY['dental'],
    '456 Oak Avenue',
    'Bozeman',
    'MT',
    '59715',
    'approved',
    'manual',
    98
  );
*/


-- ========================================
-- GRANT PERMISSIONS (Adjust as needed)
-- ========================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;


-- ========================================
-- SCHEMA VERSION TRACKING
-- ========================================

CREATE TABLE schema_version (
  version VARCHAR(20) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('1.0.0', 'Initial MVP schema with duplicate detection');


-- ========================================
-- END OF SCHEMA
-- ========================================
