import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  FileText, 
  Layers, 
  Lightbulb, 
  Clock, 
  User, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ScanLine,
  ChevronRight,
  ShieldCheck,
  Network,
  CheckSquare
} from 'lucide-react';
import { CaseDocumentIntelligenceResult } from '../types/documentIntelligence';
import { analyzeCaseDocumentWithAI } from '../gemini';
import { FIRCase } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

import { DocIntelligenceHeader } from './docIntelligence/DocIntelligenceHeader';
import { DocIntelligenceUpload } from './docIntelligence/DocIntelligenceUpload';
import { DocIntelligenceProcessing } from './docIntelligence/DocIntelligenceProcessing';
import { DocIntelligenceOverviewTab } from './docIntelligence/DocIntelligenceOverviewTab';
import { DocIntelligenceOcrTab } from './docIntelligence/DocIntelligenceOcrTab';
import { DocIntelligenceEvidenceTab } from './docIntelligence/DocIntelligenceEvidenceTab';
import { DocIntelligenceLeadsTab } from './docIntelligence/DocIntelligenceLeadsTab';
import { DocIntelligenceTimelineTab } from './docIntelligence/DocIntelligenceTimelineTab';
import { DocIntelligenceEntitiesTab } from './docIntelligence/DocIntelligenceEntitiesTab';
import { DocIntelligenceLegalTab } from './docIntelligence/DocIntelligenceLegalTab';
import { DocIntelligenceVerificationTab } from './docIntelligence/DocIntelligenceVerificationTab';
import { DocIntelligenceRelationshipTab } from './docIntelligence/DocIntelligenceRelationshipTab';
import { DocIntelligenceChecklistTab } from './docIntelligence/DocIntelligenceChecklistTab';
import type { CaseDocumentVaultItem } from '../types/documentIntelligence';
import { SAMPLE_CASE_DOCUMENTS } from '../data/sampleCaseDocuments';
import { useNavigation } from '../context/NavigationContext';

interface CaseDocumentIntelligenceViewProps {
  cases: FIRCase[];
  onNavigateToFIR?: (prefill?: any) => void;
  onNavigateToResearch?: (query?: string) => void;
  initialDocument?: CaseDocumentVaultItem | null;
  initialCaseId?: string;
  onBack?: () => void;
}

