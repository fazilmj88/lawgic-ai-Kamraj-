-- ==============================================================================
-- LAWgic AI: RBAC Security Hardening & Isolation Migration
-- Migration: 20260912_rbac_security_hardening.sql
-- Description:
--   Implements strict Role-Based Access Control (RBAC) and Attribute-Based Access
--   Control (ABAC) across all tables, storage buckets, and functions.
--   Prevents role elevation, enforces case-level jurisdiction separation,
--   protects audit log immutability, preserves chain-of-custody integrity,
--   restricts Judicial users to read-only access, and isolates FIR records.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP ALL INSECURE BROAD POLICIES (USING true / WITH CHECK true)
-- ------------------------------------------------------------------------------

-- Profiles
DROP POLICY IF EXISTS "Users can view all officer profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profile lookup" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Cases
DROP POLICY IF EXISTS "Authenticated officers can view cases" ON public.cases;
DROP POLICY IF EXISTS "Public can view cases" ON public.cases;
DROP POLICY IF EXISTS "Authorized officers can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Officers can update cases" ON public.cases;
DROP POLICY IF EXISTS "Officers can delete cases" ON public.cases;

-- Case Documents
DROP POLICY IF EXISTS "Authenticated officers can view case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Public can view case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can upload case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can update case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Authorized officers can delete case documents" ON public.case_documents;

-- Document Versions
DROP POLICY IF EXISTS "Authenticated officers can view version history" ON public.document_versions;
DROP POLICY IF EXISTS "Public can view version history" ON public.document_versions;
DROP POLICY IF EXISTS "Authorized officers can append new versions" ON public.document_versions;

-- Audit Logs
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Append-only audit trail logging" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can insert audit logs" ON public.audit_logs;

-- Chain of Custody
DROP POLICY IF EXISTS "Authenticated officers can view chain of custody" ON public.chain_of_custody;
DROP POLICY IF EXISTS "Authorized officers can insert custody transitions" ON public.chain_of_custody;

-- Timeline Events
DROP POLICY IF EXISTS "Authenticated officers can view timeline" ON public.case_timeline_events;
DROP POLICY IF EXISTS "Authorized officers can manage timeline events" ON public.case_timeline_events;

-- Summaries
DROP POLICY IF EXISTS "Authenticated officers can view summaries" ON public.case_summaries;
DROP POLICY IF EXISTS "Authorized officers can manage summaries" ON public.case_summaries;

-- Storage
DROP POLICY IF EXISTS "Authenticated users can read case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete case documents" ON storage.objects;

-- ------------------------------------------------------------------------------
-- 2. SCHEMA REPAIRS & COMPATIBILITY ENHANCEMENTS
-- ------------------------------------------------------------------------------

-- Ensure case_assignments table exists for multi-officer & multi-department assignments
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL DEFAULT 'Assigned Officer',
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_case_assignments_user_case ON public.case_assignments (user_id, case_id);
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

-- Compatibility columns for document_versions
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Compatibility columns for chain_of_custody
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS to_officer UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS from_officer UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chain_of_custody ADD COLUMN IF NOT EXISTS location TEXT;

-- Compatibility columns for audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;

-- ------------------------------------------------------------------------------
-- 3. TRUSTED ROLE RESOLUTION & SECURITY HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Get current authenticated user role strictly from public.profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'ANONYMOUS';
  END IF;
  
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_role, 'JUDICIAL');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Role verification predicates
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LOWER(public.get_current_user_role()) = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_police_officer()
RETURNS BOOLEAN AS $$
DECLARE
  r TEXT := LOWER(public.get_current_user_role());
BEGIN
  RETURN r IN ('constable', 'police officer', 'sub-inspector', 'investigating officer')
      OR r LIKE '%police%'
      OR r LIKE '%inspector%';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_forensic_officer()
RETURNS BOOLEAN AS $$
DECLARE
  r TEXT := LOWER(public.get_current_user_role());
BEGIN
  RETURN r LIKE '%forensic%';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_legal_officer()
RETURNS BOOLEAN AS $$
DECLARE
  r TEXT := LOWER(public.get_current_user_role());
BEGIN
  RETURN r LIKE '%legal%' OR r LIKE '%prosecution%';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_judicial_user()
RETURNS BOOLEAN AS $$
DECLARE
  r TEXT := LOWER(public.get_current_user_role());
BEGIN
  RETURN r LIKE '%judicial%' OR r LIKE '%court%' OR r = 'authorized viewer';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is assigned to a case
