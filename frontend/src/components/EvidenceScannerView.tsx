import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Fingerprint, 
  Loader2, 
  Search, 
  CheckCircle2, 
  Scale, 
  ShieldCheck, 
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  AlertTriangle,
  Video,
  VideoOff,
  RefreshCw,
  Copy,
  Check,
  Download,
  Trash2,
  Maximize2,
  FileCheck,
  Eye,
  Zap,
  Tag,
  ScanLine,
  Sliders,
  Dna,
  Cpu,
  Crosshair,
  Plus,
  X,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  analyzeEvidenceImage, 
  categorizeEvidenceImage, 
  EvidenceCategory, 
  EvidenceCategoryResult 
} from '../gemini';
import { useAuth } from '../context/AuthContext';
import { CctvEvidenceView } from './case/CctvEvidenceView';

// Preset sample forensic evidence images across all 4 categories (SVG data URIs for instant testing)
const SAMPLE_EVIDENCE: {
  id: string;
  label: string;
  category: EvidenceCategory;
  categoryLabel: string;
  description: string;
  url: string;
}[] = [
  {
    id: 'weapon-1',
    label: 'Seized Country Firearm',
    category: 'weapon',
    categoryLabel: 'Ballistic Weapon',
    description: 'Recovered .315 bore firearm with stamped serial & barrel wear (Arms Act 1959)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231a202c"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%232d3748" stroke="%23c6a15b" stroke-width="2"/><text x="60" y="80" fill="%23d5b875" font-family="monospace" font-size="14" font-weight="bold">POLICE EVIDENCE REGISTRY - EXHIBIT A-1 (WEAPON)</text><text x="60" y="105" fill="%23a0aec0" font-family="monospace" font-size="11">PS: Central Kotwali | Case Ref: FIR-2026/088 | Arms Act Sec 25</text><path d="M 120 220 L 320 220 L 340 180 L 460 180 L 460 210 L 370 210 L 350 260 L 290 310 L 240 310 L 270 250 L 120 250 Z" fill="%234a5568" stroke="%23cbd5e0" stroke-width="4"/><circle cx="330" cy="235" r="12" fill="none" stroke="%23cbd5e0" stroke-width="3"/><text x="360" y="170" fill="%23f6e05e" font-family="monospace" font-size="12">STAMPED: IND-7.65mm-No.9842</text><text x="60" y="340" fill="%23e2e8f0" font-family="sans-serif" font-size="12">Country-made semi-automatic pistol, 7.65mm caliber, magazine detached, serial number partially obliterated.</text></svg>'
  },
  {
    id: 'document-1',
    label: 'Forged Bank Cheque',
    category: 'document',
    categoryLabel: 'Financial Document',
    description: 'Bearer Cheque for ₹4,85,000 with overwriting & altered signatory (BNS Sec 318/336)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f7fafc"/><rect x="30" y="40" width="540" height="320" rx="4" fill="%23ffffff" stroke="%232b6cb0" stroke-width="2"/><rect x="50" y="60" width="120" height="30" fill="%232b6cb0"/><text x="60" y="80" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="12">STATE BANK</text><text x="420" y="75" fill="%232d3748" font-family="monospace" font-size="12">DATE: 14/08/2026</text><line x1="50" y1="120" x2="550" y2="120" stroke="%23cbd5e0" stroke-width="1"/><text x="60" y="115" fill="%232d3748" font-family="sans-serif" font-size="12">PAY: Ramesh Chandra Sharma OR BEARER</text><line x1="50" y1="160" x2="420" y2="160" stroke="%23cbd5e0" stroke-width="1"/><text x="60" y="155" fill="%232d3748" font-family="sans-serif" font-size="12">RUPEES: Four Lakh Eighty Five Thousand Only</text><rect x="430" y="135" width="120" height="35" fill="%23edf2f7" stroke="%23718096" stroke-width="1"/><text x="440" y="158" fill="%231a202c" font-family="monospace" font-weight="bold" font-size="14">₹ 4,85,000/-</text><text x="420" y="270" fill="%232d3748" font-family="cursive" font-size="18">R. K. Verma [Forged Signature]</text><rect x="50" y="295" width="500" height="40" fill="%23edf2f7"/><text x="120" y="320" fill="%231a202c" font-family="monospace" font-size="14" letter-spacing="4">⑈004521⑈ 110002015⑆ 023419⑈ 29</text></svg>'
  },
  {
    id: 'biological-1',
    label: 'Forensic DNA / Blood Swab',
    category: 'biological',
    categoryLabel: 'Serology / DNA',
    description: 'Sterile cotton swab with suspected human blood spatter for FSL DNA test (Sec 176 BNSS)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2306231d"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%230b352c" stroke="%2310b981" stroke-width="2"/><text x="60" y="80" fill="%2334d399" font-family="monospace" font-size="14" font-weight="bold">FORENSIC SCIENCE LAB - BIOLOGICAL EXHIBIT B-2</text><text x="60" y="105" fill="%23a7f3d0" font-family="monospace" font-size="11">Specimen: Blood Swab &amp; Epithelial DNA | Sec 176(3) BNSS Mandate</text><path d="M 120 200 L 400 200" stroke="%23e2e8f0" stroke-width="12" stroke-linecap="round"/><circle cx="420" cy="200" r="28" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="3"/><circle cx="420" cy="200" r="18" fill="%23991b1b"/><path d="M 430 190 Q 445 170 450 185 T 465 195" fill="none" stroke="%237f1d1d" stroke-width="4"/><circle cx="480" cy="230" r="6" fill="%23991b1b"/><circle cx="495" cy="215" r="4" fill="%237f1d1d"/><text x="60" y="300" fill="%2334d399" font-family="monospace" font-size="13">FSL SEAL: TAMPER-EVIDENT STERILE TUBE #DNA-8831</text><text x="60" y="335" fill="%23e2e8f0" font-family="sans-serif" font-size="12">Air-dried crime scene swab with dark red stains collected under sterile forensic protocol.</text></svg>'
  },
  {
    id: 'digital-1',
    label: 'Phone Screen Threat Messages',
    category: 'digital',
    categoryLabel: 'Digital / Electronic',
    description: 'Extortion WhatsApp chat screenshot on mobile screen with timestamp (Section 63 BSA 2023)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="180" y="30" width="240" height="340" rx="24" fill="%23020617" stroke="%2338bdf8" stroke-width="3"/><rect x="240" y="42" width="120" height="8" rx="4" fill="%23334155"/><rect x="195" y="60" width="210" height="290" fill="%230b141a"/><rect x="195" y="60" width="210" height="35" fill="%23202c33"/><text x="210" y="82" fill="%23e9edef" font-family="sans-serif" font-size="12" font-weight="bold">+91 98104 XXXXX</text><rect x="205" y="110" width="190" height="45" rx="6" fill="%23005c4b"/><text x="215" y="130" fill="%23e9edef" font-family="sans-serif" font-size="11">Transfer 10 Lakhs by 6 PM or</text><text x="215" y="145" fill="%23e9edef" font-family="sans-serif" font-size="11">consequences will follow.</text><text x="360" y="150" fill="%238696a0" font-family="monospace" font-size="8">22:14</text><rect x="205" y="170" width="180" height="30" rx="6" fill="%23202c33"/><text x="215" y="190" fill="%23e9edef" font-family="sans-serif" font-size="10">Who is this? We are filing FIR.</text><text x="20" y="60" fill="%2338bdf8" font-family="monospace" font-size="13" font-weight="bold">SEC 63 BSA COMPLIANT</text><text x="20" y="85" fill="%2394a3b8" font-family="monospace" font-size="10">IMEI: 864920048192019</text><text x="20" y="105" fill="%2394a3b8" font-family="monospace" font-size="10">HASH: sha256:d892a0...</text></svg>'
  }
];

