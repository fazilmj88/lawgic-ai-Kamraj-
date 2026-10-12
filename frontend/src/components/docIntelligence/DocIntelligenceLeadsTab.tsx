import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Eye, 
  Copy, 
  Check, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { PotentialInvestigativeLead } from '../../types/documentIntelligence';

interface DocIntelligenceLeadsTabProps {
  potentialLeads: PotentialInvestigativeLead[];
  onViewSource: (page: string | number, snippet: string) => void;
  onAddToChecklist?: (lead: PotentialInvestigativeLead) => void;
}

export const DocIntelligenceLeadsTab: React.FC<DocIntelligenceLeadsTabProps> = ({
  potentialLeads,
  onViewSource,
  onAddToChecklist
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLead = (lead: PotentialInvestigativeLead) => {
    navigator.clipboard.writeText(`Investigative Lead: ${lead.lead}\nRelevance: ${lead.reasonForRelevance}\nSupporting Info: ${lead.supportingDocumentInfo}`);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Distinction Safeguard Banner */}
      <div className="bg-[#FFFBEB] dark:bg-[#151D28] border-l-3 border-[#F59E0B] p-4 rounded-sm text-xs space-y-1 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span className="font-semibold text-[#92400E] dark:text-[#FCD34D] uppercase text-[10px] font-mono">
            AI-INFERRED INVESTIGATIVE LEADS (CRITICAL SAFEGUARD)
          </span>
        </div>
        <p className="text-[#78350F] dark:text-[#C5D0DC] leading-relaxed text-[11px] sm:text-xs pl-6">
          The items below are <strong>AI-inferred investigative hypotheses and technical leads</strong> designed to assist the Investigating Officer in identifying potential evidence sources, surveillance loops, or telecom dumps. <em>They are strictly distinguished from directly extracted facts and must not be treated as established truths without independent field inquiry.</em>
        </p>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <Lightbulb className="w-4.5 h-4.5 text-[#C6A15B]" />
            Actionable Clues & Investigative Leads ({potentialLeads.length})
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Tactical Directions for IO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {potentialLeads.map((lead, idx) => (
            <div
              key={lead.id || idx}
              className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/60 rounded-sm p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30 font-bold">
                    INVESTIGATIVE LEAD #{idx + 1}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase ${
                    lead.confidence === 'HIGH' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}>
                    {lead.confidence} CONFIDENCE
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-[#08121D] dark:text-white leading-snug">
                  {lead.lead}
                </h4>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#8C96A3] font-bold block">
                    TACTICAL REASON FOR RELEVANCE:
                  </span>
                  <p className="text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                    {lead.reasonForRelevance}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#8C96A3] font-bold block">
                    SUPPORTING DOCUMENT INFORMATION:
                  </span>
                  <p className="text-[#5A6573] dark:text-[#8C96A3] italic leading-relaxed">
                    "{lead.supportingDocumentInfo}"
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-xs font-mono">
                <span className="text-[#8C96A3]">{lead.sourcePage}</span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLead(lead)}
                    className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="Copy lead particulars"
                  >
                    {copiedId === lead.id ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === lead.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => onViewSource(lead.sourcePage, lead.supportingDocumentInfo || lead.lead)}
                    className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Source</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
