-- Point seeded menu images to real JPG photos copied from frontend/dummyimages.
-- Files are served by Spring static path: http://localhost:8080/dummyimages/<file>.jpg

UPDATE menu_categories
SET image_url = CASE id
    WHEN '20000001-0002-4002-8002-000000000001'::UUID THEN 'http://localhost:8080/dummyimages/one.jpg'
    WHEN '20000001-0002-4002-8002-000000000002'::UUID THEN 'http://localhost:8080/dummyimages/two.jpg'
    WHEN '20000001-0002-4002-8002-000000000003'::UUID THEN 'http://localhost:8080/dummyimages/three.jpg'
    ELSE image_url
END
WHERE id IN (
    '20000001-0002-4002-8002-000000000001'::UUID,
    '20000001-0002-4002-8002-000000000002'::UUID,
    '20000001-0002-4002-8002-000000000003'::UUID
);

UPDATE menu_items
SET image_url = CASE id
    WHEN '30000001-0003-4003-8003-000000000001'::UUID THEN 'http://localhost:8080/dummyimages/four.jpg'
    WHEN '30000001-0003-4003-8003-000000000002'::UUID THEN 'http://localhost:8080/dummyimages/five.jpg'
    WHEN '30000001-0003-4003-8003-000000000003'::UUID THEN 'http://localhost:8080/dummyimages/six.jpg'
    WHEN '30000001-0003-4003-8003-000000000004'::UUID THEN 'http://localhost:8080/dummyimages/seven.jpg'
    WHEN '30000001-0003-4003-8003-000000000005'::UUID THEN 'http://localhost:8080/dummyimages/two.jpg'
    WHEN '30000001-0003-4003-8003-000000000006'::UUID THEN 'http://localhost:8080/dummyimages/three.jpg'
    ELSE image_url
END
WHERE id IN (
    '30000001-0003-4003-8003-000000000001'::UUID,
    '30000001-0003-4003-8003-000000000002'::UUID,
    '30000001-0003-4003-8003-000000000003'::UUID,
    '30000001-0003-4003-8003-000000000004'::UUID,
    '30000001-0003-4003-8003-000000000005'::UUID,
    '30000001-0003-4003-8003-000000000006'::UUID
);