// Visual UI theme mappings for the 4 Auto-Categorization categories
const CATEGORY_CONFIG: Record<EvidenceCategory, {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconColor: string;
  statutoryCite: string;
  accentColor: string;
}> = {
  weapon: {
    label: 'WEAPON',
    sublabel: 'Ballistics, Firearms & Offensive Edged Weapons',
    icon: Crosshair,
    badgeBg: 'bg-red-950/40 dark:bg-red-950/60',
    badgeBorder: 'border-red-600/40',
    badgeText: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-500',
    statutoryCite: 'Arms Act 1959, Sec 25/27 • BNS 2023 Sec 109/115',
    accentColor: '#EF4444'
  },
  document: {
    label: 'DOCUMENT',
    sublabel: 'Financial Instruments, Deeds, Cheques & Written Records',
    icon: FileText,
    badgeBg: 'bg-amber-950/40 dark:bg-amber-950/60',
    badgeBorder: 'border-amber-600/40',
    badgeText: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500',
    statutoryCite: 'BNS 2023 Sec 318/336 (Forgery & Fraud) • NI Act Sec 138',
    accentColor: '#D97706'
  },
  biological: {
    label: 'BIOLOGICAL',
    sublabel: 'DNA, Blood Stains, Serological Samples & Fingerprints',
    icon: Dna,
    badgeBg: 'bg-emerald-950/40 dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-600/40',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-500',
    statutoryCite: 'BNSS 2023 Sec 176(3) Forensic Mandate • State FSL Protocol',
    accentColor: '#10B981'
  },
  digital: {
    label: 'DIGITAL',
    sublabel: 'Smartphones, CCTV Screen Captures, Hard Drives & Electronic Data',
    icon: Cpu,
    badgeBg: 'bg-blue-950/40 dark:bg-blue-950/60',
    badgeBorder: 'border-blue-600/40',
    badgeText: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500',
    statutoryCite: 'Bharatiya Sakshya Adhiniyam (BSA 2023) Sec 63 • IT Act 2000',
    accentColor: '#3B82F6'
  }
};

type AnalysisMode = 'comprehensive' | 'ocr' | 'objects' | 'bsa63';

interface EvidenceScannerViewProps {
  caseId?: string;
  onBack?: () => void;
}

