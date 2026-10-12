import React from 'react';
import { 
  Scale, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Layers, 
  FolderArchive, 
  FolderKanban,
  Settings, 
  ShieldAlert, 
  LogOut,
  Clock,
  FileSearch,
  Search,
  ShieldCheck,
  Building2,
  ChevronRight,
  Video
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isSidebarCollapsed,
}) => {
  const { user, signOut, cases } = useAuth();

  const navItems: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    view: View;
    badge?: number | string;
    category?: string;
  }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: FileText, label: 'FIR Assistant', view: 'new-complaint' },
    { icon: Clock, label: 'Case History', view: 'drafts', badge: cases.length },
    { icon: FolderKanban, label: 'Case Documents', view: 'case-workspace' },
    { icon: FileSearch, label: 'Case Document Intelligence', view: 'doc-intelligence' },
    { icon: FolderArchive, label: 'Document Vault', view: 'document-vault' },
    { icon: Search, label: 'AI Document Search', view: 'document-search' },
    { icon: BookOpen, label: 'Legal Research', view: 'research' },
    { icon: Layers, label: 'Evidence Scanner', view: 'evidence-scanner' },
    { icon: Video, label: 'CCTV Intelligence', view: 'cctv-intelligence' },
    { icon: ShieldAlert, label: 'Audit Logs', view: 'audit-logs' },
    { icon: Settings, label: 'Settings', view: 'settings' },
  ];

  return (
    <motion.aside 
      animate={{ width: isSidebarCollapsed ? 76 : 268 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#FFFFFF] dark:bg-[#0E1520] border-r border-[#E5E0D8] dark:border-[#1D2633] flex flex-col z-50 sticky top-0 h-screen select-none shrink-0 text-[#171717] dark:text-[#F0F2F5] transition-colors duration-200 shadow-[1px_0_4px_rgba(23,23,23,0.02)]"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3.5 border-b border-[#E5E0D8] dark:border-[#1D2633] h-20">
        <div className="w-9 h-9 flex items-center justify-center border border-[#B8955A]/40 bg-[#F5EFE4] dark:bg-[#151F2D] dark:border-[#C5A870]/40 rounded-lg shrink-0 shadow-xs">
          <Scale className="w-5 h-5 text-[#B8955A] dark:text-[#C5A870]" strokeWidth={1.8} />
        </div>
        {!isSidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="font-serif-legal font-bold text-lg tracking-tight text-[#171717] dark:text-white leading-none">
              LAWGIC AI
            </h1>
            <p className="text-[10px] font-sans tracking-wide text-[#595959] dark:text-[#8E98A5] mt-1 font-medium">
              Legal Intelligence System
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group relative cursor-pointer ${
                isActive 
                  ? 'bg-[#F5EFE4] dark:bg-[#162232] text-[#171717] dark:text-white border-l-[3px] border-[#B8955A] font-semibold shadow-xs' 
                  : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#131D2A] hover:text-[#171717] dark:hover:text-[#F0F2F5] font-normal'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-[#B8955A] dark:text-[#C5A870]' 
                    : 'text-[#666666] dark:text-[#7A8696] group-hover:text-[#171717] dark:group-hover:text-white'
                }`} strokeWidth={isActive ? 2 : 1.7} />
                {!isSidebarCollapsed && (
                  <span className="text-xs tracking-normal truncate">{item.label}</span>
                )}
              </div>

              {!isSidebarCollapsed && item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive 
                    ? 'bg-[#B8955A]/20 text-[#8C6A28] dark:text-[#D4AF37]' 
                    : 'bg-[#ECE8E1] text-[#595959] dark:bg-[#1B2533] dark:text-[#8E98A5]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Optional Admin Entry if user has Admin role */}
        {user?.role === 'Admin' && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group relative cursor-pointer ${
              currentView === 'admin'
                ? 'bg-[#F5EFE4] dark:bg-[#162232] text-[#171717] dark:text-white border-l-[3px] border-[#B8955A] font-semibold'
                : 'text-[#595959] dark:text-[#8E98A5] hover:bg-[#F7F6F2] dark:hover:bg-[#131D2A] hover:text-[#171717]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#666666]" strokeWidth={1.7} />
              {!isSidebarCollapsed && (
                <span className="text-xs tracking-normal truncate">Admin Controls</span>
              )}
            </div>
          </button>
        )}
      </nav>

      {/* Footer Station Badge & Sign Out */}
      <div className="p-3.5 border-t border-[#E5E0D8] dark:border-[#1D2633] space-y-2 bg-[#FAF9F6] dark:bg-[#0B1118]/70">
        {user && !isSidebarCollapsed && (
          <div className="p-2.5 bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] dark:text-[#8E98A5]">
              <span className="tracking-wider uppercase">JURISDICTION</span>
              <span className="text-[#059669] dark:text-[#10B981] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#10B981]" /> LIVE
              </span>
            </div>
            <p className="text-xs font-semibold text-[#171717] dark:text-white truncate mt-0.5">
              {user.station || 'Central Police Station'}
            </p>
          </div>
        )}

        <button 
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#595959] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 dark:text-[#8E98A5] dark:hover:text-[#F87171] dark:hover:bg-[#1C2533] text-xs font-medium transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isSidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};
