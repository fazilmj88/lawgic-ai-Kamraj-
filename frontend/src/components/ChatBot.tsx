import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Scale, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAI, ChatResponse } from '../gemini';

interface MessageItem {
  role: 'user' | 'ai';
  text: string;
  sources?: Array<{ web?: { uri: string; title: string } }>;
  searchQueries?: string[];
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: 'ai',
      text: 'Namaste Officer. I am the Lawgic AI Copilot, grounded with real-time statutory precedents and Indian Case Law. How may I assist your inquiry regarding BNS 2023, CrPC, BNSS, or FIR drafting procedures?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await chatWithAI(userMsg);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: response.reply,
          sources: response.sources,
          searchQueries: response.searchQueries
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: 'Communication with legal intelligence service timed out. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="absolute bottom-16 right-0 w-80 sm:w-[440px] h-[540px] bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] shadow-2xl rounded-sm flex flex-col overflow-hidden text-[#171A1E] dark:text-[#E8ECEF]"
          >
            {/* Header */}
            <div className="p-4 bg-[#08121D] text-white flex items-center justify-between border-b border-[#1E2D3E] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#C6A15B]/50 bg-[#101C29] rounded-sm flex items-center justify-center text-[#D5B875]">
                  <Scale className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-serif-legal font-bold text-sm">Lawgic AI Copilot</p>
                    <span className="px-1.5 py-0.2 bg-[#101C29] border border-[#C6A15B]/30 text-[#D5B875] text-[9px] font-mono font-bold rounded-sm">
                      SEARCH GROUNDED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8C96A3] font-mono">BNS 2023 & Judicial Precedents</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#8C96A3] hover:text-white hover:bg-[#101C29] rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[88%] p-3.5 rounded-sm text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#08121D] text-white font-medium border border-[#1E2D3E]'
                      : 'bg-[#FFFFFF] dark:bg-[#08121D] text-[#171A1E] dark:text-[#E8ECEF] border border-[#DDD8CE] dark:border-[#1E2D3E]'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Grounding Sources in Chat */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] space-y-1">
                        <p className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#C6A15B]" /> Statutory Citations:
                        </p>
                        <div className="flex flex-col gap-1">
                          {m.sources.slice(0, 3).map((src, i) => (
                            <a
                              key={i}
                              href={src.web?.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#5B636E] dark:text-[#B4BCC6] hover:text-[#A38038] dark:hover:text-[#D5B875] flex items-center justify-between bg-[#FCFBF8] dark:bg-[#101C29] p-1.5 rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] group"
                            >
                              <span className="truncate max-w-[240px] font-mono">{src.web?.title || src.web?.uri}</span>
                              <ExternalLink className="w-3 h-3 text-[#8C96A3] group-hover:text-[#C6A15B] shrink-0 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#FFFFFF] dark:bg-[#08121D] p-3 rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center gap-2 text-xs text-[#8C96A3]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A15B]" />
                    <span className="text-[11px] font-mono">Grounding inquiry with case laws...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#FCFBF8] dark:bg-[#08121D] border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a legal or procedural question..."
                  className="flex-1 bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] py-2 px-3 text-xs focus:border-[#C6A15B] focus:outline-none rounded-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="btn-legal-gold p-2 rounded-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#08121D]" />
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-legal-gold p-3.5 rounded-sm shadow-xl flex items-center gap-2 cursor-pointer"
        title="Open AI Legal Copilot"
      >
        <Scale className="w-5 h-5 text-[#08121D]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#08121D] hidden sm:inline">
          Legal Copilot
        </span>
      </button>
    </div>
  );
};
