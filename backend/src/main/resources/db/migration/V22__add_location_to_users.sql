-- Add location tracking coordinates to users table for registration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8);

-- Create a spatial index if we ever need to do proximity searches
-- Note: Requires PostGIS, so we use standard B-tree index on lat/lng for now 
CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lng);
