-- Demo seed for BaltiTour (passwords: admin123 / vendor123)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('11111111-1111-4111-8111-111111111101', 'admin@baltitour.com', '$2b$12$OXju2sQB4wA5d3fRj/j3WOOUwE894rUGDyfrUnmqsKG0lspo3iFEi', 'Super Admin', 'admin'),
('11111111-1111-4111-8111-111111111102', 'hostel@skardu.com', '$2b$12$gHMC8cMbNdQ4GsREA8/BcuvMtWmZG4IiSQnsxpcnPy8dA6MeC2afW', 'Karim Ali', 'vendor'),
('11111111-1111-4111-8111-111111111103', 'prado@skardu.com', '$2b$12$gHMC8cMbNdQ4GsREA8/BcuvMtWmZG4IiSQnsxpcnPy8dA6MeC2afW', 'Ali Murad', 'vendor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (id, user_id, business_name, vendor_type, valley, status, solo_safe, women_friendly, featured_until) VALUES
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 'Skardu Backpackers Hostel', 'hotel', 'Skardu', 'approved', true, true, NULL),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111103', 'Murad 4x4 Services', 'transport', 'Skardu', 'approved', true, false, now() + interval '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO properties (id, vendor_id, name, valley) VALUES
('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Skardu Backpackers Hostel', 'Skardu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, property_id, name, capacity, price_per_night, amenities_json) VALUES
('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 'Dorm Bed', 6, 4000, '["WiFi", "Hot Shower", "K2 View"]'),
('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 'Private Twin', 2, 6500, '["WiFi", "Breakfast"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, vendor_id, model, plate, driver_name, is_4x4, has_ac, daily_rate, languages_json) VALUES
('55555555-5555-4555-8555-555555555501', '22222222-2222-4222-8222-222222222202', 'Toyota Prado TX 4x4', 'GB-8921', 'Ali Murad', true, true, 15000, '["Urdu", "English", "Balti"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trip_reviews (id, booking_reference, author_name, rating, body) VALUES
('66666666-6666-4666-8666-666666666601', 'BT-DEMO', 'Sara Khan', 5, 'Amazing Skardu trip — hostel and Murad 4x4 were perfect for solo travel.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO forum_posts (id, author_name, valley, title, body) VALUES
('77777777-7777-4777-8777-777777777701', 'Traveler Ali', 'Skardu', 'Best time for Deosai?', 'Planning late June — is the road from Skardu usually open by then?')
ON CONFLICT (id) DO NOTHING;

INSERT INTO road_advisories (id, region, message, severity, active) VALUES
('88888888-8888-4888-8888-888888888801', 'Deosai', 'Deosai access requires 4x4 only. Check weather before departure.', 'warning', true)
ON CONFLICT (id) DO NOTHING;
