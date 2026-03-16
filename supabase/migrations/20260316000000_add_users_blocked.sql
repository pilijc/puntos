-- Add blocked column for block/unblock user feature (only on public.users, not on the view).
-- Block status was incorrectly stored in role (0/1), which violates users_role_check (role must be text).
-- The app reads blocked from public.users and never uses users_with_email.blocked.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.blocked IS 'When true, user access is blocked; blocked users cannot use their account.';