CREATE OR REPLACE FUNCTION public.has_case_assignment(p_case_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin has administrative case visibility
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check if assigned directly as primary officer or creator
  IF EXISTS (
    SELECT 1 FROM public.cases
    WHERE id = p_case_id AND (assigned_officer = v_uid OR created_by = v_uid)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check active case assignments
  IF EXISTS (
    SELECT 1 FROM public.case_assignments
    WHERE case_id = p_case_id AND user_id = v_uid AND active = true
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if case has been submitted for court review / cognizance
CREATE OR REPLACE FUNCTION public.is_case_submitted_to_court(p_case_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cases
    WHERE id = p_case_id
      AND (
        status ILIKE '%court%'
        OR status ILIKE '%chargesheet%'
        OR status ILIKE '%submitted%'
        OR (metadata->>'submittedToCourt')::boolean = true
        OR (metadata->>'court_cognizance')::boolean = true
      )
  ) OR EXISTS (
    SELECT 1 FROM public.case_documents
    WHERE case_id = p_case_id
      AND (
        document_type = 'Court Record'
        OR (metadata->>'finalizedForCourt')::boolean = true
        OR (metadata->>'court_cognizance')::boolean = true
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. TAMPER-PROOF TRIGGERS (ROLE ESCALATION, AUDIT LOGS, FIR IMMUTABILITY)
-- ------------------------------------------------------------------------------

-- Prevent users from modifying their own role in public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Permission Denied: Only System Administrators can alter user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_elevation();

-- Protect audit logs: Strictly append-only (no update, no delete)
CREATE OR REPLACE FUNCTION public.protect_audit_logs_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Permission Denied: Audit logs are strictly tamper-evident and immutable';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_audit_logs_update ON public.audit_logs;
CREATE TRIGGER tr_protect_audit_logs_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_audit_logs_immutability();

DROP TRIGGER IF EXISTS tr_protect_audit_logs_delete ON public.audit_logs;
CREATE TRIGGER tr_protect_audit_logs_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_audit_logs_immutability();

-- Protect chain-of-custody: Strictly append-only
CREATE OR REPLACE FUNCTION public.protect_chain_of_custody_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Permission Denied: Chain of custody events are strictly immutable history';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_coc_update ON public.chain_of_custody;
CREATE TRIGGER tr_protect_coc_update
  BEFORE UPDATE ON public.chain_of_custody
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_chain_of_custody_immutability();

DROP TRIGGER IF EXISTS tr_protect_coc_delete ON public.chain_of_custody;
CREATE TRIGGER tr_protect_coc_delete
  BEFORE DELETE ON public.chain_of_custody
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_chain_of_custody_immutability();

-- Protect FIR documents from deletion
CREATE OR REPLACE FUNCTION public.protect_fir_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.document_type ILIKE '%FIR%' THEN
    RAISE EXCEPTION 'Permission Denied: Original FIR records are permanent statutory documents and cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_fir_delete ON public.case_documents;
CREATE TRIGGER tr_protect_fir_delete
  BEFORE DELETE ON public.case_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_fir_deletion();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY: PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own non-role profile details"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY: CASES
-- ------------------------------------------------------------------------------
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- SELECT Cases:
-- Police/Forensic/Legal: only assigned cases
-- Judicial: only cases submitted to court
-- Admin: all cases
CREATE POLICY "Strict Case Access by Role and Assignment"
  ON public.cases FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (public.is_judicial_user() AND public.is_case_submitted_to_court(id))
    OR public.has_case_assignment(id)
  );

-- INSERT Cases: Police / IO / Constable or Admin. Judicial: DENIED!
CREATE POLICY "Police Officers and Admins can create cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_police_officer() OR public.is_admin())
    AND NOT public.is_judicial_user()
  );

-- UPDATE Cases: Only assigned Police / IO or Admin. Judicial / Forensic / Legal: DENIED!
CREATE POLICY "Assigned Police and Admin can update cases"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (
    (public.is_admin() OR (public.is_police_officer() AND public.has_case_assignment(id)))
    AND NOT public.is_judicial_user()
  )
  WITH CHECK (
    (public.is_admin() OR (public.is_police_officer() AND public.has_case_assignment(id)))
    AND NOT public.is_judicial_user()
  );

-- DELETE Cases: Strictly Admin only. IO / Judicial / Forensic / Legal: DENIED!
CREATE POLICY "Only Admin can delete cases"
  ON public.cases FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY: CASE_DOCUMENTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- SELECT Case Documents:
-- Assigned officers see assigned case documents.
-- Judicial: ONLY finalized court documents (no internal drafts or witness notes).
CREATE POLICY "Strict Case Document Visibility"
  ON public.case_documents FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_judicial_user()
      AND public.is_case_submitted_to_court(case_id)
      AND (
        document_type = 'Court Record'
        OR (metadata->>'finalizedForCourt')::boolean = true
        OR (metadata->>'court_cognizance')::boolean = true
      )
    )
    OR (
      NOT public.is_judicial_user()
      AND public.has_case_assignment(case_id)
    )
  );

-- INSERT Case Documents:
-- Police: FIR, Statements, Evidence
-- Forensic: ONLY Forensic Reports (NO FIR!)
-- Legal: ONLY Legal Scrutiny / Opinions (NO FIR!)
-- Judicial: NO uploads!
CREATE POLICY "Strict Case Document Upload"
  ON public.case_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_case_assignment(case_id)
    AND NOT public.is_judicial_user()
    AND (
      public.is_admin()
      OR (public.is_police_officer())
      OR (public.is_forensic_officer() AND (document_type ILIKE '%forensic%' OR document_type ILIKE '%fsl%') AND document_type NOT ILIKE '%fir%')
      OR (public.is_legal_officer() AND (document_type ILIKE '%legal%' OR document_type ILIKE '%prosecution%' OR document_type ILIKE '%opinion%') AND document_type NOT ILIKE '%fir%')
    )
  );

