import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  RefreshCw,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';

interface SmartCaseSummaryCardProps {
  caseId: string;
  userRole: Role;
  userName: string;
}

export const SmartCaseSummaryCard: React.FC<SmartCaseSummaryCardProps> = ({
  caseId,
  userRole,
  userName
}) => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'evidence' | 'suspect' | 'legal' | 'gaps'>('overview');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/smart-summary?userRole=${encodeURIComponent(userRole)}&userName=${encodeURIComponent(userName)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) {
          setSummaryData(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load smart summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [caseId]);

  const handleRegenerate = async () => {
    setIsRefreshing(true);
    setNotice(null);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/smart-summary`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole, userName, forceRegenerate: true })
      });
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        setSummaryData(data.summary);
        setNotice('Case summary freshly synthesized using all current vault documents.');
      } else {
        setNotice(data.error || 'Failed to refresh summary.');
      }
    } catch (err: any) {
      setNotice(err?.message || 'Error regenerating summary.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C6A15B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
              Comprehensive Grounded Case Brief &amp; Intelligence Summary
            </h3>
          </div>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
            Full case synthesis generated across all registered statements, seizure memos, panchnamas, and forensic certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] text-[#08121D] dark:text-white rounded text-xs font-mono flex items-center gap-1.5 hover:bg-[#DDD8CE]/50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Brief</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-1.5 bg-[#C6A15B] hover:bg-[#b08d4b] text-[#08121D] font-mono font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Synthesizing...' : 'Re-Generate Brief'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {summaryData && (
        <div className="space-y-4">
          {/* Sub tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 rounded-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              1. Overview &amp; Incident Narrative
            </button>
            <button
              onClick={() => setActiveSection('evidence')}
              className={`px-3 py-1.5 rounded-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'evidence'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              2. Evidence Catalog &amp; Forensics
            </button>
            <button
              onClick={() => setActiveSection('suspect')}
              className={`px-3 py-1.5 rounded-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'suspect'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              3. Accused Profile &amp; Alibis
            </button>
            <button
              onClick={() => setActiveSection('legal')}
              className={`px-3 py-1.5 rounded-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'legal'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              4. Statutory Matrix &amp; Elements of Proof
            </button>
            <button
              onClick={() => setActiveSection('gaps')}
              className={`px-3 py-1.5 rounded-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'gaps'
                  ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                  : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
              }`}
            >
              5. Investigation Gaps &amp; Recommendations
            </button>
          </div>

          {/* Section Body */}
          <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-4 text-xs leading-relaxed text-[#08121D] dark:text-white">
            {activeSection === 'overview' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A15B] font-bold block mb-1">
                    Grounded Incident Summary
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {summaryData.narrativeSummary || summaryData.caseOverview || 'Case overview synthesized.'}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'evidence' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A15B] font-bold block mb-1">
                    Recovered Physical, Digital &amp; Forensic Exhibits
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {summaryData.evidenceSummary || 'Evidence catalog synthesized.'}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'suspect' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A15B] font-bold block mb-1">
                    Suspect Actus Reus, Role &amp; Alibi Scrutiny
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {summaryData.suspectProfile || 'Accused background and disclosures synthesized.'}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'legal' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A15B] font-bold block mb-1">
                    Statutory Provisions &amp; Required Proof Elements
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {summaryData.legalAssessment || 'Legal provisions and prosecution proof matrix synthesized.'}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'gaps' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Investigation Vulnerabilities &amp; Action Items
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-[#08121D] dark:text-white">
                    {summaryData.investigationGaps || summaryData.recommendations || 'Pending procedural actions.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
