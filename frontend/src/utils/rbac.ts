import { Role } from '../types';
import { logAuditEvent } from './auditLogger';

export type GranularPermission =
  | 'case.view'
  | 'case.create'
  | 'case.edit'
  | 'document.upload'
  | 'document.view'
  | 'document.download'
  | 'document.delete'
  | 'document.version.create'
  | 'audit.view';

export type Permission =
  | GranularPermission
  | 'VIEW_CASE_DOCUMENTS'
  | 'UPLOAD_DOCUMENT'
  | 'ANALYZE_DOCUMENT'
  | 'EDIT_METADATA'
  | 'VIEW_VERSIONS'
  | 'CREATE_VERSION'
  | 'VERIFY_INTEGRITY'
  | 'EXPORT_DATA'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_USERS'
  | 'canViewDocuments'
  | 'canUploadDocuments'
  | 'canAnalyzeDocuments'
  | 'canEditMetadata'
  | 'canViewVersions'
  | 'canCreateVersion'
  | 'canVerifyIntegrity'
  | 'canExportData'
  | 'canViewAuditLogs'
  | 'canManageUsers';

/**
 * Deterministic Role-Based Access Control (RBAC) Matrix
 * Required Specifications:
 * - Admin: Full access to all cases, documents, and audit logs.
 * - Investigating Officer: Full access to their assigned cases, upload documents, view versions, run AI.
 * - Sub-Inspector: Upload documents, view assigned cases, create versions (cannot delete files).
 * - Legal Officer: View case documents, access legal intelligence (cannot upload, edit cases, delete files, create versions).
 * - Authorized Viewer: Read-only access to approved documents (cannot upload, edit, delete, create versions, or view audit logs).
 * - Constable: Case intake, document upload, and view documents.
 * 
 * Sensitive actions: Deleting documents requires Admin or assigned IO permission.
 * NOTE: Authorization is deterministic logic — AI is NEVER used to decide permissions.
 */
export const GRANULAR_ROLE_PERMISSIONS: Record<Role, GranularPermission[]> = {
  'Admin': [
    'case.view',
    'case.create',
    'case.edit',
    'document.upload',
    'document.view',
    'document.download',
    'document.delete',
    'document.version.create',
    'audit.view'
  ],
  'Investigating Officer': [
    'case.view',
    'case.create',
    'case.edit',
    'document.upload',
    'document.view',
    'document.download',
    'document.delete',
    'document.version.create',
    'audit.view'
  ],
  'Sub-Inspector': [
    'case.view',
    'case.create',
    'case.edit',
    'document.upload',
    'document.view',
    'document.download',
    'document.version.create'
  ],
  'Legal Officer': [
    'case.view',
    'document.view',
    'document.download',
    'audit.view'
  ],
  'Authorized Viewer': [
    'case.view',
    'document.view'
  ],
  'Constable': [
    'case.view',
    'case.create',
    'document.upload',
    'document.view'
  ]
};

// Legacy permission mapping for full backward compatibility
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'Admin': [
    'VIEW_CASE_DOCUMENTS',
    'UPLOAD_DOCUMENT',
    'ANALYZE_DOCUMENT',
    'EDIT_METADATA',
    'VIEW_VERSIONS',
    'CREATE_VERSION',
    'VERIFY_INTEGRITY',
    'EXPORT_DATA',
    'VIEW_AUDIT_LOGS',
    'MANAGE_USERS',
    ...GRANULAR_ROLE_PERMISSIONS['Admin']
  ],
  'Investigating Officer': [
    'VIEW_CASE_DOCUMENTS',
    'UPLOAD_DOCUMENT',
    'ANALYZE_DOCUMENT',
    'EDIT_METADATA',
    'VIEW_VERSIONS',
    'CREATE_VERSION',
    'VERIFY_INTEGRITY',
    'EXPORT_DATA',
    'VIEW_AUDIT_LOGS',
    ...GRANULAR_ROLE_PERMISSIONS['Investigating Officer']
  ],
  'Sub-Inspector': [
    'VIEW_CASE_DOCUMENTS',
    'UPLOAD_DOCUMENT',
    'ANALYZE_DOCUMENT',
    'EDIT_METADATA',
    'VIEW_VERSIONS',
    'CREATE_VERSION',
    'VERIFY_INTEGRITY',
    'EXPORT_DATA',
    ...GRANULAR_ROLE_PERMISSIONS['Sub-Inspector']
  ],
  'Legal Officer': [
    'VIEW_CASE_DOCUMENTS',
    'ANALYZE_DOCUMENT',
    'VIEW_VERSIONS',
    'VERIFY_INTEGRITY',
    'EXPORT_DATA',
    'VIEW_AUDIT_LOGS',
    ...GRANULAR_ROLE_PERMISSIONS['Legal Officer']
  ],
  'Authorized Viewer': [
    'VIEW_CASE_DOCUMENTS',
    'VIEW_VERSIONS',
    'VERIFY_INTEGRITY',
    ...GRANULAR_ROLE_PERMISSIONS['Authorized Viewer']
  ],
  'Constable': [
    'VIEW_CASE_DOCUMENTS',
    'UPLOAD_DOCUMENT',
    'VIEW_VERSIONS',
    'VERIFY_INTEGRITY',
    ...GRANULAR_ROLE_PERMISSIONS['Constable']
  ]
};

