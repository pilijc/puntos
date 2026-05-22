-- 1. TEMPORARY SECURITY HELPER PROCEDURES
CREATE OR REPLACE PROCEDURE public.safe_enable_rls(p_table text)
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE public.safe_create_policy(
  p_table text, 
  p_policy_name text, 
  p_cmd text, 
  p_using text DEFAULT NULL, 
  p_with_check text DEFAULT NULL
)
AS $$
DECLARE
  v_sql text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    -- Drop policy if it already exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_policy_name, p_table);
    
    -- Build CREATE POLICY statement
    v_sql := format('CREATE POLICY %I ON public.%I FOR %s', p_policy_name, p_table, p_cmd);
    IF p_using IS NOT NULL THEN
      v_sql := v_sql || ' USING (' || p_using || ')';
    END IF;
    IF p_with_check IS NOT NULL THEN
      v_sql := v_sql || ' WITH CHECK (' || p_with_check || ')';
    END IF;
    
    EXECUTE v_sql;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. SECURITY HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_store_manager(p_store_id bigint)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current authenticated user is the store owner
  IF EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = p_store_id AND owner_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- Check if current authenticated user is assigned a management role (manager, store_owner, store_manager, super_admin)
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND ur.store_id = p_store_id 
      AND r.role_type IN ('manager', 'store_owner', 'store_manager', 'super_admin')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 3. PUBLIC & SYSTEM LOOKUP TABLES
-- roles
CALL public.safe_enable_rls('roles');
CALL public.safe_create_policy('roles', 'Allow public read roles', 'SELECT', 'true');

-- subscriptions
CALL public.safe_enable_rls('subscriptions');
CALL public.safe_create_policy('subscriptions', 'Allow public read subscriptions', 'SELECT', 'true');

-- timezone_boundaries
CALL public.safe_enable_rls('timezone_boundaries');
CALL public.safe_create_policy('timezone_boundaries', 'Allow public read timezone_boundaries', 'SELECT', 'true');

-- 4. USER-SPECIFIC DATA TABLES
-- users
CALL public.safe_enable_rls('users');
CALL public.safe_create_policy('users', 'Allow public read users', 'SELECT', 'true');
CALL public.safe_create_policy('users', 'Allow individual write users', 'ALL', 'auth.uid() = id', 'auth.uid() = id');

