import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiUrl } from '../lib/apiConfig';

export type AuditActionType =
  | 'CASE_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_VERSIONED'
  | 'DOCUMENT_VERSION_CREATED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_SEARCHED'
  | 'SEARCH_PERFORMED'
  | 'STATUS_CHANGED'
  | 'AI_QUERY_EXECUTED'
  | 'PERMISSION_DENIED'
  | 'INTEGRITY_CHECKED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'DOCUMENT_ANALYZED'
  | 'METADATA_UPDATED'
  | 'VERSION_CREATED'
  | 'FIR_DRAFTED'
  | 'FIR_PREVIEWED'
  | 'FIR_GENERATED'
  | 'FIR_DOWNLOADED'
  | 'FIR_PRINTED'
  | 'FIR_SAVED_TO_CASE'
  | 'FIR_VERSION_CREATED'
  | 'LEGAL_RECOMMENDATION_REVIEWED'
  | 'CROSS_DOCUMENT_ANALYSIS'
  | 'EXPORT_PERFORMED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  actionLabel: string;
  caseId?: string;
  documentId?: string;
  documentName?: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'BLOCKED';
  metadata?: Record<string, any>;
}

export type AuditEventRecord = AuditLogEntry;

const LOCAL_STORAGE_KEY = 'lawgic_audit_logs';

export function getStoredAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load local audit logs:', err);
  }
  return DEFAULT_INITIAL_AUDIT_LOGS;
}

