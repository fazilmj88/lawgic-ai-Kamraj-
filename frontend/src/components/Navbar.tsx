import React from 'react';
import { 
  Scale, 
  Menu, 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  Bell,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { View } from '../types';

interface NavbarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  onOpenSearchModal?: () => void;
}

const VIEW_TITLES: Record<View, { title: string; category: string }> = {
  home: { title: 'Portal Overview', category: 'Home' },
  dashboard: { title: 'Dashboard', category: 'Legal Intelligence' },
  'new-complaint': { title: 'AI-Assisted FIR Drafting', category: 'FIR Assistant' },
  drafts: { title: 'Case History', category: 'Dockets' },
  'case-workspace': { title: 'Case Documents', category: 'Case File' },
  'doc-intelligence': { title: 'Case Document Intelligence', category: 'Analysis' },
  'document-vault': { title: 'Document Vault', category: 'Records' },
  'document-search': { title: 'Intelligent Document Search', category: 'Search' },
  research: { title: 'Legal Research & Statutes', category: 'Acts & Case Law' },
  'evidence-scanner': { title: 'Evidence Scanner', category: 'Forensics' },
  'cctv-intelligence': { title: 'CCTV Evidence Intelligence', category: 'Forensic Video' },
  'audit-logs': { title: 'Custody Audit Logs', category: 'Compliance' },
  timeline: { title: 'Case Timeline', category: 'Investigation' },
  admin: { title: 'Administrator Control Desk', category: 'System' },
  settings: { title: 'Account Settings', category: 'Profile' }
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isDarkMode,
  setIsDarkMode,
  onOpenSearchModal
}) => {
  const { user, signOut } = useAuth();
  const currentInfo = VIEW_TITLES[currentView] || { title: 'Legal Intelligence', category: 'Workspace' };

  return (
    <header className="h-20 bg-[#FFFFFF] dark:bg-[#0E1520] border-b border-[#E5E0D8] dark:border-[#1D2633] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 text-[#171717] dark:text-[#F0F2F5] transition-colors">
      
      {/* Left: Sidebar Toggle, Breadcrumb & Current Page Title */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        {user && (
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] hover:bg-[#EFECE6] dark:hover:bg-[#1B2738] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white transition-colors cursor-pointer"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#595959] dark:text-[#8E98A5] font-sans">
            <span 
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-[#B8955A] cursor-pointer transition-colors"
            >
              Lawgic AI
            </span>
            <ChevronRight className="w-3 h-3 text-[#A39E96]" />
            <span className="text-[#171717] dark:text-[#E0E5EC] font-medium truncate">
              {currentInfo.category}
            </span>
          </div>

          {/* Current Page Title */}
          <h1 className="font-serif-legal font-bold text-lg sm:text-xl text-[#171717] dark:text-white tracking-tight truncate leading-tight mt-0.5">
            {currentInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Quick Search, Notifications, Theme Toggle, Officer Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        
        {/* Quick Search Bar Trigger */}
        <button
          onClick={() => {
            if (onOpenSearchModal) {
              onOpenSearchModal();
            } else {
              setCurrentView('research');
            }
          }}
          className="px-3 py-2 bg-[#F7F6F2] dark:bg-[#151F2D] hover:bg-[#EFECE6] dark:hover:bg-[#1B2738] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-xs text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
          title="Search Statutes, Sections & Case Law (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#B8955A]" />
          <span className="hidden md:inline font-sans text-xs">Search records & statutes...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded text-[#8E877C]">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Indicator */}
        <button
          onClick={() => setCurrentView('audit-logs')}
          className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] hover:bg-[#EFECE6] dark:hover:bg-[#1B2738] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white relative cursor-pointer transition-colors"
          title="Case Activity & Audit Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8955A] absolute top-1.5 right-1.5" />
        </button>

        {/* Subtle Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 bg-[#F7F6F2] dark:bg-[#151F2D] hover:bg-[#EFECE6] dark:hover:bg-[#1B2738] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Ivory Light Theme" : "Switch to Midnight Legal Canvas"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-[#C5A870]" /> : <Moon className="w-4 h-4 text-[#595959]" />}
        </button>

        {/* Officer Profile & Role */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E0D8] dark:border-[#1D2633]">
            <div 
              onClick={() => setCurrentView('settings')}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-lg hover:bg-[#F7F6F2] dark:hover:bg-[#151F2D] transition-colors cursor-pointer"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-full object-cover border border-[#B8955A]/50"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#F5EFE4] dark:bg-[#1A2534] border border-[#B8955A]/40 text-[#8C6A28] dark:text-[#C5A870] flex items-center justify-center font-bold text-xs font-serif-legal">
                  {user.name.charAt(0)}
                </div>
              )}
              
              <div className="text-left hidden lg:block">
                <p className="text-xs font-medium text-[#171717] dark:text-white leading-tight">
                  {user.name}
                </p>
                <span className="text-[10px] font-sans text-[#595959] dark:text-[#8E98A5] font-normal block">
                  {user.role}
                </span>
              </div>
            </div>

            <button 
              onClick={signOut}
              className="p-2 text-[#595959] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 dark:text-[#8E98A5] dark:hover:text-[#F87171] dark:hover:bg-[#1B2738] rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
