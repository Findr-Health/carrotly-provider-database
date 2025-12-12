-- ============================================
-- PROVIDER TABLE UPDATES
-- ============================================

-- Add verification fields
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_code_sent_at TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add Google data fields
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_data JSONB;

-- Add payment/agreement tracking
ALTER TABLE providers ADD COLUMN IF NOT EXISTS payment_setup_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS payment_setup_at TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP;

-- Add admin fields
ALTER TABLE providers ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_providers_verification_method ON providers(verification_method);
CREATE INDEX IF NOT EXISTS idx_providers_google_place_id ON providers(google_place_id);
CREATE INDEX IF NOT EXISTS idx_providers_payment_complete ON providers(payment_setup_complete);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);

-- ============================================
-- STRIPE ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS provider_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) UNIQUE,
  stripe_account_type VARCHAR(50),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  default_currency VARCHAR(3) DEFAULT 'USD',
  country VARCHAR(2),
  business_type VARCHAR(50),
  platform_fee_percentage DECIMAL(5,2) DEFAULT 15.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_provider ON provider_stripe_accounts(provider_id);

-- ============================================
-- VERIFICATION LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  verification_type VARCHAR(20),
  code_sent VARCHAR(10),
  code_entered VARCHAR(10),
  success BOOLEAN,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_provider ON verification_logs(provider_id);

-- ============================================
-- EDIT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS provider_edit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edit_history_provider ON provider_edit_history(provider_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_date ON provider_edit_history(changed_at);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS provider_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  photo_url TEXT,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  bio TEXT,
  credentials VARCHAR(255),
  specialties TEXT[],
  years_experience INT,
  accepts_bookings BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_provider ON provider_team_members(provider_id);
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON provider_team_members(provider_id, display_order);

