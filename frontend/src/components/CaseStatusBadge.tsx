import React, { useState, useRef, useEffect } from 'react';
import { 
  FileEdit, 
  Clock, 
  Send, 
  ShieldCheck, 
  Archive, 
  ChevronDown, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CaseStatus } from '../types';

export interface CaseStatusBadgeProps {
  status: CaseStatus | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showPulse?: boolean;
  interactive?: boolean;
  onStatusChange?: (newStatus: CaseStatus) => void;
  className?: string;
  tooltipText?: string;
}

export interface StatusMeta {
  key: CaseStatus;
  label: string;
  shortLabel: string;
  proceduralNote: string;
  icon: React.ComponentType<{ className?: string }>;
  dotClass: string;
  pulseClass?: string;
  badgeClass: string;
  activeRingClass: string;
}

export const STATUS_DEFINITIONS: Record<string, StatusMeta> = {
  'Drafting': {
    key: 'Drafting',
    label: 'Drafting',
    shortLabel: 'Draft',
    proceduralNote: 'Intake in progress • Fact gathering',
    icon: FileEdit,
    dotClass: 'bg-amber-500 dark:bg-amber-400',
    pulseClass: 'bg-amber-400 animate-ping',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500/25',
    activeRingClass: 'ring-amber-500/40'
  },
  'Draft': {
    key: 'Drafting',
    label: 'Drafting',
    shortLabel: 'Draft',
    proceduralNote: 'Intake in progress • Fact gathering',
    icon: FileEdit,
    dotClass: 'bg-amber-500 dark:bg-amber-400',
    pulseClass: 'bg-amber-400 animate-ping',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500/25',
    activeRingClass: 'ring-amber-500/40'
  },
  'Review Pending': {
    key: 'Review Pending',
    label: 'Review Pending',
    shortLabel: 'Review',
    proceduralNote: 'Awaiting supervisory legal appraisal',
    icon: Clock,
    dotClass: 'bg-sky-500 dark:bg-sky-400',
    pulseClass: 'bg-sky-400 animate-ping',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/35 hover:bg-sky-500/25',
    activeRingClass: 'ring-sky-500/40'
  },
  'Pending': {
    key: 'Review Pending',
    label: 'Review Pending',
    shortLabel: 'Review',
    proceduralNote: 'Awaiting supervisory legal appraisal',
    icon: Clock,
    dotClass: 'bg-sky-500 dark:bg-sky-400',
    pulseClass: 'bg-sky-400 animate-ping',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/35 hover:bg-sky-500/25',
    activeRingClass: 'ring-sky-500/40'
  },
  'Submitted': {
    key: 'Submitted',
    label: 'Submitted',
    shortLabel: 'Submitted',
    proceduralNote: 'Lodged for Sec 173 BNSS entry',
    icon: Send,
    dotClass: 'bg-indigo-500 dark:bg-indigo-400',
    pulseClass: 'bg-indigo-400 animate-pulse',
    badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/25',
    activeRingClass: 'ring-indigo-500/40'
  },
  'Verified': {
    key: 'Verified',
    label: 'Verified & Registered',
    shortLabel: 'Verified',
    proceduralNote: 'Official FIR issued • Cognizance recorded',
    icon: ShieldCheck,
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    pulseClass: undefined,
    badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25',
    activeRingClass: 'ring-emerald-500/40'
  },
  'Registered': {
    key: 'Verified',
    label: 'Verified & Registered',
    shortLabel: 'Verified',
    proceduralNote: 'Official FIR issued • Cognizance recorded',
    icon: ShieldCheck,
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    pulseClass: undefined,
    badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25',
    activeRingClass: 'ring-emerald-500/40'
  },
  'Closed': {
    key: 'Closed',
    label: 'Closed',
    shortLabel: 'Closed',
    proceduralNote: 'Final report accepted by Magistrate',
    icon: Archive,
    dotClass: 'bg-slate-500 dark:bg-slate-400',
    pulseClass: undefined,
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/35 hover:bg-slate-500/25',
    activeRingClass: 'ring-slate-500/40'
  }
};

export const TRIAGE_STATUS_OPTIONS: CaseStatus[] = [
  'Drafting',
  'Review Pending',
  'Submitted',
  'Verified',
  'Closed'
];

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_DEFINITIONS[status] || {
    key: 'Drafting',
    label: status || 'Drafting',
    shortLabel: status || 'Draft',
    proceduralNote: 'Case docket entry',
    icon: HelpCircle,
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
    activeRingClass: 'ring-gray-400'
  };
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  showPulse = true,
  interactive = false,
  onStatusChange,
  className = '',
  tooltipText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const meta = getStatusMeta(status);
  const Icon = meta.icon;

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-2',
    lg: 'px-3 py-1.5 text-sm gap-2.5'
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  const handleToggle = (e: React.MouseEvent) => {
    if (!interactive || !onStatusChange) return;
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelectStatus = (e: React.MouseEvent, nextStatus: CaseStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(nextStatus);
    }
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block text-left select-none ${className}`}
      title={tooltipText || `${meta.label} • ${meta.proceduralNote}`}
    >
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`inline-flex items-center font-mono uppercase font-bold border rounded-sm transition-all duration-150 ${sizeClasses} ${meta.badgeClass} ${
          interactive ? 'cursor-pointer hover:shadow-xs active:scale-[0.98]' : ''
        }`}
      >
        {/* Dynamic Micro-Pulse Dot */}
        {showPulse && (
          <span className="relative flex shrink-0 items-center justify-center">
            {meta.pulseClass && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${meta.pulseClass}`} />
            )}
            <span className={`relative inline-flex rounded-full ${dotSizes} ${meta.dotClass}`} />
          </span>
        )}

        {/* Status Icon */}
        {showIcon && (
          <Icon className={`${iconSizes} shrink-0 opacity-90`} />
        )}

        {/* Status Text */}
        <span className="tracking-wide whitespace-nowrap">
          {size === 'xs' || size === 'sm' ? meta.shortLabel : meta.label}
        </span>

        {/* Interactive Dropdown Trigger */}
        {interactive && (
          <ChevronDown 
            className={`w-3 h-3 ml-0.5 opacity-60 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </div>

      {/* Quick Triage Dropdown Popover */}
      <AnimatePresence>
        {isOpen && interactive && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 mt-1.5 w-60 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-xl z-50 overflow-hidden text-xs py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F4EFE6]/50 dark:bg-[#08121D]/50">
              <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] font-bold tracking-wider block">
                QUICK STATUS TRIAGE
              </span>
              <span className="text-[10px] text-[#5B636E] dark:text-[#B4BCC6]">
                Transition docket workflow
              </span>
            </div>

            <div className="p-1 space-y-0.5">
              {TRIAGE_STATUS_OPTIONS.map((opt) => {
                const optMeta = getStatusMeta(opt);
                const OptIcon = optMeta.icon;
                const isSelected = meta.key === optMeta.key;

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => handleSelectStatus(e, opt)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xs flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] font-semibold' 
                        : 'hover:bg-[#EFEAE1] dark:hover:bg-[#152332] text-[#171A1E] dark:text-[#E8ECEF]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex shrink-0 items-center justify-center">
                        <span className={`inline-flex rounded-full w-1.5 h-1.5 ${optMeta.dotClass}`} />
                      </span>
                      <OptIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <div className="truncate">
                        <span className="font-mono text-xs block leading-tight">
                          {optMeta.label}
                        </span>
                        <span className="text-[10px] text-[#6D7278] dark:text-[#8C96A3] block truncate">
                          {optMeta.proceduralNote}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
