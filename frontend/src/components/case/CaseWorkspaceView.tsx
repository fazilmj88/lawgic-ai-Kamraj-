import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Shield,
  ShieldCheck,
  History,
  Download,
  Trash2,
  Eye,
  Plus,
  Search,
  Sparkles,
  Activity,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  FileSearch,
  ArrowRight,
  ArrowLeft,
  Filter,
  Copy,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Scale,
  MapPin,
  Phone,
  AlertCircle,
  Users,
  Video
} from 'lucide-react';
import { FIRCaseData, Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';
import { formatFileSize, truncateHash } from '../../utils/cryptoIntegrity';
import { getAuditLogsForCase, logAuditEvent, exportAuditLogsAsCSV, exportAuditLogsAsJSON, AuditLogEntry } from '../../utils/auditLogger';
import { enforcePermissionOrLog, hasPermission } from '../../utils/rbac';
import { UploadDocumentModal } from '../vault/UploadDocumentModal';
import { DocumentDetailModal } from '../vault/DocumentDetailModal';
import { DocumentVersionModal } from './DocumentVersionModal';
import { DEFAULT_VAULT_DOCUMENTS } from '../../data/defaultVaultDocuments';
import { CaseTimelineView } from './CaseTimelineView';
import { CaseRelationshipGraph } from './CaseRelationshipGraph';
import { IntelligentCaseSearchView } from './IntelligentCaseSearchView';
import { CaseCompletenessView } from './CaseCompletenessView';
import { SmartCaseSummaryCard } from './SmartCaseSummaryCard';
import { EvidenceCustodyLedgerView } from './EvidenceCustodyLedgerView';
import { CctvEvidenceView } from './CctvEvidenceView';
import { OfficialFIRData, DocumentClassificationType, CaseDocumentVaultItem } from '../../types/documentIntelligence';
import { mapCaseToOfficialFIR } from '../../utils/officialFIRMapper';
import { OfficialFIRPreviewModal } from '../fir/OfficialFIRPreviewModal';

// Standard Digital Case Folder Categories requested by user
const FOLDER_CATEGORIES: { id: DocumentClassificationType; label: string; description: string }[] = [
  { id: 'FIR', label: 'FIR', description: 'Registered First Information Reports & CCTNS intake records' },
  { id: 'Victim Statements', label: 'Victim Statements', description: 'Depositions & statements of injured parties (Sec 180 BNSS)' },
  { id: 'Witness Statements', label: 'Witness Statements', description: 'Eyewitness accounts, corroborative panchas & bystander statements' },
  { id: 'Evidence Records', label: 'Evidence Records', description: 'CCTV extractions, seizure memos & physical evidence logs' },
  { id: 'Forensic Reports', label: 'Forensic Reports', description: 'Medico-legal certificates (MLC), ballistic & FSL toxicological assays' },
  { id: 'Court Orders', label: 'Court Orders', description: 'Judicial warrants, remand extensions, bail orders & court directions' }
];

interface CaseWorkspaceViewProps {
  currentCase: FIRCaseData;
  userRole: Role;
  userName: string;
  initialTab?: 'overview' | 'documents' | 'intelligence' | 'cctv' | 'activity';
  onNavigateToView?: (view: string, data?: any) => void;
  onUpdateCaseStatus?: (caseId: string, newStatus: FIRCaseData['status']) => void;
  vaultDocuments?: CaseDocumentVaultItem[];
  onUpdateVaultDocuments?: (docs: CaseDocumentVaultItem[]) => void;
  onBack?: () => void;
}

export const CaseWorkspaceView: React.FC<CaseWorkspaceViewProps> = ({
  currentCase,
  userRole,
  userName,
  initialTab,
  onNavigateToView,
  onUpdateCaseStatus,
  vaultDocuments: propDocuments,
  onUpdateVaultDocuments,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'intelligence' | 'cctv' | 'activity'>(
    initialTab || 'overview'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<
    'timeline' | 'relationships' | 'rag_search' | 'completeness' | 'summary' | 'custody' | 'synthesis' | 'cctv'
  >('timeline');
  const [selectedFolder, setSelectedFolder] = useState<DocumentClassificationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Documents state for this case
  const [documents, setDocuments] = useState<CaseDocumentVaultItem[]>(() => {
    const initial = (propDocuments || DEFAULT_VAULT_DOCUMENTS).filter(
      d => d.caseId === currentCase.caseId
    );
    return initial;
  });

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentClassificationType>('FIR');
  const [previewDoc, setPreviewDoc] = useState<CaseDocumentVaultItem | null>(null);
  const [versionDoc, setVersionDoc] = useState<CaseDocumentVaultItem | null>(null);

  // Status & Notification banners
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Official FIR state
  const [showOfficialFIRModal, setShowOfficialFIRModal] = useState(false);
  const [officialFIRData, setOfficialFIRData] = useState<OfficialFIRData | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'BLOCKED' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_DOWNLOADED' | 'DOCUMENT_VERSION_CREATED' | 'AI_ANALYSIS'>('ALL');

  const caseId = currentCase.caseId;

  const handleOpenOfficialFIR = () => {
    const mapped = mapCaseToOfficialFIR(currentCase, {
      name: userName,
      role: userRole,
      station: currentCase.policeStation,
      badgeNumber: 'SI-TN-401'
    });
    setOfficialFIRData(mapped);
    setShowOfficialFIRModal(true);
  };

  // Refresh audit logs for this specific case
  const refreshCaseAuditLogs = async () => {
    try {
      const logs = await getAuditLogsForCase(caseId);
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Could not fetch audit logs:', err);
    }
  };

  useEffect(() => {
    refreshCaseAuditLogs();
  }, [caseId, activeTab]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // RBAC-Protected Download Handler
  const handleDownloadDocument = async (doc: CaseDocumentVaultItem) => {
    const check = await enforcePermissionOrLog(userRole, 'document.download', {
      userName,
      caseId: doc.caseId,
      documentName: doc.fileName,
      actionDescription: `Download document ${doc.fileName}`
    });

    if (!check.allowed) {
      showNotification('error', check.reason || 'Permission Denied: Your role is not authorized to download this case document.');
      refreshCaseAuditLogs();
      return;
    }

    await logAuditEvent({
      actionType: 'DOCUMENT_DOWNLOADED',
      actionLabel: 'Document Downloaded',
      caseId: doc.caseId,
      documentId: doc.id,
      documentName: doc.fileName,
      userId: 'usr-officer',
      userName,
      userRole,
      details: `Downloaded version ${doc.currentVersion} (${formatFileSize(doc.fileSize)}). Cryptographic seal: ${doc.sha256Hash}`,
      status: 'SUCCESS'
    });

    // Trigger download of text envelope
    const content = `Lawgic AI - Verified Case Record Export\nCase Identifier: ${doc.caseId}\nFile Name: ${doc.fileName}\nClassification: ${doc.documentType}\nActive Version: ${doc.currentVersion}\nCertified SHA-256 Hash: ${doc.sha256Hash}\nIntegrity State: ${doc.integrityStatus}\nUploaded By: ${doc.uploadedBy} (${doc.uploaderRole})\nTimestamp: ${doc.uploadedAt}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${doc.caseId}_${doc.fileName}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', `Document '${doc.fileName}' downloaded. Recorded in audit ledger.`);
    refreshCaseAuditLogs();
  };

  // RBAC-Protected Delete Handler
  const handleDeleteDocument = async (doc: CaseDocumentVaultItem) => {
    const check = await enforcePermissionOrLog(userRole, 'document.delete', {
      userName,
      caseId: doc.caseId,
      documentName: doc.fileName,
      actionDescription: `Delete document ${doc.fileName}`
    });

    if (!check.allowed) {
      showNotification('error', check.reason || 'Permission Denied: Document deletion is strictly restricted to Admin or assigned Investigating Officer.');
      refreshCaseAuditLogs();
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to permanently delete '${doc.fileName}' from case folder ${caseId}? This action is irreversible and recorded in the audit trail.`);
    if (!confirmed) return;

    try {
      // Call backend route
      const res = await fetch(apiUrl(`/api/documents/${doc.id}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          userName,
          userId: 'usr-officer',
          caseId: doc.caseId,
          reason: 'Officer manual case cleanup'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Backend rejected document deletion.');
      }

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      showNotification('success', `Document '${doc.fileName}' permanently purged. Action logged.`);
      refreshCaseAuditLogs();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete document.');
      refreshCaseAuditLogs();
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = selectedFolder === 'ALL' || doc.documentType === selectedFolder;
    const matchesSearch = !searchQuery.trim() ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFolder && matchesSearch;
  });

  const getFolderCount = (type: DocumentClassificationType) => {
    return documents.filter(d => d.documentType === type).length;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-sm border flex items-center justify-between transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-xs font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-75 hover:opacity-100 font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Case Header Banner */}
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] text-[#5A6573] dark:text-[#8A95A5] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
                title="Back to previous view"
              >
                <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
                <span>Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-sm bg-[#1E2D3E] text-[#D4AF37] border border-[#D4AF37]/30">
                  {caseId}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-full ${
                  currentCase.status === 'Verified'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : currentCase.status === 'Under Investigation'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {currentCase.status}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Priority: {currentCase.priority || 'Critical'}
                </span>
              </div>

              <h1 className="text-xl font-bold text-[#08121D] dark:text-white font-serif tracking-tight">
                {currentCase.crimeType || 'Aggravated Offence Case Record'}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-[#5A6573] dark:text-[#8A95A5]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {currentCase.policeStation}, {currentCase.district}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  IO: {currentCase.officerName} ({currentCase.officerRole})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Incident: {currentCase.incidentDate} at {currentCase.incidentTime}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenOfficialFIR}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm bg-[#B8955A] hover:bg-[#A38349] text-[#171717] transition-colors font-serif shadow-xs"
              title="Generate / View Official Tamil Nadu Police Form-I FIR"
            >
              <FileText className="w-4 h-4" />
              Official FIR (TN Police)
            </button>

            <button
              onClick={() => {
                setUploadCategory('FIR');
                setShowUploadModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] transition-colors font-serif shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Upload Case Document
            </button>

            <button
              onClick={() => setActiveTab('cctv')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm bg-[#1E2D3E] hover:bg-[#2A3F55] text-[#D4AF37] border border-[#D4AF37]/30 transition-colors shadow-xs"
              title="Open CCTV Video Evidence Intelligence Studio"
            >
              <Video className="w-4 h-4" />
              CCTV Analysis
            </button>

            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('doc-intelligence', { caseId })}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm bg-[#1E2D3E] hover:bg-[#2A3F55] text-white transition-colors"
                title="Open Document Intelligence Studio"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Intelligence Studio
              </button>
            )}
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            1. Overview & Triage
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'documents'
                ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            2. Case Documents ({documents.length})
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'intelligence'
                ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            3. AI Intelligence & Cross-Analysis
          </button>

          <button
            onClick={() => setActiveTab('cctv')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'cctv'
                ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-[#D4AF37]" />
            4. CCTV Evidence Intelligence
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'activity'
                ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            5. Audit Trail & Activity
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & CASE TRIAGE
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Details & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Narrative Card */}
            <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                Incident Narrative & Gist
              </h3>
              <p className="text-xs text-[#08121D] dark:text-[#CBD5E1] leading-relaxed">
                {currentCase.incidentDescription}
              </p>

              {currentCase.aiAnalysis && (
                <div className="mt-4 p-3 bg-[#F7F5F0] dark:bg-[#142334] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
                    AI Legal Classification
                  </span>
                  <p className="text-xs font-medium text-[#08121D] dark:text-white">
                    {currentCase.aiAnalysis.crimeClassification}
                  </p>
                  <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-1">
                    {currentCase.aiAnalysis.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Complainant & Party Particulars */}
            <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                Complainant & Deponent Record
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-[#5A6573] block">Informant / Complainant</span>
                  <span className="font-semibold text-[#08121D] dark:text-white">
                    {currentCase.complainant}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#5A6573] block">Parentage / Spouse</span>
                  <span className="font-medium text-[#08121D] dark:text-white">
                    {currentCase.fatherHusbandName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#5A6573] block">Contact Number</span>
                  <span className="font-mono text-[#08121D] dark:text-white flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#D4AF37]" />
                    {currentCase.complainantPhone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#5A6573] block">Residential Address</span>
                  <span className="text-[#08121D] dark:text-white">
                    {currentCase.complainantAddress || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Milestones */}
            <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  Chronological Case Timeline
                </h3>
                <span className="text-[11px] font-mono text-[#5A6573]">
                  {currentCase.timelineEvents?.length || 0} Registered Milestones
                </span>
              </div>

              <div className="space-y-3">
                {currentCase.timelineEvents && currentCase.timelineEvents.length > 0 ? (
                  currentCase.timelineEvents.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="p-3 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm bg-[#F7F5F0] dark:bg-[#08121D] flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1E2D3E] text-[#D4AF37] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[#08121D] dark:text-white truncate">
                            {evt.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[#D4AF37] shrink-0">
                            {evt.date} • {evt.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] mt-1 leading-relaxed">
                          {evt.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-[#5A6573]">
                          <span>Source: {evt.source || 'Station Daily Diary'}</span>
                          {evt.verified && (
                            <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#5A6573] italic">No timeline events recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Digital Case Folder Summary & Triage */}
          <div className="space-y-6">
            {/* Status Triage Card */}
            <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-semibold mb-3">
                Investigative Triage & Status
              </h3>
              <div className="space-y-2">
                {(['Pending', 'Under Investigation', 'Verified', 'Chargesheeted', 'Closed'] as FIRCaseData['status'][]).map(st => (
                  <button
                    key={st}
                    onClick={async () => {
                      if (onUpdateCaseStatus) {
                        onUpdateCaseStatus(caseId, st);
                      }
                      await logAuditEvent({
                        actionType: 'STATUS_CHANGED',
                        actionLabel: 'Case Status Updated',
                        caseId,
                        userId: 'usr-officer',
                        userName,
                        userRole,
                        details: `Updated investigative status to '${st}'.`,
                        status: 'SUCCESS'
                      });
                      showNotification('success', `Case status updated to '${st}'.`);
                      refreshCaseAuditLogs();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-sm border transition-colors flex items-center justify-between ${
                      currentCase.status === st
                        ? 'bg-[#1E2D3E] text-[#D4AF37] border-[#D4AF37]/40 font-semibold'
                        : 'border-[#DDD8CE] dark:border-[#1E2D3E] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
                    }`}
                  >
                    <span>{st}</span>
                    {currentCase.status === st && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Structure Overview */}
            <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-semibold mb-3">
                Digital Case Folders
              </h3>
              <div className="space-y-2">
                {FOLDER_CATEGORIES.map(f => {
                  const count = getFolderCount(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFolder(f.id);
                        setActiveTab('documents');
                      }}
                      className="w-full text-left p-2.5 rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-medium text-[#08121D] dark:text-white group-hover:text-[#D4AF37]">
                          {f.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#1E2D3E] text-[#D4AF37]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic Compliance Seal */}
            <div className="p-4 bg-[#F7F5F0] dark:bg-[#142334] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#08121D] dark:text-white mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Section 63 BSA Digital Admissibility
              </div>
              <p className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] leading-relaxed">
                All documents registered in this folder are sealed with SHA-256 cryptographic hashes and timestamped under Bharatiya Sakshya Adhiniyam standards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CASE DOCUMENTS (DIGITAL CASE FOLDERS)
      ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          {/* Top Folder Bar & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#0C1927] p-4 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#5A6573] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents by name, category, or SHA-256 hash..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#5A6573]"
              />
            </div>

            {/* Folder Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#5A6573]">Filter Folder:</span>
              <select
                value={selectedFolder}
                onChange={e => setSelectedFolder(e.target.value as any)}
                className="text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono cursor-pointer"
              >
                <option value="ALL">All Case Documents ({documents.length})</option>
                {FOLDER_CATEGORIES.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({getFolderCount(f.id)})
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setUploadCategory(selectedFolder !== 'ALL' ? selectedFolder : 'FIR');
                  setShowUploadModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] transition-colors font-serif shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document
              </button>
            </div>
          </div>

          {/* Folder Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedFolder('ALL')}
              className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-colors shrink-0 ${
                selectedFolder === 'ALL'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-bold border border-[#D4AF37]/30'
                  : 'bg-white dark:bg-[#0C1927] text-[#5A6573] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37]'
              }`}
            >
              All Folders ({documents.length})
            </button>

            {FOLDER_CATEGORIES.map(f => {
              const count = getFolderCount(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-colors shrink-0 flex items-center gap-1.5 ${
                    selectedFolder === f.id
                      ? 'bg-[#1E2D3E] text-[#D4AF37] font-bold border border-[#D4AF37]/30'
                      : 'bg-white dark:bg-[#0C1927] text-[#5A6573] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37]'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{f.label}</span>
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/20 text-[#D4AF37]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CCTV Evidence Intelligence Quick-Access Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#101C29] border border-[#C6A15B]/30 rounded-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <div className="text-xs font-serif font-bold text-white flex items-center gap-2">
                  <span>CCTV Video Evidence Intelligence</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] rounded-xs font-semibold">
                    Sec 63 BSA 2023
                  </span>
                </div>
                <div className="text-[11px] text-[#8C96A3] mt-0.5">
                  Analyze video surveillance recordings, frame-level timestamp events, suspect/vehicle tracking, and generate Section 63 electronic certificates.
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('cctv')}
              className="px-3 py-1.5 text-xs font-medium rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] font-serif transition-colors shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch CCTV Studio</span>
            </button>
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 hover:border-[#D4AF37] transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Top Category & Version Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[#1E2D3E] text-[#D4AF37]">
                      {doc.documentType}
                    </span>
                    <button
                      onClick={() => setVersionDoc(doc)}
                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/30 transition-colors"
                      title="Open Version History"
                    >
                      {doc.currentVersion || 'v1.0'}
                    </button>
                  </div>

                  {/* Document Name */}
                  <h4 className="text-xs font-semibold text-[#08121D] dark:text-white line-clamp-2 mb-1" title={doc.fileName}>
                    {doc.fileName}
                  </h4>

                  {/* Notes / Description */}
                  {doc.notes && (
                    <p className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] line-clamp-2 mb-3">
                      {doc.notes}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60 space-y-1.5 text-[11px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                    <div className="flex items-center justify-between">
                      <span>Uploaded By:</span>
                      <span className="text-[#08121D] dark:text-white font-medium truncate max-w-[120px]">
                        {doc.uploadedBy}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Timestamp:</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>File Size:</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>

                  {/* SHA-256 Hash Preview */}
                  <div className="mt-3 p-2 bg-[#F7F5F0] dark:bg-[#08121D] rounded-xs font-mono text-[10px] text-[#5A6573] flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{truncateHash(doc.sha256Hash, 8, 8)}</span>
                    </div>
                    <button
                      onClick={() => handleCopyHash(doc.sha256Hash)}
                      className="p-1 hover:text-[#08121D] dark:hover:text-white text-[#5A6573] shrink-0"
                      title="Copy full SHA-256 hash"
                    >
                      {copiedHash === doc.sha256Hash ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex flex-col items-center justify-center p-2 rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                    title="Preview Document & Cryptographic Seal"
                  >
                    <Eye className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px]">Preview</span>
                  </button>

                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="flex flex-col items-center justify-center p-2 rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                    title="Download Document (Audited)"
                  >
                    <Download className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px]">Download</span>
                  </button>

                  <button
                    onClick={() => setVersionDoc(doc)}
                    className="flex flex-col items-center justify-center p-2 rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                    title="Version History & Side-by-Side Compare"
                  >
                    <History className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px]">Versions</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="flex flex-col items-center justify-center p-2 rounded-xs border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Document (RBAC Restricted)"
                  >
                    <Trash2 className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px]">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <FolderOpen className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif">
                No documents found in folder '{selectedFolder}'
              </h3>
              <p className="text-xs text-[#5A6573] mt-1 max-w-sm mx-auto">
                Upload registered FIR files, victim depositions, forensic reports, or judicial orders to populate this digital folder.
              </p>
              <button
                onClick={() => {
                  setUploadCategory(selectedFolder !== 'ALL' ? selectedFolder : 'FIR');
                  setShowUploadModal(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-medium rounded-sm bg-[#D4AF37] text-[#08121D] font-serif inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload Document Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: AI INTELLIGENCE & CROSS-ANALYSIS
      ========================================================================= */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Intelligence Suite Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm overflow-x-auto text-xs">
            <button
              onClick={() => setIntelligenceSubTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'timeline'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>1. Timeline &amp; Contradictions</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('relationships')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'relationships'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>2. Relationship Graph</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('rag_search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'rag_search'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>3. Case RAG Search</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('completeness')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'completeness'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>4. Integrity &amp; Completeness</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'summary'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>5. Smart Case Brief</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('custody')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'custody'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>6. Evidence Custody</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('synthesis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'synthesis'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>7. Statutory Matrix</span>
            </button>

            <button
              onClick={() => setIntelligenceSubTab('cctv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                intelligenceSubTab === 'cctv'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>8. CCTV Video Intelligence</span>
            </button>
          </div>

          {/* Sub-Tab View Rendering */}
          {intelligenceSubTab === 'cctv' && (
            <CctvEvidenceView
              caseId={caseId}
              userRole={userRole}
              userName={userName}
            />
          )}
          {intelligenceSubTab === 'timeline' && (
            <CaseTimelineView
              caseId={caseId}
              userRole={userRole}
              userName={userName}
            />
          )}

          {intelligenceSubTab === 'relationships' && (
            <CaseRelationshipGraph
              caseId={caseId}
              userRole={userRole}
              userName={userName}
            />
          )}

          {intelligenceSubTab === 'rag_search' && (
            <IntelligentCaseSearchView
              currentCaseId={caseId}
              userRole={userRole}
              userName={userName}
              onViewDocument={(docId) => {
                const found = documents.find(d => d.id === docId);
                if (found) {
                  setPreviewDoc(found);
                }
              }}
            />
          )}

          {intelligenceSubTab === 'completeness' && (
            <CaseCompletenessView
              caseId={caseId}
              userRole={userRole}
              userName={userName}
              onOpenUploadForCategory={(category) => {
                setSelectedFolder(category);
                setShowUploadModal(true);
              }}
            />
          )}

          {intelligenceSubTab === 'summary' && (
            <SmartCaseSummaryCard
              caseId={caseId}
              userRole={userRole}
              userName={userName}
            />
          )}

          {intelligenceSubTab === 'custody' && (
            <EvidenceCustodyLedgerView
              caseId={caseId}
              userRole={userRole}
              userName={userName}
            />
          )}

          {intelligenceSubTab === 'synthesis' && (
            <div className="space-y-6">
              {/* Top Cross-Analysis Banner */}
              <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Cross-Document Intelligence Synthesis
                    </span>
                    <h3 className="text-base font-bold text-[#08121D] dark:text-white font-serif mt-1">
                      Automated Evidence Synthesis for {caseId}
                    </h3>
                    <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-1">
                      AI has correlated 6 case documents (FIR, victim deposition, shopkeeper witness statement, CCTV extraction, and RML medico-legal report).
                    </p>
                  </div>

                  {onNavigateToView && (
                    <button
                      onClick={() => onNavigateToView('doc-intelligence', { caseId })}
                      className="px-4 py-2 text-xs font-semibold rounded-sm bg-[#D4AF37] text-[#08121D] font-serif hover:bg-[#C29B27] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Open in Document Intelligence Studio
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Extracted Entities Card */}
                <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Cross-Document Correlated Entities
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                      <span className="text-[10px] font-mono text-[#D4AF37] font-semibold block">PRIMARY VICTIM / INFORMANT</span>
                      <div className="font-semibold text-[#08121D] dark:text-white mt-0.5">Aarav Malhotra (Age 29)</div>
                      <div className="text-[11px] text-[#5A6573] mt-1">
                        Confirmed across FIR-088, Hand-written Complaint, and RML Medico-Legal Certificate (#8492). Sustained blunt forearm trauma.
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                      <span className="text-[10px] font-mono text-rose-500 font-semibold block">SUSPECTS / ACCUSED</span>
                      <div className="font-semibold text-[#08121D] dark:text-white mt-0.5">Two Unidentified Helmeted Males</div>
                      <div className="text-[11px] text-[#5A6573] mt-1">
                        Rider approx 5'9", dark jacket; Pillion rider approx 5'7", brandished iron rod / blunt metallic weapon. Escape route: Barakhamba Road towards Tolstoy Marg.
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                      <span className="text-[10px] font-mono text-blue-500 font-semibold block">VEHICLE OF OFFENCE</span>
                      <div className="font-semibold text-[#08121D] dark:text-white mt-0.5">Black Bajaj Pulsar 220 (Unnumbered Plate)</div>
                      <div className="text-[11px] text-[#5A6573] mt-1">
                        Verified in ICCC Traffic surveillance extract frame 18:47:12 hrs with broken rear taillight lens.
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                      <span className="text-[10px] font-mono text-amber-500 font-semibold block">STOLEN PROPERTY / WEAPON</span>
                      <div className="font-semibold text-[#08121D] dark:text-white mt-0.5">22g Gold Chain &amp; iPhone 14 Pro (Space Black)</div>
                      <div className="text-[11px] text-[#5A6573] mt-1">
                        IMEI #358921094829102 placed under surveillance. Weapon described as 1.5-foot iron rod.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Provisions & Contradictions */}
                <div className="space-y-6">
                  {/* Applicable Sections */}
                  <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-semibold flex items-center gap-2 mb-3">
                      <Scale className="w-4 h-4 text-[#D4AF37]" />
                      Applicable Statutory Provisions (BNS 2023 vs IPC)
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm bg-[#F7F5F0] dark:bg-[#142334]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#08121D] dark:text-white">Section 304 BNS 2023</span>
                          <span className="text-[10px] font-mono text-[#5A6573]">Equivalent: Sec 392 IPC</span>
                        </div>
                        <div className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] mt-1">
                          Robbery by force or bodily harm on public highway after sunset (enhanced imprisonment up to 14 years).
                        </div>
                      </div>

                      <div className="p-2.5 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm bg-[#F7F5F0] dark:bg-[#142334]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#08121D] dark:text-white">Section 115 BNS 2023</span>
                          <span className="text-[10px] font-mono text-[#5A6573]">Equivalent: Sec 323 IPC</span>
                        </div>
                        <div className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] mt-1">
                          Voluntarily causing hurt with weapon of offence, substantiated by RML Hospital MLC report.
                        </div>
                      </div>

                      <div className="p-2.5 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm bg-[#F7F5F0] dark:bg-[#142334]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#08121D] dark:text-white">Section 3(5) BNS 2023</span>
                          <span className="text-[10px] font-mono text-[#5A6573]">Equivalent: Sec 34 IPC</span>
                        </div>
                        <div className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] mt-1">
                          Joint criminal liability in furtherance of common intention between rider and pillion assailant.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contradiction & Corroboration Engine */}
                  <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
                      Contradiction &amp; Discrepancy Detection
                    </h4>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        High Corroboration (94% Alignment)
                      </div>
                      <p className="text-[11px] text-[#5A6573] dark:text-[#CBD5E1]">
                        Victim deposition aligns with tea-vendor eyewitness statement on exact motorcycle model and getaway trajectory toward Tolstoy Marg.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: CCTV EVIDENCE INTELLIGENCE
      ========================================================================= */}
      {activeTab === 'cctv' && (
        <CctvEvidenceView
          caseId={caseId}
          userRole={userRole}
          userName={userName}
        />
      )}

      {/* =========================================================================
          TAB 5: ACTIVITY & IMMUTABLE AUDIT TRAIL
      ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          {/* Top Activity Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0C1927] p-4 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#5A6573]">Filter Activity:</span>
              <select
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value as any)}
                className="text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono cursor-pointer"
              >
                <option value="ALL">All Recorded Actions ({auditLogs.length})</option>
                <option value="DOCUMENT_UPLOADED">Document Uploads</option>
                <option value="DOCUMENT_DOWNLOADED">Document Downloads</option>
                <option value="DOCUMENT_VERSION_CREATED">Version Updates</option>
                <option value="BLOCKED">Unauthorized / RBAC Blocked Attempts</option>
                <option value="AI_ANALYSIS">AI Intelligence Invocations</option>
              </select>

              <button
                onClick={refreshCaseAuditLogs}
                className="p-2 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm"
                title="Refresh audit logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  exportAuditLogsAsCSV(auditLogs, `${caseId}-audit-trail.csv`);
                  showNotification('success', 'Case audit trail exported as CSV.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={() => {
                  exportAuditLogsAsJSON(auditLogs, `${caseId}-audit-trail.json`);
                  showNotification('success', 'Case audit trail exported as JSON.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-xs font-semibold text-[#08121D] dark:text-white font-serif">
                  Chain-of-Custody & User Action Ledger for {caseId}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable Security Ledger
              </span>
            </div>

            <div className="divide-y divide-[#DDD8CE]/60 dark:divide-[#1E2D3E]/60">
              {auditLogs
                .filter(l => {
                  if (auditFilter === 'ALL') return true;
                  if (auditFilter === 'BLOCKED') return l.status === 'BLOCKED' || l.actionType === 'PERMISSION_DENIED';
                  return l.actionType === auditFilter;
                })
                .map((log, idx) => {
                  const isBlocked = log.status === 'BLOCKED' || log.actionType === 'PERMISSION_DENIED';
                  return (
                    <div
                      key={log.id || idx}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBlocked ? 'bg-rose-500/5' : 'hover:bg-[#F7F5F0]/50 dark:hover:bg-[#142334]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5 ${
                          isBlocked
                            ? 'bg-rose-500/20 text-rose-500'
                            : 'bg-[#1E2D3E] text-[#D4AF37]'
                        }`}>
                          {isBlocked ? <XCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#08121D] dark:text-white">
                              {log.actionLabel || log.actionType}
                            </span>
                            <span className={`px-2 py-0.2 text-[9px] font-mono uppercase font-bold rounded-xs ${
                              isBlocked
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {log.status || 'SUCCESS'}
                            </span>
                          </div>

                          <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-1">
                            {log.details}
                          </p>

                          {log.documentName && (
                            <div className="text-[11px] font-mono text-[#5A6573] mt-1 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#D4AF37]" />
                              <span>{log.documentName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-xs font-mono text-[#5A6573]">
                        <div className="font-medium text-[#08121D] dark:text-white">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-[#D4AF37]">
                          {log.userRole}
                        </div>
                        <div className="text-[10px] text-[#5A6573] mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {auditLogs.length === 0 && (
                <div className="p-8 text-center text-xs text-[#5A6573] italic">
                  No audit activity logged for this case yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
      ========================================================================= */}
      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          defaultCaseId={caseId}
          defaultCategory={uploadCategory}
          userRole={userRole}
          userName={userName}
          onClose={() => setShowUploadModal(false)}
          onUploaded={(newDoc) => {
            setDocuments(prev => [newDoc, ...prev]);
            setShowUploadModal(false);
            showNotification('success', `Document '${newDoc.fileName}' uploaded and sealed with SHA-256.`);
            refreshCaseAuditLogs();
          }}
        />
      )}

      {/* Preview & Integrity Modal */}
      {previewDoc && (
        <DocumentDetailModal
          item={previewDoc}
          userRole={userRole}
          userName={userName}
          onClose={() => setPreviewDoc(null)}
          onUpdated={(updated) => {
            setDocuments(prev => prev.map(d => (d.id === updated.id ? updated : d)));
            setPreviewDoc(updated);
            refreshCaseAuditLogs();
          }}
        />
      )}

      {/* Version Control Modal */}
      {versionDoc && (
        <DocumentVersionModal
          document={versionDoc}
          userRole={userRole}
          userName={userName}
          onClose={() => setVersionDoc(null)}
          onVersionAdded={(updated) => {
            setDocuments(prev => prev.map(d => (d.id === updated.id ? updated : d)));
            setVersionDoc(updated);
            showNotification('success', `New revision ${updated.currentVersion} published for '${updated.fileName}'.`);
            refreshCaseAuditLogs();
          }}
        />
      )}

      {/* Official Tamil Nadu Police FIR Preview & Generator Modal */}
      {showOfficialFIRModal && officialFIRData && (
        <OfficialFIRPreviewModal
          firData={officialFIRData}
          userRole={userRole}
          userName={userName}
          userStation={currentCase.policeStation}
          existingDocuments={documents}
          onClose={() => setShowOfficialFIRModal(false)}
          onFIRSaved={(savedDoc) => {
            setDocuments(prev => [savedDoc, ...prev]);
            if (onUpdateVaultDocuments && propDocuments) {
              onUpdateVaultDocuments([savedDoc, ...propDocuments]);
            }
            showNotification('success', `Official FIR ${savedDoc.customMetadata?.firNumber || ''} saved to Document Vault.`);
            refreshCaseAuditLogs();
          }}
        />
      )}
    </div>
  );
};
