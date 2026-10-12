import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Search, 
  Plus, 
  BookOpen, 
  Layers, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight, 
  ArrowLeft,
  ArrowUpRight, 
  Database, 
  Gavel, 
  Building2, 
  User, 
  Calendar, 
  Download, 
  Eye, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight, 
  Activity, 
  Lock, 
  HelpCircle,
  FileCheck2,
  Bookmark,
  Share2,
  Folder,
  FolderOpen,
  FolderPlus,
  UploadCloud,
  FileSearch,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { View, FIRCase, CaseStatus, FIRCaseData } from '../types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { CaseDocumentVaultItem } from '../types/documentIntelligence';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DashboardViewProps {
  setCurrentView: (view: View) => void;
  onOpenCaseTimeline?: (caseId: string) => void;
  onOpenCaseWorkspace?: (caseId: string) => void;
  vaultDocuments?: CaseDocumentVaultItem[];
  onBack?: () => void;
}

// Statutory concordance quick dataset for instant reference
const KEY_STATUTORY_CONCORDANCE = [
  {
    ipc: 'IPC § 302',
    bns: 'BNS § 103(1)',
    crime: 'Murder (Punishment for Murder)',
    type: 'Cognizable • Non-Bailable • Sessions Court',
    punishment: 'Death or Imprisonment for Life, and Fine',
    category: 'Bodily Offences'
  },
  {
    ipc: 'IPC § 307',
    bns: 'BNS § 109(1)',
    crime: 'Attempt to Murder',
    type: 'Cognizable • Non-Bailable • Sessions Court',
    punishment: 'Imprisonment up to 10 Years + Fine; if hurt caused, Life Imprisonment',
    category: 'Bodily Offences'
  },
  {
    ipc: 'IPC § 420',
    bns: 'BNS § 318(4)',
    crime: 'Cheating and Dishonestly Inducing Delivery of Property',
    type: 'Cognizable • Non-Bailable • Magistrate 1st Class',
    punishment: 'Imprisonment up to 7 Years and Fine',
    category: 'Property & Fraud'
  },
  {
    ipc: 'IPC § 379 / 380',
    bns: 'BNS § 303(2)',
    crime: 'Theft / Theft in Dwelling House',
    type: 'Cognizable • Non-Bailable • Any Magistrate',
    punishment: 'Imprisonment up to 3 Years (or 7 Years for dwelling) or Fine or Both',
    category: 'Property & Fraud'
  },
  {
    ipc: 'IPC § 376',
    bns: 'BNS § 64(1)',
    crime: 'Punishment for Rape',
    type: 'Cognizable • Non-Bailable • Court of Session',
    punishment: 'Rigorous Imprisonment not less than 10 Years up to Life, and Fine',
    category: 'Women & Children'
  },
  {
    ipc: 'New Provision',
    bns: 'BNS § 111',
    crime: 'Organized Crime (Syndicate / Gang Violence / Extortion)',
    type: 'Cognizable • Non-Bailable • Special Court / Sessions',
    punishment: 'Death or Life Imprisonment if death caused; minimum 5 years + ₹5 Lakh fine',
    category: 'Organized Crime'
  },
  {
    ipc: 'New Provision',
    bns: 'BNS § 112',
    crime: 'Petty Organized Crime (Snatching, Ticket Touting, Card Skimming)',
    type: 'Cognizable • Non-Bailable • Magistrate 1st Class',
    punishment: 'Imprisonment 1 to 7 Years and Fine',
    category: 'Organized Crime'
  },
  {
    ipc: 'IPC § 354',
    bns: 'BNS § 74',
    crime: 'Assault / Criminal Force to Woman with Intent to Outrage Modesty',
    type: 'Cognizable • Non-Bailable • Any Magistrate',
    punishment: 'Imprisonment 1 to 5 Years and Fine',
    category: 'Women & Children'
  }
];

// Landmark Judicial Precedents
const LANDMARK_BENCHMARKS = [
  {
    id: 'lalita-kumari',
    title: 'Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1',
    bench: 'Supreme Court of India (5-Judge Constitution Bench)',
    subject: 'Mandatory Registration of FIR under § 154 CrPC / § 173 BNSS',
    ratio: 'Registration of FIR is mandatory if the information discloses commission of a cognizable offence. No preliminary inquiry is permissible in such cases unless exception applies (e.g. medical negligence, matrimonial disputes, commercial fraud).',
    statute: 'BNSS 2023 § 173'
  },
  {
    id: 'arnesh-kumar',
    title: 'Arnesh Kumar v. State of Bihar (2014) 8 SCC 273',
    bench: 'Supreme Court of India',
    subject: 'Safeguards Against Arbitrary Arrest & BNSS § 35 Compliance',
    ratio: 'Police officers must not automatically arrest an accused when an offence is punishable with imprisonment up to 7 years. A Notice of Appearance under § 35 BNSS (§ 41A CrPC) must be served unless written reasons for arrest exist.',
    statute: 'BNSS 2023 § 35'
  },
  {
    id: 'shafhi-mohammad',
    title: 'Shafhi Mohammad v. State of H.P. (2018) 2 SCC 801',
    bench: 'Supreme Court of India',
    subject: 'Electronic Evidence Admissibility & Section 63 BSA 2023',
    ratio: 'A third party not in possession of the electronic device is not debarred from producing secondary electronic evidence without an exhaustive certificate if producing it is practically impossible.',
    statute: 'BSA 2023 § 63'
  },
  {
    id: 'satender-antil',
    title: 'Satender Kumar Antil v. CBI (2022) 10 SCC 51',
    bench: 'Supreme Court of India',
    subject: 'Bail Categorization & Statutory Timelines for Cognizance',
    ratio: 'Strict categorization of offences into Category A (bailable/summons), Category B (serious non-bailable), Category C (special acts), and Category D (economic offences). Charge-sheet must be filed within statutory limit.',
    statute: 'BNSS 2023 § 187'
  }
];

