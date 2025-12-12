-- Change cloudinary_url from VARCHAR(500) to TEXT
ALTER TABLE provider_photos 
ALTER COLUMN cloudinary_url TYPE TEXT;

-- Verify
\d provider_photos
