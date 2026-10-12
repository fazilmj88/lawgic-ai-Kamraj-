import React, { useState, useRef, useEffect } from 'react';
import { OfficialFIRData, CaseDocumentVaultItem } from '../../types/documentIntelligence';
import { OfficialTamilNaduFIRDocument } from './OfficialTamilNaduFIRDocument';
import {
  generateOfficialFIRPdf,
  saveFIRToDocumentVault,
  validateFIRData,
  GeneratedFIRPdfResult
} from '../../services/officialFIRPdfService';
import { logAuditEvent } from '../../utils/auditLogger';
import {
  X,
  Printer,
  Download,
  CheckCircle,
  FileCheck,
  Shield,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  FileText,
  Eye,
  Check
} from 'lucide-react';

interface OfficialFIRPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToEdit: () => void;
  firData: OfficialFIRData;
  currentUser: { name: string; role: string; id?: string };
  vaultDocuments: CaseDocumentVaultItem[];
  onUpdateVaultDocuments?: (docs: CaseDocumentVaultItem[]) => void;
  onFIRSaved?: (savedDoc: CaseDocumentVaultItem) => void;
  precompiledPdf?: GeneratedFIRPdfResult | null;
}

export const OfficialFIRPreviewModal: React.FC<OfficialFIRPreviewModalProps> = ({
  isOpen,
  onClose,
  onBackToEdit,
  firData,
  currentUser,
  vaultDocuments,
  onUpdateVaultDocuments,
  onFIRSaved,
  precompiledPdf
}) => {
  const [viewMode, setViewMode] = useState<'pdf' | 'layout'>('pdf');
  const [activePage, setActivePage] = useState<'all' | '1' | '2' | '3'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [pdfResult, setPdfResult] = useState<GeneratedFIRPdfResult | null>(precompiledPdf || null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [savedDocument, setSavedDocument] = useState<CaseDocumentVaultItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const page1Ref = useRef<HTMLDivElement | null>(null);
  const page2Ref = useRef<HTMLDivElement | null>(null);
  const page3Ref = useRef<HTMLDivElement | null>(null);

  // Sync precompiled PDF if provided
  useEffect(() => {
    if (precompiledPdf) {
      setPdfResult(precompiledPdf);
    }
  }, [precompiledPdf]);

  // Validate fields, log audit event, and ensure PDF is compiled when modal opens
  useEffect(() => {
    if (isOpen) {
      const validation = validateFIRData(firData);
      if (!validation.valid) {
        setValidationError(validation.message || 'Required information is missing. Please review before FIR generation.');
      } else {
        setValidationError(null);
      }

      // Log FIR_PREVIEWED event
      logAuditEvent({
        actionType: 'FIR_PREVIEWED',
        actionLabel: 'Official FIR Previewed',
        caseId: firData.caseId,
        userId: currentUser.id || 'usr-officer',
        userName: currentUser.name,
        userRole: currentUser.role,
        details: `Previewing official Tamil Nadu Police Integrated FIR (Sec 173 BNSS) for FIR No: ${firData.firNumber || firData.caseId}`,
        status: 'SUCCESS'
      });

      // Automatically compile PDF if not yet present
      if (!pdfResult && !precompiledPdf) {
        compilePdf().catch(err => {
          console.warn('Initial PDF compilation in modal:', err);
        });
      }
    }
  }, [isOpen, firData, currentUser]);

  if (!isOpen) return null;

  // Helper to ensure PDF is compiled
  const compilePdf = async (): Promise<GeneratedFIRPdfResult> => {
    if (pdfResult) return pdfResult;

    console.log('[FIR Modal] compilePdf started');
    const validation = validateFIRData(firData);
    if (!validation.valid) {
      console.warn('[FIR Modal] Validation failed:', validation.message);
      throw new Error(validation.message);
    }

    setIsGeneratingPdf(true);
    try {
      const result = await generateOfficialFIRPdf(undefined, firData);
      console.log('[FIR Modal] PDF compiled successfully:', result.fileName);
      setPdfResult(result);
      return result;
    } catch (err: any) {
      console.error('[FIR Modal] compilePdf failed:', err);
      throw err;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    try {
      console.log('[FIR Modal] Download requested');
      const compiled = await compilePdf();

      const link = document.createElement('a');
      link.href = compiled.blobUrl;
      link.download = compiled.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log FIR_DOWNLOADED
      await logAuditEvent({
        actionType: 'FIR_DOWNLOADED',
        actionLabel: 'Official FIR Downloaded',
        caseId: firData.caseId,
        documentName: compiled.fileName,
        userId: currentUser.id || 'usr-officer',
        userName: currentUser.name,
        userRole: currentUser.role,
        details: `Downloaded official FIR PDF (${compiled.fileName}) with SHA-256: ${compiled.sha256Hash}`,
        status: 'SUCCESS'
      });
    } catch (err: any) {
      console.error('[FIR Modal] Download PDF error:', err);
      const userMessage = err?.message && err.message.startsWith('FIR generation failed:')
        ? err.message
        : `FIR generation failed: ${err?.message || 'Error compiling official FIR PDF.'}`;
      setValidationError(userMessage);
    }
  };

  // Handle Print Form
  const handlePrint = async () => {
    try {
      await logAuditEvent({
        actionType: 'FIR_PRINTED',
        actionLabel: 'Official FIR Printed',
        caseId: firData.caseId,
        documentName: pdfResult?.fileName || `FIR_${firData.caseId}.pdf`,
        userId: currentUser.id || 'usr-officer',
        userName: currentUser.name,
        userRole: currentUser.role,
        details: `Printed official 3-page FIR document under Sec 173 BNSS`,
        status: 'SUCCESS'
      });
      window.print();
    } catch (err) {
      window.print();
    }
  };

  // Handle Save & Seal Final FIR in Document Vault
  const handleSaveToCase = async () => {
    const validation = validateFIRData(firData);
    if (!validation.valid) {
      setValidationError(validation.message || 'Required information is missing. Please review before FIR generation.');
      return;
    }

    setIsSavingToVault(true);
    try {
      const compiled = await compilePdf();

      const { updatedDocs, createdOrUpdatedDoc, storageWarning } = await saveFIRToDocumentVault(
        firData,
        compiled,
        currentUser,
        vaultDocuments
      );

      if (onUpdateVaultDocuments) {
        onUpdateVaultDocuments(updatedDocs);
      }

      setSavedDocument(createdOrUpdatedDoc);
      if (storageWarning) {
        setSavedSuccessMessage(
          `FIR generated successfully, but could not be saved to case storage: ${storageWarning}`
        );
      } else {
        setSavedSuccessMessage(
          `Official FIR successfully sealed and stored under Case ${firData.caseId}/FIR/${compiled.fileName} (${createdOrUpdatedDoc.currentVersion}).`
        );
      }

      if (onFIRSaved) {
        onFIRSaved(createdOrUpdatedDoc);
      }
      setShowConfirmModal(false);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save official FIR to vault.');
    } finally {
      setIsSavingToVault(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {/* Top Action & Navigation Bar (Screen only, hidden when printing) */}
      <div className="print:hidden bg-[#101823] text-white border-b border-[#1D2633] px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Back to Edit & Heading */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#8E98A5] hover:text-white bg-[#151F2D] hover:bg-[#1D2633] border border-[#1D2633] rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B8955A]" />
              <h1 className="text-sm font-bold tracking-wide text-white">
                # FIR Preview
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B8955A]/20 text-[#D8B57A] border border-[#B8955A]/40">
                Tamil Nadu Police Form-I • Section 173 BNSS
              </span>
            </div>
            <div className="text-[11px] text-[#8E98A5] font-mono mt-0.5">
              Case ID: <span className="text-white font-semibold">{firData.caseId}</span> • FIR No: <span className="text-white font-semibold">{firData.firNumber || 'Unassigned'}</span> • PS: {firData.policeStation} ({firData.district})
            </div>
          </div>
        </div>

        {/* Center: View Switcher (Generated PDF vs Page Layout) */}
        <div className="flex items-center gap-2 bg-[#151F2D] p-1 rounded-lg border border-[#1D2633]">
          <button
            type="button"
            onClick={() => setViewMode('pdf')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'pdf'
                ? 'bg-[#B8955A] text-black font-bold shadow-sm'
                : 'text-[#8E98A5] hover:text-white'
            }`}
            title="Display the actual generated PDF file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Actual Generated PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('layout')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'layout'
                ? 'bg-[#B8955A] text-black font-bold shadow-sm'
                : 'text-[#8E98A5] hover:text-white'
            }`}
            title="Review high-resolution 3-page document layout"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Document Page Layout</span>
          </button>

          {viewMode === 'layout' && (
            <>
              <div className="h-4 w-px bg-[#1D2633] mx-1" />
              <button
                type="button"
                onClick={() => setActivePage('all')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  activePage === 'all' ? 'bg-[#1D2633] text-white font-semibold' : 'text-[#8E98A5] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActivePage('1')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  activePage === '1' ? 'bg-[#1D2633] text-white font-semibold' : 'text-[#8E98A5] hover:text-white'
                }`}
              >
                P.1
              </button>
              <button
                type="button"
                onClick={() => setActivePage('2')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  activePage === '2' ? 'bg-[#1D2633] text-white font-semibold' : 'text-[#8E98A5] hover:text-white'
                }`}
              >
                P.2
              </button>
              <button
                type="button"
                onClick={() => setActivePage('3')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  activePage === '3' ? 'bg-[#1D2633] text-white font-semibold' : 'text-[#8E98A5] hover:text-white'
                }`}
              >
                P.3
              </button>

              <div className="h-4 w-px bg-[#1D2633] mx-1" />
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
                className="p-1 text-[#8E98A5] hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-[#8E98A5] w-8 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                className="p-1 text-[#8E98A5] hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Right: Actions [ Back to Edit ] [ Download PDF ] [ Print ] [ Save to Case ] */}
        <div className="flex items-center gap-2.5">
          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#151F2D] hover:bg-[#1D2633] border border-[#1D2633] rounded-lg transition-colors cursor-pointer"
            title="Print Official 3-Page Document"
          >
            <Printer className="w-3.5 h-3.5 text-[#B8955A]" />
            <span>Print</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#151F2D] hover:bg-[#1D2633] border border-[#1D2633] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Download real .pdf file"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B8955A]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#B8955A]" />
            )}
            <span>Download PDF</span>
          </button>

          {/* Save to Case / Confirm & Save FIR */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSavingToVault || isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-[#B8955A] hover:bg-[#A3824A] rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
            title="Store under Case ID in Document Vault"
          >
            {isSavingToVault ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>{savedDocument ? 'Save to Case (New Version)' : 'Save to Case'}</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8E98A5] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Validation or Success Banners (Screen only) */}
      {validationError && (
        <div className="print:hidden bg-red-950/90 border-b border-red-800 text-red-200 px-6 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {savedSuccessMessage && (
        <div className="print:hidden bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 px-6 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold">{savedSuccessMessage}</span>
              {savedDocument?.sha256Hash && (
                <span className="block font-mono text-[10px] text-emerald-300 mt-0.5">
                  Storage Reference: Case {firData.caseId}/FIR/{savedDocument.fileName} • Hash: {savedDocument.sha256Hash}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[#22272E]">
        {/* VIEW 1: Display ACTUAL generated PDF (Primary requirement) */}
        {viewMode === 'pdf' && (
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 md:p-6">
            {isGeneratingPdf && !pdfResult ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-white space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#B8955A]" />
                <div className="text-sm font-semibold">Generating Official FIR PDF...</div>
                <div className="text-xs text-[#8E98A5] max-w-sm">
                  Rendering 3-page Tamil Nadu Police Integrated Investigation Form-I at print-grade DPI.
                </div>
              </div>
            ) : pdfResult ? (
              <div className="w-full h-full max-w-5xl flex flex-col bg-[#161B22] rounded-xl overflow-hidden shadow-2xl border border-[#30363D]">
                {/* PDF Toolbar Subheader */}
                <div className="bg-[#1C2128] border-b border-[#30363D] px-4 py-2 flex items-center justify-between text-xs text-[#8E98A5]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white font-medium">{pdfResult.fileName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Real PDF ({pdfResult.pageCount} Pages • A4)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span>SHA-256: {pdfResult.sha256Hash.substring(0, 16)}...</span>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="text-[#B8955A] hover:underline font-sans cursor-pointer font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .pdf</span>
                    </button>
                  </div>
                </div>

                {/* Actual Embedded PDF Iframe */}
                <div className="flex-1 w-full h-full min-h-[600px] bg-[#323639]">
                  <iframe
                    src={`${pdfResult.blobUrl}#toolbar=0&navpanes=1&scrollbar=1`}
                    className="w-full h-full min-h-[600px] border-0"
                    title="Actual Generated Official Tamil Nadu FIR PDF"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-white space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold">PDF compilation pending</div>
                <button
                  type="button"
                  onClick={() => compilePdf()}
                  className="btn-legal-gold px-4 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Generate PDF Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Document Page Layout with Zoom Controls */}
        {viewMode === 'layout' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center bg-[#2B303A] print:p-0 print:bg-white print:overflow-visible">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease'
              }}
              className="print:transform-none"
            >
              <div className="official-fir-preview-container space-y-8 print:space-y-0">
                {/* Page 1 */}
                <div className={activePage === 'all' || activePage === '1' ? 'block' : 'hidden print:block'}>
                  <div ref={page1Ref}>
                    <OfficialTamilNaduFIRDocument
                      data={firData}
                      page={1}
                      pageRefs={{ page1Ref }}
                    />
                  </div>
                </div>

                {/* Page 2 */}
                <div className={activePage === 'all' || activePage === '2' ? 'block' : 'hidden print:block'}>
                  <div ref={page2Ref}>
                    <OfficialTamilNaduFIRDocument
                      data={firData}
                      page={2}
                      pageRefs={{ page2Ref }}
                    />
                  </div>
                </div>

                {/* Page 3 */}
                <div className={activePage === 'all' || activePage === '3' ? 'block' : 'hidden print:block'}>
                  <div ref={page3Ref}>
                    <OfficialTamilNaduFIRDocument
                      data={firData}
                      page={3}
                      pageRefs={{ page3Ref }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for "Confirm & Save FIR" */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#151F2D] text-white border border-[#2B384A] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B8955A]/20 border border-[#B8955A]/40 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#B8955A]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm & Save FIR</h3>
                <p className="text-xs text-[#8E98A5]">Official Police Statutory Record • Section 173 BNSS</p>
              </div>
            </div>

            <div className="bg-[#101823] p-4 rounded-lg border border-[#1D2633] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8E98A5]">Case ID:</span>
                <span className="font-mono font-bold text-white">{firData.caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E98A5]">FIR Number:</span>
                <span className="font-mono font-bold text-[#D8B57A]">{firData.firNumber || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E98A5]">Police Station:</span>
                <span className="text-white">{firData.policeStation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E98A5]">Storage Destination:</span>
                <span className="font-mono text-[11px] text-emerald-400">Case {firData.caseId}/FIR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E98A5]">Officer:</span>
                <span className="text-white">{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>

            <p className="text-xs text-[#8E98A5]">
              Saving will register the official 3-page FIR into the Case Document Vault, generate a SHA-256 cryptographic seal, and record an immutable audit entry.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8E98A5] hover:text-white bg-[#101823] border border-[#1D2633] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToCase}
                disabled={isSavingToVault}
                className="btn-legal-gold px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                {isSavingToVault ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm & Save FIR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen-only Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .official-fir-preview-container, .official-fir-preview-container * {
            visibility: visible;
          }
          .official-fir-preview-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .official-fir-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
};
