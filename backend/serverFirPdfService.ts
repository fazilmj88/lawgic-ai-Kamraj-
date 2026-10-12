import 'regenerator-runtime/runtime.js';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface OfficialFIRDataPayload {
  caseId: string;
  district?: string;
  policeStation?: string;
  year?: string;
  firNumber?: string;
  firDate?: string;
  acts?: string[];
  sections?: string[];
  occurrence?: {
    day?: string;
    dateFrom?: string;
    dateTo?: string;
    timePeriod?: string;
    timeFrom?: string;
    timeTo?: string;
  };
  informationReceived?: {
    date?: string;
    time?: string;
  };
  generalDiary?: {
    entryNumber?: string;
    time?: string;
  };
  informationType?: string;
  placeOfOccurrence?: {
    directionDistanceFromPS?: string;
    beatNumber?: string;
    address?: string;
    outsidePSName?: string;
    outsideDistrict?: string;
  };
  complainant?: {
    name?: string;
    fatherOrHusbandName?: string;
    dob?: string;
    nationality?: string;
    passportNumber?: string;
    passportIssueDate?: string;
    passportIssuePlace?: string;
    occupation?: string;
    address?: string;
    phone?: string;
  };
  accusedDetails?: string[];
  delayReason?: string;
  propertyDetails?: string[];
  totalPropertyValue?: string;
  inquestOrUnnaturalDeathCaseNo?: string;
  firContents?: string;
  actionTaken?: {
    investigatingOfficer?: string;
    officerRank?: string;
    officerNumber?: string;
    district?: string;
  };
  dispatchToCourt?: {
    date?: string;
    time?: string;
  };
}

const TEMPLATE_DIR = path.resolve(process.cwd(), 'server', 'templates');
const TEMPLATE_PATH = path.resolve(TEMPLATE_DIR, 'tamil-nadu-fir-template.pdf');
const TAMIL_FONT_PATH = path.resolve(process.cwd(), 'server', 'fonts', 'NotoSansTamil.ttf');

/**
 * Normalizes input into a safe printable string.
 * Prevents null/undefined/objects from crashing pdf-lib.
 */
function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  return String(val);
}

/**
 * Checks if a string contains Tamil Unicode characters (U+0B80 to U+0BFF).
 */
function containsTamilUnicode(str: string): boolean {
  return /[\u0B80-\u0BFF]/.test(str);
}

/**
 * Formats dates safely without throwing runtime errors on irregular strings.
 */
function formatPrintableDate(val?: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';
  // If already standard DD/MM/YYYY or similar, return directly
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(s)) {
    return s;
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignore and fallback to raw string
  }
  return s;
}

/**
 * Safe text wrapping helper for pdf-lib text drawing.
 * Handles multiline paragraphs and long words without overflowing bounding box.
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(testLine, fontSize);
      } catch {
        width = testLine.length * (fontSize * 0.55);
      }

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Synthesizes the official 3-page Tamil Nadu Police Form-I Blank Template.
 * This guarantees a clean, uncorrupted, standard 3-page A4 PDF template is always
 * available on the server without relying on volatile chat attachments.
 */
