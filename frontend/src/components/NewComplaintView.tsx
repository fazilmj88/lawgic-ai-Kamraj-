import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scale, 
  User, 
  Search, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Save, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  BookOpen, 
  AlertTriangle, 
  FileText, 
  Globe, 
  Calendar,
  Building2,
  ShieldCheck,
  RotateCcw,
  CheckSquare,
  Clock,
  Layers,
  ChevronRight,
  Volume2,
  Trash2,
  Radio,
  FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateFIR, FIRResponse } from '../gemini';
import { useAuth } from '../context/AuthContext';
import { View, FIRCaseData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OfficialFIRData, CaseDocumentVaultItem } from '../types/documentIntelligence';
import { mapCaseToOfficialFIR } from '../utils/officialFIRMapper';
import { OfficerFIRFieldEditor } from './fir/OfficerFIRFieldEditor';
import { OfficialFIRPreviewModal } from './fir/OfficialFIRPreviewModal';
import { OfficialTamilNaduFIRDocument } from './fir/OfficialTamilNaduFIRDocument';
import { validateFIRData, generateOfficialFIRPdf, GeneratedFIRPdfResult } from '../services/officialFIRPdfService';

interface NewComplaintViewProps {
  setCurrentView: (view: View) => void;
  vaultDocuments?: CaseDocumentVaultItem[];
  onUpdateVaultDocuments?: (docs: CaseDocumentVaultItem[]) => void;
  onBack?: () => void;
}

