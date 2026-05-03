-- Add RESTAURANT role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'restaurant';

-- Add restaurant_id and tracking coordinates to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);

-- Create index for faster restaurant order lookups
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
