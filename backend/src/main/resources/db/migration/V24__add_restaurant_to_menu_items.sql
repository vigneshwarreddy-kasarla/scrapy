ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES users(id);

-- Assign all existing items to the Dina Restaurant for testing
UPDATE menu_items 
SET restaurant_id = '10000001-0001-4001-8001-000000000004'
WHERE restaurant_id IS NULL;
