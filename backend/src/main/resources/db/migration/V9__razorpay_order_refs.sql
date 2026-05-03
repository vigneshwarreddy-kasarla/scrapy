-- Razorpay Order / Payment ids linked to Fillos orders (webhook updates payment state).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_order_id
  ON orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
