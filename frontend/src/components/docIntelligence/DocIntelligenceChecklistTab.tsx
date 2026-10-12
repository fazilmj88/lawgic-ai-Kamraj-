import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Eye, 
  FileText, 
  Save, 
  Download, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { InvestigationChecklistItem } from '../../types/documentIntelligence';

interface DocIntelligenceChecklistTabProps {
  checklist: InvestigationChecklistItem[];
  onViewSource?: (page: string | number, snippet: string) => void;
  caseId?: string;
  documentName?: string;
}

interface InteractiveChecklistItem extends InvestigationChecklistItem {
  officerNote?: string;
  signedOffBy?: string;
  signedOffAt?: string;
}

export const DocIntelligenceChecklistTab: React.FC<DocIntelligenceChecklistTabProps> = ({
  checklist = [],
  onViewSource,
  caseId = 'CASE-REF',
  documentName = 'Case Document'
}) => {
  const [items, setItems] = useState<InteractiveChecklistItem[]>(() => {
    return checklist.map((item, idx) => ({
      ...item,
      id: item.id || `chk-${idx + 1}`,
      completed: item.completed || false,
      officerNote: '',
      signedOffBy: '',
      signedOffAt: ''
    }));
  });

  const [officerName, setOfficerName] = useState('Inspector Rajesh Sharma');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [saveBanner, setSaveBanner] = useState(false);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          signedOffBy: nextCompleted ? officerName : '',
          signedOffAt: nextCompleted ? new Date().toLocaleString() : ''
        };
      }
      return item;
    }));
  };

  const updateNote = (id: string, note: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, officerNote: note } : item));
  };

  const handleSaveChecklist = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = items.filter(item => {
    if (activeFilter === 'completed') return item.completed;
    if (activeFilter === 'pending') return !item.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Progress Summary */}
      <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-sm font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                AI-Assisted Investigation Review Checklist
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/30">
                {completedCount} of {items.length} Tasks Addressed ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-1">
              Actionable operational milestones synthesized from extracted case facts, statutory mandates under BNSS 2023 & BSA 2023.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveChecklist}
              className="px-3 py-1.5 bg-[#C6A15B] text-[#08121D] font-mono text-xs font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Verification Log
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#5A6573] dark:text-[#8C96A3]">Operational Review Completion</span>
            <span className="font-bold text-[#C6A15B]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-[#DDD8CE]/50 dark:bg-[#1E2D3E] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C6A15B] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-sm border font-mono transition-colors cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[#08121D] dark:bg-white text-white dark:text-[#08121D] font-bold border-transparent'
                    : 'bg-transparent text-[#5A6573] dark:text-[#8C96A3] border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]'
                }`}
              >
                {f === 'all' ? `All (${items.length})` : f === 'pending' ? `Pending (${items.length - completedCount})` : `Completed (${completedCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#5A6573]">
            <span>Signing Officer:</span>
            <input 
              type="text" 
              value={officerName} 
              onChange={e => setOfficerName(e.target.value)}
              className="text-xs px-2 py-0.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono"
            />
          </div>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs font-mono text-emerald-500 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Investigation review checklist entries updated and signed off successfully.</span>
        </div>
      )}

      {/* Checklist Items List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 bg-white dark:bg-[#0C1927] border rounded-sm transition-all ${
                item.completed
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[#DDD8CE] dark:border-[#1E2D3E]'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="mt-0.5 text-[#C6A15B] hover:text-[#b08d4b] cursor-pointer shrink-0"
                  aria-label={item.completed ? "Mark as pending" : "Mark as complete"}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white" />
                  )}
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className={`text-sm font-semibold ${
                      item.completed ? 'line-through text-[#5A6573] dark:text-[#8C96A3]' : 'text-[#08121D] dark:text-white'
                    }`}>
                      {item.task}
                    </h4>
                    {item.sourcePage && (
                      <span className="text-[10px] font-mono text-[#5A6573] shrink-0">
                        {item.sourcePage}
                      </span>
                    )}
                  </div>

                  {/* Statutory Reason */}
                  <div className="flex items-center gap-1.5 text-xs text-[#5A6573] dark:text-[#8C96A3]">
                    <Scale className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                    <span>{item.reason}</span>
                  </div>

                  {/* Source Jump */}
                  {item.sourcePage && onViewSource && (
                    <button
                      onClick={() => onViewSource(item.sourcePage!, item.task)}
                      className="text-xs text-[#C6A15B] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> View in Document Source
                    </button>
                  )}

                  {/* Officer Notes Input */}
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Add investigating officer field note, CCTNS GD number, or action taken..."
                      value={item.officerNote || ''}
                      onChange={e => updateNote(item.id, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#8C96A3]"
                    />
                  </div>

                  {/* Sign-off badge */}
                  {item.completed && (
                    <div className="text-[10px] font-mono text-emerald-500 pt-1 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified & Signed off by {item.signedOffBy || officerName} on {item.signedOffAt || 'Present Date'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#5A6573] font-mono text-xs">
            No checklist items match the selected filter.
          </div>
        )}
      </div>

      {/* Mandatory Statutory Decision-Support Disclaimer */}
      <div className="p-4 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#08121D] dark:text-white uppercase tracking-wider font-mono">
            Investigative Decision Support Notice (SIH26190 Standard)
          </span>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
            This review checklist is an AI-assisted investigative decision-support recommendation. It does not replace the statutory authority, discretion, or mandatory procedures of the authorized Investigating Officer (IO) under the Bharatiya Nagarik Suraksha Sanhita (BNSS 2023). All items require human officer verification and formal case diary recording.
          </p>
        </div>
      </div>
    </div>
  );
};
