export type Role = 'Constable' | 'Sub-Inspector' | 'Investigating Officer' | 'Legal Officer' | 'Authorized Viewer' | 'Admin';
export type View = 'home' | 'dashboard' | 'new-complaint' | 'drafts' | 'admin' | 'settings' | 'research' | 'evidence-scanner' | 'timeline' | 'doc-intelligence' | 'document-vault' | 'document-search' | 'audit-logs' | 'case-workspace' | 'cctv-intelligence';

export * from './types/documentIntelligence';
export * from './types/cctv';

export type TimelineEventCategory = 
  | 'incident' 
  | 'first_response' 
  | 'investigation' 
  | 'forensic' 
  | 'apprehension' 
  | 'judicial' 
  | 'other';

export interface TimelineEvent {
  id: string;
  caseId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "18:45 hrs" or "18:45"
  location: string;
  description: string;
  category: TimelineEventCategory;
  source?: string; // e.g. "CCTV Footage Cam-04", "Complainant 161 BNSS Statement", "MLC Doctor Record", "Spot Panchnama"
  severity?: 'critical' | 'major' | 'routine';
  verified?: boolean;
  officerNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  station: string;
  badgeNumber?: string;
  avatar?: string;
  createdAt?: string;
}

export type CaseStatus = 
  | 'Drafting' 
  | 'Draft' 
  | 'Review Pending' 
  | 'Pending' 
  | 'Submitted' 
  | 'Verified' 
  | 'Registered' 
  | 'Closed';

export interface FIRCase {
  id?: string;
  caseId: string;
  userId: string;
  officerName: string;
  officerRole: Role;
  complainant: string;
  fatherHusbandName?: string;
  complainantPhone?: string;
  complainantAddress?: string;
  district: string;
  policeStation: string;
  incidentDate: string;
  incidentTime: string;
  incidentDescription: string;
  crimeType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: CaseStatus;
  aiAnalysis?: any;
  timelineEvents?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
  station?: string;
  timestamp: string;
}

export type FIRCaseData = FIRCase;

export interface UserProfileData {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  station: string;
  badgeNumber?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AuditLogData = AuditLog;
