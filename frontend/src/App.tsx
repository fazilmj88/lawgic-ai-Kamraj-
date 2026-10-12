import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { HomeView } from './components/HomeView';
import { DashboardView } from './components/DashboardView';
import { NewComplaintView } from './components/NewComplaintView';
import { DraftsView } from './components/DraftsView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';
import { LegalResearchView } from './components/LegalResearchView';
import { EvidenceScannerView } from './components/EvidenceScannerView';
import { TimelineView } from './components/TimelineView';
import { CaseDocumentIntelligenceView } from './components/CaseDocumentIntelligenceView';
import { DocumentVaultView } from './components/vault/DocumentVaultView';
import { SmartDocumentSearchView } from './components/search/SmartDocumentSearchView';
import { CaseDocumentSearchView } from './components/search/CaseDocumentSearchView';
import { CaseWorkspaceView } from './components/case/CaseWorkspaceView';
import { CctvEvidenceView } from './components/case/CctvEvidenceView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { DEFAULT_VAULT_DOCUMENTS } from './data/defaultVaultDocuments';
import { CaseDocumentVaultItem } from './types/documentIntelligence';
import { ChatBot } from './components/ChatBot';
import { View } from './types';
import { Loader2, Scale, Search, X, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigation } from './context/NavigationContext';

