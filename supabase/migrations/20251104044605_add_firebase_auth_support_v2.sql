/*
  # Add Firebase Authentication Support

  1. Overview
    - Enables Firebase authentication to work with Supabase database
    - Creates a function to extract Firebase user ID from JWT tokens
    - Creates a users table in public schema to sync Firebase users
    - Updates RLS policies to work with Firebase auth

  2. New Tables
    - `users` (public schema)
      - `id` (text, primary key) - Firebase UID
      - `email` (text)
      - `display_name` (text)
      - `photo_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. New Functions
    - `firebase_uid()` - Extracts Firebase user ID from JWT token in request headers
    - `set_updated_at()` - Trigger function to update updated_at timestamp

  4. Changes
    - All existing foreign keys to auth.users are updated to reference public.users
    - All RLS policies updated to use firebase_uid() instead of auth.uid()
    - User ID columns changed from uuid to text for Firebase compatibility

  5. Security
    - RLS remains enabled on all tables
    - Policies remain restrictive, only allowing users to access their own data
    - Firebase JWT validation ensures secure authentication
*/

-- Create public users table for Firebase users
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text,
  display_name text,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Function to extract Firebase UID from JWT token
CREATE OR REPLACE FUNCTION firebase_uid() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE SQL STABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (id = firebase_uid());

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = firebase_uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = firebase_uid())
  WITH CHECK (id = firebase_uid());

-- Drop all existing RLS policies before altering columns
DROP POLICY IF EXISTS "Users can view own agents" ON agents;
DROP POLICY IF EXISTS "Users can create own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON agents;

DROP POLICY IF EXISTS "Users can view own API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can create own API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can update own API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can delete own API tokens" ON api_tokens;

DROP POLICY IF EXISTS "Users can view own agent deployments" ON agent_deployments;
DROP POLICY IF EXISTS "Users can create own agent deployments" ON agent_deployments;
DROP POLICY IF EXISTS "Users can update own agent deployments" ON agent_deployments;
DROP POLICY IF EXISTS "Users can delete own agent deployments" ON agent_deployments;

DROP POLICY IF EXISTS "Users can view own agent executions" ON agent_executions;
DROP POLICY IF EXISTS "Users can create own agent executions" ON agent_executions;
DROP POLICY IF EXISTS "Users can update own agent executions" ON agent_executions;
DROP POLICY IF EXISTS "Users can delete own agent executions" ON agent_executions;

DROP POLICY IF EXISTS "Users can view public templates" ON agent_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON agent_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON agent_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON agent_templates;

-- Drop existing foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agents_user_id_fkey') THEN
    ALTER TABLE agents DROP CONSTRAINT agents_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'api_tokens_user_id_fkey') THEN
    ALTER TABLE api_tokens DROP CONSTRAINT api_tokens_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agent_deployments_user_id_fkey') THEN
    ALTER TABLE agent_deployments DROP CONSTRAINT agent_deployments_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agent_executions_user_id_fkey') THEN
    ALTER TABLE agent_executions DROP CONSTRAINT agent_executions_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agent_templates_created_by_fkey') THEN
    ALTER TABLE agent_templates DROP CONSTRAINT agent_templates_created_by_fkey;
  END IF;
END $$;

-- Change user_id columns to text type
ALTER TABLE agents ALTER COLUMN user_id TYPE text;
ALTER TABLE api_tokens ALTER COLUMN user_id TYPE text;
ALTER TABLE agent_deployments ALTER COLUMN user_id TYPE text;
ALTER TABLE agent_executions ALTER COLUMN user_id TYPE text;
ALTER TABLE agent_templates ALTER COLUMN created_by TYPE text;

-- Add foreign key constraints to public.users
ALTER TABLE agents ADD CONSTRAINT agents_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE api_tokens ADD CONSTRAINT api_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE agent_deployments ADD CONSTRAINT agent_deployments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE agent_executions ADD CONSTRAINT agent_executions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE agent_templates ADD CONSTRAINT agent_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Recreate RLS policies with firebase_uid()
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  USING (user_id = firebase_uid());

CREATE POLICY "Users can create own agents"
  ON agents FOR INSERT
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (user_id = firebase_uid())
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (user_id = firebase_uid());

CREATE POLICY "Users can view own API tokens"
  ON api_tokens FOR SELECT
  USING (user_id = firebase_uid());

CREATE POLICY "Users can create own API tokens"
  ON api_tokens FOR INSERT
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can update own API tokens"
  ON api_tokens FOR UPDATE
  USING (user_id = firebase_uid())
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can delete own API tokens"
  ON api_tokens FOR DELETE
  USING (user_id = firebase_uid());

CREATE POLICY "Users can view own agent deployments"
  ON agent_deployments FOR SELECT
  USING (user_id = firebase_uid());

CREATE POLICY "Users can create own agent deployments"
  ON agent_deployments FOR INSERT
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can update own agent deployments"
  ON agent_deployments FOR UPDATE
  USING (user_id = firebase_uid())
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can delete own agent deployments"
  ON agent_deployments FOR DELETE
  USING (user_id = firebase_uid());

CREATE POLICY "Users can view own agent executions"
  ON agent_executions FOR SELECT
  USING (user_id = firebase_uid());

CREATE POLICY "Users can create own agent executions"
  ON agent_executions FOR INSERT
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can update own agent executions"
  ON agent_executions FOR UPDATE
  USING (user_id = firebase_uid())
  WITH CHECK (user_id = firebase_uid());

CREATE POLICY "Users can delete own agent executions"
  ON agent_executions FOR DELETE
  USING (user_id = firebase_uid());

CREATE POLICY "Users can view public templates"
  ON agent_templates FOR SELECT
  USING (is_public = true OR created_by = firebase_uid());

CREATE POLICY "Users can create own templates"
  ON agent_templates FOR INSERT
  WITH CHECK (created_by = firebase_uid());

CREATE POLICY "Users can update own templates"
  ON agent_templates FOR UPDATE
  USING (created_by = firebase_uid())
  WITH CHECK (created_by = firebase_uid());

CREATE POLICY "Users can delete own templates"
  ON agent_templates FOR DELETE
  USING (created_by = firebase_uid());