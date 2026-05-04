-- Dev dummy data: users, menu, address, cart, orders (mixed states), review.
-- Password for all seed phones: DummyPass1 (bcrypt via pgcrypto).
-- Phones: +19995550001 customer | +19995550002 admin | +19995550003 delivery_agent
-- Images: http://localhost:8080/dummyimages/<file>.png

-- Emails NULL so seed never collides with accounts you created via the API.
INSERT INTO users (id, name, email, phone, password_hash, salt, role, is_active, token_version, fcm_token, created_at, updated_at, deleted_at)
VALUES
  ('10000001-0001-4001-8001-000000000001', 'Ada Customer', NULL, '+19995550001',
   crypt('DummyPass1', gen_salt('bf', 10)), NULL, 'customer', TRUE, 0, NULL, NOW(), NOW(), NULL)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO users (id, name, email, phone, password_hash, salt, role, is_active, token_version, fcm_token, created_at, updated_at, deleted_at)
VALUES
  ('10000001-0001-4001-8001-000000000002', 'Ben Admin', NULL, '+19995550002',
   crypt('DummyPass1', gen_salt('bf', 10)), NULL, 'admin', TRUE, 0, NULL, NOW(), NOW(), NULL)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO users (id, name, email, phone, password_hash, salt, role, is_active, token_version, fcm_token, created_at, updated_at, deleted_at)
VALUES
  ('10000001-0001-4001-8001-000000000003', 'Carlos Rider', NULL, '+19995550003',
   crypt('DummyPass1', gen_salt('bf', 10)), NULL, 'delivery_agent', TRUE, 0, NULL, NOW(), NOW(), NULL)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO menu_categories (id, name, display_order, is_active, image_url)
