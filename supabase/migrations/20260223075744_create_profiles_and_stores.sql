-- =========================
-- PROFILES TABLE
-- =========================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, -- Make sure this says 'name', NOT 'full_name'
  role text DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'operator', 'user')),
  created_at timestamp with time zone DEFAULT now()
);

-- =========================
-- STORES TABLE
-- =========================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- =========================
-- OPTIONAL: STORE STAFF
-- =========================
create table public.store_staff (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'operator')),
  created_at timestamp with time zone default now()
);