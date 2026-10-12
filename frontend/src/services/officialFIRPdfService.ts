import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import { OfficialFIRData, CaseDocumentVaultItem } from '../types/documentIntelligence';
import { calculateSHA256FromBuffer } from '../utils/cryptoIntegrity';
import { logAuditEvent } from '../utils/auditLogger';
import { uploadCaseDocumentToStorage, saveCaseDocumentRecord, getAuthHeader } from '../lib/supabase';
import { apiUrl } from '../lib/apiConfig';

export interface FIRValidationResult {
  valid: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * Validates important required fields before FIR generation.
 * Follows statutory mandates:
 * - District
 * - Police Station
 * - Year
 * - FIR Date
 * - Complainant Name
 * - Place of Occurrence
 * - FIR Contents
 */
export function validateFIRData(data: OfficialFIRData): FIRValidationResult {
  const missing: string[] = [];

  if (!data) {
    return {
      valid: false,
      missingFields: ['All Data'],
      message: 'FIR generation failed: Invalid FIR data.'
    };
  }

  if (!data.district?.trim()) missing.push('District');
  if (!data.policeStation?.trim()) missing.push('Police Station');
  if (!data.year?.trim()) missing.push('Year');
  if (!data.firDate?.trim()) missing.push('FIR Date');
  if (!data.complainant?.name?.trim()) missing.push('Complainant Name');
  if (!data.placeOfOccurrence?.address?.trim() && !data.placeOfOccurrence?.directionDistanceFromPS?.trim()) {
    missing.push('Place of Occurrence');
  }
  if (!data.firContents?.trim()) missing.push('FIR Contents');

  if (missing.length > 0) {
    return {
      valid: false,
      missingFields: missing,
      message: `FIR generation failed: ${missing[0]} is missing.`
    };
  }

  return {
    valid: true,
    missingFields: []
  };
}

/**
 * Generates a standard professional police filename
 * e.g., FIR_125_2026.pdf or FIR_LAW-2026-00125.pdf
 */
export function generateFIRFileName(data: OfficialFIRData): string {
  if (data.firNumber) {
    const cleanFir = data.firNumber.replace(/[\/\s]/g, '_');
    return `FIR_${cleanFir}.pdf`;
  }
  if (data.caseId) {
    const cleanCase = data.caseId.replace(/[\/\s]/g, '_');
    return `FIR_${cleanCase}.pdf`;
  }
  return `FIR_TN_POLICE_${new Date().getFullYear()}.pdf`;
}

export interface GeneratedFIRPdfResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  sha256Hash: string;
  pageCount: number;
}

/**
 * Deterministically generates the 3-page Official Tamil Nadu Police FIR PDF.
 * Connects directly to the backend PDF generation subsystem powered by pdf-lib,
 * which eliminates DOM rasterization errors (like oklab color parser failures)
 * while ensuring crisp 3-page A4 output, Tamil Unicode compliance, and SHA-256 seal.
 */
export async function generateOfficialFIRPdf(
  pages?: { page1?: HTMLElement | null; page2?: HTMLElement | null; page3?: HTMLElement | null },
  data?: OfficialFIRData
): Promise<GeneratedFIRPdfResult> {
  console.log('[FIR] PDF generation function called');

  if (!data) {
    console.error('[FIR] Generation failed: Missing data object');
    throw new Error('FIR generation failed: Invalid FIR data.');
  }

  console.log('[FIR] Form validation check');
  const validation = validateFIRData(data);
  if (!validation.valid) {
    console.error('[FIR] Validation failed:', validation.message);
    throw new Error(validation.message || 'FIR generation failed: Required fields are missing.');
  }
  console.log('[FIR] Form validation passed for case:', data.caseId);

  const fileName = generateFIRFileName(data);

  try {
    console.log('[FIR] Calling backend official FIR PDF generator endpoint (/api/fir/generate)');
    const authHeaders = await getAuthHeader();
    const response = await fetch(apiUrl('/api/fir/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const serverErrMsg = errBody?.error || `Server returned error status ${response.status}`;
      console.error('[FIR] Backend generator error response:', serverErrMsg);
      throw new Error(serverErrMsg);
    }

    console.log('[FIR] PDF byte generation succeeded. Receiving PDF stream...');
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('FIR generation failed: PDF byte generation failed.');
    }

    console.log('[FIR] Creating preview URL for blob of size:', blob.size);
    const blobUrl = URL.createObjectURL(blob);
    const arrayBuffer = await blob.arrayBuffer();
    const sha256Hash = await calculateSHA256FromBuffer(arrayBuffer);

    console.log('[FIR] Preview ready. SHA-256:', sha256Hash);

    return {
      blob,
      blobUrl,
      fileName,
      sha256Hash,
      pageCount: 3
    };
  } catch (err: any) {
    console.error('[FIR] Generation failed:', {
      message: err?.message,
      failingFunction: 'generateOfficialFIRPdf'
    });
    // Ensure error has specific prefix
    if (err.message && err.message.startsWith('FIR generation failed:')) {
      throw err;
    }
    throw new Error(`FIR generation failed: ${err.message || 'PDF generation error.'}`);
  }
}

