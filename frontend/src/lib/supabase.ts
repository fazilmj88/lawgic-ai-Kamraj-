import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { FIRCaseData, UserProfileData, AuditLogData, Role, TimelineEvent } from '../types';

// Load Vite environment variables (sanitizing any trailing /rest/v1/ or slashes)
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify if Supabase credentials are configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Fallback dummy client if credentials are not yet supplied in preview mode
// to prevent white-screen crashes on startup while preserving offline/local resilience.
const fallbackDummyUrl = 'https://lawgic-db-preview.supabase.co';
const fallbackDummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-preview-key';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : fallbackDummyUrl,
  isSupabaseConfigured() ? supabaseAnonKey : fallbackDummyKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Type export for user
export type { SupabaseUser };

export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    let session = data?.session;

    // Check token freshness: if expired or expiring in next 30s, attempt refresh once
    const nowInSecs = Math.floor(Date.now() / 1000);
    const isExpiredOrExpiring = session?.expires_at ? session.expires_at <= (nowInSecs + 30) : false;

    if (!session || isExpiredOrExpiring) {
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData?.session?.access_token) {
          session = refreshData.session;
        }
      } catch (refreshErr) {
        console.warn('[Supabase Auth] Session refresh notice:', refreshErr);
      }
    }

    const token = session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('[Supabase Auth] Could not retrieve session token:', err);
  }

  // Fallback 1: Check localStorage for stored Supabase session token
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const lsToken = parsed?.access_token || parsed?.currentSession?.access_token;
            if (lsToken && typeof lsToken === 'string') {
              return { Authorization: `Bearer ${lsToken}` };
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // Fallback 2: Check for active officer session in lawgic_local_user
    try {
      const localUserRaw = localStorage.getItem('lawgic_local_user');
      if (localUserRaw) {
        const parsed = JSON.parse(localUserRaw);
        if (parsed && (parsed.email || parsed.id || parsed.role)) {
          const officerPayload = {
            id: parsed.id || 'usr_officer_preview',
            email: parsed.email || 'officer@lawgic.police.gov.in',
            role: parsed.role || 'Investigating Officer',
            name: parsed.name || parsed.displayName || 'Authorized Officer'
          };
          const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(officerPayload))));
          return { Authorization: `Bearer local-${encoded}` };
        }
      }
    } catch {
      // ignore
    }
  }

  return {};
}

// ----------------------------------------------------
// 1. Supabase Auth Helpers
// ----------------------------------------------------

export async function loginWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) {
    console.warn('[Supabase Auth] Sign-in notice:', error.message);
    throw error;
  }
  return data.user;
}

export async function registerWithEmail(name: string, email: string, pass: string, role: Role = 'Constable') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
        displayName: name,
        role: role
      }
    }
  });
  if (error) {
    console.warn('[Supabase Auth] Register notice:', error.message);
    throw error;
  }
  return data.user;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Supabase Auth] Sign-out error:', error);
    throw error;
  }
}

// ----------------------------------------------------
// 2. User Profile Operations (PostgreSQL `profiles` table)
// ----------------------------------------------------

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase Profile] Fetch notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      userId: data.id,
      email: data.email,
      displayName: data.full_name || data.display_name || 'Officer',
      role: (data.role as Role) || 'Investigating Officer',
      station: data.department || data.station || 'District HQ - Central Command',
      badgeNumber: data.badge_number,
      photoURL: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (err) {
    console.warn('[Supabase Profile] Unexpected error:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfileData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const payload = {
      id: profile.userId,
      email: profile.email,
      full_name: profile.displayName,
      role: profile.role,
      department: profile.station,
      badge_number: profile.badgeNumber || null,
      avatar_url: profile.photoURL || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Profile] Upsert error:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Profile] Save notice:', err);
  }
}

// ----------------------------------------------------
// 3. Case Operations (PostgreSQL `cases` table)
// ----------------------------------------------------

