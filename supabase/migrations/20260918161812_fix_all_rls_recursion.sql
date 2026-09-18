-- Fix all policies that reference profiles table directly (causes infinite recursion)

-- projects
DROP POLICY IF EXISTS select_own_projects ON public.projects;
CREATE POLICY "select_own_projects" ON public.projects
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

-- project_versions
DROP POLICY IF EXISTS select_own_versions ON public.project_versions;
CREATE POLICY "select_own_versions" ON public.project_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    ) OR public.is_current_user_admin()
  );

-- subscriptions
DROP POLICY IF EXISTS select_own_subscriptions ON public.subscriptions;
CREATE POLICY "select_own_subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

-- transactions
DROP POLICY IF EXISTS select_own_transactions ON public.transactions;
CREATE POLICY "select_own_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

-- device_fingerprints
DROP POLICY IF EXISTS select_own_fingerprints ON public.device_fingerprints;
CREATE POLICY "select_own_fingerprints" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());
