import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  AlertTriangle,
  FileCheck,
  PenTool
} from 'lucide-react';
import { ExtractedOCRPage } from '../../types/documentIntelligence';

interface DocIntelligenceOcrTabProps {
  ocrPages: ExtractedOCRPage[];
  fileName: string;
  targetSnippet?: string | null;
  targetPage?: string | number | null;
}

export const DocIntelligenceOcrTab: React.FC<DocIntelligenceOcrTabProps> = ({
  ocrPages,
  fileName,
  targetSnippet,
  targetPage
}) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const snippetRef = useRef<HTMLDivElement>(null);

  // If a target page was passed from "View Source", jump to that page
  useEffect(() => {
    if (targetPage !== null && targetPage !== undefined) {
      const pageNum = typeof targetPage === 'number' 
        ? targetPage 
        : parseInt(String(targetPage).replace(/\D/g, ''), 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= ocrPages.length) {
        setActivePageIndex(pageNum - 1);
      }
    }
  }, [targetPage, ocrPages.length]);

  const currentPage = ocrPages[activePageIndex] || ocrPages[0] || {
    pageNumber: 1,
    pageTitle: 'Page 1',
    text: 'No extracted text available.',
    confidence: 'HIGH' as const,
    hasSignature: false
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentPage.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const fullText = ocrPages.map(p => `=== ${p.pageTitle || `PAGE ${p.pageNumber}`} ===\n\n${p.text}`).join('\n\n\n');
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}_OCR_extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Highlight matches of search query or target snippet
  const renderHighlightedText = (text: string) => {
    const highlightTarget = searchQuery.trim() || (targetSnippet ? targetSnippet.trim().slice(0, 40) : '');
    if (!highlightTarget) {
      return <span>{text}</span>;
    }

    try {
      const escaped = highlightTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);

      return (
        <span>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <mark 
                key={i} 
                className="bg-[#C6A15B]/40 text-[#08121D] dark:text-white px-1 py-0.5 rounded font-semibold border-b-2 border-[#C6A15B]"
              >
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch {
      return <span>{text}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search inside Extracted Text */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C96A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, names, amounts, vehicles in OCR text..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] text-[#08121D] dark:text-[#E8ECEF] focus:outline-none focus:border-[#C6A15B]"
          />
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ocrPages.map((page, idx) => (
            <button
              key={idx}
              onClick={() => setActivePageIndex(idx)}
              className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-all cursor-pointer ${
                activePageIndex === idx
                  ? 'bg-[#101C29] text-white border border-[#C6A15B] font-bold shadow-sm'
                  : 'bg-[#F7F4ED] dark:bg-[#08121D] text-[#5A6573] dark:text-[#8C96A3] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]'
              }`}
            >
              Page {page.pageNumber || idx + 1}
            </button>
          ))}
        </div>

        {/* Copy / Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Page'}</span>
          </button>

          <button
            onClick={handleDownloadText}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Text</span>
          </button>
        </div>
      </div>

      {/* Target Snippet Jump Notice */}
      {targetSnippet && (
        <div className="p-3 bg-[#C6A15B]/10 border border-[#C6A15B]/40 rounded-sm text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span className="text-[#08121D] dark:text-[#E8ECEF]">
              Showing source snippet from <span className="font-semibold text-[#C6A15B]">{targetPage || 'document'}</span>: "{targetSnippet.slice(0, 80)}..."
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#C6A15B] font-bold">
            HIGHLIGHTED BELOW
          </span>
        </div>
      )}

      {/* Page OCR Document Canvas */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm overflow-hidden">
        {/* Page Top Header Bar */}
        <div className="p-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED]/60 dark:bg-[#101C29]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#C6A15B]" />
            <span className="font-serif-legal font-bold text-sm text-[#08121D] dark:text-white">
              {currentPage.pageTitle || `Extracted Text — Page ${currentPage.pageNumber}`}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
              currentPage.confidence === 'HIGH'
                ? 'bg-[#10B981]/15 text-[#10B981]'
                : 'bg-[#F59E0B]/15 text-[#F59E0B]'
            }`}>
              OCR Confidence: {currentPage.confidence}
            </span>
          </div>

          {/* Signature Indicator */}
          {currentPage.hasSignature && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1 rounded-sm">
              <PenTool className="w-3 h-3 text-[#10B981]" />
              <span>Signature Presence Detected</span>
            </div>
          )}
        </div>

        {/* Text Area Content */}
        <div className="p-6 sm:p-8 font-mono text-xs sm:text-[13px] leading-relaxed text-[#08121D] dark:text-[#E8ECEF] whitespace-pre-wrap selection:bg-[#C6A15B]/30 max-h-[600px] overflow-y-auto">
          {renderHighlightedText(currentPage.text)}
        </div>

        {/* Page Footer Safety Safeguard */}
        {currentPage.hasSignature && (
          <div className="p-3 bg-[#FFFBEB] dark:bg-[#151D28] border-t border-[#DDD8CE] dark:border-[#1E2D3E] text-[11px] text-[#78350F] dark:text-[#C5D0DC] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
            <span>
              {currentPage.signatureNotes || 'Signature presence recorded as an observational indicator only. Evidentiary identity cannot be established without handwriting forensic analysis.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
