import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  FileText,
  RefreshCw,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { TimelineEvent, ContradictionItem } from '../../types/documentIntelligence';
import { Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';

interface CaseTimelineViewProps {
  caseId: string;
  userRole: Role;
  userName: string;
  onViewDocument?: (docId: string) => void;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({
  caseId,
  userRole,
  userName,
  onViewDocument
}) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [contradictions, setContradictions] = useState<ContradictionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTimelineData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/timeline?userRole=${encodeURIComponent(userRole)}&userName=${encodeURIComponent(userName)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTimeline(data.timeline || []);
          setContradictions(data.contradictions || []);
        }
      }
    } catch (err) {
      console.error('Failed to load case timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [caseId]);

  const handleSyncTimeline = async () => {
    setIsRegenerating(true);
    setNotice(null);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/timeline`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole, userName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTimeline(data.timeline || []);
        setContradictions(data.contradictions || []);
        setNotice('Case chronological timeline refreshed and cross-referenced with all vault records.');
      } else {
        setNotice(data.error || 'Failed to refresh timeline.');
      }
    } catch (err: any) {
      setNotice(err?.message || 'Error syncing timeline.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Extract unique sources and types for filter chips
  const uniqueSources = Array.from(new Set(timeline.map(t => t.sourceDocument).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(timeline.map(t => t.type).filter(Boolean)));

  const filteredTimeline = timeline.filter(item => {
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesSource = filterSource === 'ALL' || item.sourceDocument === filterSource;
    return matchesType && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C6A15B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
              Case Chronological Timeline &amp; Contradiction Radar
            </h3>
          </div>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
            Aggregated cross-document sequence of events with automated discrepancy and alibi detection.
          </p>
        </div>

        <button
          onClick={handleSyncTimeline}
          disabled={isRegenerating || isLoading}
          className="px-3.5 py-1.5 bg-[#C6A15B]/10 hover:bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30 rounded-sm text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Analyzing Vault...' : 'Sync with Latest Vault Docs'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Contradictions Callout Alert */}
      {contradictions.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Cross-Document Contradictions Detected ({contradictions.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contradictions.map((c, i) => (
              <div key={i} className="p-3 bg-white dark:bg-[#08121D] border border-amber-500/20 rounded-sm text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#08121D] dark:text-white">
                    {c.field || 'Inconsistency'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    c.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {c.severity || 'MODERATE'} SEVERITY
                  </span>
                </div>
                <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                  {c.description}
                </p>
                {c.conflictingDocuments && c.conflictingDocuments.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-[#5A6573] font-mono">Conflicting Sources:</span>
                    {c.conflictingDocuments.map((docName, dIdx) => (
                      <span key={dIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5F0] dark:bg-[#1E2D3E] text-[#08121D] dark:text-white font-mono border border-[#DDD8CE] dark:border-[#2C3E50]">
                        {docName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-[#F7F5F0] dark:bg-[#08121D] p-3 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div className="flex items-center gap-1.5 text-[#5A6573] font-mono text-[11px]">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2.5 py-1 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
        >
          <option value="ALL">All Event Types ({timeline.length})</option>
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="px-2.5 py-1 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
        >
          <option value="ALL">All Source Documents</option>
          {uniqueSources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="text-[11px] text-[#5A6573] font-mono ml-auto">
          Showing {filteredTimeline.length} events
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-[#DDD8CE] dark:border-[#1E2D3E] ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
        {filteredTimeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A6573] italic">
            No chronological timeline events recorded yet. Click "Sync with Latest Vault Docs" to generate.
          </div>
        ) : (
          filteredTimeline.map((item, idx) => {
            const isContradicted = item.hasContradiction || (item as any).contradiction;
            return (
              <div key={idx} className="relative group">
                {/* Timeline node dot */}
                <div className={`absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-[#08121D] flex items-center justify-center ${
                  isContradicted
                    ? 'border-amber-500 text-amber-500'
                    : 'border-[#C6A15B] text-[#C6A15B]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isContradicted ? 'bg-amber-500 animate-ping' : 'bg-[#C6A15B]'}`} />
                </div>

                {/* Event Card */}
                <div className={`p-4 bg-white dark:bg-[#0C1927] border rounded-sm transition-all hover:border-[#C6A15B]/50 ${
                  isContradicted ? 'border-amber-500/40' : 'border-[#DDD8CE] dark:border-[#1E2D3E]'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#C6A15B] bg-[#C6A15B]/10 px-2 py-0.5 rounded border border-[#C6A15B]/20">
                        {item.date} {item.time ? `• ${item.time}` : ''}
                      </span>
                      {item.type && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F7F5F0] dark:bg-[#142334] text-[#5A6573] dark:text-[#8C96A3] border border-[#DDD8CE] dark:border-[#1E2D3E]">
                          {item.type}
                        </span>
                      )}
                    </div>

                    {item.sourceDocument && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5A6573] dark:text-[#8C96A3]">
                        <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                        <span>Source: <strong className="text-[#08121D] dark:text-white">{item.sourceDocument}</strong></span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#08121D] dark:text-white leading-relaxed font-medium">
                    {item.description}
                  </p>

                  {/* Contradiction Warning */}
                  {isContradicted && (
                    <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[11px]">Contradiction Highlighted:</span>
                        <p className="text-[11px] mt-0.5">{item.contradictionDetails || 'Discrepancy with timing or statement provided in other case testimonies.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Parties / Entities involved */}
                  {item.participants && item.participants.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] font-mono text-[#5A6573]">Key Parties:</span>
                      {item.participants.map((p, pIdx) => (
                        <span key={pIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
