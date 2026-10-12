-- ==============================================================================
-- LAWgIC AI - Supabase PostgreSQL Consolidated Migration Script
-- Safe for Existing Projects: Preserves Existing Rows, Idempotent, No Data Loss
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Trigger Function: updated_at auto-refresh
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Table: profiles (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Officer',
  role TEXT NOT NULL DEFAULT 'Investigating Officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add all missing columns to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Central Command - Jurisdiction HQ';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop existing trigger if present to prevent duplication
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Automatic profile creation on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_role TEXT;
  user_email TEXT;
BEGIN
  user_email := COALESCE(NEW.email, '');
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'displayName',
    split_part(user_email, '@', 1),
    'Officer'
  );
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Investigating Officer');

  INSERT INTO public.profiles (id, full_name, email, role, badge_number, department, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    user_full_name,
    user_email,
    user_role,
    'TN-' || floor(1000 + random() * 9000)::text,
    'District HQ - Central Command',
    'https://ui-avatars.com/api/?name=' || replace(user_full_name, ' ', '+') || '&background=0F172A&color=fff',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
      role = COALESCE(EXCLUDED.role, public.profiles.role),
      updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users from auth.users who lack a profile row
INSERT INTO public.profiles (id, full_name, email, role, badge_number, department, avatar_url, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'displayName', split_part(u.email, '@', 1), 'Officer') AS full_name,
  COALESCE(u.email, '') AS email,
  COALESCE(u.raw_user_meta_data->>'role', 'Investigating Officer') AS role,
  'TN-' || floor(1000 + random() * 9000)::text AS badge_number,
  'District HQ - Central Command' AS department,
  'https://ui-avatars.com/api/?name=Officer&background=0F172A&color=fff' AS avatar_url,
  COALESCE(u.created_at, now()) AS created_at,
  now() AS updated_at
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. Table: cases (Primary FIR Case Registry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add all application columns to existing cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS fir_number TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS incident_type TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS police_station TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS assigned_officer UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS complainant TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS father_husband_name TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS complainant_phone TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS complainant_address TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS incident_date TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS incident_time TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS incident_description TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS crime_type TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS timeline_events JSONB;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS latest_update TIMESTAMPTZ DEFAULT now();

-- Ensure case_id has unique constraint/index
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_case_id_unique ON public.cases (case_id);

-- Drop existing trigger if present to prevent duplication
DROP TRIGGER IF EXISTS trigger_cases_updated_at ON public.cases;
CREATE TRIGGER trigger_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Table: case_documents (Document Vault & Metadata)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT,
  mime_type TEXT DEFAULT 'application/pdf',
  file_size BIGINT DEFAULT 0,
  storage_path TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  sha256_hash TEXT,
  analysis_status TEXT DEFAULT 'Pending Analysis',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  extracted_text TEXT,
  ai_analysis JSONB
);

ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS document_name TEXT;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/pdf';
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS sha256_hash TEXT;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'Pending Analysis';
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

DROP TRIGGER IF EXISTS trigger_case_documents_updated_at ON public.case_documents;
CREATE TRIGGER trigger_case_documents_updated_at
  BEFORE UPDATE ON public.case_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Table: document_versions (Immutable Version History v1, v2, ...)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.case_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  change_description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS sha256_hash TEXT;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS change_description TEXT;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure document_versions.document_id references case_documents(id) rather than legacy documents(id)
ALTER TABLE public.document_versions DROP CONSTRAINT IF EXISTS document_versions_document_id_fkey;
ALTER TABLE public.document_versions ADD CONSTRAINT document_versions_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES public.case_documents(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 7. Table: audit_logs (Tamper-evident, Append-only Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL,
  version_number INTEGER,
  status TEXT DEFAULT 'SUCCESS',
  details TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS version_number INTEGER;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SUCCESS';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 8. Table: chain_of_custody (Forensic Evidence Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chain_of_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL,
  from_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  notes TEXT,
  integrity_hash TEXT,
  status TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS from_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS integrity_hash TEXT;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Verified';
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 9. Table: case_timeline (Event Chronology)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ DEFAULT now(),
  event_type TEXT DEFAULT 'investigation',
  description TEXT NOT NULL,
  source_document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL,
  source_page INTEGER,
  confidence TEXT DEFAULT 'High',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'investigation';
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES public.case_documents(id) ON DELETE SET NULL;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS source_page INTEGER;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'High';
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 10. Table: case_summaries (Cached AI Summaries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  summary_data JSONB DEFAULT '{}'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  confidence TEXT DEFAULT 'High',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS case_id TEXT;
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS summary_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'High';
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.case_summaries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure unique constraint on case_id for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'case_summaries_case_id_key'
  ) THEN
    ALTER TABLE public.case_summaries ADD CONSTRAINT case_summaries_case_id_key UNIQUE (case_id);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trigger_case_summaries_updated_at ON public.case_summaries;
CREATE TRIGGER trigger_case_summaries_updated_at
  BEFORE UPDATE ON public.case_summaries
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 11. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cases_case_id ON public.cases (case_id);
CREATE INDEX IF NOT EXISTS idx_cases_fir_number ON public.cases (fir_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON public.case_documents (case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_sha256 ON public.case_documents (sha256_hash);
CREATE INDEX IF NOT EXISTS idx_case_documents_uploaded_at ON public.case_documents (uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document_id ON public.document_versions (document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON public.audit_logs (case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ------------------------------------------------------------------------------
-- 12. Storage Bucket: case-documents
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/json']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 52428800;

-- ------------------------------------------------------------------------------
-- 13. Enable ROW LEVEL SECURITY (RLS) on ALL Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_summaries ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 14. RLS Policies: Profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all officer profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profile lookup" ON public.profiles;

CREATE POLICY "Users can view all officer profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public profile lookup"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 15. RLS Policies: Cases
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view cases" ON public.cases;
DROP POLICY IF EXISTS "Public can view cases" ON public.cases;
DROP POLICY IF EXISTS "Authorized officers can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Officers can update cases" ON public.cases;
DROP POLICY IF EXISTS "Only admins can delete cases" ON public.cases;
DROP POLICY IF EXISTS "Officers can delete cases" ON public.cases;

CREATE POLICY "Authenticated officers can view cases"
  ON public.cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view cases"
  ON public.cases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authorized officers can insert cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Officers can update cases"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Officers can delete cases"
  ON public.cases FOR DELETE
  TO authenticated
  USING (true);

-- ------------------------------------------------------------------------------
-- 16. RLS Policies: Case Documents
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Public can view case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can upload case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can update case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can delete case documents" ON public.case_documents;

CREATE POLICY "Authenticated officers can view case documents"
  ON public.case_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view case documents"
  ON public.case_documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authorized officers can upload case documents"
  ON public.case_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authorized officers can update case documents"
  ON public.case_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authorized officers can delete case documents"
  ON public.case_documents FOR DELETE
  TO authenticated
  USING (true);

-- ------------------------------------------------------------------------------
-- 17. RLS Policies: Document Versions
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view version history" ON public.document_versions;
DROP POLICY IF EXISTS "Public can view version history" ON public.document_versions;
DROP POLICY IF EXISTS "Authorized officers can append new versions" ON public.document_versions;

CREATE POLICY "Authenticated officers can view version history"
  ON public.document_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view version history"
  ON public.document_versions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authorized officers can append new versions"
  ON public.document_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 18. RLS Policies: Audit Logs (Tamper-evident, Append-only)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Append-only audit trail logging" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view audit logs"
  ON public.audit_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Append-only audit trail logging"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 19. RLS Policies: Chain of Custody
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view chain of custody" ON public.chain_of_custody;
DROP POLICY IF EXISTS "Authorized officers can insert custody transitions" ON public.chain_of_custody;

CREATE POLICY "Authenticated officers can view chain of custody"
  ON public.chain_of_custody FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized officers can insert custody transitions"
  ON public.chain_of_custody FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 20. RLS Policies: Case Timeline
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view timeline" ON public.case_timeline;
DROP POLICY IF EXISTS "Authorized officers can manage timeline events" ON public.case_timeline;

CREATE POLICY "Authenticated officers can view timeline"
  ON public.case_timeline FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized officers can manage timeline events"
  ON public.case_timeline FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 21. RLS Policies: Case Summaries
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated officers can view summaries" ON public.case_summaries;
DROP POLICY IF EXISTS "Authorized officers can manage summaries" ON public.case_summaries;

CREATE POLICY "Authenticated officers can view summaries"
  ON public.case_summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized officers can manage summaries"
  ON public.case_summaries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 22. Storage Policies for Bucket 'case-documents'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete case documents" ON storage.objects;

CREATE POLICY "Authenticated users can read case documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can upload case documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can update case documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'case-documents')
  WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can delete case documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'case-documents');
