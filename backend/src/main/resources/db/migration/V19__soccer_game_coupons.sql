DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_key') THEN
    CREATE TYPE game_key AS ENUM ('soccer');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS game_coupon_settings (
  game_key game_key PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  min_discount_percent INTEGER NOT NULL DEFAULT 5,
  max_discount_percent INTEGER NOT NULL DEFAULT 25,
  coupon_ttl_hours INTEGER NOT NULL DEFAULT 24,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO game_coupon_settings (game_key)
VALUES (CAST('soccer' AS game_key))
ON CONFLICT (game_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS game_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  game_key game_key NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_coupons_user_game ON game_coupons(user_id, game_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_coupons_code ON game_coupons(code);