// Convert database record (snake_case) to application model (camelCase)
function mapCaseFromDb(row: any): FIRCaseData {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.created_by || row.user_id || 'usr-system',
    officerName: row.title?.split(' - ')?.[1] || 'Inspector Rajesh Kumar',
    officerRole: 'Investigating Officer',
    complainant: row.complainant || row.title || 'Undisclosed Complainant',
    fatherHusbandName: row.father_husband_name || '',
    complainantPhone: row.complainant_phone || '',
    complainantAddress: row.complainant_address || '',
    district: row.district || 'Chennai City Police',
    policeStation: row.police_station || 'B-1 North Beach Police Station',
    incidentDate: row.incident_date ? new Date(row.incident_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    incidentTime: row.incident_time || '18:00',
    incidentDescription: row.incident_description || '',
    crimeType: row.crime_type || row.incident_type || 'Cognizable Offence',
    priority: (row.priority as any) || 'Medium',
    status: (row.status as any) || 'Draft',
    aiAnalysis: row.ai_analysis || undefined,
    timelineEvents: (row.timeline_events as TimelineEvent[]) || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.latest_update || new Date().toISOString()
  };
}

// Convert application model (camelCase) to database record (snake_case)
function mapCaseToDb(caseData: FIRCaseData): Record<string, any> {
  return {
    case_id: caseData.caseId,
    fir_number: caseData.caseId,
    title: `${caseData.crimeType} - ${caseData.complainant}`,
    incident_type: caseData.crimeType,
    status: caseData.status,
    district: caseData.district,
    police_station: caseData.policeStation,
    complainant: caseData.complainant,
    father_husband_name: caseData.fatherHusbandName || null,
    complainant_phone: caseData.complainantPhone || null,
    complainant_address: caseData.complainantAddress || null,
    incident_date: caseData.incidentDate ? new Date(caseData.incidentDate).toISOString() : new Date().toISOString(),
    incident_time: caseData.incidentTime || null,
    incident_description: caseData.incidentDescription,
    crime_type: caseData.crimeType,
    priority: caseData.priority,
    ai_analysis: caseData.aiAnalysis || null,
    timeline_events: caseData.timelineEvents || [],
    created_at: caseData.createdAt,
    updated_at: caseData.updatedAt,
    latest_update: new Date().toISOString()
  };
}

export async function createFIRCase(caseData: FIRCaseData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const dbPayload = mapCaseToDb(caseData);
    const { error } = await supabase
      .from('cases')
      .upsert(dbPayload, { onConflict: 'case_id' });

    if (error) {
      console.warn('[Supabase Cases] Upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Cases] Create notice:', err);
  }
}

export async function updateFIRCase(caseId: string, updates: Partial<FIRCaseData>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      latest_update: new Date().toISOString()
    };

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.incidentDescription) dbUpdates.incident_description = updates.incidentDescription;
    if (updates.aiAnalysis !== undefined) dbUpdates.ai_analysis = updates.aiAnalysis;
    if (updates.timelineEvents !== undefined) dbUpdates.timeline_events = updates.timelineEvents;
    if (updates.district) dbUpdates.district = updates.district;
    if (updates.policeStation) dbUpdates.police_station = updates.policeStation;
    if (updates.complainant) dbUpdates.complainant = updates.complainant;
    if (updates.crimeType) {
      dbUpdates.crime_type = updates.crimeType;
      dbUpdates.incident_type = updates.crimeType;
    }

    const { error } = await supabase
      .from('cases')
      .update(dbUpdates)
      .eq('case_id', caseId);

    if (error) {
      console.warn('[Supabase Cases] Update notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Cases] Update error:', err);
  }
}

export async function deleteFIRCase(caseId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('case_id', caseId);

    if (error) {
      console.warn('[Supabase Cases] Delete notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Cases] Delete error:', err);
  }
}

