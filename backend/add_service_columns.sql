-- Add missing columns to provider_services table
ALTER TABLE provider_services 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing rows
UPDATE provider_services SET is_active = true WHERE is_active IS NULL;
