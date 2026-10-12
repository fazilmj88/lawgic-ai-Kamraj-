import React from 'react';
import { 
  FileSearch, 
  ShieldAlert, 
  Save, 
  Share2, 
  Download, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { CaseDocumentIntelligenceResult } from '../../types/documentIntelligence';

interface DocIntelligenceHeaderProps {
  result: CaseDocumentIntelligenceResult | null;
  stage: 'upload' | 'processing' | 'report';
  onReset: () => void;
  onBack?: () => void;
  onSaveToDocket?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  onCreateFIR?: () => void;
}

export const DocIntelligenceHeader: React.FC<DocIntelligenceHeaderProps> = ({
  result,
  stage,
  onReset,
  onBack,
  onSaveToDocket,
  isSaving = false,
  saveSuccess = false,
  onCreateFIR
}) => {
  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.replace(/\.[^/.]+$/, "")}_intelligence_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Navigation & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-5">
        <div className="flex items-start gap-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-sm bg-white dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              title={stage === 'report' ? 'Return to Document Analysis upload' : 'Return to previous view'}
            >
              <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
              <span className="text-xs font-mono font-medium">
                {stage === 'report' ? 'Back to Analysis' : 'Back'}
              </span>
            </button>
          )}
          <div className="w-11 h-11 rounded-sm bg-[#101C29] border border-[#C6A15B]/50 flex items-center justify-center text-[#D5B875] shrink-0 shadow-md">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-serif-legal text-2xl sm:text-3xl font-bold tracking-tight text-[#08121D] dark:text-white">
                Case Document Intelligence
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/40 font-bold uppercase tracking-wider">
                BNS & BNSS READY
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5A6573] dark:text-[#8C96A3] mt-1">
              AI-assisted extraction of facts, evidence references, clues and investigative leads from case documents.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {stage === 'report' && (
            <>
              <button
                onClick={onReset}
                className="px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29]"
                title="Upload another document"
              >
                <Plus className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>New Analysis</span>
              </button>

              {onSaveToDocket && (
                <button
                  onClick={onSaveToDocket}
                  disabled={isSaving || saveSuccess}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    saveSuccess
                      ? 'bg-[#10B981] text-white'
                      : 'btn-legal-gold'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to Case Docket</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save to Case Docket'}</span>
                    </>
                  )}
                </button>
              )}

              {onCreateFIR && (
                <button
                  onClick={onCreateFIR}
                  className="px-3.5 py-2 text-xs font-semibold rounded-sm border border-[#C6A15B] bg-[#101C29] text-[#D5B875] hover:bg-[#C6A15B]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Draft FIR using extracted facts"
                >
                  <Scale className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span className="hidden sm:inline">Draft FIR from Doc</span>
                </button>
              )}

              <button
                onClick={downloadJSON}
                className="p-2 text-xs font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors cursor-pointer bg-white dark:bg-[#101C29]"
                title="Export structured JSON intelligence payload"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prominent Statutory & Procedural Safeguard Disclaimer */}
      <div className="bg-[#FFFBEB] dark:bg-[#151D28] border-l-3 border-[#C6A15B] p-3 sm:p-3.5 rounded-sm text-xs flex items-start gap-2.5 shadow-sm">
        <ShieldAlert className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-[#92400E] dark:text-[#E6C687] tracking-wide uppercase text-[10px] font-mono block">
            STATUTORY AI-ASSISTED INTELLIGENCE DISCLAIMER
          </span>
          <p className="text-[#78350F] dark:text-[#C5D0DC] leading-relaxed text-[11px] sm:text-xs">
            Findings are generated to assist document review and investigation. Extracted information, potential leads and legal recommendations must be independently verified by an authorized officer. AI output does not establish evidentiary authenticity, guilt, or legal liability.
          </p>
        </div>
      </div>
    </div>
  );
};
