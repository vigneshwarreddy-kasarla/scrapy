-- Extra lifecycle values for kitchen / support (admin-only updates in app).

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'order_status' AND e.enumlabel = 'confirmed') THEN
    ALTER TYPE order_status ADD VALUE 'confirmed';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'order_status' AND e.enumlabel = 'cancelled') THEN
    ALTER TYPE order_status ADD VALUE 'cancelled';
  END IF;
END
$$;
