import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  ShieldCheck,
  Quote,
  Loader2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { CaseSearchResponse, SearchCitation, DocumentClassificationType } from '../../types/documentIntelligence';
import { Role } from '../../types';
import { getAuthHeader } from '../../lib/supabase';
import { apiUrl } from '../../lib/apiConfig';

interface IntelligentCaseSearchViewProps {
  currentCaseId: string;
  userRole: Role;
  userName: string;
  onViewDocument?: (docId: string) => void;
}

const SAMPLE_QUERIES = [
  'What exact vehicle and clothing were described by the witnesses?',
  'What was the value and weight of the stolen gold chain exhibit?',
  'Are there any contradictions between the victim and eyewitness statements?',
  'What legal sections under Bharatiya Nyaya Sanhita (BNS 2023) apply?',
  'What did the forensic and panchnama report reveal about the suspect?'
];

export const IntelligentCaseSearchView: React.FC<IntelligentCaseSearchViewProps> = ({
  currentCaseId,
  userRole,
  userName,
  onViewDocument
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'single_case' | 'all_cases'>('single_case');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<CaseSearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (queryText?: string) => {
    const activeQuery = (queryText || query).trim();
    if (!activeQuery) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(apiUrl('/api/ai/search-case'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          query: activeQuery,
          caseId: scope === 'single_case' ? currentCaseId : undefined,
          userRole,
          userName,
          filterCategory: categoryFilter !== 'ALL' ? categoryFilter : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Case search failed.');
      }

      setSearchResult(data);
    } catch (err: any) {
      console.error('Case search error:', err);
      setErrorMessage(err?.message || 'Failed to search case repository. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSampleQuery = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C6A15B]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
            Case-Wide RAG Intelligence Search &amp; Citations
          </h3>
        </div>
        <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
          Ask questions in natural language across all verified FIRs, panchnamas, depositions, and forensic records with exact document citations.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A6573] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. What weapon was recovered? What was the timeline of incident at Connaught Place?"
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 bg-[#C6A15B] text-[#08121D] font-mono text-xs font-bold rounded-sm hover:bg-[#b08d4b] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ask Case RAG</span>
              </>
            )}
          </button>
        </form>

        {/* Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
          <div className="flex items-center gap-3">
            {/* Scope selection */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#5A6573] font-mono">Scope:</span>
              <div className="inline-flex rounded-sm p-0.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E]">
                <button
                  type="button"
                  onClick={() => setScope('single_case')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-xs transition-colors ${
                    scope === 'single_case'
                      ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                      : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
                  }`}
                >
                  Current Case ({currentCaseId})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all_cases')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-xs transition-colors ${
                    scope === 'all_cases'
                      ? 'bg-[#1E2D3E] text-[#D4AF37] font-semibold'
                      : 'text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
                  }`}
                >
                  All Authorized Cases
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2 py-1 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="FIR">FIR</option>
              <option value="Witness Statements">Witness Statements</option>
              <option value="Victim Statements">Victim Statements</option>
              <option value="Evidence Records">Evidence Records</option>
              <option value="Forensic Reports">Forensic Reports</option>
              <option value="Court Orders">Court Orders</option>
            </select>
          </div>

          <span className="text-[10px] font-mono text-[#5A6573] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
            RBAC Enforced: Only queries files within authorized jurisdiction
          </span>
        </div>

        {/* Suggestion Prompts */}
        <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#5A6573]">Sample Queries:</span>
          {SAMPLE_QUERIES.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSampleQuery(sq)}
              className="text-[10px] px-2 py-1 rounded bg-[#F7F5F0] dark:bg-[#08121D] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] transition-colors cursor-pointer text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-500 rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="space-y-6">
          {/* AI Direct Grounded Answer */}
          <div className="p-5 bg-white dark:bg-[#0C1927] border border-[#C6A15B]/40 rounded-sm space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
                  AI Synthesized Case Findings
                </h4>
              </div>

              {searchResult.confidence && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  searchResult.confidence === 'HIGH'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    : searchResult.confidence === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                }`}>
                  {searchResult.confidence} CONFIDENCE
                </span>
              )}
            </div>

            <div className="p-4 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs leading-relaxed text-[#08121D] dark:text-white whitespace-pre-wrap">
              {searchResult.directAnswer}
            </div>
          </div>

          {/* Source Citations */}
          <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C6A15B]" />
                Primary Source Citations ({searchResult.citations?.length || 0})
              </h4>
              <span className="text-[10px] font-mono text-[#5A6573]">
                Direct excerpts retrieved via hybrid semantic + keyword index
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResult.citations?.map((cit: SearchCitation, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#08121D] dark:text-white block">
                        {cit.documentName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#5A6573]">
                        <span>Case: {cit.caseId}</span>
                        {cit.pageNumber && <span>• Page {cit.pageNumber}</span>}
                        {cit.chunkIndex !== undefined && <span>• Chunk {cit.chunkIndex}</span>}
                      </div>
                    </div>

                    {cit.confidence !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/20 font-mono shrink-0">
                        {Math.round(cit.confidence * 100)}% Match
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[11px] text-[#5A6573] dark:text-[#CBD5E1] italic flex items-start gap-2">
                    <Quote className="w-3 h-3 text-[#C6A15B] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">"{cit.excerpt}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matching Vault Documents List */}
          {searchResult.matchingDocuments && searchResult.matchingDocuments.length > 0 && (
            <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
                Relevant Case Documents In Vault ({searchResult.matchingDocuments.length})
              </h4>
              <div className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
                {searchResult.matchingDocuments.map(doc => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#C6A15B]" />
                      <div>
                        <span className="font-semibold text-[#08121D] dark:text-white">
                          {doc.fileName}
                        </span>
                        <div className="text-[10px] font-mono text-[#5A6573] flex items-center gap-2">
                          <span>{doc.documentType}</span>
                          <span>• {doc.caseId}</span>
                          <span>• SHA-256: {doc.sha256Hash?.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