export function subscribeToCases(onUpdate: (cases: FIRCaseData[]) => void): () => void {
  let isMounted = true;

  // Initial query from Supabase
  const fetchCases = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase Cases] Query notice:', error.message);
        return;
      }

      if (data && isMounted) {
        const mapped = data.map(mapCaseFromDb);
        onUpdate(mapped);
      }
    } catch (err) {
      console.warn('[Supabase Cases] Initial fetch error:', err);
    }
  };

  fetchCases();

  // Real-time Postgres changes subscription
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('public:cases')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cases' },
      () => {
        fetchCases();
      }
    )
    .subscribe();

  return () => {
    isMounted = false;
    supabase.removeChannel(channel);
  };
}

// ----------------------------------------------------
// 4. Audit Log Operations (PostgreSQL `audit_logs` table)
// ----------------------------------------------------

export async function logAuditEvent(action: string, details?: string, station?: string): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session;
  const currentUser = session?.user;

  const logPayload = {
    action,
    details: details || '',
    user_role: (currentUser?.user_metadata?.role as string) || 'Investigating Officer',
    metadata: {
      station: station || 'Jurisdiction HQ',
      userName: currentUser?.user_metadata?.full_name || currentUser?.email || 'Officer'
    },
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert(logPayload);
    } catch (error) {
      console.warn('[Supabase Audit] Non-blocking log notice:', error);
    }
  }
}

export function subscribeToAuditLogs(onUpdate: (logs: AuditLogData[]) => void): () => void {
  let isMounted = true;

  const fetchLogs = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[Supabase Audit] Query notice:', error.message);
        return;
      }

      if (data && isMounted) {
        const mapped: AuditLogData[] = data.map(row => ({
          id: row.id,
          userId: row.user_id || 'usr-system',
          userName: row.metadata?.userName || 'Officer',
          userRole: row.user_role || 'Investigating Officer',
          action: row.action,
          details: row.details || '',
          station: row.metadata?.station || 'Jurisdiction HQ',
          timestamp: row.created_at
        }));
        onUpdate(mapped);
      }
    } catch (err) {
      console.warn('[Supabase Audit] Fetch notice:', err);
    }
  };

  fetchLogs();

  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('public:audit_logs')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      () => {
        fetchLogs();
      }
    )
    .subscribe();

  return () => {
    isMounted = false;
    supabase.removeChannel(channel);
  };
}

// ----------------------------------------------------
// 5. Supabase Storage Helpers (Bucket: `case-documents`)
// ----------------------------------------------------

export const CASE_DOCUMENTS_BUCKET = 'case-documents';

