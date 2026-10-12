import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Clock, 
  ArrowRight, 
  Scale, 
  Download, 
  Sparkles,
  Loader2,
  Info
} from 'lucide-react';
import { CaseDocumentVaultItem, CrossDocumentComparisonResult } from '../../types/documentIntelligence';
import { compareCaseDocumentsWithAI } from '../../gemini';

interface CrossDocumentComparisonModalProps {
  caseId: string;
  vaultDocuments: CaseDocumentVaultItem[];
  preselectedDocIds?: string[];
  onClose: () => void;
  onOpenDocument?: (doc: CaseDocumentVaultItem) => void;
}

export const CrossDocumentComparisonModal: React.FC<CrossDocumentComparisonModalProps> = ({
  caseId,
  vaultDocuments = [],
  preselectedDocIds = [],
  onClose,
  onOpenDocument
}) => {
  const caseDocs = vaultDocuments.filter(d => !caseId || d.caseId === caseId);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (preselectedDocIds.length >= 2) return preselectedDocIds;
    return caseDocs.slice(0, 3).map(d => d.id);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrossDocumentComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'inconsistencies' | 'common' | 'evidence' | 'timeline' | 'leads'>('summary');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSelectDoc = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedIds.length < 2) {
      setErrorMessage('Please select at least 2 case documents to execute cross-document intelligence.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const selectedDocsPayload = vaultDocuments
        .filter(d => selectedIds.includes(d.id))
        .map(d => ({
          documentId: d.id,
          fileName: d.fileName,
          documentType: d.documentType,
          notes: d.notes
        }));

      const res = await compareCaseDocumentsWithAI({
        caseId,
        documents: selectedDocsPayload
      });

      setResult(res);
      setActiveTab('summary');
    } catch (err: any) {
      console.error('Cross-document comparison error:', err);
      setErrorMessage(err?.message || 'Failed to compare documents. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between bg-[#F7F5F0] dark:bg-[#08121D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C6A15B]/10 rounded-sm text-[#C6A15B] border border-[#C6A15B]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                  Cross-Document Case Intelligence
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/30">
                  Case {caseId}
                </span>
              </div>
              <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
                Synthesize multiple case records to reveal common facts, cross-document inconsistencies, and unified investigative leads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5A6573] hover:text-[#08121D] dark:hover:text-white rounded-sm hover:bg-[#DDD8CE]/50 dark:hover:bg-[#1E2D3E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selection Toolbar */}
        <div className="p-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-white dark:bg-[#0C1927]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <span className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
              Select Documents to Compare ({selectedIds.length} of {caseDocs.length} selected)
            </span>

            <button
              onClick={handleRunComparison}
              disabled={isLoading || selectedIds.length < 2}
              className="px-4 py-1.5 bg-[#C6A15B] text-[#08121D] font-mono text-xs font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Cross-Document Synthesis</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {caseDocs.map(doc => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelectDoc(doc.id)}
                  className={`p-2.5 rounded-sm border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#C6A15B] bg-[#C6A15B]/10 text-[#08121D] dark:text-white'
                      : 'border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D]/50 text-[#5A6573] hover:border-[#C6A15B]/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                      <span className="text-xs font-medium truncate">{doc.fileName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5A6573] block truncate">
                      {doc.documentType} • {doc.currentVersion}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded text-[#C6A15B] focus:ring-0 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-500 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="underline font-mono">Dismiss</button>
            </div>
          )}
        </div>

        {/* Modal Body / Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#C6A15B] animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                Analyzing Cross-Document Matrix
              </h4>
              <p className="text-xs text-[#5A6573] font-mono max-w-md mx-auto">
                Corroborating deposition statements, comparing timestamps, cross-verifying medical records against seizure logs...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Navigation Tabs Bar */}
              <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex space-x-2 overflow-x-auto">
                {[
                  { id: 'summary', label: 'Synthesis Summary', icon: Sparkles },
                  { id: 'inconsistencies', label: `Inconsistencies (${result.inconsistencies.length})`, icon: AlertTriangle, badge: result.inconsistencies.length > 0 },
                  { id: 'common', label: `Common Facts (${result.commonFacts.length})`, icon: CheckCircle2 },
                  { id: 'evidence', label: `Combined Evidence (${result.combinedEvidenceReferences.length})`, icon: Layers },
                  { id: 'timeline', label: `Cross Timeline (${result.crossTimeline.length})`, icon: Clock },
                  { id: 'leads', label: `Synthesized Leads (${result.potentialLeads.length})`, icon: Lightbulb }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-3 text-xs font-mono font-medium rounded-t-sm border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'border-[#C6A15B] text-[#C6A15B] bg-[#C6A15B]/10 font-bold'
                          : 'border-transparent text-[#5A6573] hover:text-[#08121D] dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab: Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-[#C6A15B] uppercase tracking-wider">
                      Executive Cross-Document Synthesis
                    </span>
                    <p className="text-xs text-[#08121D] dark:text-white leading-relaxed">
                      {result.summarySynthesis}
                    </p>
                  </div>

                  {/* New Information per Document */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                      Unique Information per Record
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.newInformationPerDoc.map((nipd, idx) => (
                        <div 
                          key={idx}
                          className="p-3.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#C6A15B]" />
                            <span className="text-xs font-bold text-[#08121D] dark:text-white truncate">
                              {nipd.documentName}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {nipd.uniqueFacts.map((fact, fIdx) => (
                              <li key={fIdx} className="text-xs text-[#5A6573] dark:text-[#8C96A3] flex items-start gap-1.5">
                                <span className="text-[#C6A15B] font-bold">•</span>
                                <span>{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Inconsistencies */}
              {activeTab === 'inconsistencies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                      Cross-Document Discrepancies & Conflicting Statements
                    </h4>
                    <span className="text-xs font-mono text-amber-500">
                      Requires Officer Field Clarification
                    </span>
                  </div>

                  {result.inconsistencies.length > 0 ? (
                    <div className="space-y-3">
                      {result.inconsistencies.map(inc => (
                        <div 
                          key={inc.id}
                          className="p-4 bg-white dark:bg-[#0C1927] border border-amber-500/30 rounded-sm space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-bold text-[#08121D] dark:text-white">
                              {inc.topic}
                            </span>
                          </div>

                          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
                            {inc.description}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs">
                              <span className="font-mono text-[10px] text-[#C6A15B] block font-bold">
                                {inc.documentA.name} ({inc.documentA.page || 'Record'})
                              </span>
                              <p className="text-[#08121D] dark:text-white italic mt-1">
                                "{inc.documentA.statement}"
                              </p>
                            </div>

                            <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs">
                              <span className="font-mono text-[10px] text-[#C6A15B] block font-bold">
                                {inc.documentB.name} ({inc.documentB.page || 'Record'})
                              </span>
                              <p className="text-[#08121D] dark:text-white italic mt-1">
                                "{inc.documentB.statement}"
                              </p>
                            </div>
                          </div>

                          {/* Guidance */}
                          <div className="p-2.5 bg-amber-500/10 rounded-sm border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold font-mono">Suggested Investigative Step: </span>
                              <span>{inc.officerGuidance}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#5A6573] font-mono text-xs">
                      No material contradictions detected across the selected documents.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Common Facts */}
              {activeTab === 'common' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                    Mutually Corroborated Facts Across Records
                  </h4>
                  <div className="space-y-2">
                    {result.commonFacts.map(cf => (
                      <div 
                        key={cf.id}
                        className="p-3 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-semibold text-[#08121D] dark:text-white">
                              {cf.fact}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-[#5A6573] pl-6">
                            <span>Supported by:</span>
                            <span className="text-[#C6A15B]">{cf.supportedByDocs.join(', ')}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shrink-0">
                          {cf.confidence} CONFIDENCE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Combined Evidence */}
              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                    Cross-Referenced Evidentiary Items
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.combinedEvidenceReferences.map(ev => (
                      <div 
                        key={ev.id}
                        className="p-3.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#08121D] dark:text-white">
                            {ev.evidence}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B]">
                            {ev.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6573] dark:text-[#8C96A3]">
                          {ev.whyRelevant}
                        </p>
                        <div className="text-[10px] font-mono text-[#5A6573]">
                          Mentioned in: <span className="text-[#C6A15B]">{ev.sourceDocs.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                    Synthesized Chronological Sequence
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDD8CE] dark:before:bg-[#1E2D3E]">
                    {result.crossTimeline.map((item, idx) => (
                      <div key={item.id || idx} className="relative space-y-1">
                        <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-[#C6A15B] border-2 border-white dark:border-[#0C1927]" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#C6A15B]">{item.timestamp}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#DDD8CE]/50 dark:bg-[#1E2D3E] text-[#5A6573] rounded-sm">
                            {item.sourceDoc}
                          </span>
                        </div>
                        <p className="text-xs text-[#08121D] dark:text-white">
                          {item.event}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Leads */}
              {activeTab === 'leads' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
                    Synthesized Potential Investigative Leads
                  </h4>
                  <div className="space-y-2.5">
                    {result.potentialLeads.map(lead => (
                      <div 
                        key={lead.id}
                        className="p-3.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-[#C6A15B] shrink-0" />
                            <span className="text-xs font-bold text-[#08121D] dark:text-white">
                              {lead.lead}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B]">
                            {lead.confidence}
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] pl-6">
                          {lead.relevance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[#5A6573] font-mono text-xs space-y-2">
              <Layers className="w-8 h-8 text-[#C6A15B]/40 mx-auto" />
              <p>Select at least 2 case documents from above and click "Execute Cross-Document Synthesis".</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#5A6573]">
            Cross-document comparison conforms to Section 172 BNSS & Section 63 BSA guidelines.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#DDD8CE] dark:bg-[#1E2D3E] text-[#08121D] dark:text-white text-xs font-mono font-medium rounded-sm hover:opacity-80 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
