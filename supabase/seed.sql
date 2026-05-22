-- 1. POPULATE ROLES
INSERT INTO public.roles (id, role_type)
VALUES 
  (1, 'super_admin'),
  (2, 'store_manager'),
  (3, 'front_desk'),
  (4, 'user')
ON CONFLICT (id) DO UPDATE SET role_type = EXCLUDED.role_type;

-- 2. POPULATE AUTH.USERS
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@tsg.com', crypt('Password123$', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'storemanager@tsg.com', crypt('Password123$', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'frontdesk@tsg.com', crypt('Password123$', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@mail.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = EXCLUDED.encrypted_password,
  email = EXCLUDED.email;

-- 3. POPULATE AUTH.IDENTITIES
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
(gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000001', 'superadmin@tsg.com')::jsonb, 'email', 'superadmin@tsg.com', now(), now(), now()),
(gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000002', 'storemanager@tsg.com')::jsonb, 'email', 'storemanager@tsg.com', now(), now(), now()),
(gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000003', 'frontdesk@tsg.com')::jsonb, 'email', 'frontdesk@tsg.com', now(), now(), now()),
(gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000004', 'user@mail.com')::jsonb, 'email', 'user@mail.com', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 4. POPULATE PUBLIC.USERS
INSERT INTO public.users (id, name, avatar_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'Super Admin User', null),
('a0000000-0000-0000-0000-000000000002', 'Store Manager User', null),
('a0000000-0000-0000-0000-000000000003', 'Front Desk User', null),
('a0000000-0000-0000-0000-000000000004', 'Normal User', null)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 5. POPULATE PUBLIC.STORES
INSERT INTO public.stores (id, owner_id, name, status, is_active) VALUES
(1, 'a0000000-0000-0000-0000-000000000002', 'TSG Sample Store', 'active', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 6. POPULATE PUBLIC.USER_ROLES
DO $$ 
BEGIN
    -- Super Admin (Role 1)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'a0000000-0000-0000-0000-000000000001') THEN
        INSERT INTO public.user_roles (user_id, role_id, store_id) VALUES ('a0000000-0000-0000-0000-000000000001', 1, null);
    END IF;
    
    -- Store Manager (Role 2) for Store 1
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'a0000000-0000-0000-0000-000000000002') THEN
        INSERT INTO public.user_roles (user_id, role_id, store_id) VALUES ('a0000000-0000-0000-0000-000000000002', 2, 1);
    END IF;

    -- Front Desk (Role 3) for Store 1
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'a0000000-0000-0000-0000-000000000003') THEN
        INSERT INTO public.user_roles (user_id, role_id, store_id) VALUES ('a0000000-0000-0000-0000-000000000003', 3, 1);
    END IF;
END $$;
