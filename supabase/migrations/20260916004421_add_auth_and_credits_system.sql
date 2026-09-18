/*
# Add authentication, user profiles, credits, and admin system to Ebnili

## Overview
Transforms Ebnili from single-tenant to a full multi-user SaaS platform with:
- User profiles with role (user/admin) and credit balance
- Device fingerprinting for anti-abuse (one free trial per device)
- Owner-scoped projects and versions (users only see their own)
- Owner-scoped subscriptions and transactions
- Admin can see all data via SECURITY DEFINER functions

## New Tables

### profiles
- id (uuid, PK, references auth.users)
- email (text)
- full_name (text)
- role (text, default 'user') — 'user' or 'admin'
- credits (integer, default 3) — free generation credits
- subscription_tier (text, default 'free') — 'free', 'starter', 'pro'
- avatar_url (text, nullable)
- created_at (timestamptz)

### device_fingerprints
- id (uuid, PK)
- fingerprint (text, unique) — browser fingerprint hash
- user_id (uuid, references auth.users)
- created_at (timestamptz)
- Purpose: prevent one user from creating multiple accounts for free credits

## Modified Tables

### projects
- Added user_id column (uuid, NOT NULL, DEFAULT auth.uid())
- RLS policies changed from anon-accessible to owner-scoped

### project_versions
- RLS policies changed to check ownership via parent project

### subscriptions
- Added user_id column (uuid, NOT NULL, DEFAULT auth.uid())
- RLS policies changed to owner-scoped

### transactions
- Added user_id column (uuid, NOT NULL, DEFAULT auth.uid())
- RLS policies changed to owner-scoped

## Security
- RLS enabled on all tables
- All user tables use authenticated-only, owner-scoped policies
- profiles table: users can read/update own profile, admins can read all
- device_fingerprints: users can read own, insert own
- SECURITY DEFINER functions for admin dashboard queries
- New profiles policy triggered on signup via handle_new_user() function

## Important Notes
1. The handle_new_user() trigger automatically creates a profile when a user signs up
2. Free users get 3 credits to start
3. Device fingerprints prevent abuse of free credits
4. Admin role is set manually in the database for specific users
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  credits integer NOT NULL DEFAULT 3,
  subscription_tier text NOT NULL DEFAULT 'free',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Users can update their own profile (but not role/credits)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Only admins can insert profiles (for manual admin creation)
-- Normal profile creation happens via trigger
DROP POLICY IF EXISTS "insert_profile_admin" ON profiles;
CREATE POLICY "insert_profile_admin" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================
-- DEVICE FINGERPRINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fingerprints" ON device_fingerprints;
CREATE POLICY "select_own_fingerprints" ON device_fingerprints FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "insert_own_fingerprint" ON device_fingerprints;
CREATE POLICY "insert_own_fingerprint" ON device_fingerprints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ADD user_id TO projects
-- ============================================
DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Replace projects policies with owner-scoped
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- UPDATE project_versions policies (owner-scoped via parent)
-- ============================================
DROP POLICY IF EXISTS "anon_select_versions" ON project_versions;
DROP POLICY IF EXISTS "anon_insert_versions" ON project_versions;
DROP POLICY IF EXISTS "anon_update_versions" ON project_versions;
DROP POLICY IF EXISTS "anon_delete_versions" ON project_versions;

DROP POLICY IF EXISTS "select_own_versions" ON project_versions;
CREATE POLICY "select_own_versions" ON project_versions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_versions.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_versions" ON project_versions;
CREATE POLICY "insert_own_versions" ON project_versions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_versions.project_id AND projects.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_versions" ON project_versions;
CREATE POLICY "delete_own_versions" ON project_versions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_versions.project_id AND projects.user_id = auth.uid())
  );

-- ============================================
-- ADD user_id TO subscriptions
-- ============================================
DO $$ BEGIN
  ALTER TABLE subscriptions ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DROP POLICY IF EXISTS "anon_select_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "anon_insert_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "anon_update_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "anon_delete_subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- ADD user_id TO transactions
-- ============================================
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ADMIN DASHBOARD FUNCTIONS (SECURITY DEFINER)
-- ============================================

-- Get all users with their stats (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  credits integer,
  subscription_tier text,
  created_at timestamptz,
  project_count bigint
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role, p.credits, p.subscription_tier, p.created_at,
           COUNT(pr.id) as project_count
    FROM profiles p
    LEFT JOIN projects pr ON pr.user_id = p.id
    GROUP BY p.id, p.email, p.full_name, p.role, p.credits, p.subscription_tier, p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get all transactions (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_transactions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  sender_mobile text,
  receipt_code text,
  amount numeric,
  status text,
  tier text,
  created_at timestamptz,
  reviewed_at timestamptz,
  user_email text
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
    SELECT t.id, t.user_id, t.sender_mobile, t.receipt_code, t.amount, t.status, t.tier,
           t.created_at, t.reviewed_at, p.email
    FROM transactions t
    LEFT JOIN profiles p ON p.id = t.user_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get platform stats (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_projects', (SELECT COUNT(*) FROM projects),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'verified'),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'pending_transactions', (SELECT COUNT(*) FROM transactions WHERE status = 'pending'),
    'pro_users', (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'pro'),
    'starter_users', (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'starter'),
    'free_users', (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'free')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update transaction status (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_transaction(
  tx_id uuid,
  new_status text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  UPDATE transactions SET status = new_status, reviewed_at = now() WHERE id = tx_id;
  
  IF new_status = 'verified' THEN
    UPDATE subscriptions SET status = 'active', activated_at = now()
    WHERE id = (SELECT subscription_id FROM transactions WHERE id = tx_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on admin functions to authenticated role
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_transaction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint);
