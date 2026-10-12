import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  User,
  Car,
  MapPin,
  FileCheck,
  Share2,
  HelpCircle,
  Eye
} from 'lucide-react';
import { CaseDocumentIntelligenceResult } from '../../types/documentIntelligence';

interface DocIntelligenceOverviewTabProps {
  result: CaseDocumentIntelligenceResult;
  onViewSource: (page: string | number, snippet: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DocIntelligenceOverviewTab: React.FC<DocIntelligenceOverviewTabProps> = ({
  result,
  onViewSource,
  onNavigateTab
}) => {
  const { 
    detectedDocumentType, 
    caseSummary, 
    keyFacts, 
    evidenceReferences, 
    potentialLeads, 
    timeline, 
    inconsistencies, 
    relationshipMap 
  } = result;

  return (
    <div className="space-y-6">
      {/* Document Classification Banner */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C96A3] font-bold">
                DETECTED DOCUMENT CLASSIFICATION
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
                detectedDocumentType.confidence === 'HIGH'
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
              }`}>
                {detectedDocumentType.confidence} CONFIDENCE
              </span>
            </div>
            <h3 className="text-xl font-serif-legal font-bold text-[#08121D] dark:text-white">
              {detectedDocumentType.type}
            </h3>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
              {detectedDocumentType.rationale}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="p-2.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-center min-w-[100px]">
              <span className="text-[9px] text-[#8C96A3] block uppercase">PAGES</span>
              <span className="text-sm font-bold text-[#08121D] dark:text-white">{result.pageCount}</span>
            </div>
            <div className="p-2.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-center min-w-[120px]">
              <span className="text-[9px] text-[#8C96A3] block uppercase">PROCESS STATUS</span>
              <span className="text-xs font-semibold text-[#10B981]">Complete Document</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Triage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => onNavigateTab('facts')}
          className="p-3.5 bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono uppercase text-[#8C96A3] block">KEY FACTS</span>
          <span className="text-xl font-serif-legal font-bold text-[#08121D] dark:text-white mt-1 block">
            {keyFacts.length}
          </span>
          <span className="text-[10px] text-[#C6A15B] flex items-center gap-1 mt-1">
            Traceable to text <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('evidence')}
          className="p-3.5 bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono uppercase text-[#8C96A3] block">POTENTIAL EVIDENCE</span>
          <span className="text-xl font-serif-legal font-bold text-[#08121D] dark:text-white mt-1 block">
            {evidenceReferences.length}
          </span>
          <span className="text-[10px] text-[#C6A15B] flex items-center gap-1 mt-1">
            CCTV, phone, weapon <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('leads')}
          className="p-3.5 bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono uppercase text-[#8C96A3] block">INVESTIGATIVE LEADS</span>
          <span className="text-xl font-serif-legal font-bold text-[#08121D] dark:text-white mt-1 block">
            {potentialLeads.length}
          </span>
          <span className="text-[10px] text-[#C6A15B] flex items-center gap-1 mt-1">
            Actionable clues <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('timeline')}
          className="p-3.5 bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] rounded-sm cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono uppercase text-[#8C96A3] block">TIMELINE EVENTS</span>
          <span className="text-xl font-serif-legal font-bold text-[#08121D] dark:text-white mt-1 block">
            {timeline.length}
          </span>
          <span className="text-[10px] text-[#C6A15B] flex items-center gap-1 mt-1">
            Chronological log <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('verification')}
          className="p-3.5 bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-red-500 rounded-sm cursor-pointer transition-all col-span-2 sm:col-span-1"
        >
          <span className="text-[10px] font-mono uppercase text-[#EF4444] block font-bold">DISCREPANCIES</span>
          <span className="text-xl font-serif-legal font-bold text-red-500 mt-1 block">
            {inconsistencies.length}
          </span>
          <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
            Requires verification <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>

      {/* Structured Factual Case Summary */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-[#C6A15B]" />
            Factual Case Summary
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Strictly Derived from Document Text
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C6A15B] block">
              WHAT ALLEGEDLY HAPPENED
            </span>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              {caseSummary.whatHappened}
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C6A15B] block">
              WHERE & WHEN
            </span>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Locus:</span> {caseSummary.whereHappened}
            </p>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Time:</span> {caseSummary.whenHappened}
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C6A15B] block">
              PARTIES & ALLEGED CONDUCT
            </span>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Persons:</span> {caseSummary.personsMentioned}
            </p>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Actions:</span> {caseSummary.allegedActions}
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#C6A15B] block">
              PROPERTY & REPORTED INJURIES
            </span>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Property:</span> {caseSummary.propertyInvolved}
            </p>
            <p className="text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
              <span className="font-semibold">Injuries:</span> {caseSummary.reportedInjuriesDamage}
            </p>
          </div>
        </div>

        {caseSummary.sequenceSummary && (
          <div className="p-3 bg-[#F7F4ED]/60 dark:bg-[#101C29]/60 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
            <span className="font-semibold text-[#08121D] dark:text-white">Sequence Narrative: </span>
            {caseSummary.sequenceSummary}
          </div>
        )}
      </div>

      {/* Case Relationship Map Preview */}
      {relationshipMap.length > 0 && (
        <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <Share2 className="w-4.5 h-4.5 text-[#C6A15B]" />
              Case Relationship Map
            </h3>
            <span className="text-[10px] font-mono text-[#8C96A3]">
              Entity Linkages
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {relationshipMap.map((rel) => (
              <div 
                key={rel.id}
                className="p-3.5 bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-col justify-between space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#08121D] dark:text-white truncate">
                    {rel.source}
                  </span>
                </div>

                <div className="py-1 px-2 bg-white dark:bg-[#08121D] rounded-sm text-center text-[10px] font-mono text-[#C6A15B] border border-[#DDD8CE] dark:border-[#1E2D3E]">
                  — {rel.relation} →
                </div>

                <div className="text-right">
                  <span className="font-semibold text-[#08121D] dark:text-white truncate block">
                    {rel.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Facts Identified Table */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#10B981]" />
            Key Facts Identified ({keyFacts.length})
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Click 'View Source' to inspect in Extracted Text
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] text-[10px] font-mono uppercase text-[#8C96A3]">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Fact</th>
                <th className="py-2.5 px-3">Source Page</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
              {keyFacts.map((fact) => (
                <tr key={fact.id} className="hover:bg-[#F7F4ED]/50 dark:hover:bg-[#101C29]/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-[#C6A15B] font-semibold whitespace-nowrap">
                    {fact.category || fact.label}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#08121D] dark:text-[#E8ECEF] max-w-md">
                    <p className="line-clamp-2">{fact.fact}</p>
                    {fact.sourceSnippet && (
                      <p className="text-[11px] text-[#8C96A3] italic mt-0.5 line-clamp-1">
                        "{fact.sourceSnippet}"
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#5A6573] dark:text-[#8C96A3] whitespace-nowrap">
                    {fact.sourcePage}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
                      fact.confidence === 'HIGH'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                    }`}>
                      {fact.confidence}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onViewSource(fact.sourcePage, fact.sourceSnippet || fact.fact)}
                      className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Source</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
