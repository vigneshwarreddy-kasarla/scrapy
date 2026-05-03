-- Persist country code separately for future multi-country support.
-- Existing phone values are normalized to +91 in this project.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(5);

UPDATE users
SET country_code = '+91'
WHERE country_code IS NULL OR trim(country_code) = '';

ALTER TABLE users
ALTER COLUMN country_code SET DEFAULT '+91';

ALTER TABLE users
ALTER COLUMN country_code SET NOT NULL;
