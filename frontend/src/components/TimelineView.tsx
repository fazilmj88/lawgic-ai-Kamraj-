import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  Sparkles, 
  Printer, 
  Download, 
  X, 
  Check, 
  AlertCircle, 
  PhoneCall, 
  Dna, 
  Scale, 
  FileCheck, 
  ArrowRight, 
  RefreshCw, 
  LayoutList, 
  Columns, 
  ChevronRight,
  HelpCircle,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { TimelineEvent, TimelineEventCategory, FIRCase, View } from '../types';
import { reconstructTimelineWithAI } from '../gemini';

interface TimelineViewProps {
  initialCaseId?: string;
  onNavigateToCase?: (caseId: string) => void;
  setCurrentView?: (view: View) => void;
  onBack?: () => void;
}

export const CATEGORY_CONFIG: Record<TimelineEventCategory, {
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  incident: {
    label: 'Incident / Offence',
    color: '#EF4444',
    bgLight: 'bg-[#EF4444]/10',
    bgDark: 'dark:bg-[#EF4444]/15',
    borderLight: 'border-[#EF4444]/30',
    borderDark: 'dark:border-[#EF4444]/40',
    icon: AlertCircle
  },
  first_response: {
    label: 'First Response / PCR',
    color: '#F59E0B',
    bgLight: 'bg-[#F59E0B]/10',
    bgDark: 'dark:bg-[#F59E0B]/15',
    borderLight: 'border-[#F59E0B]/30',
    borderDark: 'dark:border-[#F59E0B]/40',
    icon: PhoneCall
  },
  investigation: {
    label: 'Field Investigation',
    color: '#3B82F6',
    bgLight: 'bg-[#3B82F6]/10',
    bgDark: 'dark:bg-[#3B82F6]/15',
    borderLight: 'border-[#3B82F6]/30',
    borderDark: 'dark:border-[#3B82F6]/40',
    icon: Search
  },
  forensic: {
    label: 'Forensic / Medical / Seizure',
    color: '#10B981',
    bgLight: 'bg-[#10B981]/10',
    bgDark: 'dark:bg-[#10B981]/15',
    borderLight: 'border-[#10B981]/30',
    borderDark: 'dark:border-[#10B981]/40',
    icon: Dna
  },
  apprehension: {
    label: 'Suspect Apprehension',
    color: '#8B5CF6',
    bgLight: 'bg-[#8B5CF6]/10',
    bgDark: 'dark:bg-[#8B5CF6]/15',
    borderLight: 'border-[#8B5CF6]/30',
    borderDark: 'dark:border-[#8B5CF6]/40',
    icon: Shield
  },
  judicial: {
    label: 'Judicial / Remand / Court',
    color: '#6366F1',
    bgLight: 'bg-[#6366F1]/10',
    bgDark: 'dark:bg-[#6366F1]/15',
    borderLight: 'border-[#6366F1]/30',
    borderDark: 'dark:border-[#6366F1]/40',
    icon: Scale
  },
  other: {
    label: 'General Case Event',
    color: '#64748B',
    bgLight: 'bg-[#64748B]/10',
    bgDark: 'dark:bg-[#64748B]/15',
    borderLight: 'border-[#64748B]/30',
    borderDark: 'dark:border-[#64748B]/40',
    icon: FileText
  }
};

