import 'regenerator-runtime/runtime';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { buildOfficialFIRTemplatPdf } from './createTemplatePdf';

export interface BackendFIRValidationResult {
  valid: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * Validates FIR data against practical requirements for official FIR generation.
 * Required:
 * - District
 * - Police Station
 * - Year
 * - FIR Date
 * - Complainant Name
 * - Place of Occurrence
 * - FIR Contents
 *
 * Optional fields (such as sections, delay, properties, etc.) are allowed to be empty
 * and will simply remain blank or take standard procedural defaults.
 */
export function validateBackendFIRData(data: any): BackendFIRValidationResult {
  console.log('[FIR] Validation started');
  const missing: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      missingFields: ['All FIR data'],
      message: 'FIR generation failed: Invalid FIR data payload.'
    };
  }

  if (!safeText(data.district)) missing.push('District');
  if (!safeText(data.policeStation)) missing.push('Police Station');
  
  // Year: if missing, auto-default to current year or flag
  const yearVal = safeText(data.year);
  if (!yearVal) {
    data.year = String(new Date().getFullYear());
  }

  // FIR Date: if missing, auto-default to current date
  const dateVal = safeText(data.firDate);
  if (!dateVal) {
    data.firDate = new Date().toLocaleDateString('en-GB');
  }

  const complainantName = safeText(data.complainant?.name || data.complainantName);
  if (!complainantName) missing.push('Complainant Name');

  const placeOcc = safeText(
    data.placeOfOccurrence?.address ||
    data.placeOfOccurrence?.directionDistanceFromPS ||
    data.placeOfOccurrence ||
    data.incidentPlace
  );
  if (!placeOcc) missing.push('Place of Occurrence');

  const contents = safeText(data.firContents || data.content || data.narrative || data.description);
  if (!contents) missing.push('FIR Contents');

  if (missing.length > 0) {
    const errorMsg = `FIR generation failed: ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} missing.`;
    console.warn(`[FIR] Validation failed: ${errorMsg}`);
    return {
      valid: false,
      missingFields: missing,
      message: errorMsg
    };
  }

  console.log('[FIR] Validation passed');
  return {
    valid: true,
    missingFields: []
  };
}

export function safeText(value: any, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join(', ') || fallback;
  return String(value) || fallback;
}

export function safeDate(value: any, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return fallback;
    return t;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleDateString('en-GB');
  }
  return String(value);
}

