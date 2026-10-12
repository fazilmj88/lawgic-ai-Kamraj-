import React from 'react';
import { 
  Clock, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  ArrowDown
} from 'lucide-react';
import { DocTimelineEvent } from '../../types/documentIntelligence';

interface DocIntelligenceTimelineTabProps {
  timeline: DocTimelineEvent[];
  onViewSource: (page: string | number, snippet: string) => void;
}

export const DocIntelligenceTimelineTab: React.FC<DocIntelligenceTimelineTabProps> = ({
  timeline,
  onViewSource
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#C6A15B]" />
            Reconstructed Incident Timeline ({timeline.length} Milestones)
          </h3>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
            Chronological sequence derived directly from document records. Missing times marked as "Time not specified".
          </p>
        </div>

        <span className="text-[10px] font-mono text-[#8C96A3] uppercase px-2.5 py-1 rounded-sm bg-[#F7F4ED] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] self-start sm:self-auto">
          CHRONOLOGICAL ORDER
        </span>
      </div>

      {/* Timeline Sequence */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-[#C6A15B]/30 space-y-6 ml-2 sm:ml-4">
        {timeline.map((item, idx) => (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Dot Marker */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#101C29] border-2 border-[#C6A15B] flex items-center justify-center group-hover:scale-125 transition-transform">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D5B875]" />
            </div>

            {/* Event Card */}
            <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/60 rounded-sm p-4 sm:p-5 shadow-sm space-y-2.5 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#C6A15B] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                    {item.date}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#1E2D3E] font-semibold">
                    {item.time || 'Time not specified'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#8C96A3]">{item.sourcePage}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.2 rounded-sm font-bold uppercase ${
                    item.confidence === 'HIGH' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}>
                    {item.confidence}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#08121D] dark:text-[#E8ECEF] leading-relaxed">
                {item.event}
              </p>

              {item.sourceSnippet && (
                <p className="text-[11px] text-[#8C96A3] italic">
                  "{item.sourceSnippet}"
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onViewSource(item.sourcePage, item.sourceSnippet || item.event)}
                  className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Source</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
