import 'regenerator-runtime/runtime';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export async function buildOfficialFIRTemplatPdf(targetPath: string): Promise<string> {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Fonts
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Try embedding Tamil font
  let tamilFont = times;
  const tamilFontCandidates = [
    path.resolve(process.cwd(), 'server', 'fonts', 'Lohit-Tamil.ttf'),
    '/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf',
    path.resolve(process.cwd(), 'server', 'fonts', 'NotoSansTamil.ttf')
  ];

  for (const fontPath of tamilFontCandidates) {
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        tamilFont = await doc.embedFont(fontBytes);
        console.log(`[FIR Template Builder] Embedded Tamil font from: ${fontPath}`);
        break;
      } catch (err) {
        console.warn(`[FIR Template Builder] Could not embed ${fontPath}:`, err);
      }
    }
  }

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.8, 0.8, 0.8);
  const lineGray = rgb(0.4, 0.4, 0.4);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 555.28;
  const CONTENT_W = MARGIN_RIGHT - MARGIN_LEFT; // ~515.28

  // ==========================================
  // PAGE 1
  // ==========================================
  const page1 = doc.addPage([PAGE_W, PAGE_H]);

  // Top Right Header
  page1.drawText('TAMIL NADU POLICE', { x: 410, y: 815, size: 9, font: helveticaBold, color: black });
  page1.drawText('INTEGRATED INVESTIGATION FORM-I', { x: 360, y: 803, size: 8, font: helveticaBold, color: black });

  // Center Emblem Mock / Tower Symbol
  page1.drawCircle({ x: PAGE_W / 2, y: 780, size: 24, borderColor: black, borderWidth: 1.5 });
  page1.drawCircle({ x: PAGE_W / 2, y: 780, size: 21, borderColor: black, borderWidth: 0.75 });
  page1.drawText('TN POLICE', { x: PAGE_W / 2 - 20, y: 777, size: 7, font: helveticaBold, color: black });

  // Center Headings
  const firTitle = 'FIRST INFORMATION REPORT';
  const firTitleW = helveticaBold.widthOfTextAtSize(firTitle, 14);
  page1.drawText(firTitle, { x: (PAGE_W - firTitleW) / 2, y: 742, size: 14, font: helveticaBold, color: black });

  const tamilTitle = 'முதல் தகவல் அறிக்கை';
  try {
    const tamilTitleW = tamilFont.widthOfTextAtSize(tamilTitle, 12);
    page1.drawText(tamilTitle, { x: (PAGE_W - tamilTitleW) / 2, y: 726, size: 12, font: tamilFont, color: black });
  } catch {
    page1.drawText(tamilTitle, { x: PAGE_W / 2 - 40, y: 726, size: 12, font: timesBold, color: black });
  }

  const bnssSub = '(Under Section 173 BNSS)';
  const bnssW = timesItalic.widthOfTextAtSize(bnssSub, 9.5);
  page1.drawText(bnssSub, { x: (PAGE_W - bnssW) / 2, y: 712, size: 9.5, font: timesItalic, color: black });

  // Divider
  page1.drawLine({ start: { x: MARGIN_LEFT, y: 702 }, end: { x: MARGIN_RIGHT, y: 702 }, thickness: 1, color: black });

  // Section 1: District, PS, Year, FIR No, Date
  let y = 688;
  page1.drawText('1. District :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('மாவட்டம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('PS :', { x: 190, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('காவல் நிலையம் :', { x: 190, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Year :', { x: 330, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('ஆண்டு :', { x: 330, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('FIR No. :', { x: 410, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('மு.த.அ.எண் :', { x: 410, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Date :', { x: 490, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நாள் :', { x: 490, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 2: Acts and Sections
  y = 650;
  page1.drawText('2. Act(s) :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('சட்டம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Section(s) :', { x: 300, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('பிரிவுகள் :', { x: 300, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 3: Occurrence of Offence
  y = 612;
  page1.drawText('3. (a) Occurrence of Offence Day :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('குற்ற நிகழ்வு நாள் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Date From :', { x: 230, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நாள் முதல் :', { x: 230, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Date To :', { x: 390, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நாள் வரை :', { x: 390, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 578;
  page1.drawText('Time Period :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('குற்ற நிகழ்வு நேரம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Time from :', { x: 230, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நேரம் முதல் :', { x: 230, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Time To :', { x: 390, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நேரம் வரை :', { x: 390, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 544;
  page1.drawText('(b) Information Received at PS. Date :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('காவல் நிலையத்திற்கு தகவல் கிடைத்த நாள் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Time :', { x: 390, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நேரம் :', { x: 390, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 510;
  page1.drawText('(c) General Diary Reference : Entry No(s) :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('பொது நாட்குறிப்பில் பதிவு விவரம் எண் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Time :', { x: 390, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('நேரம் :', { x: 390, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 4: Type of Information
  y = 474;
  page1.drawText('4. Type of Information :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('தகவலின் வகை :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 5: Place of Occurrence
  y = 440;
  page1.drawText('5. Place of Occurrence :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('குற்ற நிகழ்விடம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 414;
  page1.drawText('(a) Direction and Distance from PS :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('(அ) காவல் நிலையத்திலிருந்து தூரமும், திசையும் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('Beat Number :', { x: 380, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('முறை காவல் எண் :', { x: 380, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 380;
  page1.drawText('(b) Address :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('(ஆ) முகவரி :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 330;
  page1.drawText('(c) In case, outside limit of this Police Station, then Name of PS :', { x: MARGIN_LEFT, y, size: 9, font: timesBold, color: black });
  page1.drawText('(இ) இக்காவல் நிலைய எல்லைக்கப்பால் நடந்திருப்பின், அந்த காவல் நிலைய பெயர் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page1.drawText('District :', { x: 380, y: y - 20, size: 9.5, font: timesBold, color: black });
  page1.drawText('மாவட்டம் :', { x: 380, y: y - 30, size: 8, font: tamilFont, color: darkGray });

  // Section 6: Complainant / Informant
  y = 270;
  page1.drawText('6. Complainant / Informant :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('குற்றமுறையீட்டாளர் / தகவல் தந்தவர் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 244;
  page1.drawText('(a) Name :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page1.drawText('பெயர் :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Page 1 Footer
  page1.drawText('Page 1 of 3', { x: MARGIN_RIGHT - 50, y: 30, size: 8.5, font: helvetica, color: lineGray });

  // ==========================================
  // PAGE 2
  // ==========================================
  const page2 = doc.addPage([PAGE_W, PAGE_H]);

  // Section 6 continuation
  y = 800;
  page2.drawText('(b) Father\'s / Husband\'s Name :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('தந்தை / கணவரின் பெயர் :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 766;
  page2.drawText('(c) Date / Year of Birth :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('நாள் / பிறந்த ஆண்டு :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page2.drawText('(d) Nationality :', { x: 320, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('நாட்டினம் :', { x: 320, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 732;
  page2.drawText('(e) Passport No. :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('கடவுச்சீட்டு எண் :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page2.drawText('Date of Issue :', { x: 230, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('வழங்கப்பட்ட நாள் :', { x: 230, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  page2.drawText('Place of Issue :', { x: 390, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('வழங்கப்பட்ட இடம் :', { x: 390, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 698;
  page2.drawText('(f) Occupation :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('தொழில் :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  y = 664;
  page2.drawText('(g) Address :', { x: MARGIN_LEFT + 10, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('முகவரி :', { x: MARGIN_LEFT + 10, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 7: Details of Accused
  y = 612;
  page2.drawText('7. Details of Known / Suspected / Unknown accused with full particulars :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('தெரிந்த / ஐயப்பாட்டிற்குரிய / தெரியாத குற்றம் சாட்டப்பட்டவரின் விவரங்கள் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 8: Reasons for delay
  y = 548;
  page2.drawText('8. Reasons for delay in reporting by the complainant / informant :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('குற்றமுறையீட்டாளரால் தகவல் கொடுப்பதில் தாமதம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 9: Particulars of properties stolen
  y = 502;
  page2.drawText('9. Particulars of properties stolen / involved :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('களவாடப்பட்ட / களவிற்குள்ளான சொத்துக்களின் விவரம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 10: Total value of properties
  y = 456;
  page2.drawText('10. Total value of properties stolen / involved :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('களவிற்குள்ளான சொத்துக்களின் மொத்த மதிப்பு :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 11: Inquest Report
  y = 422;
  page2.drawText('11. Inquest Report / Un-natural death Case No. if any :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('பிண விசாரணை அறிக்கை / இயற்கைக்கு மாறான இறப்பு எண் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Section 12: FIR Contents Box
  y = 388;
  page2.drawText('12. FIR Contents (Substance of Information) :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page2.drawText('முதல் தகவல் அறிக்கையின் விவரம் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Rectangular frame for FIR Contents
  const boxTop = y - 16;
  const boxHeight = 310;
  page2.drawRectangle({
    x: MARGIN_LEFT,
    y: boxTop - boxHeight,
    width: CONTENT_W,
    height: boxHeight,
    borderColor: black,
    borderWidth: 0.8
  });

  // Page 2 Footer
  page2.drawText('Page 2 of 3', { x: MARGIN_RIGHT - 50, y: 30, size: 8.5, font: helvetica, color: lineGray });

  // ==========================================
  // PAGE 3
  // ==========================================
  const page3 = doc.addPage([PAGE_W, PAGE_H]);

  // Section 13: Action Taken
  y = 800;
  page3.drawText('13. Action Taken : Since the above report reveals Commission of Offence(s) u/s as mentioned at item No. 2,', {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: timesBold,
    color: black
  });
  page3.drawText('Directed (Name of I.O.) _____________________________________ to take up the Investigation.', {
    x: MARGIN_LEFT,
    y: y - 14,
    size: 9,
    font: times,
    color: black
  });

  const actTamil1 = 'எடுக்கப்பட்ட நடவடிக்கை : மேலே கூறப்பட்ட சட்டப்பிரிவின்படி குற்றமாக வழக்கு பதிவு செய்யப்பட்டு புலனாய்வுக்கு பணிக்கப்பட்டது';
  page3.drawText(actTamil1, { x: MARGIN_LEFT, y: y - 28, size: 7.8, font: tamilFont, color: darkGray });

  y = 744;
  page3.drawText('FIR read over to the Complainant / Informant, admitted to be correctly recorded and a copy given free of cost.', {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: timesBold,
    color: black
  });

  const actTamil2 = 'மு.த.அ. தகவல் தந்தவருக்கு படித்துக்காட்டி, அது சரியாக இருப்பதாக ஒப்புக்கொண்டு, நகல் ஒன்று இலவசமாக வழங்கப்பட்டது.';
  page3.drawText(actTamil2, { x: MARGIN_LEFT, y: y - 14, size: 7.8, font: tamilFont, color: darkGray });

  // Divider
  page3.drawLine({ start: { x: MARGIN_LEFT, y: 695 }, end: { x: MARGIN_RIGHT, y: 695 }, thickness: 0.8, color: lightGray });

  // Section 14: Signatures Area
  y = 675;
  // Left: Complainant Signature
  page3.drawText('14. Signature / Thumb Impression of complainant', { x: MARGIN_LEFT, y, size: 9, font: timesBold, color: black });
  page3.drawText('குற்றமுறையீட்டாளர் / தகவல் கொடுப்பவரின் ஒப்பம்', { x: MARGIN_LEFT, y: y - 10, size: 7.8, font: tamilFont, color: darkGray });

  page3.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 110,
    width: 220,
    height: 90,
    borderColor: lineGray,
    borderWidth: 0.8,
    borderDashArray: [3, 3]
  });
  page3.drawText('(Signature / Left Thumb Impression)', { x: MARGIN_LEFT + 35, y: y - 100, size: 8, font: timesItalic, color: lineGray });

  // Right: Officer Signature
  page3.drawText('Signature of Officer in charge Police Station', { x: 320, y, size: 9, font: timesBold, color: black });
  page3.drawText('காவல் நிலைய பொறுப்பு அலுவலரின் ஒப்பம்', { x: 320, y: y - 10, size: 7.8, font: tamilFont, color: darkGray });

  page3.drawRectangle({
    x: 320,
    y: y - 80,
    width: 220,
    height: 60,
    borderColor: lineGray,
    borderWidth: 0.8,
    borderDashArray: [3, 3]
  });
  page3.drawText('(Officer Signature & Seal)', { x: 375, y: y - 72, size: 8, font: timesItalic, color: lineGray });

  page3.drawText('Name :', { x: 320, y: y - 100, size: 8.5, font: timesBold, color: black });
  page3.drawText('Rank :', { x: 320, y: y - 115, size: 8.5, font: timesBold, color: black });
  page3.drawText('No.  :', { x: 440, y: y - 115, size: 8.5, font: timesBold, color: black });

  // Section 15: Date and Time of dispatch to Court
  y = 520;
  page3.drawLine({ start: { x: MARGIN_LEFT, y: 535 }, end: { x: MARGIN_RIGHT, y: 535 }, thickness: 0.8, color: lightGray });
  page3.drawText('15. Date and Time of dispatch to the court :', { x: MARGIN_LEFT, y, size: 9.5, font: timesBold, color: black });
  page3.drawText('நீதிமன்றத்திற்கு அனுப்பப்பட்ட நாளும் நேரமும் :', { x: MARGIN_LEFT, y: y - 10, size: 8, font: tamilFont, color: darkGray });

  // Bottom Notice
  const statutoryNotice = 'STATUTORY RECORD UNDER SECTION 173 BNSS (CR.P.C. 154) • TAMIL NADU POLICE DEPARTMENT';
  const noticeW = helveticaBold.widthOfTextAtSize(statutoryNotice, 7.5);
  page3.drawText(statutoryNotice, { x: (PAGE_W - noticeW) / 2, y: 50, size: 7.5, font: helveticaBold, color: lineGray });

  // Page 3 Footer
  page3.drawText('Page 3 of 3', { x: MARGIN_RIGHT - 50, y: 30, size: 8.5, font: helvetica, color: lineGray });

  const pdfBytes = await doc.save();
  fs.writeFileSync(targetPath, pdfBytes);
  console.log(`[FIR Template Builder] Generated official 3-page template at: ${targetPath} (${pdfBytes.length} bytes)`);

  return targetPath;
}
