-- Delivery: assign agent to order; track completion time.

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'order_status' AND e.enumlabel = 'out_for_delivery') THEN
    ALTER TYPE order_status ADD VALUE 'out_for_delivery';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'order_status' AND e.enumlabel = 'delivered') THEN
    ALTER TYPE order_status ADD VALUE 'delivered';
  END IF;
END
$$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_agent ON orders(delivery_agent_id) WHERE delivery_agent_id IS NOT NULL;