/**
 * Deterministic permission checker.
 */
export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;

  const permMap: Record<string, GranularPermission> = {
    'canViewDocuments': 'document.view',
    'VIEW_CASE_DOCUMENTS': 'document.view',
    'canUploadDocuments': 'document.upload',
    'UPLOAD_DOCUMENT': 'document.upload',
    'canViewVersions': 'document.view',
    'VIEW_VERSIONS': 'document.view',
    'canCreateVersion': 'document.version.create',
    'CREATE_VERSION': 'document.version.create',
    'canViewAuditLogs': 'audit.view',
    'VIEW_AUDIT_LOGS': 'audit.view'
  };

  const granular = permMap[permission];
  if (granular) {
    const allowed = (GRANULAR_ROLE_PERMISSIONS[role] || []).includes(granular);
    if (allowed) return true;
  }

  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

/**
 * Enforces a permission deterministically. If denied, blocks the action and logs
 * a PERMISSION_DENIED security event in the immutable audit trail.
 */
export async function enforcePermissionOrLog(
  role: Role | undefined | null,
  permission: GranularPermission,
  context: {
    userName?: string;
    userId?: string;
    caseId?: string;
    documentId?: string;
    documentName?: string;
    actionDescription?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const isAllowed = role ? (GRANULAR_ROLE_PERMISSIONS[role] || []).includes(permission) : false;

  if (!isAllowed) {
    const reason = `Access Denied: Role '${role || 'Anonymous'}' is not authorized to execute '${permission}'. Sensitive actions require Admin or assigned Investigating Officer clearance.`;
    
    // Log security violation in immutable audit trail
    try {
      await logAuditEvent({
        actionType: 'PERMISSION_DENIED',
        actionLabel: 'Access Blocked (RBAC)',
        caseId: context.caseId || 'UNKNOWN',
        documentId: context.documentId,
        documentName: context.documentName,
        userId: context.userId || 'usr-client',
        userName: context.userName || 'Anonymous / Unverified',
        userRole: role || 'Unassigned',
        details: `${reason} Action: ${context.actionDescription || permission}.`,
        status: 'BLOCKED'
      });
    } catch (e) {
      console.warn('Failed to log PERMISSION_DENIED event:', e);
    }

    return { allowed: false, reason };
  }

  return { allowed: true };
}

export function getRoleBadgeInfo(role: Role | string): { label: string; bgClass: string; textClass: string; borderClass: string } {
  switch (role) {
    case 'Admin':
      return { label: 'Administrator', bgClass: 'bg-red-500/10', textClass: 'text-red-500', borderClass: 'border-red-500/30' };
    case 'Investigating Officer':
      return { label: 'Investigating Officer (IO)', bgClass: 'bg-[#C6A15B]/10', textClass: 'text-[#C6A15B]', borderClass: 'border-[#C6A15B]/30' };
    case 'Sub-Inspector':
      return { label: 'Sub-Inspector (SI)', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500', borderClass: 'border-blue-500/30' };
    case 'Legal Officer':
      return { label: 'Legal Advisor / APP', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500', borderClass: 'border-purple-500/30' };
    case 'Authorized Viewer':
      return { label: 'Authorized Viewer', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', borderClass: 'border-emerald-500/30' };
    case 'Constable':
      return { label: 'Police Constable', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', borderClass: 'border-amber-500/30' };
    default:
      return { label: role || 'User', bgClass: 'bg-gray-500/10', textClass: 'text-gray-400', borderClass: 'border-gray-500/30' };
  }
}