VALUES
  ('20000001-0002-4002-8002-000000000001', 'Starters', 1, TRUE,
   'http://localhost:8080/dummyimages/cat-starters.png'),
  ('20000001-0002-4002-8002-000000000002', 'Mains', 2, TRUE,
   'http://localhost:8080/dummyimages/cat-mains.png'),
  ('20000001-0002-4002-8002-000000000003', 'Drinks', 3, TRUE,
   'http://localhost:8080/dummyimages/cat-drinks.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, category_id, name, description, price, discounted_price, image_url, is_veg, is_available, preparation_time, calories, tags, display_order)
VALUES
  ('30000001-0003-4003-8003-000000000001', '20000001-0002-4002-8002-000000000001', 'Tomato Shorba',
   'Light spiced tomato soup.', 4.99, NULL,
   'http://localhost:8080/dummyimages/item-soup.png', TRUE, TRUE, 12, 120,
   ARRAY['soup','vegan-friendly']::TEXT[], 0),
  ('30000001-0003-4003-8003-000000000002', '20000001-0002-4002-8002-000000000001', 'Spring Rolls',
   'Crispy vegetable rolls with dip.', 6.50, 5.75,
   'http://localhost:8080/dummyimages/item-rolls.png', TRUE, TRUE, 15, 210,
   ARRAY['crispy']::TEXT[], 1),
  ('30000001-0003-4003-8003-000000000003', '20000001-0002-4002-8002-000000000002', 'Masala Dosa',
   'Crisp rice-lentil crepe with potato filling.', 7.00, 5.99,
   'http://localhost:8080/dummyimages/item-dosa.png', TRUE, TRUE, 18, 340,
   ARRAY['south-indian','popular']::TEXT[], 0),
  ('30000001-0003-4003-8003-000000000004', '20000001-0002-4002-8002-000000000002', 'Hyderabadi Biryani',
   'Fragrant basmati with spiced chicken.', 12.00, NULL,
   'http://localhost:8080/dummyimages/item-biryani.png', FALSE, TRUE, 35, 620,
   ARRAY['spicy','chef-special']::TEXT[], 1),
  ('30000001-0003-4003-8003-000000000005', '20000001-0002-4002-8002-000000000003', 'Mango Lassi',
   'Sweet yogurt mango shake.', 3.50, NULL,
   'http://localhost:8080/dummyimages/item-lassi.png', TRUE, TRUE, 5, 180,
   ARRAY['sweet']::TEXT[], 0),
  ('30000001-0003-4003-8003-000000000006', '20000001-0002-4002-8002-000000000003', 'Cold Coffee',
   'Chilled coffee with cream.', 4.00, 3.25,
   'http://localhost:8080/dummyimages/item-coffee.png', TRUE, TRUE, 5, 90,
   ARRAY['caffeine']::TEXT[], 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_addresses (id, user_id, label, line1, line2, city, region, postal_code, country, is_default, created_at, updated_at)
SELECT
  '50000001-0005-4005-8005-000000000001',
  u.id,
  'Home',
  '221B Baker Street',
  NULL,
  'Springfield',
  'IL',
  '62701',
  'US',
  TRUE,
  NOW(),
  NOW()
FROM users u
WHERE u.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO carts (id, user_id, created_at, updated_at)
SELECT '80000001-0008-4008-8008-000000000001', u.id, NOW(), NOW()
FROM users u
WHERE u.phone = '+19995550001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO cart_items (id, cart_id, menu_item_id, quantity, created_at)
SELECT gen_random_uuid(), c.id, '30000001-0003-4003-8003-000000000003'::UUID, 2, NOW()
FROM carts c
JOIN users u ON u.id = c.user_id AND u.phone = '+19995550001'
WHERE NOT EXISTS (
    SELECT 1 FROM cart_items ci
    WHERE ci.cart_id = c.id AND ci.menu_item_id = '30000001-0003-4003-8003-000000000003'::UUID);

-- O1 delivered + paid + review
INSERT INTO orders (
  id, user_id, status, total_amount, created_at, updated_at,
  delivery_address_snapshot, delivery_agent_id, delivered_at,
  payment_status, paid_at, customer_note, razorpay_order_id, razorpay_payment_id)
SELECT
  '40000001-0004-4004-8004-000000000001',
  cust.id,
  'delivered',
  15.97,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day',
  '221B Baker Street, Springfield, IL 62701, US',
  agent.id,
  NOW() - INTERVAL '1 day',
  'paid',
  NOW() - INTERVAL '3 days',
  'Please ring the bell twice.',
  NULL,
  NULL
FROM users cust
JOIN users agent ON agent.phone = '+19995550003'
WHERE cust.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000001'::UUID, 'Tomato Shorba', 2, 4.99, 9.98, NOW() - INTERVAL '5 days'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000001'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000001'::UUID);

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000003'::UUID, 'Masala Dosa', 1, 5.99, 5.99, NOW() - INTERVAL '5 days'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000001'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000003'::UUID);

-- O2 out_for_delivery
INSERT INTO orders (
  id, user_id, status, total_amount, created_at, updated_at,
  delivery_address_snapshot, delivery_agent_id, delivered_at,
  payment_status, paid_at, customer_note, razorpay_order_id, razorpay_payment_id)
SELECT
  '40000001-0004-4004-8004-000000000002',
  cust.id,
  'out_for_delivery',
  12.00,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  '221B Baker Street, Springfield, IL 62701, US',
  agent.id,
  NULL,
  'paid',
  NOW() - INTERVAL '2 days',
  NULL,
  NULL,
  NULL
FROM users cust
JOIN users agent ON agent.phone = '+19995550003'
WHERE cust.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000004'::UUID, 'Hyderabadi Biryani', 1, 12.00, 12.00, NOW() - INTERVAL '2 days'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000002'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000004'::UUID);

-- O3 confirmed unpaid
INSERT INTO orders (
  id, user_id, status, total_amount, created_at, updated_at,
  delivery_address_snapshot, delivery_agent_id, delivered_at,
  payment_status, paid_at, customer_note, razorpay_order_id, razorpay_payment_id)
SELECT
  '40000001-0004-4004-8004-000000000003',
  cust.id,
  'confirmed',
  13.00,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NULL,
  NULL,
  NULL,
  'unpaid',
  NULL,
  NULL,
  NULL,
  NULL
FROM users cust
WHERE cust.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000002'::UUID, 'Spring Rolls', 2, 6.50, 13.00, NOW() - INTERVAL '1 day'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000003'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000002'::UUID);

-- O4 placed unpaid
INSERT INTO orders (
  id, user_id, status, total_amount, created_at, updated_at,
  delivery_address_snapshot, delivery_agent_id, delivered_at,
  payment_status, paid_at, customer_note, razorpay_order_id, razorpay_payment_id)
SELECT
  '40000001-0004-4004-8004-000000000004',
  cust.id,
  'placed',
  3.25,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours',
  NULL,
  NULL,
  NULL,
  'unpaid',
  NULL,
  'Extra ice.',
  NULL,
  NULL
FROM users cust
WHERE cust.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000006'::UUID, 'Cold Coffee', 1, 3.25, 3.25, NOW() - INTERVAL '4 hours'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000004'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000006'::UUID);

-- O5 cancelled
INSERT INTO orders (
  id, user_id, status, total_amount, created_at, updated_at,
  delivery_address_snapshot, delivery_agent_id, delivered_at,
  payment_status, paid_at, customer_note, razorpay_order_id, razorpay_payment_id)
SELECT
  '40000001-0004-4004-8004-000000000005',
  cust.id,
  'cancelled',
  7.00,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '9 days',
  NULL,
  NULL,
  NULL,
  'unpaid',
  NULL,
  NULL,
  NULL,
  NULL
FROM users cust
WHERE cust.phone = '+19995550001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, created_at)
SELECT gen_random_uuid(), o.id, '30000001-0003-4003-8003-000000000005'::UUID, 'Mango Lassi', 2, 3.50, 7.00, NOW() - INTERVAL '10 days'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000005'::UUID
  AND NOT EXISTS (
    SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.menu_item_id = '30000001-0003-4003-8003-000000000005'::UUID);

INSERT INTO order_reviews (id, order_id, user_id, rating, comment, created_at)
SELECT '70000001-0007-4007-8007-000000000001', o.id, o.user_id, 5, 'Great food, on time!', NOW() - INTERVAL '20 hours'
FROM orders o
WHERE o.id = '40000001-0004-4004-8004-000000000001'::UUID
ON CONFLICT (order_id) DO NOTHING;