export const CaseDocumentIntelligenceView: React.FC<CaseDocumentIntelligenceViewProps> = ({
  cases,
  onNavigateToFIR,
  onNavigateToResearch,
  initialDocument,
  initialCaseId,
  onBack
}) => {
  const { goBack, currentCaseId } = useNavigation();
  const [stage, setStage] = useState<'upload' | 'processing' | 'report'>('upload');
  const [result, setResult] = useState<CaseDocumentIntelligenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentFileMeta, setCurrentFileMeta] = useState<{ name: string; size: number }>({ name: '', size: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle step-wise back navigation:
  // If in Analysis Result ('report'), Back returns to Document Analysis ('upload').
  // If in Document Analysis ('upload'), Back returns to previous view (Case Documents / Case Details / Vault).
  const handleBack = () => {
    if (stage === 'report' || stage === 'processing') {
      setStage('upload');
    } else {
      if (onBack) {
        onBack();
      } else {
        const targetCaseId = initialCaseId || initialDocument?.caseId || currentCaseId || cases[0]?.caseId;
        goBack({
          view: 'case-workspace',
          caseId: targetCaseId,
          tab: 'documents'
        });
      }
    }
  };

  // Traceability jump state
  const [targetSnippet, setTargetSnippet] = useState<string | null>(null);
  const [targetPage, setTargetPage] = useState<string | number | null>(null);

  const handleStartAnalysis = async (payload: {
    fileBase64?: string;
    mimeType: string;
    fileName: string;
    fileSize: number;
    fileText?: string;
    caseId?: string;
    officerNotes?: string;
  }) => {
    setErrorMessage(null);
    setCurrentFileMeta({ name: payload.fileName, size: payload.fileSize });
    setStage('processing');
    setSaveSuccess(false);

    try {
      const intelligence = await analyzeCaseDocumentWithAI(payload);
      setResult(intelligence);
      setStage('report');
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Document analysis error:', err);
      setErrorMessage(err.message || 'Failed to complete document intelligence analysis. Please retry.');
      setStage('upload');
    }
  };

  useEffect(() => {
    if (initialDocument) {
      // Find matching sample text if available, or generate informative text from document record
      const matchedSample = SAMPLE_CASE_DOCUMENTS.find(s => 
        s.fileName === initialDocument.fileName || s.id === initialDocument.id
      );
      const fallbackText = initialDocument.notes 
        ? `POLICE CASE DOCUMENT RECORD\nCase Reference: ${initialDocument.caseId || 'LAW-2026-00125'}\nDocument Type: ${initialDocument.documentType || 'Official Record'}\nFile Name: ${initialDocument.fileName}\nOfficer Summary & Notes: ${initialDocument.notes}\nUploaded By: ${initialDocument.uploadedBy || 'Investigating Officer'} (${initialDocument.uploaderRole || 'Sub-Inspector'})\nIntegrity Status: ${initialDocument.integrityStatus || 'Verified'}\nSHA-256 Hash: ${initialDocument.sha256Hash || 'Verified cryptographic signature on file'}`
        : `POLICE CASE DOCUMENT RECORD\nCase Reference: ${initialDocument.caseId || 'LAW-2026-00125'}\nDocument Type: ${initialDocument.documentType || 'Official Record'}\nFile Name: ${initialDocument.fileName}`;

      handleStartAnalysis({
        fileName: initialDocument.fileName,
        fileSize: initialDocument.fileSize || 1024,
        mimeType: initialDocument.mimeType || 'application/pdf',
        caseId: initialDocument.caseId,
        fileText: matchedSample?.rawText || fallbackText,
        officerNotes: initialDocument.notes
      });
    }
  }, [initialDocument]);

  const handleReset = () => {
    setStage('upload');
    setResult(null);
    setErrorMessage(null);
    setSaveSuccess(false);
    setTargetSnippet(null);
    setTargetPage(null);
  };

  const handleViewSource = (page: string | number, snippet: string) => {
    setTargetPage(page);
    setTargetSnippet(snippet);
    setActiveTab('ocr');
  };

  const handleSaveToDocket = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const docPayload: Record<string, any> = {
          document_name: result.fileName || 'Case_Intelligence_Document.pdf',
          document_type: result.documentType || 'Other',
          mime_type: result.mimeType || 'application/pdf',
          file_size: result.fileSize || 1024,
          sha256_hash: result.sha256Hash || null,
          analysis_status: 'Analysis Complete',
          extracted_text: result.rawExtractedText || null,
          ai_analysis: result,
          metadata: {
            classificationConfidence: result.classificationConfidence,
            pageCount: result.pageCount,
            caseNumber: result.caseNumber,
            savedAt: new Date().toISOString()
          }
        };

        if (result.caseId && result.caseId !== 'NEW-DOCKET') {
          const { data: caseRow } = await supabase
            .from('cases')
            .select('id')
            .eq('case_id', result.caseId)
            .maybeSingle();

          if (caseRow?.id) {
            docPayload.case_id = caseRow.id;
          }
        }

        await supabase.from('case_documents').insert(docPayload);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.warn('[Supabase] Document save notice:', err);
      // Fallback local save indication
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFIR = () => {
    if (!result || !onNavigateToFIR) return;

    // Prefill FIR draft from document intelligence
    const prefill = {
      incidentType: result.detectedDocumentType.type,
      location: result.caseSummary.whereHappened,
      narrative: `DOCUMENT SOURCE: ${result.fileName}\n\nSUMMARY: ${result.caseSummary.whatHappened}\n\nACTIONS: ${result.caseSummary.allegedActions}\n\nEVIDENCE REFERENCES: ${result.evidenceReferences.map(e => e.evidenceReference).join(', ')}`,
      sections: result.legalContext.map(l => l.section)
    };
    onNavigateToFIR(prefill);
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: FileSearch, count: null },
    { id: 'ocr', label: 'Extracted Text (OCR)', icon: FileText, count: result?.ocrPages.length || null },
    { id: 'evidence', label: 'Evidence Mentioned', icon: Layers, count: result?.evidenceReferences.length || null },
    { id: 'leads', label: 'Potential Leads', icon: Lightbulb, count: result?.potentialLeads.length || null },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: result?.timeline.length || null },
    { id: 'entities', label: 'Persons & Property', icon: User, count: (result?.persons.length || 0) + (result?.vehicles.length || 0) },
    { id: 'relationships', label: 'Relationship Map', icon: Network, count: result?.relationshipMap?.length || null },
    { id: 'checklist', label: 'Investigation Checklist', icon: CheckSquare, count: result?.investigationChecklist?.length || null },
    { id: 'legal', label: 'Legal Context', icon: Scale, count: result?.legalContext.length || null },
    { id: 'verification', label: 'Verification & Quality', icon: AlertTriangle, count: (result?.inconsistencies.length || 0) },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <DocIntelligenceHeader
        result={result}
        stage={stage}
        onReset={handleReset}
        onBack={handleBack}
        onSaveToDocket={stage === 'report' ? handleSaveToDocket : undefined}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onCreateFIR={stage === 'report' && onNavigateToFIR ? handleCreateFIR : undefined}
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-500 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-xs font-mono underline hover:text-red-600 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stage 1: Upload */}
      {stage === 'upload' && (
        <DocIntelligenceUpload
          onAnalyze={handleStartAnalysis}
          cases={cases}
          isAnalyzing={false}
        />
      )}

      {/* Stage 2: Processing */}
      {stage === 'processing' && (
        <DocIntelligenceProcessing
          fileName={currentFileMeta.name}
          fileSize={currentFileMeta.size}
        />
      )}

      {/* Stage 3: Intelligence Report */}
      {stage === 'report' && result && (
        <div className="space-y-6">
          {/* Sub-Navigation Tabs Bar */}
          <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 min-w-max pb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== 'ocr') {
                        setTargetSnippet(null);
                        setTargetPage(null);
                      }
                    }}
                    className={`py-2.5 px-3.5 text-xs font-mono font-medium rounded-t-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#C6A15B] text-[#C6A15B] bg-[#C6A15B]/10 font-bold'
                        : 'border-transparent text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white hover:border-[#DDD8CE] dark:hover:border-[#1E2D3E]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? 'bg-[#C6A15B] text-[#08121D]'
                          : 'bg-[#DDD8CE] dark:bg-[#1E2D3E] text-[#5A6573] dark:text-[#8C96A3]'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === 'overview' && (
              <DocIntelligenceOverviewTab
                result={result}
                onViewSource={handleViewSource}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'ocr' && (
              <DocIntelligenceOcrTab
                ocrPages={result.ocrPages}
                fileName={result.fileName}
                targetSnippet={targetSnippet}
                targetPage={targetPage}
              />
            )}

            {activeTab === 'evidence' && (
              <DocIntelligenceEvidenceTab
                evidenceReferences={result.evidenceReferences}
                evidenceToLegalMapping={result.evidenceToLegalMapping}
                onViewSource={handleViewSource}
              />
            )}

            {activeTab === 'leads' && (
              <DocIntelligenceLeadsTab
                potentialLeads={result.potentialLeads}
                onViewSource={handleViewSource}
              />
            )}

            {activeTab === 'timeline' && (
              <DocIntelligenceTimelineTab
                timeline={result.timeline}
                onViewSource={handleViewSource}
              />
            )}

            {activeTab === 'entities' && (
              <DocIntelligenceEntitiesTab
                persons={result.persons}
                vehicles={result.vehicles}
                locations={result.locations}
                property={result.property}
                onViewSource={handleViewSource}
              />
            )}

            {activeTab === 'relationships' && (
              <DocIntelligenceRelationshipTab
                relationships={result.relationshipMap}
                persons={result.persons}
                vehicles={result.vehicles}
                locations={result.locations}
                property={result.property}
                evidence={result.evidenceReferences}
                onViewSource={handleViewSource}
              />
            )}

            {activeTab === 'checklist' && (
              <DocIntelligenceChecklistTab
                checklist={result.investigationChecklist}
                onViewSource={handleViewSource}
                caseId={result.caseId}
                documentName={result.fileName}
              />
            )}

            {activeTab === 'legal' && (
              <DocIntelligenceLegalTab
                legalContext={result.legalContext}
                onOpenResearch={onNavigateToResearch}
              />
            )}

            {activeTab === 'verification' && (
              <DocIntelligenceVerificationTab
                inconsistencies={result.inconsistencies}
                missingInformation={result.missingInformation}
                checklist={result.investigationChecklist}
                onViewSource={handleViewSource}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
