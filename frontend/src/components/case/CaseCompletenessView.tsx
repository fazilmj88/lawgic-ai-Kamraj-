import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Scale,
  Award,
  ArrowRight,
  Info
} from 'lucide-react';
import { CaseCompletenessReport, ChecklistItem, DocumentClassificationType } from '../../types/documentIntelligence';
import { Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';

interface CaseCompletenessViewProps {
  caseId: string;
  userRole: Role;
  userName: string;
  onOpenUploadForCategory?: (category: DocumentClassificationType) => void;
}

const CRIME_TYPES = [
  'Theft / Snatching (Section 304 BNS)',
  'Homicide / Murder (Section 103 BNS)',
  'Financial Fraud & Cybercrime (Section 318 BNS)',
  'Assault / Grievous Hurt (Section 115 BNS)'
];

export const CaseCompletenessView: React.FC<CaseCompletenessViewProps> = ({
  caseId,
  userRole,
  userName,
  onOpenUploadForCategory
}) => {
  const [report, setReport] = useState<CaseCompletenessReport | null>(null);
  const [crimeType, setCrimeType] = useState<string>('Theft / Snatching (Section 304 BNS)');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCompleteness = async (typeToFetch = crimeType) => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/completeness?crimeType=${encodeURIComponent(typeToFetch)}&userRole=${encodeURIComponent(userRole)}&userName=${encodeURIComponent(userName)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      }
    } catch (err) {
      console.error('Failed to load case completeness:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleteness(crimeType);
  }, [caseId, crimeType]);

  const handleRecalculate = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/completeness`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crimeType, userRole, userName })
      });
      const data = await res.json();
      if (res.ok && data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Error recalculating completeness:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getProgressBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C6A15B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
              Case File Completeness &amp; Statutory Integrity Audit
            </h3>
          </div>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
            Automated compliance check against procedural statutory requirements before chargesheet submission (Sec 193 BNSS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Crime type selector */}
          <select
            value={crimeType}
            onChange={e => {
              setCrimeType(e.target.value);
              fetchCompleteness(e.target.value);
            }}
            className="px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
          >
            {CRIME_TYPES.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>

          <button
            onClick={handleRecalculate}
            disabled={isRefreshing || isLoading}
            className="px-3 py-1.5 bg-[#C6A15B]/10 hover:bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30 rounded text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Audit</span>
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Score Card Banner */}
          <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C6A15B]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#5A6573] font-bold">
                  Chargesheet Readiness Index
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-serif font-black ${getScoreColor(report.completenessScore)}`}>
                  {report.completenessScore}%
                </span>
                <span className="text-xs text-[#5A6573]">
                  {report.checklist.filter(c => c.status === 'UPLOADED_VERIFIED').length} of {report.checklist.length} statutory mandates fulfilled
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#F7F5F0] dark:bg-[#08121D] rounded-full overflow-hidden border border-[#DDD8CE] dark:border-[#1E2D3E]">
                <div
                  className={`h-full ${getProgressBg(report.completenessScore)} transition-all duration-500`}
                  style={{ width: `${report.completenessScore}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 p-3.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs min-w-[240px]">
              <div className="flex justify-between text-[#5A6573]">
                <span>Missing Critical Documents:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {report.missingDocuments?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-[#5A6573]">
                <span>Requires Legal Revision:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {report.attentionItems?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-[#5A6573]">
                <span>Verified in Custody:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {report.checklist.filter(c => c.status === 'UPLOADED_VERIFIED').length}
                </span>
              </div>
            </div>
          </div>

          {/* Missing / Attention Statutory Alerts */}
          {report.missingDocuments && report.missingDocuments.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>Statutory Warnings Before Judicial Chargesheet Filing</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#08121D] dark:text-[#CBD5E1]">
                {report.missingDocuments.map((miss, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                      <span>{miss}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist Table */}
          <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#C6A15B]" />
              Mandatory Procedural Requirements Checklist
            </h4>

            <div className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
              {report.checklist.map(item => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {item.status === 'UPLOADED_VERIFIED' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {item.status === 'MISSING' && (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      {item.status === 'ATTENTION_REQUIRED' && (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}

                      <span className="font-bold text-[#08121D] dark:text-white">
                        {item.title}
                      </span>

                      {item.isRequired && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] pl-6">
                      {item.description}
                    </p>

                    {item.notes && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 pl-6 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                    {item.status === 'UPLOADED_VERIFIED' ? (
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                        Uploaded &amp; Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenUploadForCategory && onOpenUploadForCategory(item.category)}
                        className="px-2.5 py-1 bg-[#C6A15B] hover:bg-[#b08d4b] text-[#08121D] text-[10px] font-mono font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload {item.category}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
