-- Align seed accounts with enforced password policy (uppercase, lowercase, number, special, no spaces).
-- New seed password: DummyPass1!

UPDATE users
SET password_hash = crypt('DummyPass1!', gen_salt('bf', 10)),
    updated_at = NOW()
WHERE phone IN ('+19995550001', '+19995550002', '+19995550003')
  AND deleted_at IS NULL;
