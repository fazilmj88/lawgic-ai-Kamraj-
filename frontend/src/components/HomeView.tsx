import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Scale, 
  Search, 
  FileText, 
  BookOpen, 
  Gavel, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Layers,
  Database,
  UserCheck,
  Building2,
  Clock,
  Compass,
  FileSearch
} from 'lucide-react';
import { View } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomeViewProps {
  setCurrentView: (view: View) => void;
  onOpenResearchQuery?: (query: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setCurrentView, onOpenResearchQuery }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('BNS');
  
  // Interactive demo for the FIR preview
  const [demoComplaint, setDemoComplaint] = useState(
    'Complainant reports that at 11:30 PM near Central Bus Stand, two unidentified individuals stopped his vehicle, brandished a knife, used criminal force to snatch his gold chain (24g) and smartphone, and fled on an unregistered motorcycle.'
  );
  const [isAnalyzingDemo, setIsAnalyzingDemo] = useState(false);
  const [demoAnalyzed, setDemoAnalyzed] = useState(true);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onOpenResearchQuery) {
        onOpenResearchQuery(searchQuery);
      }
      setCurrentView('research');
    }
  };

  const handleRunDemoAnalysis = () => {
    setIsAnalyzingDemo(true);
    setTimeout(() => {
      setIsAnalyzingDemo(false);
      setDemoAnalyzed(true);
    }, 600);
  };

  return (
    <div className="w-full bg-[#F7F6F2] dark:bg-[#0A1017] text-[#171717] dark:text-[#E0E5EC] font-sans selection:bg-[#B8955A]/25 selection:text-[#171717]">
      
      {/* 1. CINEMATIC LUXURY HERO SECTION */}
      <section className="relative min-h-[86vh] flex items-center justify-center overflow-hidden border-b border-[#E5E0D8] dark:border-[#1E293B] bg-[#F7F6F2] dark:bg-[#0A1017]">
        {/* Subtle architectural atmosphere with soft overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-105 opacity-10 dark:opacity-20 mix-blend-luminosity"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=2000&q=85')`,
              backgroundPosition: 'center 35%'
            }}
          />
          {/* Subtle radial warmth for luxury feel */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,90,0.12),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-7">
              
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 border border-[#B8955A]/40 bg-white/80 dark:bg-[#121A26]/90 backdrop-blur-md rounded-full shadow-xs"
              >
                <div className="w-2 h-2 rounded-full bg-[#B8955A] animate-pulse" />
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B8955A]">
                  AI-Powered Indian Legal Intelligence
                </span>
              </motion.div>

              {/* Large Serif Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif-legal text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-[#171717] dark:text-white leading-[1.08]"
              >
                Intelligence for Law.<br />
                Precision for <span className="text-[#B8955A] italic font-normal">Justice.</span>
              </motion.h1>

              {/* Supporting Copy */}
              <motion.p 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-[#595959] dark:text-[#A0ABB8] max-w-xl font-normal leading-relaxed"
              >
                AI-assisted FIR guidance, statutory section matching under the Bharatiya Nyaya Sanhita (BNS 2023), deep legal research, and judicial precedent discovery engineered for law enforcement &amp; legal authorities.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3.5 pt-2"
              >
                <button
                  onClick={() => setCurrentView(user ? 'new-complaint' : 'dashboard')}
                  className="btn-legal-gold px-7 py-3.5 text-sm font-semibold tracking-wide flex items-center gap-2.5 cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4 text-[#171717]" />
                  <span>Start FIR Assistant</span>
                  <ArrowRight className="w-4 h-4 text-[#171717]" />
                </button>

                <button
                  onClick={() => setCurrentView('doc-intelligence')}
                  className="px-6 py-3.5 text-sm font-semibold tracking-wide border border-[#E5E0D8] dark:border-[#2A374A] bg-white dark:bg-[#141C28] text-[#171717] dark:text-white hover:border-[#B8955A] hover:bg-[#FAF9F5] transition-all rounded-xl flex items-center gap-2.5 cursor-pointer shadow-xs"
                >
                  <FileSearch className="w-4 h-4 text-[#B8955A]" />
                  <span>Document Intelligence</span>
                </button>

                <button
                  onClick={() => setCurrentView('research')}
                  className="px-6 py-3.5 text-sm font-medium tracking-wide text-[#595959] dark:text-[#A0ABB8] hover:text-[#171717] dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#B8955A]" />
                  <span>Explore Research</span>
                  <ChevronRight className="w-4 h-4 text-[#B8955A]" />
                </button>
              </motion.div>

              {/* Trust Sub-Strip */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="pt-6 border-t border-[#E5E0D8] dark:border-[#1E293B] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-sans text-[#76808D]"
              >
                <span className="text-[#B8955A] font-bold tracking-wider uppercase text-[11px]">
                  COVERAGE FRAMEWORK:
                </span>
                <span className="flex items-center gap-1.5"><span className="text-[#B8955A]">•</span> BNS 2023</span>
                <span className="flex items-center gap-1.5"><span className="text-[#B8955A]">•</span> BNSS 2023</span>
                <span className="flex items-center gap-1.5"><span className="text-[#B8955A]">•</span> BSA 2023</span>
                <span className="flex items-center gap-1.5"><span className="text-[#B8955A]">•</span> CONSTITUTION</span>
                <span className="flex items-center gap-1.5"><span className="text-[#B8955A]">•</span> SUPREME COURT RATIO</span>
              </motion.div>

            </div>

            {/* Right Visual Accents - Pure Legal Composition */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="relative p-7 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl shadow-xl shadow-stone-200/40 dark:shadow-none">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1E293B] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#B8955A]/10 flex items-center justify-center">
                        <Scale className="w-4 h-4 text-[#B8955A]" />
                      </div>
                      <div>
                        <span className="font-serif-legal font-bold tracking-wide text-[#171717] dark:text-white text-base block">LAWGIC DOCKET</span>
                        <span className="text-[10px] text-[#8E98A5]">Official Case Registry</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-sans font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      NODE SYNCHRONIZED
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-[#595959] dark:text-[#A0ABB8]">
                    <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#162130] border border-[#E5E0D8] dark:border-[#223145] rounded-xl">
                      <div className="flex justify-between text-[11px] font-sans font-semibold mb-1">
                        <span className="text-[#8E98A5] uppercase tracking-wider">CRIMINAL LAW REFORM</span>
                        <span className="text-[#B8955A]">ACT 2023</span>
                      </div>
                      <p className="font-serif-legal font-bold text-sm text-[#171717] dark:text-white">Bharatiya Nyaya Sanhita (BNS)</p>
                      <p className="text-[11px] text-[#76808D] mt-1">358 Sections with IPC 1860 concordance mapping &amp; penal ingredients</p>
                    </div>

                    <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#162130] border border-[#E5E0D8] dark:border-[#223145] rounded-xl">
                      <div className="flex justify-between text-[11px] font-sans font-semibold mb-1">
                        <span className="text-[#8E98A5] uppercase tracking-wider">PROCEDURAL EVIDENCE</span>
                        <span className="text-[#B8955A]">BNSS &amp; BSA</span>
                      </div>
                      <p className="font-serif-legal font-bold text-sm text-[#171717] dark:text-white">Forensic Timeline &amp; Cognizance</p>
                      <p className="text-[11px] text-[#76808D] mt-1">Zero FIR protocols, audio-video videography &amp; Section 63 BSA certificate</p>
                    </div>
                  </div>

                  <div className="pt-2 text-center border-t border-[#E5E0D8] dark:border-[#1E293B]">
                    <p className="text-[11px] font-sans text-[#8E98A5] flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B8955A]" />
                      <span>INSTITUTIONAL ENCRYPTION • SECURE AUDIT TRAIL</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. LEGAL SERVICES & CAPABILITIES (WARM EDITORIAL CARDS) */}
      <section className="bg-white dark:bg-[#0D141F] text-[#171717] dark:text-[#E0E5EC] py-20 sm:py-24 border-b border-[#E5E0D8] dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold mb-3">
              <span className="w-5 h-px bg-[#B8955A]" />
              LEGAL INTELLIGENCE SUITE
            </div>
            <h2 className="font-serif-legal text-3xl sm:text-5xl font-bold text-[#171717] dark:text-white leading-tight">
              One Unified Workspace. <br />
              Multiple Legal Capabilities.
            </h2>
            <p className="text-[#595959] dark:text-[#A0ABB8] text-base sm:text-lg mt-4 font-normal leading-relaxed">
              Designed specifically for police officers, investigating authorities, and legal advisors to accelerate statutory fact-finding and legal compliance.
            </p>
          </div>

          {/* 4 Editorial Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 01 FIR Assistant */}
            <div 
              onClick={() => setCurrentView('new-complaint')}
              className="p-7 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl group hover:bg-white dark:hover:bg-[#162130] hover:border-[#B8955A]/60 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="font-sans text-xs font-bold text-[#B8955A] tracking-widest block mb-4">01</span>
                <div className="w-11 h-11 mb-5 flex items-center justify-center text-[#171717] bg-[#EAE5D9] dark:bg-[#182333] group-hover:bg-[#B8955A] group-hover:text-white transition-colors rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white mb-2.5 group-hover:text-[#B8955A] transition-colors">
                  FIR Assistance
                </h3>
                <p className="text-[#595959] dark:text-[#A0ABB8] text-sm leading-relaxed mb-6 font-normal">
                  Convert complex incident narratives into structured, legally validated First Information Reports with automatic BNS section recommendations.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#171717] dark:text-white group-hover:text-[#B8955A]">
                <span>Launch Assistant</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* 02 Legal Research */}
            <div 
              onClick={() => setCurrentView('research')}
              className="p-7 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl group hover:bg-white dark:hover:bg-[#162130] hover:border-[#B8955A]/60 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="font-sans text-xs font-bold text-[#B8955A] tracking-widest block mb-4">02</span>
                <div className="w-11 h-11 mb-5 flex items-center justify-center text-[#171717] bg-[#EAE5D9] dark:bg-[#182333] group-hover:bg-[#B8955A] group-hover:text-white transition-colors rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white mb-2.5 group-hover:text-[#B8955A] transition-colors">
                  Statutory Research
                </h3>
                <p className="text-[#595959] dark:text-[#A0ABB8] text-sm leading-relaxed mb-6 font-normal">
                  Instantaneous lookup across the new Criminal Codes, Constitution of India, POCSO, NDPS, and Information Technology Act provisions.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#171717] dark:text-white group-hover:text-[#B8955A]">
                <span>Search Statutes</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* 03 Case Laws */}
            <div 
              onClick={() => setCurrentView('research')}
              className="p-7 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl group hover:bg-white dark:hover:bg-[#162130] hover:border-[#B8955A]/60 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="font-sans text-xs font-bold text-[#B8955A] tracking-widest block mb-4">03</span>
                <div className="w-11 h-11 mb-5 flex items-center justify-center text-[#171717] bg-[#EAE5D9] dark:bg-[#182333] group-hover:bg-[#B8955A] group-hover:text-white transition-colors rounded-xl">
                  <Gavel className="w-5 h-5" />
                </div>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white mb-2.5 group-hover:text-[#B8955A] transition-colors">
                  Case Precedents
                </h3>
                <p className="text-[#595959] dark:text-[#A0ABB8] text-sm leading-relaxed mb-6 font-normal">
                  Discover relevant High Court and Supreme Court judicial precedents, ratio decidendi, and binding arrest/bail guidelines.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#171717] dark:text-white group-hover:text-[#B8955A]">
                <span>Browse Judgments</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* 04 Case Timeline */}
            <div 
              onClick={() => setCurrentView('timeline')}
              className="p-7 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl group hover:bg-white dark:hover:bg-[#162130] hover:border-[#B8955A]/60 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="font-sans text-xs font-bold text-[#B8955A] tracking-widest block mb-4">04</span>
                <div className="w-11 h-11 mb-5 flex items-center justify-center text-[#171717] bg-[#EAE5D9] dark:bg-[#182333] group-hover:bg-[#B8955A] group-hover:text-white transition-colors rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white mb-2.5 group-hover:text-[#B8955A] transition-colors">
                  Case Timeline
                </h3>
                <p className="text-[#595959] dark:text-[#A0ABB8] text-sm leading-relaxed mb-6 font-normal">
                  Interactive Section 172 BNSS chronological case visualization with date, place of occurrence, evidence correlation, and AI milestone extraction.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#171717] dark:text-white group-hover:text-[#B8955A]">
                <span>Open Timeline</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. AI FIR ASSISTANT FEATURE (EDITORIAL SPLIT SCREEN) */}
      <section className="bg-[#F7F6F2] dark:bg-[#0A1017] py-20 sm:py-28 border-b border-[#E5E0D8] dark:border-[#1E293B] relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Narrative Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold">
                <span className="w-5 h-px bg-[#B8955A]" />
                AI FIR ASSISTANCE
              </div>

              <h2 className="font-serif-legal text-3xl sm:text-5xl font-bold text-[#171717] dark:text-white leading-tight">
                From Complaint <br />
                to Legal Insight.
              </h2>

              <p className="text-[#595959] dark:text-[#A0ABB8] text-base leading-relaxed font-normal">
                Lawgic AI parses plain-language incident statements into formal legal structures. It maps alleged acts directly to actionable statutory offences under the Bharatiya Nyaya Sanhita (BNS 2023) and cross-references corresponding IPC 1860 sections.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-sm text-[#171717] dark:text-[#E0E5EC]">
                  <CheckCircle2 className="w-4 h-4 text-[#B8955A] shrink-0 mt-0.5" />
                  <span>Automatic Cognizability &amp; Bailable status determination</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-[#171717] dark:text-[#E0E5EC]">
                  <CheckCircle2 className="w-4 h-4 text-[#B8955A] shrink-0 mt-0.5" />
                  <span>Check for essential penal ingredients and missing investigation facts</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-[#171717] dark:text-[#E0E5EC]">
                  <CheckCircle2 className="w-4 h-4 text-[#B8955A] shrink-0 mt-0.5" />
                  <span>Mandatory adherence to landmark Lalita Kumari guidelines</span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setCurrentView('new-complaint')}
                  className="btn-legal-gold px-8 py-3.5 text-sm font-semibold tracking-wide flex items-center gap-3 cursor-pointer shadow-md"
                >
                  <span>Launch FIR Assistant Workflow</span>
                  <ArrowRight className="w-4 h-4 text-[#171717]" />
                </button>
              </div>
            </div>

            {/* Right Interactive Preview Panel */}
            <div className="lg:col-span-7">
              <div className="border border-[#E5E0D8] dark:border-[#1E293B] bg-white dark:bg-[#121A26] p-6 sm:p-8 rounded-2xl shadow-sm">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1E293B] pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-widest text-[#B8955A] font-bold block">
                      INCIDENT ANALYSIS PREVIEW
                    </span>
                    <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white">Complainant Narrative Analysis</h4>
                  </div>
                  <span className="text-xs font-sans px-2.5 py-1 bg-[#FAF9F5] dark:bg-[#162130] border border-[#E5E0D8] dark:border-[#223145] text-[#595959] dark:text-[#A0ABB8] rounded-lg font-medium">
                    ENGINE: LAWGIC AI
                  </span>
                </div>

                {/* Complaint Input Box */}
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#76808D] block font-bold">
                    COMPLAINT DESCRIPTION
                  </label>
                  <textarea
                    value={demoComplaint}
                    onChange={(e) => setDemoComplaint(e.target.value)}
                    rows={3}
                    className="w-full bg-[#FAF9F5] dark:bg-[#162130] border border-[#E5E0D8] dark:border-[#223145] p-3 text-sm text-[#171717] dark:text-white focus:border-[#B8955A] focus:outline-none rounded-xl font-sans"
                    placeholder="Enter incident statement..."
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-[#8E98A5]">Try editing the narrative above</span>
                    <button
                      onClick={handleRunDemoAnalysis}
                      disabled={isAnalyzingDemo}
                      className="text-xs font-sans font-semibold text-[#B8955A] hover:text-[#9A7B44] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B8955A]" />
                      <span>{isAnalyzingDemo ? 'Analyzing...' : 'Re-analyze Provisions'}</span>
                    </button>
                  </div>
                </div>

                {/* Provision Matching Output */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans uppercase tracking-wider text-[#B8955A] font-bold">
                      POTENTIALLY RELEVANT PROVISIONS
                    </span>
                    <span className="text-[11px] font-sans font-medium text-[#76808D]">CONFIDENCE: 98% MATCH</span>
                  </div>

                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#162130] border-l-3 border-l-[#B8955A] border border-[#E5E0D8] dark:border-[#223145] rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif-legal font-bold text-[#171717] dark:text-white text-base">BNS § 309(4)</span>
                          <span className="text-[10px] font-sans px-2 py-0.5 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#223145] text-[#B8955A] font-medium rounded">
                            IPC § 392 (Robbery)
                          </span>
                        </div>
                        <span className="text-[10px] font-sans px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-full">
                          COGNIZABLE • NON-BAILABLE
                        </span>
                      </div>
                      <p className="text-xs text-[#595959] dark:text-[#A0ABB8] leading-relaxed">
                        Use of deadly weapon (knife) and force during snatching of gold ornament and phone constitutes aggravated robbery.
                      </p>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#162130] border-l-3 border-l-[#76808D] border border-[#E5E0D8] dark:border-[#223145] rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif-legal font-bold text-[#171717] dark:text-white text-base">BNS § 3(5)</span>
                          <span className="text-[10px] font-sans px-2 py-0.5 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#223145] text-[#B8955A] font-medium rounded">
                            IPC § 34 (Common Intention)
                          </span>
                        </div>
                        <span className="text-[10px] font-sans px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-full">
                          JOINT LIABILITY
                        </span>
                      </div>
                      <p className="text-xs text-[#595959] dark:text-[#A0ABB8] leading-relaxed">
                        Act committed by two individuals acting in concert on a shared motorcycle in furtherance of common intention.
                      </p>
                    </div>
                  </div>

                  {/* Disclaimer banner */}
                  <div className="p-3 bg-[#FAF9F5] dark:bg-[#162130] border border-[#E5E0D8] dark:border-[#223145] rounded-xl text-[11px] text-[#76808D] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#B8955A] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#171717] dark:text-white">Institutional Disclaimer:</strong> AI-generated statutory assistance. Final legal decision-making powers remain vested in sworn investigating officers.
                    </span>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. UNIVERSAL LEGAL RESEARCH ENGINE */}
      <section className="bg-white dark:bg-[#0D141F] py-20 sm:py-24 border-b border-[#E5E0D8] dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold mb-3">
              <span className="w-5 h-px bg-[#B8955A]" />
              LEGAL RESEARCH ENGINE
              <span className="w-5 h-px bg-[#B8955A]" />
            </div>
            <h2 className="font-serif-legal text-3xl sm:text-5xl font-bold text-[#171717] dark:text-white leading-tight">
              Search the Law. Understand the Context.
            </h2>
            <p className="text-[#595959] dark:text-[#A0ABB8] text-base mt-4 font-normal">
              Instantaneous semantic search across Supreme Court rulings, High Court orders, and statutory sections with Google Search grounding.
            </p>
          </div>

          {/* Large Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto mb-8">
            <div className="relative flex items-center">
              <Search className="w-6 h-6 text-[#B8955A] absolute left-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case laws, sections (e.g. BNS 103, BNSS 173), or legal questions..."
                className="w-full bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] py-4.5 pl-14 pr-36 text-base sm:text-lg text-[#171717] dark:text-white placeholder:text-[#8E98A5] focus:border-[#B8955A] focus:ring-1 focus:ring-[#B8955A] rounded-2xl shadow-sm focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2.5 btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-sans text-[#76808D]">
            <span className="text-[#B8955A] font-semibold mr-1">POPULAR TOPICS:</span>
            {[
              'Lalita Kumari FIR Mandate',
              'Arnesh Kumar Arrest Guidelines',
              'BNS 103 Murder Ingredients',
              'Section 63 BSA Electronic Admissibility',
              'Zero FIR Registration Procedure'
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  if (onOpenResearchQuery) onOpenResearchQuery(tag);
                  setCurrentView('research');
                }}
                className="px-3.5 py-1.5 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] hover:border-[#B8955A] text-[#595959] dark:text-[#A0ABB8] hover:text-[#171717] dark:hover:text-white transition-colors rounded-full cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 5. LEGAL LIBRARY (EDITORIAL ACTS BROWSER) */}
      <section className="bg-[#F7F6F2] dark:bg-[#0A1017] text-[#171717] dark:text-[#E0E5EC] py-20 sm:py-24 border-b border-[#E5E0D8] dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold mb-2">
                <span className="w-5 h-px bg-[#B8955A]" />
                STATUTORY LIBRARY
              </div>
              <h2 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#171717] dark:text-white">
                Explore Indian Law
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('research')}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-[#171717] dark:text-white hover:text-[#B8955A] cursor-pointer"
            >
              <span>View All 24 Acts &amp; Codes</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B8955A]" />
            </button>
          </div>

          {/* Editorial Table Rows */}
          <div className="divide-y divide-[#E5E0D8] dark:divide-[#1E293B] border-y border-[#E5E0D8] dark:border-[#1E293B]">
            
            {[
              {
                title: 'Bharatiya Nyaya Sanhita, 2023',
                category: 'Substantive Criminal Law',
                sections: '358 Sections',
                year: '2023 (In Force July 1, 2024)',
                desc: 'Replaces IPC 1860. Defines criminal offences, penalties, organized crime, terror acts, and mob lynching.'
              },
              {
                title: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
                category: 'Criminal Procedure & Investigation',
                sections: '531 Sections',
                year: '2023 (In Force July 1, 2024)',
                desc: 'Replaces Cr.P.C. 1973. Mandates Zero FIR, electronic summons, forensics in offences punishable by 7+ years.'
              },
              {
                title: 'Bharatiya Sakshya Adhiniyam, 2023',
                category: 'Law of Evidence & Admissibility',
                sections: '170 Sections',
                year: '2023 (In Force July 1, 2024)',
                desc: 'Replaces Indian Evidence Act 1872. Expands electronic records, digital signatures, and device metadata rules.'
              },
              {
                title: 'Constitution of India',
                category: 'Constitutional Law & Fundamental Rights',
                sections: '395 Articles • 12 Schedules',
                year: '1950',
                desc: 'Articles 20, 21, 22 regarding rights against self-incrimination, protection of life & personal liberty, and preventive detention.'
              },
              {
                title: 'Protection of Children from Sexual Offences (POCSO)',
                category: 'Special Child Protection Act',
                sections: '46 Sections',
                year: '2012 (Amended 2019)',
                desc: 'Mandatory reporting, gender-neutral protection, child-friendly recording of statements, and stringent punishments.'
              },
              {
                title: 'Information Technology Act, 2000',
                category: 'Cybercrime & Electronic Governance',
                sections: '94 Sections',
                year: '2000 (Amended 2008)',
                desc: 'Hacking, identity theft, unauthorized access, electronic surveillance, and intermediary liability guidelines.'
              }
            ].map((act, index) => (
              <div 
                key={index}
                onClick={() => {
                  if (onOpenResearchQuery) onOpenResearchQuery(act.title);
                  setCurrentView('research');
                }}
                className="py-6 px-4 group hover:bg-white dark:hover:bg-[#121A26] transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl"
              >
                <div className="md:w-1/2">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-serif-legal text-xl font-bold text-[#171717] dark:text-white group-hover:text-[#B8955A] transition-colors">
                      {act.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#76808D] leading-relaxed">
                    {act.desc}
                  </p>
                </div>

                <div className="flex items-center gap-6 font-sans text-xs text-[#595959] dark:text-[#A0ABB8] md:w-1/3">
                  <div>
                    <span className="block text-[10px] text-[#B8955A] uppercase font-bold">DOMAIN</span>
                    <span className="font-semibold text-[#171717] dark:text-white">{act.category}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#B8955A] uppercase font-bold">PROVISIONS</span>
                    <span>{act.sections}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#171717] dark:text-white group-hover:text-[#B8955A]">
                  <span>Explore Act</span>
                  <ArrowRight className="w-4 h-4 text-[#B8955A] group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* 6. LANDMARK JUDGMENTS (EDITORIAL LAW JOURNAL LAYOUT) */}
      <section className="bg-white dark:bg-[#0D141F] py-20 sm:py-24 border-b border-[#E5E0D8] dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold mb-2">
                <span className="w-5 h-px bg-[#B8955A]" />
                FROM THE BENCH
              </div>
              <h2 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#171717] dark:text-white">
                Landmark Judicial Precedents
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('research')}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-[#171717] dark:text-white hover:text-[#B8955A] cursor-pointer"
            >
              <span>View Case Law Archive</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B8955A]" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Large Featured Case */}
            <div 
              onClick={() => {
                if (onOpenResearchQuery) onOpenResearchQuery('Lalita Kumari vs Govt of UP');
                setCurrentView('research');
              }}
              className="lg:col-span-7 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] p-8 rounded-2xl group hover:border-[#B8955A] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1E293B] pb-3 mb-6">
                  <div className="flex items-center gap-2 text-xs font-sans text-[#B8955A] font-semibold">
                    <Building2 className="w-4 h-4 text-[#B8955A]" />
                    <span>SUPREME COURT OF INDIA (CONSTITUTION BENCH)</span>
                  </div>
                  <span className="text-[11px] font-sans text-[#76808D]">CITATION: (2014) 2 SCC 1</span>
                </div>

                <span className="text-[11px] font-sans text-[#B8955A] tracking-wider uppercase font-bold">
                  FEATURED PRECEDENT • MANDATORY FIR
                </span>
                <h3 className="font-serif-legal text-2xl sm:text-3xl font-bold text-[#171717] dark:text-white mt-1 mb-4 group-hover:text-[#B8955A] transition-colors">
                  Lalita Kumari v. Govt. of Uttar Pradesh &amp; Ors.
                </h3>
                
                <p className="text-sm text-[#595959] dark:text-[#A0ABB8] leading-relaxed mb-6 font-normal">
                  Registration of FIR is mandatory under Section 154 of the Code of Criminal Procedure (now BNSS § 173) if the information discloses the commission of a cognizable offence, and no preliminary inquiry is permissible in such a situation.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[11px] font-sans px-3 py-1 bg-white dark:bg-[#182333] border border-[#E5E0D8] dark:border-[#223145] text-[#595959] dark:text-[#A0ABB8] rounded-full">
                    CRIMINAL PROCEDURE
                  </span>
                  <span className="text-[11px] font-sans px-3 py-1 bg-white dark:bg-[#182333] border border-[#E5E0D8] dark:border-[#223145] text-[#595959] dark:text-[#A0ABB8] rounded-full">
                    BNSS § 173
                  </span>
                  <span className="text-[11px] font-sans px-3 py-1 bg-white dark:bg-[#182333] border border-[#E5E0D8] dark:border-[#223145] text-[#595959] dark:text-[#A0ABB8] rounded-full">
                    POLICE DUTY
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0D8] dark:border-[#1E293B] flex items-center justify-between text-xs font-sans text-[#B8955A] font-semibold">
                <span className="uppercase tracking-wider">Read Full Judgement &amp; AI Analysis</span>
                <ArrowRight className="w-4 h-4 text-[#B8955A] group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Right 3 Smaller Case Rows */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Row 1 */}
              <div 
                onClick={() => {
                  if (onOpenResearchQuery) onOpenResearchQuery('Arnesh Kumar vs State of Bihar');
                  setCurrentView('research');
                }}
                className="p-5.5 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] hover:border-[#B8955A] transition-all rounded-2xl cursor-pointer group hover:shadow-md"
              >
                <div className="flex justify-between text-[11px] font-sans text-[#76808D] mb-1">
                  <span className="font-semibold text-[#B8955A]">SUPREME COURT OF INDIA</span>
                  <span>(2014) 8 SCC 273</span>
                </div>
                <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white group-hover:text-[#B8955A] transition-colors">
                  Arnesh Kumar v. State of Bihar
                </h4>
                <p className="text-xs text-[#595959] dark:text-[#A0ABB8] mt-1.5 line-clamp-2 leading-relaxed">
                  Arrest should not be made routinely in offences with punishment up to 7 years without satisfying Section 41 CrPC (now BNSS § 35) criteria.
                </p>
              </div>

              {/* Row 2 */}
              <div 
                onClick={() => {
                  if (onOpenResearchQuery) onOpenResearchQuery('D.K. Basu vs State of West Bengal');
                  setCurrentView('research');
                }}
                className="p-5.5 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] hover:border-[#B8955A] transition-all rounded-2xl cursor-pointer group hover:shadow-md"
              >
                <div className="flex justify-between text-[11px] font-sans text-[#76808D] mb-1">
                  <span className="font-semibold text-[#B8955A]">SUPREME COURT OF INDIA</span>
                  <span>(1997) 1 SCC 416</span>
                </div>
                <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white group-hover:text-[#B8955A] transition-colors">
                  D.K. Basu v. State of West Bengal
                </h4>
                <p className="text-xs text-[#595959] dark:text-[#A0ABB8] mt-1.5 line-clamp-2 leading-relaxed">
                  Constitutional guidelines governing arrest, custodial interrogation, preparation of memo of arrest, and intimation to relatives.
                </p>
              </div>

              {/* Row 3 */}
              <div 
                onClick={() => {
                  if (onOpenResearchQuery) onOpenResearchQuery('K.S. Puttaswamy vs Union of India');
                  setCurrentView('research');
                }}
                className="p-5.5 bg-[#FAF9F5] dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] hover:border-[#B8955A] transition-all rounded-2xl cursor-pointer group hover:shadow-md"
              >
                <div className="flex justify-between text-[11px] font-sans text-[#76808D] mb-1">
                  <span className="font-semibold text-[#B8955A]">SUPREME COURT OF INDIA (9 JUDGES)</span>
                  <span>(2017) 10 SCC 1</span>
                </div>
                <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white group-hover:text-[#B8955A] transition-colors">
                  Justice K.S. Puttaswamy v. Union of India
                </h4>
                <p className="text-xs text-[#595959] dark:text-[#A0ABB8] mt-1.5 line-clamp-2 leading-relaxed">
                  Right to Privacy is declared a fundamental right guaranteed under Article 21 of the Constitution of India.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 7. RESPONSIBLE AI & TRUST SECTION */}
      <section className="bg-[#F7F6F2] dark:bg-[#0A1017] text-[#171717] dark:text-[#E0E5EC] py-20 sm:py-24 border-b border-[#E5E0D8] dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 text-[#B8955A] font-sans text-xs uppercase tracking-[0.2em] font-bold">
              <span className="w-5 h-px bg-[#B8955A]" />
              INSTITUTIONAL INTEGRITY
              <span className="w-5 h-px bg-[#B8955A]" />
            </div>

            <h2 className="font-serif-legal text-3xl sm:text-5xl font-bold text-[#171717] dark:text-white leading-tight">
              Technology should assist legal judgment — not replace it.
            </h2>

            <p className="text-[#595959] dark:text-[#A0ABB8] text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Lawgic AI provides investigative and drafting guidance backed by traceable statutory references and judicial citations. Final discretion remains in the hands of sworn officers and legal professionals.
            </p>
          </div>

          {/* 4 Minimal Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            
            <div className="p-6 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl">
              <span className="font-sans text-xs font-bold text-[#B8955A] block mb-2">01</span>
              <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white mb-1.5">Legal Database</h4>
              <p className="text-xs text-[#76808D] leading-relaxed">
                Structured indexed access to verified Indian legal statutes, notifications, and official gazettes.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl">
              <span className="font-sans text-xs font-bold text-[#B8955A] block mb-2">02</span>
              <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white mb-1.5">AI Intelligence</h4>
              <p className="text-xs text-[#76808D] leading-relaxed">
                State-of-the-art multimodal reasoning models tuned for Indian jurisprudence and procedural criminal law.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl">
              <span className="font-sans text-xs font-bold text-[#B8955A] block mb-2">03</span>
              <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white mb-1.5">Traceable Citations</h4>
              <p className="text-xs text-[#76808D] leading-relaxed">
                Every provision recommendation includes explicit rationale, subsection references, and cross-statute concordance.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#121A26] border border-[#E5E0D8] dark:border-[#1E293B] rounded-2xl">
              <span className="font-sans text-xs font-bold text-[#B8955A] block mb-2">04</span>
              <h4 className="font-serif-legal font-bold text-lg text-[#171717] dark:text-white mb-1.5">Human Officer Oversight</h4>
              <p className="text-xs text-[#76808D] leading-relaxed">
                Built to augment human scrutiny. Enforces officer badge verification and digital audit trail logs for all cases.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#11161D] text-[#8E98A5] border-t border-[#B8955A]/30 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#1E293B]">
            
            {/* Brand column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-[#B8955A]" />
                <span className="font-serif-legal text-2xl font-bold text-white tracking-wide">
                  LAW<span className="text-[#B8955A] italic font-normal">gic</span> AI
                </span>
              </div>
              <p className="text-xs text-[#8E98A5] max-w-sm leading-relaxed">
                A dedicated Indian legal intelligence and AI-assisted FIR drafting platform engineered for police departments, legal officers, and judicial practitioners.
              </p>
              <div className="pt-2 text-[11px] font-sans text-[#B8955A] font-semibold">
                COMMITTED TO THE INTEGRITY OF INDIAN CRIMINAL JURISPRUDENCE
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-2 space-y-3">
              <span className="font-sans text-xs font-bold text-white uppercase tracking-wider block">
                PLATFORM
              </span>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setCurrentView('new-complaint')} className="hover:text-[#B8955A] cursor-pointer">FIR Assistant</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">Legal Research</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">Case Precedents</button></li>
                <li><button onClick={() => setCurrentView('evidence-scanner')} className="hover:text-[#B8955A] cursor-pointer">Evidence Scanner</button></li>
                <li><button onClick={() => setCurrentView('drafts')} className="hover:text-[#B8955A] cursor-pointer">Case Dockets</button></li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <span className="font-sans text-xs font-bold text-white uppercase tracking-wider block">
                ACTS &amp; CODES
              </span>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">BNS 2023</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">BNSS 2023</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">BSA 2023</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">Constitution of India</button></li>
                <li><button onClick={() => setCurrentView('research')} className="hover:text-[#B8955A] cursor-pointer">POCSO Act 2012</button></li>
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <span className="font-sans text-xs font-bold text-white uppercase tracking-wider block">
                LEGAL &amp; COMPLIANCE
              </span>
              <p className="text-xs text-[#76808D] leading-relaxed">
                Lawgic AI is an information retrieval and analytical assistant. It does not replace statutory decision-making powers of authorized police and judicial authorities.
              </p>
              <div className="pt-2 text-[10px] font-sans text-[#8E98A5]">
                CONFIDENTIAL &amp; IMMUTABLE CLOUD ARCHITECTURE
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#76808D] gap-4">
            <p>© {new Date().getFullYear()} Lawgic AI. All Rights Reserved.</p>
            <div className="flex items-center gap-6 font-sans text-[11px]">
              <span>MINISTRY OF LAW &amp; JUSTICE CONCORDANCE</span>
              <span className="text-[#B8955A]">•</span>
              <span>RESTRICTED LAW ENFORCEMENT ACCESS</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
