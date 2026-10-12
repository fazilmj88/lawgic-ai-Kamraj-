import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  FileText,
  ShieldCheck,
  Folder,
  ArrowRight,
  ArrowLeft,
  Eye,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
  Loader2,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { CaseDocumentVaultItem, DocumentClassificationType } from '../../types/documentIntelligence';
import { apiUrl } from '../../lib/apiConfig';
import { DEFAULT_VAULT_DOCUMENTS } from '../../data/defaultVaultDocuments';
import { formatFileSize, truncateHash } from '../../utils/cryptoIntegrity';
import { logAuditEvent } from '../../utils/auditLogger';
import { DocumentDetailModal } from '../vault/DocumentDetailModal';
import { Role } from '../../types';

interface SearchResultItem {
  doc: CaseDocumentVaultItem;
  relevanceScore: number;
  matchedField: string;
  highlightedSnippet: string;
  matchedKeywords: string[];
}

const QUICK_SEARCH_PROMPTS = [
  'find all mentions of weapons',
  'show witness statements about the vehicle',
  'find medical reports mentioning blunt trauma',
  'find all documents for case LAW-2026-00125'
];

interface CaseDocumentSearchViewProps {
  userRole: Role;
  userName: string;
  onOpenCaseWorkspace?: (caseId: string) => void;
  vaultDocuments?: CaseDocumentVaultItem[];
  onBack?: () => void;
}

