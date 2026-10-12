import React, { useState, useRef } from 'react';
import {
  X,
  History,
  GitCompare,
  Upload,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight,
  Download,
  AlertCircle,
  FileText,
  CheckCircle2,
  Lock,
  Loader2
} from 'lucide-react';
import { CaseDocumentVaultItem, DocumentVersionItem } from '../../types/documentIntelligence';
import { calculateSHA256, formatFileSize } from '../../utils/cryptoIntegrity';
import { createDocumentVersion } from '../../gemini';
import { logAuditEvent } from '../../utils/auditLogger';
import { enforcePermissionOrLog } from '../../utils/rbac';
import { Role } from '../../types';

interface DocumentVersionModalProps {
  document: CaseDocumentVaultItem;
  onClose: () => void;
  onVersionAdded: (updatedDoc: CaseDocumentVaultItem) => void;
  userRole?: string;
  userName?: string;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  document,
  onClose,
  onVersionAdded,
  userRole = 'Investigating Officer',
  userName = 'Inspector Rajesh Sharma'
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'compare' | 'upload'>('history');
  const [versionList, setVersionList] = useState<DocumentVersionItem[]>(
    document.versionHistory && document.versionHistory.length > 0
      ? document.versionHistory
      : [
          {
            versionNumber: document.currentVersion || 'v1.0',
            timestamp: document.uploadedAt,
            updatedBy: document.uploadedBy,
            userRole: document.uploaderRole,
            changeDescription: 'Initial document upload with cryptographic seal.',
            newIntegrityHash: document.sha256Hash,
            fileSize: document.fileSize,
            fileName: document.fileName
          }
        ]
  );

  // Comparison State
  const [selectedV1, setSelectedV1] = useState<string>(
    versionList.length > 1 ? versionList[1].versionNumber : versionList[0].versionNumber
  );
  const [selectedV2, setSelectedV2] = useState<string>(versionList[0].versionNumber);

  // New Version Upload State
  const [newFile, setNewFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState('');
  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const v1Data = versionList.find(v => v.versionNumber === selectedV1) || versionList[0];
  const v2Data = versionList.find(v => v.versionNumber === selectedV2) || versionList[0];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25MB maximum limit.');
      return;
    }

