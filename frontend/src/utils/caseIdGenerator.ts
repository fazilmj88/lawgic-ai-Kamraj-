/**
 * Unique Case ID Generation Engine for Lawgic AI
 * Standard Format: LAW-YYYY-XXXXX (e.g. LAW-2026-00125)
 * 
 * Generates unique case identifiers safely by coordinating with the server-side
 * sequence registry and fallback to collision-checked sequential allocation.
 */

import { apiUrl } from '../lib/apiConfig';

export async function generateUniqueCaseId(existingCaseIds: string[] = []): Promise<string> {
  const currentYear = new Date().getFullYear();

  // 1. Try server-side atomic generation first
  try {
    const res = await fetch(apiUrl('/api/cases/generate-id'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: currentYear })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.caseId && /^LAW-\d{4}-\d{5}$/.test(data.caseId)) {
        return data.caseId;
      }
    }
  } catch (err) {
    console.warn('Backend Case ID generation fallback:', err);
  }

  // 2. Safe collision-resistant client fallback
  const yearPrefix = `LAW-${currentYear}-`;
  let maxSeq = 124; // Default starting sequence so next is 00125 as requested

  existingCaseIds.forEach(id => {
    if (id && id.startsWith(yearPrefix)) {
      const seqStr = id.replace(yearPrefix, '');
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(5, '0');
  const generatedId = `${yearPrefix}${padded}`;

  return generatedId;
}

export function isValidCaseId(id: string): boolean {
  if (!id) return false;
  // Accepts LAW-YYYY-XXXXX or legacy FIR-YYYY-XXX
  return /^LAW-\d{4}-\d{5}$/.test(id) || /^FIR-\d{4}-\d{3,5}$/.test(id);
}