export async function getAuditLogs(caseId?: string): Promise<AuditLogEntry[]> {
  try {
    const url = caseId && caseId !== 'ALL' 
      ? `/api/cases/${encodeURIComponent(caseId)}/audit` 
      : `/api/audit/logs`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const list = data.auditLogs || data.events;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Backend audit log fetch fallback:', err);
  }
  const local = getStoredAuditLogs();
  if (caseId && caseId !== 'ALL') {
    return local.filter(l => l.caseId === caseId);
  }
  return local;
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ipAddress: entry.ipAddress || (typeof window !== 'undefined' ? `${window.location.hostname}:secure-port` : '127.0.0.1')
  };

  // 1. Save to local storage for instant offline viewing
  try {
    const existing = getStoredAuditLogs();
    const updated = [newEntry, ...existing].slice(0, 500); // keep up to 500 in local buffer
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Local audit log save notice:', err);
  }

  // 2. Persist to Backend server audit log
  try {
    fetch(apiUrl('/api/audit/log'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 3. Persist to Supabase audit_logs if available
  try {
    if (isSupabaseConfigured()) {
      await supabase.from('audit_logs').insert({
        action: newEntry.actionLabel || newEntry.actionType,
        user_role: newEntry.userRole,
        details: newEntry.details,
        ip_address: newEntry.ipAddress,
        status: newEntry.status,
        metadata: {
          caseId: newEntry.caseId,
          documentId: newEntry.documentId,
          documentName: newEntry.documentName,
          userName: newEntry.userName,
          userId: newEntry.userId,
          status: newEntry.status,
          ...newEntry.metadata
        },
        created_at: newEntry.timestamp
      });
    }
  } catch (err) {
    // Non-blocking
  }

  return newEntry;
}

export function exportAuditLogsToCSV(logs: AuditLogEntry[], customFilename?: string): void {
  const headers = ['Timestamp', 'Action Type', 'Status', 'Case ID', 'Document ID', 'Document Name', 'User', 'Role', 'IP Address', 'Details'];
  const rows = logs.map(l => [
    `"${l.timestamp}"`,
    `"${l.actionLabel || l.actionType}"`,
    `"${l.status}"`,
    `"${l.caseId || 'N/A'}"`,
    `"${l.documentId || 'N/A'}"`,
    `"${(l.documentName || '').replace(/"/g, '""')}"`,
    `"${(l.userName || '').replace(/"/g, '""')}"`,
    `"${l.userRole || ''}"`,
    `"${l.ipAddress || ''}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', customFilename || `LAWGIC_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAuditLogsToJSON(logs: AuditLogEntry[], customFilename?: string): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', customFilename || `LAWGIC_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export const exportAuditLogsAsCSV = exportAuditLogsToCSV;
export const exportAuditLogsAsJSON = exportAuditLogsToJSON;
export const getAuditLogsForCase = async (caseId: string): Promise<AuditLogEntry[]> => {
  return getAuditLogs(caseId);
};

export const DEFAULT_INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1001',
    timestamp: '2026-08-20T19:35:12.000Z',
    actionType: 'DOCUMENT_UPLOADED',
    actionLabel: 'Document Uploaded',
    caseId: 'FIR-2026-088',
    documentId: 'DOC-088-FIR',
    documentName: 'FIR-2026-088-Registered.pdf',
    userId: 'usr-rajesh-01',
    userName: 'Inspector Rajesh Sharma',
    userRole: 'Sub-Inspector',
    details: 'Initial registered FIR uploaded into secure case vault. SHA-256 computed: 7f83b165...9069.',
    status: 'SUCCESS'
  },
  {
    id: 'audit-1002',
    timestamp: '2026-08-20T19:40:05.000Z',
    actionType: 'DOCUMENT_ANALYZED',
    actionLabel: 'AI Intelligence Executed',
    caseId: 'FIR-2026-088',
    documentId: 'DOC-088-FIR',
    documentName: 'FIR-2026-088-Registered.pdf',
    userId: 'usr-rajesh-01',
    userName: 'Inspector Rajesh Sharma',
    userRole: 'Sub-Inspector',
    details: 'Case Document Intelligence executed. Extracted 4 persons, 1 vehicle, 4 evidence references, 3 potential leads.',
    status: 'SUCCESS'
  },
  {
    id: 'audit-1003',
    timestamp: '2026-08-20T21:10:44.000Z',
    actionType: 'DOCUMENT_UPLOADED',
    actionLabel: 'Document Uploaded',
    caseId: 'FIR-2026-088',
    documentId: 'DOC-088-SZR',
    documentName: 'Seizure_Memo_Broken_Strap_RoadDebris.pdf',
    userId: 'usr-rajesh-01',
    userName: 'Inspector Rajesh Sharma',
    userRole: 'Sub-Inspector',
    details: 'Spot seizure memo uploaded with Panchnama details under Section 105 BNSS.',
    status: 'SUCCESS'
  },
  {
    id: 'audit-1004',
    timestamp: '2026-08-21T09:15:20.000Z',
    actionType: 'INTEGRITY_CHECKED',
    actionLabel: 'Integrity Verification',
    caseId: 'FIR-2026-088',
    documentId: 'DOC-088-FIR',
    documentName: 'FIR-2026-088-Registered.pdf',
    userId: 'usr-anita-02',
    userName: 'Advocate Anita Verma',
    userRole: 'Legal Officer',
    details: 'Manual SHA-256 cryptographic check executed. Result: Integrity Verified (Bit-for-bit match).',
    status: 'SUCCESS'
  },
  {
    id: 'audit-1005',
    timestamp: '2026-08-21T10:00:15.000Z',
    actionType: 'VERSION_CREATED',
    actionLabel: 'Version Created',
    caseId: 'FIR-2026-088',
    documentId: 'DOC-088-STM',
    documentName: 'Eyewitness_Statement_Shopkeeper_Ramesh.pdf',
    userId: 'usr-rajesh-01',
    userName: 'Inspector Rajesh Sharma',
    userRole: 'Sub-Inspector',
    details: 'Version updated from v1.0 to v1.1. Description: Updated shop stall landmark and witness phone contact.',
    status: 'SUCCESS'
  },
  {
    id: 'audit-1006',
    timestamp: '2026-08-22T14:30:00.000Z',
    actionType: 'CROSS_DOCUMENT_ANALYSIS',
    actionLabel: 'Cross-Document Intelligence',
    caseId: 'FIR-2026-088',
    userId: 'usr-admin-01',
    userName: 'ACP Vikramaditya Singh',
    userRole: 'Admin',
    details: 'Cross-document intelligence executed across FIR, Witness Statement, and MLC Report. 2 cross-document inconsistencies flagged.',
    status: 'SUCCESS'
  }
];