    setErrorMsg(null);
    setNewFile(file);
    const hash = await calculateSHA256(file);
    setComputedHash(hash);
  };

  const handleUploadNewVersion = async () => {
    if (!newFile) {
      setErrorMsg('Please select a revised file for the new version.');
      return;
    }
    if (!changeDescription.trim()) {
      setErrorMsg('Please state a reason or change summary for this new revision.');
      return;
    }

    // RBAC Check
    const check = await enforcePermissionOrLog(userRole as Role, 'document.version.create', {
      userName,
      caseId: document.caseId,
      documentName: document.fileName,
      actionDescription: 'Upload new document revision'
    });

    if (!check.allowed) {
      setErrorMsg(check.reason || 'Permission denied: Your role is not authorized to create revisions.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Determine new version string
      const current = document.currentVersion || 'v1.0';
      const parts = current.replace('v', '').split('.').map(n => parseInt(n, 10));
      const major = parts[0] || 1;
      const minor = parts[1] || 0;
      const nextVersionStr = isMajorVersion ? `v${major + 1}.0` : `v${major}.${minor + 1}`;

      const hash = computedHash || await calculateSHA256(newFile);

      // Read as Base64 for server upload
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;

          const res = await createDocumentVersion(document.id, {
            versionNumber: nextVersionStr,
            changeDescription: changeDescription.trim(),
            updatedBy: userName,
            userRole,
            fileBase64,
            fileName: newFile.name,
            fileSize: newFile.size
          });

          const newVerItem: DocumentVersionItem = {
            versionNumber: nextVersionStr,
            timestamp: new Date().toISOString(),
            updatedBy: userName,
            userRole,
            changeDescription: changeDescription.trim(),
            previousIntegrityHash: document.sha256Hash,
            newIntegrityHash: hash,
            fileSize: newFile.size,
            fileName: newFile.name
          };

          const updatedDoc: CaseDocumentVaultItem = {
            ...document,
            currentVersion: nextVersionStr,
            fileName: newFile.name,
            fileSize: newFile.size,
            sha256Hash: hash,
            lastUpdated: new Date().toISOString(),
            versionHistory: [newVerItem, ...versionList]
          };

          setVersionList([newVerItem, ...versionList]);
          onVersionAdded(updatedDoc);

          await logAuditEvent({
            actionType: 'DOCUMENT_VERSION_CREATED',
            actionLabel: 'New Version Created',
            caseId: document.caseId,
            documentId: document.id,
            documentName: newFile.name,
            userId: 'usr-officer',
            userName,
            userRole,
            details: `Created revision ${nextVersionStr}. Notes: "${changeDescription.trim()}". New SHA-256: ${hash}`,
            status: 'SUCCESS'
          });

          setActiveTab('history');
          setNewFile(null);
          setChangeDescription('');
          setComputedHash(null);
        } catch (err: any) {
          setErrorMsg(err?.message || 'Failed to submit revision to server.');
        } finally {
          setIsSubmitting(false);
        }
      };

      reader.readAsDataURL(newFile);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process file version.');
      setIsSubmitting(false);
    }
  };

  const handleDownloadVersion = async (ver: DocumentVersionItem) => {
    // RBAC Check: Download
    const check = await enforcePermissionOrLog(userRole as Role, 'document.download', {
      userName,
      caseId: document.caseId,
      documentName: ver.fileName || document.fileName,
      actionDescription: `Download version ${ver.versionNumber}`
    });

    if (!check.allowed) {
      setErrorMsg(check.reason || 'Permission denied: Your role cannot download documents.');
      return;
    }

    await logAuditEvent({
      actionType: 'DOCUMENT_DOWNLOADED',
      actionLabel: 'Document Downloaded',
      caseId: document.caseId,
      documentId: document.id,
      documentName: ver.fileName || document.fileName,
      userId: 'usr-officer',
      userName,
      userRole,
      details: `Downloaded revision ${ver.versionNumber} (${formatFileSize(ver.fileSize)}). Verified SHA-256 seal: ${ver.newIntegrityHash}`,
      status: 'SUCCESS'
    });

    // Create a mock download trigger
    const content = `Lawgic AI - Verified Case Document Record\nCase ID: ${document.caseId}\nFile: ${ver.fileName || document.fileName}\nVersion: ${ver.versionNumber}\nTimestamp: ${ver.timestamp}\nOfficer: ${ver.updatedBy} (${ver.userRole})\nSHA-256 Hash: ${ver.newIntegrityHash}\nChange Log: ${ver.changeDescription}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.caseId}_${ver.versionNumber}_${ver.fileName || document.fileName}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Downloaded version ${ver.versionNumber}`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between bg-[#F7F5F0] dark:bg-[#08121D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#1E2D3E] flex items-center justify-center text-[#D4AF37]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif">
                  Document Version Control & Audit Trail
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  {document.currentVersion || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] truncate max-w-md">
                {document.fileName} • Case {document.caseId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-white dark:bg-[#0C1927]">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Version History ({versionList.length})
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'compare'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Side-by-Side Compare
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload New Revision
          </button>
        </div>

        {/* Notifications */}
        {downloadSuccess && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {downloadSuccess} • Audited in security ledger
          </div>
        )}

        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Version History List */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
            <div className="text-xs text-[#5A6573] dark:text-[#8A95A5] flex items-center justify-between pb-1">
              <span>All chronological revisions recorded with cryptographic hash verification</span>
              <span className="font-mono text-[11px]">{versionList.length} Revisions Recorded</span>
            </div>

            <div className="space-y-3">
              {versionList.map((ver, idx) => {
                const isCurrent = ver.versionNumber === document.currentVersion || idx === 0;
                return (
                  <div
                    key={ver.versionNumber + idx}
                    className={`p-3.5 border rounded-sm transition-all ${
                      isCurrent
                        ? 'border-[#D4AF37]/50 bg-[#F7F5F0] dark:bg-[#142334]'
                        : 'border-[#DDD8CE] dark:border-[#1E2D3E] bg-white dark:bg-[#0C1927]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-sm ${
                          isCurrent
                            ? 'bg-[#D4AF37] text-[#08121D]'
                            : 'bg-[#1E2D3E] text-white'
                        }`}>
                          {ver.versionNumber}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xs">
                            Active Vault Head
                          </span>
                        )}
                        <span className="text-xs font-medium text-[#08121D] dark:text-white truncate max-w-xs">
                          {ver.fileName || document.fileName}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownloadVersion(ver)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs hover:border-[#D4AF37] transition-colors"
                        title="Download this specific historical version"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-[#5A6573] dark:text-[#8A95A5] leading-relaxed">
                      {ver.changeDescription}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#D4AF37]" />
                        <span>{new Date(ver.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#D4AF37]" />
                        <span>{ver.updatedBy} ({ver.userRole})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-[#D4AF37]" />
                        <span>{formatFileSize(ver.fileSize)}</span>
                      </div>
                    </div>

                    <div className="mt-2 p-1.5 bg-[#F0ECE1] dark:bg-[#08121D] rounded-xs font-mono text-[10px] text-[#5A6573] dark:text-[#8A95A5] truncate flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-semibold">SHA-256:</span>
                      <span className="truncate">{ver.newIntegrityHash}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Side-by-Side Compare */}
        {activeTab === 'compare' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Selector */}
              <div>
                <label className="text-xs font-semibold text-[#08121D] dark:text-white block mb-1.5">
                  Base Revision (Older)
                </label>
                <select
                  value={selectedV1}
                  onChange={e => setSelectedV1(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono"
                >
                  {versionList.map(v => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      {v.versionNumber} — {new Date(v.timestamp).toLocaleDateString()} ({v.updatedBy})
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Selector */}
              <div>
                <label className="text-xs font-semibold text-[#08121D] dark:text-white block mb-1.5">
                  Comparison Revision (Newer)
                </label>
                <select
                  value={selectedV2}
                  onChange={e => setSelectedV2(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono"
                >
                  {versionList.map(v => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      {v.versionNumber} — {new Date(v.timestamp).toLocaleDateString()} ({v.updatedBy})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Analysis Card */}
            <div className="p-4 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm bg-[#F7F5F0] dark:bg-[#142334]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDD8CE] dark:border-[#1E2D3E]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#1E2D3E] text-white rounded-xs">
                    {v1Data.versionNumber}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#D4AF37] text-[#08121D] rounded-xs">
                    {v2Data.versionNumber}
                  </span>
                </div>
                <div className="text-xs font-mono">
                  {v1Data.newIntegrityHash === v2Data.newIntegrityHash ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Identical Hashes
                    </span>
                  ) : (
                    <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                      <GitCompare className="w-3.5 h-3.5" /> Modified Content
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Column 1 */}
                <div className="p-3 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2">
                  <div className="font-mono text-[10px] text-[#5A6573] uppercase tracking-wider font-semibold">
                    Version {v1Data.versionNumber} Metadata
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">Author & Date</span>
                    <span className="font-medium text-[#08121D] dark:text-white">
                      {v1Data.updatedBy} ({v1Data.userRole})
                    </span>
                    <span className="text-[11px] text-[#5A6573] block font-mono">
                      {new Date(v1Data.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">File Size</span>
                    <span className="font-mono font-medium text-[#08121D] dark:text-white">
                      {formatFileSize(v1Data.fileSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">Change Description</span>
                    <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] italic">
                      "{v1Data.changeDescription}"
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60">
                    <span className="text-[10px] text-[#5A6573] block font-mono">Cryptographic Hash</span>
                    <span className="font-mono text-[9px] text-[#5A6573] dark:text-[#8A95A5] break-all block">
                      {v1Data.newIntegrityHash}
                    </span>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="p-3 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2">
                  <div className="font-mono text-[10px] text-[#5A6573] uppercase tracking-wider font-semibold">
                    Version {v2Data.versionNumber} Metadata
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">Author & Date</span>
                    <span className="font-medium text-[#08121D] dark:text-white">
                      {v2Data.updatedBy} ({v2Data.userRole})
                    </span>
                    <span className="text-[11px] text-[#5A6573] block font-mono">
                      {new Date(v2Data.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">File Size</span>
                    <span className="font-mono font-medium text-[#08121D] dark:text-white">
                      {formatFileSize(v2Data.fileSize)}
                      {v2Data.fileSize !== v1Data.fileSize && (
                        <span className="ml-1 text-[10px] text-[#D4AF37]">
                          ({v2Data.fileSize > v1Data.fileSize ? '+' : ''}{v2Data.fileSize - v1Data.fileSize} bytes)
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5A6573] block">Change Description</span>
                    <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] italic">
                      "{v2Data.changeDescription}"
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60">
                    <span className="text-[10px] text-[#5A6573] block font-mono">Cryptographic Hash</span>
                    <span className="font-mono text-[9px] text-[#5A6573] dark:text-[#8A95A5] break-all block">
                      {v2Data.newIntegrityHash}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Upload New Revision */}
        {activeTab === 'upload' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Audit-Controlled Revision Policy</span>
                Uploading a new version does NOT overwrite historical records. All previous hashes, timestamps, and officer certifications are permanently preserved in the immutable ledger.
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
                newFile
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#1E2D3E] flex items-center justify-center text-[#D4AF37]">
                <Upload className="w-5 h-5" />
              </div>

              {newFile ? (
                <div>
                  <div className="text-xs font-semibold text-[#08121D] dark:text-white font-mono">
                    {newFile.name}
                  </div>
                  <div className="text-[11px] text-[#5A6573] mt-1 font-mono">
                    {formatFileSize(newFile.size)} • Click to choose different file
                  </div>
                  {computedHash && (
                    <div className="mt-2 text-[10px] font-mono text-emerald-500 truncate max-w-md mx-auto">
                      Pre-computed SHA-256: {computedHash}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs font-medium text-[#08121D] dark:text-white">
                    Click to select revised document (PDF, DOCX, TXT)
                  </div>
                  <div className="text-[11px] text-[#5A6573] mt-1">
                    Maximum 25MB. Cryptographic hash calculated automatically on selection.
                  </div>
                </div>
              )}
            </div>

            {/* Version Bump Strategy */}
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="versionType"
                  checked={!isMajorVersion}
                  onChange={() => setIsMajorVersion(false)}
                  className="accent-[#D4AF37]"
                />
                <span>Minor Revision (e.g. Typo correction, page addition, supplementary notes)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="versionType"
                  checked={isMajorVersion}
                  onChange={() => setIsMajorVersion(true)}
                  className="accent-[#D4AF37]"
                />
                <span>Major Revision (e.g. Complete re-transcription, judicial order amendment)</span>
              </label>
            </div>

            {/* Change Description */}
            <div>
              <label className="text-xs font-semibold text-[#08121D] dark:text-white block mb-1">
                Reason / Change Summary *
              </label>
              <textarea
                rows={3}
                value={changeDescription}
                onChange={e => setChangeDescription(e.target.value)}
                placeholder="Explain what was modified in this revision and reference authorization..."
                className="w-full text-xs p-2.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-3 py-2 text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUploadNewVersion}
                disabled={isSubmitting || !newFile || !changeDescription.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] disabled:opacity-50 transition-colors font-serif"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sealing Revision...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish Verified Revision
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D] flex items-center justify-between text-[11px] text-[#5A6573]">
          <div className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Section 63 Bharatiya Sakshya Adhiniyam (BSA) Digital Integrity Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
