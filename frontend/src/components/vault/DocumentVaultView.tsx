import React, { useState } from 'react';
import { 
  FolderArchive, 
  FileText, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Layers, 
  Eye, 
  Play, 
  Clock, 
  History, 
  CheckSquare, 
  Plus,
  RefreshCw,
  Lock,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { CaseDocumentVaultItem, DocumentClassificationType } from '../../types/documentIntelligence';
import { DocumentDetailModal } from './DocumentDetailModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { CrossDocumentComparisonModal } from './CrossDocumentComparisonModal';
import { hasPermission } from '../../utils/rbac';
import { verifyDocumentHash } from '../../utils/cryptoIntegrity';
import { logAuditEvent } from '../../utils/auditLogger';
import { Role } from '../../types';

interface DocumentVaultViewProps {
  documents: CaseDocumentVaultItem[];
  onAnalyzeDocument: (doc: CaseDocumentVaultItem) => void;
  onUpdateDocuments: (docs: CaseDocumentVaultItem[]) => void;
  userRole?: string;
  userName?: string;
  selectedCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onBack?: () => void;
}

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({
  documents = [],
  onAnalyzeDocument,
  onUpdateDocuments,
  userRole = 'Sub-Inspector',
  userName = 'Inspector Rajesh Sharma',
  selectedCaseId = 'ALL',
  onSelectCase,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCase, setFilterCase] = useState<string>(selectedCaseId);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterIntegrity, setFilterIntegrity] = useState<string>('ALL');
  const [filterAnalysis, setFilterAnalysis] = useState<string>('ALL');

  // Modals state
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<CaseDocumentVaultItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedDocIdsForCompare, setSelectedDocIdsForCompare] = useState<string[]>([]);

  // RBAC checks
  const canUpload = hasPermission(userRole as Role, 'canUploadDocuments');
  const canVerifyIntegrity = hasPermission(userRole as Role, 'canVerifyIntegrity');

  // Unique list of case IDs
  const caseIds = Array.from(new Set(documents.map(d => d.caseId)));

  const filteredDocuments = documents.filter(doc => {
    if (filterCase !== 'ALL' && doc.caseId !== filterCase) return false;
    if (filterType !== 'ALL' && doc.documentType !== filterType) return false;
    if (filterIntegrity !== 'ALL' && doc.integrityStatus !== filterIntegrity) return false;
    if (filterAnalysis !== 'ALL' && doc.analysisStatus !== filterAnalysis) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(q) ||
        doc.caseId.toLowerCase().includes(q) ||
        doc.documentType.toLowerCase().includes(q) ||
        doc.sha256Hash.toLowerCase().includes(q) ||
        (doc.notes && doc.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIdsForCompare(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedDocIdsForCompare.length === filteredDocuments.length) {
      setSelectedDocIdsForCompare([]);
    } else {
      setSelectedDocIdsForCompare(filteredDocuments.map(d => d.id));
    }
  };

  const handleUpdateSingleDoc = (updated: CaseDocumentVaultItem) => {
    const nextList = documents.map(d => d.id === updated.id ? updated : d);
    onUpdateDocuments(nextList);
  };

  const handleDocumentUploaded = (newDoc: CaseDocumentVaultItem, analyzeImmediately: boolean = false) => {
    const nextList = [newDoc, ...documents];
    onUpdateDocuments(nextList);
    setShowUploadModal(false);

    if (analyzeImmediately) {
      onAnalyzeDocument(newDoc);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
              title="Back to previous view"
            >
              <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
              <span>Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-[#C6A15B]" />
              <h2 className="text-xl font-bold font-serif text-[#08121D] dark:text-white uppercase tracking-wider">
                Secure Case Document Vault
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/30">
                BSA 2023 Tamper-Evident
              </span>
            </div>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-1 max-w-2xl">
              Centralized custodial repository for legal records, petitions, statements, panchnamas, and forensic certificates with cryptographic SHA-256 fingerprinting.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowComparisonModal(true)}
            disabled={selectedDocIdsForCompare.length < 2 && filteredDocuments.length < 2}
            className="px-3.5 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#08121D] dark:text-white text-xs font-mono font-medium rounded-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="w-4 h-4 text-[#C6A15B]" />
            <span>Cross-Document Compare {selectedDocIdsForCompare.length >= 2 ? `(${selectedDocIdsForCompare.length})` : ''}</span>
          </button>

          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[#C6A15B] text-[#08121D] text-xs font-mono font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Case Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#5A6573] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, case ID, document type, hash or officer notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#8C96A3]"
            />
          </div>

          {/* Case Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider shrink-0">Case:</span>
            <select
              value={filterCase}
              onChange={e => {
                setFilterCase(e.target.value);
                if (onSelectCase && e.target.value !== 'ALL') onSelectCase(e.target.value);
              }}
              className="text-xs px-2.5 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono cursor-pointer"
            >
              <option value="ALL">All Cases ({documents.length})</option>
              {caseIds.map(cId => (
                <option key={cId} value={cId}>Case {cId}</option>
              ))}
            </select>
          </div>

          {/* Classification Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider shrink-0">Type:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Complaint / Petition">Complaint / Petition</option>
              <option value="FIR Copy">FIR Copy</option>
              <option value="Witness Statement (Sec 180 BNSS)">Witness Statement</option>
              <option value="Seizure Memo / Panchnama">Seizure Memo</option>
              <option value="Medico-Legal / Forensic Report">Forensic / MLC</option>
              <option value="Chargesheet / Final Report">Chargesheet</option>
              <option value="Court Order / Bail Record">Court Order</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#5A6573] text-[10px] uppercase">Integrity:</span>
            {['ALL', 'Verified', 'Integrity Check Failed'].map(st => (
              <button
                key={st}
                onClick={() => setFilterIntegrity(st)}
                className={`text-[10px] px-2 py-0.5 rounded-sm border cursor-pointer ${
                  filterIntegrity === st
                    ? 'bg-[#08121D] dark:bg-white text-white dark:text-[#08121D] font-bold'
                    : 'text-[#5A6573] border-transparent hover:border-[#DDD8CE]'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-[#5A6573]">
            Showing <span className="font-bold text-[#08121D] dark:text-white">{filteredDocuments.length}</span> of {documents.length} records
          </div>
        </div>
      </div>

      {/* Documents Table View */}
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] dark:bg-[#08121D] border-b border-[#DDD8CE] dark:border-[#1E2D3E] font-mono text-[10px] text-[#5A6573] uppercase tracking-wider">
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={filteredDocuments.length > 0 && selectedDocIdsForCompare.length === filteredDocuments.length}
                    onChange={handleSelectAllFiltered}
                    className="rounded text-[#C6A15B] focus:ring-0 cursor-pointer"
                    aria-label="Select all documents"
                  />
                </th>
                <th className="py-3 px-4">Document / File Name</th>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Cryptographic Integrity</th>
                <th className="py-3 px-4">AI Analysis</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8CE]/60 dark:divide-[#1E2D3E]/60">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => {
                  const isSelected = selectedDocIdsForCompare.includes(doc.id);
                  const isVerified = doc.integrityStatus === 'Verified';

                  return (
                    <tr 
                      key={doc.id}
                      className={`hover:bg-[#F7F5F0]/50 dark:hover:bg-[#08121D]/40 transition-colors ${
                        isSelected ? 'bg-[#C6A15B]/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectDoc(doc.id)}
                          className="rounded text-[#C6A15B] focus:ring-0 cursor-pointer"
                          aria-label={`Select document ${doc.fileName}`}
                        />
                      </td>

                      {/* File Details */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="font-bold text-[#08121D] dark:text-white hover:text-[#C6A15B] transition-colors truncate block text-left cursor-pointer"
                            >
                              {doc.fileName}
                            </button>
                            <span className="text-[10px] font-mono text-[#5A6573] block truncate">
                              {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded by {doc.uploadedBy}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Case ID */}
                      <td className="py-3 px-4 font-mono text-xs font-bold text-[#08121D] dark:text-white">
                        {doc.caseId}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#DDD8CE]/40 dark:bg-[#1E2D3E] text-[#08121D] dark:text-white">
                          {doc.documentType}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="py-3 px-4 font-mono text-xs text-[#C6A15B] font-bold">
                        {doc.currentVersion}
                      </td>

                      {/* Integrity Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-500 border-red-500/30'
                        }`}>
                          {isVerified ? (
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                          )}
                          <span>{doc.integrityStatus}</span>
                        </span>
                      </td>

                      {/* Analysis Status */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          doc.analysisStatus === 'Analyzed'
                            ? 'bg-[#C6A15B]/10 text-[#C6A15B] font-bold'
                            : 'bg-[#DDD8CE]/50 dark:bg-[#1E2D3E] text-[#5A6573]'
                        }`}>
                          {doc.analysisStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocForDetail(doc)}
                            title="Inspect metadata, versions & verify integrity"
                            className="p-1.5 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white rounded-sm hover:bg-[#DDD8CE]/50 dark:hover:bg-[#1E2D3E] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onAnalyzeDocument(doc)}
                            title="Run AI Case Document Intelligence"
                            className="px-2.5 py-1 bg-[#C6A15B] text-[#08121D] text-[10px] font-mono font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Analyze
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-mono text-[#5A6573]">
                    <FolderArchive className="w-8 h-8 mx-auto text-[#C6A15B]/30 mb-2" />
                    <span>No case documents found matching your filter criteria.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Bar */}
        <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#5A6573] gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#08121D] dark:text-white">Active Custody Standard:</span>
            <span>SHA-256 Digest Certification • BSA 2023 Sec 63 Compliant</span>
          </div>

          {selectedDocIdsForCompare.length > 0 && (
            <div className="flex items-center gap-2">
              <span>{selectedDocIdsForCompare.length} items selected</span>
              <button
                onClick={() => setShowComparisonModal(true)}
                disabled={selectedDocIdsForCompare.length < 2}
                className="px-2 py-0.5 bg-[#C6A15B] text-[#08121D] text-[10px] font-bold rounded-sm hover:bg-[#b08d4b] cursor-pointer disabled:opacity-50"
              >
                Compare Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedDocForDetail && (
        <DocumentDetailModal
          document={selectedDocForDetail}
          onClose={() => setSelectedDocForDetail(null)}
          onAnalyze={onAnalyzeDocument}
          onUpdateDocument={handleUpdateSingleDoc}
          userRole={userRole}
          userName={userName}
        />
      )}

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleDocumentUploaded}
          userRole={userRole}
          userName={userName}
          defaultCaseId={filterCase !== 'ALL' ? filterCase : 'LG-1024'}
        />
      )}

      {showComparisonModal && (
        <CrossDocumentComparisonModal
          caseId={filterCase !== 'ALL' ? filterCase : (documents[0]?.caseId || 'LG-1024')}
          vaultDocuments={documents}
          preselectedDocIds={selectedDocIdsForCompare}
          onClose={() => setShowComparisonModal(false)}
          onOpenDocument={onAnalyzeDocument}
        />
      )}
    </div>
  );
};
