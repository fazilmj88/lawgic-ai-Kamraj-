import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Tag,
  User,
  Calendar,
  Layers,
  MapPin,
  Check
} from 'lucide-react';
import { CaseDocumentVaultItem, DocumentClassificationType, DuplicateCheckResult, ExtractedMetadata } from '../../types/documentIntelligence';
import { apiUrl } from '../../lib/apiConfig';
import { calculateSHA256 } from '../../utils/cryptoIntegrity';
import { uploadDocumentToVault } from '../../gemini';
import { logAuditEvent } from '../../utils/auditLogger';
import { enforcePermissionOrLog } from '../../utils/rbac';
import { Role } from '../../types';

interface UploadDocumentModalProps {
  onClose: () => void;
  onUploaded: (newDoc: CaseDocumentVaultItem, analyzeImmediately?: boolean) => void;
  userRole?: string;
  userName?: string;
  defaultCaseId?: string;
  defaultCategory?: DocumentClassificationType;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  onClose,
  onUploaded,
  userRole = 'Investigating Officer',
  userName = 'Inspector Rajesh Sharma',
  defaultCaseId = 'LAW-2026-00125',
  defaultCategory = 'FIR'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [documentType, setDocumentType] = useState<DocumentClassificationType>(defaultCategory);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzingIngestion, setIsAnalyzingIngestion] = useState(false);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // AI Ingestion State
  const [ingestionResult, setIngestionResult] = useState<{
    classification?: string;
    confidence?: number;
    reasoning?: string;
    suggestedCaseId?: string;
    caseMatchConfidence?: number;
    matchingReason?: string;
    metadata?: ExtractedMetadata;
    duplicateCheckResult?: DuplicateCheckResult;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds 20MB limit.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIngestionResult(null);

    // Compute cryptographic SHA-256 hash immediately
    const hash = await calculateSHA256(file);
    setComputedHash(hash);

    // Read as Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setFileBase64(base64Data);

      // Trigger AI Document Understanding & Ingestion Pipeline
      setIsAnalyzingIngestion(true);
      try {
        const response = await fetch(apiUrl('/api/ai/analyze-document'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            fileBase64: base64Data,
            targetCaseId: caseId,
            userRole,
            userName
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIngestionResult({
              classification: data.classification,
              confidence: data.confidence,
              reasoning: data.reasoning,
              suggestedCaseId: data.suggestedCaseId,
              caseMatchConfidence: data.caseMatchConfidence,
              matchingReason: data.matchingReason,
              metadata: data.metadata,
              duplicateCheckResult: data.duplicateCheckResult
            });

            // Automatically set document type if high confidence
            if (data.classification && data.confidence && data.confidence >= 70) {
              setDocumentType(data.classification as DocumentClassificationType);
            }

            // If suggested case is found and officer hasn't customized caseId
            if (data.suggestedCaseId && (!caseId || caseId === 'CASE-GENERAL')) {
              setCaseId(data.suggestedCaseId);
            }
          }
        }
      } catch (err) {
        console.warn('AI Ingestion notice:', err);
      } finally {
        setIsAnalyzingIngestion(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleSubmit = async (analyzeNow: boolean = false) => {
    if (!selectedFile) {
      setErrorMessage('Please select a case document to register.');
      return;
    }

    // RBAC Security Check: Must have document.upload permission
    const check = await enforcePermissionOrLog(userRole as Role, 'document.upload', {
      userName,
      caseId: caseId.trim() || 'CASE-GENERAL',
      documentName: selectedFile.name,
      actionDescription: 'Upload document to digital case folder'
    });

    if (!check.allowed) {
      setErrorMessage(check.reason || 'Permission denied: Your role cannot upload documents.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const hash = computedHash || await calculateSHA256(selectedFile);
      const timestamp = new Date().toISOString();

      // Call API endpoint
      const docRecord = await uploadDocumentToVault({
        caseId: caseId.trim() || 'CASE-GENERAL',
        fileName: selectedFile.name,
        documentType,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type || 'application/pdf',
        fileBase64,
        uploadedBy: userName,
        uploaderRole: userRole
      });

      const vaultDoc: CaseDocumentVaultItem = {
        id: docRecord.id,
        caseId: docRecord.caseId,
        fileName: docRecord.fileName,
        documentType: docRecord.documentType,
        fileSize: docRecord.fileSize,
        mimeType: docRecord.mimeType,
        uploadedBy: docRecord.uploadedBy,
        uploaderRole: docRecord.uploaderRole,
        uploadedAt: docRecord.uploadedAt,
        lastUpdated: docRecord.lastUpdated,
        currentVersion: docRecord.currentVersion,
        sha256Hash: docRecord.sha256Hash || hash,
        integrityStatus: 'Verified',
        analysisStatus: 'Pending Analysis',
        notes: notes.trim() || (ingestionResult?.reasoning ? `[AI Intake]: ${ingestionResult.reasoning}` : undefined),
        versionHistory: docRecord.versionHistory || [
          {
            versionNumber: 'v1.0',
            timestamp,
            updatedBy: userName,
            userRole,
            changeDescription: 'Initial vault registration with cryptographic verification.',
            newIntegrityHash: hash,
            fileSize: selectedFile.size,
            fileName: selectedFile.name
          }
        ]
      };

      await logAuditEvent({
        actionType: 'DOCUMENT_UPLOADED',
        actionLabel: 'Document Uploaded',
        caseId: vaultDoc.caseId,
        documentId: vaultDoc.id,
        documentName: vaultDoc.fileName,
        userId: 'usr-officer',
        userName,
        userRole,
        details: `Secure registration in case vault. Cryptographic SHA-256: ${vaultDoc.sha256Hash}. Classification: ${vaultDoc.documentType}`,
        status: 'SUCCESS'
      });

      onUploaded(vaultDoc, analyzeNow);
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload document. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between bg-[#F7F5F0] dark:bg-[#08121D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C6A15B]/10 rounded-sm text-[#C6A15B] border border-[#C6A15B]/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#08121D] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>AI Document Ingestion</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30 font-mono lowercase">
                  ocr + auto-classify + duplicate-check
                </span>
              </h3>
              <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
                Upload case record for instant OCR, classification, metadata extraction, and cryptographic integrity check.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white rounded-sm hover:bg-[#DDD8CE]/50 dark:hover:bg-[#1E2D3E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* File Drop Area */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm p-5 text-center cursor-pointer transition-colors bg-[#F7F5F0]/50 dark:bg-[#08121D]/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-[#C6A15B] mx-auto" />
                <div className="text-xs font-bold text-[#08121D] dark:text-white truncate">
                  {selectedFile.name}
                </div>
                <div className="text-[10px] font-mono text-[#5A6573]">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                </div>
                {computedHash && (
                  <div className="mt-1 p-2 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[10px] font-mono text-[#5A6573] text-left break-all flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[#C6A15B] font-bold block">Cryptographic SHA-256 Digest:</span>
                      {computedHash}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                      Calculated
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-[#5A6573] mx-auto" />
                <div className="text-xs font-medium text-[#08121D] dark:text-white">
                  Drag and drop case record or <span className="text-[#C6A15B] underline">browse</span>
                </div>
                <div className="text-[10px] font-mono text-[#5A6573]">
                  FIR, Witness / Victim Statements, Forensic Reports, Panchnama (PDF, Images, TXT up to 20MB)
                </div>
              </div>
            )}
          </div>

          {/* AI Ingestion Processing Indicator */}
          {isAnalyzingIngestion && (
            <div className="p-3 bg-[#C6A15B]/10 border border-[#C6A15B]/30 rounded-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#C6A15B] animate-spin shrink-0" />
              <div className="text-xs text-[#08121D] dark:text-white">
                <span className="font-semibold text-[#C6A15B]">AI Ingestion in progress:</span> Extracting OCR text, classifying document type, scanning duplicate hashes, and matching case record...
              </div>
            </div>
          )}

          {/* Duplicate Detection Alert Banner */}
          {ingestionResult?.duplicateCheckResult && ingestionResult.duplicateCheckResult.isDuplicate && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-sm text-xs text-red-600 dark:text-red-400 space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>Exact Duplicate Detected</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                A document with this identical SHA-256 hash has already been registered in the vault:
                <span className="font-semibold block text-red-700 dark:text-red-300">
                  {ingestionResult.duplicateCheckResult.existingDocumentName} (Case: {ingestionResult.duplicateCheckResult.existingCaseId})
                </span>
                Uploaded on: {ingestionResult.duplicateCheckResult.existingUploadDate || 'Earlier session'}. Re-uploading will create a version entry or redundant record.
              </p>
            </div>
          )}

          {/* Potential Content Match Alert */}
          {ingestionResult?.duplicateCheckResult && ingestionResult.duplicateCheckResult.similarityScore && ingestionResult.duplicateCheckResult.similarityScore > 85 && !ingestionResult.duplicateCheckResult.isDuplicate && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-sm text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Potential Document Revision Detected ({ingestionResult.duplicateCheckResult.similarityScore}% Match)</span>
              </div>
              <p className="text-[11px]">
                Content closely matches existing file <span className="font-semibold">{ingestionResult.duplicateCheckResult.existingDocumentName}</span>. Consider saving as a new version instead.
              </p>
            </div>
          )}

          {/* AI Understanding & Extraction Findings Card */}
          {ingestionResult && (
            <div className="p-3.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A15B] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Understanding Findings
                </span>
                {ingestionResult.confidence && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                    {ingestionResult.confidence}% Confidence
                  </span>
                )}
              </div>

              {/* Classification & Reasoning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#5A6573] block mb-0.5">Detected Classification:</span>
                  <span className="font-semibold text-[#08121D] dark:text-white bg-white dark:bg-[#0C1927] px-2.5 py-1 rounded border border-[#DDD8CE] dark:border-[#1E2D3E] inline-block">
                    {ingestionResult.classification || documentType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A6573] block mb-0.5">Case Matching:</span>
                  {ingestionResult.suggestedCaseId ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#C6A15B]">
                        {ingestionResult.suggestedCaseId}
                      </span>
                      {caseId !== ingestionResult.suggestedCaseId && (
                        <button
                          type="button"
                          onClick={() => setCaseId(ingestionResult.suggestedCaseId || '')}
                          className="text-[10px] px-2 py-0.5 bg-[#C6A15B]/20 text-[#C6A15B] rounded hover:bg-[#C6A15B]/30 font-mono cursor-pointer"
                        >
                          Use This Case
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#5A6573] italic">No prior case matched. New case recommended.</span>
                  )}
                </div>
              </div>

              {ingestionResult.reasoning && (
                <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] italic bg-white dark:bg-[#0C1927] p-2 rounded border border-[#DDD8CE] dark:border-[#1E2D3E]">
                  "{ingestionResult.reasoning}"
                </p>
              )}

              {/* Extracted Structured Metadata Badges */}
              {ingestionResult.metadata && (
                <div className="space-y-2 pt-1 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                  <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block">
                    Extracted Structured Metadata:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {ingestionResult.metadata.persons?.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        <User className="w-3 h-3" />
                        {p.name} ({p.role})
                      </span>
                    ))}
                    {ingestionResult.metadata.dates?.map((d, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Calendar className="w-3 h-3" />
                        {d.date}
                      </span>
                    ))}
                    {ingestionResult.metadata.sections?.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        <Tag className="w-3 h-3" />
                        {s}
                      </span>
                    ))}
                    {ingestionResult.metadata.evidenceItems?.map((e, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <Layers className="w-3 h-3" />
                        {e}
                      </span>
                    ))}
                    {ingestionResult.metadata.locations?.map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                        <MapPin className="w-3 h-3" />
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Officer Verification & Edit Section */}
          <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] space-y-3">
            <span className="text-[10px] font-mono text-[#C6A15B] uppercase tracking-wider font-bold block">
              Officer Verification &amp; Final Overrides
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                  Case Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  placeholder="e.g. LAW-2026-00125"
                  className="w-full text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                  Verified Classification *
                </label>
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
                >
                  <option value="FIR">📁 FIR</option>
                  <option value="Victim Statements">📁 Victim Statements</option>
                  <option value="Witness Statements">📁 Witness Statements</option>
                  <option value="Evidence Records">📁 Evidence Records</option>
                  <option value="Forensic Reports">📁 Forensic Reports</option>
                  <option value="Court Orders">📁 Court Orders</option>
                  <option value="Investigation Notes">📁 Investigation Notes</option>
                  <option value="Complaint">📁 Complaint / Petition</option>
                  <option value="Other Case Record">📁 Other Case Record</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                Officer Intake Remarks (Recorded in Cryptographic Audit Log)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Received from Station front desk; Verified complainant signature and integrity stamp."
                className="w-full text-xs p-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5A6573]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Automatic SHA-256 Hash on Custody Intake</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono text-[#5A6573] hover:text-[#08121D] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isUploading || !selectedFile}
              onClick={() => handleSubmit(false)}
              className="px-3 py-1.5 bg-[#DDD8CE] dark:bg-[#1E2D3E] text-[#08121D] dark:text-white font-mono text-xs font-medium rounded-sm hover:opacity-80 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {isUploading ? 'Registering...' : 'Save to Vault'}
            </button>

            <button
              type="button"
              disabled={isUploading || !selectedFile}
              onClick={() => handleSubmit(true)}
              className="px-4 py-1.5 bg-[#C6A15B] text-[#08121D] font-mono text-xs font-bold rounded-sm hover:bg-[#b08d4b] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify &amp; Store</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