/**
 * Creates or updates an official FIR document in the Case Document Vault
 * with full version tracking (e.g. v1.0 -> v2.0) and audit logs.
 */
export async function saveFIRToDocumentVault(
  data: OfficialFIRData,
  pdfResult: GeneratedFIRPdfResult,
  user: { name: string; role: string; id?: string },
  existingVaultDocuments: CaseDocumentVaultItem[]
): Promise<{ updatedDocs: CaseDocumentVaultItem[]; createdOrUpdatedDoc: CaseDocumentVaultItem; storageWarning?: string }> {
  const existingFIR = existingVaultDocuments.find(
    d => d.caseId === data.caseId && d.documentType === 'FIR'
  );

  let storageWarning: string | undefined = undefined;
  const now = new Date().toISOString();
  let finalDoc: CaseDocumentVaultItem;

  if (existingFIR) {
    // Increment version (e.g. v1.0 -> v2.0)
    const currentVerNum = parseFloat(existingFIR.currentVersion.replace('v', '')) || 1.0;
    const newVerNum = `v${(currentVerNum + 1.0).toFixed(1)}`;

    const newVersionRecord = {
      versionNumber: newVerNum,
      timestamp: now,
      updatedBy: user.name,
      userRole: user.role,
      changeDescription: `Official FIR updated and re-verified by ${user.name} (${user.role}). Form re-stamped with new cryptographic seal.`,
      previousIntegrityHash: existingFIR.sha256Hash,
      newIntegrityHash: pdfResult.sha256Hash,
      fileSize: pdfResult.blob.size,
      fileName: pdfResult.fileName
    };

    finalDoc = {
      ...existingFIR,
      fileName: pdfResult.fileName,
      fileSize: pdfResult.blob.size,
      lastUpdated: now,
      currentVersion: newVerNum,
      sha256Hash: pdfResult.sha256Hash,
      integrityStatus: 'Verified',
      lastIntegrityCheckAt: now,
      versionHistory: [newVersionRecord, ...(existingFIR.versionHistory || [])],
      notes: `Official Tamil Nadu Police Integrated FIR (Section 173 BNSS). Version ${newVerNum} registered by ${user.name}. Storage: Case ${data.caseId}/FIR/${pdfResult.fileName}`,
      tags: ['Official FIR', 'Tamil Nadu Police', 'BNSS 173', 'Sealed', newVerNum]
    };

    // Log Version Created Audit Event
    await logAuditEvent({
      actionType: 'FIR_VERSION_CREATED',
      actionLabel: 'FIR Version Created',
      caseId: data.caseId,
      documentId: finalDoc.id,
      documentName: pdfResult.fileName,
      userId: user.id || 'usr-officer',
      userName: user.name,
      userRole: user.role,
      details: `Created new FIR version ${newVerNum} with cryptographic seal ${pdfResult.sha256Hash}. Storage: Case ${data.caseId}/FIR/${pdfResult.fileName}`,
      status: 'SUCCESS',
      metadata: {
        caseId: data.caseId,
        firNumber: data.firNumber,
        documentType: 'FIR',
        generatedBy: user.name,
        generatedAt: now,
        version: newVerNum,
        fileName: pdfResult.fileName,
        storageReference: `Case ${data.caseId}/FIR/${pdfResult.fileName}`,
        sha256Hash: pdfResult.sha256Hash
      }
    });
  } else {
    // Create new FIR v1.0
    finalDoc = {
      id: `doc-fir-${Date.now()}`,
      caseId: data.caseId,
      fileName: pdfResult.fileName,
      documentType: 'FIR',
      fileSize: pdfResult.blob.size,
      mimeType: 'application/pdf',
      uploadedBy: user.name,
      uploaderRole: user.role,
      uploadedAt: now,
      lastUpdated: now,
      currentVersion: 'v1.0',
      sha256Hash: pdfResult.sha256Hash,
      integrityStatus: 'Verified',
      lastIntegrityCheckAt: now,
      analysisStatus: 'Analyzed',
      versionHistory: [
        {
          versionNumber: 'v1.0',
          timestamp: now,
          updatedBy: user.name,
          userRole: user.role,
          changeDescription: `Initial official FIR registered under Section 173 BNSS by ${user.name}.`,
          newIntegrityHash: pdfResult.sha256Hash,
          fileSize: pdfResult.blob.size,
          fileName: pdfResult.fileName
        }
      ],
      extractedEntitiesCount: {
        persons: (data.complainant?.name ? 1 : 0) + (data.accusedDetails?.length || 0),
        evidence: data.propertyDetails?.length || 0,
        leads: 1,
        timeline: 1
      },
      notes: `Official Tamil Nadu Police Integrated Investigation Form-I. Generated and sealed under Section 173 BNSS. Storage: Case ${data.caseId}/FIR/${pdfResult.fileName}`,
      tags: ['Official FIR', 'Tamil Nadu Police', 'BNSS 173', 'Sealed', 'v1.0']
    };

    // Log FIR Generated Audit Event
    await logAuditEvent({
      actionType: 'FIR_GENERATED',
      actionLabel: 'Official FIR Generated',
      caseId: data.caseId,
      documentId: finalDoc.id,
      documentName: pdfResult.fileName,
      userId: user.id || 'usr-officer',
      userName: user.name,
      userRole: user.role,
      details: `Official 3-Page Tamil Nadu Police FIR generated and sealed with SHA-256 hash ${pdfResult.sha256Hash}. Storage: Case ${data.caseId}/FIR/${pdfResult.fileName}`,
      status: 'SUCCESS',
      metadata: {
        caseId: data.caseId,
        firNumber: data.firNumber,
        documentType: 'FIR',
        generatedBy: user.name,
        generatedAt: now,
        version: 'v1.0',
        fileName: pdfResult.fileName,
        storageReference: `Case ${data.caseId}/FIR/${pdfResult.fileName}`,
        sha256Hash: pdfResult.sha256Hash
      }
    });
  }

  // Also log FIR_SAVED_TO_CASE audit event
  await logAuditEvent({
    actionType: 'FIR_SAVED_TO_CASE',
    actionLabel: 'FIR Saved to Case',
    caseId: data.caseId,
    documentId: finalDoc.id,
    documentName: pdfResult.fileName,
    userId: user.id || 'usr-officer',
    userName: user.name,
    userRole: user.role,
    details: `Official FIR saved under Case ${data.caseId}/FIR/${pdfResult.fileName} (${finalDoc.currentVersion})`,
    status: 'SUCCESS',
    metadata: {
      caseId: data.caseId,
      firNumber: data.firNumber,
      documentType: 'FIR',
      generatedBy: user.name,
      generatedAt: now,
      version: finalDoc.currentVersion,
      fileName: pdfResult.fileName,
      storageReference: `Case ${data.caseId}/FIR/${pdfResult.fileName}`,
      sha256Hash: pdfResult.sha256Hash
    }
  });

  const updatedDocs = existingFIR
    ? existingVaultDocuments.map(d => (d.id === existingFIR.id ? finalDoc : d))
    : [finalDoc, ...existingVaultDocuments];

  // Upload FIR PDF to Supabase Storage bucket 'case-documents' and record in database
  try {
    const uploadRes = await uploadCaseDocumentToStorage(data.caseId, 'fir', pdfResult.blob, pdfResult.fileName);
    if (uploadRes?.error) {
      console.warn('[FIR] Supabase storage upload notice:', uploadRes.error);
      storageWarning = 'FIR generated successfully, but could not be saved to case storage.';
    } else if (uploadRes?.path) {
      await saveCaseDocumentRecord({
        document_name: pdfResult.fileName,
        document_type: 'FIR',
        mime_type: 'application/pdf',
        file_size: pdfResult.blob.size,
        storage_path: uploadRes.path,
        current_version: parseInt(finalDoc.currentVersion.replace('v', ''), 10) || 1,
        sha256_hash: pdfResult.sha256Hash,
        analysis_status: 'Analyzed',
        uploaded_by: user.name,
        metadata: {
          caseId: data.caseId,
          firNumber: data.firNumber,
          district: data.district,
          policeStation: data.policeStation,
          storagePath: uploadRes.path
        }
      });
    }
  } catch (storageErr) {
    console.warn('[FIR] Supabase storage upload notice:', storageErr);
    storageWarning = 'FIR generated successfully, but could not be saved to case storage.';
  }

  // Persist to local vault cache for this case so CaseWorkspace and Dossier pick it up immediately
  try {
    localStorage.setItem(`vault_docs_${data.caseId}`, JSON.stringify(updatedDocs));
    // Also update global all-vault cache if present
    const globalVault = localStorage.getItem('lawgic_case_vault_documents');
    if (globalVault) {
      const parsedGlobal: CaseDocumentVaultItem[] = JSON.parse(globalVault);
      const filtered = parsedGlobal.filter(d => !(d.caseId === data.caseId && d.documentType === 'FIR'));
      localStorage.setItem('lawgic_case_vault_documents', JSON.stringify([finalDoc, ...filtered]));
    }
  } catch (storeErr) {
    console.warn('Notice: LocalStorage vault persistence cache notice:', storeErr);
  }

  return { updatedDocs, createdOrUpdatedDoc: finalDoc, storageWarning };
}
