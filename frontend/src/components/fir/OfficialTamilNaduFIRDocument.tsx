import React, { forwardRef } from 'react';
import { OfficialFIRData } from '../../types/documentIntelligence';
import { TamilNaduPoliceEmblem } from './TamilNaduPoliceEmblem';

interface OfficialFIRDocumentProps {
  data: OfficialFIRData;
  page?: 1 | 2 | 3 | '1' | '2' | '3' | 'all';
  pageRefs?: {
    page1Ref?: React.RefObject<HTMLDivElement | null>;
    page2Ref?: React.RefObject<HTMLDivElement | null>;
    page3Ref?: React.RefObject<HTMLDivElement | null>;
  };
}

export const OfficialTamilNaduFIRDocument: React.FC<OfficialFIRDocumentProps> = ({
  data,
  page = 'all',
  pageRefs
}: OfficialFIRDocumentProps) => {
  // Helpers to format empty or present values
  const val = (v?: string | number | null) => (v ? String(v) : '');
  const actsDisplay = data.acts && data.acts.length > 0 ? data.acts.join(', ') : 'Bharatiya Nyaya Sanhita, 2023';
  const sectionsDisplay = data.sections && data.sections.length > 0 ? data.sections.join(', ') : '';

  const showPage1 = page === 'all' || String(page) === '1';
  const showPage2 = page === 'all' || String(page) === '2';
  const showPage3 = page === 'all' || String(page) === '3';

  return (
    <div className="official-fir-document font-serif text-[#000000] bg-[#FFFFFF] select-text">
      {/* =========================================================================
          PAGE 1
      ========================================================================= */}
      {showPage1 && (
      <div
        ref={pageRefs?.page1Ref}
        id="fir-print-page-1"
        className="official-fir-page bg-white text-black p-[18mm] sm:p-[20mm] mx-auto border border-[#E0E0E0] shadow-md print:border-none print:shadow-none relative"
        style={{
          width: '210mm',
          minHeight: '297mm',
          height: 'auto',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page',
          fontFamily: "'Times New Roman', Times, Georgia, serif",
          fontSize: '11.5px',
          lineHeight: '1.4'
        }}
      >
        {/* Top Header: Emblem, Right Title, Main Headings */}
        <div className="relative mb-4">
          {/* Top Right Header */}
          <div className="text-right text-[11px] font-sans font-bold leading-tight mb-2 tracking-wide">
            <div>TAMIL NADU POLICE</div>
            <div>INTEGRATED INVESTIGATION FORM-I</div>
          </div>

          {/* Center Emblem & Headings */}
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <TamilNaduPoliceEmblem size={68} />
            </div>

            <h1 className="text-[15px] font-bold tracking-wide uppercase font-sans mt-1">
              FIRST INFORMATION REPORT
            </h1>
            <h2 className="text-[14px] font-semibold text-black mt-0.5" style={{ fontFamily: "'Latha', 'Mukta Malar', 'Noto Sans Tamil', sans-serif" }}>
              முதல் தகவல் அறிக்கை
            </h2>
            <div className="text-[11.5px] italic mt-0.5">
              (Under Section 173 BNSS)
            </div>
            <div className="text-[11px] text-black" style={{ fontFamily: "'Latha', 'Mukta Malar', 'Noto Sans Tamil', sans-serif" }}>
              பாரதீய நாகரிக் சுரக்ஷா சன்ஹிதா பிரிவு 173 இன் கீழ்
            </div>
          </div>
        </div>

        {/* Section 1: District, PS, Year, FIR No., Date */}
        <div className="mt-4 pt-2 border-t border-black/20 text-[11.5px]">
          <div className="grid grid-cols-12 gap-1 items-baseline">
            <div className="col-span-3">
              <span className="font-semibold">1. District : </span>
              <span className="font-sans font-bold uppercase">{val(data.district)}</span>
              <div className="text-[10px] text-black/80 font-sans" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                மாவட்டம் :
              </div>
            </div>

            <div className="col-span-3">
              <span className="font-semibold">PS : </span>
              <span className="font-sans font-bold uppercase">{val(data.policeStation)}</span>
              <div className="text-[10px] text-black/80 font-sans" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                காவல் நிலையம் :
              </div>
            </div>

            <div className="col-span-2">
              <span className="font-semibold">Year : </span>
              <span className="font-sans">{val(data.year)}</span>
              <div className="text-[10px] text-black/80 font-sans" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                ஆண்டு :
              </div>
            </div>

            <div className="col-span-2">
              <span className="font-semibold">FIR No. : </span>
              <span className="font-sans font-bold">{val(data.firNumber)}</span>
              <div className="text-[10px] text-black/80 font-sans" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                மு.த.அ.எண் :
              </div>
            </div>

            <div className="col-span-2">
              <span className="font-semibold">Date : </span>
              <span className="font-sans">{val(data.firDate)}</span>
              <div className="text-[10px] text-black/80 font-sans" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                நாள் :
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Act(s) & Section(s) */}
        <div className="mt-3 text-[11.5px]">
          <div className="grid grid-cols-12 gap-2 items-baseline">
            <div className="col-span-6">
              <span className="font-semibold">2. Act(s) : </span>
              <span className="font-sans">{actsDisplay}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                சட்டம் :
              </div>
            </div>

            <div className="col-span-6">
              <span className="font-semibold">Section(s) : </span>
              <span className="font-sans font-bold">{sectionsDisplay}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                பிரிவுகள் :
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Occurrence of Offence */}
        <div className="mt-4 space-y-2.5 text-[11.5px]">
          {/* 3(a) Occurrence Day, Date From, Date To */}
          <div>
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-4">
                <span className="font-semibold">3. (a) Occurrence of Offence Day : </span>
                <span className="font-sans">{val(data.occurrence?.day)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  குற்ற நிகழ்வு நாள் :
                </div>
              </div>
              <div className="col-span-4">
                <span className="font-semibold">Date From : </span>
                <span className="font-sans">{val(data.occurrence?.dateFrom)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  நாள் முதல் :
                </div>
              </div>
              <div className="col-span-4">
                <span className="font-semibold">Date To : </span>
                <span className="font-sans">{val(data.occurrence?.dateTo)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  நாள் வரை :
                </div>
              </div>
            </div>

            {/* Time Period, Time From, Time To */}
            <div className="grid grid-cols-12 gap-2 items-baseline mt-1.5">
              <div className="col-span-4">
                <span className="font-semibold">Time Period : </span>
                <span className="font-sans">{val(data.occurrence?.timePeriod)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  குற்ற நிகழ்வு நேரம் :
                </div>
              </div>
              <div className="col-span-4">
                <span className="font-semibold">Time from : </span>
                <span className="font-sans">{val(data.occurrence?.timeFrom)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  நேரம் முதல் :
                </div>
              </div>
              <div className="col-span-4">
                <span className="font-semibold">Time To : </span>
                <span className="font-sans">{val(data.occurrence?.timeTo)}</span>
                <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  நேரம் வரை :
                </div>
              </div>
            </div>
          </div>

          {/* 3(b) Information Received at PS */}
          <div className="grid grid-cols-12 gap-2 items-baseline mt-2">
            <div className="col-span-7">
              <span className="font-semibold">(b) Information Received at PS. Date : </span>
              <span className="font-sans">{val(data.informationReceived?.date)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                காவல் நிலையத்திற்கு தகவல் கிடைத்த நாள் :
              </div>
            </div>
            <div className="col-span-5">
              <span className="font-semibold">Time : </span>
              <span className="font-sans">{val(data.informationReceived?.time)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                நேரம் :
              </div>
            </div>
          </div>

          {/* 3(c) General Diary Reference */}
          <div className="grid grid-cols-12 gap-2 items-baseline mt-2">
            <div className="col-span-7">
              <span className="font-semibold">(c) General Diary Reference : Entry No(s) </span>
              <span className="font-sans font-medium">{val(data.generalDiary?.entryNumber)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                பொது நாட்குறிப்பில் பதிவு விவரம் எண் :
              </div>
            </div>
            <div className="col-span-5">
              <span className="font-semibold">Time : </span>
              <span className="font-sans">{val(data.generalDiary?.time)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                நேரம் :
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Type of Information */}
        <div className="mt-3 text-[11.5px]">
          <span className="font-semibold">4. Type of Information : </span>
          <span className="font-sans font-medium">{val(data.informationType) || 'Written'}</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            தகவலின் வகை :
          </div>
        </div>

        {/* Section 5: Place of Occurrence */}
        <div className="mt-3 text-[11.5px] space-y-1.5">
          <div>
            <span className="font-semibold">5. Place of Occurrence :</span>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              குற்ற நிகழ்விடம் :
            </div>
          </div>

          {/* 5(a) Direction and Distance & Beat No. */}
          <div className="grid grid-cols-12 gap-2 items-baseline">
            <div className="col-span-8">
              <span className="font-semibold">(a) Direction and Distance from PS : </span>
              <span className="font-sans">{val(data.placeOfOccurrence?.directionDistanceFromPS)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                (அ) காவல் நிலையத்திலிருந்து எவ்வளவு தூரமும், திசையும் :
              </div>
            </div>
            <div className="col-span-4">
              <span className="font-semibold">Beat Number : </span>
              <span className="font-sans">{val(data.placeOfOccurrence?.beatNumber)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                முறை காவல் எண் :
              </div>
            </div>
          </div>

          {/* 5(b) Address */}
          <div>
            <div className="font-semibold">(b) Address :</div>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              (ஆ) முகவரி :
            </div>
            <div className="font-sans text-[11.5px] mt-0.5 leading-relaxed pl-4">
              {val(data.placeOfOccurrence?.address) || 'Within the territorial jurisdiction of the police station.'}
            </div>
          </div>

          {/* 5(c) Outside Station Limits */}
          <div className="pt-1">
            <span className="font-semibold">(c) In case, outside limit of this Police Station, then the Name of PS: </span>
            <span className="font-sans">{val(data.placeOfOccurrence?.outsidePSName)}</span>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              (இ) இக்காவல் நிலைய எல்லைக்கப்பால் நடந்து இருக்குமாயின், அந்த காவல் நிலையத்தின் பெயர் :
            </div>

            <div className="mt-1 pl-4">
              <span className="font-semibold">District: </span>
              <span className="font-sans">{val(data.placeOfOccurrence?.outsideDistrict)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                மாவட்டம் :
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Complainant/Informant (starts on page 1) */}
        <div className="mt-4 pt-1 text-[11.5px]">
          <div className="font-semibold">6. Complainant/Informant:</div>
          <div className="mt-1 pl-2">
            <span className="font-semibold">(a) Name : </span>
            <span className="font-sans font-bold text-[12px]">{val(data.complainant?.name)}</span>
          </div>
        </div>

        {/* Page 1 Footer indicator */}
        <div className="absolute bottom-4 right-8 text-[10px] text-black/60 font-sans">
          Page 1 of 3
        </div>
      </div>
      )}

      {/* =========================================================================
          PAGE 2
      ========================================================================= */}
      {showPage2 && (
      <div
        ref={pageRefs?.page2Ref}
        id="fir-print-page-2"
        className="official-fir-page bg-white text-black p-[18mm] sm:p-[20mm] mx-auto border border-[#E0E0E0] shadow-md print:border-none print:shadow-none relative mt-8 print:mt-0"
        style={{
          width: '210mm',
          minHeight: '297mm',
          height: 'auto',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page',
          fontFamily: "'Times New Roman', Times, Georgia, serif",
          fontSize: '11.5px',
          lineHeight: '1.4'
        }}
      >
        {/* Section 6 continuation */}
        <div className="text-[11.5px] space-y-1.5">
          <div className="text-[10px] text-black/80 pl-2" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            குற்றமுறையீட்டாளர் / தகவல் தந்தவர் பெயர் :
          </div>

          <div className="pl-2">
            <span className="font-semibold">(b) Father's / Husband's Name : </span>
            <span className="font-sans font-medium">{val(data.complainant?.fatherOrHusbandName)}</span>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              தந்தை / கணவரின் பெயர் :
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 pl-2 items-baseline">
            <div className="col-span-6">
              <span className="font-semibold">(c) Date/Year of Birth : </span>
              <span className="font-sans">{val(data.complainant?.dob)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                நாள் / பிறந்த ஆண்டு :
              </div>
            </div>
            <div className="col-span-6">
              <span className="font-semibold">(d) Nationality : </span>
              <span className="font-sans">{val(data.complainant?.nationality) || 'Indian'}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                நாட்டினம் :
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 pl-2 items-baseline">
            <div className="col-span-4">
              <span className="font-semibold">(e) Passport No. : </span>
              <span className="font-sans">{val(data.complainant?.passportNumber)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                வெளிநாட்டு கடவுச்சீட்டு எண் :
              </div>
            </div>
            <div className="col-span-4">
              <span className="font-semibold">Date of Issue : </span>
              <span className="font-sans">{val(data.complainant?.passportIssueDate)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                வழங்கப்பட்ட நாள் :
              </div>
            </div>
            <div className="col-span-4">
              <span className="font-semibold">Place of issue : </span>
              <span className="font-sans">{val(data.complainant?.passportIssuePlace)}</span>
              <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                வழங்கப்பட்ட இடம் :
              </div>
            </div>
          </div>

          <div className="pl-2">
            <span className="font-semibold">(f) Occupation : </span>
            <span className="font-sans">{val(data.complainant?.occupation)}</span>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              தொழில் :
            </div>
          </div>

          <div className="pl-2">
            <div className="font-semibold">(g) Address :</div>
            <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              முகவரி :
            </div>
            <div className="font-sans text-[11.5px] mt-0.5 leading-relaxed pl-2">
              {val(data.complainant?.address)}
            </div>
          </div>
        </div>

        {/* Section 7: Details of Known/Suspected/Unknown Accused */}
        <div className="mt-3.5 text-[11.5px]">
          <span className="font-semibold">7. Details of Known/Suspected/Unknown accused with full particulars :</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            தெரிந்த / ஐயப்பாட்டிற்குரிய / தெரியாத குற்றம் சாட்டப்பட்டவரின் முழுமையான விவரங்கள். :
          </div>
          <div className="font-sans text-[11.5px] mt-1 pl-4 leading-relaxed">
            {data.accusedDetails && data.accusedDetails.length > 0 ? (
              data.accusedDetails.map((acc, idx) => (
                <div key={idx} className="mb-0.5">• {acc}</div>
              ))
            ) : (
              'Unknown accused person(s)'
            )}
          </div>
        </div>

        {/* Section 8: Reasons for Delay */}
        <div className="mt-3 text-[11.5px]">
          <span className="font-semibold">8. Reasons for delay in reporting by the complainant/informant :</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            குற்றமுறையீட்டாளரால் / தகவல் கொடுப்பவரால் முறையிட்டதில் தகவல் கொடுப்பதில் தாமதம் :
          </div>
          <div className="font-sans text-[11.5px] mt-0.5 pl-4">
            {val(data.delayReason) || 'Nil / Reported promptly'}
          </div>
        </div>

        {/* Section 9: Particulars of properties stolen/Involved */}
        <div className="mt-3 text-[11.5px]">
          <span className="font-semibold">9. Particulars of properties stolen/Involved :</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            களவாடப்பட்ட / களவிற்குள்ளான சொத்துக்களின் விவரம். :
          </div>
          <div className="font-sans text-[11.5px] mt-0.5 pl-4 leading-relaxed">
            {data.propertyDetails && data.propertyDetails.length > 0 ? (
              data.propertyDetails.join('; ')
            ) : (
              'Nil / As detailed in investigation report'
            )}
          </div>
        </div>

        {/* Section 10: Total Value of properties */}
        <div className="mt-2.5 text-[11.5px]">
          <span className="font-semibold">10. Total value of properties stolen/Involved :</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            களவாடப்பட்ட / களவிற்குள்ளான சொத்துக்களின் மொத்த மதிப்பு. :
          </div>
          <div className="font-sans text-[11.5px] mt-0.5 pl-4">
            {val(data.totalPropertyValue) || 'Nil / Under verification'}
          </div>
        </div>

        {/* Section 11: Inquest Report */}
        <div className="mt-2.5 text-[11.5px]">
          <span className="font-semibold">11. Inquest Report / Un-natural death Case No. If any :</span>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            பிண விசாரணை அறிக்கை / இயற்கைக்கு மாறான இறப்பு எண் ஏதேனும் இருந்தால் :
          </div>
          <div className="font-sans text-[11.5px] mt-0.5 pl-4">
            {val(data.inquestOrUnnaturalDeathCaseNo) || 'Not Applicable'}
          </div>
        </div>

        {/* Section 12: FIR Contents */}
        <div className="mt-3.5 text-[11.5px]">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold">12. FIR Contents :</span>
          </div>
          <div className="text-[10px] text-black/80" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            :
          </div>
          <div
            className="font-sans text-[11px] mt-1 p-2.5 border border-black/30 rounded-none leading-relaxed text-justify whitespace-pre-wrap max-h-[350px] overflow-hidden"
            style={{
              wordBreak: 'break-word',
              lineHeight: '1.5'
            }}
          >
            {data.firContents || 'The verbatim substance of information / complaint is entered as recorded by the officer.'}
          </div>
        </div>

        {/* Page 2 Footer indicator */}
        <div className="absolute bottom-4 right-8 text-[10px] text-black/60 font-sans">
          Page 2 of 3
        </div>
      </div>
      )}

      {/* =========================================================================
          PAGE 3
      ========================================================================= */}
      {showPage3 && (
      <div
        ref={pageRefs?.page3Ref}
        id="fir-print-page-3"
        className="official-fir-page bg-white text-black p-[18mm] sm:p-[20mm] mx-auto border border-[#E0E0E0] shadow-md print:border-none print:shadow-none relative mt-8 print:mt-0"
        style={{
          width: '210mm',
          minHeight: '297mm',
          height: 'auto',
          boxSizing: 'border-box',
          fontFamily: "'Times New Roman', Times, Georgia, serif",
          fontSize: '11.5px',
          lineHeight: '1.45'
        }}
      >
        {/* Section 13: Action Taken */}
        <div className="text-[11.5px] space-y-2">
          <div>
            <span className="font-semibold">
              13. Action Taken: Since the above report reveals Commission of Offence(s) u/s as mentioned at item No. 2,
            </span>
            <div className="mt-1">
              Directed (Name of I.O.) <span className="font-sans font-bold underline px-1">{val(data.actionTaken?.investigatingOfficer) || 'Designated Investigating Officer'}</span> to take up the Investigation.
            </div>
            <div className="text-[10.5px] text-black/85 mt-1 leading-normal" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              எடுக்கப்பட்ட நடவடிக்கை: மேலே குற்ற முறையீட்டில் உள்ளவை பிரிவு 2-ல் கூறப்பட்ட சட்ட பிரிவுப்படியான குற்றமாக வழக்கு பதிவு செய்து பணியாளரின் புலனாய்வுக்கு எடுத்துக்கொள்ள பணிக்கப்பட்டது
            </div>
          </div>

          <div className="pt-2">
            <p className="font-medium leading-relaxed">
              FIR read over to the Complainant/Informant, admitted to be correctly recorded and a copy given to the Complainant/Informant free of cost.
            </p>
            <div className="text-[10.5px] text-black/85 mt-1 leading-normal" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              மு.த.அ. குற்றமுறையீட்டாளருக்கு / தகவல் தந்தவருக்கு படித்துக்காட்டி, அது சரியாக எழுதப்பட்டு இருப்பதாக ஏற்றுக்கொள்ளப்பட்டு, அதன்படி நகல் ஒன்று இலவசமாக கொடுக்கப்பட்டது.
            </div>
          </div>
        </div>

        {/* Section 14: Signatures Area */}
        <div className="mt-16 pt-6 border-t border-black/20 text-[11.5px]">
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* Left: Complainant / Informant Signature */}
            <div>
              <div className="font-semibold leading-tight">
                14. Signature/Thumb Impression of the complainant/informant
              </div>
              <div className="text-[10px] text-black/85 mt-0.5 leading-snug" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                குற்றமுறையீட்டாளர் / தகவல் கொடுப்பவரின் ஒப்பம் / பெருவிரல் இரேகை பதிவு
              </div>

              {/* Blank physical signature area (as strictly specified by user) */}
              <div className="h-28 mt-4 border-b border-dashed border-black/40 flex items-end justify-center pb-2">
                <span className="text-[9px] text-black/40 italic font-sans">(Signature / Left Thumb Impression)</span>
              </div>
            </div>

            {/* Right: Officer in charge Police Station */}
            <div>
              <div className="font-semibold leading-tight">
                Signature of Officer in charge Police Station
              </div>
              <div className="text-[10px] text-black/85 mt-0.5 leading-snug" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                காவல் நிலைய பொறுப்பு அலுவலரின் ஒப்பம்
              </div>

              {/* Blank signature space */}
              <div className="h-20 mt-4 border-b border-dashed border-black/40 flex items-end justify-center pb-2">
                <span className="text-[9px] text-black/40 italic font-sans">(Officer Signature)</span>
              </div>

              <div className="mt-3 space-y-1 font-sans text-[11px]">
                <div>
                  <span className="font-serif font-semibold">Name : </span>
                  <span className="font-bold">{val(data.actionTaken?.investigatingOfficer)}</span>
                </div>
                <div className="flex gap-6">
                  <div>
                    <span className="font-serif font-semibold">Rank : </span>
                    <span>{val(data.actionTaken?.officerRank) || 'Sub-Inspector of Police'}</span>
                  </div>
                  <div>
                    <span className="font-serif font-semibold">No. : </span>
                    <span>{val(data.actionTaken?.officerNumber) || 'SI-Station'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 15: Date and Time of Dispatch to Court */}
        <div className="mt-14 pt-4 border-t border-black/20 text-[11.5px]">
          <div className="font-semibold">
            15. Date and Time of dispatch to the court :
          </div>
          <div className="text-[10px] text-black/85" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            நீதிமன்றத்திற்கு அனுப்பப்பட்ட நாளும் நேரமும் :
          </div>
          <div className="font-sans text-[11.5px] mt-1 pl-4 font-medium">
            {val(data.dispatchToCourt?.date)} at {val(data.dispatchToCourt?.time) || '10:00 hrs'}
          </div>
        </div>

        {/* Legal Form Integrity Notice (Bottom Center) */}
        <div className="mt-20 pt-4 text-center text-[9px] text-black/50 font-sans uppercase tracking-widest">
          STATUTORY RECORD UNDER SECTION 173 BNSS (CR.P.C. 154) • TAMIL NADU POLICE DEPARTMENT
        </div>

        {/* Page 3 Footer indicator */}
        <div className="absolute bottom-4 right-8 text-[10px] text-black/60 font-sans">
          Page 3 of 3
        </div>
      </div>
      )}
    </div>
  );
};