export async function uploadCaseDocumentToStorage(
  caseId: string, 
  category: string, 
  file: File | Blob, 
  customFileName?: string
): Promise<{ path: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { path: `local/${caseId}/${category}/${customFileName || 'doc.pdf'}` };
  }

  try {
    const cleanCaseId = caseId.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanCategory = category.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '_');
    const cleanFileName = (customFileName || (file as File).name || `doc_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${cleanCaseId}/${cleanCategory}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(CASE_DOCUMENTS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return { path: storagePath, error: error.message };
    }

    return { path: data.path };
  } catch (err: any) {
    console.error('[Supabase Storage] Unexpected upload failure:', err);
    return { path: '', error: err?.message || 'Storage upload failed' };
  }
}

export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
  if (!isSupabaseConfigured() || !storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(CASE_DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.warn('[Supabase Storage] Signed URL notice:', error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.warn('[Supabase Storage] Signed URL failure:', err);
    return null;
  }
}

// ----------------------------------------------------
// 6. Case Documents Table & Version Control Operations
// ----------------------------------------------------

export interface SupabaseCaseDocumentRecord {
  id?: string;
  case_id?: string;
  document_name: string;
  document_type: string;
  mime_type?: string;
  file_size?: number;
  storage_path?: string;
  current_version?: number;
  sha256_hash: string;
  analysis_status?: string;
  uploaded_by?: string;
  metadata?: Record<string, any>;
  extracted_text?: string;
  ai_analysis?: Record<string, any>;
}

export async function saveCaseDocumentRecord(doc: SupabaseCaseDocumentRecord): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const payload = {
      document_name: doc.document_name,
      document_type: doc.document_type,
      mime_type: doc.mime_type || 'application/pdf',
      file_size: doc.file_size || 0,
      storage_path: doc.storage_path,
      current_version: doc.current_version || 1,
      sha256_hash: doc.sha256_hash,
      analysis_status: doc.analysis_status || 'Pending Analysis',
      metadata: doc.metadata || {},
      extracted_text: doc.extracted_text || '',
      ai_analysis: doc.ai_analysis || null
    };

    const { data, error } = await supabase
      .from('case_documents')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase Documents] Insert notice:', error.message);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn('[Supabase Documents] Save failure:', err);
    return null;
  }
}

export async function addDocumentVersionRecord(versionData: {
  document_id: string;
  version_number: number;
  storage_path: string;
  sha256_hash: string;
  file_size: number;
  change_description?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error: vError } = await supabase.from('document_versions').insert({
      document_id: versionData.document_id,
      version_number: versionData.version_number,
      storage_path: versionData.storage_path,
      sha256_hash: versionData.sha256_hash,
      file_size: versionData.file_size,
      change_description: versionData.change_description || `Version v${versionData.version_number}.0 created`
    });

    if (vError) {
      console.warn('[Supabase Document Versions] Insert notice:', vError.message);
      return false;
    }

    // Update current_version and sha256 on parent case_document
    await supabase.from('case_documents')
      .update({
        current_version: versionData.version_number,
        sha256_hash: versionData.sha256_hash,
        storage_path: versionData.storage_path,
        file_size: versionData.file_size,
        updated_at: new Date().toISOString()
      })
      .eq('id', versionData.document_id);

    return true;
  } catch (err) {
    console.warn('[Supabase Document Versions] Add version failure:', err);
    return false;
  }
}

export async function checkDuplicateInSupabase(sha256Hash: string): Promise<{ isDuplicate: boolean; matchedDoc?: any }> {
  if (!isSupabaseConfigured() || !sha256Hash) return { isDuplicate: false };
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .select('id, document_name, document_type, current_version, sha256_hash, created_at')
      .eq('sha256_hash', sha256Hash)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { isDuplicate: false };
    }

    return {
      isDuplicate: true,
      matchedDoc: data[0]
    };
  } catch {
    return { isDuplicate: false };
  }
}

// ----------------------------------------------------
// 7. Forensic Chain of Custody Operations
// ----------------------------------------------------

export async function recordCustodyEventInSupabase(event: {
  case_id?: string;
  document_id?: string;
  action: string;
  notes?: string;
  integrity_hash?: string;
  status?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('chain_of_custody').insert({
      action: event.action,
      notes: event.notes || '',
      integrity_hash: event.integrity_hash || '',
      status: event.status || 'Verified'
    });
  } catch (err) {
    console.warn('[Supabase Custody] Record notice:', err);
  }
}

// ----------------------------------------------------
// 8. Case Timeline, Relationships, & Summaries
// ----------------------------------------------------

export async function saveCaseTimelineInSupabase(caseId: string, events: any[]): Promise<void> {
  if (!isSupabaseConfigured() || !events?.length) return;
  try {
    const rows = events.map(evt => ({
      event_date: evt.date ? new Date(evt.date).toISOString() : new Date().toISOString(),
      event_type: evt.category || 'investigation',
      description: evt.description || evt.title || '',
      confidence: evt.verified ? 'High' : 'Medium'
    }));

    await supabase.from('case_timeline').insert(rows);
  } catch (err) {
    console.warn('[Supabase Timeline] Save notice:', err);
  }
}

export async function saveCaseSummaryInSupabase(caseId: string, summary: string, summaryData: any): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('case_summaries').upsert({
      summary,
      summary_data: summaryData,
      confidence: 'High',
      updated_at: new Date().toISOString()
    }, { onConflict: 'case_id' });
  } catch (err) {
    console.warn('[Supabase Summaries] Save notice:', err);
  }
}

