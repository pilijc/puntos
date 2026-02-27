NOTIFY pgrst, 'reload schema';
select * from profiles limit 1;
-- This ensures a profile exists for your Gmail account
-- 1. Ensure the table is named correctly and exists in the public schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    role text DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now()
);

-- 2. If the column is still named 'full_name' from an old migration, rename it to 'name'
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles RENAME COLUMN full_name TO name;
    END IF;
END $$;

-- 3. FIX FOR YOUR LOGIN: Create the missing row for your specific email
INSERT INTO public.profiles (id, name, role)
SELECT id, 'Leandro', 'user' 
FROM auth.users 
WHERE email = 'lpaciencia11@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 4. DISABLE SECURITY: This ensures the 'Table not found' error (which is often a permission error in disguise) goes away
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 5. REFRESH THE CACHE: Tells the API to look at the new structure
NOTIFY pgrst, 'reload schema';

SELECT * FROM profiles WHERE name != 'My Profile';


-- 1. Create a dummy column to force a schema change
ALTER TABLE public.profiles ADD COLUMN temp_fix text;

-- 2. Immediately remove it
ALTER TABLE public.profiles DROP COLUMN temp_fix;

-- 3. Force the reload again
NOTIFY pgrst, 'reload schema';
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;