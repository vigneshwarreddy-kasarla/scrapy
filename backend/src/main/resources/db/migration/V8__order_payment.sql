-- Manual / COD-style payment flags on orders (no PSP integration).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
  END IF;
END
$$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Existing rows before this migration: treat as already settled so behaviour stays intuitive for dev DBs.
UPDATE orders SET payment_status = 'paid', paid_at = COALESCE(delivered_at, updated_at, created_at)
WHERE paid_at IS NULL;
