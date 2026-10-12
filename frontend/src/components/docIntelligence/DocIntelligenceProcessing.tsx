import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  FileText, 
  ScanLine, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Scale, 
  Sparkles,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';
import { motion } from 'motion/react';

interface DocIntelligenceProcessingProps {
  fileName: string;
  fileSize: number;
}

const STEPS = [
  { id: 1, label: 'Reading Document Payload & Validating Structure', icon: FileText },
  { id: 2, label: 'Multimodal OCR & Complete Page Text Extraction', icon: ScanLine },
  { id: 3, label: 'Analyzing Legal Context & Document Classification', icon: Scale },
  { id: 4, label: 'Extracting Key Facts, Parties & Entity Roles', icon: Fingerprint },
  { id: 5, label: 'Identifying Potential Evidence References', icon: Layers },
  { id: 6, label: 'Reconstructing Chronological Incident Timeline', icon: Clock },
  { id: 7, label: 'Scanning for Factual Contradictions & Missing Details', icon: AlertTriangle },
  { id: 8, label: 'Synthesizing Statutory Intelligence Report', icon: Sparkles },
];

export const DocIntelligenceProcessing: React.FC<DocIntelligenceProcessingProps> = ({
  fileName,
  fileSize
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(Math.round(((currentStepIndex + 1) / STEPS.length) * 100), 96);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
      {/* Central Rotating Icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-[#C6A15B]/20 animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#C6A15B] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="w-24 h-24 rounded-full bg-[#101C29] border border-[#C6A15B]/60 flex items-center justify-center text-[#D5B875] shadow-xl">
          <ScanLine className="w-10 h-10 animate-pulse" />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <h2 className="font-serif-legal text-2xl font-bold text-[#08121D] dark:text-white">
          Analyzing Case Document
        </h2>
        <p className="text-xs font-mono text-[#5A6573] dark:text-[#8C96A3]">
          {fileName} • {(fileSize / 1024).toFixed(1)} KB
        </p>
        <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] max-w-md mx-auto">
          Deep multi-page analysis in progress. Performing OCR, identifying parties, timeline milestones, and statutory provisions.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 max-w-md mx-auto">
        <div className="flex justify-between text-[11px] font-mono text-[#8C96A3]">
          <span>PIPELINE PROGRESS</span>
          <span className="text-[#C6A15B] font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-[#DDD8CE] dark:bg-[#1E2D3E] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#C6A15B]"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Sequence List */}
      <div className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-5 text-left max-w-md mx-auto space-y-3 shadow-sm">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-xs transition-colors ${
                isDone 
                  ? 'text-[#10B981]' 
                  : isCurrent 
                  ? 'text-[#C6A15B] font-semibold' 
                  : 'text-[#8C96A3]/60'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C6A15B]" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5 text-[#8C96A3]/40" />
                )}
              </div>
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <p className="text-[11px] font-mono text-[#8C96A3] uppercase tracking-wider">
        LAWGIC AI • POLICE INTELLIGENCE SUBSYSTEM • BNS 2023 COMPLIANT
      </p>
    </div>
  );
};
