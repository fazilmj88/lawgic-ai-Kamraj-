import React from 'react';
import { LegislativeSection, STATUTORY_DATABASE, findStatutorySection } from '../data/statutoryDatabase';
import { BookOpen, Scale, ExternalLink, ShieldCheck, AlertCircle, FileText, Gavel, X, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DetectedSectionToken {
  type: 'text' | 'section';
  content: string;
  sectionData?: LegislativeSection;
  rawMatchedText?: string;
}

// Regex to capture various Indian statutory citations:
// e.g. "Section 103 BNS", "Sec 302 IPC", "Section 318(4) BNS", "u/s 420 IPC", "BNSS Section 35(3)", "Section 63 BSA", "Section 154 CrPC", "Section 65B Evidence Act"
const SECTION_REGEX = /\b(?:(?:Section|Sec\.?|u\/s|§)\s*(\d+[A-Z]?(?:\(\d+[a-z]?\))?)\s*(?:of\s+the\s+)?(BNS|IPC|BNSS|CrPC|Cr\.P\.C\.?|BSA|IEA|Evidence\s+Act|IT\s+Act|POCSO)?|(BNS|IPC|BNSS|CrPC|BSA)\s+(?:Section|Sec\.?|§)?\s*(\d+[A-Z]?(?:\(\d+[a-z]?\))?))\b/gi;

/**
 * Extracts unique legislative sections found in a string of text.
 */
export function extractDetectedSections(text: string): LegislativeSection[] {
  if (!text || typeof text !== 'string') return [];

  const foundMap = new Map<string, LegislativeSection>();
  const matches = text.matchAll(new RegExp(SECTION_REGEX));

  for (const match of matches) {
    const rawMatch = match[0];
    const secNum1 = match[1];
    const act1 = match[2];
    const act2 = match[3];
    const secNum2 = match[4];

    const secNumber = secNum1 || secNum2 || '';
    const actHint = act1 || act2 || '';

    const resolved = findStatutorySection(secNumber, actHint);
    if (resolved) {
      foundMap.set(resolved.id, resolved);
    }
  }

  // Also check for direct numerical patterns like "103 BNS" or "302 IPC" if not caught
  STATUTORY_DATABASE.forEach((statute) => {
    const pattern = new RegExp(`\\b${statute.sectionNumber}\\s*(?:BNS|IPC|BNSS|CrPC|BSA)?\\b`, 'i');
    if (pattern.test(text) && !foundMap.has(statute.id)) {
      // If it contains the exact section display or number with context
      if (text.toLowerCase().includes(statute.sectionDisplay.toLowerCase()) || 
          text.toLowerCase().includes(`section ${statute.sectionNumber.toLowerCase()}`) ||
          text.toLowerCase().includes(`sec ${statute.sectionNumber.toLowerCase()}`)) {
        foundMap.set(statute.id, statute);
      }
    }
  });

  return Array.from(foundMap.values());
}

/**
 * Tokenizes text into plain strings and clickable section objects.
 */
export function tokenizeLegalText(text: string): DetectedSectionToken[] {
  if (!text) return [];

  const tokens: DetectedSectionToken[] = [];
  let lastIndex = 0;

  const regex = new RegExp(SECTION_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;
    const matchedText = match[0];

    // Push preceding plain text
    if (matchStart > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex, matchStart),
      });
    }

    const secNum = match[1] || match[4] || '';
    const actHint = match[2] || match[3] || '';
    const resolved = findStatutorySection(secNum, actHint);

    tokens.push({
      type: 'section',
      content: matchedText,
      rawMatchedText: matchedText,
      sectionData: resolved || undefined,
    });

    lastIndex = matchEnd;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}

interface HyperlinkedLegalTextProps {
  text: string;
  onSelectSection: (section: LegislativeSection) => void;
  className?: string;
}

/**
 * Automatically hyperlinks and highlights all detected BNS/IPC/BNSS/BSA sections in text.
 */
export const HyperlinkedLegalText: React.FC<HyperlinkedLegalTextProps> = ({
  text,
  onSelectSection,
  className = '',
}) => {
  const tokens = tokenizeLegalText(text);

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (token.type === 'section' && token.sectionData) {
          const s = token.sectionData;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSection(s);
              }}
              title={`Click to view legislative definition & case law for ${s.sectionDisplay} (${s.title})`}
              className="inline-flex items-baseline gap-1 mx-0.5 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer underline decoration-dotted decoration-[#C6A15B] underline-offset-3 hover:underline-offset-4 bg-[#C6A15B]/15 hover:bg-[#C6A15B]/25 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/40 hover:border-[#C6A15B] shadow-xs"
            >
              <BookOpen className="w-3 h-3 inline-block self-center text-[#C6A15B] shrink-0" />
              <span>{token.content}</span>
            </button>
          );
        }
        return <span key={i}>{token.content}</span>;
      })}
    </span>
  );
};

interface LegislativeDetailModalProps {
  section: LegislativeSection | null;
  onClose: () => void;
  onSearchSection?: (query: string) => void;
}

/**
 * Interactive Legislative Definition, Concordance & Annotation Modal
 */