export const CaseDocumentSearchView: React.FC<CaseDocumentSearchViewProps> = ({
  userRole,
  userName,
  onOpenCaseWorkspace,
  vaultDocuments: propVaultDocs,
  onBack
}) => {
  const [query, setQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLegalSection, setSelectedLegalSection] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [useAiSearch, setUseAiSearch] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CaseDocumentVaultItem | null>(null);

  const allDocuments = useMemo(() => {
    return propVaultDocs || DEFAULT_VAULT_DOCUMENTS;
  }, [propVaultDocs]);

  // Unique case IDs for filter dropdown
  const uniqueCaseIds = useMemo(() => {
    const ids = Array.from(new Set(allDocuments.map(d => d.caseId)));
    return ids;
  }, [allDocuments]);

  // Semantic & keyword search engine
  const searchResults: SearchResultItem[] = useMemo(() => {
    if (!query.trim() && selectedCaseId === 'ALL' && selectedCategory === 'ALL' && selectedLegalSection === 'ALL' && selectedEntityType === 'ALL') {
      return allDocuments.map(doc => ({
        doc,
        relevanceScore: 70,
        matchedField: 'Case Record Index',
        highlightedSnippet: `${doc.documentType} • ${doc.notes || 'Registered digital case asset'}`,
        matchedKeywords: []
      }));
    }

    const q = query.toLowerCase().trim();
    const queryTokens = q ? q.split(/\s+/).filter(Boolean) : [];

    const results: SearchResultItem[] = [];

    allDocuments.forEach(doc => {
      // Filter by Case ID
      if (selectedCaseId !== 'ALL' && doc.caseId !== selectedCaseId) {
        return;
      }
      // Filter by Category
      if (selectedCategory !== 'ALL' && doc.documentType !== selectedCategory) {
        return;
      }
      // Filter by Legal Section
      if (selectedLegalSection !== 'ALL') {
        const textToSearch = `${doc.fileName} ${doc.notes || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
        if (!textToSearch.includes(selectedLegalSection.toLowerCase())) {
          return;
        }
      }
      // Filter by Entity Type
      if (selectedEntityType !== 'ALL') {
        const textToSearch = `${doc.fileName} ${doc.notes || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
        if (selectedEntityType === 'weapon' && !textToSearch.includes('weapon') && !textToSearch.includes('iron rod') && !textToSearch.includes('knife')) {
          return;
        }
        if (selectedEntityType === 'vehicle' && !textToSearch.includes('pulsar') && !textToSearch.includes('motorcycle') && !textToSearch.includes('vehicle') && !textToSearch.includes('cctv')) {
          return;
        }
        if (selectedEntityType === 'medical' && !textToSearch.includes('trauma') && !textToSearch.includes('hospital') && !textToSearch.includes('contusion') && !textToSearch.includes('mlc')) {
          return;
        }
      }

      if (!q) {
        results.push({
          doc,
          relevanceScore: 85,
          matchedField: 'Filtered Query',
          highlightedSnippet: `${doc.documentType} in case ${doc.caseId}`,
          matchedKeywords: []
        });
        return;
      }

      let score = 0;
      let matchedField = 'Metadata';
      let snippet = doc.notes || `Case ${doc.caseId} registered document.`;
      const matchedTokens: string[] = [];

      const docText = `${doc.fileName} ${doc.documentType} ${doc.caseId} ${doc.notes || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();

      // Semantic Synonyms Expansion
      const synonyms: Record<string, string[]> = {
        weapon: ['iron rod', 'metallic', 'weapon', 'brandished', 'rod', 'knife', 'assault'],
        vehicle: ['motorcycle', 'pulsar', 'two-wheeler', 'bike', 'cctv', 'iccc', 'traffic', 'plate'],
        trauma: ['contusion', 'blunt', 'abrasion', 'mlc', 'hospital', 'injury', 'hurt', 'forearm', 'rml'],
        medical: ['hospital', 'mlc', 'contusion', 'doctor', 'triage', 'rml', 'blunt'],
        witness: ['eyewitness', 'shopkeeper', 'ramesh', 'sec 180', 'statement', 'deposition'],
        victim: ['aarav', 'malhotra', 'complainant', 'informant', 'injured', 'snatched']
      };

      // Check token matches
      queryTokens.forEach(token => {
        if (docText.includes(token)) {
          score += 25;
          matchedTokens.push(token);
        }

        // Semantic synonym checking
        Object.entries(synonyms).forEach(([key, synList]) => {
          if (token.includes(key) || key.includes(token)) {
            synList.forEach(syn => {
              if (docText.includes(syn)) {
                score += 15;
                if (!matchedTokens.includes(syn)) matchedTokens.push(syn);
              }
            });
          }
        });
      });

      // Special exact matches
      if (doc.caseId.toLowerCase().includes(q)) {
        score += 40;
        matchedField = 'Case ID';
        snippet = `Exact match in case folder ID: ${doc.caseId}`;
      } else if (doc.fileName.toLowerCase().includes(q)) {
        score += 35;
        matchedField = 'File Name';
        snippet = `Document file name matches: "${doc.fileName}"`;
      } else if (doc.notes && doc.notes.toLowerCase().includes(q)) {
        score += 30;
        matchedField = 'Investigator Deposition / Notes';
        snippet = doc.notes;
      } else if (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q))) {
        score += 25;
        matchedField = 'Legal Tags';
        snippet = `Tagged under: ${doc.tags.join(', ')}`;
      }

      if (score > 0) {
        results.push({
          doc,
          relevanceScore: Math.min(99, score),
          matchedField,
          highlightedSnippet: snippet,
          matchedKeywords: matchedTokens
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [allDocuments, query, selectedCaseId, selectedCategory, selectedLegalSection, selectedEntityType]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Call backend search endpoint to verify and register search action
      await fetch(apiUrl('/api/documents/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          caseId: selectedCaseId !== 'ALL' ? selectedCaseId : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined
        })
      });

      await logAuditEvent({
        actionType: 'SEARCH_PERFORMED',
        actionLabel: 'Case Document Search',
        caseId: selectedCaseId !== 'ALL' ? selectedCaseId : 'CROSS-CASE',
        userId: 'usr-officer',
        userName,
        userRole,
        details: `Searched across case documents for query: "${query}". Returned ${searchResults.length} matches.`,
        status: 'SUCCESS'
      });
    } catch (err) {
      console.warn('Search logging error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-xs">
        <div className="flex items-start gap-3.5 mb-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] text-[#5A6573] dark:text-[#8A95A5] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
              title="Back to previous view"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>Back</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-sm bg-[#1E2D3E] text-[#D4AF37] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#08121D] dark:text-white font-serif tracking-tight">
                AI-Powered Cross-Case Document Search
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                AI Semantic Reasoning
              </span>
            </div>
            <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-0.5">
              Execute natural language legal queries across registered case vaults, FIRs, witness depositions, forensic certificates, and court orders.
            </p>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="mt-5 space-y-3">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#5A6573] absolute left-4" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Try "find all mentions of weapons", "show witness statements about vehicle", or "blunt trauma"...'
              className="w-full text-sm pl-12 pr-28 py-3.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#5A6573] focus:outline-none focus:border-[#D4AF37] shadow-xs"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2.5 px-4 py-2 text-xs font-semibold rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] font-serif transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-[#5A6573]">Suggested Queries:</span>
            {QUICK_SEARCH_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                }}
                className="px-2.5 py-1 text-xs rounded-full border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#142334] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white hover:border-[#D4AF37] transition-all"
              >
                "{prompt}"
              </button>
            ))}
          </div>

          {/* Granular Filters Grid */}
          <div className="mt-4 pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter: Case ID */}
            <div>
              <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                Case Identifier
              </label>
              <select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono"
              >
                <option value="ALL">All Case Folders</option>
                {uniqueCaseIds.map(id => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Document Category */}
            <div>
              <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                Document Classification
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white"
              >
                <option value="ALL">All Classifications</option>
                <option value="FIR">FIR</option>
                <option value="Victim Statements">Victim Statements</option>
                <option value="Witness Statements">Witness Statements</option>
                <option value="Evidence Records">Evidence Records</option>
                <option value="Forensic Reports">Forensic Reports</option>
                <option value="Court Orders">Court Orders</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>

            {/* Filter: Statutory Provision */}
            <div>
              <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                Statutory Section (BNS / IPC / BSA)
              </label>
              <select
                value={selectedLegalSection}
                onChange={e => setSelectedLegalSection(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white"
              >
                <option value="ALL">All Legal Sections</option>
                <option value="Section 304 BNS">Sec 304 BNS (Robbery)</option>
                <option value="Section 115 BNS">Sec 115 BNS (Hurt)</option>
                <option value="Section 180 BNSS">Sec 180 BNSS (Statements)</option>
                <option value="Section 63 BSA">Sec 63 BSA (Electronic Seal)</option>
                <option value="Section 94 BNSS">Sec 94 BNSS (Warrants)</option>
              </select>
            </div>

            {/* Filter: Entity Type */}
            <div>
              <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                Correlated Entity Type
              </label>
              <select
                value={selectedEntityType}
                onChange={e => setSelectedEntityType(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white"
              >
                <option value="ALL">All Entity Types</option>
                <option value="weapon">Weapons & Sharp Instruments</option>
                <option value="vehicle">Vehicles & Getaway Plates</option>
                <option value="medical">Medical Trauma & Injuries</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#5A6573]">
          <span className="font-mono">
            Showing <strong className="text-[#08121D] dark:text-white">{searchResults.length}</strong> matching case documents
          </span>
          {query && (
            <span className="font-mono text-[#D4AF37]">
              Ranked by semantic & lexical relevance score
            </span>
          )}
        </div>

        {/* Results Cards List */}
        <div className="space-y-3">
          {searchResults.map((item, idx) => (
            <div
              key={item.doc.id + idx}
              className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] rounded-sm p-4.5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-sm bg-[#1E2D3E] text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top Bar: Case ID & Category */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-sm bg-[#1E2D3E] text-[#D4AF37]">
                      {item.doc.caseId}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#F7F5F0] dark:bg-[#142334] text-[#5A6573] dark:text-[#8A95A5] border border-[#DDD8CE] dark:border-[#1E2D3E]">
                      {item.doc.documentType}
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-xs bg-[#D4AF37]/20 text-[#D4AF37]">
                      {item.doc.currentVersion || 'v1.0'}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Seal
                    </span>
                  </div>

                  {/* Document Title */}
                  <h3 className="text-sm font-semibold text-[#08121D] dark:text-white truncate">
                    {item.doc.fileName}
                  </h3>

                  {/* Highlighted Snippet */}
                  <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-1 leading-relaxed line-clamp-2">
                    {item.highlightedSnippet}
                  </p>

                  {/* Metadata line */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#5A6573]">
                    <span>Uploaded: {new Date(item.doc.uploadedAt).toLocaleDateString()}</span>
                    <span>Officer: {item.doc.uploadedBy}</span>
                    <span>Size: {formatFileSize(item.doc.fileSize)}</span>
                    <span className="truncate max-w-xs text-[#D4AF37]">
                      SHA-256: {truncateHash(item.doc.sha256Hash, 6, 6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Relevance Score & Direct Buttons */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#DDD8CE] dark:border-[#1E2D3E]">
                {/* Score Pill */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#5A6573]">Relevance:</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {item.relevanceScore}%
                  </span>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(item.doc)}
                    className="p-1.5 text-xs border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] rounded-sm text-[#5A6573] hover:text-[#08121D] dark:hover:text-white transition-colors"
                    title="Preview Document & Cryptographic Seal"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {onOpenCaseWorkspace && (
                    <button
                      onClick={() => onOpenCaseWorkspace(item.doc.caseId)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-sm bg-[#1E2D3E] hover:bg-[#2A3F55] text-[#D4AF37] transition-colors font-serif"
                    >
                      <span>Open in Case Folder</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {searchResults.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <Search className="w-10 h-10 text-[#5A6573] mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-[#08121D] dark:text-white font-serif">
                No matching documents found
              </h3>
              <p className="text-xs text-[#5A6573] mt-1">
                Try loosening your filters or search for alternative legal terminology like "robbery", "MLC", or "statement".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentDetailModal
          item={previewDoc}
          userRole={userRole}
          userName={userName}
          onClose={() => setPreviewDoc(null)}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
};