export const TimelineView: React.FC<TimelineViewProps> = ({ initialCaseId, onNavigateToCase, setCurrentView, onBack }) => {
  const { cases, user, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, updateCaseTimeline } = useAuth();

  // Active case state
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (initialCaseId && cases.some(c => c.caseId === initialCaseId)) {
      return initialCaseId;
    }
    return cases[0]?.caseId || 'FIR-2026-088';
  });

  // Sync if initialCaseId changes from external navigation (e.g. clicking a docket)
  useEffect(() => {
    if (initialCaseId && cases.some(c => c.caseId === initialCaseId)) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId, cases]);

  // Current active case
  const activeCase = useMemo(() => {
    return cases.find(c => c.caseId === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Current events list
  const events = useMemo(() => {
    return activeCase?.timelineEvents || [];
  }, [activeCase]);

  // UI View Mode: 'vertical' | 'horizontal' | 'table' | 'print'
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal' | 'table'>('vertical');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestedEvents, setAiSuggestedEvents] = useState<TimelineEvent[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form state for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TimelineEventCategory>('incident');
  const [formSource, setFormSource] = useState('');
  const [formSeverity, setFormSeverity] = useState<'routine' | 'major' | 'critical'>('major');
  const [formVerified, setFormVerified] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for new event
  const handleOpenAddModal = (presetDate?: string, presetLocation?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(presetDate || activeCase?.incidentDate || new Date().toISOString().split('T')[0]);
    setFormTime(activeCase?.incidentTime || '18:45 hrs');
    setFormLocation(presetLocation || activeCase?.policeStation || '');
    setFormDescription('');
    setFormCategory('incident');
    setFormSource('Complainant Statement (Section 180 BNSS)');
    setFormSeverity('major');
    setFormVerified(true);
    setFormNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open modal for editing event
  const handleOpenEditModal = (evt: TimelineEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormTime(evt.time || '');
    setFormLocation(evt.location);
    setFormDescription(evt.description);
    setFormCategory(evt.category);
    setFormSource(evt.source || '');
    setFormSeverity(evt.severity || 'major');
    setFormVerified(evt.verified ?? true);
    setFormNotes(evt.officerNotes || '');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Save Event (Add or Edit)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Event title is required.');
      return;
    }
    if (!formDate.trim()) {
      setFormError('Date is required.');
      return;
    }
    if (!formLocation.trim()) {
      setFormError('Location is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description narrative is required.');
      return;
    }

    if (!activeCase) {
      setFormError('No active case selected.');
      return;
    }

    try {
      if (editingEvent) {
        const updated: TimelineEvent = {
          ...editingEvent,
          title: formTitle.trim(),
          date: formDate.trim(),
          time: formTime.trim() || undefined,
          location: formLocation.trim(),
          description: formDescription.trim(),
          category: formCategory,
          source: formSource.trim() || undefined,
          severity: formSeverity,
          verified: formVerified,
          officerNotes: formNotes.trim() || undefined,
          updatedAt: new Date().toISOString()
        };
        await updateTimelineEvent(activeCase.caseId, updated);
        showToast('Timeline event updated successfully');
      } else {
        await addTimelineEvent(activeCase.caseId, {
          caseId: activeCase.caseId,
          title: formTitle.trim(),
          date: formDate.trim(),
          time: formTime.trim() || undefined,
          location: formLocation.trim(),
          description: formDescription.trim(),
          category: formCategory,
          source: formSource.trim() || undefined,
          severity: formSeverity,
          verified: formVerified,
          officerNotes: formNotes.trim() || undefined
        });
        showToast('New event added to timeline');
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save event');
    }
  };

  // Delete event with confirmation
  const handleDeleteEvent = async (evtId: string, evtTitle: string) => {
    if (!activeCase) return;
    if (confirm(`Are you sure you want to remove event "${evtTitle}" from the case timeline?`)) {
      try {
        await deleteTimelineEvent(activeCase.caseId, evtId);
        showToast('Event removed from case timeline');
      } catch (err: any) {
        alert('Failed to delete event: ' + err?.message);
      }
    }
  };

  // Toggle verified status
  const handleToggleVerified = async (evt: TimelineEvent) => {
    if (!activeCase) return;
    try {
      await updateTimelineEvent(activeCase.caseId, {
        ...evt,
        verified: !evt.verified,
        updatedAt: new Date().toISOString()
      });
      showToast(evt.verified ? 'Event marked as Unverified' : 'Event verified by Investigating Officer');
    } catch (err: any) {
      alert('Failed to update verification status');
    }
  };

  // Trigger AI Auto-Reconstruction
  const handleTriggerAiReconstruction = async () => {
    if (!activeCase) return;
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      const generated = await reconstructTimelineWithAI(
        activeCase.incidentDescription,
        {
          caseId: activeCase.caseId,
          incidentDate: activeCase.incidentDate,
          incidentTime: activeCase.incidentTime,
          policeStation: activeCase.policeStation,
          district: activeCase.district,
          crimeType: activeCase.crimeType
        }
      );
      setAiSuggestedEvents(generated);
    } catch (err) {
      console.warn('AI reconstruction error, generating intelligent local fallback:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI events to case
  const handleApplyAiEvents = async (mode: 'append' | 'replace') => {
    if (!activeCase || aiSuggestedEvents.length === 0) return;
    try {
      const newEventsList = mode === 'replace' 
        ? aiSuggestedEvents 
        : [...(activeCase.timelineEvents || []), ...aiSuggestedEvents];
      
      await updateCaseTimeline(activeCase.caseId, newEventsList);
      setIsAiModalOpen(false);
      showToast(`Successfully ${mode === 'replace' ? 'reconstructed' : 'appended'} timeline events`);
    } catch (err: any) {
      alert('Failed to save timeline: ' + err?.message);
    }
  };

  // Toast feedback
  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Filter verified only
    if (verifiedOnly) {
      result = result.filter(e => e.verified);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.source && e.source.toLowerCase().includes(q)) ||
        e.date.includes(q)
      );
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = `${a.date} ${a.time || '00:00'}`;
      const dateB = `${b.date} ${b.time || '00:00'}`;
      if (sortOrder === 'asc') {
        return dateA.localeCompare(dateB);
      } else {
        return dateB.localeCompare(dateA);
      }
    });

    return result;
  }, [events, selectedCategory, verifiedOnly, searchQuery, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = events.length;
    const verifiedCount = events.filter(e => e.verified).length;
    
    // Dates calculation
    const sortedDates = [...events].map(e => e.date).filter(Boolean).sort();
    const earliestDate = sortedDates[0] || activeCase?.incidentDate || 'N/A';
    const latestDate = sortedDates[sortedDates.length - 1] || activeCase?.incidentDate || 'N/A';
    
    return {
      total,
      verifiedCount,
      earliestDate,
      latestDate,
      crimeCategory: activeCase?.crimeType || 'Unclassified'
    };
  }, [events, activeCase]);

  // Active milestone for horizontal roadmap
  const activeMilestone = useMemo(() => {
    if (!selectedMilestoneId) return filteredEvents[0] || null;
    return filteredEvents.find(e => e.id === selectedMilestoneId) || filteredEvents[0] || null;
  }, [filteredEvents, selectedMilestoneId]);

  // Helper to calculate time elapsed between two events
  const getTimeElapsedBadge = (current: TimelineEvent, prev?: TimelineEvent) => {
    if (!prev) return null;
    try {
      const d1 = new Date(`${prev.date}T${(prev.time || '00:00').slice(0, 5)}:00`);
      const d2 = new Date(`${current.date}T${(current.time || '00:00').slice(0, 5)}:00`);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        if (current.date !== prev.date) {
          return `Next Day (${current.date})`;
        }
        return null;
      }

      const diffMs = d2.getTime() - d1.getTime();
      if (diffMs <= 0) return null;

      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) {
        return `+${diffMins} mins elapsed`;
      }
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      if (diffHours < 24) {
        return `+${diffHours}h ${remainingMins > 0 ? `${remainingMins}m` : ''} elapsed`;
      }
      const diffDays = Math.floor(diffHours / 24);
      return `+${diffDays} day${diffDays > 1 ? 's' : ''} later`;
    } catch {
      return null;
    }
  };

  // Export / Print Case Diary report
  const handlePrintCaseDiary = () => {
    window.print();
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-16"
    >
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#08121D] dark:bg-[#C6A15B] text-white dark:text-[#08121D] border border-[#C6A15B] rounded-sm shadow-xl font-mono text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#C6A15B] dark:text-[#08121D]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TOP BAR: Case Selector & Header Dossier */}
      <div className="bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-5 sm:p-6 rounded-sm shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
          <div className="flex items-start gap-3.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
                title="Back to previous view"
              >
                <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
                <span>Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#A38038] dark:text-[#D5B875] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
                  INCIDENT TIMELINE VISUALIZATION & CASE CHRONOLOGY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/30 font-bold">
                  SEC 172 BNSS COMPLIANT
                </span>
              </div>
              <h2 className="font-serif-legal text-2xl sm:text-3xl font-bold text-[#08121D] dark:text-white">
                {activeCase ? `Case Chronology: ${activeCase.caseId}` : 'Case Event Chronology'}
              </h2>
            </div>
          </div>

          {/* Case selector dropdown & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] px-3 py-1.5 rounded-sm">
              <FolderOpen className="w-4 h-4 text-[#C6A15B]" />
              <label htmlFor="case-selector-dropdown" className="text-[11px] font-mono font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase">
                ACTIVE CASE:
              </label>
              <select
                id="case-selector-dropdown"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#08121D] dark:text-white focus:outline-none cursor-pointer pr-2"
              >
                {cases.map((c) => (
                  <option key={c.caseId} value={c.caseId} className="bg-white dark:bg-[#08121D] text-[#08121D] dark:text-white">
                    {c.caseId} - {c.complainant} ({c.policeStation})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Link to Docket Dossier in Dashboard */}
            {activeCase && (
              <button
                onClick={() => {
                  if (onNavigateToCase) {
                    onNavigateToCase(activeCase.caseId);
                  } else if (setCurrentView) {
                    setCurrentView('dashboard');
                  }
                }}
                className="px-3 py-2 bg-[#FCFBF8] dark:bg-[#0D1824] hover:bg-[#EAE5D8] dark:hover:bg-[#152332] text-[#171A1E] dark:text-[#E8ECEF] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Open Case Docket Dossier in Dashboard"
              >
                <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Case Docket</span>
                <ChevronRight className="w-3 h-3 text-[#8C96A3]" />
              </button>
            )}

            {/* AI Auto-Reconstruction Button */}
            <button
              id="ai-reconstruct-timeline-btn"
              onClick={handleTriggerAiReconstruction}
              className="px-3.5 py-2 bg-[#C6A15B]/15 hover:bg-[#C6A15B]/25 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/30 rounded-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
              title="Automatically extract key chronological events from case narrative using AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>AI Auto-Extract</span>
            </button>

            {/* Add Event Primary Button */}
            <button
              id="add-timeline-event-primary-btn"
              onClick={() => handleOpenAddModal()}
              className="btn-legal-gold px-4 py-2 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Case Context Summary & Metrics */}
        <AnimatePresence mode="wait">
          {activeCase && (
            <motion.div 
              key={activeCase.caseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1"
            >
              <div className="p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] block">
                  COMPLAINANT & JURISDICTION
                </span>
                <p className="font-semibold text-xs sm:text-sm text-[#08121D] dark:text-white truncate">
                  {activeCase.complainant}
                </p>
                <span className="text-[10px] text-[#A38038] dark:text-[#D5B875] truncate block">
                  {activeCase.policeStation}
                </span>
              </div>

            <div className="p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] block">
                TIMELINE EVENT VOLUME
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base sm:text-lg text-[#08121D] dark:text-white">
                  {stats.total}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold rounded-xs">
                  {stats.verifiedCount}/{stats.total} Verified
                </span>
              </div>
              <span className="text-[10px] text-[#6D7278] dark:text-[#8C96A3]">
                Section 172 Case Diary Entries
              </span>
            </div>

            <div className="p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
              <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] block">
                CHRONOLOGICAL SPAN
              </span>
              <p className="font-mono text-xs font-semibold text-[#08121D] dark:text-white">
                {stats.earliestDate}
              </p>
              <span className="text-[10px] text-[#6D7278] dark:text-[#8C96A3] flex items-center gap-1 font-mono">
                to {stats.latestDate}
              </span>
            </div>

            <div className="p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] block">
                  STATUTORY OFFENCE
                </span>
                <span className="text-xs font-medium text-[#08121D] dark:text-white line-clamp-1">
                  {activeCase.crimeType}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 font-bold uppercase rounded-xs ${
                  activeCase.priority === 'Critical' 
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' 
                    : 'bg-[#C6A15B]/15 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/30'
                }`}>
                  {activeCase.priority} PRIORITY
                </span>
                <span className="text-[10px] font-mono text-[#6D7278] dark:text-[#8C96A3]">
                  {activeCase.status}
                </span>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROLS BAR: Visualization Switcher, Search, Category Filters */}
      <div className="bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View mode toggle with motion layoutId sliding pill */}
        <div className="flex items-center gap-1 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-1 rounded-sm relative">
          <button
            onClick={() => setViewMode('vertical')}
            className={`relative px-3 py-1.5 rounded-xs text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors z-10 ${
              viewMode === 'vertical'
                ? 'text-[#08121D] font-bold'
                : 'text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            {viewMode === 'vertical' && (
              <motion.div 
                layoutId="timeline-active-tab-pill" 
                className="absolute inset-0 bg-[#C6A15B] rounded-xs shadow-xs -z-10" 
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }} 
              />
            )}
            <Clock className="w-3.5 h-3.5" />
            <span>Vertical Spine</span>
          </button>

          <button
            onClick={() => setViewMode('horizontal')}
            className={`relative px-3 py-1.5 rounded-xs text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors z-10 ${
              viewMode === 'horizontal'
                ? 'text-[#08121D] font-bold'
                : 'text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            {viewMode === 'horizontal' && (
              <motion.div 
                layoutId="timeline-active-tab-pill" 
                className="absolute inset-0 bg-[#C6A15B] rounded-xs shadow-xs -z-10" 
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }} 
              />
            )}
            <Columns className="w-3.5 h-3.5" />
            <span>Milestone Stepper</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`relative px-3 py-1.5 rounded-xs text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors z-10 ${
              viewMode === 'table'
                ? 'text-[#08121D] font-bold'
                : 'text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white'
            }`}
          >
            {viewMode === 'table' && (
              <motion.div 
                layoutId="timeline-active-tab-pill" 
                className="absolute inset-0 bg-[#C6A15B] rounded-xs shadow-xs -z-10" 
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }} 
              />
            )}
            <LayoutList className="w-3.5 h-3.5" />
            <span>Case Diary (Tabular)</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C96A3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, description, or title..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs text-[#08121D] dark:text-white placeholder:text-[#8C96A3] focus:border-[#C6A15B] focus:outline-none rounded-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chronological order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1.5 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] text-[#08121D] dark:text-white text-xs font-mono flex items-center gap-1.5 rounded-sm hover:border-[#C6A15B] transition-colors cursor-pointer"
            title="Toggle chronological sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>{sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>

          {/* Verified only toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 rounded-sm border cursor-pointer transition-colors ${
              verifiedOnly
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 font-bold'
                : 'bg-[#FCFBF8] dark:bg-[#0D1824] text-[#6D7278] dark:text-[#8C96A3] border-[#DDD8CE] dark:border-[#1E2D3E]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Only</span>
          </button>

          {/* Print / Export button */}
          <button
            onClick={handlePrintCaseDiary}
            className="p-1.5 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white rounded-sm hover:border-[#C6A15B] transition-colors cursor-pointer"
            title="Print Court-Admissible Case Diary Chronology"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-mono uppercase font-bold text-[#6D7278] dark:text-[#8C96A3] mr-1 shrink-0">
          STAGE FILTER:
        </span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-xs font-mono text-[11px] font-semibold uppercase shrink-0 transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#08121D] dark:bg-[#C6A15B] text-white dark:text-[#08121D]'
              : 'bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3]'
          }`}
        >
          All Stages ({events.length})
        </button>

        {(Object.keys(CATEGORY_CONFIG) as TimelineEventCategory[]).map(catKey => {
          const cfg = CATEGORY_CONFIG[catKey];
          const count = events.filter(e => e.category === catKey).length;
          if (count === 0 && selectedCategory !== catKey) return null;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(selectedCategory === catKey ? 'all' : catKey)}
              className={`px-2.5 py-1 rounded-xs font-mono text-[11px] font-semibold shrink-0 border transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-[#C6A15B] text-[#08121D] border-[#C6A15B]'
                  : 'bg-[#FFFFFF] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span>{cfg.label}</span>
              <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredEvents.length === 0 && (
        <div className="bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-12 text-center rounded-sm space-y-4">
          <Clock className="w-12 h-12 text-[#C6A15B]/40 mx-auto" />
          <div>
            <h3 className="font-serif-legal text-lg font-bold text-[#08121D] dark:text-white">
              No Timeline Events Found
            </h3>
            <p className="text-xs text-[#6D7278] dark:text-[#8C96A3] max-w-md mx-auto mt-1">
              {events.length === 0
                ? 'This case does not have any recorded timeline events yet. Add key occurrences, distress calls, spot inspections, and evidence seizures to build the incident chronology.'
                : 'No events match your current search and stage filters. Try clearing your search query or selecting "All Stages".'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleOpenAddModal()}
              className="btn-legal-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Event</span>
            </button>
            <button
              onClick={handleTriggerAiReconstruction}
              className="px-4 py-2 bg-[#C6A15B]/15 hover:bg-[#C6A15B]/25 text-[#A38038] dark:text-[#D5B875] border border-[#C6A15B]/30 rounded-sm text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C6A15B]" />
              <span>AI Auto-Extract from Case</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODES: WRAPPED IN ANIMATE PRESENCE FOR SMOOTH TRANSITIONS */}
      <AnimatePresence mode="wait">
        {/* VIEW MODE 1: VERTICAL SPINE TIMELINE */}
        {viewMode === 'vertical' && filteredEvents.length > 0 && (
          <motion.div 
            key="vertical"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="relative pl-4 sm:pl-8 space-y-6 before:absolute before:left-[19px] sm:before:left-[35px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#C6A15B] before:via-[#DDD8CE] dark:before:via-[#1E2D3E] before:to-[#C6A15B]"
          >
            <AnimatePresence initial={false}>
              {filteredEvents.map((evt, idx) => {
                const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.other;
                const CatIcon = cfg.icon;
                const prevEvt = idx > 0 ? filteredEvents[idx - 1] : undefined;
                const elapsedBadge = getTimeElapsedBadge(evt, prevEvt);

                return (
                  <motion.div 
                    layout
                    key={evt.id} 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative group"
                  >
                {/* Elapsed time badge between events */}
                {elapsedBadge && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-full text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] font-semibold ml-8 shadow-xs">
                    <Clock className="w-3 h-3 text-[#C6A15B]" />
                    <span>{elapsedBadge}</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Timeline circular node */}
                  <div 
                    className="relative z-10 w-8 h-8 rounded-full border-2 bg-white dark:bg-[#08121D] flex items-center justify-center shrink-0 shadow-sm"
                    style={{ borderColor: cfg.color }}
                  >
                    <CatIcon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>

                  {/* Main Event Card */}
                  <div className="flex-1 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-4 sm:p-5 rounded-sm shadow-sm hover:border-[#C6A15B] transition-all space-y-3">
                    {/* Header: Date, Time, Category, Verification Badge, Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Date badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm font-mono text-xs font-bold text-[#08121D] dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                          <span>{evt.date}</span>
                          {evt.time && (
                            <>
                              <span className="text-[#DDD8CE] dark:text-[#1E2D3E]">•</span>
                              <span className="text-[#A38038] dark:text-[#D5B875]">{evt.time}</span>
                            </>
                          )}
                        </div>

                        {/* Category tag */}
                        <span 
                          className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase border"
                          style={{
                            color: cfg.color,
                            backgroundColor: `${cfg.color}15`,
                            borderColor: `${cfg.color}35`
                          }}
                        >
                          {cfg.label}
                        </span>

                        {/* Severity tag */}
                        {evt.severity === 'critical' && (
                          <span className="px-1.5 py-0.5 bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-[10px] font-mono font-bold uppercase">
                            CRITICAL MILESTONE
                          </span>
                        )}
                      </div>

                      {/* Verification & Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Verified status badge / toggle */}
                        <button
                          onClick={() => handleToggleVerified(evt)}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded-xs border flex items-center gap-1 transition-colors cursor-pointer ${
                            evt.verified
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25 font-bold'
                              : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30 hover:bg-[#64748B]/20 font-semibold'
                          }`}
                          title="Click to toggle official verification"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{evt.verified ? 'VERIFIED BY IO' : 'UNVERIFIED'}</span>
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="p-1 text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white rounded-xs hover:bg-gray-100 dark:hover:bg-[#101C29] transition-colors cursor-pointer"
                          title="Edit this event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          className="p-1 text-[#EF4444]/70 hover:text-[#EF4444] rounded-xs hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                          title="Delete this event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-serif-legal text-base sm:text-lg font-bold text-[#08121D] dark:text-white">
                        {evt.title}
                      </h4>
                    </div>

                    {/* Location Badge (Prominent) */}
                    <div className="flex items-start gap-2 p-2.5 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs">
                      <MapPin className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[10px] uppercase font-bold text-[#6D7278] dark:text-[#8C96A3] block">
                          LOCATION OF OCCURRENCE / ACTION
                        </span>
                        <span className="font-semibold text-[#08121D] dark:text-white">
                          {evt.location}
                        </span>
                      </div>
                    </div>

                    {/* Description Narrative */}
                    <div className="text-xs sm:text-sm text-[#171A1E] dark:text-[#E8ECEF] leading-relaxed">
                      <p className="whitespace-pre-line">{evt.description}</p>
                    </div>

                    {/* Footer: Evidentiary Source & Officer Notes */}
                    {(evt.source || evt.officerNotes) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] text-xs">
                        {evt.source && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6D7278] dark:text-[#8C96A3]">
                            <FileCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                            <span className="font-bold">EVIDENCE SOURCE:</span>
                            <span className="text-[#08121D] dark:text-white">{evt.source}</span>
                          </div>
                        )}

                        {evt.officerNotes && (
                          <div className="text-[11px] font-mono text-[#A38038] dark:text-[#D5B875] bg-[#C6A15B]/10 px-2 py-0.5 rounded-xs">
                            IO Note: {evt.officerNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* VIEW MODE 2: HORIZONTAL MILESTONE STEPPER */}
        {viewMode === 'horizontal' && filteredEvents.length > 0 && (
          <motion.div 
            key="horizontal"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* Horizontal Track */}
          <div className="bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-5 rounded-sm shadow-sm overflow-x-auto">
            <div className="min-w-[700px] flex items-center justify-between relative before:absolute before:left-8 before:right-8 before:top-5 before:h-0.5 before:bg-[#DDD8CE] dark:before:bg-[#1E2D3E] before:z-0">
              {filteredEvents.map((evt, idx) => {
                const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.other;
                const isSelected = activeMilestone?.id === evt.id;
                const CatIcon = cfg.icon;

                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedMilestoneId(evt.id)}
                    className="relative z-10 flex flex-col items-center text-center group cursor-pointer max-w-[120px]"
                  >
                    {/* Node circle */}
                    <div 
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform ${
                        isSelected 
                          ? 'scale-115 shadow-md bg-white dark:bg-[#0D1824]' 
                          : 'bg-white dark:bg-[#08121D] hover:scale-105'
                      }`}
                      style={{ 
                        borderColor: isSelected ? '#C6A15B' : cfg.color,
                        boxShadow: isSelected ? `0 0 12px ${cfg.color}40` : undefined
                      }}
                    >
                      <CatIcon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    {/* Step label */}
                    <span className="font-mono text-[10px] font-bold text-[#A38038] dark:text-[#D5B875] mt-2 block">
                      {evt.time || evt.date}
                    </span>
                    <span className="text-[11px] font-medium text-[#08121D] dark:text-white line-clamp-2 mt-0.5">
                      {evt.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Milestone Detailed Dossier Card */}
          <AnimatePresence mode="wait">
            {activeMilestone && (
              <motion.div 
                key={activeMilestone.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FFFFFF] dark:bg-[#08121D] border-2 border-[#C6A15B] p-6 rounded-sm shadow-md space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#C6A15B]/20 text-[#A38038] dark:text-[#D5B875] font-bold uppercase">
                      SELECTED DOSSIER EVENT
                    </span>
                    <span className="font-mono text-xs text-[#6D7278] dark:text-[#8C96A3]">
                      {activeMilestone.date} • {activeMilestone.time || 'Time not recorded'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVerified(activeMilestone)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-xs border flex items-center gap-1.5 cursor-pointer ${
                        activeMilestone.verified
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 font-bold'
                          : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeMilestone.verified ? 'OFFICIALLY VERIFIED' : 'UNVERIFIED'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(activeMilestone)}
                      className="btn-legal-gold px-3 py-1 text-xs font-semibold uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Event</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-serif-legal text-xl font-bold text-[#08121D] dark:text-white">
                  {activeMilestone.title}
                </h3>

                {/* Location banner */}
                <div className="flex items-start gap-2.5 p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                  <MapPin className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3] font-bold block">
                      LOCATION OF EVENT
                    </span>
                    <span className="text-sm font-semibold text-[#08121D] dark:text-white">
                      {activeMilestone.location}
                    </span>
                  </div>
                </div>

                {/* Narrative description */}
                <div className="p-4 bg-[#FCFBF8] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-sm leading-relaxed text-[#171A1E] dark:text-[#E8ECEF]">
                  <span className="text-[10px] font-mono uppercase text-[#A38038] dark:text-[#D5B875] font-bold block mb-1">
                    FACTUAL NARRATIVE & POLICE RECORD
                  </span>
                  <p className="whitespace-pre-line">{activeMilestone.description}</p>
                </div>

                {/* Evidence source */}
                {activeMilestone.source && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#6D7278] dark:text-[#8C96A3]">
                    <FileCheck className="w-4 h-4 text-[#C6A15B]" />
                    <span className="font-bold">EVIDENTIAL FOUNDATION:</span>
                    <span className="text-[#08121D] dark:text-white">{activeMilestone.source}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* VIEW MODE 3: CASE DIARY TABULAR (SECTION 172 BNSS) */}
      {viewMode === 'table' && filteredEvents.length > 0 && (
        <motion.div 
          key="table"
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm overflow-hidden"
        >
          <div className="p-4 bg-[#FCFBF8] dark:bg-[#0D1824] border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#A38038] dark:text-[#D5B875]">
                POLICE CASE DIARY CHRONOLOGY (FORM NO. 172 BNSS / 167)
              </span>
              <h4 className="font-serif-legal font-bold text-sm text-[#08121D] dark:text-white">
                Chronological Record of Day-to-Day Steps Taken in Investigation
              </h4>
            </div>
            <button
              onClick={handlePrintCaseDiary}
              className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs font-mono font-semibold flex items-center gap-1.5 rounded-sm hover:border-[#C6A15B] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Print Section 172 Diary</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FCFBF8] dark:bg-[#08121D] border-b border-[#DDD8CE] dark:border-[#1E2D3E] text-[11px] font-mono text-[#6D7278] dark:text-[#8C96A3] uppercase">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 min-w-[110px]">Date & Time</th>
                  <th className="p-3 min-w-[150px]">Place of Occurrence</th>
                  <th className="p-3 min-w-[280px]">Circumstances & Steps Taken (Description)</th>
                  <th className="p-3 min-w-[130px]">Category & Source</th>
                  <th className="p-3 w-28 text-center">Verification</th>
                  <th className="p-3 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
                {filteredEvents.map((evt, idx) => {
                  const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.other;
                  return (
                    <tr key={evt.id} className="hover:bg-[#FCFBF8] dark:hover:bg-[#0D1824] transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-[#A38038] dark:text-[#D5B875]">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-[#08121D] dark:text-white">{evt.date}</div>
                        <div className="text-[#A38038] dark:text-[#D5B875] text-[11px]">{evt.time || '18:45 hrs'}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-1 font-semibold text-[#08121D] dark:text-white">
                          <MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                          <span>{evt.location}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#08121D] dark:text-white mb-1">{evt.title}</div>
                        <p className="text-[#5B636E] dark:text-[#B4BCC6] leading-relaxed line-clamp-3">
                          {evt.description}
                        </p>
                      </td>
                      <td className="p-3 font-mono">
                        <span 
                          className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-xs border mb-1"
                          style={{
                            color: cfg.color,
                            backgroundColor: `${cfg.color}15`,
                            borderColor: `${cfg.color}35`
                          }}
                        >
                          {cfg.label}
                        </span>
                        {evt.source && (
                          <div className="text-[10px] text-[#6D7278] dark:text-[#8C96A3] truncate max-w-[150px]">
                            Src: {evt.source}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleVerified(evt)}
                          className={`px-2 py-0.5 text-[10px] font-mono rounded-xs border cursor-pointer ${
                            evt.verified
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 font-bold'
                              : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30'
                          }`}
                        >
                          {evt.verified ? 'VERIFIED' : 'UNVERIFIED'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="p-1 text-[#6D7278] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white rounded-xs"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="p-1 text-[#EF4444]/70 hover:text-[#EF4444] rounded-xs"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* MODAL: ADD / EDIT TIMELINE EVENT */}
    <AnimatePresence>
      {isAddModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-[#FFFFFF] dark:bg-[#08121D] border-2 border-[#C6A15B] rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#A38038] dark:text-[#D5B875]">
                  {editingEvent ? 'UPDATE CASE EVENT' : 'NEW CHRONOLOGICAL EVENT ENTRY'}
                </span>
                <h3 className="font-serif-legal text-xl font-bold text-[#08121D] dark:text-white">
                  {editingEvent ? 'Edit Timeline Event' : 'Add Key Event to Timeline'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs rounded-sm flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Event Title */}
              <div>
                <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                  Event Title / Headline *
                </label>
                <input
                  id="event-title-input"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Armed suspects intercepted victim near Metro pillar 142"
                  className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-2.5 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none"
                  required
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                    Date of Occurrence *
                  </label>
                  <div className="relative">
                    <input
                      id="event-date-input"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-2.5 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none font-mono"
                      required
                    />
                  </div>
                  {activeCase && (
                    <button
                      type="button"
                      onClick={() => setFormDate(activeCase.incidentDate)}
                      className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] hover:underline mt-1 cursor-pointer block"
                    >
                      Use Case Incident Date ({activeCase.incidentDate})
                    </button>
                  )}
                </div>

                <div>
                  <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                    Time of Occurrence / Hour
                  </label>
                  <input
                    id="event-time-input"
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 18:45 hrs or 18:45"
                    className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-2.5 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-[#6D7278] dark:text-[#8C96A3] mt-1 block">
                    Use 24-hr police format (e.g. 18:45 hrs) or relative (T+30 mins)
                  </span>
                </div>
              </div>

              {/* Location Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase">
                    Location / Place of Occurrence *
                  </label>
                  {activeCase && (
                    <span className="text-[10px] font-mono text-[#6D7278] dark:text-[#8C96A3]">
                      Jurisdiction: {activeCase.policeStation}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-2.5 top-3 text-[#EF4444]" />
                  <input
                    id="event-location-input"
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Connaught Place Outer Circle, Block C, New Delhi"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none"
                    required
                  />
                </div>

                {/* Quick location presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-mono text-[#8C96A3]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormLocation('Scene of Crime (Locus Delicti)')}
                    className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 dark:bg-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:text-[#C6A15B] rounded-xs cursor-pointer"
                  >
                    Scene of Crime
                  </button>
                  {activeCase?.policeStation && (
                    <button
                      type="button"
                      onClick={() => setFormLocation(`${activeCase.policeStation}`)}
                      className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 dark:bg-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:text-[#C6A15B] rounded-xs cursor-pointer"
                    >
                      {activeCase.policeStation}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFormLocation('Emergency Ward, Govt Hospital (MLC)')}
                    className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 dark:bg-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:text-[#C6A15B] rounded-xs cursor-pointer"
                  >
                    Hospital / MLC
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLocation('Court of Metropolitan Magistrate')}
                    className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 dark:bg-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3] hover:text-[#C6A15B] rounded-xs cursor-pointer"
                  >
                    Judicial Court
                  </button>
                </div>
              </div>

              {/* Description narrative */}
              <div>
                <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                  Event Description & Investigation Steps Taken *
                </label>
                <textarea
                  id="event-description-input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="Record factual details: what occurred, words spoken, weapons brandished, witnesses present, injuries noted, or investigative panchnama executed..."
                  className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-3 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Category / Investigation Stage */}
              <div>
                <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1.5">
                  Event Category / Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as TimelineEventCategory[]).map(catKey => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const isSelected = formCategory === catKey;
                    const CatIcon = cfg.icon;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setFormCategory(catKey)}
                        className={`p-2 rounded-sm border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#C6A15B]/15 border-[#C6A15B] text-[#08121D] dark:text-white font-bold'
                            : 'bg-[#FCFBF8] dark:bg-[#0D1824] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#6D7278] dark:text-[#8C96A3]'
                        }`}
                      >
                        <CatIcon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                        <span className="text-[11px] truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source & Severity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                    Evidentiary Source
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. CCTV Cam #4, MLC #8492, Eyewitness deposition"
                    className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-2.5 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[11px] font-bold text-[#6D7278] dark:text-[#8C96A3] uppercase block mb-1">
                    Significance / Severity
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-2.5 text-xs text-[#08121D] dark:text-white rounded-sm focus:border-[#C6A15B] focus:outline-none cursor-pointer"
                  >
                    <option value="routine">Routine Operational Step</option>
                    <option value="major">Major Case Milestone</option>
                    <option value="critical">Critical Evidence / Direct Offence</option>
                  </select>
                </div>
              </div>

              {/* Verified Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                <input
                  type="checkbox"
                  id="form-verified-checkbox"
                  checked={formVerified}
                  onChange={(e) => setFormVerified(e.target.checked)}
                  className="w-4 h-4 text-[#C6A15B] focus:ring-[#C6A15B] rounded cursor-pointer"
                />
                <label htmlFor="form-verified-checkbox" className="font-semibold text-xs text-[#08121D] dark:text-white cursor-pointer select-none">
                  Mark as officially verified by Investigating Officer (IO)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-legal-gold px-6 py-2 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEvent ? 'Update Event' : 'Save Event to Case'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* MODAL: AI AUTO-RECONSTRUCTION */}
    <AnimatePresence>
      {isAiModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-[#FFFFFF] dark:bg-[#08121D] border-2 border-[#C6A15B] rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C6A15B]" />
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#A38038] dark:text-[#D5B875]">
                    LEGAL AI ENGINE
                  </span>
                  <h3 className="font-serif-legal text-lg font-bold text-[#08121D] dark:text-white">
                    Reconstructed Incident Timeline
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 text-[#8C96A3] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAiLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#C6A15B] mx-auto" />
                <p className="font-mono text-xs text-[#08121D] dark:text-white font-semibold">
                  Analyzing Case Narrative & Chronological Time Expressions...
                </p>
                <p className="text-[11px] text-[#8C96A3]">
                  Correlating timestamps, location mentions, and police procedural milestones under BNSS 2023.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#6D7278] dark:text-[#8C96A3]">
                  Lawgic AI identified <strong className="text-[#08121D] dark:text-white">{aiSuggestedEvents.length} chronological events</strong> with dates, places of occurrence, and factual descriptions from the case report:
                </p>

                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {aiSuggestedEvents.map((evt, idx) => {
                    const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.other;
                    return (
                      <div key={idx} className="p-3 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold text-[#08121D] dark:text-white">
                            {evt.date} • {evt.time}
                          </span>
                          <span 
                            className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border"
                            style={{ color: cfg.color, borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}10` }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#08121D] dark:text-white">{evt.title}</div>
                        <div className="flex items-center gap-1 text-[11px] text-[#A38038] dark:text-[#D5B875]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{evt.location}</span>
                        </div>
                        <p className="text-[#5B636E] dark:text-[#B4BCC6] line-clamp-2">
                          {evt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-mono text-[#8C96A3] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyAiEvents('append')}
                      className="px-3 py-2 bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#C6A15B]/40 text-[#A38038] dark:text-[#D5B875] text-xs font-mono font-bold rounded-sm hover:bg-[#C6A15B]/10 cursor-pointer"
                    >
                      Append to Existing Timeline
                    </button>
                    <button
                      onClick={() => handleApplyAiEvents('replace')}
                      className="btn-legal-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Replace Case Timeline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
};
