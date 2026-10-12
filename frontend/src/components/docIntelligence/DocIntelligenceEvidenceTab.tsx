import React from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Eye, 
  Video, 
  Smartphone, 
  FileText, 
  AlertTriangle,
  Flame,
  ArrowRight,
  Scale
} from 'lucide-react';
import { 
  PotentialEvidenceReference, 
  EvidenceLegalMapping 
} from '../../types/documentIntelligence';

interface DocIntelligenceEvidenceTabProps {
  evidenceReferences: PotentialEvidenceReference[];
  evidenceToLegalMapping: EvidenceLegalMapping[];
  onViewSource: (page: string | number, snippet: string) => void;
}

export const DocIntelligenceEvidenceTab: React.FC<DocIntelligenceEvidenceTabProps> = ({
  evidenceReferences,
  evidenceToLegalMapping,
  onViewSource
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Digital': return Video;
      case 'Weapon': return Flame;
      case 'Physical / Biological': return ShieldCheck;
      case 'Financial': return Scale;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Notice Banner */}
      <div className="bg-[#FFFBEB] dark:bg-[#151D28] border border-[#C6A15B]/30 p-4 rounded-sm text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-[#92400E] dark:text-[#E6C687] uppercase text-[10px] font-mono block">
            EVIDENCE CLASSIFICATION SAFEGUARD
          </span>
          <p className="text-[#78350F] dark:text-[#C5D0DC] leading-relaxed text-[11px] sm:text-xs">
            Items listed below are identified as <strong>"Potential Evidence References"</strong> or <strong>"Evidence Mentioned in Document"</strong>. Their evidentiary admissibility and forensic chain of custody must be formally established by the Investigating Officer under the Bharatiya Sakshya Adhiniyam (BSA) 2023.
          </p>
        </div>
      </div>

      {/* Evidence References Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-[#C6A15B]" />
            Evidence Mentioned in Document ({evidenceReferences.length})
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Potential Corroborative Material
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidenceReferences.map((ev) => {
            const Icon = getCategoryIcon(ev.category);
            return (
              <div 
                key={ev.id}
                className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#C6A15B]/60 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#1E2D3E] flex items-center gap-1 font-bold">
                      <Icon className="w-2.5 h-2.5" />
                      {ev.category}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
                      ev.confidence === 'HIGH' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                    }`}>
                      {ev.confidence}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-[#08121D] dark:text-white">
                    {ev.evidenceReference}
                  </h4>

                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#8C96A3] block font-bold">
                      WHY IT MAY BE RELEVANT:
                    </span>
                    <p className="text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                      {ev.whyRelevant}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#8C96A3] block font-bold">
                      WHERE MENTIONED:
                    </span>
                    <p className="text-[#5A6573] dark:text-[#8C96A3] italic leading-relaxed">
                      "{ev.whereMentioned}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8C96A3]">{ev.sourcePage}</span>
                  <button
                    onClick={() => onViewSource(ev.sourcePage, ev.sourceSnippet || ev.evidenceReference)}
                    className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Source</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence to Legal Context Mapping */}
      {evidenceToLegalMapping.length > 0 && (
        <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <Scale className="w-4.5 h-4.5 text-[#C6A15B]" />
              Evidence-to-Legal Context Mapping
            </h3>
            <span className="text-[10px] font-mono text-[#8C96A3]">
              BNS & BSA Corroboration Framework
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] text-[10px] font-mono uppercase text-[#8C96A3]">
                  <th className="py-2.5 px-3">Evidence Item</th>
                  <th className="py-2.5 px-3">Potential Relevance</th>
                  <th className="py-2.5 px-3">Supports Review Of</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
                {evidenceToLegalMapping.map((map) => (
                  <tr key={map.id} className="hover:bg-[#F7F4ED]/50 dark:hover:bg-[#101C29]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#08121D] dark:text-white whitespace-nowrap">
                      {map.evidenceItem}
                    </td>
                    <td className="py-3 px-3 text-[#5A6573] dark:text-[#8C96A3] max-w-sm leading-relaxed">
                      {map.potentialRelevance}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#C6A15B] font-semibold">
                      {map.supportsReviewOf}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#8C96A3] whitespace-nowrap">
                      {map.sourcePage}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewSource(map.sourcePage, map.evidenceItem)}
                        className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Source</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
