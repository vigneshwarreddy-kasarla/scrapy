-- Normalize restaurant phone to +91 to match login normalization logic
UPDATE users
SET phone = '+919995550004'
WHERE phone = '+19995550004'
  AND role = 'restaurant';