// Mandatory BNSS 2023 Investigation Playbook Checkpoints
const BNSS_PROCEDURAL_PLAYBOOK = [
  {
    code: 'BNSS § 173',
    title: 'Mandatory Electronic FIR Registration',
    detail: 'Zero FIR must be recorded irrespective of jurisdiction and transferred within 24 hours. Electronic FIRs must be signed within 3 days.'
  },
  {
    code: 'BNSS § 105',
    title: 'Mandatory Audio-Video Recording',
    detail: 'All search and seizure procedures, including Panchnama preparation, must be captured on video with unedited digital integrity.'
  },
  {
    code: 'BNSS § 176(3)',
    title: 'Forensic Investigation Mandate',
    detail: 'Forensic Science Laboratory (FSL) team visit is mandatory for any crime scene punishable with imprisonment of 7 years or more.'
  },
  {
    code: 'BNSS § 36',
    title: 'Designated Arrest Information Officer',
    detail: 'Every police district & station must prominently display details of arrested persons on digital notice boards.'
  },
  {
    code: 'BNSS § 57 / 187',
    title: '24-Hour Magistrate Production Clock',
    detail: 'Arrested person must be produced before the Judicial Magistrate within 24 hours excluding journey time.'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentView, onOpenCaseTimeline, onOpenCaseWorkspace, vaultDocuments, onBack }) => {
  const { user, cases, auditLogs, updateCaseStatus } = useAuth();

  // State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCase, setSelectedCase] = useState<FIRCaseData | null>(null);
  const [copiedStatute, setCopiedStatute] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'dockets' | 'concordance' | 'playbook' | 'precedents'>('dockets');
  const [concordanceSearch, setConcordanceSearch] = useState('');
  const [expandedPrecedent, setExpandedPrecedent] = useState<string | null>('lalita-kumari');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Real Data Metrics & Triage Counts
  const totalCases = cases.length;
  const activeCasesCount = cases.filter(c => c.status !== 'Closed').length;
  const draftingCount = cases.filter(c => c.status === 'Drafting' || c.status === 'Draft').length;
  const reviewPendingCount = cases.filter(c => c.status === 'Review Pending' || c.status === 'Pending').length;
  const submittedCount = cases.filter(c => c.status === 'Submitted').length;
  const verifiedCount = cases.filter(c => c.status === 'Verified' || c.status === 'Registered').length;
  const closedCount = cases.filter(c => c.status === 'Closed').length;
  const criticalCount = cases.filter(c => c.priority === 'Critical' || c.priority === 'High').length;

  // Vault Documents Metrics (derived from props or local fallback)
  const allVaultDocs: CaseDocumentVaultItem[] = useMemo(() => {
    if (vaultDocuments && vaultDocuments.length > 0) return vaultDocuments;
    try {
      const stored = localStorage.getItem('lawgic_vault_documents');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return [];
  }, [vaultDocuments]);

  const storedDocsCount = allVaultDocs.length;
  const pendingAnalysisCount = allVaultDocs.filter(d => d.analysisStatus === 'Pending Analysis' || !d.analysisStatus).length;
  const integrityAlertsCount = allVaultDocs.filter(d => d.integrityStatus === 'Integrity Check Failed').length;
  const itemsRequiringVerificationCount = useMemo(() => {
    let count = 0;
    allVaultDocs.forEach(d => {
      if (d.intelligenceResult?.inconsistencies && d.intelligenceResult.inconsistencies.length > 0) {
        count += d.intelligenceResult.inconsistencies.length;
      }
      if (d.intelligenceResult?.missingInformation && d.intelligenceResult.missingInformation.length > 0) {
        count += d.intelligenceResult.missingInformation.length;
      }
    });
    // Add any review pending cases
    count += reviewPendingCount;
    return count;
  }, [allVaultDocs, reviewPendingCount]);

  const recentAuditActivityCount = auditLogs.length;

  // Filtered cases with dynamic triage status matching
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = 
        c.caseId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.complainant.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.crimeType.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.policeStation.toLowerCase().includes(searchFilter.toLowerCase());

      const matchStatus = 
        statusFilter === 'All' || 
        c.status === statusFilter ||
        (statusFilter === 'Drafting' && (c.status === 'Drafting' || c.status === 'Draft')) ||
        (statusFilter === 'Review Pending' && (c.status === 'Review Pending' || c.status === 'Pending')) ||
        (statusFilter === 'Submitted' && c.status === 'Submitted') ||
        (statusFilter === 'Verified' && (c.status === 'Verified' || c.status === 'Registered')) ||
        (statusFilter === 'Closed' && c.status === 'Closed');

      return matchSearch && matchStatus;
    });
  }, [cases, searchFilter, statusFilter]);

  // Concordance filter
  const filteredConcordance = useMemo(() => {
    if (!concordanceSearch.trim()) return KEY_STATUTORY_CONCORDANCE;
    const q = concordanceSearch.toLowerCase();
    return KEY_STATUTORY_CONCORDANCE.filter(item => 
      item.ipc.toLowerCase().includes(q) ||
      item.bns.toLowerCase().includes(q) ||
      item.crime.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [concordanceSearch]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatute(text);
    setTimeout(() => setCopiedStatute(null), 2000);
  };

  const handleExportQuickPDF = async (caseItem: FIRCaseData) => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('FIRST INFORMATION REPORT (DOCKET DOSSIER)', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.text(`Reference ID: ${caseItem.caseId} | Police Station: ${caseItem.policeStation}`, 105, 28, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);

      doc.setFont('times', 'bold');
      doc.text('1. Complainant Details:', 20, 42);
      doc.setFont('times', 'normal');
      doc.text(`Name: ${caseItem.complainant}`, 25, 50);
      doc.text(`Phone: ${caseItem.complainantPhone || 'N/A'}`, 25, 56);
      doc.text(`Address: ${caseItem.complainantAddress || 'Recorded in Station Diary'}`, 25, 62);

      doc.setFont('times', 'bold');
      doc.text('2. Incident Particulars:', 20, 74);
      doc.setFont('times', 'normal');
      doc.text(`Date & Time: ${caseItem.incidentDate} at ${caseItem.incidentTime}`, 25, 82);
      doc.text(`Offence Category: ${caseItem.crimeType}`, 25, 88);
      doc.text(`Priority / Severity: ${caseItem.priority}`, 25, 94);

      doc.setFont('times', 'bold');
      doc.text('3. Substantive Complaint Statement:', 20, 106);
      doc.setFont('times', 'normal');
      const splitDesc = doc.splitTextToSize(caseItem.incidentDescription, 165);
      doc.text(splitDesc, 25, 114);

      const yOffset = 114 + (splitDesc.length * 5) + 15;
      doc.setFont('times', 'bold');
      doc.text('4. Statutory BNS Penal Provisions:', 20, yOffset);
      doc.setFont('times', 'normal');
      if (caseItem.aiAnalysis?.sections) {
        let secY = yOffset + 8;
        caseItem.aiAnalysis.sections.forEach((s: any, idx: number) => {
          doc.text(`• ${s.section}: ${s.reasoning?.[0] || 'Apparent violation established during intake.'}`, 25, secY);
          secY += 6;
        });
      } else {
        doc.text('• Provisions mapped under BNS 2023 & CrPC § 154 / BNSS § 173.', 25, yOffset + 8);
      }

      doc.setLineWidth(0.5);
      doc.line(20, 260, 190, 260);
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.text(`Generated via Lawgic AI Legal Intelligence • Officer: ${caseItem.officerName} (${caseItem.officerRole}) • Certified under Section 63 BSA 2023`, 105, 268, { align: 'center' });

      doc.save(`FIR_${caseItem.caseId}_Docket.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1600px] mx-auto pb-16 font-sans text-[#171717] dark:text-[#F0F2F5] space-y-8"
    >
      {/* ========================================================================= */}
      {/* TOP SECTION: DASHBOARD HERO AREA WITH RESTRAINED ARCHITECTURAL LINE ART */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-2xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(23,23,23,0.03)] relative overflow-hidden">
        {/* Subtle Warm Neutral Backdrop Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5EFE4]/60 dark:bg-[#B8955A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Context & Headlines */}
          <div className="max-w-2xl space-y-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-sans text-[#595959] dark:text-[#8E98A5] hover:text-[#B8955A] transition-colors mb-1 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono tracking-widest text-[#B8955A] dark:text-[#C5A870] uppercase font-semibold">
                {getTimeGreeting()}, Officer {user?.name ? user.name.split(' ')[0] : ''}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#A39E96]" />
              <span className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5]">
                {user?.station || 'Central Police Station'} • Badge {user?.badgeNumber || 'DL-8492'}
              </span>
            </div>

            <h1 className="font-serif-legal font-bold text-3xl sm:text-4xl text-[#171717] dark:text-white tracking-tight leading-tight">
              Your Legal Intelligence Workspace
            </h1>

            <p className="text-sm text-[#595959] dark:text-[#8E98A5] leading-relaxed font-sans max-w-xl">
              Real-time judicial case ledger, automated Bharatiya Nyaya Sanhita (BNS 2023) penal concordance, Section 173 BNSS complaint intake, and certified digital evidence management.
            </p>

            {/* Contextual Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="px-2.5 py-1 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md text-[11px] font-sans text-[#171717] dark:text-[#E0E5EC] font-medium">
                Criminal Code: <strong>BNS 2023</strong>
              </span>
              <span className="px-2.5 py-1 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md text-[11px] font-sans text-[#171717] dark:text-[#E0E5EC] font-medium">
                Procedure: <strong>BNSS § 173 Compliant</strong>
              </span>
              <span className="px-2.5 py-1 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md text-[11px] font-sans text-[#171717] dark:text-[#E0E5EC] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Jurisdiction: <strong>Active & Secure</strong>
              </span>
            </div>
          </div>

          {/* Right Restrained Line Art (Scales of Justice & Courthouse Pediment) */}
          <div className="hidden lg:flex items-center justify-center shrink-0 pr-4">
            <svg 
              viewBox="0 0 280 160" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-64 h-auto text-[#B8955A] opacity-80 select-none"
            >
              {/* Pediment Roof Triangle */}
              <path d="M40 55 L140 20 L240 55 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="30" y1="55" x2="250" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="35" y1="60" x2="245" y2="60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              
              {/* Base Platform */}
              <line x1="35" y1="140" x2="245" y2="140" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="25" y1="145" x2="255" y2="145" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

              {/* Central Scale Column */}
              <circle cx="140" cy="45" r="3.5" fill="currentColor" />
              <line x1="140" y1="45" x2="140" y2="135" stroke="currentColor" strokeWidth="2" />
              <path d="M125 135 L155 135" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

              {/* Scale Crossbeam */}
              <line x1="85" y1="70" x2="195" y2="70" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              
              {/* Left Pan */}
              <line x1="85" y1="70" x2="68" y2="105" stroke="currentColor" strokeWidth="1" />
              <line x1="85" y1="70" x2="102" y2="105" stroke="currentColor" strokeWidth="1" />
              <path d="M64 105 Q85 116 106 105 Z" stroke="currentColor" strokeWidth="1.4" fill="none" />
              
              {/* Right Pan */}
              <line x1="195" y1="70" x2="178" y2="105" stroke="currentColor" strokeWidth="1" />
              <line x1="195" y1="70" x2="212" y2="105" stroke="currentColor" strokeWidth="1" />
              <path d="M174 105 Q195 116 216 105 Z" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-DATA SUMMARY CARDS: ELEGANT LARGE NUMBERS & MINIMAL GOLD ACCENTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Active Cases */}
        <div 
          onClick={() => { setActiveWorkspaceTab('dockets'); setStatusFilter('All'); }}
          className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl hover:border-[#B8955A]/50 transition-colors cursor-pointer group shadow-[0_1px_3px_rgba(23,23,23,0.02)]"
        >
          <div className="flex items-center justify-between text-[#595959] dark:text-[#8E98A5] mb-2">
            <span className="text-xs font-sans font-medium">Active Cases</span>
            <Scale className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
          </div>
          <div className="text-3xl font-serif-legal font-bold text-[#171717] dark:text-white">
            {activeCasesCount}
          </div>
          <p className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5] mt-1 truncate">
            of {totalCases} registered dockets
          </p>
        </div>

        {/* 2. FIR Drafts */}
        <div 
          onClick={() => { setActiveWorkspaceTab('dockets'); setStatusFilter('Drafting'); }}
          className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl hover:border-[#B8955A]/50 transition-colors cursor-pointer group shadow-[0_1px_3px_rgba(23,23,23,0.02)]"
        >
          <div className="flex items-center justify-between text-[#595959] dark:text-[#8E98A5] mb-2">
            <span className="text-xs font-sans font-medium">FIR Drafts</span>
            <FileText className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
          </div>
          <div className="text-3xl font-serif-legal font-bold text-[#171717] dark:text-white">
            {draftingCount}
          </div>
          <p className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5] mt-1 truncate">
            investigations in intake
          </p>
        </div>

        {/* 3. Case Documents */}
        <div 
          onClick={() => setCurrentView('document-vault')}
          className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl hover:border-[#B8955A]/50 transition-colors cursor-pointer group shadow-[0_1px_3px_rgba(23,23,23,0.02)]"
        >
          <div className="flex items-center justify-between text-[#595959] dark:text-[#8E98A5] mb-2">
            <span className="text-xs font-sans font-medium">Case Documents</span>
            <FolderOpen className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
          </div>
          <div className="text-3xl font-serif-legal font-bold text-[#171717] dark:text-white">
            {storedDocsCount}
          </div>
          <p className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5] mt-1 truncate">
            sealed repository files
          </p>
        </div>

        {/* 4. Pending Reviews */}
        <div 
          onClick={() => { setActiveWorkspaceTab('dockets'); setStatusFilter('Review Pending'); }}
          className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl hover:border-[#B8955A]/50 transition-colors cursor-pointer group shadow-[0_1px_3px_rgba(23,23,23,0.02)]"
        >
          <div className="flex items-center justify-between text-[#595959] dark:text-[#8E98A5] mb-2">
            <span className="text-xs font-sans font-medium">Pending Reviews</span>
            <Clock className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
          </div>
          <div className="text-3xl font-serif-legal font-bold text-[#171717] dark:text-white">
            {reviewPendingCount}
          </div>
          <p className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5] mt-1 truncate">
            awaiting IO sign-off
          </p>
        </div>

        {/* 5. Recent Activity */}
        <div 
          onClick={() => setCurrentView('audit-logs')}
          className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl hover:border-[#B8955A]/50 transition-colors cursor-pointer group shadow-[0_1px_3px_rgba(23,23,23,0.02)]"
        >
          <div className="flex items-center justify-between text-[#595959] dark:text-[#8E98A5] mb-2">
            <span className="text-xs font-sans font-medium">Recent Activity</span>
            <Activity className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
          </div>
          <div className="text-3xl font-serif-legal font-bold text-[#171717] dark:text-white">
            {recentAuditActivityCount}
          </div>
          <p className="text-[11px] font-sans text-[#595959] dark:text-[#8E98A5] mt-1 truncate">
            custody events logged
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK ACTIONS: LARGE SOPHISTICATED ACTION CARDS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white">
            Quick Actions
          </h2>
          <span className="text-xs font-sans text-[#595959] dark:text-[#8E98A5]">
            Frequently utilized investigative workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Action 1: New FIR Analysis */}
          <div
            onClick={() => setCurrentView('new-complaint')}
            className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/50 rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] mb-3.5 group-hover:scale-105 transition-transform">
              <FileText className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-white">
                New FIR Analysis
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#A39E96] group-hover:text-[#B8955A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans mt-1 leading-relaxed">
              Draft & map complaints to statutory BNS 2023 penal sections
            </p>
          </div>

          {/* Action 2: Create Case Docket */}
          <div
            onClick={() => setCurrentView('case-workspace')}
            className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/50 rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] mb-3.5 group-hover:scale-105 transition-transform">
              <FolderPlus className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-white">
                Create Case
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#A39E96] group-hover:text-[#B8955A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans mt-1 leading-relaxed">
              Open a structured digital docket with chronology tracking
            </p>
          </div>

          {/* Action 3: Upload Document */}
          <div
            onClick={() => setCurrentView('document-vault')}
            className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/50 rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] mb-3.5 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-white">
                Upload Document
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#A39E96] group-hover:text-[#B8955A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans mt-1 leading-relaxed">
              Deposit forensic PDFs and evidence with cryptographic hashing
            </p>
          </div>

          {/* Action 4: Analyze Evidence */}
          <div
            onClick={() => setCurrentView('doc-intelligence')}
            className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/50 rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] mb-3.5 group-hover:scale-105 transition-transform">
              <FileSearch className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-white">
                Analyze Evidence
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#A39E96] group-hover:text-[#B8955A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans mt-1 leading-relaxed">
              Run AI OCR extraction, discrepancy detection, and clause audits
            </p>
          </div>

          {/* Action 5: Search Legal Records */}
          <div
            onClick={() => setCurrentView('research')}
            className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/50 rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] mb-3.5 group-hover:scale-105 transition-transform">
              <Search className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-white">
                Search Legal Records
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#A39E96] group-hover:text-[#B8955A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans mt-1 leading-relaxed">
              Instant statute search across BNS, BNSS, and precedent digests
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN OPERATIONAL WORKSPACE: MAIN DOSSIERS + JURISDICTIONAL DESK */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PRIMARY INVESTIGATING WORKSPACE TABS & DOCKETS (8 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Workspace Tabs Header */}
          <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-5 rounded-xl shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4 mb-4">
              <div>
                <h2 className="font-serif-legal font-bold text-xl text-[#171717] dark:text-white">
                  Investigating Workspace & Case Matrix
                </h2>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-0.5">
                  Manage active FIRs, verify statutory concordance, and check procedural rules
                </p>
              </div>

              <button
                onClick={() => setCurrentView('new-complaint')}
                className="btn-legal-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start FIR Draft</span>
              </button>
            </div>

            {/* Workspace Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveWorkspaceTab('dockets')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeWorkspaceTab === 'dockets'
                    ? 'bg-[#171717] text-white dark:bg-[#B8955A] dark:text-[#0E1520] font-semibold'
                    : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Active Dockets ({totalCases})</span>
              </button>

              <button
                onClick={() => setActiveWorkspaceTab('concordance')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeWorkspaceTab === 'concordance'
                    ? 'bg-[#171717] text-white dark:bg-[#B8955A] dark:text-[#0E1520] font-semibold'
                    : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>BNS 2023 Penal Concordance</span>
              </button>

              <button
                onClick={() => setActiveWorkspaceTab('playbook')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeWorkspaceTab === 'playbook'
                    ? 'bg-[#171717] text-white dark:bg-[#B8955A] dark:text-[#0E1520] font-semibold'
                    : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BNSS Investigation Rules</span>
              </button>

              <button
                onClick={() => setActiveWorkspaceTab('precedents')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeWorkspaceTab === 'precedents'
                    ? 'bg-[#171717] text-white dark:bg-[#B8955A] dark:text-[#0E1520] font-semibold'
                    : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D]'
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Precedents Digest</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ACTIVE CASE DOCKETS & MAGISTRATE COGNIZANCE QUEUE */}
          {/* ========================================================================= */}
          {activeWorkspaceTab === 'dockets' && (
            <div className="space-y-6">
              
              {/* Docket Control Bar */}
              <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
                
                {/* Search in dockets */}
                <div className="relative w-full md:w-80">
                  <Search className="w-3.5 h-3.5 text-[#A39E96] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by case ID, complainant, crime..."
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] py-2 pl-9 pr-3 text-xs text-[#171717] dark:text-[#E0E5EC] focus:border-[#B8955A] focus:outline-none rounded-lg font-sans placeholder:text-[#A39E96]"
                  />
                </div>

                {/* Status Triage Filter Pills */}
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[10px] font-sans uppercase text-[#595959] dark:text-[#8E98A5] font-semibold shrink-0 mr-1">STATUS:</span>
                  {[
                    { id: 'All', label: 'All', count: totalCases },
                    { id: 'Drafting', label: 'Drafting', count: draftingCount },
                    { id: 'Review Pending', label: 'Review Pending', count: reviewPendingCount },
                    { id: 'Submitted', label: 'Submitted', count: submittedCount },
                    { id: 'Verified', label: 'Verified', count: verifiedCount }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-3 py-1 text-xs font-sans rounded-md border transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        statusFilter === s.id
                          ? 'border-[#B8955A] bg-[#B8955A]/10 text-[#B8955A] font-semibold'
                          : 'border-[#E5E0D8] dark:border-[#1D2633] text-[#595959] dark:text-[#8E98A5] hover:border-[#B8955A]/40'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                        statusFilter === s.id 
                          ? 'bg-[#B8955A]/20 text-[#B8955A]' 
                          : 'bg-black/5 dark:bg-white/5 text-[#595959] dark:text-[#8E98A5]'
                      }`}>
                        {s.count}
                      </span>
                    </button>
                  ))}
                </div>

              </div>

              {/* Docket Table */}
              <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl p-6 shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
                {filteredCases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E0D8] dark:border-[#1D2633] text-[10px] font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] font-semibold">
                          <th className="py-3 px-3">Docket Ref</th>
                          <th className="py-3 px-3">Complainant</th>
                          <th className="py-3 px-3">Crime Category</th>
                          <th className="py-3 px-3">Key Provision</th>
                          <th className="py-3 px-3">Priority</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#1D2633]">
                        {filteredCases.map((c) => {
                          const primarySec = c.aiAnalysis?.sections?.[0]?.section || 'BNS 2023';
                          return (
                            <tr 
                              key={c.caseId}
                              onClick={() => setSelectedCase(c)}
                              className="hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D] transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-3 font-mono font-bold text-[#171717] dark:text-white">
                                {c.caseId}
                              </td>
                              <td className="py-3.5 px-3 font-medium text-[#171717] dark:text-[#E0E5EC]">
                                {c.complainant}
                                <span className="block text-[10px] text-[#595959] dark:text-[#8E98A5] font-normal">{c.incidentDate}</span>
                              </td>
                              <td className="py-3.5 px-3 text-[#595959] dark:text-[#8E98A5]">
                                {c.crimeType}
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 bg-[#F7F6F2] dark:bg-[#151F2D] text-[#B8955A] border border-[#B8955A]/30 text-[10px] font-mono font-bold rounded-md">
                                  {primarySec}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`text-[10px] font-sans font-semibold ${
                                  c.priority === 'Critical' ? 'text-red-600' : c.priority === 'High' ? 'text-amber-600' : 'text-[#595959] dark:text-[#8E98A5]'
                                }`}>
                                  {c.priority}
                                </span>
                              </td>
                              <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                                <CaseStatusBadge
                                  status={c.status}
                                  size="sm"
                                  interactive
                                  onStatusChange={(newStatus) => updateCaseStatus(c.caseId, newStatus)}
                                />
                              </td>
                              <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onOpenCaseWorkspace ? onOpenCaseWorkspace(c.caseId) : setCurrentView('case-workspace')}
                                    className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#1D2633] text-[#B8955A] rounded-md cursor-pointer transition-colors"
                                    title="Open Digital Case Folder Workspace"
                                  >
                                    <Folder className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onOpenCaseTimeline ? onOpenCaseTimeline(c.caseId) : setCurrentView('timeline')}
                                    className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#1D2633] text-[#595959] hover:text-[#B8955A] rounded-md cursor-pointer transition-colors"
                                    title="Open Case Chronology & Timeline"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedCase(c)}
                                    className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#1D2633] text-[#595959] hover:text-[#171717] dark:hover:text-white rounded-md cursor-pointer"
                                    title="View Case Dossier"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleExportQuickPDF(c)}
                                    className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#1D2633] text-[#B8955A] rounded-md cursor-pointer"
                                    title="Export Official PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-[#595959] dark:text-[#8E98A5] space-y-4">
                    <Scale className="w-12 h-12 mx-auto text-[#B8955A]/40" />
                    <p className="text-sm">No FIR dockets found in repository matching the filter.</p>
                    <button
                      onClick={() => setCurrentView('new-complaint')}
                      className="btn-legal-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      + Create New FIR Entry
                    </button>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t border-[#E5E0D8] dark:border-[#1D2633] flex items-center justify-between text-xs text-[#595959] dark:text-[#8E98A5]">
                  <span>Showing {filteredCases.length} of {totalCases} registered cases in station ledger</span>
                  <button
                    onClick={() => setCurrentView('drafts')}
                    className="text-[#B8955A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Repository View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BNS 2023 PENAL CONCORDANCE MATRIX */}
          {/* ========================================================================= */}
          {activeWorkspaceTab === 'concordance' && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-xl space-y-6 shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-legal font-bold text-xl text-[#171717] dark:text-white">
                    Bharatiya Nyaya Sanhita (BNS 2023) Statutory Cross-Reference Matrix
                  </h3>
                  <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                    Official concordance chart between repealing Indian Penal Code 1860 and BNS 2023 penal sections.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#A39E96] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={concordanceSearch}
                    onChange={(e) => setConcordanceSearch(e.target.value)}
                    placeholder="Filter sections..."
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] py-2 pl-8 pr-3 text-xs text-[#171717] dark:text-white focus:border-[#B8955A] focus:outline-none rounded-lg font-sans placeholder:text-[#A39E96]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConcordance.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A] rounded-xl space-y-2.5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-white dark:bg-[#1B2636] text-[#B8955A] border border-[#B8955A]/30 font-mono font-bold text-xs rounded-md">
                          {item.bns}
                        </span>
                        <span className="text-xs font-mono text-[#595959] dark:text-[#8E98A5]">
                          replaces <span className="line-through">{item.ipc}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(`${item.bns} (${item.crime}) - ${item.punishment}`)}
                        className="p-1 text-[#595959] dark:text-[#8E98A5] hover:text-[#B8955A] cursor-pointer"
                        title="Copy Provision"
                      >
                        {copiedStatute?.includes(item.bns) ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h4 className="font-serif-legal font-bold text-base text-[#171717] dark:text-white leading-snug">
                      {item.crime}
                    </h4>

                    <div className="p-3 bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-xs space-y-1">
                      <p className="text-[11px] font-sans text-[#B8955A] font-semibold">
                        {item.type}
                      </p>
                      <p className="text-[11px] text-[#595959] dark:text-[#8E98A5] leading-relaxed">
                        <strong className="text-[#171717] dark:text-white">Prescribed Sentence:</strong> {item.punishment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633] flex items-center justify-between text-xs text-[#595959] dark:text-[#8E98A5]">
                <span>Total 358 Sections in BNS 2023 codified replacing 511 Sections of IPC</span>
                <button
                  onClick={() => setCurrentView('research')}
                  className="text-[#B8955A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Legislative Research Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BNSS 2023 INVESTIGATION PLAYBOOK & SOP */}
          {/* ========================================================================= */}
          {activeWorkspaceTab === 'playbook' && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-xl space-y-6 shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8955A] font-bold block">
                  STATUTORY STANDARD OPERATING PROCEDURE
                </span>
                <h3 className="font-serif-legal font-bold text-xl text-[#171717] dark:text-white mt-1">
                  Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) Investigation Rules
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                  Mandatory procedural compliance milestones for Investigating Officers during intake, arrest, panchnama, and charge-sheet submission.
                </p>
              </div>

              <div className="space-y-3">
                {BNSS_PROCEDURAL_PLAYBOOK.map((step, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#171717] dark:bg-[#1B2636] text-[#B8955A] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-[#B8955A]/30">
                      0{idx + 1}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif-legal font-bold text-base text-[#171717] dark:text-white">
                          {step.title}
                        </h4>
                        <span className="px-2.5 py-0.5 bg-[#B8955A]/10 text-[#B8955A] border border-[#B8955A]/30 font-mono text-[10px] font-bold rounded-md">
                          {step.code}
                        </span>
                      </div>
                      <p className="text-xs text-[#595959] dark:text-[#8E98A5] leading-relaxed font-sans">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#171717] text-[#F7F6F2] border border-[#2B2B2B] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#B8955A]" />
                  <div className="text-xs font-sans">
                    <span className="font-bold text-white block">AUTOMATED COMPLIANCE CHECKS</span>
                    <span className="text-[#A39E96]">All FIRs drafted via Lawgic AI are evaluated against these 5 statutory rules.</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('new-complaint')}
                  className="btn-legal-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0"
                >
                  Draft Complaint Now
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: JUDICIAL PRECEDENTS DIGEST */}
          {/* ========================================================================= */}
          {activeWorkspaceTab === 'precedents' && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-xl space-y-6 shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8955A] font-bold block">
                  APEX COURT JURISPRUDENCE
                </span>
                <h3 className="font-serif-legal font-bold text-xl text-[#171717] dark:text-white mt-1">
                  Supreme Court Benchmark Rulings for Investigating Officers
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                  Authoritative case law establishing binding standards for FIR recording, bail opposition, and electronic evidence admissibility.
                </p>
              </div>

              <div className="space-y-4">
                {LANDMARK_BENCHMARKS.map((item) => {
                  const isExpanded = expandedPrecedent === item.id;
                  return (
                    <div 
                      key={item.id}
                      className="bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A] rounded-xl overflow-hidden transition-colors"
                    >
                      <div 
                        onClick={() => setExpandedPrecedent(isExpanded ? null : item.id)}
                        className="p-4 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#B8955A] font-bold bg-[#B8955A]/10 px-2 py-0.5 rounded-md">
                              {item.statute}
                            </span>
                            <span className="text-[10px] font-mono text-[#595959] dark:text-[#8E98A5]">
                              {item.bench}
                            </span>
                          </div>
                          <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white group-hover:text-[#B8955A] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs font-semibold text-[#595959] dark:text-[#8E98A5]">
                            {item.subject}
                          </p>
                        </div>

                        <div className="p-2 text-[#595959] dark:text-[#8E98A5] group-hover:text-[#B8955A] transition-colors">
                          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#E5E0D8] dark:border-[#1D2633] bg-white dark:bg-[#101823] space-y-3 text-xs">
                          <div>
                            <span className="font-mono text-[10px] uppercase font-bold text-[#B8955A] block">
                              JUDICIAL RATIO DECIDENDI:
                            </span>
                            <p className="text-[#171717] dark:text-[#E0E5EC] mt-1 leading-relaxed italic font-serif-legal text-sm">
                              "{item.ratio}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                            <button
                              onClick={() => handleCopy(`${item.title}\nRatio: ${item.ratio}`)}
                              className="text-[#B8955A] font-mono text-[11px] flex items-center gap-1.5 hover:underline cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Precedent Citation</span>
                            </button>
                            <button
                              onClick={() => setCurrentView('research')}
                              className="text-xs font-semibold text-[#171717] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Explore in Law Library</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: JURISDICTIONAL COMMAND DESK & STATUTE LOOKUP (4 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Station Identification & Duty Node */}
          <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 rounded-xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-5">
            <div className="flex items-start justify-between border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8955A] font-semibold block">
                  JURISDICTIONAL NODE
                </span>
                <h3 className="font-serif-legal text-lg font-bold text-[#171717] dark:text-white">
                  {user?.station || 'Parliament Street Police Station'}
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] font-sans">
                  District: Central Capital • State Police HQ
                </p>
              </div>
              <div className="w-9 h-9 border border-[#B8955A]/30 bg-[#F5EFE4] dark:bg-[#151F2D] rounded-lg flex items-center justify-center text-[#B8955A] shrink-0">
                <Scale className="w-4.5 h-4.5" strokeWidth={1.8} />
              </div>
            </div>

            {/* Officer Duty Profile */}
            <div className="p-3.5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#EFE9DF] dark:bg-[#1B2636] border border-[#B8955A]/30 flex items-center justify-center text-[#B8955A] font-mono text-xs font-bold">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'IO'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#171717] dark:text-white block">{user?.name || 'Duty Investigating Officer'}</span>
                  <span className="text-[10px] font-sans text-[#595959] dark:text-[#8E98A5]">{user?.role || 'Senior Inspector'} • {user?.badgeNumber || 'Badge DL-8492'}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#059669]/10 text-[#059669] dark:bg-[#059669]/20 dark:text-[#10B981] border border-[#059669]/20 text-[10px] font-sans font-semibold rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                ON DUTY
              </span>
            </div>

            {/* Statutory Framework */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-sans">
              <div className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md">
                <span className="text-[#595959] dark:text-[#8E98A5] block text-[9px] uppercase tracking-wider">CODE</span>
                <strong className="text-[#B8955A] font-medium">BNS 2023</strong>
              </div>
              <div className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md">
                <span className="text-[#595959] dark:text-[#8E98A5] block text-[9px] uppercase tracking-wider">PROCEDURE</span>
                <strong className="text-[#171717] dark:text-white font-medium">BNSS 2023</strong>
              </div>
              <div className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-md">
                <span className="text-[#595959] dark:text-[#8E98A5] block text-[9px] uppercase tracking-wider">EVIDENCE</span>
                <strong className="text-[#171717] dark:text-white font-medium">BSA 2023</strong>
              </div>
            </div>
          </div>

          {/* Instant Statute Quick-Lookup Widget */}
          <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 rounded-xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1D2633] pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
                <h3 className="text-xs font-sans uppercase font-bold text-[#171717] dark:text-white tracking-wider">
                  STATUTE LOOKUP (BNS / IPC)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#595959] dark:text-[#8E98A5]">INSTANT MATRIX</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#A39E96] absolute left-3 top-2.5" />
              <input
                type="text"
                value={concordanceSearch}
                onChange={(e) => setConcordanceSearch(e.target.value)}
                placeholder="Query: 'theft', '302', 'fraud', 'assault'..."
                className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] py-2 pl-9 pr-3 text-xs text-[#171717] dark:text-white focus:border-[#B8955A] focus:outline-none rounded-lg font-sans placeholder:text-[#A39E96]"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredConcordance.slice(0, 4).map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-[#F7F6F2] hover:bg-[#F2ECE1] dark:bg-[#151F2D] dark:hover:bg-[#1A2637] border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A]/40 rounded-lg text-xs space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#B8955A] text-[11px]">
                      {item.bns}
                    </span>
                    <span className="text-[10px] font-mono text-[#595959] dark:text-[#8E98A5] line-through">
                      {item.ipc}
                    </span>
                  </div>
                  <p className="text-[#171717] dark:text-white text-xs font-medium leading-tight truncate">
                    {item.crime}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-sans pt-1 text-[#595959] dark:text-[#8E98A5]">
                    <span className="truncate max-w-[170px]">{item.category}</span>
                    <button 
                      onClick={() => handleCopy(`${item.bns} (${item.crime}) - ${item.punishment}`)}
                      className="text-[#B8955A] hover:text-[#947641] flex items-center gap-1 cursor-pointer"
                      title="Copy Legal Citation"
                    >
                      {copiedStatute?.includes(item.bns) ? <Check className="w-3 h-3 text-[#059669]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Station Daily Roznamcha & Cryptographic Ledger Audit */}
          <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 rounded-xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1D2633] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#B8955A]" strokeWidth={1.8} />
                <h3 className="text-xs font-sans uppercase font-bold text-[#171717] dark:text-white tracking-wider">
                  STATION ROZNAMCHA LOGS
                </h3>
              </div>
              <span className="text-[9px] font-sans text-[#059669] bg-[#059669]/10 px-1.5 py-0.5 rounded border border-[#059669]/20 font-bold">
                LIVE
              </span>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 text-xs">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 4).map((log, idx) => (
                  <div key={log.id || idx} className="p-2.5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#B8955A] font-bold">{log.action}</span>
                      <span className="text-[#595959] dark:text-[#8E98A5]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#595959] dark:text-[#8E98A5] leading-snug truncate">
                      {log.details || `Officer ${log.userName} (${log.userRole})`}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[#595959] dark:text-[#8E98A5] text-xs font-sans">
                  No events recorded in current shift.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#E5E0D8] dark:border-[#1D2633] flex items-center justify-between text-[10px] font-mono text-[#595959] dark:text-[#8E98A5]">
              <span>ISO 27001 SECURED</span>
              <span>SECTION 63 BSA VERIFIED</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* CASE DOSSIER MODAL / DETAIL DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 bg-[#08121D]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-[#171717] dark:text-[#E0E5EC]"
            >
              <div className="flex items-start justify-between border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xl text-[#171717] dark:text-white">
                      {selectedCase.caseId}
                    </span>
                    <CaseStatusBadge
                      status={selectedCase.status}
                      size="md"
                      interactive
                      onStatusChange={(newStatus) => {
                        updateCaseStatus(selectedCase.caseId, newStatus);
                        setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                    Station: {selectedCase.policeStation} • District: {selectedCase.district}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1.5 text-[#595959] hover:text-[#171717] dark:hover:text-white hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D] rounded-md transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Action & Status Triage Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl text-xs">
                <div className="flex items-center gap-2 font-mono flex-wrap">
                  <span className="text-[#595959] dark:text-[#8E98A5] text-[10px] uppercase font-bold">STATUS TRIAGE:</span>
                  {(['Drafting', 'Review Pending', 'Submitted', 'Verified', 'Closed'] as const).map((s) => {
                    const isCurrent = selectedCase.status === s || 
                      (s === 'Drafting' && selectedCase.status === 'Draft') || 
                      (s === 'Review Pending' && selectedCase.status === 'Pending') || 
                      (s === 'Verified' && selectedCase.status === 'Registered');

                    return (
                      <button
                        key={s}
                        onClick={() => {
                          updateCaseStatus(selectedCase.caseId, s);
                          setSelectedCase(prev => prev ? { ...prev, status: s } : null);
                        }}
                        className={`px-2.5 py-1 text-[10px] rounded-md border cursor-pointer transition-colors ${
                          isCurrent
                            ? 'border-[#B8955A] bg-[#B8955A]/15 text-[#B8955A] font-bold'
                            : 'border-[#E5E0D8] dark:border-[#1D2633] text-[#595959] dark:text-[#8E98A5] hover:border-[#B8955A]/40'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onOpenCaseWorkspace) {
                        onOpenCaseWorkspace(selectedCase.caseId);
                      } else {
                        setCurrentView('case-workspace');
                      }
                      setSelectedCase(null);
                    }}
                    className="px-3 py-1.5 bg-[#171717] dark:bg-[#1B2636] hover:bg-[#2B2B2B] text-[#B8955A] border border-[#B8955A]/30 rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Open Digital Folder</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenCaseTimeline) {
                        onOpenCaseTimeline(selectedCase.caseId);
                      } else {
                        setCurrentView('timeline');
                      }
                      setSelectedCase(null);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-[#101823] hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D] text-[#595959] dark:text-[#8E98A5] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>View Timeline</span>
                  </button>

                  <button
                    onClick={() => handleExportQuickPDF(selectedCase)}
                    disabled={isExportingPDF}
                    className="btn-legal-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPDF ? 'Exporting...' : 'Export PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="bg-white dark:bg-[#151F2D] text-[#171717] dark:text-[#E0E5EC] p-6 border border-[#E5E0D8] dark:border-[#1D2633] font-sans text-xs space-y-5 rounded-xl">
                <div className="text-center border-b border-[#E5E0D8] dark:border-[#1D2633] pb-3">
                  <h3 className="font-serif-legal font-bold text-base uppercase tracking-wider text-[#171717] dark:text-white">
                    POLICE CASE DOSSIER & INVESTIGATION SUMMARY
                  </h3>
                  <p className="font-mono text-[10px] text-[#595959] dark:text-[#8E98A5]">
                    REF: {selectedCase.caseId} • POLICE STATION: {selectedCase.policeStation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-[#E5E0D8] dark:border-[#1D2633] p-4 bg-[#F7F6F2] dark:bg-[#101823] rounded-lg">
                  <div>
                    <span className="text-[#595959] dark:text-[#8E98A5] block font-mono text-[10px] uppercase font-bold">COMPLAINANT</span>
                    <strong className="text-sm text-[#171717] dark:text-white">{selectedCase.complainant}</strong>
                    <span className="block text-[#595959] dark:text-[#8E98A5]">{selectedCase.complainantAddress || 'Address on record'}</span>
                    <span className="block text-[#595959] dark:text-[#8E98A5] font-mono">{selectedCase.complainantPhone}</span>
                  </div>
                  <div>
                    <span className="text-[#595959] dark:text-[#8E98A5] block font-mono text-[10px] uppercase font-bold">INCIDENT PARTICULARS</span>
                    <strong className="text-sm text-[#171717] dark:text-white">{selectedCase.incidentDate} at {selectedCase.incidentTime}</strong>
                    <span className="block text-[#595959] dark:text-[#8E98A5]">Offence: {selectedCase.crimeType}</span>
                    <span className="block text-[#595959] dark:text-[#8E98A5] font-mono">Priority: {selectedCase.priority}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] text-[#595959] dark:text-[#8E98A5] uppercase font-bold block">
                    RECORDED COMPLAINT STATEMENT:
                  </span>
                  <div className="p-3 bg-[#F7F6F2] dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg whitespace-pre-line leading-relaxed text-[#171717] dark:text-[#C8D1DC]">
                    {selectedCase.incidentDescription}
                  </div>
                </div>

                {selectedCase.aiAnalysis?.sections && (
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-[#595959] dark:text-[#8E98A5] uppercase font-bold block">
                      APPLICABLE PENAL PROVISIONS (BNS 2023):
                    </span>
                    <div className="space-y-2">
                      {selectedCase.aiAnalysis.sections.map((sec: any, i: number) => (
                        <div key={i} className="p-3 bg-[#F7F6F2] dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg">
                          <strong className="text-[#171717] dark:text-white">{sec.section}</strong>
                          <p className="text-[11px] text-[#595959] dark:text-[#8E98A5] mt-0.5">{sec.reasoning?.[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