-- user_settings
CALL public.safe_enable_rls('user_settings');
CALL public.safe_create_policy('user_settings', 'Allow individual user_settings', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id');

-- user_device_sessions
CALL public.safe_enable_rls('user_device_sessions');
CALL public.safe_create_policy('user_device_sessions', 'Allow individual user_device_sessions', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id');

-- user_muted_stores
CALL public.safe_enable_rls('user_muted_stores');
CALL public.safe_create_policy('user_muted_stores', 'Allow individual user_muted_stores', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id');

-- user_streaks
CALL public.safe_enable_rls('user_streaks');
CALL public.safe_create_policy('user_streaks', 'Allow individual user_streaks', 'SELECT', 'auth.uid() = user_id');

-- stamp_progress
CALL public.safe_enable_rls('stamp_progress');
CALL public.safe_create_policy('stamp_progress', 'Allow individual stamp_progress', 'SELECT', 'auth.uid() = user_id');

-- reward_redemptions
CALL public.safe_enable_rls('reward_redemptions');
CALL public.safe_create_policy('reward_redemptions', 'Allow individual reward_redemptions', 'SELECT', 'auth.uid() = user_id');

-- purchases
CALL public.safe_enable_rls('purchases');
CALL public.safe_create_policy('purchases', 'Allow individual purchases', 'SELECT', 'auth.uid() = user_id');


-- 5. STORE CONFIGURATION & METRICS TABLES
-- stores
CALL public.safe_enable_rls('stores');
CALL public.safe_create_policy('stores', 'Allow public read stores', 'SELECT', 'status = ''active'' AND is_active = true');
CALL public.safe_create_policy('stores', 'Allow manager manage stores', 'ALL', 'auth.uid() = owner_id', 'auth.uid() = owner_id');

-- store_feature
CALL public.safe_enable_rls('store_feature');
CALL public.safe_create_policy('store_feature', 'Allow public read store_feature', 'SELECT', 'true');
CALL public.safe_create_policy('store_feature', 'Allow manager write store_feature', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_qr
CALL public.safe_enable_rls('store_qr');
CALL public.safe_create_policy('store_qr', 'Allow manager manage store_qr', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_rewards
CALL public.safe_enable_rls('store_rewards');
CALL public.safe_create_policy('store_rewards', 'Allow public read store_rewards', 'SELECT', 'is_active = true');
CALL public.safe_create_policy('store_rewards', 'Allow manager write store_rewards', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_stamps
CALL public.safe_enable_rls('store_stamps');
CALL public.safe_create_policy('store_stamps', 'Allow public read store_stamps', 'SELECT', 'status = ''active''');
CALL public.safe_create_policy('store_stamps', 'Allow manager write store_stamps', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_streaks
CALL public.safe_enable_rls('store_streaks');
CALL public.safe_create_policy('store_streaks', 'Allow public read store_streaks', 'SELECT', 'status = ''active''');
CALL public.safe_create_policy('store_streaks', 'Allow manager write store_streaks', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_staff
CALL public.safe_enable_rls('store_staff');
CALL public.safe_create_policy('store_staff', 'Allow manager manage store_staff', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_daily_metrics
CALL public.safe_enable_rls('store_daily_metrics');
CALL public.safe_create_policy('store_daily_metrics', 'Allow manager read store_daily_metrics', 'SELECT', 'is_store_manager(store_id)');

-- store_payments
CALL public.safe_enable_rls('store_payments');
CALL public.safe_create_policy('store_payments', 'Allow manager read store_payments', 'SELECT', 'auth.uid() = owner_id');

-- store_user_loyalty
CALL public.safe_enable_rls('store_user_loyalty');
CALL public.safe_create_policy('store_user_loyalty', 'Allow individual read store_user_loyalty', 'SELECT', 'auth.uid() = user_id OR is_store_manager(store_id)');

-- store_proximity_events
CALL public.safe_enable_rls('store_proximity_events');
CALL public.safe_create_policy('store_proximity_events', 'Allow manager manage store_proximity_events', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');

-- store_subscriptions
CALL public.safe_enable_rls('store_subscriptions');
CALL public.safe_create_policy('store_subscriptions', 'Allow manager read store_subscriptions', 'SELECT', 'is_store_manager(store_id)');

-- user_roles
CALL public.safe_enable_rls('user_roles');
CALL public.safe_create_policy('user_roles', 'Allow read user_roles', 'SELECT', 'auth.uid() = user_id OR is_store_manager(store_id)');
CALL public.safe_create_policy('user_roles', 'Allow manager manage user_roles', 'ALL', 'is_store_manager(store_id)', 'is_store_manager(store_id)');


-- 6. MANAGER SECURITY CONFIG TABLES
-- manager_device_sessions
CALL public.safe_enable_rls('manager_device_sessions');
CALL public.safe_create_policy('manager_device_sessions', 'Allow manager manage manager_device_sessions', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id');

-- manager_subscription_payments
CALL public.safe_enable_rls('manager_subscription_payments');
CALL public.safe_create_policy('manager_subscription_payments', 'Allow manager read manager_subscription_payments', 'SELECT', 'auth.uid() = owner_id');

-- manager_subscriptions
CALL public.safe_enable_rls('manager_subscriptions');
CALL public.safe_create_policy('manager_subscriptions', 'Allow manager read manager_subscriptions', 'SELECT', 'auth.uid() = owner_id');


-- 7. FRONT DESK STAFF SESSION TABLES
-- frontdesk_device_sessions
CALL public.safe_enable_rls('frontdesk_device_sessions');
CALL public.safe_create_policy('frontdesk_device_sessions', 'Allow staff manage frontdesk_device_sessions', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id');

-- frontdesk_sessions
CALL public.safe_enable_rls('frontdesk_sessions');
CALL public.safe_create_policy('frontdesk_sessions', 'Allow staff manage frontdesk_sessions', 'ALL', 'auth.uid() = staff_id', 'auth.uid() = staff_id');


-- 8. VOUCHER & QR TRANSACTION TABLES
-- vouchers
CALL public.safe_enable_rls('vouchers');
CALL public.safe_create_policy('vouchers', 'Allow user read vouchers', 'SELECT', 'auth.uid() = user_id');

-- voucher_archive
CALL public.safe_enable_rls('voucher_archive');
CALL public.safe_create_policy('voucher_archive', 'Allow user read voucher_archive', 'SELECT', 'auth.uid() = user_id');

-- voucher_transactions
CALL public.safe_enable_rls('voucher_transactions');
CALL public.safe_create_policy('voucher_transactions', 'Allow user/manager read voucher_transactions', 'SELECT', 'auth.uid() = user_id OR is_store_manager(store_id)');

-- qr_codes
CALL public.safe_enable_rls('qr_codes');
CALL public.safe_create_policy('qr_codes', 'Allow user read qr_codes', 'SELECT', 'auth.uid() = user_id');

-- qr_transactions
CALL public.safe_enable_rls('qr_transactions');
CALL public.safe_create_policy('qr_transactions', 'Allow user/manager read qr_transactions', 'SELECT', 'auth.uid() = user_id OR is_store_manager(store_id)');

-- reward_redemption_codes
CALL public.safe_enable_rls('reward_redemption_codes');
CALL public.safe_create_policy('reward_redemption_codes', 'Allow user/manager read reward_redemption_codes', 'SELECT', 'auth.uid() = user_id OR is_store_manager(store_id)');


-- 9. CLEAN UP HELPERS
DROP PROCEDURE IF EXISTS public.safe_enable_rls(text);
DROP PROCEDURE IF EXISTS public.safe_create_policy(text, text, text, text, text);
