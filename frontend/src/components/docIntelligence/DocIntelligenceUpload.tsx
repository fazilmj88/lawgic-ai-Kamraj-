import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileCheck, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  FolderOpen,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { SAMPLE_CASE_DOCUMENTS, SampleCaseDocument } from '../../data/sampleCaseDocuments';
import { FIRCase } from '../../types';

interface DocIntelligenceUploadProps {
  onAnalyze: (payload: {
    fileBase64?: string;
    mimeType: string;
    fileName: string;
    fileSize: number;
    fileText?: string;
    caseId?: string;
    officerNotes?: string;
  }) => void;
  cases: FIRCase[];
  isAnalyzing: boolean;
}

export const DocIntelligenceUpload: React.FC<DocIntelligenceUploadProps> = ({
  onAnalyze,
  cases,
  isAnalyzing
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileText, setFileText] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('NEW-DOCKET');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<SampleCaseDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.docx'];

  const validateAndProcessFile = (file: File) => {
    setFileError(null);
    setSelectedSample(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError(`Unsupported file type (${ext}). Please upload PDF, Scanned PDF, JPG, PNG, WEBP, TXT, or DOCX.`);
      setSelectedFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError(`File exceeds maximum permitted size of 25MB (Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Read as Base64 or Text
    if (file.type === 'text/plain' || ext === '.txt') {
      const textReader = new FileReader();
      textReader.onload = () => {
        setFileText(textReader.result as string);
      };
      textReader.readAsText(file);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleCaseDocument) => {
    setSelectedSample(sample);
    setSelectedFile(null);
    setFileError(null);
    setFileBase64('');
    setFileText(sample.rawText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSample) {
      onAnalyze({
        mimeType: selectedSample.mimeType,
        fileName: selectedSample.fileName,
        fileSize: selectedSample.sizeBytes,
        fileText: selectedSample.rawText,
        caseId: selectedCaseId !== 'NEW-DOCKET' ? selectedCaseId : undefined,
        officerNotes: officerNotes.trim() || undefined
      });
      return;
    }

    if (!selectedFile) {
      setFileError('Please select a case document file or choose a preset sample below.');
      return;
    }

    onAnalyze({
      fileBase64,
      mimeType: selectedFile.type || 'application/pdf',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileText: fileText || undefined,
      caseId: selectedCaseId !== 'NEW-DOCKET' ? selectedCaseId : undefined,
      officerNotes: officerNotes.trim() || undefined
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Upload Box Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
          <div>
            <h2 className="font-serif-legal text-lg sm:text-xl font-bold text-[#08121D] dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#C6A15B]" />
              Upload Case Document for AI Intelligence
            </h2>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              Processes the entire document to extract key facts, clues, evidence items, and statutory provisions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#1E2D3E]">
              MAX 25MB • MULTI-PAGE OCR
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag & Drop Target */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-8 sm:p-12 text-center transition-all cursor-pointer relative ${
              dragActive
                ? 'border-[#C6A15B] bg-[#C6A15B]/10 scale-[1.005]'
                : selectedFile || selectedSample
                ? 'border-[#10B981] bg-[#10B981]/5'
                : 'border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] bg-[#F7F4ED]/50 dark:bg-[#08121D]/50 hover:bg-[#F7F4ED] dark:hover:bg-[#08121D]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`w-14 h-14 rounded-sm flex items-center justify-center transition-colors ${
                selectedFile || selectedSample
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                  : 'bg-[#101C29] text-[#C6A15B] border border-[#C6A15B]/30'
              }`}>
                {selectedFile || selectedSample ? (
                  <FileCheck className="w-7 h-7" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#08121D] dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs font-mono text-[#5A6573] dark:text-[#8C96A3]">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Case Document'}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#10B981]/15 text-[#10B981] font-semibold">
                    READY FOR COMPLETE CASE ANALYSIS
                  </span>
                </div>
              ) : selectedSample ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#C6A15B]">
                    {selectedSample.title}
                  </p>
                  <p className="text-xs font-mono text-[#5A6573] dark:text-[#8C96A3]">
                    {selectedSample.category} • {selectedSample.pages} Page(s) • Ready for Analysis
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#C6A15B]/20 text-[#D5B875] font-semibold">
                    PRESET CASE LOADED
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-[#08121D] dark:text-white">
                    Drop your case document here, or <span className="text-[#C6A15B] underline">browse file</span>
                  </p>
                  <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] max-w-md mx-auto">
                    Supported: PDF (Scanned & Printed), JPG, JPEG, PNG, WEBP, TXT, DOCX
                  </p>
                  <p className="text-[10px] font-mono text-[#8C96A3] uppercase">
                    FIR, Citizen Complaint, Witness Statement, MLC Report, Seizure Memo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validation Error Message */}
          {fileError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Association & Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A6573] dark:text-[#8C96A3] mb-1.5 font-mono">
                Associate with Case Docket (Optional)
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] text-[#08121D] dark:text-[#E8ECEF] focus:outline-none focus:border-[#C6A15B]"
              >
                <option value="NEW-DOCKET">Generate Standalone / New Case Intelligence</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.caseId || c.id}>
                    {c.caseId} — {c.crimeType} ({c.complainant})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A6573] dark:text-[#8C96A3] mb-1.5 font-mono">
                Investigating Officer Notes (Optional)
              </label>
              <input
                type="text"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="e.g., Focus on vehicle escape route & CCTV cameras near ATM"
                className="w-full px-3 py-2 text-xs rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] text-[#08121D] dark:text-[#E8ECEF] focus:outline-none focus:border-[#C6A15B] placeholder:text-[#8C96A3]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzing || (!selectedFile && !selectedSample)}
              className="btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Complete Intelligence Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Preset Sample Case Documents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C6A15B]" />
            <h3 className="font-serif-legal font-bold text-sm tracking-wide text-[#08121D] dark:text-white uppercase">
              Or Select a Preset Sample Case Document
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Instant 1-Click Multi-Page Evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SAMPLE_CASE_DOCUMENTS.map((sample) => {
            const isChosen = selectedSample?.id === sample.id;
            return (
              <div
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`p-4 rounded-sm border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isChosen
                    ? 'border-[#C6A15B] bg-[#C6A15B]/10 shadow-md ring-1 ring-[#C6A15B]'
                    : 'border-[#DDD8CE] dark:border-[#1E2D3E] bg-white dark:bg-[#0D1824] hover:border-[#C6A15B]/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#1E2D3E] font-bold">
                      {sample.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C96A3]">
                      {sample.pages} Page{sample.pages > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-[#08121D] dark:text-white leading-snug">
                    {sample.title}
                  </h4>

                  <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] mt-3 flex items-center justify-between text-[11px] font-mono">
                  <span className={isChosen ? 'text-[#C6A15B] font-bold' : 'text-[#8C96A3]'}>
                    {isChosen ? '✓ Selected for Analysis' : 'Click to Load'}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isChosen ? 'text-[#C6A15B] translate-x-1' : 'text-[#8C96A3]'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