export const NewComplaintView: React.FC<NewComplaintViewProps> = ({
  setCurrentView,
  vaultDocuments = [],
  onUpdateVaultDocuments,
  onBack
}) => {
  const { user, saveCase } = useAuth();

  const [step, setStep] = useState(1);
  const [complaint, setComplaint] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [targetLang, setTargetLang] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<FIRResponse | null>(null);

  // Official FIR state
  const [officialFIRData, setOfficialFIRData] = useState<OfficialFIRData | null>(null);
  const [showOfficialFIRModal, setShowOfficialFIRModal] = useState(false);
  const [officialFIRTab, setOfficialFIRTab] = useState<'editor' | 'preview'>('editor');
  const [firValidationError, setFirValidationError] = useState<string | null>(null);
  const [isGeneratingFIR, setIsGeneratingFIR] = useState(false);
  const [firGenerateStatus, setFirGenerateStatus] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [compiledFIRPdf, setCompiledFIRPdf] = useState<GeneratedFIRPdfResult | null>(null);

  const [formData, setFormData] = useState({
    district: 'Chennai City',
    policeStation: user?.station || 'B-2 Esplanade Police Station',
    complainantName: '',
    fatherHusbandName: '',
    phone: '',
    address: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '18:45',
    placeOfOccurrence: 'Near Parrys Corner, Netaji Subhash Chandra Bose Road',
    crimeType: 'Theft / Robbery',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    accusedDetails: 'Two unknown persons, approximately 25-30 years, wearing dark helmets',
    witnesses: 'Local shop owner and passing motorist',
    propertyLoss: 'Gold chain (approx 22 grams), iPhone 14 Pro, Leather wallet with ID cards'
  });

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const firPaperRef = useRef<HTMLDivElement>(null);

  // Map chosen language to BCP-47 language tag
  const getLanguageCode = (lang: string) => {
    switch (lang) {
      case 'Hindi': return 'hi-IN';
      case 'Tamil': return 'ta-IN';
      case 'Bengali': return 'bn-IN';
      default: return 'en-IN';
    }
  };

  // Safely stop speech recognition without throwing errors
  const stopRecording = useCallback(() => {
    isRecognizingRef.current = false;
    setIsRecording(false);
    setInterimTranscript('');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        // Detach handlers first to prevent stray callbacks firing during teardown
        recognitionRef.current.onstart = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;

        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        } else if (typeof recognitionRef.current.stop === 'function') {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.debug('Speech recognition stop suppressed:', e);
      } finally {
        recognitionRef.current = null;
      }
    }
  }, []);

  // Safely start speech recognition with guards against InvalidStateError
  const startRecording = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Guard: Prevent calling start() if recognition is already running or active
    if (isRecognizingRef.current) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setSpeechError('Speech recognition is not supported in this browser environment. You can type the narrative directly.');
      return;
    }

    // Clean up any lingering previous session first
    stopRecording();

    setSpeechError(null);
    setInterimTranscript('');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLanguageCode(targetLang);

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setIsRecording(true);
        setSpeechError(null);
        setRecordingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (finalChunk) {
          setComplaint(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (e: any) => {
        const errType = e?.error;
        console.warn('Speech recognition status:', errType || e);
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setSpeechError('Microphone permission was denied. Please grant microphone access in browser settings.');
        } else if (errType === 'network') {
          setSpeechError('Network issue during speech recognition. You can continue typing manually.');
        } else if (errType === 'no-speech' || errType === 'aborted') {
          // Normal/benign inactivity or user stop
          return;
        }

        isRecognizingRef.current = false;
        setIsRecording(false);
        setInterimTranscript('');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        setIsRecording(false);
        setInterimTranscript('');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;

      // Mark as recognizing immediately before invoking start to block concurrent calls
      isRecognizingRef.current = true;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start error caught:', err);
      // Check for InvalidStateError: "recognition has already started"
      if (err?.name === 'InvalidStateError' || String(err?.message || err).includes('already started')) {
        // Recognition is already active in the browser engine; ensure state matches
        isRecognizingRef.current = true;
        setIsRecording(true);
      } else {
        isRecognizingRef.current = false;
        setIsRecording(false);
        setSpeechError('Could not start voice dictation. Please type the incident narrative directly.');
      }
    }
  }, [targetLang, stopRecording]);

  // Check speech recognition capability on mount and cleanup on unmount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechSupported(Boolean(SpeechRecognition));
    }

    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Toggle Voice-to-Text Recording
  const toggleRecording = () => {
    if (isRecording || isRecognizingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerateAI = async () => {
    if (!complaint.trim()) {
      alert('Please enter or dictate the incident statement first.');
      return;
    }

    setIsGenerating(true);
    try {
      const fir = await generateFIR({
        district: formData.district,
        policeStation: formData.policeStation,
        complainantName: formData.complainantName || 'Anonymous Complainant',
        fatherHusbandName: formData.fatherHusbandName,
        phone: formData.phone,
        address: formData.address,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        place: formData.placeOfOccurrence,
        accusedDetails: formData.accusedDetails,
        witnesses: formData.witnesses,
        propertyLoss: formData.propertyLoss,
        description: complaint
      }, targetLang);

      setResult(fir);
      setStep(4); // Advance to legal analysis
    } catch (err) {
      console.error('FIR generation error:', err);
      alert('Failed to generate legal analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToFirestore = async (finalStatus: 'Draft' | 'Verified' | 'Registered' = 'Draft') => {
    if (!user) {
      alert('Please sign in as an officer to save records to the docket.');
      return;
    }
    setIsSavingToDb(true);
    setSaveSuccess(false);

    try {
      const generatedCaseId = `FIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const now = new Date().toISOString();
      const payload: FIRCaseData = {
        caseId: generatedCaseId,
        userId: user.id,
        officerName: user.name,
        officerRole: user.role,
        complainant: formData.complainantName || 'Undisclosed Complainant',
        fatherHusbandName: formData.fatherHusbandName || '',
        complainantPhone: formData.phone || '',
        complainantAddress: formData.address || '',
        district: formData.district,
        policeStation: formData.policeStation,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentDescription: complaint,
        crimeType: formData.crimeType,
        priority: formData.priority,
        status: finalStatus,
        aiAnalysis: result || undefined,
        createdAt: now,
        updatedAt: now
      };

      await saveCase(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save to Firestore failed:', err);
      alert('Error recording FIR in database. Please check permissions.');
    } finally {
      setIsSavingToDb(false);
    }
  };

  const ensureOfficialFIRData = (): OfficialFIRData => {
    if (officialFIRData) return officialFIRData;
    const initial = mapCaseToOfficialFIR(
      {
        caseId: result?.firNumber || `LAW-${new Date().getFullYear()}-00125`,
        district: formData.district,
        policeStation: formData.policeStation,
        complainant: formData.complainantName,
        fatherHusbandName: formData.fatherHusbandName,
        complainantAddress: formData.address,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentDescription: complaint,
        officerName: user?.name || 'Inspector Rajesh Kumar',
        officerRole: user?.role || 'Investigating Officer',
        aiAnalysis: {
          sections: result?.sections?.map(s => s.section) || ['Section 303(2) BNS, 2023'],
          crimeType: formData.crimeType,
          accusedDetails: formData.accusedDetails,
          propertyLoss: formData.propertyLoss,
          ...result
        }
      },
      user ? {
        name: user.name,
        role: user.role,
        station: user.station,
        badgeNumber: 'SI-TN-401'
      } : undefined
    );
    setOfficialFIRData(initial);
    return initial;
  };

  // Synchronize official FIR data on entering step 6
  useEffect(() => {
    if (step === 6 && !officialFIRData) {
      ensureOfficialFIRData();
    }
  }, [step]);

  const handleGenerateOfficialFIR = async () => {
    console.log('[FIR] Generate FIR clicked');
    const data = ensureOfficialFIRData();
    console.log('[FIR] Form validation check');
    const validation = validateFIRData(data);
    if (!validation.valid) {
      const errMsg = validation.message || 'FIR generation failed: Required statutory fields are missing.';
      console.warn('[FIR] Validation failed:', errMsg);
      setFirValidationError(errMsg);
      setFirGenerateStatus('failed');
      return;
    }

    console.log('[FIR] Verified FIR data:', data);
    setFirValidationError(null);
    setIsGeneratingFIR(true);
    setFirGenerateStatus('generating');

    try {
      console.log('[FIR] PDF generation function called');
      const pdfResult = await generateOfficialFIRPdf(undefined, data);
      console.log('[FIR] PDF byte generation succeeded, pageCount:', pdfResult.pageCount);
      console.log('[FIR] Preview ready');
      setCompiledFIRPdf(pdfResult);
      setFirGenerateStatus('success');
      setShowOfficialFIRModal(true);
    } catch (err: any) {
      console.error('[FIR] Generation flow failed:', {
        step: 'generateOfficialFIRPdf',
        message: err?.message,
        stack: err?.stack
      });
      const userMessage = err?.message && err.message.startsWith('FIR generation failed:')
        ? err.message
        : `FIR generation failed: ${err?.message || 'Unexpected PDF generation error.'}`;
      setFirValidationError(userMessage);
      setFirGenerateStatus('failed');
    } finally {
      setIsGeneratingFIR(false);
    }
  };

  const handleOpenOfficialFIRPreview = () => {
    handleGenerateOfficialFIR();
  };

  const handleExportPDF = async () => {
    handleGenerateOfficialFIR();
  };

  const stepsList = [
    { num: 1, label: 'Complainant Details' },
    { num: 2, label: 'Incident Specifics' },
    { num: 3, label: 'Narrative Statement' },
    { num: 4, label: 'Legal Fact Breakdown' },
    { num: 5, label: 'Applicable BNS Sections' },
    { num: 6, label: 'Official FIR Dossier' }
  ];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto space-y-8 pb-20 text-[#171717] dark:text-[#E0E5EC] font-sans"
    >
      
      {/* 1. TOP PROCESS PROGRESS BAR */}
      <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-5 mb-6">
          <div className="flex items-start gap-3.5">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  if (step > 1) {
                    setStep(s => s - 1);
                  } else {
                    onBack();
                  }
                }}
                className="mt-1 px-3 py-2 text-xs font-mono font-medium rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] hover:border-[#B8955A] text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-[#F7F6F2] dark:bg-[#151F2D] shrink-0 shadow-xs"
                title={step > 1 ? "Previous step" : "Back to previous view"}
              >
                <ArrowLeft className="w-4 h-4 text-[#B8955A]" />
                <span>Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8955A]" />
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#B8955A] font-semibold block">
                  FIRST INFORMATION REPORT DRAFTING MODULE
                </span>
              </div>
              <h2 className="font-serif-legal text-2xl sm:text-3xl font-bold text-[#171717] dark:text-white">
                FIR Investigation & Drafting Assistant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-medium px-3 py-1 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-full text-[#595959] dark:text-[#8E98A5]">
              STEP {step} OF 6
            </span>
            {result && (
              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setComplaint('');
                }}
                className="text-xs font-sans font-medium text-[#B8955A] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Workflow</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {stepsList.map((s) => {
            const isDone = step > s.num || (result && s.num <= 5);
            const isCurrent = step === s.num;
            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num <= 3 || result) {
                    setStep(s.num);
                  }
                }}
                className={`text-left p-3 border rounded-xl transition-all cursor-pointer ${
                  isCurrent 
                    ? 'border-[#B8955A] bg-[#B8955A]/10 shadow-[0_0_12px_rgba(184,149,90,0.15)] font-semibold' 
                    : isDone
                    ? 'border-[#10B981]/40 bg-[#10B981]/5 text-[#10B981]'
                    : 'border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2]/60 dark:bg-[#151F2D]/50 text-[#595959] dark:text-[#8E98A5] hover:border-[#B8955A]/30'
                }`}
              >
                <span className="block text-[10px] font-mono font-bold tracking-wider text-[#B8955A]">
                  0{s.num} {isDone ? '✓' : ''}
                </span>
                <span className="text-xs truncate block mt-0.5 text-[#171717] dark:text-[#E0E5EC]">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / CENTER INTERFACE PANEL (7 or 8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: COMPLAINANT PARTICULARS */}
          {step === 1 && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-6">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#B8955A] font-semibold block mb-1">
                  STAGE 01
                </span>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white">
                  Complainant Particulars & Station Roster
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                  Enter official jurisdictional details and personal identity of the informant.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    POLICE STATION JURISDICTION *
                  </label>
                  <input
                    type="text"
                    name="policeStation"
                    value={formData.policeStation}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    DISTRICT / POLICE ZONE *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    FULL NAME OF COMPLAINANT *
                  </label>
                  <input
                    type="text"
                    name="complainantName"
                    value={formData.complainantName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh Kumar Sharma"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    FATHER'S / HUSBAND'S NAME
                  </label>
                  <input
                    type="text"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleInputChange}
                    placeholder="e.g. Late Shri S.P. Sharma"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    CONTACT PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl font-mono text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    PERMANENT / RESIDENTIAL ADDRESS
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Plot 42, Sector 14, New Delhi"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setStep(2)}
                  className="btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Incident Specifics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INCIDENT SPECIFICS & PARTIES */}
          {step === 2 && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-6">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#B8955A] font-semibold block mb-1">
                  STAGE 02
                </span>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white">
                  Incident Place, Time & Involved Parties
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                  Precise coordinates, suspected accused details, and known witnesses.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    DATE OF OCCURRENCE *
                  </label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl font-mono text-[#171717] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    TIME OF OCCURRENCE (APPROX) *
                  </label>
                  <input
                    type="time"
                    name="incidentTime"
                    value={formData.incidentTime}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl font-mono text-[#171717] dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    EXACT PLACE OF OCCURRENCE / LANDMARK *
                  </label>
                  <input
                    type="text"
                    name="placeOfOccurrence"
                    value={formData.placeOfOccurrence}
                    onChange={handleInputChange}
                    placeholder="e.g. Near Metro Pillar 142, Main Ring Road, Lajpat Nagar"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    ACCUSED / SUSPECT PARTICULARS (IF KNOWN)
                  </label>
                  <input
                    type="text"
                    name="accusedDetails"
                    value={formData.accusedDetails}
                    onChange={handleInputChange}
                    placeholder="Names, physical descriptions, vehicle registration or 'Unknown Persons'"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    PROPERTY STOLEN / INVOLVED ARTICLES
                  </label>
                  <input
                    type="text"
                    name="propertyLoss"
                    value={formData.propertyLoss}
                    onChange={handleInputChange}
                    placeholder="Details of stolen assets, cash, weapons involved"
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    PRIMARY CRIME CATEGORY
                  </label>
                  <select
                    name="crimeType"
                    value={formData.crimeType}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 text-sm focus:border-[#B8955A] focus:outline-none rounded-xl text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="Theft / Robbery">Theft / Snatching / Robbery (BNS § 303-312)</option>
                    <option value="Assault / Hurt">Voluntary Causing Hurt / Assault (BNS § 115-125)</option>
                    <option value="Cheating / Fraud">Cheating & Financial Fraud (BNS § 318)</option>
                    <option value="Cybercrime">Cybercrime / Digital Extortion (IT Act & BNS)</option>
                    <option value="Sexual Offences">Offences Against Women / Children (BNS § 63+ / POCSO)</option>
                    <option value="Homicide / Attempt">Culpable Homicide / Murder (BNS § 100-109)</option>
                    <option value="Criminal Intimidation">Criminal Intimidation & Trespass (BNS § 329-351)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-sans font-medium text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Narrative Statement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NARRATIVE STATEMENT & VOICE DICTATION */}
          {step === 3 && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-6">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#B8955A] font-semibold block mb-1">
                    STAGE 03
                  </span>
                  <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white">
                    Complainant's Verbatim Statement
                  </h3>
                  <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                    Dictate or type the detailed chronological account of the incident as narrated by the informant.
                  </p>
                </div>

                {/* Real-time Voice to Text Primary Recording Button */}
                <div className="flex items-center gap-2">
                  <button
                    id="voice-to-text-record-btn"
                    type="button"
                    onClick={toggleRecording}
                    className={`px-4 py-2.5 text-xs font-sans font-semibold flex items-center gap-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isRecording 
                        ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-red-500/20 shadow-lg animate-pulse' 
                        : 'bg-[#B8955A] text-white hover:bg-[#A38038] border-[#B8955A]'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 text-white" />
                        <span>Stop Voice Recording ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Voice Dictation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Speech Error Banner */}
              {speechError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{speechError}</span>
                  </div>
                  <button 
                    onClick={() => setSpeechError(null)}
                    className="text-[10px] font-mono underline hover:opacity-80 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Active Voice Waveform Visualizer */}
              {isRecording && (
                <div className="p-4 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#B8955A]/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#B8955A] font-sans font-semibold">
                      <Radio className="w-4 h-4 animate-ping text-[#EF4444]" />
                      <span>LIVE SPEECH RECOGNITION ACTIVE</span>
                      <span className="text-[11px] text-[#595959] dark:text-[#8E98A5] font-normal">({targetLang} • {getLanguageCode(targetLang)})</span>
                    </div>
                    <span className="font-mono text-xs text-[#EF4444] font-bold">
                      REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Audio equalizer bars */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {[40, 75, 90, 55, 80, 100, 65, 85, 45, 95, 70, 85, 60, 90, 45].map((height, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-[#B8955A] rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(8, height * (0.3 + (i % 3) * 0.25))}px`,
                          animationDuration: `${0.4 + (i % 5) * 0.15}s`
                        }}
                      />
                    ))}
                  </div>

                  {interimTranscript && (
                    <div className="p-3 bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-lg text-xs font-sans text-[#B8955A] italic">
                      <span className="text-[10px] text-[#595959] dark:text-[#8E98A5] uppercase font-mono block not-italic mb-1">Live Spoken Stream:</span>
                      "{interimTranscript}"
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-3 rounded-xl">
                  
                  {/* Language selection */}
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-4 h-4 text-[#B8955A]" />
                    <span className="font-sans text-[11px] font-semibold text-[#595959] dark:text-[#8E98A5] uppercase">SPEECH & TRANSLATION LANGUAGE:</span>
                    <select
                      value={targetLang}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        setTargetLang(newLang);
                        if (isRecording || isRecognizingRef.current) {
                          stopRecording();
                        }
                      }}
                      className="bg-transparent border-b border-[#B8955A] text-xs font-semibold focus:outline-none text-[#171717] dark:text-white py-0.5 cursor-pointer"
                    >
                      <option value="English">English (Indian Legal - en-IN)</option>
                      <option value="Hindi">Hindi (मानक विधिक - hi-IN)</option>
                      <option value="Tamil">Tamil (தமிழ் - ta-IN)</option>
                      <option value="Bengali">Bengali (বাংলা - bn-IN)</option>
                    </select>
                  </div>

                  {/* Actions: Clear & Quick samples */}
                  <div className="flex items-center gap-2">
                    {complaint && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Clear the narrative statement?')) {
                            setComplaint('');
                            setInterimTranscript('');
                          }
                        }}
                        className="text-xs font-sans text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer px-2 py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setComplaint("On 20th August 2026 around 6:45 PM, while returning from Connaught Place Outer Circle near Block C, two unknown males aged 25-30 wearing dark black helmets intercepted me on a black motorcycle without registration plates. The pillion rider brandished a metallic weapon, criminally intimidated me, used physical force causing injuries to my right arm, and forcibly snatched my 22g gold chain, iPhone 14 Pro, and leather wallet containing ₹8,500 cash along with official identity credentials before speeding towards Minto Road.")}
                      className="text-xs font-sans font-medium text-[#B8955A] hover:underline flex items-center gap-1 cursor-pointer px-2 py-1"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Load Sample Narrative</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="incident-description-input"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={8}
                    className="w-full bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] p-4 text-sm leading-relaxed focus:border-[#B8955A] focus:outline-none rounded-xl font-sans text-[#171717] dark:text-white placeholder:text-[#8E98A5]"
                    placeholder="Enter or dictate the full factual narrative in real time. Mention exact sequences, weapon or force used, injuries sustained, words spoken by accused, and how they escaped..."
                  />

                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] rounded-full text-[10px] font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                      <span>MIC RECORDING</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#595959] dark:text-[#8E98A5]">
                  <span>Word count: {complaint.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span className="font-mono text-[11px] text-[#B8955A]">
                    SpeechRecognition & LAWgic Multimodal AI Connected
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-sans font-medium text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <button
                  id="execute-legal-ai-analysis-btn"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !complaint.trim()}
                  className="btn-legal-gold px-8 py-3 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Statutory Ingredients...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute Legal AI Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LEGAL FACTS & CHRONOLOGY */}
          {step === 4 && result && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-6">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#B8955A] font-semibold block mb-1">
                    STAGE 04
                  </span>
                  <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white">
                    Factual Breakdown & Incident Chronology
                  </h3>
                </div>
                <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[10px] font-mono font-bold uppercase rounded-full self-start sm:self-auto">
                  CLASSIFICATION: {result.crimeClassification || formData.crimeType}
                </span>
              </div>

              {/* Summary */}
              <div className="p-5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#B8955A] font-bold block mb-1.5">
                  EXECUTIVE SUMMARY OF OCCURRENCE
                </span>
                <p className="text-xs sm:text-sm text-[#171717] dark:text-[#E0E5EC] leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5] block font-semibold">
                    INCIDENT TIMELINE RECONSTRUCTION
                  </span>
                  <div className="space-y-2">
                    {result.timeline.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-3.5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl text-xs"
                      >
                        <span className="font-mono text-[#B8955A] font-bold shrink-0 min-w-[70px]">
                          {item.time || `T+${idx * 15}m`}
                        </span>
                        <span className="text-[#171717] dark:text-[#E0E5EC]">{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clarifying questions / investigation gaps */}
              {result.clarifyingQuestions && result.clarifyingQuestions.length > 0 && (
                <div className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#EF4444]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="uppercase tracking-wider">INVESTIGATION CHECKLIST (CRITICAL MISSING FACTS)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#595959] dark:text-[#8E98A5] list-disc list-inside">
                    {result.clarifyingQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-sans font-medium text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Narrative</span>
                </button>
                
                <button
                  onClick={() => setStep(5)}
                  className="btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Applicable Sections (BNS 2023)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: APPLICABLE BNS SECTIONS & REASONING */}
          {step === 5 && result && (
            <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 sm:p-8 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] space-y-6">
              <div className="border-b border-[#E5E0D8] dark:border-[#1D2633] pb-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#B8955A] font-semibold block mb-1">
                  STAGE 05
                </span>
                <h3 className="font-serif-legal text-2xl font-bold text-[#171717] dark:text-white">
                  Statutory Offence Mapping & Judicial Precedents
                </h3>
                <p className="text-xs text-[#595959] dark:text-[#8E98A5] mt-1 font-sans">
                  Corroborated penal provisions under the Bharatiya Nyaya Sanhita (BNS 2023) and procedural mandates.
                </p>
              </div>

              {/* Sections list */}
              <div className="space-y-4">
                {result.sections && result.sections.map((sec, idx) => (
                  <div 
                    key={idx}
                    className="p-5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-serif-legal font-bold text-base text-[#171717] dark:text-white">
                          {sec.section}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 bg-[#B8955A]/15 text-[#B8955A] border border-[#B8955A]/30 font-semibold rounded-full">
                        CONFIDENCE: {Math.round(sec.confidence * 100)}%
                      </span>
                    </div>

                    {/* Reasoning */}
                    {sec.reasoning && sec.reasoning.length > 0 && (
                      <div>
                        <span className="text-[10px] font-sans uppercase text-[#595959] dark:text-[#8E98A5] font-bold block mb-1">
                          STATUTORY INGREDIENTS SATISFIED:
                        </span>
                        <ul className="space-y-1 text-xs text-[#171717] dark:text-[#E0E5EC] list-disc list-inside">
                          {sec.reasoning.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Landmark Precedents */}
                    {sec.landmarkCases && sec.landmarkCases.length > 0 && (
                      <div className="pt-2 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                        <span className="text-[10px] font-sans uppercase text-[#B8955A] font-bold block mb-1.5">
                          LANDMARK JUDICIAL AUTHORITY:
                        </span>
                        <div className="space-y-2">
                          {sec.landmarkCases.map((c, cIdx) => (
                            <div key={cIdx} className="p-3 bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl text-xs">
                              <div className="flex justify-between font-serif-legal font-bold text-[#171717] dark:text-white">
                                <span>{c.name}</span>
                                <span className="font-mono text-[10px] text-[#595959] dark:text-[#8E98A5]">{c.court} • {c.year}</span>
                              </div>
                              <p className="text-[11px] text-[#595959] dark:text-[#8E98A5] mt-1 leading-relaxed">
                                <strong>Ratio:</strong> {c.principle || c.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Evidence Checklist */}
              {result.evidenceChecklist && (
                <div className="p-5 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl space-y-3">
                  <span className="text-xs font-sans uppercase tracking-wider text-[#B8955A] block font-bold">
                    MANDATORY INVESTIGATION CHECKLIST (BNSS 2023)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-sans text-[10px] text-[#595959] dark:text-[#8E98A5] uppercase font-bold block mb-1">
                        DIGITAL & FORENSIC SEIZURES
                      </span>
                      <ul className="space-y-1 text-[#171717] dark:text-[#E0E5EC] list-disc list-inside">
                        {result.evidenceChecklist.digital?.map((d, i) => (
                          <li key={i}>{d}</li>
                        )) || <li>CCTV preservation of place of occurrence</li>}
                      </ul>
                    </div>

                    <div>
                      <span className="font-sans text-[10px] text-[#595959] dark:text-[#8E98A5] uppercase font-bold block mb-1">
                        PHYSICAL SEIZURE MEMO
                      </span>
                      <ul className="space-y-1 text-[#171717] dark:text-[#E0E5EC] list-disc list-inside">
                        {result.evidenceChecklist.physical?.map((p, i) => (
                          <li key={i}>{p}</li>
                        )) || <li>Preparation of Site Panchnama</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2 text-xs font-sans font-medium text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <button
                  onClick={() => setStep(6)}
                  className="btn-legal-gold px-6 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                >
                  <span>Generate Official FIR Dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: OFFICIAL FIR REVIEW, SAVE & EXPORT */}
          {step === 6 && result && (
            <div className="space-y-6">
              
              {/* Action Toolbar */}
              <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-4 sm:p-5 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-sans uppercase tracking-wider text-[#595959] dark:text-[#8E98A5]">DOCUMENT TEMPLATE:</span>
                  <span className="px-3 py-1 bg-[#B8955A]/10 text-[#B8955A] border border-[#B8955A]/30 font-mono text-xs font-bold uppercase rounded-full">
                    TAMIL NADU POLICE FORM-I
                  </span>
                  <span className="hidden sm:inline text-xs text-[#595959] dark:text-[#8E98A5]">
                    Integrated Investigation Form-I (Sec 173 BNSS / Sec 154 Cr.P.C.)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveToFirestore('Draft')}
                    disabled={isSavingToDb}
                    className="btn-legal-secondary px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>{isSavingToDb ? 'Saving...' : 'Save Draft'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveToFirestore('Verified')}
                    disabled={isSavingToDb}
                    className="btn-legal-secondary px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Register Case</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateOfficialFIR}
                    disabled={isGeneratingFIR || (officialFIRData ? !validateFIRData(officialFIRData).valid : false)}
                    className={`px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md rounded-lg transition-all ${
                      officialFIRData && !validateFIRData(officialFIRData).valid
                        ? 'bg-[#E5E0D8] dark:bg-[#1A2634] text-[#8E98A5] cursor-not-allowed border border-[#DDD8CE] dark:border-[#223042]'
                        : isGeneratingFIR
                        ? 'bg-[#B8955A]/80 text-black cursor-wait'
                        : 'btn-legal-gold'
                    }`}
                    title={
                      officialFIRData && !validateFIRData(officialFIRData).valid
                        ? `Missing required fields: ${validateFIRData(officialFIRData).missingFields.join(', ')}`
                        : 'Generate official 3-page Tamil Nadu Police FIR'
                    }
                  >
                    {isGeneratingFIR ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {isGeneratingFIR
                        ? 'Generating FIR...'
                        : firGenerateStatus === 'success'
                        ? 'FIR Generated Successfully'
                        : firGenerateStatus === 'failed'
                        ? 'Generation Failed - Retry'
                        : 'Generate FIR'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Missing Fields Validation Error Alert */}
              {firValidationError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-sans font-medium rounded-xl flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{firValidationError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-sans font-medium rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Case docket successfully recorded to immutable Supabase ledger.</span>
                </div>
              )}

              {/* View Switcher: Officer Verification vs Direct Official 3-Page Layout */}
              <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
                <button
                  onClick={() => setOfficialFIRTab('editor')}
                  className={`px-4 py-2 text-xs font-serif-legal font-bold transition-colors rounded-lg flex items-center gap-1.5 ${
                    officialFIRTab === 'editor'
                      ? 'bg-[#B8955A] text-[#171717]'
                      : 'text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white'
                  }`}
                >
                  <FileEdit className="w-4 h-4" />
                  <span>1. Officer Field Endorsement & Verification</span>
                </button>

                <button
                  onClick={() => setOfficialFIRTab('preview')}
                  className={`px-4 py-2 text-xs font-serif-legal font-bold transition-colors rounded-lg flex items-center gap-1.5 ${
                    officialFIRTab === 'preview'
                      ? 'bg-[#B8955A] text-[#171717]'
                      : 'text-[#595959] dark:text-[#8E98A5] hover:text-[#171717] dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>2. Official 3-Page FIR Layout Preview</span>
                </button>
              </div>

              {/* Tab 1: Officer Verification & Field Editor */}
              {officialFIRTab === 'editor' && (
                <OfficerFIRFieldEditor
                  data={ensureOfficialFIRData()}
                  onChange={(updated) => setOfficialFIRData(updated)}
                  onGeneratePreview={handleGenerateOfficialFIR}
                  onSaveDraft={() => handleSaveToFirestore('Draft')}
                  isGenerating={isGeneratingFIR}
                  isSavingDraft={isSavingToDb}
                  generateStatus={firGenerateStatus}
                  errorMessage={firValidationError}
                />
              )}

              {/* Tab 2: Full Official 3-Page FIR Layout */}
              {officialFIRTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-serif-legal">
                      Official Tamil Nadu Police Integrated Investigation Form-I (3-Page Print Standard)
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateOfficialFIR}
                      className="px-3 py-1 bg-[#B8955A] text-[#171717] rounded font-bold hover:bg-[#A38349] transition-colors cursor-pointer"
                    >
                      Open Full Preview Modal
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-neutral-200 dark:bg-neutral-900 p-4 rounded-xl">
                    <OfficialTamilNaduFIRDocument data={ensureOfficialFIRData()} />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT CONTEXTUAL AI LEGAL ASSISTANT PANEL (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-[#101823] border border-[#E5E0D8] dark:border-[#1D2633] p-6 rounded-2xl shadow-[0_1px_3px_rgba(23,23,23,0.02)]">
            <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-3.5 mb-5">
              <Sparkles className="w-4 h-4 text-[#B8955A]" />
              <h4 className="font-serif-legal font-bold text-base text-[#171717] dark:text-white">
                Legal Intelligence Co-Pilot
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Dynamic advice based on step */}
              <div className="p-4 bg-[#F7F6F2] dark:bg-[#151F2D] border border-[#E5E0D8] dark:border-[#1D2633] rounded-xl">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#B8955A] font-bold block mb-1">
                  CURRENT STAGE GUIDANCE
                </span>
                <p className="text-[#595959] dark:text-[#8E98A5] leading-relaxed">
                  {step === 1 && 'Ensure complainant name and jurisdiction match station limits. Zero FIR applies if the incident occurred outside.'}
                  {step === 2 && 'Recording accurate time of occurrence is vital for establishing alibi and avoiding delay in FIR scrutiny.'}
                  {step === 3 && 'Encourage verbatim narration. Include exact weapons used and specific words uttered by the accused.'}
                  {step >= 4 && 'Cross-check each identified BNS section with the ingredients list before formal endorsement.'}
                </p>
              </div>

              {/* Zero FIR Alert */}
              <div className="p-4 bg-white dark:bg-[#151F2D] border border-[#B8955A]/40 rounded-xl shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[#B8955A] mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#B8955A]" />
                  <span className="uppercase tracking-wider">ZERO FIR PROTOCOL</span>
                </div>
                <p className="text-[11px] text-[#595959] dark:text-[#8E98A5] leading-relaxed">
                  Under BNSS § 173(1), a police station is bound to register a Zero FIR irrespective of territorial jurisdiction if a cognizable offence is disclosed.
                </p>
              </div>

              {/* Quick links to research */}
              <div className="pt-2 border-t border-[#E5E0D8] dark:border-[#1D2633]">
                <button
                  onClick={() => setCurrentView('research')}
                  className="btn-legal-secondary w-full py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#B8955A]" />
                  <span>Consult Statute Concordance</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* High-Fidelity 3-Page Official Tamil Nadu Police FIR Modal */}
      {showOfficialFIRModal && (
        <OfficialFIRPreviewModal
          isOpen={showOfficialFIRModal}
          onClose={() => setShowOfficialFIRModal(false)}
          onBackToEdit={() => setShowOfficialFIRModal(false)}
          firData={ensureOfficialFIRData()}
          currentUser={{
            name: user?.name || 'Inspector Rajesh Kumar',
            role: user?.role || 'Investigating Officer',
            id: user?.id || 'usr-officer'
          }}
          vaultDocuments={vaultDocuments || []}
          onUpdateVaultDocuments={onUpdateVaultDocuments}
          onFIRSaved={(savedDoc) => {
            if (onUpdateVaultDocuments && vaultDocuments) {
              const filtered = vaultDocuments.filter(d => d.id !== savedDoc.id);
              onUpdateVaultDocuments([savedDoc, ...filtered]);
            }
          }}
          precompiledPdf={compiledFIRPdf}
        />
      )}

      {/* Offscreen Render Container for Deterministic Official FIR PDF Generation */}
      <div
        id="fir-print-offscreen-container"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '210mm',
          zIndex: -999,
          opacity: 0.01,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        <OfficialTamilNaduFIRDocument data={ensureOfficialFIRData()} />
      </div>

    </motion.div>
  );
};