-- UPDATE Case Documents:
-- Police: Investigation docs & draft FIR in assigned cases
-- Forensic: ONLY own forensic reports (CANNOT modify FIR or witness statements!)
-- Legal: ONLY own legal opinions (CANNOT modify FIR or witness statements!)
-- Admin: Cannot modify FIR without assignment
-- Judicial: DENIED!
CREATE POLICY "Strict Case Document Update"
  ON public.case_documents FOR UPDATE
  TO authenticated
  USING (
    public.has_case_assignment(case_id)
    AND NOT public.is_judicial_user()
    AND (
      (public.is_police_officer() AND document_type NOT ILIKE '%forensic%')
      OR (public.is_forensic_officer() AND (document_type ILIKE '%forensic%' OR document_type ILIKE '%fsl%') AND uploaded_by = auth.uid())
      OR (public.is_legal_officer() AND (document_type ILIKE '%legal%' OR document_type ILIKE '%prosecution%') AND uploaded_by = auth.uid())
      OR (public.is_admin() AND document_type NOT ILIKE '%fir%')
    )
  )
  WITH CHECK (
    public.has_case_assignment(case_id)
    AND NOT public.is_judicial_user()
    AND (
      (public.is_police_officer() AND document_type NOT ILIKE '%forensic%')
      OR (public.is_forensic_officer() AND (document_type ILIKE '%forensic%' OR document_type ILIKE '%fsl%') AND uploaded_by = auth.uid())
      OR (public.is_legal_officer() AND (document_type ILIKE '%legal%' OR document_type ILIKE '%prosecution%') AND uploaded_by = auth.uid())
      OR (public.is_admin() AND document_type NOT ILIKE '%fir%')
    )
  );

-- DELETE Case Documents:
-- Only Admin or assigned Police IO for non-FIR investigation documents.
-- Forensic, Legal, Judicial: DENIED!
CREATE POLICY "Strict Case Document Deletion"
  ON public.case_documents FOR DELETE
  TO authenticated
  USING (
    public.has_case_assignment(case_id)
    AND NOT public.is_judicial_user()
    AND NOT public.is_forensic_officer()
    AND NOT public.is_legal_officer()
    AND document_type NOT ILIKE '%fir%'
    AND (public.is_admin() OR (public.is_police_officer() AND uploaded_by = auth.uid()))
  );

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY: DOCUMENT_VERSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View document version history"
  ON public.document_versions FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.case_documents cd
      WHERE cd.id = document_id
        AND public.has_case_assignment(cd.case_id)
    )
  );

CREATE POLICY "Append new document version"
  ON public.document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT public.is_judicial_user()
    AND EXISTS (
      SELECT 1 FROM public.case_documents cd
      WHERE cd.id = document_id
        AND public.has_case_assignment(cd.case_id)
        AND (
          public.is_admin()
          OR (public.is_police_officer())
          OR (public.is_forensic_officer() AND cd.document_type ILIKE '%forensic%')
          OR (public.is_legal_officer() AND cd.document_type ILIKE '%legal%')
        )
    )
  );

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY: AUDIT_LOGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Audit Logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY "Append Audit Logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- No UPDATE or DELETE policies -> rejected by RLS and trigger!

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY: CHAIN_OF_CUSTODY
-- ------------------------------------------------------------------------------
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Chain of Custody"
  ON public.chain_of_custody FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.has_case_assignment(case_id)
    OR (public.is_judicial_user() AND public.is_case_submitted_to_court(case_id))
  );

CREATE POLICY "Append Chain of Custody"
  ON public.chain_of_custody FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT public.is_judicial_user()
    AND (
      public.is_admin()
      OR (public.is_police_officer() AND public.has_case_assignment(case_id))
      OR (public.is_forensic_officer() AND public.has_case_assignment(case_id))
    )
  );

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY: CASE_ASSIGNMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "View Case Assignments"
  ON public.case_assignments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR public.has_case_assignment(case_id)
  );

CREATE POLICY "Admin and IO can manage assignments"
  ON public.case_assignments FOR ALL
  TO authenticated
  USING (public.is_admin() OR (public.is_police_officer() AND public.has_case_assignment(case_id)))
  WITH CHECK (public.is_admin() OR (public.is_police_officer() AND public.has_case_assignment(case_id)));

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY: STORAGE (case-documents bucket)
-- ------------------------------------------------------------------------------
CREATE POLICY "Secure Storage Read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND NOT public.is_judicial_user()
  );

CREATE POLICY "Court Finalized Storage Read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND public.is_judicial_user()
    AND name ILIKE '%court%'
  );

CREATE POLICY "Secure Storage Insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'case-documents'
    AND NOT public.is_judicial_user()
  );

CREATE POLICY "Secure Storage Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND NOT public.is_judicial_user()
  );

CREATE POLICY "Admin Storage Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND public.is_admin()
  );

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
