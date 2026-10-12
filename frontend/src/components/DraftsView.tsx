import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  Folder,
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  X, 
  Scale, 
  BookOpen, 
  FileText,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { View, CaseStatus, FIRCaseData } from '../types';
import { CaseStatusBadge } from './CaseStatusBadge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OfficialFIRData, CaseDocumentVaultItem } from '../types/documentIntelligence';
import { mapCaseToOfficialFIR } from '../utils/officialFIRMapper';
import { validateFIRData, generateOfficialFIRPdf, GeneratedFIRPdfResult } from '../services/officialFIRPdfService';
import { OfficialFIRPreviewModal } from './fir/OfficialFIRPreviewModal';
import { OfficialTamilNaduFIRDocument } from './fir/OfficialTamilNaduFIRDocument';

interface DraftsViewProps {
  setCurrentView: (view: View) => void;
  onOpenCaseTimeline?: (caseId: string) => void;
  onOpenCaseWorkspace?: (caseId: string) => void;
  vaultDocuments?: CaseDocumentVaultItem[];
  onUpdateVaultDocuments?: (docs: CaseDocumentVaultItem[]) => void;
  onBack?: () => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  setCurrentView,
  onOpenCaseTimeline,
  onOpenCaseWorkspace,
  vaultDocuments,
  onUpdateVaultDocuments,
  onBack
}) => {
  const { cases, updateCaseStatus, removeCase, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [activeCase, setActiveCase] = useState<FIRCaseData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Official FIR generation states
  const [isGeneratingFIR, setIsGeneratingFIR] = useState(false);
  const [showOfficialFIRModal, setShowOfficialFIRModal] = useState(false);
  const [compiledFIRPdf, setCompiledFIRPdf] = useState<GeneratedFIRPdfResult | null>(null);
  const [firSaveDraftMessage, setFirSaveDraftMessage] = useState<string | null>(null);
  const [firErrorMessage, setFirErrorMessage] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Statistics & Triage Counts
  const totalCount = cases.length;
  const draftingCount = cases.filter(c => c.status === 'Drafting' || c.status === 'Draft').length;
  const reviewPendingCount = cases.filter(c => c.status === 'Review Pending' || c.status === 'Pending').length;
  const submittedCount = cases.filter(c => c.status === 'Submitted').length;
  const verifiedCount = cases.filter(c => c.status === 'Verified' || c.status === 'Registered').length;

  // Filtered cases with dynamic triage matching
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complainant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.policeStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.crimeType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      selectedStatus === 'All' || 
      c.status === selectedStatus ||
      (selectedStatus === 'Drafting' && (c.status === 'Drafting' || c.status === 'Draft')) ||
      (selectedStatus === 'Review Pending' && (c.status === 'Review Pending' || c.status === 'Pending')) ||
      (selectedStatus === 'Submitted' && c.status === 'Submitted') ||
      (selectedStatus === 'Verified' && (c.status === 'Verified' || c.status === 'Registered')) ||
      (selectedStatus === 'Closed' && c.status === 'Closed');

    const matchesPriority = selectedPriority === 'All' || c.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = async (caseId: string, newStatus: FIRCaseData['status']) => {
    try {
      await updateCaseStatus(caseId, newStatus);
      if (activeCase && activeCase.caseId === caseId) {
        setActiveCase({ ...activeCase, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (caseId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete case ${caseId}?`)) return;
    setIsDeletingId(caseId);
    try {
      await removeCase(caseId);
      if (activeCase?.caseId === caseId) {
        setActiveCase(null);
      }
    } catch (err) {
      console.error('Failed to delete case:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleExportPDF = async () => {
    if (!previewRef.current || !activeCase) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`FIR_${activeCase.caseId}_${activeCase.policeStation.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Derived Official FIR Data and Validation for Active Case
  const currentOfficialFIRData = activeCase ? mapCaseToOfficialFIR(activeCase, {
    name: user?.name || activeCase.officerName || 'Inspector Rajesh Kumar',
    role: user?.role || activeCase.officerRole || 'Investigating Officer',
    station: activeCase.policeStation,
    badgeNumber: 'SI-TN-401'
  }) : null;

  const firValidation = currentOfficialFIRData
    ? validateFIRData(currentOfficialFIRData)
    : { valid: false, missingFields: ['No Case Selected'] };

  const handleGenerateFIRFromDraft = async () => {
    if (!currentOfficialFIRData) return;
    if (!firValidation.valid) {
      setFirErrorMessage(firValidation.message || 'FIR generation failed: Required fields are missing.');
      return;
    }
    setFirErrorMessage(null);
    setIsGeneratingFIR(true);
    try {
      const pdfResult = await generateOfficialFIRPdf(undefined, currentOfficialFIRData);
      setCompiledFIRPdf(pdfResult);
      setShowOfficialFIRModal(true);
    } catch (err: any) {
      console.error('[FIR] Failed to generate official FIR from draft:', err);
      const userMessage = err?.message && err.message.startsWith('FIR generation failed:')
        ? err.message
        : `FIR generation failed: ${err?.message || 'Unable to generate PDF.'}`;
      setFirErrorMessage(userMessage);
    } finally {
      setIsGeneratingFIR(false);
    }
  };

  const handleSaveDraftIntermediate = async () => {
    if (!activeCase) return;
    try {
      await updateCaseStatus(activeCase.caseId, 'Drafting');
      setFirSaveDraftMessage('FIR draft state successfully saved to docket.');
      setTimeout(() => setFirSaveDraftMessage(null), 3500);
    } catch (err) {
      console.error('Failed to save intermediate draft:', err);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto space-y-8 pb-20 text-[#171A1E] dark:text-[#E8ECEF] font-sans"
    >
      
      {/* 1. HEADER */}
      <div className="bg-[#FCFBF8] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-6">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
                title="Back to previous view"
              >
                <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
                <span>Back</span>
              </button>
            )}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A38038] dark:text-[#D5B875] font-bold block">
                JURISDICTIONAL REPOSITORY
              </span>
              <h1 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#08121D] dark:text-white">
                Case Dockets & FIR Archive
              </h1>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Immutable ledger of registered FIR complaints, investigation notes, and BNS section mapping.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('new-complaint')}
            className="btn-legal-gold px-5 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Draft New FIR</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C96A3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case ID, complainant, station..."
              className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] py-2.5 pl-10 pr-4 text-xs focus:border-[#C6A15B] focus:outline-none rounded-sm font-sans"
            />
          </div>

          {/* Status and Priority Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
              <span className="text-[#8C96A3] text-[10px] uppercase font-bold mr-0.5">STATUS:</span>
              {[
                { id: 'All', label: 'All', count: totalCount },
                { id: 'Drafting', label: 'Drafting', count: draftingCount },
                { id: 'Review Pending', label: 'Review Pending', count: reviewPendingCount },
                { id: 'Submitted', label: 'Submitted', count: submittedCount },
                { id: 'Verified', label: 'Verified', count: verifiedCount }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStatus(s.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedStatus === s.id
                      ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] font-bold'
                      : 'border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:border-[#C6A15B]/40'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-xs ${
                    selectedStatus === s.id
                      ? 'bg-[#C6A15B]/30 text-[#A38038] dark:text-[#D5B875]'
                      : 'bg-black/5 dark:bg-white/5 text-[#8C96A3]'
                  }`}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono ml-auto sm:ml-0">
              <span className="text-[#8C96A3] text-[10px] uppercase font-bold">PRIORITY:</span>
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2 py-1 text-[10px] font-mono rounded-sm border transition-colors cursor-pointer ${
                    selectedPriority === p
                      ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] font-bold'
                      : 'border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:border-[#C6A15B]/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 2. MAIN DOCKET TABLE */}
      <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 sm:p-8">
        
        {filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3]">
                  <th className="py-3 px-3">Docket ID</th>
                  <th className="py-3 px-3">Complainant</th>
                  <th className="py-3 px-3">Station & District</th>
                  <th className="py-3 px-3">Crime Category</th>
                  <th className="py-3 px-3">Incident Date</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
                {filteredCases.map((c) => (
                  <tr 
                    key={c.caseId} 
                    className="hover:bg-[#FFFFFF] dark:hover:bg-[#101C29] transition-colors group cursor-pointer"
                    onClick={() => setActiveCase(c)}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-[#08121D] dark:text-white">
                      {c.caseId}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#171A1E] dark:text-[#E8ECEF]">
                      {c.complainant}
                    </td>
                    <td className="py-3.5 px-3 text-[#5B636E] dark:text-[#B4BCC6]">
                      {c.policeStation}
                      <span className="block text-[10px] text-[#8C96A3]">{c.district}</span>
                    </td>
                    <td className="py-3.5 px-3 text-[#5B636E] dark:text-[#B4BCC6]">
                      {c.crimeType}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#6D7278] dark:text-[#8C96A3]">
                      {c.incidentDate}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-mono font-bold ${
                        c.priority === 'Critical' ? 'text-[#EF4444]' : c.priority === 'High' ? 'text-[#F59E0B]' : 'text-[#6D7278] dark:text-[#8C96A3]'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <CaseStatusBadge
                        status={c.status}
                        size="sm"
                        interactive
                        onStatusChange={(newStatus) => handleStatusChange(c.caseId, newStatus)}
                      />
                    </td>
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenCaseWorkspace ? onOpenCaseWorkspace(c.caseId) : setCurrentView('case-workspace')}
                          className="p-1.5 text-[#D4AF37] hover:text-[#C29B27] hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
                          title="Open Digital Case Folder Workspace"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenCaseTimeline ? onOpenCaseTimeline(c.caseId) : setCurrentView('timeline')}
                          className="p-1.5 text-[#8C96A3] hover:text-[#C6A15B] hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
                          title="Open Case Timeline & Chronology"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveCase(c)}
                          className="p-1.5 text-[#8C96A3] hover:text-[#C6A15B] hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
                          title="Open Case Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.caseId)}
                          disabled={isDeletingId === c.caseId}
                          className="p-1.5 text-[#8C96A3] hover:text-[#EF4444] hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
                          title="Delete Case Docket"
                        >
                          {isDeletingId === c.caseId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#8C96A3] space-y-4">
            <Scale className="w-12 h-12 mx-auto text-[#C6A15B]/40" />
            <p className="text-sm">No FIR records found in docket matching current filters.</p>
            <button
              onClick={() => setCurrentView('new-complaint')}
              className="btn-legal-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              + Create New FIR Entry
            </button>
          </div>
        )}

      </div>

      {/* 3. CASE DOSSIER DETAIL DRAWER / MODAL */}
      <AnimatePresence>
        {activeCase && (
          <div className="fixed inset-0 z-50 bg-[#08121D]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl p-6 sm:p-8 space-y-6"
            >
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg text-[#08121D] dark:text-white">
                      {activeCase.caseId}
                    </span>
                    <CaseStatusBadge
                      status={activeCase.status}
                      size="md"
                      interactive
                      onStatusChange={(newStatus) => handleStatusChange(activeCase.caseId, newStatus)}
                    />
                  </div>
                  <p className="text-xs text-[#6D7278] dark:text-[#8C96A3] mt-1 font-mono">
                    {activeCase.policeStation} • {activeCase.district}
                  </p>
                </div>

                <button
                  onClick={() => setActiveCase(null)}
                  className="p-1.5 text-[#8C96A3] hover:text-white hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Update & Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs">
                <div className="flex items-center gap-2 font-mono flex-wrap">
                  <span className="text-[#8C96A3] text-[10px] uppercase font-bold">STATUS TRIAGE:</span>
                  {(['Drafting', 'Review Pending', 'Submitted', 'Verified', 'Closed'] as const).map((s) => {
                    const isCurrent = activeCase.status === s || 
                      (s === 'Drafting' && activeCase.status === 'Draft') || 
                      (s === 'Review Pending' && activeCase.status === 'Pending') || 
                      (s === 'Verified' && activeCase.status === 'Registered');

                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(activeCase.caseId, s)}
                        className={`px-2.5 py-1 text-[10px] rounded-sm border cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'border-[#C6A15B] bg-[#C6A15B]/20 text-[#A38038] dark:text-[#D5B875] font-bold'
                            : 'border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:border-[#C6A15B]/40'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveDraftIntermediate}
                    className="px-3 py-1.5 bg-white dark:bg-[#101C29] text-[#171717] dark:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] hover:bg-[#F2EFE9] dark:hover:bg-[#152332] rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Save current intermediate state as draft"
                  >
                    <Save className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateFIRFromDraft}
                    disabled={!firValidation.valid || isGeneratingFIR}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-sm cursor-pointer shadow-xs transition-all ${
                      !firValidation.valid
                        ? 'bg-[#E5E0D8] dark:bg-[#1A2634] text-[#8E98A5] cursor-not-allowed border border-[#DDD8CE] dark:border-[#223042]'
                        : isGeneratingFIR
                        ? 'bg-[#B8955A]/80 text-black cursor-wait'
                        : 'btn-legal-gold'
                    }`}
                    title={
                      !firValidation.valid
                        ? `Validation checks pending: ${firValidation.missingFields.join(', ')}`
                        : 'Generate official 3-page Tamil Nadu Police FIR'
                    }
                  >
                    {isGeneratingFIR ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>{isGeneratingFIR ? 'Generating FIR...' : 'Generate FIR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCaseWorkspace) {
                        onOpenCaseWorkspace(activeCase.caseId);
                      } else {
                        setCurrentView('case-workspace');
                      }
                      setActiveCase(null);
                    }}
                    className="px-3 py-1.5 bg-[#1E2D3E] hover:bg-[#2A3F55] text-[#D4AF37] border border-[#D4AF37]/50 rounded-sm text-xs font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Open this case folder in the Case Workspace"
                  >
                    <Folder className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Case Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeCase) {
                        if (onOpenCaseTimeline) {
                          onOpenCaseTimeline(activeCase.caseId);
                        } else {
                          setCurrentView('timeline');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-[#08121D] hover:bg-[#152332] text-[#D5B875] border border-[#C6A15B]/50 rounded-sm text-xs font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="View this case in the interactive Sec 172 BNSS chronology timeline"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Case Timeline</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="px-3 py-1.5 bg-[#F2EFE9] dark:bg-[#101C29] text-[#171717] dark:text-[#E8ECEF] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:bg-[#E5E0D8] rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>{isExporting ? 'Exporting...' : 'Export Dossier'}</span>
                  </button>
                </div>
              </div>

              {/* Validation Status Feedback Banner */}
              {!firValidation.valid && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      FIR Validation Pending: Missing required fields ({firValidation.missingFields.join(', ')}). All fields must be verified to enable 'Generate FIR'.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Draft Incomplete
                  </span>
                </div>
              )}

              {firValidation.valid && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      All required statutory checks passed. Ready to generate official 3-page Tamil Nadu Police Form-I FIR.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    Validation Passed
                  </span>
                </div>
              )}

              {firErrorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-mono rounded-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{firErrorMessage}</span>
                </div>
              )}

              {firSaveDraftMessage && (
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono rounded-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{firSaveDraftMessage}</span>
                </div>
              )}

              {/* Printable Dossier Container */}
              <div 
                ref={previewRef}
                className="bg-[#FFFFFF] text-[#171A1E] p-6 sm:p-8 border border-[#CBD5E1] font-sans text-xs space-y-6"
              >
                {/* Header */}
                <div className="text-center border-b border-[#CBD5E1] pb-4">
                  <Scale className="w-8 h-8 mx-auto text-[#08121D] mb-1" />
                  <h2 className="font-serif-legal font-bold text-lg uppercase tracking-wider">
                    CASE DOCKET DOSSIER
                  </h2>
                  <p className="font-mono text-[10px] text-[#64748B]">
                    REF: {activeCase.caseId} • POLICE STATION: {activeCase.policeStation}
                  </p>
                </div>

                {/* Complainant & Incident Grid */}
                <div className="grid grid-cols-2 gap-4 border border-[#E2E8F0] p-4">
                  <div>
                    <span className="text-[#64748B] block font-mono text-[10px]">COMPLAINANT</span>
                    <strong className="text-sm">{activeCase.complainant}</strong>
                    <span className="block text-[#475569]">{activeCase.complainantAddress || 'Address on record'}</span>
                    <span className="block text-[#64748B] font-mono">{activeCase.complainantPhone}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block font-mono text-[10px]">INCIDENT TIME & OCCURRENCE</span>
                    <strong className="text-sm">{activeCase.incidentDate} at {activeCase.incidentTime}</strong>
                    <span className="block text-[#475569]">Offence: {activeCase.crimeType}</span>
                    <span className="block text-[#64748B] font-mono">Priority: {activeCase.priority}</span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] text-[#64748B] uppercase font-bold block">
                    RECORDED COMPLAINT STATEMENT:
                  </span>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] whitespace-pre-line leading-relaxed text-[#334155]">
                    {activeCase.incidentDescription}
                  </div>
                </div>

                {/* AI Sections */}
                {activeCase.aiAnalysis?.sections && (
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-[#64748B] uppercase font-bold block">
                      RECOMMENDED PENAL PROVISIONS (BNS 2023):
                    </span>
                    <div className="space-y-2">
                      {activeCase.aiAnalysis.sections.map((sec, i) => (
                        <div key={i} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm">
                          <strong className="text-[#0F172A]">{sec.section}</strong>
                          <p className="text-[11px] text-[#475569] mt-0.5">{sec.reasoning?.[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Stamp */}
                <div className="pt-4 border-t border-[#CBD5E1] flex justify-between text-[10px] font-mono text-[#64748B]">
                  <span>REGISTERED BY: {activeCase.officerName} ({activeCase.officerRole})</span>
                  <span>STATUS: {activeCase.status}</span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Fidelity 3-Page Official Tamil Nadu Police FIR Modal */}
      {showOfficialFIRModal && currentOfficialFIRData && (
        <OfficialFIRPreviewModal
          isOpen={showOfficialFIRModal}
          onClose={() => setShowOfficialFIRModal(false)}
          onBackToEdit={() => setShowOfficialFIRModal(false)}
          firData={currentOfficialFIRData}
          currentUser={{
            name: user?.name || activeCase?.officerName || 'Inspector Rajesh Kumar',
            role: user?.role || activeCase?.officerRole || 'Investigating Officer',
            id: user?.id || 'usr-officer'
          }}
          vaultDocuments={vaultDocuments || []}
          onUpdateVaultDocuments={onUpdateVaultDocuments}
          onFIRSaved={(savedDoc) => {
            if (onUpdateVaultDocuments && vaultDocuments) {
              const filtered = vaultDocuments.filter(d => d.id !== savedDoc.id);
              onUpdateVaultDocuments([savedDoc, ...filtered]);
            }
          }}
          precompiledPdf={compiledFIRPdf}
        />
      )}

      {/* Offscreen Render Container for Deterministic Official FIR PDF Generation */}
      {currentOfficialFIRData && (
        <div
          id="fir-print-offscreen-container"
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: '210mm',
            zIndex: -999,
            opacity: 0.01,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          <OfficialTamilNaduFIRDocument data={currentOfficialFIRData} />
        </div>
      )}

    </motion.div>
  );
};
