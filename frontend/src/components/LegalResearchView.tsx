import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Globe, 
  Loader2, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  Scale, 
  Check, 
  Copy, 
  ShieldAlert, 
  FileText,
  Gavel,
  Bookmark,
  Layers,
  ChevronRight,
  Filter,
  Eye,
  Hash,
  ArrowRight,
  ArrowLeft,
  Info,
  ShieldCheck,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchLegalPrecedents, SearchGroundingResponse } from '../gemini';
import { 
  extractDetectedSections, 
  HyperlinkedLegalText, 
  LegislativeDetailModal 
} from '../utils/legalParser';
import { LegislativeSection, STATUTORY_DATABASE, findStatutorySection } from '../data/statutoryDatabase';

interface LegalResearchViewProps {
  caseId?: string;
  onBack?: () => void;
  initialQuery?: string;
}

export const LegalResearchView: React.FC<LegalResearchViewProps> = ({
  caseId,
  onBack,
  initialQuery = ''
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'concordance' | 'landmarks' | 'annotator'>('search');
  const [selectedStatute, setSelectedStatute] = useState('All Statutes');
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<SearchGroundingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedModalSection, setSelectedModalSection] = useState<LegislativeSection | null>(null);

  // Dedicated Text Annotator State
  const [annotatorText, setAnnotatorText] = useState<string>(
    `The accused individuals intercepted the victim on Ring Road, forcibly seizing his gold chain under Section 304 BNS (formerly Section 379/356 IPC) and causing blunt bodily injury under Section 115(2) BNS (Section 323 IPC). Furthermore, the suspects issued lethal threats attract Section 351(2) BNS (Section 506 IPC).

The Investigating Officer registered FIR under Section 173 BNSS (Section 154 CrPC) without preliminary delay in compliance with Lalita Kumari guidelines. The scene was videographed under Section 105 BNSS, and surrounding commercial CCTV footage with Section 63 BSA certificate (Section 65B Evidence Act) was seized. Arrest was executed following Section 35 BNSS checklist, and police remand was sought under Section 187 BNSS (Section 167 CrPC).`
  );

  // Statute filter list
  const statutes = [
    'All Statutes',
    'Bharatiya Nyaya Sanhita (BNS 2023)',
    'Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)',
    'Bharatiya Sakshya Adhiniyam (BSA 2023)',
    'Constitution of India',
    'Protection of Children (POCSO Act)',
    'Information Technology Act (2000)',
    'Narcotic Drugs & Psychotropic Substances (NDPS)'
  ];

  // BNS vs IPC Concordance database
  const concordanceData = [
    {
      bns: 'Section 103 BNS',
      ipc: 'Section 302 IPC',
      sectionId: 'bns-103',
      title: 'Punishment for Murder',
      ingredients: 'Intentional causing of death or bodily injury sufficient in ordinary course to cause death.',
      punishment: 'Death or Imprisonment for life, and fine',
      status: 'Cognizable • Non-Bailable • Sessions Court'
    },
    {
      bns: 'Section 304 BNS',
      ipc: 'New Specific Offence',
      sectionId: 'bns-304',
      title: 'Snatching (Sudden / Forcible Seizure)',
      ingredients: 'Sudden, quick or forcible seizing or grabbing of movable property from person.',
      punishment: 'Imprisonment up to 3 years and fine',
      status: 'Cognizable • Non-Bailable • Magistrate 1st Class'
    },
    {
      bns: 'Section 303(2) BNS',
      ipc: 'Section 379 IPC',
      sectionId: 'bns-303-2',
      title: 'Theft',
      ingredients: 'Dishonest taking of movable property out of possession of any person without consent.',
      punishment: 'Imprisonment up to 3 years, or fine, or both',
      status: 'Cognizable • Non-Bailable • Any Magistrate'
    },
    {
      bns: 'Section 318(4) BNS',
      ipc: 'Section 420 IPC',
      sectionId: 'bns-318-4',
      title: 'Cheating and Dishonestly Inducing Delivery of Property',
      ingredients: 'Deception causing delivery of any property or alteration of valuable security.',
      punishment: 'Imprisonment up to 7 years and fine',
      status: 'Cognizable • Non-Bailable • Magistrate First Class'
    },
    {
      bns: 'Section 64 BNS',
      ipc: 'Section 376 IPC',
      sectionId: 'bns-64',
      title: 'Punishment for Rape',
      ingredients: 'Sexual intercourse without consent, against will, or under false belief.',
      punishment: 'Rigorous imprisonment not less than 10 years, up to life, and fine',
      status: 'Cognizable • Non-Bailable • Sessions Court'
    },
    {
      bns: 'Section 351(2) BNS',
      ipc: 'Section 506 IPC',
      sectionId: 'bns-351-2',
      title: 'Criminal Intimidation',
      ingredients: 'Threatening another with injury to person, reputation or property with intent to cause alarm.',
      punishment: 'Imprisonment up to 2 years, or fine, or both',
      status: 'Non-Cognizable (Part I) • Bailable • Any Magistrate'
    },
    {
      bns: 'Section 115(2) BNS',
      ipc: 'Section 323 IPC',
      sectionId: 'bns-115-2',
      title: 'Voluntarily Causing Hurt',
      ingredients: 'Doing an act with intention of thereby causing hurt to any person.',
      punishment: 'Imprisonment up to 1 year, or fine up to ₹10,000, or both',
      status: 'Non-Cognizable • Bailable • Any Magistrate'
    }
  ];

  // Landmark Precedent Digest
  const landmarkCases = [
    {
      title: 'Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1',
      court: 'Supreme Court of India (5-Judge Constitution Bench)',
      topic: 'Mandatory FIR Registration',
      relatedSection: 'bnss-173',
      ratio: 'Registration of FIR is mandatory under Section 154 CrPC (now Section 173 BNSS) if information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such a situation.'
    },
    {
      title: 'Arnesh Kumar v. State of Bihar (2014) 8 SCC 273',
      court: 'Supreme Court of India',
      topic: 'Arrest Guidelines for Offences Under 7 Years',
      relatedSection: 'bnss-35',
      ratio: 'Police officers shall not automatically arrest accused when offence is punishable with imprisonment up to 7 years. Mandatory notice of appearance under Sec 41A CrPC (now BNSS § 35(3)) must be served.'
    },
    {
      title: 'Arjun Panditrao Khotkar v. Kailash Kushanrao (2020) 7 SCC 1',
      court: 'Supreme Court of India (3-Judge Bench)',
      topic: 'Admissibility of Electronic Records & Mandatory Certificate',
      relatedSection: 'bsa-63',
      ratio: 'Certificate under Section 65B(4) Evidence Act (now Section 63(4) BSA 2023) is a non-negotiable condition precedent to the admissibility of secondary electronic records.'
    },
    {
      title: 'D.K. Basu v. State of West Bengal (1997) 1 SCC 416',
      court: 'Supreme Court of India',
      topic: 'Arrestee Rights & Custodial Safeguards',
      relatedSection: 'bnss-35',
      ratio: 'Lays down mandatory 11-point requirements including preparation of arrest memo, medical examination every 48 hours, and informing relatives upon custody.'
    }
  ];

  // Dynamically detected sections in the search query
  const queryDetectedSections = useMemo(() => {
    return extractDetectedSections(query);
  }, [query]);

  // Dynamically detected sections in the annotator text
  const annotatorDetectedSections = useMemo(() => {
    return extractDetectedSections(annotatorText);
  }, [annotatorText]);

  const handleSearch = async (forcedQuery?: string) => {
    const q = forcedQuery || query;
    if (!q.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const fullQuery = selectedStatute !== 'All Statutes' ? `[${selectedStatute}] ${q}` : q;
      const data = await searchLegalPrecedents(fullQuery);
      setResult(data);
      if (activeTab !== 'search') {
        setActiveTab('search');
      }
    } catch (err) {
      console.error(err);
      alert('Search failed. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResults = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      
      {/* 1. HEADER BANNER */}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A38038] dark:text-[#D5B875] font-bold block">
                  NATIONAL STATUTORY & CASE LAW LIBRARY
                </span>
                {caseId && (
                  <span className="px-2 py-0.5 bg-[#1E2D3E] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold rounded-xs">
                    CASE: {caseId}
                  </span>
                )}
              </div>
              <h1 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#08121D] dark:text-white">
                Legal Research & Precedent Search
              </h1>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Cross-indexed repository of the Bharatiya Nyaya Sanhita (BNS 2023), BNSS, BSA, and Supreme Court ratio decidendi with live statutory section hyperlinking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#101C29] border border-[#C6A15B]/30 rounded-sm text-[#D5B875] text-xs font-mono">
            <Globe className="w-4 h-4 text-[#C6A15B] animate-pulse" />
            <span>Auto-Hyperlink & Grounding Active</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/50 font-bold'
                : 'text-[#6D7278] hover:text-[#08121D] dark:hover:text-white hover:bg-[#FFFFFF] dark:hover:bg-[#101C29]'
            }`}
          >
            01 • Neural Precedent Search
          </button>

          <button
            onClick={() => setActiveTab('annotator')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'annotator'
                ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/50 font-bold'
                : 'text-[#6D7278] hover:text-[#08121D] dark:hover:text-white hover:bg-[#FFFFFF] dark:hover:bg-[#101C29]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>02 • Text Inspector & Auto-Hyperlinker</span>
          </button>

          <button
            onClick={() => setActiveTab('concordance')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
              activeTab === 'concordance'
                ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/50 font-bold'
                : 'text-[#6D7278] hover:text-[#08121D] dark:hover:text-white hover:bg-[#FFFFFF] dark:hover:bg-[#101C29]'
            }`}
          >
            03 • BNS 2023 vs IPC Concordance
          </button>

          <button
            onClick={() => setActiveTab('landmarks')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
              activeTab === 'landmarks'
                ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/50 font-bold'
                : 'text-[#6D7278] hover:text-[#08121D] dark:hover:text-white hover:bg-[#FFFFFF] dark:hover:bg-[#101C29]'
            }`}
          >
            04 • Landmark Rulings Digest
          </button>
        </div>
      </div>

      {/* TAB 1: NEURAL SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          
          {/* Search Box */}
          <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-4 shadow-sm">
            
            {/* Statute Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-3.5 h-3.5 text-[#8C96A3] shrink-0" />
              <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold shrink-0">FILTER STATUTE:</span>
              {statutes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatute(s)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-sm border whitespace-nowrap transition-colors cursor-pointer ${
                    selectedStatute === s
                      ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] font-bold'
                      : 'border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:border-[#C6A15B]/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input & Action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C96A3]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter legal query or type sections (e.g. 'Is bail permissible under Section 318(4) BNS or Section 420 IPC?')..."
                  className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] py-3 pl-10 pr-4 text-sm focus:border-[#C6A15B] focus:outline-none rounded-sm font-sans"
                />
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                className="btn-legal-gold px-6 py-3 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#08121D]" />
                    <span>Searching Precedents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#08121D]" />
                    <span>Search Case Law</span>
                  </>
                )}
              </button>
            </div>

            {/* LIVE AUTOMATIC INPUT SECTION DETECTION BANNER */}
            {queryDetectedSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-[#C6A15B]/10 border border-[#C6A15B]/30 rounded-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#A38038] dark:text-[#D5B875] font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>AUTOMATICALLY DETECTED LEGISLATIVE SECTIONS ({queryDetectedSections.length}):</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8C96A3]">Click any section to inspect statutory definition & precedents</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {queryDetectedSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedModalSection(sec)}
                      className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#08121D] hover:bg-[#C6A15B]/20 border border-[#C6A15B]/50 rounded-sm text-xs font-mono font-bold text-[#A38038] dark:text-[#D5B875] flex items-center gap-1.5 shadow-xs cursor-pointer group transition-all"
                    >
                      <Scale className="w-3 h-3 text-[#C6A15B]" />
                      <span>{sec.sectionDisplay}</span>
                      <span className="text-[10px] font-normal text-[#6D7278] dark:text-[#8C96A3]">({sec.title})</span>
                      <ArrowRight className="w-3 h-3 text-[#8C96A3] group-hover:text-[#C6A15B] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Inquiries */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-mono text-[#8C96A3]">QUICK INQUIRIES:</span>
              {[
                'Lalita Kumari mandatory FIR guidelines under Section 173 BNSS',
                'Arnesh Kumar notice under BNSS Section 35(3)',
                'Cheating ingredients under Section 318(4) BNS 2023 vs Section 420 IPC',
                'Electronic records certificate under Section 63 BSA 2023 (Section 65B)',
                'Snatching offence under Section 304 BNS 2023'
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(p); }}
                  className="text-[10px] font-mono text-[#5B636E] dark:text-[#B4BCC6] bg-[#FFFFFF] dark:bg-[#08121D] hover:border-[#C6A15B] border border-[#DDD8CE] dark:border-[#1E2D3E] px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

          </div>

          {/* Results Output */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Search Queries Executed */}
                {result.searchQueries && result.searchQueries.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs font-mono rounded-sm">
                    <span className="text-[#8C96A3] font-bold">GROUNDED LEGAL QUERIES:</span>
                    {result.searchQueries.map((sq, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#C6A15B]/30 text-[#A38038] dark:text-[#D5B875] rounded-sm text-[11px]">
                        "{sq}"
                      </span>
                    ))}
                  </div>
                )}

                {/* Primary Legal Opinion & Ratio Card with Automatic Hyperlinking */}
                <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
                    <div className="flex items-center gap-2.5">
                      <Scale className="w-5 h-5 text-[#C6A15B]" />
                      <h3 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white">
                        Judicial Precedent & Ratio Decidendi
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] bg-[#C6A15B]/10 px-2 py-1 border border-[#C6A15B]/30 rounded-xs hidden sm:inline-block">
                        Interactive Statutory Hyperlinks Enabled
                      </span>
                      <button
                        onClick={copyResults}
                        className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-xs font-mono rounded-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#C6A15B]" />}
                        <span>{copied ? 'Copied' : 'Copy Opinion'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AUTO-HYPERLINKED TEXT BODY */}
                  <div className="max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-[#171A1E] dark:text-[#E8ECEF] font-sans">
                    <HyperlinkedLegalText 
                      text={result.text} 
                      onSelectSection={(sec) => setSelectedModalSection(sec)} 
                    />
                  </div>

                  {/* Sources / Verified Citations */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] space-y-2">
                      <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold block">
                        VERIFIED STATUTORY & JUDICIAL SOURCES:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.web?.uri || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm text-xs flex items-center justify-between group transition-colors"
                          >
                            <span className="truncate font-medium text-[#171A1E] dark:text-[#E8ECEF] group-hover:text-[#A38038] dark:group-hover:text-[#D5B875]">
                              {s.web?.title || 'Judicial Precedent Reference'}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[#8C96A3] group-hover:text-[#C6A15B] shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* TAB 2: DEDICATED STATUTORY TEXT INSPECTOR & AUTO-HYPERLINKER */}
      {activeTab === 'annotator' && (
        <div className="space-y-6">
          <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-6">
            <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold">
                  REAL-TIME STATUTORY CITATION DETECTOR & ANNOTATOR
                </span>
              </div>
              <h3 className="font-serif-legal text-2xl sm:text-3xl font-bold text-[#08121D] dark:text-white mt-1">
                FIR & Legal Brief Section Hyperlinker
              </h3>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Type or paste any legal brief, FIR narrative, witness statement, or remand application. The system automatically detects, tokenizes, and converts every BNS, IPC, BNSS, BSA section number into interactive legislative links and annotations.
              </p>
            </div>

            {/* Input & Live Hyperlink Side-by-Side / Stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Text Input Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#8C96A3] uppercase font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Raw Input Text:</span>
                  </label>
                  <button
                    onClick={() => setAnnotatorText('')}
                    className="text-[11px] font-mono text-[#8C96A3] hover:text-red-500 cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>

                <textarea
                  value={annotatorText}
                  onChange={(e) => setAnnotatorText(e.target.value)}
                  rows={10}
                  placeholder="Paste or type text containing BNS/IPC sections (e.g. 'Accused committed theft under Section 303(2) BNS, cheating under Section 318(4) BNS, and electronic record was produced under Section 63 BSA')..."
                  className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-4 text-xs sm:text-sm focus:border-[#C6A15B] focus:outline-none rounded-sm font-mono leading-relaxed resize-y"
                />

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-[#8C96A3]">Sample Templates:</span>
                  <button
                    onClick={() => setAnnotatorText('FIR registered under Section 173 BNSS for offence of snatching under Section 304 BNS and causing hurt under Section 115(2) BNS. Electronic CCTV evidence certified under Section 63 BSA.')}
                    className="text-[10px] font-mono bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] px-2 py-0.5 rounded-xs text-[#A38038] dark:text-[#D5B875] cursor-pointer"
                  >
                    Street Snatching FIR
                  </button>
                  <button
                    onClick={() => setAnnotatorText('Cyber fraud complaint disclosing dishonest inducement under Section 318(4) BNS (Section 420 IPC) and criminal conspiracy. Search conducted under Section 105 BNSS and notice issued under Section 35 BNSS.')}
                    className="text-[10px] font-mono bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] px-2 py-0.5 rounded-xs text-[#A38038] dark:text-[#D5B875] cursor-pointer"
                  >
                    Cyber Cheating Brief
                  </button>
                </div>
              </div>

              {/* Live Interactive Hyperlinked Render */}
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#8C96A3] uppercase font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Live Annotated & Hyperlinked Output:</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-xs">
                    {annotatorDetectedSections.length} Sections Detected
                  </span>
                </div>

                <div className="flex-1 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line rounded-sm min-h-[220px]">
                  {annotatorText ? (
                    <HyperlinkedLegalText
                      text={annotatorText}
                      onSelectSection={(sec) => setSelectedModalSection(sec)}
                    />
                  ) : (
                    <span className="text-[#8C96A3] italic font-sans">
                      Enter legal text on the left to see live interactive section hyperlinks and legislative definitions.
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Detected Sections Matrix Breakdown */}
            {annotatorDetectedSections.length > 0 && (
              <div className="pt-6 border-t border-[#DDD8CE] dark:border-[#1E2D3E] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8C96A3] uppercase font-bold flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-[#C6A15B]" />
                    <span>DETECTED STATUTORY SECTIONS SUMMARY & ANNOTATION MATRIX:</span>
                  </span>
                  <span className="text-xs text-[#5B636E] dark:text-[#8C96A3]">
                    Click any card for full statutory bare act text & landmark case laws
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {annotatorDetectedSections.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedModalSection(sec)}
                      className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-[#C6A15B]/20 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/40 font-mono font-bold text-xs rounded-xs">
                          {sec.sectionDisplay}
                        </span>
                        <span className="text-[10px] font-mono text-[#10B981]">
                          {sec.isCognizable ? 'Cognizable' : 'Non-Cognizable'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-serif-legal font-bold text-sm text-[#08121D] dark:text-white group-hover:text-[#A38038] dark:group-hover:text-[#D5B875] transition-colors">
                          {sec.title}
                        </h4>
                        <p className="text-[11px] font-mono text-[#8C96A3] truncate mt-0.5">
                          {sec.concordanceDisplay}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-[10px] font-mono text-[#A38038] dark:text-[#D5B875]">
                        <span>View Bare Act & Precedents</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 3: BNS CONCORDANCE TABLE */}
      {activeTab === 'concordance' && (
        <div className="space-y-6">
          <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm">
            <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-6">
              <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold">
                STATUTORY COMPARATIVE MATRIX
              </span>
              <h3 className="font-serif-legal text-2xl font-bold text-[#08121D] dark:text-white">
                Bharatiya Nyaya Sanhita (2023) ⟷ Indian Penal Code (1860)
              </h3>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Official concordance table for transitional investigation, FIR formulation, and charge-sheet submission. Click any section badge for bare act text.
              </p>
            </div>

            <div className="space-y-4">
              {concordanceData.map((item, idx) => {
                const statutoryObj = findStatutorySection(item.bns);
                return (
                  <div 
                    key={idx}
                    className="p-5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/50 rounded-sm space-y-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => statutoryObj && setSelectedModalSection(statutoryObj)}
                          className="px-2.5 py-1 bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/40 hover:border-[#C6A15B] font-mono font-bold text-xs flex items-center gap-1 cursor-pointer rounded-xs"
                        >
                          <BookOpen className="w-3 h-3 text-[#C6A15B]" />
                          <span>{item.bns}</span>
                        </button>
                        <span className="text-xs font-mono text-[#8C96A3]">replaces</span>
                        <span className="px-2 py-0.5 bg-[#101C29] text-[#B4BCC6] border border-[#1E2D3E] font-mono text-xs">
                          {item.ipc}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 border border-[#10B981]/20">
                          {item.status}
                        </span>
                        {statutoryObj && (
                          <button
                            onClick={() => setSelectedModalSection(statutoryObj)}
                            className="text-xs font-mono text-[#A38038] dark:text-[#D5B875] hover:underline flex items-center gap-0.5 cursor-pointer ml-2"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#5B636E] dark:text-[#B4BCC6] mt-1">
                        <strong>Essential Ingredients:</strong> {item.ingredients}
                      </p>
                      <p className="text-xs text-[#A38038] dark:text-[#D5B875] font-mono mt-1">
                        <strong>Punishment:</strong> {item.punishment}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: LANDMARK RULINGS DIGEST */}
      {activeTab === 'landmarks' && (
        <div className="space-y-6">
          <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm">
            <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-6">
              <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold">
                CONSTITUTIONAL PRECEDENT COMPENDIUM
              </span>
              <h3 className="font-serif-legal text-2xl font-bold text-[#08121D] dark:text-white">
                Binding Supreme Court Guidelines for Police Personnel
              </h3>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Authoritative judicial ratio governing investigation protocols, FIR registration, and arrest safeguards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {landmarkCases.map((c, i) => {
                const statutoryObj = findStatutorySection(c.relatedSection);
                return (
                  <div 
                    key={i}
                    className="p-5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/50 rounded-sm space-y-3 flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold block">
                          {c.topic}
                        </span>
                        {statutoryObj && (
                          <button
                            onClick={() => setSelectedModalSection(statutoryObj)}
                            className="text-[10px] font-mono bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/30 px-1.5 py-0.5 rounded-xs hover:border-[#C6A15B] cursor-pointer"
                          >
                            {statutoryObj.sectionDisplay}
                          </button>
                        )}
                      </div>
                      <h4 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white">
                        {c.title}
                      </h4>
                      <span className="text-[11px] font-mono text-[#8C96A3] block mt-0.5">
                        {c.court}
                      </span>
                      <p className="text-xs text-[#5B636E] dark:text-[#B4BCC6] mt-3 leading-relaxed">
                        <strong>Ratio Decidendi:</strong>{' '}
                        <HyperlinkedLegalText
                          text={c.ratio}
                          onSelectSection={(sec) => setSelectedModalSection(sec)}
                        />
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-[11px] font-mono text-[#A38038] dark:text-[#D5B875]">
                      <span>ARTICLE 141 BINDING MANDATE</span>
                      <Gavel className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* LEGISLATIVE DEFINITION, CONCORDANCE & ANNOTATION MODAL */}
      <LegislativeDetailModal
        section={selectedModalSection}
        onClose={() => setSelectedModalSection(null)}
        onSearchSection={(secQuery) => {
          setQuery(secQuery);
          handleSearch(secQuery);
        }}
      />

    </motion.div>
  );
};

