-- Create a SECURITY DEFINER function to check if current user is admin
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS select_own_profile ON public.profiles;
DROP POLICY IF EXISTS insert_profile_admin ON public.profiles;
DROP POLICY IF EXISTS update_own_profile ON public.profiles;

-- Recreate policies using the non-recursive function
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also fix the app_settings policies to use the function
DROP POLICY IF EXISTS admin_read_app_settings ON public.app_settings;
DROP POLICY IF EXISTS admin_write_app_settings ON public.app_settings;
DROP POLICY IF EXISTS admin_update_app_settings ON public.app_settings;

CREATE POLICY "admin_read_app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "admin_write_app_settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "admin_update_app_settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