export default function App() {
  const { user, isLoading, cases, updateCaseStatus } = useAuth();
  const {
    currentView,
    currentCaseId,
    activeTab: navActiveTab,
    navigateTo,
    goBack,
    setCurrentView
  } = useNavigation();
  const [timelineCaseId, setTimelineCaseId] = useState<string | undefined>();
  const [workspaceCaseId, setWorkspaceCaseId] = useState<string>('LAW-2026-00125');

  // Keep workspace/timeline synced with navigation entry caseId
  useEffect(() => {
    if (currentCaseId) {
      setWorkspaceCaseId(currentCaseId);
      setTimelineCaseId(currentCaseId);
    }
  }, [currentCaseId]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lawgic_theme');
      if (saved) return saved === 'dark';
    } catch (e) {
      // fallback
    }
    return false; // Default to professional light UI/UX
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Case Document Vault State
  const [vaultDocuments, setVaultDocuments] = useState<CaseDocumentVaultItem[]>(() => {
    try {
      const saved = localStorage.getItem('lawgic_vault_documents');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading vault from localStorage', e);
    }
    return DEFAULT_VAULT_DOCUMENTS;
  });

  const [selectedVaultDocForAnalysis, setSelectedVaultDocForAnalysis] = useState<CaseDocumentVaultItem | null>(null);

  const handleUpdateVaultDocuments = (newDocs: CaseDocumentVaultItem[]) => {
    setVaultDocuments(newDocs);
    try {
      localStorage.setItem('lawgic_vault_documents', JSON.stringify(newDocs));
    } catch (e) {
      console.warn('Failed saving vault documents to localStorage', e);
    }
  };

  const handleAnalyzeVaultDocument = (doc: CaseDocumentVaultItem) => {
    setSelectedVaultDocForAnalysis(doc);
    navigateTo('doc-intelligence', { caseId: doc.caseId, docId: doc.id });
  };

  const handleOpenCaseTimeline = (caseId: string) => {
    setTimelineCaseId(caseId);
    navigateTo('timeline', { caseId });
  };

  // Sync dark mode class with DOM and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('lawgic_theme', 'dark');
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('lawgic_theme', 'light');
      } catch (e) {}
    }
  }, [isDarkMode]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F2] dark:bg-[#0B1017] text-[#171717] dark:text-white space-y-4 font-sans transition-colors">
        <div className="w-14 h-14 border border-[#B8955A]/40 dark:border-[#B8955A]/60 bg-white dark:bg-[#101823] rounded-xl flex items-center justify-center text-[#B8955A] shadow-[0_4px_20px_rgba(184,149,90,0.1)]">
          <Scale className="w-7 h-7" strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-[#B8955A]" />
          <span className="font-mono text-xs tracking-widest text-[#595959] dark:text-[#8E98A5] uppercase font-semibold">
            INITIALIZING LAWGIC CASE PLATFORM...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated Screen
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex bg-[#F7F6F2] dark:bg-[#0B1017] text-[#171717] dark:text-[#E0E5EC] transition-colors duration-300 font-sans selection:bg-[#B8955A] selection:text-white">
      
      {/* Navigation Sidebar (Collapsible / Dynamic) */}
      {currentView !== 'home' && (
        <Sidebar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />

        <main className={`flex-1 overflow-y-auto ${currentView === 'home' ? 'p-0' : 'p-4 sm:p-8 lg:p-10'}`}>
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <HomeView key="home" setCurrentView={setCurrentView} />
            )}
            {currentView === 'dashboard' && (
              <DashboardView 
                key="dashboard" 
                setCurrentView={setCurrentView} 
                onOpenCaseTimeline={handleOpenCaseTimeline} 
                onOpenCaseWorkspace={(caseId) => {
                  setWorkspaceCaseId(caseId);
                  navigateTo('case-workspace', { caseId });
                }}
                vaultDocuments={vaultDocuments}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'new-complaint' && (
              <NewComplaintView 
                key="new-complaint" 
                setCurrentView={setCurrentView}
                vaultDocuments={vaultDocuments}
                onUpdateVaultDocuments={handleUpdateVaultDocuments}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'drafts' && (
              <DraftsView 
                key="drafts" 
                setCurrentView={setCurrentView} 
                onOpenCaseTimeline={handleOpenCaseTimeline} 
                onOpenCaseWorkspace={(caseId) => {
                  setWorkspaceCaseId(caseId);
                  navigateTo('case-workspace', { caseId });
                }}
                vaultDocuments={vaultDocuments}
                onUpdateVaultDocuments={handleUpdateVaultDocuments}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'case-workspace' && (
              <CaseWorkspaceView
                key="case-workspace"
                currentCase={cases.find(c => c.caseId === workspaceCaseId) || cases[0]}
                userRole={user?.role || 'Investigating Officer'}
                userName={user?.name || 'Inspector Rajesh Kumar'}
                initialTab={navActiveTab as any}
                onBack={() => goBack()}
                onNavigateToView={(v, data) => {
                  if (data?.caseId) {
                    setWorkspaceCaseId(data.caseId);
                  }
                  navigateTo(v as View, { caseId: data?.caseId || workspaceCaseId, tab: data?.tab });
                }}
                onUpdateCaseStatus={(cId, newSt) => {
                  updateCaseStatus(cId, newSt);
                }}
                vaultDocuments={vaultDocuments}
                onUpdateVaultDocuments={handleUpdateVaultDocuments}
              />
            )}
            {currentView === 'admin' && (
              <AdminView key="admin" onBack={() => goBack()} />
            )}
            {currentView === 'settings' && (
              <SettingsView key="settings" onBack={() => goBack()} />
            )}
            {currentView === 'research' && (
              <LegalResearchView key="research" onBack={() => goBack()} />
            )}
            {currentView === 'doc-intelligence' && (
              <CaseDocumentIntelligenceView 
                key="doc-intelligence" 
                cases={cases}
                initialCaseId={timelineCaseId || workspaceCaseId}
                onNavigateToFIR={() => navigateTo('new-complaint')}
                onNavigateToResearch={() => navigateTo('research')}
                initialDocument={selectedVaultDocForAnalysis}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'document-vault' && (
              <DocumentVaultView
                key="document-vault"
                documents={vaultDocuments}
                onAnalyzeDocument={handleAnalyzeVaultDocument}
                onUpdateDocuments={handleUpdateVaultDocuments}
                userRole={user?.role}
                userName={user?.name}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'document-search' && (
              <CaseDocumentSearchView
                key="document-search"
                userRole={user?.role || 'Investigating Officer'}
                userName={user?.name || 'Inspector Rajesh Kumar'}
                onOpenCaseWorkspace={(cId) => {
                  setWorkspaceCaseId(cId);
                  navigateTo('case-workspace', { caseId: cId });
                }}
                vaultDocuments={vaultDocuments}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'audit-logs' && (
              <AuditLogsView
                key="audit-logs"
                userRole={user?.role}
                userName={user?.name}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'evidence-scanner' && (
              <EvidenceScannerView key="evidence-scanner" onBack={() => goBack()} />
            )}
            {currentView === 'cctv-intelligence' && (
              <CctvEvidenceView
                key="cctv-intelligence"
                caseId={workspaceCaseId || (cases.length > 0 ? cases[0].caseId : 'LAW-2026-00125')}
                userRole={user?.role || 'Constable'}
                userName={user?.name || 'Investigating Officer'}
                onBack={() => goBack()}
              />
            )}
            {currentView === 'timeline' && (
              <TimelineView 
                key="timeline" 
                initialCaseId={timelineCaseId} 
                setCurrentView={setCurrentView} 
                onBack={() => goBack()}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#08121D]/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] max-w-2xl w-full rounded-sm shadow-2xl overflow-hidden text-[#171A1E] dark:text-[#E8ECEF]"
            >
              <div className="p-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center gap-3">
                <Search className="w-5 h-5 text-[#C6A15B]" />
                <input
                  type="text"
                  autoFocus
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && globalSearchQuery.trim()) {
                      setIsSearchModalOpen(false);
                      setCurrentView('research');
                    }
                  }}
                  placeholder="Search BNS sections, IPC concordances, landmark judgments..."
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#8C96A3]"
                />
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-[#8C96A3] dark:hover:text-white rounded-sm cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <span className="text-[10px] font-mono uppercase text-[#6B7280] dark:text-[#8C96A3] font-bold block">
                  FAST JUMP LINKS:
                </span>
                
                <div className="space-y-1.5">
                  <div 
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setCurrentView('new-complaint');
                    }}
                    className="p-2.5 bg-[#FFFFFF] dark:bg-[#08121D] hover:border-[#A38038] dark:hover:border-[#C6A15B] border border-[#E2DDD5] dark:border-[#1E2D3E] rounded-sm flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#A38038] dark:text-[#C6A15B]" />
                      <span className="font-semibold text-[#111827] dark:text-white">FIR Investigation & Drafting Assistant</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#8C96A3] group-hover:text-[#A38038] dark:group-hover:text-[#C6A15B]" />
                  </div>

                  <div 
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setCurrentView('research');
                    }}
                    className="p-2.5 bg-[#FFFFFF] dark:bg-[#08121D] hover:border-[#A38038] dark:hover:border-[#C6A15B] border border-[#E2DDD5] dark:border-[#1E2D3E] rounded-sm flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#A38038] dark:text-[#C6A15B]" />
                      <span className="font-semibold text-[#111827] dark:text-white">BNS 2023 vs IPC Concordance Explorer</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#8C96A3] group-hover:text-[#A38038] dark:group-hover:text-[#C6A15B]" />
                  </div>

                  <div 
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setCurrentView('drafts');
                    }}
                    className="p-2.5 bg-[#FFFFFF] dark:bg-[#08121D] hover:border-[#A38038] dark:hover:border-[#C6A15B] border border-[#E2DDD5] dark:border-[#1E2D3E] rounded-sm flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#A38038] dark:text-[#C6A15B]" />
                      <span className="font-semibold text-[#111827] dark:text-white">Active Police Station Case Dockets</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#8C96A3] group-hover:text-[#A38038] dark:group-hover:text-[#C6A15B]" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] dark:bg-[#08121D] border-t border-[#E2DDD5] dark:border-[#1E2D3E] text-[10px] font-mono text-[#6B7280] dark:text-[#8C96A3] flex justify-between">
                <span>Press Enter to Search Precedents</span>
                <span>ESC to Close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Copilot */}
      <ChatBot />
    </div>
  );
}
