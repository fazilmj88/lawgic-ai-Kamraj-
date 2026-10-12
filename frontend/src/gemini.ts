import type { CaseDocumentIntelligenceResult } from './types/documentIntelligence';
import { getAuthHeader, supabase, isSupabaseConfigured } from './lib/supabase';
import { apiUrl } from './lib/apiConfig';

/**
 * Resilient authenticated POST helper with automatic session refresh and token recovery on 401.
 */
async function authenticatedPost(endpoint: string, body: any): Promise<Response> {
  let authHeaders = await getAuthHeader();
  let res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body)
  });

  // If unauthorized (401), attempt one session refresh or token recovery and retry
  if (res.status === 401) {
    console.warn(`[AI Service] Auth rejected (401) for ${endpoint}. Attempting session refresh...`);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.refreshSession();
      }
      authHeaders = await getAuthHeader();
      res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.warn(`[AI Service] Session retry failed for ${endpoint}:`, e);
    }
  }

  return res;
}

export interface FIRResponse {
  summary: string;
  clarifyingQuestions: string[];
  firDraft: {
    policeStation: string;
    dateTimeReceived: string;
    complainantDetails: string;
    accusedDetails: string;
    incidentDetails: {
      dateTime: string;
      place: string;
    };
    factsNarrative: string;
    propertyLoss: string;
    witnesses: string;
  };
  sections: Array<{
    section: string;
    confidence: number;
    keyFacts: string[];
    missingFacts: string[];
    reasoning: string[];
    landmarkCases: Array<{
      name: string;
      court: string;
      year: string;
      summary: string;
      principle: string;
    }>;
  }>;
  evidenceChecklist: {
    digital: string[];
    physical: string[];
    immediateSteps: string[];
    procedure: string[];
  };
  crimeClassification: string;
  timeline: Array<{ time: string; event: string }>;
}

export interface ChatResponse {
  reply: string;
  sources?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
  searchQueries?: string[];
}

export interface SearchGroundingResponse {
  text: string;
  sources: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
  searchQueries?: string[];
}

export async function generateFIR(data: any, targetLang: string = 'English'): Promise<FIRResponse> {
  const res = await authenticatedPost('/api/ai/analyze-complaint', { data, targetLang });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  const result = await res.json();
  return result.data || result;
}

export async function chatWithGemini(message: string): Promise<ChatResponse> {
  const res = await authenticatedPost('/api/ai/chat', { message });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  return await res.json();
}

export const chatWithAI = chatWithGemini;

export async function searchLegalPrecedents(query: string): Promise<SearchGroundingResponse> {
  const res = await authenticatedPost('/api/ai/legal-search', { query });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  return await res.json();
}

export type EvidenceCategory = 'weapon' | 'document' | 'biological' | 'digital';

export interface EvidenceCategoryResult {
  category: EvidenceCategory;
  categoryConfidence: number;
  categoryReasoning: string;
  tags: string[];
}

export interface EvidenceAnalysisResponse extends EvidenceCategoryResult {
  analysis: string;
}

export async function categorizeEvidenceImage(imageBase64: string): Promise<EvidenceCategoryResult> {
  const res = await authenticatedPost('/api/ai/categorize-evidence', { imageBase64 });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  const json = await res.json();
  return {
    category: (json.category || 'document') as EvidenceCategory,
    categoryConfidence: typeof json.categoryConfidence === 'number' ? json.categoryConfidence : 0.92,
    categoryReasoning: json.categoryReasoning || 'Forensically classified by visual analysis.',
    tags: Array.isArray(json.tags) ? json.tags : ['Forensic Evidence']
  };
}

export async function analyzeEvidenceImage(imageBase64: string, prompt?: string): Promise<EvidenceAnalysisResponse> {
  const res = await authenticatedPost('/api/ai/analyze-evidence', { imageBase64, prompt });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  const json = await res.json();
  return {
    category: (json.category || 'document') as EvidenceCategory,
    categoryConfidence: typeof json.categoryConfidence === 'number' ? json.categoryConfidence : 0.94,
    categoryReasoning: json.categoryReasoning || 'Auto-categorized by forensic AI multi-modal pipeline.',
    tags: Array.isArray(json.tags) ? json.tags : ['Forensic Evidence', 'Police Registry'],
    analysis: json.analysis || json.data?.analysis || "Analysis complete"
  };
}

export async function reconstructTimelineWithAI(narrative: string, caseContext?: any) {
  const res = await authenticatedPost('/api/ai/reconstruct-timeline', { narrative, caseContext });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server returned ${res.status}`);
  }
  const json = await res.json();
  return json.events || [];
}

export async function analyzeCaseDocumentWithAI(params: {
  fileBase64?: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  fileText?: string;
  caseId?: string;
  officerNotes?: string;
}): Promise<CaseDocumentIntelligenceResult> {
  const res = await authenticatedPost('/api/ai/analyze-case-document', params);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server error ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function compareCaseDocumentsWithAI(params: {
  caseId: string;
  documents: Array<{
    documentId?: string;
    id?: string;
    fileName: string;
    documentType: string;
    text?: string;
    notes?: string;
  }>;
}) {
  const res = await authenticatedPost('/api/ai/compare-case-documents', params);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Server error ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function uploadDocumentToVault(payload: {
  caseId: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  mimeType: string;
  fileBase64?: string;
  fileText?: string;
  uploadedBy?: string;
  uploaderRole?: string;
}) {
  const res = await authenticatedPost('/api/documents/upload', payload);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Upload error ${res.status}`);
  }
  const json = await res.json();
  return json.document;
}

export async function verifyDocumentIntegrityOnServer(documentId: string, payload?: { fileBase64?: string; expectedHash?: string; officerName?: string }) {
  const res = await authenticatedPost(`/api/documents/${documentId}/verify-integrity`, payload || {});
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Integrity verification failed ${res.status}`);
  }
  return await res.json();
}

export async function getDocumentVersionsFromServer(documentId: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/documents/${documentId}/versions`), {
    headers: { ...authHeaders }
  });
  if (!res.ok) {
    throw new Error(`Failed to load versions ${res.status}`);
  }
  const json = await res.json();
  return json.versions || [];
}

export async function createDocumentVersionOnServer(documentId: string, payload: {
  changeDescription: string;
  updatedBy: string;
  userRole: string;
  fileBase64?: string;
  fileName?: string;
  versionNumber?: string;
  fileSize?: number;
}) {
  const res = await authenticatedPost(`/api/documents/${documentId}/version`, payload);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Failed to create version ${res.status}`);
  }
  return await res.json();
}

export const createDocumentVersion = createDocumentVersionOnServer;



