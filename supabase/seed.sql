-- =========================
-- 1. FAKE AUTH USERS
-- =========================
-- Note: Using 'ON CONFLICT DO NOTHING' so you can run this multiple times
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'superadmin@test.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  (gen_random_uuid(), 'admin@test.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  (gen_random_uuid(), 'operator@test.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  (gen_random_uuid(), 'customer1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 2. PROFILES (Synced with your Migration)
-- =========================

-- Superadmin
INSERT INTO public.users (id, name, role)
SELECT id, 'Super Admin', 'superadmin'
FROM auth.users WHERE email = 'superadmin@test.com'
ON CONFLICT (id) DO NOTHING;

-- Admin / Store Owner
INSERT INTO public.users (id, name, role)
SELECT id, 'Store Owner', 'admin'
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (id) DO NOTHING;

-- Operator
INSERT INTO public.users (id, name, role)
SELECT id, 'Store Operator', 'operator'
FROM auth.users WHERE email = 'operator@test.com'
ON CONFLICT (id) DO NOTHING;

-- Customer
INSERT INTO public.users (id, name, role)
SELECT id, 'Customer One', 'user'
FROM auth.users WHERE email = 'customer1@test.com'
ON CONFLICT (id) DO NOTHING;