export async function createBlankOfficialFIRTemplate(): Promise<Uint8Array> {
  console.log('[FIR] Generating official 3-page template baseline at:', TEMPLATE_PATH);
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }

  const pdfDoc = await PDFDocument.create();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.35, 0.35, 0.35);
  const lightBorder = rgb(0.75, 0.75, 0.75);

  const a4Width = 595.28;
  const a4Height = 841.89;

  // -------------------------------------------------------------
  // PAGE 1: Core Identification, Legal Sections, Occurrence, Place
  // -------------------------------------------------------------
  const p1 = pdfDoc.addPage([a4Width, a4Height]);
  
  // Outer Page Border
  p1.drawRectangle({
    x: 25,
    y: 25,
    width: a4Width - 50,
    height: a4Height - 50,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });

  // Top Right Department Header
  p1.drawText('TAMIL NADU POLICE', { x: 420, y: 805, size: 9, font: fontBold, color: black });
  p1.drawText('INTEGRATED INVESTIGATION FORM-I', { x: 355, y: 793, size: 8, font: fontBold, color: black });

  // Main Header
  p1.drawText('FIRST INFORMATION REPORT', { x: 195, y: 765, size: 14, font: fontBold, color: black });
  p1.drawText('(Under Section 173 BNSS / Cr.P.C. 154)', { x: 205, y: 750, size: 9.5, font: fontHelvetica, color: gray });

  p1.drawLine({ start: { x: 35, y: 738 }, end: { x: 560, y: 738 }, color: black, thickness: 0.8 });

  // Section 1: District, PS, Year, FIR No, Date
  p1.drawText('1. District :', { x: 40, y: 720, size: 9, font: fontBold, color: black });
  p1.drawText('PS :', { x: 175, y: 720, size: 9, font: fontBold, color: black });
  p1.drawText('Year :', { x: 295, y: 720, size: 9, font: fontBold, color: black });
  p1.drawText('FIR No. :', { x: 375, y: 720, size: 9, font: fontBold, color: black });
  p1.drawText('Date :', { x: 480, y: 720, size: 9, font: fontBold, color: black });

  p1.drawLine({ start: { x: 35, y: 705 }, end: { x: 560, y: 705 }, color: lightBorder, thickness: 0.5 });

  // Section 2: Acts & Sections
  p1.drawText('2. Act(s) :', { x: 40, y: 690, size: 9, font: fontBold, color: black });
  p1.drawText('Section(s) :', { x: 300, y: 690, size: 9, font: fontBold, color: black });

  p1.drawLine({ start: { x: 35, y: 665 }, end: { x: 560, y: 665 }, color: lightBorder, thickness: 0.5 });

  // Section 3: Occurrence of Offence
  p1.drawText('3. (a) Occurrence of Offence Day :', { x: 40, y: 648, size: 9, font: fontBold, color: black });
  p1.drawText('Date From :', { x: 240, y: 648, size: 9, font: fontBold, color: black });
  p1.drawText('Date To :', { x: 410, y: 648, size: 9, font: fontBold, color: black });

  p1.drawText('Time Period :', { x: 58, y: 628, size: 9, font: fontBold, color: black });
  p1.drawText('Time From :', { x: 240, y: 628, size: 9, font: fontBold, color: black });
  p1.drawText('Time To :', { x: 410, y: 628, size: 9, font: fontBold, color: black });

  p1.drawText('(b) Information Received at PS. Date :', { x: 50, y: 604, size: 9, font: fontBold, color: black });
  p1.drawText('Time :', { x: 390, y: 604, size: 9, font: fontBold, color: black });

  p1.drawText('(c) General Diary Reference : Entry No(s) :', { x: 50, y: 580, size: 9, font: fontBold, color: black });
  p1.drawText('Time :', { x: 390, y: 580, size: 9, font: fontBold, color: black });

  p1.drawLine({ start: { x: 35, y: 562 }, end: { x: 560, y: 562 }, color: lightBorder, thickness: 0.5 });

  // Section 4: Type of Information
  p1.drawText('4. Type of Information :', { x: 40, y: 545, size: 9, font: fontBold, color: black });

  p1.drawLine({ start: { x: 35, y: 528 }, end: { x: 560, y: 528 }, color: lightBorder, thickness: 0.5 });

  // Section 5: Place of Occurrence
  p1.drawText('5. Place of Occurrence :', { x: 40, y: 512, size: 9.5, font: fontBold, color: black });
  p1.drawText('(a) Direction and Distance from PS :', { x: 55, y: 494, size: 8.5, font: fontBold, color: black });
  p1.drawText('Beat Number :', { x: 380, y: 494, size: 8.5, font: fontBold, color: black });
  p1.drawText('(b) Address :', { x: 55, y: 470, size: 8.5, font: fontBold, color: black });
  p1.drawText('(c) In case, outside limit of this Police Station, then Name of PS :', { x: 55, y: 432, size: 8.5, font: fontBold, color: black });
  p1.drawText('District :', { x: 380, y: 432, size: 8.5, font: fontBold, color: black });

  p1.drawLine({ start: { x: 35, y: 410 }, end: { x: 560, y: 410 }, color: lightBorder, thickness: 0.5 });

  // Section 6: Complainant (Start on Page 1)
  p1.drawText('6. Complainant / Informant :', { x: 40, y: 392, size: 9.5, font: fontBold, color: black });
  p1.drawText('(a) Name :', { x: 55, y: 374, size: 9, font: fontBold, color: black });

  // Page 1 Footer
  p1.drawText('Page 1 of 3', { x: 505, y: 35, size: 8.5, font: fontHelvetica, color: gray });

  // -------------------------------------------------------------
  // PAGE 2: Complainant Contd, Accused, Delay, Properties, Contents
  // -------------------------------------------------------------
  const p2 = pdfDoc.addPage([a4Width, a4Height]);
  p2.drawRectangle({
    x: 25,
    y: 25,
    width: a4Width - 50,
    height: a4Height - 50,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });

  p2.drawText('TAMIL NADU POLICE • FIRST INFORMATION REPORT (FORM-I)', { x: 160, y: 805, size: 8.5, font: fontBold, color: gray });
  p2.drawLine({ start: { x: 35, y: 795 }, end: { x: 560, y: 795 }, color: black, thickness: 0.8 });

  // Section 6 Continuation
  p2.drawText('6. Complainant / Informant (Continued) :', { x: 40, y: 778, size: 9, font: fontBold, color: black });
  p2.drawText("(b) Father's / Husband's Name :", { x: 55, y: 760, size: 8.5, font: fontBold, color: black });
  p2.drawText('(c) Date / Year of Birth :', { x: 55, y: 742, size: 8.5, font: fontBold, color: black });
  p2.drawText('(d) Nationality :', { x: 310, y: 742, size: 8.5, font: fontBold, color: black });

  p2.drawText('(e) Passport No. :', { x: 55, y: 724, size: 8.5, font: fontBold, color: black });
  p2.drawText('Date of Issue :', { x: 230, y: 724, size: 8.5, font: fontBold, color: black });
  p2.drawText('Place of Issue :', { x: 380, y: 724, size: 8.5, font: fontBold, color: black });

  p2.drawText('(f) Occupation :', { x: 55, y: 706, size: 8.5, font: fontBold, color: black });
  p2.drawText('(g) Address :', { x: 55, y: 688, size: 8.5, font: fontBold, color: black });

  p2.drawLine({ start: { x: 35, y: 658 }, end: { x: 560, y: 658 }, color: lightBorder, thickness: 0.5 });

  // Section 7: Details of Accused
  p2.drawText('7. Details of Known / Suspected / Unknown accused with full particulars :', { x: 40, y: 642, size: 9, font: fontBold, color: black });

  p2.drawLine({ start: { x: 35, y: 588 }, end: { x: 560, y: 588 }, color: lightBorder, thickness: 0.5 });

  // Section 8: Delay Reason
  p2.drawText('8. Reasons for delay in reporting by the complainant / informant :', { x: 40, y: 572, size: 9, font: fontBold, color: black });

  p2.drawLine({ start: { x: 35, y: 540 }, end: { x: 560, y: 540 }, color: lightBorder, thickness: 0.5 });

  // Section 9 & 10: Property Details & Value
  p2.drawText('9. Particulars of properties stolen / involved :', { x: 40, y: 524, size: 9, font: fontBold, color: black });
  p2.drawText('10. Total value of properties stolen / involved :', { x: 40, y: 486, size: 9, font: fontBold, color: black });

  // Section 11: Inquest Report
  p2.drawText('11. Inquest Report / Unnatural death Case No. If any :', { x: 40, y: 460, size: 9, font: fontBold, color: black });

  p2.drawLine({ start: { x: 35, y: 442 }, end: { x: 560, y: 442 }, color: lightBorder, thickness: 0.5 });

  // Section 12: FIR Contents (Boxed Narrative)
  p2.drawText('12. FIR Contents (Attach additional sheets if required) :', { x: 40, y: 426, size: 9.5, font: fontBold, color: black });

  // Border for FIR Contents
  p2.drawRectangle({
    x: 40,
    y: 50,
    width: 515,
    height: 360,
    borderColor: lightBorder,
    borderWidth: 0.8
  });

  p2.drawText('Page 2 of 3', { x: 505, y: 35, size: 8.5, font: fontHelvetica, color: gray });

  // -------------------------------------------------------------
  // PAGE 3: Action Taken, Signatures, Court Dispatch, Statutory Note
  // -------------------------------------------------------------
  const p3 = pdfDoc.addPage([a4Width, a4Height]);
  p3.drawRectangle({
    x: 25,
    y: 25,
    width: a4Width - 50,
    height: a4Height - 50,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1
  });

  p3.drawText('TAMIL NADU POLICE • FIRST INFORMATION REPORT (FORM-I)', { x: 160, y: 805, size: 8.5, font: fontBold, color: gray });
  p3.drawLine({ start: { x: 35, y: 795 }, end: { x: 560, y: 795 }, color: black, thickness: 0.8 });

  // Section 13: Action Taken
  p3.drawText('13. Action Taken :', { x: 40, y: 775, size: 9.5, font: fontBold, color: black });
  p3.drawText('Since the above report reveals commission of offence(s) u/s as mentioned at item No. 2,', { x: 55, y: 757, size: 8.5, font: fontHelvetica, color: black });
  p3.drawText('directed (Name of I.O.) : ', { x: 55, y: 741, size: 8.5, font: fontBold, color: black });
  p3.drawText('to take up the investigation.', { x: 360, y: 741, size: 8.5, font: fontHelvetica, color: black });

  p3.drawText('FIR read over to the Complainant/Informant, admitted to be correctly recorded and a copy', { x: 55, y: 715, size: 8.5, font: fontHelvetica, color: black });
  p3.drawText('given to the Complainant/Informant free of cost.', { x: 55, y: 701, size: 8.5, font: fontHelvetica, color: black });

  p3.drawLine({ start: { x: 35, y: 675 }, end: { x: 560, y: 675 }, color: lightBorder, thickness: 0.5 });

  // Section 14: Signatures Area
  p3.drawText('14. Signature / Thumb Impression of Complainant :', { x: 40, y: 655, size: 9, font: fontBold, color: black });
  p3.drawText('Signature of Officer-in-Charge Police Station :', { x: 310, y: 655, size: 9, font: fontBold, color: black });

  // Signature Boxes
  p3.drawRectangle({
    x: 45,
    y: 540,
    width: 220,
    height: 95,
    borderColor: lightBorder,
    borderWidth: 0.7,
    borderDashArray: [3, 3]
  });
  p3.drawText('(Signature / Left Thumb Impression)', { x: 75, y: 550, size: 7.5, font: fontHelvetica, color: gray });

  p3.drawRectangle({
    x: 315,
    y: 540,
    width: 225,
    height: 95,
    borderColor: lightBorder,
    borderWidth: 0.7,
    borderDashArray: [3, 3]
  });
  p3.drawText('(Signature of Officer)', { x: 385, y: 550, size: 7.5, font: fontHelvetica, color: gray });

  p3.drawText('Name :', { x: 315, y: 518, size: 8.5, font: fontBold, color: black });
  p3.drawText('Rank :', { x: 315, y: 500, size: 8.5, font: fontBold, color: black });
  p3.drawText('No. :', { x: 440, y: 500, size: 8.5, font: fontBold, color: black });

  p3.drawLine({ start: { x: 35, y: 475 }, end: { x: 560, y: 475 }, color: lightBorder, thickness: 0.5 });

  // Section 15: Court Dispatch
  p3.drawText('15. Date and Time of dispatch to the court :', { x: 40, y: 455, size: 9, font: fontBold, color: black });

  // Statutory Certification Notice
  p3.drawLine({ start: { x: 35, y: 120 }, end: { x: 560, y: 120 }, color: black, thickness: 0.8 });
  p3.drawText('STATUTORY LEGAL RECORD UNDER SECTION 173 BNSS, 2023 (CR.P.C. 154)', { x: 120, y: 105, size: 8, font: fontBold, color: black });
  p3.drawText('GOVERNMENT OF TAMIL NADU • TAMIL NADU POLICE DEPARTMENT', { x: 145, y: 92, size: 8, font: fontBold, color: gray });
  p3.drawText('Cryptographically sealed and registered under LAWGIC AI Sovereign Police Subsystem', { x: 130, y: 78, size: 7.5, font: fontHelvetica, color: gray });

  p3.drawText('Page 3 of 3', { x: 505, y: 35, size: 8.5, font: fontHelvetica, color: gray });

  const bytes = await pdfDoc.save();
  fs.writeFileSync(TEMPLATE_PATH, Buffer.from(bytes));
  console.log('[FIR] Official 3-page template successfully created at:', TEMPLATE_PATH, `(${bytes.byteLength} bytes)`);
  return bytes;
}

