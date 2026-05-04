INSERT INTO users (id, name, email, phone, password_hash, salt, role, is_active, token_version, fcm_token, created_at, updated_at, deleted_at)
VALUES
  ('10000001-0001-4001-8001-000000000004', 'Dina Restaurant', NULL, '+19995550004',
   crypt('DummyPass1', gen_salt('bf', 10)), NULL, 'restaurant', TRUE, 0, NULL, NOW(), NOW(), NULL)
ON CONFLICT (phone) DO NOTHING;