export const LegislativeDetailModal: React.FC<LegislativeDetailModalProps> = ({
  section,
  onClose,
  onSearchSection,
}) => {
  const [activeTab, setActiveTab] = React.useState<'statute' | 'ingredients' | 'cases' | 'investigation'>('statute');
  const [copied, setCopied] = React.useState(false);

  if (!section) return null;

  const copyStatute = () => {
    const textToCopy = `${section.sectionDisplay}: ${section.title}\nAct: ${section.actFullName}\nClassification: ${section.classification}\nConcordance: ${section.concordanceDisplay}\n\nStatutory Definition:\n${section.statutoryDefinition}\n\nPunishment:\n${section.punishment}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#08121D]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] max-w-3xl w-full rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#171A1E] dark:text-[#E8ECEF]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#C6A15B]/20 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/40 font-mono font-bold text-xs uppercase rounded-xs">
                  {section.sectionDisplay}
                </span>
                <span className="text-[11px] font-mono text-[#8C96A3]">
                  {section.actFullName}
                </span>
              </div>
              <h2 className="font-serif-legal font-bold text-xl sm:text-2xl text-[#08121D] dark:text-white leading-tight">
                {section.title}
              </h2>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#5B636E] dark:text-[#B4BCC6]">
                <span className="font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-xs border border-[#10B981]/20">
                  {section.classification}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white rounded-sm border border-transparent hover:border-[#DDD8CE] dark:hover:border-[#1E2D3E] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Concordance Alert Pill */}
          <div className="px-6 py-2.5 bg-[#C6A15B]/10 border-b border-[#C6A15B]/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#A38038] dark:text-[#D5B875]">
              <Scale className="w-3.5 h-3.5" />
              <span className="font-bold">TRANSITIONAL CONCORDANCE:</span>
              <span>{section.concordanceDisplay}</span>
            </div>
            {onSearchSection && (
              <button
                onClick={() => {
                  onSearchSection(`${section.sectionDisplay} ${section.title}`);
                  onClose();
                }}
                className="text-[11px] text-[#A38038] dark:text-[#D5B875] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Search Case Laws</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#FFFFFF] dark:bg-[#08121D] px-6 gap-2 text-xs font-mono overflow-x-auto">
            {[
              { id: 'statute', label: '01 • Statutory Text' },
              { id: 'ingredients', label: '02 • Essential Ingredients' },
              { id: 'cases', label: '03 • Landmark Precedents' },
              { id: 'investigation', label: '04 • Investigation Protocol' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-3 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? 'border-[#C6A15B] text-[#A38038] dark:text-[#D5B875]'
                    : 'border-transparent text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
            
            {activeTab === 'statute' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2">
                  <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold block">
                    LEGISLATIVE BARE ACT PROVISION:
                  </span>
                  <p className="font-serif-legal text-base sm:text-lg leading-relaxed text-[#171A1E] dark:text-[#E8ECEF]">
                    "{section.statutoryDefinition}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
                    <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold block">
                      PRESCRIBED PENAL SANCTION:
                    </span>
                    <p className="font-medium text-xs sm:text-sm text-[#171A1E] dark:text-[#E8ECEF]">
                      {section.punishment}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-1">
                    <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold block">
                      COURT COMPETENCE & TRIAL FORUM:
                    </span>
                    <p className="font-medium text-xs sm:text-sm text-[#171A1E] dark:text-[#E8ECEF]">
                      {section.triableBy}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold block">
                  STATUTORY BURDEN OF PROOF & ESSENTIAL ELEMENTS:
                </span>
                <div className="space-y-2.5">
                  {section.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#C6A15B]/20 text-[#A38038] dark:text-[#D5B875] font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-[#171A1E] dark:text-[#E8ECEF] leading-relaxed">
                        {ing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold block">
                  BINDING SUPREME COURT & HIGH COURT PRECEDENTS:
                </span>
                <div className="space-y-3">
                  {section.landmarkCases.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white">
                          {c.name}
                        </h4>
                        <span className="font-mono text-[11px] text-[#A38038] dark:text-[#D5B875] bg-[#C6A15B]/10 px-2 py-0.5 rounded-xs border border-[#C6A15B]/20">
                          {c.year}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#8C96A3] block">
                        {c.citation} • {c.court}
                      </span>
                      <p className="text-xs text-[#5B636E] dark:text-[#B4BCC6] leading-relaxed pt-1 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                        <strong>Judicial Ratio:</strong> {c.ratio}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'investigation' && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold block">
                  MANDATORY INVESTIGATION & FORENSIC PROTOCOLS:
                </span>
                <div className="space-y-2.5">
                  {section.investigativeNotes.map((note, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex items-start gap-3"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-[#171A1E] dark:text-[#E8ECEF] leading-relaxed">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F4ED] dark:bg-[#08121D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={copyStatute}
                className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-xs font-mono rounded-sm flex items-center gap-1.5 cursor-pointer text-[#171A1E] dark:text-[#E8ECEF]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#C6A15B]" />}
                <span>{copied ? 'Copied' : 'Copy Statutory Citation'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="btn-legal-gold px-5 py-1.5 text-xs font-mono uppercase font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
