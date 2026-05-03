-- Normalize legacy dev-seed phones to India format expected by auth normalization.
-- Also remove legacy standalone salt column (bcrypt salt is embedded in password_hash).

UPDATE users u
SET phone = '+919995550001',
    country_code = '+91',
    updated_at = NOW()
WHERE u.id = '10000001-0001-4001-8001-000000000001'::uuid
  AND u.phone = '+19995550001'
  AND NOT EXISTS (
    SELECT 1
    FROM users x
    WHERE x.phone = '+919995550001'
      AND x.id <> u.id
  );

UPDATE users u
SET phone = '+919995550002',
    country_code = '+91',
    updated_at = NOW()
WHERE u.id = '10000001-0001-4001-8001-000000000002'::uuid
  AND u.phone = '+19995550002'
  AND NOT EXISTS (
    SELECT 1
    FROM users x
    WHERE x.phone = '+919995550002'
      AND x.id <> u.id
  );

UPDATE users u
SET phone = '+919995550003',
    country_code = '+91',
    updated_at = NOW()
WHERE u.id = '10000001-0001-4001-8001-000000000003'::uuid
  AND u.phone = '+19995550003'
  AND NOT EXISTS (
    SELECT 1
    FROM users x
    WHERE x.phone = '+919995550003'
      AND x.id <> u.id
  );

ALTER TABLE users
DROP COLUMN IF EXISTS salt;