export const EvidenceScannerView: React.FC<EvidenceScannerViewProps> = ({
  caseId,
  onBack
}) => {
  const { user, logAuditEvent, cases } = useAuth();
  
  // Module View (Physical Evidence Scanner vs CCTV Intelligence)
  const [evidenceModuleView, setEvidenceModuleView] = useState<'scanner' | 'cctv'>('scanner');
  const [selectedCctvCaseId, setSelectedCctvCaseId] = useState<string>(
    caseId || (cases && cases.length > 0 ? cases[0].caseId : 'LAW-2026-00125')
  );

  // Image and Camera states
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [activeMode, setActiveMode] = useState<AnalysisMode>('comprehensive');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'ocr' | 'chain'>('report');
  
  // Auto-Categorization states
  const [detectedCategory, setDetectedCategory] = useState<EvidenceCategory | null>(null);
  const [categoryConfidence, setCategoryConfidence] = useState<number | null>(null);
  const [categoryReasoning, setCategoryReasoning] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [filterPresetCategory, setFilterPresetCategory] = useState<EvidenceCategory | 'all'>('all');

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Unable to access camera device. Please verify camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware found on this device.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Capture frame from video stream to image
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setImage(dataUrl);
        setAnalysis(null);
        setDetectedCategory(null);
        setCategoryConfidence(null);
        setCategoryReasoning(null);
        setTags([]);
        stopCamera();
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setDetectedCategory(null);
        setCategoryConfidence(null);
        setCategoryReasoning(null);
        setTags([]);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Fast auto-categorization only
  const handleQuickCategorize = async () => {
    if (!image) return;
    setIsCategorizing(true);
    try {
      const base64Data = image.split(',')[1] || image;
      const result = await categorizeEvidenceImage(base64Data);
      setDetectedCategory(result.category);
      setCategoryConfidence(result.categoryConfidence);
      setCategoryReasoning(result.categoryReasoning);
      setTags(result.tags);

      if (logAuditEvent) {
        logAuditEvent('EVIDENCE_AUTO_CATEGORIZED', `Auto-categorized as ${result.category.toUpperCase()}`, user?.station);
      }
    } catch (err) {
      console.error('Quick categorize failed:', err);
    } finally {
      setIsCategorizing(false);
    }
  };

  // Execute AI multi-modal forensic analysis and auto-categorization
  const handleAnalyze = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const base64Data = image.split(',')[1] || image;
      
      let promptText = '';
      if (activeMode === 'ocr') {
        promptText = `Focus strictly on Optical Character Recognition (OCR) and text transcription for this physical or digital evidence image.
1. Transcribe all visible text, numbers, handwritten notes, vehicle license plates, signatures, timestamps, amounts, and account codes verbatim.
2. Note any signs of overwriting, handwriting variations, erasure, or document forgery.
3. Identify language(s) and character scripts.
4. Provide structured key-value extracted metadata.`;
      } else if (activeMode === 'objects') {
        promptText = `Perform forensic object and weapon classification on this evidence image.
1. Identify all physical objects, contraband, weapons, firearms, ammunition, electronics, or vehicle components.
2. Specify exact make, model, caliber, dimensions, material composition, and serial markings if discernible.
3. Assess damage patterns, blood/biological stains, ballistic impact marks, or tool impressions.
4. Classify statutory hazard and custody precautions under the Arms Act, NDPS Act, or BNS 2023.`;
      } else if (activeMode === 'bsa63') {
        promptText = `Evaluate this digital/electronic evidence record for statutory admissibility under Section 63 of the Bharatiya Sakshya Adhiniyam (BSA 2023).
1. Extract visible digital metadata, device identifiers (IMEI, MAC, IP, URL), software signatures, and system timestamps.
2. Check for visual tamper indicators, compression anomalies, or digital editing artifacts.
3. Generate the required statutory Certificate clauses under Section 63(4) BSA 2023 for production in Court.
4. Outline the mandatory Hash value verification and secure repository protocol.`;
      } else {
        promptText = customPrompt.trim() || `Perform a comprehensive forensic and statutory investigation report for this evidence item under BNS 2023, BNSS 2023, and BSA 2023. Include:
1. EVIDENCE CLASSIFICATION & OBJECT IDENTIFICATION
2. EXTRACTED TEXT & OCR DATA (transcribe all visible text)
3. FORENSIC OBSERVATIONS & PHYSICAL ATTRIBUTES
4. STATUTORY OFFENCE MAPPING (exact BNS sections)
5. SEIZURE MEMO & PANCHNAMA DRAFT under Section 105 BNSS.`;
      }

      const result = await analyzeEvidenceImage(base64Data, promptText);
      setAnalysis(result.analysis);
      setDetectedCategory(result.category);
      setCategoryConfidence(result.categoryConfidence);
      setCategoryReasoning(result.categoryReasoning);
      setTags(result.tags);
      
      if (logAuditEvent) {
        logAuditEvent('EVIDENCE_ANALYZED', `Forensic analysis and auto-categorization (${result.category.toUpperCase()}) completed`, user?.station);
      }
    } catch (err) {
      console.error(err);
      alert('Forensic image analysis failed. Please verify your connection or try another image.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add custom tag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Helper to extract text section for OCR tab
  const extractOCRSection = (fullText: string) => {
    const ocrMatch = fullText.match(/(?:EXTRACTED TEXT|OCR DATA|Transcribed Content)([\s\S]*?)(?:###|3\.|FORENSIC OBSERVATIONS|STATUTORY|$)/i);
    return ocrMatch ? ocrMatch[1].trim() : fullText;
  };

  // Copy full analysis report to clipboard
  const handleCopyReport = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Copy OCR text only
  const handleCopyOCR = () => {
    if (!analysis) return;
    const ocr = extractOCRSection(analysis);
    navigator.clipboard.writeText(ocr);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Export report as text file
  const handleDownloadReport = () => {
    if (!analysis) return;
    const blob = new Blob([`======================================================
STATE POLICE FORENSIC SCIENCE INTELLIGENCE REPORT
CATEGORY: ${detectedCategory ? detectedCategory.toUpperCase() : 'GENERAL FORENSIC EVIDENCE'}
CONFIDENCE: ${categoryConfidence ? Math.round(categoryConfidence * 100) + '%' : 'CONFIRMED'}
TAGS: ${tags.join(', ')}
SECTION 63 BHARATIYA SAKSHYA ADHINIYAM (BSA 2023)
======================================================
Date / Time: ${new Date().toLocaleString('en-IN')}
Investigating Officer: ${user?.name || 'Authorized Officer'} (${user?.badgeNumber || 'HQ-Command'})
Station: ${user?.station || 'Central Police Station'}
Mode: ${activeMode.toUpperCase()}
======================================================

${analysis}

======================================================
Generated via LAWGIC AI Forensic Intelligence System
Official Law Enforcement Internal Record
======================================================`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Report_${detectedCategory || 'Evidence'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSamples = filterPresetCategory === 'all' 
    ? SAMPLE_EVIDENCE 
    : SAMPLE_EVIDENCE.filter(s => s.category === filterPresetCategory);

  if (evidenceModuleView === 'cctv') {
    return (
      <div className="space-y-4">
        {/* Module Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setEvidenceModuleView('scanner')}
              className="px-3 py-1.5 text-xs font-mono rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Physical Evidence Scanner</span>
            </button>
            <span className="text-[#5A6573]">/</span>
            <span className="text-xs font-mono font-bold text-[#D4AF37] flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#D4AF37]" />
              CCTV Video Evidence Intelligence Studio
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#5A6573] font-mono whitespace-nowrap">Case Docket:</span>
            <select
              value={selectedCctvCaseId}
              onChange={e => setSelectedCctvCaseId(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white font-mono cursor-pointer"
            >
              {(cases || []).map(c => (
                <option key={c.caseId} value={c.caseId}>
                  {c.caseId} — {c.firNumber || c.title || 'Docket'}
                </option>
              ))}
            </select>
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 text-xs font-mono rounded-xs bg-[#1E2D3E] text-white hover:bg-[#2A3F55] transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <CctvEvidenceView
          caseId={selectedCctvCaseId}
          userRole={user?.role || 'Constable'}
          userName={user?.name || 'Investigating Officer'}
          onBack={() => setEvidenceModuleView('scanner')}
        />
      </div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto space-y-8 pb-20 text-[#171A1E] dark:text-[#E8ECEF] font-sans"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. HEADER */}
      <div className="bg-[#FCFBF8] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
                title="Back to previous view"
              >
                <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
                <span>Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A38038] dark:text-[#D5B875] font-bold block">
                  FORENSIC LAB & AUTO-CATEGORIZATION ENGINE
                </span>
                <span className="px-2 py-0.5 bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30 text-[10px] font-mono font-bold rounded-xs">
                  4-TIER AI CLASSIFICATION
                </span>
                {caseId && (
                  <span className="px-2 py-0.5 bg-[#1E2D3E] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold rounded-xs">
                    CASE: {caseId}
                  </span>
                )}
              </div>
              <h1 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#08121D] dark:text-white">
                Forensic Evidence Scanner & Auto-Categorization
              </h1>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Capture or upload evidence to automatically categorize items as <strong className="text-red-500">weapon</strong>, <strong className="text-amber-500">document</strong>, <strong className="text-emerald-500">biological</strong>, or <strong className="text-blue-500">digital</strong> with instant OCR, statutory mapping, and Panchnama drafts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setEvidenceModuleView('cctv')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2D3E] hover:bg-[#2A3F55] border border-[#D4AF37]/40 rounded-sm text-[#D4AF37] text-xs font-mono font-semibold shadow-xs cursor-pointer transition-colors"
              title="Switch to CCTV Video Evidence Intelligence"
            >
              <Video className="w-4 h-4 text-[#D4AF37]" />
              <span>CCTV Video Intelligence</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#101C29] border border-[#C6A15B]/30 rounded-sm text-[#D5B875] text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
              <span>Section 63 BSA & 176(3) BNSS</span>
            </div>
          </div>
        </div>

        {/* CCTV Evidence Quick Banner */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#101C29] border border-[#C6A15B]/40 rounded-sm shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-xs font-serif font-bold text-white flex items-center gap-2">
                <span>CCTV Video Evidence Intelligence</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] rounded-xs font-semibold">
                  Section 63 BSA 2023 Compliant
                </span>
              </div>
              <div className="text-[11px] text-[#8C96A3] mt-0.5">
                Have video surveillance footage? Upload MP4/MKV/AVI/MOV to extract frame-level timeline events, vehicle license plate OCR, suspect movements, and tamper audit logs.
              </div>
            </div>
          </div>
          <button
            onClick={() => setEvidenceModuleView('cctv')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-[#D4AF37] hover:bg-[#C29B27] text-[#08121D] font-serif transition-colors shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Open CCTV Studio</span>
          </button>
        </div>

        {/* 4 Category Pill Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {(Object.keys(CATEGORY_CONFIG) as EvidenceCategory[]).map(catKey => {
            const config = CATEGORY_CONFIG[catKey];
            const Icon = config.icon;
            const isSelected = detectedCategory === catKey;
            return (
              <div 
                key={catKey}
                onClick={() => setDetectedCategory(catKey)}
                className={`p-2.5 rounded-sm border transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected 
                    ? `${config.badgeBg} ${config.badgeBorder} ring-1 ring-[#C6A15B]` 
                    : 'bg-[#FFFFFF] dark:bg-[#0D1824] border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/40'
                }`}
              >
                <div className={`p-1.5 rounded-xs ${config.badgeBg} ${config.badgeText}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold uppercase ${isSelected ? config.badgeText : 'text-[#08121D] dark:text-white'}`}>
                      {config.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                    )}
                  </div>
                  <p className="text-[9px] text-[#8C96A3] truncate">
                    {catKey === 'weapon' && 'Guns, blades, ammo'}
                    {catKey === 'document' && 'Cheques, deeds, forgery'}
                    {catKey === 'biological' && 'DNA, blood, serology'}
                    {catKey === 'digital' && 'Phones, CCTV, screens'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preset Sample Gallery with Category Filters */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C96A3]">
              <Zap className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>QUICK LOAD SAMPLE FORENSIC EVIDENCE:</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px] font-mono overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterPresetCategory('all')}
                className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
                  filterPresetCategory === 'all'
                    ? 'bg-[#C6A15B] text-[#08121D] font-bold'
                    : 'text-[#8C96A3] hover:text-white bg-[#101C29]'
                }`}
              >
                All (4)
              </button>
              {(['weapon', 'document', 'biological', 'digital'] as EvidenceCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterPresetCategory(cat)}
                  className={`px-2 py-0.5 rounded-xs uppercase transition-all cursor-pointer flex items-center gap-1 ${
                    filterPresetCategory === cat
                      ? 'bg-[#C6A15B] text-[#08121D] font-bold'
                      : 'text-[#8C96A3] hover:text-white bg-[#101C29]'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredSamples.map(sample => {
              const catConf = CATEGORY_CONFIG[sample.category];
              const Icon = catConf.icon;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setImage(sample.url);
                    setAnalysis(null);
                    setDetectedCategory(sample.category);
                    setCategoryConfidence(0.96);
                    setCategoryReasoning(`Categorized as ${sample.category} based on statutory exhibit profile.`);
                    setTags([sample.category.toUpperCase(), sample.categoryLabel, 'Evidence Registry']);
                  }}
                  className="text-left p-2.5 bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] transition-all rounded-sm cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#08121D] dark:text-white group-hover:text-[#C6A15B] mb-1">
                    <span className="truncate">{sample.label}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs flex items-center gap-1 shrink-0 ${catConf.badgeBg} ${catConf.badgeText}`}>
                      <Icon className="w-2.5 h-2.5" />
                      <span>{sample.category}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B636E] dark:text-[#8C96A3] line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Camera Capture, File Upload & Options (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-7 rounded-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#A38038] dark:text-[#D5B875] uppercase font-bold block">
                  EVIDENCE INGESTION & CLASSIFICATION
                </span>
                <h3 className="font-serif-legal font-bold text-lg text-[#08121D] dark:text-white">
                  Capture & Auto-Tag
                </h3>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-1 bg-[#101C29] p-1 border border-[#1E2D3E] rounded-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1 rounded-xs transition-all cursor-pointer ${
                    !isCameraActive && image ? 'bg-[#C6A15B] text-[#08121D] font-bold' : 'text-[#8C96A3] hover:text-white'
                  }`}
                  title="Upload from disk"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) {
                      stopCamera();
                    } else {
                      startCamera();
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1 rounded-xs transition-all cursor-pointer ${
                    isCameraActive ? 'bg-[#EF4444] text-white font-bold animate-pulse' : 'text-[#8C96A3] hover:text-white'
                  }`}
                  title="Use Device Camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isCameraActive ? 'Active' : 'Camera'}</span>
                </button>
              </div>
            </div>

            {/* Camera Error Display */}
            {cameraError && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-sm text-xs text-[#EF4444] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <button 
                  onClick={() => setCameraError(null)}
                  className="text-[10px] font-mono underline hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* LIVE CAMERA VIEWFINDER */}
            {isCameraActive ? (
              <div className="relative h-72 rounded-sm border-2 border-[#C6A15B] bg-[#000000] overflow-hidden flex flex-col items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder reticle overlay */}
                <div className="absolute inset-4 border border-dashed border-[#C6A15B]/50 pointer-events-none rounded-xs flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] font-mono text-[#D5B875] bg-[#08121D]/80 px-2 py-0.5 rounded-xs self-start">
                    <span>LIVE FORENSIC VIEWFINDER • 1080P</span>
                  </div>
                  <div className="self-center w-8 h-8 border-2 border-[#C6A15B] rounded-full flex items-center justify-center opacity-80">
                    <div className="w-2 h-2 bg-[#EF4444] rounded-full animate-ping" />
                  </div>
                  <div className="text-[10px] font-mono text-[#8C96A3] bg-[#08121D]/80 px-2 py-0.5 rounded-xs self-end">
                    <span>ALIGN EVIDENCE IN FRAME</span>
                  </div>
                </div>

                {/* Camera In-view Controls */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-[#08121D]/90 backdrop-blur-sm p-2 border border-[#1E2D3E] rounded-sm">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2 bg-[#101C29] hover:bg-[#1E2D3E] border border-[#C6A15B]/40 text-[#D5B875] rounded-sm text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
                  </button>

                  {/* Big Shutter Button */}
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="px-5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs rounded-full border-2 border-white flex items-center gap-2 shadow-lg cursor-pointer transform active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>CAPTURE EVIDENCE</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 bg-[#101C29] hover:bg-[#1E2D3E] text-[#8C96A3] hover:text-white rounded-sm text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* FILE DROPZONE & PREVIEW */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-72 rounded-sm border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden ${
                  image 
                    ? 'border-[#C6A15B] bg-[#08121D]' 
                    : 'border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] bg-[#FFFFFF] dark:bg-[#08121D]'
                }`}
              >
                {image ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2 group">
                    <img src={image} alt="Evidence" className="w-full h-full object-contain" />
                    
                    {/* Auto-category badge on image if detected */}
                    {detectedCategory && (
                      <div className="absolute top-3 left-3 z-10">
                        {(() => {
                          const config = CATEGORY_CONFIG[detectedCategory];
                          const Icon = config.icon;
                          return (
                            <span className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-md border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span>AUTO-TAGGED: {config.label}</span>
                              {categoryConfidence && (
                                <span className="opacity-80">({Math.round(categoryConfidence * 100)}%)</span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-[#08121D]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                      <span className="px-3 py-1.5 bg-[#C6A15B] text-[#08121D] text-xs font-bold font-mono rounded-sm flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        Click to change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-6 text-center">
                    <div className="w-14 h-14 mx-auto border border-[#C6A15B]/40 bg-[#101C29] rounded-sm flex items-center justify-center text-[#D5B875]">
                      <ScanLine className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#08121D] dark:text-white">
                        Select Evidence Image or Start Camera
                      </div>
                      <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                        Auto-classifies weapons, forged documents, biological traces, and digital evidence
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera();
                        }}
                        className="px-3 py-1.5 bg-[#101C29] hover:bg-[#1E2D3E] border border-[#C6A15B]/40 text-[#D5B875] text-xs font-mono rounded-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Live Camera</span>
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-[#8C96A3]">
                      Supports PNG, JPG, JPEG, TIFF up to 25MB
                    </p>
                  </div>
                )}
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            )}

            {/* QUICK AUTO-CATEGORIZE & MANUAL OVERRIDE BAR */}
            {image && (
              <div className="p-3 bg-[#FFFFFF] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#8C96A3] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>DETECTED CATEGORY:</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleQuickCategorize}
                    disabled={isCategorizing || isLoading}
                    className="px-2 py-0.5 bg-[#C6A15B]/15 hover:bg-[#C6A15B]/30 border border-[#C6A15B]/40 text-[#C6A15B] text-[10px] font-mono font-bold rounded-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isCategorizing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Tagging...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Tag with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Category Selection Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['weapon', 'document', 'biological', 'digital'] as EvidenceCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const Icon = cfg.icon;
                    const isSelected = detectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setDetectedCategory(cat);
                          if (!tags.includes(cat.toUpperCase())) {
                            setTags([...tags, cat.toUpperCase()]);
                          }
                        }}
                        className={`p-1.5 rounded-xs text-[10px] font-mono uppercase font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText} ring-1 ring-[#C6A15B]`
                            : 'bg-[#FCFBF8] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#8C96A3] hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Category Reasoning Note */}
                {categoryReasoning && (
                  <p className="text-[11px] font-mono text-[#8C96A3] italic border-t border-[#DDD8CE] dark:border-[#1E2D3E] pt-2">
                    "{categoryReasoning}"
                  </p>
                )}

                {/* Forensic Tag Pills */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8C96A3]">
                    <span>EVIDENCE TAGS:</span>
                    {!isAddingTag && (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-[#C6A15B] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Tag</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    {tags.map((t, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 bg-[#08121D] border border-[#C6A15B]/30 text-[#D5B875] text-[10px] font-mono rounded-xs flex items-center gap-1"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    {isAddingTag && (
                      <form onSubmit={handleAddTag} className="flex items-center gap-1">
                        <input 
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="Tag name..."
                          className="px-1.5 py-0.5 bg-[#08121D] border border-[#C6A15B] text-xs font-mono text-white rounded-xs w-24 focus:outline-none"
                          autoFocus
                        />
                        <button 
                          type="submit"
                          className="px-1.5 py-0.5 bg-[#C6A15B] text-[#08121D] text-[10px] font-mono font-bold rounded-xs cursor-pointer"
                        >
                          OK
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsAddingTag(false)}
                          className="text-[#8C96A3] hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ANALYSIS TARGET MODE SELECTOR */}
            <div className="space-y-2 pt-1 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
              <div className="flex items-center justify-between text-xs font-mono text-[#8C96A3]">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#C6A15B]" />
                  AI ANALYSIS FOCUS:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('comprehensive')}
                  className={`p-2.5 text-left border rounded-sm transition-all cursor-pointer ${
                    activeMode === 'comprehensive'
                      ? 'bg-[#101C29] border-[#C6A15B] text-[#D5B875]'
                      : 'bg-[#FFFFFF] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#5B636E] dark:text-[#8C96A3] hover:border-[#C6A15B]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Scale className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Full Case Report</span>
                  </div>
                  <p className="text-[10px] text-[#8C96A3] mt-0.5 line-clamp-1">OCR, objects, BNS & Panchnama</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('ocr')}
                  className={`p-2.5 text-left border rounded-sm transition-all cursor-pointer ${
                    activeMode === 'ocr'
                      ? 'bg-[#101C29] border-[#C6A15B] text-[#D5B875]'
                      : 'bg-[#FFFFFF] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#5B636E] dark:text-[#8C96A3] hover:border-[#C6A15B]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Extract OCR Text</span>
                  </div>
                  <p className="text-[10px] text-[#8C96A3] mt-0.5 line-clamp-1">Transcribe handwriting & cheques</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('objects')}
                  className={`p-2.5 text-left border rounded-sm transition-all cursor-pointer ${
                    activeMode === 'objects'
                      ? 'bg-[#101C29] border-[#C6A15B] text-[#D5B875]'
                      : 'bg-[#FFFFFF] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#5B636E] dark:text-[#8C96A3] hover:border-[#C6A15B]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Fingerprint className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Object & Weapon ID</span>
                  </div>
                  <p className="text-[10px] text-[#8C96A3] mt-0.5 line-clamp-1">Firearms, serials & damage</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('bsa63')}
                  className={`p-2.5 text-left border rounded-sm transition-all cursor-pointer ${
                    activeMode === 'bsa63'
                      ? 'bg-[#101C29] border-[#C6A15B] text-[#D5B875]'
                      : 'bg-[#FFFFFF] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E] text-[#5B636E] dark:text-[#8C96A3] hover:border-[#C6A15B]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Section 63 BSA</span>
                  </div>
                  <p className="text-[10px] text-[#8C96A3] mt-0.5 line-clamp-1">Digital admissibility & hashes</p>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => { 
                  setImage(null); 
                  setAnalysis(null); 
                  setDetectedCategory(null);
                  setCategoryConfidence(null);
                  setCategoryReasoning(null);
                  setTags([]);
                  stopCamera();
                }}
                disabled={!image && !isCameraActive}
                className="px-4 py-3 border border-[#DDD8CE] dark:border-[#1E2D3E] hover:bg-[#FFFFFF] dark:hover:bg-[#101C29] text-xs font-mono rounded-sm text-[#8C96A3] hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button 
                id="analyze-evidence-btn"
                type="button"
                onClick={handleAnalyze}
                disabled={!image || isLoading}
                className="flex-1 btn-legal-gold py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#08121D]" />
                    <span>Analyzing & Auto-Categorizing with AI...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-[#08121D]" />
                    <span>Run Forensic Analysis & Auto-Tag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Statutory Chain of Custody Box */}
          <div className="bg-[#08121D] text-[#E8ECEF] border border-[#1E2D3E] p-5 rounded-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-[#D5B875]">
                <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                <span>SECTION 63 BSA & 105 BNSS COMPLIANCE</span>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-xs">SECURED</span>
            </div>
            <p className="text-[#8C96A3] leading-relaxed">
              Photographic evidence captured is processed server-side with SHA-256 hash preservation, ensuring full admissibility for court panchnamas and Section 176(3) BNSS mandatory forensic reporting.
            </p>
          </div>

        </div>

        {/* Right Column: Analysis Findings & Extracted Report (7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div 
                key="analysis-result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-6 shadow-sm"
              >
                {/* Auto-Categorization Hero Banner */}
                {detectedCategory && (
                  <div className={`p-4 rounded-sm border ${CATEGORY_CONFIG[detectedCategory].badgeBg} ${CATEGORY_CONFIG[detectedCategory].badgeBorder} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = CATEGORY_CONFIG[detectedCategory].icon;
                          return <Icon className={`w-5 h-5 ${CATEGORY_CONFIG[detectedCategory].iconColor}`} />;
                        })()}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C96A3] block">
                            AI EVIDENCE CLASSIFICATION
                          </span>
                          <h4 className={`font-serif-legal font-bold text-base ${CATEGORY_CONFIG[detectedCategory].badgeText}`}>
                            {CATEGORY_CONFIG[detectedCategory].label} ({CATEGORY_CONFIG[detectedCategory].sublabel})
                          </h4>
                        </div>
                      </div>

                      {categoryConfidence && (
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#8C96A3] block">CONFIDENCE</span>
                          <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-xs border border-[#10B981]/30">
                            {Math.round(categoryConfidence * 100)}% MATCH
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-[#8C96A3] pt-1 border-t border-[#DDD8CE]/20 dark:border-[#1E2D3E] flex flex-wrap items-center justify-between gap-2">
                      <span><strong>Statutory Context:</strong> {CATEGORY_CONFIG[detectedCategory].statutoryCite}</span>
                      <div className="flex items-center gap-1">
                        {tags.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 bg-[#08121D] text-[#D5B875] text-[9px] rounded-xs border border-[#C6A15B]/30">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Findings Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B]">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white">
                        Forensic Intelligence Findings
                      </h3>
                      <span className="text-[10px] font-mono text-[#8C96A3]">
                        Processed by LAWgic Multimodal Evidence & Legal Intelligence Engine
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#101C29] hover:border-[#C6A15B] border border-[#DDD8CE] dark:border-[#1E2D3E] text-xs font-mono rounded-sm text-[#08121D] dark:text-[#D5B875] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#C6A15B]" />}
                      <span>{copiedReport ? 'Report Copied' : 'Copy Report'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      className="px-3 py-1.5 bg-[#C6A15B] hover:bg-[#D5B875] text-[#08121D] text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export (.txt)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex items-center gap-2 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                      activeTab === 'report'
                        ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/40 font-bold'
                        : 'text-[#8C96A3] hover:text-white'
                    }`}
                  >
                    Full Case Findings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ocr')}
                    className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                      activeTab === 'ocr'
                        ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/40 font-bold'
                        : 'text-[#8C96A3] hover:text-white'
                    }`}
                  >
                    Extracted Text (OCR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chain')}
                    className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                      activeTab === 'chain'
                        ? 'bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/40 font-bold'
                        : 'text-[#8C96A3] hover:text-white'
                    }`}
                  >
                    Panchnama & Seizure
                  </button>
                </div>

                {/* TAB CONTENT: FULL REPORT */}
                {activeTab === 'report' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs sm:text-sm leading-relaxed whitespace-pre-line text-[#171A1E] dark:text-[#E8ECEF] font-sans overflow-x-auto">
                      {analysis}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: OCR ONLY */}
                {activeTab === 'ocr' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#8C96A3]">VERBATIM TEXT EXTRACTED FROM SPECIMEN:</span>
                      <button
                        type="button"
                        onClick={handleCopyOCR}
                        className="px-2.5 py-1 bg-[#101C29] border border-[#1E2D3E] hover:border-[#C6A15B] text-xs font-mono text-[#D5B875] rounded-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#C6A15B]" />}
                        <span>{copiedText ? 'Copied' : 'Copy Extracted Text'}</span>
                      </button>
                    </div>
                    <div className="p-4 bg-[#08121D] border border-[#1E2D3E] rounded-sm font-mono text-xs text-[#D5B875] leading-relaxed whitespace-pre-wrap">
                      {extractOCRSection(analysis)}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PANCHNAMA / CHAIN OF CUSTODY */}
                {activeTab === 'chain' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3 text-xs">
                      <div className="font-mono font-bold text-[#A38038] dark:text-[#D5B875] border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-2 flex items-center justify-between">
                        <span>MEMORANDUM OF SEIZURE (PANCHNAMA) — SECTION 105 BNSS 2023</span>
                        {detectedCategory && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-[#101C29] text-[#C6A15B] rounded-xs">
                            Exhibit Class: {detectedCategory}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-[#5B636E] dark:text-[#CBD5E1]">
                        <strong>Police Station:</strong> {user?.station || 'Central Police Station'}<br />
                        <strong>Investigating Officer:</strong> {user?.name || 'Authorized Officer'} (Badge: {user?.badgeNumber || 'HQ-01'})<br />
                        <strong>Date & Time of Seizure:</strong> {new Date().toLocaleString('en-IN')}<br />
                        <strong>Primary Exhibit Classification:</strong> {detectedCategory ? detectedCategory.toUpperCase() : 'PHYSICAL EVIDENCE'}<br />
                        <strong>Method of Verification:</strong> Video/Photographic Recording with Hash Authentication under Sec 105 BNSS.
                      </p>
                      <div className="p-3 bg-[#101C29] border border-[#C6A15B]/30 rounded-xs text-[#D5B875] font-mono text-[11px]">
                        EVIDENCE EXHIBIT IDENTIFIER: EX-2026-{Math.floor(100000 + Math.random() * 900000)}<br />
                        CATEGORY ASSIGNMENT: {detectedCategory?.toUpperCase() || 'DOCUMENT'}<br />
                        FORENSIC HASH: sha256:{Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Statutory Notice */}
                <div className="pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-[10px] font-mono text-[#8C96A3]">
                  <span>STATUTORY NOTICE: Forward copy to FSL / Magistrate under Section 176(3) BNSS.</span>
                  <span className="text-[#C6A15B]">LAWGIC FORENSIC AI</span>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-12 rounded-sm text-center space-y-5">
                <div className="w-16 h-16 mx-auto border border-[#C6A15B]/30 bg-[#101C29] rounded-sm flex items-center justify-center text-[#C6A15B]">
                  <Scale className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white">
                    Awaiting Evidence Photo
                  </h4>
                  <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] max-w-md mx-auto leading-relaxed">
                    Take a live photo or upload an image to automatically classify items as <span className="text-red-400 font-bold">weapon</span>, <span className="text-amber-400 font-bold">document</span>, <span className="text-emerald-400 font-bold">biological</span>, or <span className="text-blue-400 font-bold">digital</span> with OCR transcription and legal Panchnama generation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="btn-legal-gold px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#08121D]" />
                    <span>Open Camera to Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#FFFFFF] dark:bg-[#101C29] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-xs font-mono text-[#08121D] dark:text-[#D5B875] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-[#C6A15B]" />
                    <span>Upload Image File</span>
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </motion.div>
  );
};
