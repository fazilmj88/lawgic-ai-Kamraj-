import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  Filter, 
  Sparkles, 
  Eye, 
  Play, 
  ArrowRight, 
  Tag, 
  Calendar, 
  Hash, 
  Layers, 
  BookOpen 
} from 'lucide-react';
import { CaseDocumentVaultItem, SmartSearchResultItem } from '../../types/documentIntelligence';

interface SmartDocumentSearchViewProps {
  documents: CaseDocumentVaultItem[];
  onOpenDocument: (doc: CaseDocumentVaultItem, targetPage?: number | string) => void;
  onAnalyzeDocument: (doc: CaseDocumentVaultItem) => void;
}

export const SmartDocumentSearchView: React.FC<SmartDocumentSearchViewProps> = ({
  documents = [],
  onOpenDocument,
  onAnalyzeDocument
}) => {
  const [query, setQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const caseIds = Array.from(new Set(documents.map(d => d.caseId)));

  // Suggested search chips
  const suggestedQueries = [
    'iPhone 14 Pro',
    'Metro Pillar 142',
    'Black motorcycle',
    'Cash withdrawal',
    'Dr. RML Hospital',
    'Blunt forearm injury',
    'Section 304 BNS',
    'Seizure memo'
  ];

  // Perform smart search across document metadata, notes, and simulated index
  const searchResults: SmartSearchResultItem[] = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: SmartSearchResultItem[] = [];

    documents.forEach(doc => {
      if (selectedCase !== 'ALL' && doc.caseId !== selectedCase) return;
      if (selectedType !== 'ALL' && doc.documentType !== selectedType) return;

      const fileNameMatch = doc.fileName.toLowerCase().includes(q);
      const notesMatch = doc.notes && doc.notes.toLowerCase().includes(q);
      const typeMatch = doc.documentType.toLowerCase().includes(q);
      const caseMatch = doc.caseId.toLowerCase().includes(q);

      let matchedSnippet = '';
      let page = 1;
      let score = 0.5;

      if (fileNameMatch) {
        matchedSnippet = `Document title matches search inquiry: ${doc.fileName}`;
        score = 0.95;
      } else if (notesMatch) {
        const idx = doc.notes!.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(doc.notes!.length, idx + 80);
        matchedSnippet = `...${doc.notes!.slice(start, end)}...`;
        score = 0.88;
        page = 1;
      } else if (typeMatch) {
        matchedSnippet = `Official classification record classified under ${doc.documentType}`;
        score = 0.7;
      } else if (caseMatch) {
        matchedSnippet = `Associated case file: ${doc.caseId}`;
        score = 0.65;
      } else {
        // Semantic keyword fallbacks based on default vault documents
        if (q.includes('iphone') || q.includes('phone') || q.includes('imei')) {
          matchedSnippet = 'Complainant reported theft of Apple iPhone 14 Pro, Dark Purple, IMEI #358941092841920.';
          page = 1;
          score = 0.9;
        } else if (q.includes('pillar') || q.includes('metro') || q.includes('barakhamba')) {
          matchedSnippet = 'Intercept took place near Metro Pillar 142 on Barakhamba Road around 18:45 hrs.';
          page = 2;
          score = 0.92;
        } else if (q.includes('motorcycle') || q.includes('bike') || q.includes('helmet')) {
          matchedSnippet = 'Suspects operated a dark two-wheeler motorcycle without rear registration plate.';
          page = 1;
          score = 0.85;
        } else if (q.includes('rml') || q.includes('hospital') || q.includes('injury') || q.includes('mlc')) {
          matchedSnippet = 'Medico-Legal Certificate #RML-8492 records blunt trauma and abrasion on right forearm.';
          page = 1;
          score = 0.94;
        } else if (q.includes('seizure') || q.includes('panchnama') || q.includes('watch')) {
          matchedSnippet = 'Seizure Panchnama: Recovered metallic watch chain link with silver finish from crime scene.';
          page = 1;
          score = 0.89;
        }
      }

      if (matchedSnippet) {
        results.push({
          documentId: doc.id,
          fileName: doc.fileName,
          caseId: doc.caseId,
          documentType: doc.documentType,
          uploadedAt: doc.uploadedAt,
          matchedField: fileNameMatch ? 'File Name' : notesMatch ? 'Officer Notes' : 'Extracted Text',
          highlightedSnippet: matchedSnippet,
          sourcePage: page,
          relevanceScore: score,
          matchedEntities: [],
          sha256Hash: doc.sha256Hash,
          integrityStatus: doc.integrityStatus
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [query, documents, selectedCase, selectedType]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-[#C6A15B]/30 text-[#08121D] dark:text-white font-bold px-0.5 rounded-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6 text-[#C6A15B]" />
          <div>
            <h2 className="text-xl font-bold font-serif text-[#08121D] dark:text-white uppercase tracking-wider">
              Smart Document Search
            </h2>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
              Semantic & keyword search across case documents, complaints, witness depositions, and forensic certificates.
            </p>
          </div>
        </div>

        {/* Input & Filters */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="w-5 h-5 text-[#5A6573] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by keywords, person names, vehicles, property, or legal phrases (e.g., 'iPhone', 'Pillar 142', 'MLC injury')..."
              className="w-full text-sm pl-11 pr-4 py-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#8C96A3] focus:border-[#C6A15B] focus:outline-hidden"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-[#5A6573] hover:text-[#08121D] dark:hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2 font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Suggested Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider mr-1">Suggested:</span>
            {suggestedQueries.map(sq => (
              <button
                key={sq}
                onClick={() => setQuery(sq)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Scope Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#DDD8CE]/60 dark:border-[#1E2D3E]/60 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#5A6573] text-[10px] uppercase">Case Scope:</span>
              <select
                value={selectedCase}
                onChange={e => setSelectedCase(e.target.value)}
                className="text-xs px-2 py-1 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Authorized Cases</option>
                {caseIds.map(cid => (
                  <option key={cid} value={cid}>Case {cid}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#5A6573] text-[10px] uppercase">Record Type:</span>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="text-xs px-2 py-1 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Document Types</option>
                <option value="Complaint / Petition">Complaint / Petition</option>
                <option value="FIR Copy">FIR Copy</option>
                <option value="Witness Statement (Sec 180 BNSS)">Witness Statement</option>
                <option value="Seizure Memo / Panchnama">Seizure Memo</option>
                <option value="Medico-Legal / Forensic Report">Forensic / MLC</option>
              </select>
            </div>

            {query && (
              <span className="text-[#5A6573] ml-auto">
                Found <span className="font-bold text-[#08121D] dark:text-white">{searchResults.length}</span> matching excerpts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        {query.trim() ? (
          searchResults.length > 0 ? (
            searchResults.map((res, idx) => {
              const matchedVaultDoc = documents.find(d => d.id === res.documentId);

              return (
                <div 
                  key={idx}
                  className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm hover:border-[#C6A15B] transition-colors space-y-2 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#C6A15B] shrink-0" />
                      <span className="text-sm font-bold text-[#08121D] dark:text-white">
                        {res.fileName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B]">
                        Case {res.caseId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#5A6573]">
                      <span>Page {res.sourcePage || 1}</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-bold">{Math.round(res.relevanceScore * 100)}% Match</span>
                    </div>
                  </div>

                  {/* Matched Snippet */}
                  <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs leading-relaxed text-[#08121D] dark:text-white font-sans">
                    {highlightText(res.highlightedSnippet, query)}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-[#5A6573]">
                      Type: {res.documentType}
                    </span>

                    <div className="flex items-center gap-2">
                      {matchedVaultDoc && (
                        <button
                          onClick={() => onOpenDocument(matchedVaultDoc, res.sourcePage)}
                          className="text-xs text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect in Vault
                        </button>
                      )}

                      {matchedVaultDoc && (
                        <button
                          onClick={() => onAnalyzeDocument(matchedVaultDoc)}
                          className="px-2.5 py-1 bg-[#C6A15B] text-[#08121D] text-[10px] font-mono font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> Run Intelligence
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs font-mono text-[#5A6573] space-y-2">
              <Search className="w-8 h-8 text-[#C6A15B]/30 mx-auto" />
              <p>No document passages found matching "{query}". Try checking other keywords or clearing the scope filter.</p>
            </div>
          )
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs font-mono text-[#5A6573] space-y-2">
            <BookOpen className="w-8 h-8 text-[#C6A15B]/30 mx-auto" />
            <p>Type a search query above or click one of the suggested keywords to search all case records.</p>
          </div>
        )}
      </div>
    </div>
  );
};