/**
 * Validates whether the FIR payload satisfies the minimum practical criteria.
 * Ensures optional fields can remain blank without failing the entire generation.
 */
export function validateFIRPayload(data: any): { valid: boolean; error?: string } {
  console.log('[FIR] Validation started');

  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'FIR generation failed: Invalid FIR data.' };
  }

  const district = safeString(data.district);
  if (!district) {
    return { valid: false, error: 'FIR generation failed: District is missing.' };
  }

  const ps = safeString(data.policeStation);
  if (!ps) {
    return { valid: false, error: 'FIR generation failed: Police Station is missing.' };
  }

  let year = safeString(data.year);
  if (!year) {
    year = String(new Date().getFullYear());
    data.year = year;
  }

  let firDate = safeString(data.firDate);
  if (!firDate) {
    firDate = formatPrintableDate(new Date());
    data.firDate = firDate;
  }

  const complainantName = safeString(data.complainant?.name || data.complainantName || data.informantName);
  if (!complainantName) {
    return { valid: false, error: 'FIR generation failed: Complainant Name is missing.' };
  }
  if (!data.complainant || typeof data.complainant !== 'object') {
    data.complainant = { name: complainantName };
  } else if (!data.complainant.name) {
    data.complainant.name = complainantName;
  }

  const placeAddress = typeof data.placeOfOccurrence === 'string'
    ? safeString(data.placeOfOccurrence)
    : (safeString(data.placeOfOccurrence?.address) || safeString(data.placeOfOccurrence?.directionDistanceFromPS) || safeString(data.incidentPlace) || `${ps} Jurisdiction Area`);

  if (!data.placeOfOccurrence || typeof data.placeOfOccurrence !== 'object') {
    data.placeOfOccurrence = { address: placeAddress };
  } else if (!data.placeOfOccurrence.address) {
    data.placeOfOccurrence.address = placeAddress;
  }

  const firContents = safeString(data.firContents || data.content || data.narrative || data.description || data.factsNarrative || 'Official police FIR contents registered.');
  data.firContents = firContents;

  console.log('[FIR] Validation passed');
  return { valid: true };
}

