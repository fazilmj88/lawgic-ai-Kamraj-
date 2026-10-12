import React, { useState } from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  Plus,
  Clock,
  Check
} from 'lucide-react';
import { 
  VerificationInconsistency, 
  MissingInformationItem, 
  InvestigationChecklistItem 
} from '../../types/documentIntelligence';

interface DocIntelligenceVerificationTabProps {
  inconsistencies: VerificationInconsistency[];
  missingInformation: MissingInformationItem[];
  checklist: InvestigationChecklistItem[];
  onViewSource: (page: string | number, snippet: string) => void;
}

export const DocIntelligenceVerificationTab: React.FC<DocIntelligenceVerificationTabProps> = ({
  inconsistencies: initialInconsistencies,
  missingInformation,
  checklist: initialChecklist,
  onViewSource
}) => {
  const [inconsistencies, setInconsistencies] = useState(initialInconsistencies);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [newChecklistTask, setNewChecklistTask] = useState('');

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleAddChecklistTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTask.trim()) return;
    const newItem: InvestigationChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      task: newChecklistTask.trim(),
      reason: 'Officer added investigative step during docket review.',
      completed: false
    };
    setChecklist(prev => [newItem, ...prev]);
    setNewChecklistTask('');
  };

  const updateInconsistencyStatus = (id: string, status: 'Unresolved' | 'Verified' | 'Dismissed') => {
    setInconsistencies(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status } : inc
    ));
  };

  const completedCount = checklist.filter(c => c.completed).length;

  return (
    <div className="space-y-8">
      {/* 1. Information Requiring Verification (Contradictions & Inconsistencies) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-[#EF4444]" />
              Information Requiring Verification ({inconsistencies.length})
            </h3>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              Conflicting timestamps, dates, differing spellings, or narrative variances detected.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#EF4444] uppercase font-bold px-2 py-0.5 rounded-sm bg-red-500/10 border border-red-500/30">
            OFFICER REVIEW RECOMMENDED
          </span>
        </div>

        <div className="space-y-3">
          {inconsistencies.map((inc) => (
            <div
              key={inc.id}
              className={`border rounded-sm p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                inc.status === 'Verified'
                  ? 'border-[#10B981]/50 bg-[#10B981]/5'
                  : inc.status === 'Dismissed'
                  ? 'border-[#DDD8CE] dark:border-[#1E2D3E] opacity-60 bg-white dark:bg-[#0D1824]'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm bg-red-500/15 text-red-500 border border-red-500/30 font-bold">
                    {inc.type}
                  </span>
                  <span className="text-xs font-mono text-[#8C96A3]">
                    Source: {inc.sourcePages.join(', ')}
                  </span>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => updateInconsistencyStatus(inc.id, 'Unresolved')}
                    className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                      inc.status === 'Unresolved'
                        ? 'bg-red-500 text-white font-bold'
                        : 'bg-white dark:bg-[#101C29] text-[#8C96A3] border border-[#DDD8CE] dark:border-[#1E2D3E]'
                    }`}
                  >
                    Unresolved
                  </button>
                  <button
                    onClick={() => updateInconsistencyStatus(inc.id, 'Verified')}
                    className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                      inc.status === 'Verified'
                        ? 'bg-[#10B981] text-white font-bold'
                        : 'bg-white dark:bg-[#101C29] text-[#8C96A3] border border-[#DDD8CE] dark:border-[#1E2D3E]'
                    }`}
                  >
                    Verified / Clarified
                  </button>
                  <button
                    onClick={() => updateInconsistencyStatus(inc.id, 'Dismissed')}
                    className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                      inc.status === 'Dismissed'
                        ? 'bg-[#6B7280] text-white font-bold'
                        : 'bg-white dark:bg-[#101C29] text-[#8C96A3] border border-[#DDD8CE] dark:border-[#1E2D3E]'
                    }`}
                  >
                    Dismissed
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-medium text-[#08121D] dark:text-white leading-relaxed">
                {inc.description}
              </p>

              {inc.sourceSnippet && (
                <p className="text-xs text-[#8C96A3] italic bg-white/60 dark:bg-[#08121D]/60 p-2.5 rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E]">
                  "{inc.sourceSnippet}"
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
                  <span className="font-semibold text-[#08121D] dark:text-white">Recommendation: </span>
                  {inc.recommendation}
                </p>

                <button
                  onClick={() => onViewSource(inc.sourcePages[0] || 'Page 1', inc.sourceSnippet || inc.description)}
                  className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Source</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Missing / Unclear Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-[#F59E0B]" />
              Information That May Require Clarification ({missingInformation.length})
            </h3>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              Key factual details absent from the current document record that should be obtained by the IO.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missingInformation.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#F59E0B]/15 text-[#F59E0B] font-bold">
                  {item.category}
                </span>

                <h4 className="font-semibold text-xs text-[#08121D] dark:text-white leading-snug">
                  {item.item}
                </h4>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#8C96A3] font-bold block">
                    WHY CRUCIAL TO CASE:
                  </span>
                  <p className="text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                    {item.whyImportant}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] text-[11px] text-[#C6A15B] font-mono">
                Source: {item.potentialSource}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. AI-Assisted Investigation Checklist */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
          <div>
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4.5 h-4.5 text-[#10B981]" />
              AI-Assisted Investigation Checklist
            </h3>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              Actionable tasks derived from document evidence leads and procedural mandates (BNSS 2023).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#1E2D3E] font-bold">
              {completedCount} of {checklist.length} Completed
            </span>
          </div>
        </div>

        {/* Add custom checklist step */}
        <form onSubmit={handleAddChecklistTask} className="flex gap-2">
          <input
            type="text"
            value={newChecklistTask}
            onChange={(e) => setNewChecklistTask(e.target.value)}
            placeholder="Add custom officer investigation action item..."
            className="flex-1 px-3 py-2 text-xs rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] text-[#08121D] dark:text-[#E8ECEF] focus:outline-none focus:border-[#C6A15B] placeholder:text-[#8C96A3]"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-sm bg-[#101C29] text-[#D5B875] border border-[#C6A15B] hover:bg-[#C6A15B]/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Step</span>
          </button>
        </form>

        {/* Interactive List */}
        <div className="space-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3.5 rounded-sm border transition-all cursor-pointer flex items-start gap-3 select-none ${
                item.completed
                  ? 'bg-[#10B981]/5 border-[#10B981]/40'
                  : 'bg-[#F7F4ED]/50 dark:bg-[#101C29]/50 border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-[#C6A15B]">
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8C96A3]" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <p className={`text-xs font-medium ${
                  item.completed 
                    ? 'line-through text-[#8C96A3]' 
                    : 'text-[#08121D] dark:text-[#E8ECEF]'
                }`}>
                  {item.task}
                </p>
                <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                  {item.reason}
                </p>
              </div>

              {item.sourcePage && (
                <span className="text-[10px] font-mono text-[#8C96A3] shrink-0">
                  {item.sourcePage}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
