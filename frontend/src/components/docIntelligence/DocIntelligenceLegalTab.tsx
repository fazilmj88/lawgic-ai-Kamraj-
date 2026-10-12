import React from 'react';
import { 
  Scale, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { LegalContextProvision } from '../../types/documentIntelligence';

interface DocIntelligenceLegalTabProps {
  legalContext: LegalContextProvision[];
  onOpenResearch?: (query: string) => void;
}

export const DocIntelligenceLegalTab: React.FC<DocIntelligenceLegalTabProps> = ({
  legalContext,
  onOpenResearch
}) => {
  return (
    <div className="space-y-6">
      {/* Safeguard Notice */}
      <div className="bg-[#FFFBEB] dark:bg-[#151D28] border-l-3 border-[#C6A15B] p-4 rounded-sm text-xs space-y-1 shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#C6A15B] shrink-0" />
          <span className="font-semibold text-[#92400E] dark:text-[#E6C687] uppercase text-[10px] font-mono">
            STATUTORY CONTEXT SAFEGUARD
          </span>
        </div>
        <p className="text-[#78350F] dark:text-[#C5D0DC] leading-relaxed text-[11px] sm:text-xs pl-6">
          The provisions below are classified as <strong>"Potentially Relevant Provisions"</strong> under the Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023. Final determination of applicable penal sections and procedural warrants remains the statutory prerogative of the Investigating Officer and Jurisdictional Magistrate.
        </p>
      </div>

      {/* Legal Provisions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#C6A15B]" />
            Potentially Relevant Provisions ({legalContext.length})
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            BNS 2023 • BNSS 2023 • BSA 2023
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {legalContext.map((prov, idx) => (
            <div
              key={prov.id || idx}
              className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/60 rounded-sm p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-[#C6A15B] px-2.5 py-1 rounded-sm bg-[#101C29] border border-[#C6A15B]/40">
                    {prov.section}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
                    prov.confidence === 'HIGH' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}>
                    {prov.confidence} CONFIDENCE
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C96A3] font-bold block">
                    {prov.act}
                  </span>
                  <p className="text-xs text-[#08121D] dark:text-[#E8ECEF] mt-1 leading-relaxed">
                    {prov.reasonRelevant}
                  </p>
                </div>

                {prov.supportingFacts && prov.supportingFacts.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                    <span className="text-[10px] font-mono uppercase text-[#8C96A3] font-bold block">
                      SUPPORTING DOCUMENT FACTS:
                    </span>
                    <ul className="space-y-1 text-xs text-[#5A6573] dark:text-[#8C96A3]">
                      {prov.supportingFacts.map((fact, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A15B] shrink-0 mt-0.5" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {onOpenResearch && (
                <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex justify-end">
                  <button
                    onClick={() => onOpenResearch(prov.section)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>View Section & IPC Concordance</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