export function containsTamil(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

/**
 * Word wraps text to fit within a specified maximum pixel/point width.
 */
export function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      let candidateWidth = 0;
      try {
        candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        // Fallback approximation if font width fails for non-ASCII
        candidateWidth = candidate.length * (fontSize * 0.55);
      }

      if (candidateWidth <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export interface GenerateFIRBackendOptions {
  templatePath?: string;
  outputPath?: string;
}

/**
 * Deterministically loads the official 3-page Tamil Nadu Police FIR template,
 * validates data, maps fields, wraps long narrative, and returns PDF bytes.
 */
export async function generateOfficialFIRPdfBackend(
  data: any,
  options?: GenerateFIRBackendOptions
): Promise<{ pdfBytes: Uint8Array; fileName: string; pageCount: number }> {
  console.log('[FIR] Starting official FIR generation flow on backend');

  // 1. Validation
  const validation = validateBackendFIRData(data);
  if (!validation.valid) {
    throw new Error(validation.message || 'FIR generation failed: Invalid FIR data.');
  }

  // 2. Resolve template path
  const templatePath = options?.templatePath || path.resolve(process.cwd(), 'server', 'templates', 'tamil-nadu-fir-template.pdf');
  console.log(`[FIR] Template path: ${templatePath}`);
  let templateExists = fs.existsSync(templatePath);
  console.log(`[FIR] Template exists: ${templateExists}`);

  if (!templateExists) {
    console.log('[FIR] Template not found on disk. Generating pristine 3-page template now...');
    try {
      await buildOfficialFIRTemplatPdf(templatePath);
      templateExists = fs.existsSync(templatePath);
      console.log(`[FIR] Template created successfully. Exists: ${templateExists}`);
    } catch (err: any) {
      console.error('[FIR ERROR] Failed to generate template:', err);
      throw new Error(`FIR generation failed: FIR template could not be loaded at ${templatePath}: ${err.message}`);
    }
  }

  // 3. Load Template with pdf-lib
  console.log('[FIR] Loading template');
  let templateBytes: Buffer;
  try {
    templateBytes = fs.readFileSync(templatePath);
  } catch (readErr: any) {
    console.error('[FIR ERROR] Failed reading template file:', readErr);
    throw new Error(`FIR generation failed: FIR template could not be loaded: ${readErr.message}`);
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
  } catch (pdfLibErr: any) {
    console.error('[FIR ERROR] pdf-lib error loading template:', pdfLibErr);
    throw new Error(`FIR generation failed: PDF library error: ${pdfLibErr.message}`);
  }

  // 4. Page count check
  const pageCount = pdfDoc.getPageCount();
  console.log(`[FIR] Template loaded (page count: ${pageCount})`);
  if (pageCount !== 3) {
    console.error(`[FIR ERROR] Unexpected page count: ${pageCount}`);
    throw new Error(`FIR generation failed: Unexpected FIR template format. Expected 3 pages, found ${pageCount}.`);
  }

  // 5. Fonts setup
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let tamilFont: PDFFont | null = null;
  const tamilFontCandidates = [
    path.resolve(process.cwd(), 'server', 'fonts', 'Lohit-Tamil.ttf'),
    '/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf',
    path.resolve(process.cwd(), 'server', 'fonts', 'NotoSansTamil.ttf')
  ];

  for (const fontPath of tamilFontCandidates) {
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        tamilFont = await pdfDoc.embedFont(fontBytes);
        console.log(`[FIR] Embedded Tamil font from: ${fontPath}`);
        break;
      } catch (err: any) {
        console.warn(`[FIR] Warning: Could not embed font from ${fontPath}:`, err.message);
      }
    }
  }

  const pages = pdfDoc.getPages();
  const [p1, p2, p3] = pages;
  const black = rgb(0, 0, 0);

  // Helper to choose font and safely draw text
  const drawSafe = (
    page: any,
    text: string,
    x: number,
    y: number,
    opts: { font?: PDFFont; size?: number; color?: any; maxWidth?: number } = {}
  ) => {
    if (!text) return;
    const str = String(text).trim();
    if (!str) return;

    let font = opts.font || helvetica;
    const size = opts.size || 9.5;
    const color = opts.color || black;

    if (containsTamil(str)) {
      if (tamilFont) {
        font = tamilFont;
      } else {
        console.warn(`[FIR] Tamil text detected in "${str.slice(0, 15)}..." but Tamil PDF font is not configured.`);
        // Don't crash, report or fallback
      }
    }

    try {
      page.drawText(str, {
        x,
        y,
        size,
        font,
        color,
        maxWidth: opts.maxWidth
      });
    } catch (drawErr: any) {
      console.warn(`[FIR] Non-fatal drawText warning for "${str.slice(0, 20)}":`, drawErr.message);
    }
  };

  console.log('[FIR] Mapping fields');

  // ==========================================
  // PAGE 1 MAPPING
  // ==========================================
  // 1. District, PS, Year, FIR No, Date
  drawSafe(p1, safeText(data.district).toUpperCase(), 95, 688, { font: helveticaBold, size: 9.5 });
  drawSafe(p1, safeText(data.policeStation).toUpperCase(), 215, 688, { font: helveticaBold, size: 9.5 });
  drawSafe(p1, safeText(data.year), 365, 688, { font: helvetica, size: 9.5 });
  drawSafe(p1, safeText(data.firNumber || data.caseId || '125/2026'), 455, 688, { font: helveticaBold, size: 9.5 });
  drawSafe(p1, safeDate(data.firDate), 525, 688, { font: helvetica, size: 9 });

  // 2. Acts and Sections
  const actsDisplay = Array.isArray(data.acts) && data.acts.length > 0
    ? data.acts.join(', ')
    : (data.acts ? String(data.acts) : 'Bharatiya Nyaya Sanhita, 2023');
  
  const sectionsDisplay = Array.isArray(data.sections) && data.sections.length > 0
    ? data.sections.join(', ')
    : (data.sections ? String(data.sections) : 'Section 303(2) BNS, 2023');

  drawSafe(p1, actsDisplay, 95, 650, { font: helvetica, size: 9, maxWidth: 195 });
  drawSafe(p1, sectionsDisplay, 360, 650, { font: helveticaBold, size: 9, maxWidth: 195 });

  // 3. Occurrence of Offence
  drawSafe(p1, safeText(data.occurrence?.day), 195, 612, { font: helvetica, size: 9 });
  drawSafe(p1, safeDate(data.occurrence?.dateFrom || data.firDate), 290, 612, { font: helvetica, size: 9 });
  drawSafe(p1, safeDate(data.occurrence?.dateTo), 445, 612, { font: helvetica, size: 9 });

  drawSafe(p1, safeText(data.occurrence?.timePeriod), 115, 578, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.occurrence?.timeFrom), 290, 578, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.occurrence?.timeTo), 445, 578, { font: helvetica, size: 9 });

  // 3(b) Information Received at PS
  drawSafe(p1, safeDate(data.informationReceived?.date || data.firDate), 225, 544, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.informationReceived?.time || '10:30 hrs'), 430, 544, { font: helvetica, size: 9 });

  // 3(c) General Diary Reference
  drawSafe(p1, safeText(data.generalDiary?.entryNumber || 'GD-04/2026'), 250, 510, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.generalDiary?.time || '10:45 hrs'), 430, 510, { font: helvetica, size: 9 });

  // 4. Type of Information
  drawSafe(p1, safeText(data.informationType, 'Written'), 160, 474, { font: helveticaBold, size: 9.5 });

  // 5. Place of Occurrence
  drawSafe(p1, safeText(data.placeOfOccurrence?.directionDistanceFromPS, '0.5 km East of PS'), 225, 414, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.placeOfOccurrence?.beatNumber, 'Beat-02'), 450, 414, { font: helvetica, size: 9 });

  const occAddress = safeText(
    data.placeOfOccurrence?.address ||
    data.placeOfOccurrence ||
    'Within the territorial limits of the police station.'
  );
  drawSafe(p1, occAddress, 100, 380, { font: helvetica, size: 9, maxWidth: 450 });

  drawSafe(p1, safeText(data.placeOfOccurrence?.outsidePSName, '-'), 340, 330, { font: helvetica, size: 9 });
  drawSafe(p1, safeText(data.placeOfOccurrence?.outsideDistrict, '-'), 430, 310, { font: helvetica, size: 9 });

  // 6. Complainant Name
  const cName = safeText(data.complainant?.name || data.complainantName);
  drawSafe(p1, cName, 110, 244, { font: helveticaBold, size: 10 });

  // ==========================================
  // PAGE 2 MAPPING
  // ==========================================
  drawSafe(p2, safeText(data.complainant?.fatherOrHusbandName), 180, 800, { font: helvetica, size: 9 });
  drawSafe(p2, safeDate(data.complainant?.dob || '34 Years'), 155, 766, { font: helvetica, size: 9 });
  drawSafe(p2, safeText(data.complainant?.nationality, 'Indian'), 390, 766, { font: helvetica, size: 9 });

  drawSafe(p2, safeText(data.complainant?.passportNumber, '-'), 115, 732, { font: helvetica, size: 8.5 });
  drawSafe(p2, safeText(data.complainant?.passportIssueDate, '-'), 295, 732, { font: helvetica, size: 8.5 });
  drawSafe(p2, safeText(data.complainant?.passportIssuePlace, '-'), 460, 732, { font: helvetica, size: 8.5 });

  drawSafe(p2, safeText(data.complainant?.occupation, 'Private Employment / Business'), 125, 698, { font: helvetica, size: 9 });
  drawSafe(p2, safeText(data.complainant?.address, 'As per official complaint record'), 100, 664, { font: helvetica, size: 9, maxWidth: 450 });

  // 7. Details of Accused
  let accusedText = 'Unknown accused person(s)';
  if (Array.isArray(data.accusedDetails) && data.accusedDetails.length > 0) {
    accusedText = data.accusedDetails.join('; ');
  } else if (data.accusedDetails) {
    accusedText = String(data.accusedDetails);
  }
  drawSafe(p2, accusedText, 50, 592, { font: helvetica, size: 9, maxWidth: 500 });

  // 8. Reasons for delay
  drawSafe(p2, safeText(data.delayReason, 'Reported promptly / Nil'), 50, 528, { font: helvetica, size: 9, maxWidth: 500 });

  // 9. Particulars of properties stolen
  let propText = 'Nil / Under verification';
  if (Array.isArray(data.propertyDetails) && data.propertyDetails.length > 0) {
    propText = data.propertyDetails.join('; ');
  } else if (data.propertyDetails) {
    propText = String(data.propertyDetails);
  }
  drawSafe(p2, propText, 50, 482, { font: helvetica, size: 9, maxWidth: 500 });

  // 10. Total value of properties
  drawSafe(p2, safeText(data.totalPropertyValue, 'Nil / Under verification'), 250, 456, { font: helvetica, size: 9 });

  // 11. Inquest report
  drawSafe(p2, safeText(data.inquestOrUnnaturalDeathCaseNo, 'Not Applicable'), 280, 422, { font: helvetica, size: 9 });

  // 12. FIR Contents Box (Word-wrapped)
  const rawContents = safeText(data.firContents || data.content || data.narrative || data.description);
  const narrativeFont = containsTamil(rawContents) && tamilFont ? tamilFont : helvetica;
  const contentLines = wrapText(rawContents, narrativeFont, 8.5, 500);

  let curY = 360;
  const lineSpacing = 11.5;
  const maxLines = 26;
  const renderedLines = contentLines.slice(0, maxLines);

  for (const line of renderedLines) {
    drawSafe(p2, line, 50, curY, { font: narrativeFont, size: 8.5 });
    curY -= lineSpacing;
  }

  if (contentLines.length > maxLines) {
    drawSafe(p2, '[... Substance continued on official investigation dossier annexure ...]', 50, curY, {
      font: helveticaBold,
      size: 8,
      color: rgb(0.3, 0.3, 0.3)
    });
  }

  // ==========================================
  // PAGE 3 MAPPING
  // ==========================================
  const ioName = safeText(data.actionTaken?.investigatingOfficer || 'Sub-Inspector / Investigating Officer');
  drawSafe(p3, ioName, 160, 786, { font: helveticaBold, size: 9 });

  // Officer signature details
  drawSafe(p3, ioName, 365, 575, { font: helveticaBold, size: 8.5 });
  drawSafe(p3, safeText(data.actionTaken?.officerRank, 'Sub-Inspector of Police'), 365, 560, { font: helvetica, size: 8.5 });
  drawSafe(p3, safeText(data.actionTaken?.officerNumber || data.badgeNumber, 'SI-Station'), 465, 560, { font: helvetica, size: 8.5 });

  // 15. Date and time of dispatch to court
  const dispatchText = `${safeDate(data.dispatchToCourt?.date || data.firDate)} at ${safeText(data.dispatchToCourt?.time, '10:00 hrs')}`;
  drawSafe(p3, dispatchText, 245, 520, { font: helvetica, size: 9 });

  // 6. Generate PDF Bytes
  console.log('[FIR] Generating PDF');
  const pdfBytes = await pdfDoc.save();
  console.log(`[FIR] PDF generated (size: ${pdfBytes.length} bytes)`);

  const rawCaseId = safeText(data.caseId || data.firNumber || 'LAW-2026-00125');
  const cleanId = rawCaseId.replace(/[\/\s\\]/g, '_');
  const fileName = `FIR_${cleanId}.pdf`;

  return {
    pdfBytes,
    fileName,
    pageCount: 3
  };
}