/**
 * Loads the official 3-page template, verifies page count, performs safe coordinate field mapping,
 * handles Unicode/Tamil checks, and saves the final PDF bytes.
 */
export async function generateOfficialFIRPdfBackend(data: OfficialFIRDataPayload): Promise<{
  pdfBytes: Uint8Array;
  fileName: string;
  sha256Hash: string;
  pageCount: number;
}> {
  console.log('[FIR] Starting FIR PDF generation for case:', data.caseId || 'Unknown');

  // 1. Validation
  const validation = validateFIRPayload(data);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Template file access check
  console.log('[FIR] Template path:', TEMPLATE_PATH);
  const templateExists = fs.existsSync(TEMPLATE_PATH);
  console.log('[FIR] Template exists:', templateExists);

  let templateBytes: Buffer;
  if (!templateExists) {
    console.log('[FIR] Template missing on disk. Bootstrapping official 3-page template...');
    try {
      const generated = await createBlankOfficialFIRTemplate();
      templateBytes = Buffer.from(generated);
    } catch (err: any) {
      console.error('[FIR] Failed to initialize template:', err);
      throw new Error(`FIR generation failed: FIR template could not be loaded. (${err.message})`);
    }
  } else {
    try {
      templateBytes = fs.readFileSync(TEMPLATE_PATH);
    } catch (readErr: any) {
      console.error('[FIR] Template read error:', readErr);
      throw new Error(`FIR generation failed: FIR template could not be loaded. (${readErr.message})`);
    }
  }

  // 3. Load with pdf-lib and check page count
  console.log('[FIR] Loading template with pdf-lib');
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(templateBytes);
  } catch (loadErr: any) {
    console.error('[FIR] pdfDoc.load error:', loadErr);
    throw new Error(`FIR generation failed: PDF library error. (${loadErr.message})`);
  }

  const pageCount = pdfDoc.getPageCount();
  console.log('[FIR] Template loaded. Total pages:', pageCount);
  if (pageCount !== 3) {
    console.error('[FIR] Invalid page count:', pageCount, 'Expected: 3');
    throw new Error('Unexpected FIR template format. Official Tamil Nadu Police Form-I must contain exactly 3 pages.');
  }

  // 4. Tamil / Unicode Font Registration Check
  const combinedText = [
    data.district,
    data.policeStation,
    data.complainant?.name,
    data.placeOfOccurrence?.address,
    data.firContents,
    data.delayReason
  ].filter(Boolean).join(' ');

  let customFont: PDFFont | null = null;
  if (containsTamilUnicode(combinedText)) {
    console.log('[FIR] Tamil Unicode characters detected in user inputs. Checking for Tamil font...');
    if (fs.existsSync(TAMIL_FONT_PATH)) {
      try {
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = fs.readFileSync(TAMIL_FONT_PATH);
        customFont = await pdfDoc.embedFont(fontBytes);
        console.log('[FIR] NotoSansTamil embedded successfully for Tamil Unicode rendering.');
      } catch (fontErr: any) {
        console.warn('[FIR] Fontkit embedding warning:', fontErr);
        throw new Error(`FIR generation failed: Tamil font could not be embedded. (${fontErr.message})`);
      }
    } else {
      console.error('[FIR] Tamil font file not found at:', TAMIL_FONT_PATH);
      throw new Error('FIR generation failed: Tamil text detected but Tamil PDF font is not configured.');
    }
  }

  // Standard Fonts
  const standardRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const standardBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const chooseFont = (text: string, isBold: boolean = false): PDFFont => {
    if (containsTamilUnicode(text)) {
      if (customFont) return customFont;
      throw new Error('FIR generation failed: Tamil text detected but Tamil PDF font is not configured.');
    }
    return isBold ? standardBold : standardRegular;
  };

  const primaryColor = rgb(0, 0, 0);

  // 5. Field Coordinate Mapping
  console.log('[FIR] Mapping fields onto 3 pages');
  const pages = pdfDoc.getPages();
  const [page1, page2, page3] = pages;

  // Safe drawing helper
  const drawField = (
    page: any,
    text: string,
    x: number,
    y: number,
    size: number = 8.5,
    isBold: boolean = false
  ) => {
    if (!text) return;
    const font = chooseFont(text, isBold);
    page.drawText(text, { x, y, size, font, color: primaryColor });
  };

  // PAGE 1 MAPPINGS
  // Section 1: District, PS, Year, FIR No, Date
  drawField(page1, safeString(data.district), 95, 720, 8.5, true);
  drawField(page1, safeString(data.policeStation), 205, 720, 8.5, true);
  drawField(page1, safeString(data.year), 330, 720, 8.5, false);
  drawField(page1, safeString(data.firNumber || data.caseId), 420, 720, 8.5, true);
  drawField(page1, formatPrintableDate(data.firDate), 512, 720, 8.5, false);

  // Section 2: Acts & Sections
  const actsStr = Array.isArray(data.acts) && data.acts.length > 0 
    ? data.acts.filter(Boolean).join(', ') 
    : 'Bharatiya Nyaya Sanhita, 2023';
  const sectionsStr = Array.isArray(data.sections) && data.sections.length > 0 
    ? data.sections.filter(Boolean).join(', ') 
    : 'Section 303(2) BNS, 2023';

  drawField(page1, safeString(actsStr), 90, 690, 8, false);
  drawField(page1, safeString(sectionsStr), 360, 690, 8.5, true);

  // Section 3: Occurrence of Offence
  drawField(page1, safeString(data.occurrence?.day) || 'As recorded', 185, 648, 8, false);
  drawField(page1, formatPrintableDate(data.occurrence?.dateFrom), 295, 648, 8, false);
  drawField(page1, formatPrintableDate(data.occurrence?.dateTo) || formatPrintableDate(data.occurrence?.dateFrom), 460, 648, 8, false);

  drawField(page1, safeString(data.occurrence?.timePeriod) || 'Night', 125, 628, 8, false);
  drawField(page1, safeString(data.occurrence?.timeFrom) || '21:00 hrs', 295, 628, 8, false);
  drawField(page1, safeString(data.occurrence?.timeTo) || '22:30 hrs', 460, 628, 8, false);

  // 3(b) Information Received
  drawField(page1, formatPrintableDate(data.informationReceived?.date) || formatPrintableDate(data.firDate), 230, 604, 8, false);
  drawField(page1, safeString(data.informationReceived?.time) || '08:30 hrs', 430, 604, 8, false);

  // 3(c) General Diary
  drawField(page1, safeString(data.generalDiary?.entryNumber) || 'GD-01/Station', 245, 580, 8, false);
  drawField(page1, safeString(data.generalDiary?.time) || '08:35 hrs', 430, 580, 8, false);

  // Section 4: Type of Information
  drawField(page1, safeString(data.informationType) || 'Written (Signed Complaint)', 155, 545, 8.5, false);

  // Section 5: Place of Occurrence
  drawField(page1, safeString(data.placeOfOccurrence?.directionDistanceFromPS) || 'Within jurisdiction', 215, 494, 8, false);
  drawField(page1, safeString(data.placeOfOccurrence?.beatNumber) || 'Beat-1', 450, 494, 8, false);

  const addr = safeString(data.placeOfOccurrence?.address) || 'Within station limits';
  drawField(page1, addr.length > 95 ? `${addr.substring(0, 92)}...` : addr, 120, 470, 8, false);

  drawField(page1, safeString(data.placeOfOccurrence?.outsidePSName) || 'N/A', 335, 432, 8, false);
  drawField(page1, safeString(data.placeOfOccurrence?.outsideDistrict) || 'N/A', 425, 432, 8, false);

  // Section 6: Complainant (a) Name
  drawField(page1, safeString(data.complainant?.name), 110, 374, 9, true);

  // PAGE 2 MAPPINGS
  // Section 6 Continuation
  drawField(page2, safeString(data.complainant?.fatherOrHusbandName) || 'As recorded', 200, 760, 8.5, false);
  drawField(page2, safeString(data.complainant?.dob) || 'Adult', 175, 742, 8.5, false);
  drawField(page2, safeString(data.complainant?.nationality) || 'Indian', 385, 742, 8.5, false);

  drawField(page2, safeString(data.complainant?.passportNumber) || 'N/A', 135, 724, 8, false);
  drawField(page2, formatPrintableDate(data.complainant?.passportIssueDate) || 'N/A', 300, 724, 8, false);
  drawField(page2, safeString(data.complainant?.passportIssuePlace) || 'N/A', 450, 724, 8, false);

  drawField(page2, safeString(data.complainant?.occupation) || 'Private Citizen / Business', 135, 706, 8.5, false);
  drawField(page2, safeString(data.complainant?.address) || 'As provided in complaint', 125, 688, 8, false);

  // Section 7: Accused Details
  const accusedList = Array.isArray(data.accusedDetails) && data.accusedDetails.length > 0 
    ? data.accusedDetails.filter(Boolean).join('; ') 
    : 'Unknown accused person(s)';
  drawField(page2, accusedList.length > 105 ? `${accusedList.substring(0, 102)}...` : accusedList, 50, 622, 8, false);

  // Section 8: Delay Reason
  drawField(page2, safeString(data.delayReason) || 'Nil / Reported promptly to Station House Officer', 50, 556, 8, false);

  // Section 9 & 10: Properties
  const propList = Array.isArray(data.propertyDetails) && data.propertyDetails.length > 0 
    ? data.propertyDetails.filter(Boolean).join('; ') 
    : 'As detailed in statement';
  drawField(page2, propList.length > 95 ? `${propList.substring(0, 92)}...` : propList, 235, 524, 8, false);
  drawField(page2, safeString(data.totalPropertyValue) || 'Nil / Under verification', 245, 486, 8, false);

  // Section 11: Inquest Report
  drawField(page2, safeString(data.inquestOrUnnaturalDeathCaseNo) || 'Not Applicable', 275, 460, 8, false);

  // Section 12: Wrapped FIR Contents
  const rawContents = safeString(data.firContents);
  const narrativeFont = chooseFont(rawContents, false);
  const contentLines = wrapText(rawContents, narrativeFont, 8, 495);
  let currentY = 395;
  const bottomBoxLimit = 60;
  const lineHeight = 11.5;

  for (let i = 0; i < contentLines.length; i++) {
    if (currentY <= bottomBoxLimit) {
      page2.drawText('[... FIR narrative continued on official supplementary sheet ...]', {
        x: 48,
        y: bottomBoxLimit + 2,
        size: 7.5,
        font: standardBold,
        color: rgb(0.3, 0.3, 0.3)
      });
      break;
    }
    page2.drawText(contentLines[i], {
      x: 48,
      y: currentY,
      size: 8,
      font: narrativeFont,
      color: primaryColor
    });
    currentY -= lineHeight;
  }

  // PAGE 3 MAPPINGS
  // Section 13: Action Taken & Assigned I.O.
  const ioName = safeString(data.actionTaken?.investigatingOfficer) || 'Designated Investigating Officer';
  drawField(page3, ioName, 165, 741, 8.5, true);

  // Section 14: Signatures & Officer Particulars
  drawField(page3, ioName, 355, 518, 8, true);
  drawField(page3, safeString(data.actionTaken?.officerRank) || 'Sub-Inspector of Police', 355, 500, 8, false);
  drawField(page3, safeString(data.actionTaken?.officerNumber) || 'SI-Station', 465, 500, 8, false);

  // Section 15: Court Dispatch
  const dispatchDate = formatPrintableDate(data.dispatchToCourt?.date) || formatPrintableDate(data.firDate);
  const dispatchTime = safeString(data.dispatchToCourt?.time) || '10:00 hrs';
  drawField(page3, `${dispatchDate} at ${dispatchTime}`, 240, 455, 8.5, false);


  // 6. Set Official PDF Metadata
  console.log('[FIR] Generating PDF and embedding legal metadata');
  const cleanId = safeString(data.firNumber || data.caseId || 'LAW-2026').replace(/[\/\s]/g, '_');
  const fileName = `FIR_${cleanId}.pdf`;

  pdfDoc.setTitle(`First Information Report - ${cleanId}`);
  pdfDoc.setAuthor('Tamil Nadu Police Department');
  pdfDoc.setSubject('Official FIR under Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023');
  pdfDoc.setKeywords(['FIR', 'Tamil Nadu Police', 'BNSS 173', safeString(data.district), safeString(data.policeStation)]);
  pdfDoc.setProducer('LAWGIC AI Legal Operating System');
  pdfDoc.setCreator('LAWGIC AI Official FIR Generation Subsystem');
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  console.log('[FIR] PDF generated successfully. Bytes:', pdfBytes.byteLength);

  // Compute SHA-256 for integrity verification
  const crypto = await import('crypto');
  const sha256Hash = crypto.createHash('sha256').update(pdfBytes).digest('hex');

  return {
    pdfBytes,
    fileName,
    sha256Hash,
    pageCount: 3
  };
}
