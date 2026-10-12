import { OfficialFIRData } from '../types/documentIntelligence';
import { FIRCaseData } from '../types';

export function mapCaseToOfficialFIR(
  caseData: Partial<FIRCaseData>,
  officer?: { name: string; role: string; station?: string; badgeNumber?: string },
  additionalOverrides?: Partial<OfficialFIRData>
): OfficialFIRData {
  const currentYear = new Date().getFullYear().toString();
  const todayDate = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  // Derive day of week if date is available
  let dayOfWeek = '';
  if (caseData.incidentDate) {
    try {
      const d = new Date(caseData.incidentDate);
      dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      dayOfWeek = '';
    }
  }

  // Extract FIR Number from Case ID if available (e.g. LAW-2026-00125 -> 125/2026)
  let derivedFirNo = '';
  if (caseData.caseId) {
    const parts = caseData.caseId.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[2], 10) || parts[2];
      derivedFirNo = `${num}/${parts[1] || currentYear}`;
    } else {
      derivedFirNo = caseData.caseId;
    }
  } else {
    derivedFirNo = `01/${currentYear}`;
  }

  // Extract legal sections if available
  const sectionsList: string[] = [];
  const actsList: string[] = ['Bharatiya Nyaya Sanhita, 2023 (BNS)'];

  if (caseData.aiAnalysis?.sections && Array.isArray(caseData.aiAnalysis.sections)) {
    caseData.aiAnalysis.sections.forEach((sec: any) => {
      const secName = typeof sec === 'string' ? sec : (sec.section || sec.actSection);
      if (secName && !sectionsList.includes(secName)) {
        sectionsList.push(secName);
      }
    });
  }

  // Property details
  const propertyItems: string[] = [];
  if (caseData.aiAnalysis?.propertyLoss) {
    propertyItems.push(caseData.aiAnalysis.propertyLoss);
  }

  // Accused details
  const accusedItems: string[] = [];
  if (caseData.aiAnalysis?.accusedDetails) {
    accusedItems.push(caseData.aiAnalysis.accusedDetails);
  }

  const initialData: OfficialFIRData = {
    caseId: caseData.caseId || `LAW-${currentYear}-00001`,
    district: caseData.district || 'Chennai City',
    policeStation: caseData.policeStation || officer?.station || 'B-2 Esplanade Police Station',
    year: currentYear,
    firNumber: derivedFirNo,
    firDate: todayDate,

    acts: actsList,
    sections: sectionsList.length > 0 ? sectionsList : ['Section 303(2) BNS, 2023'],

    occurrence: {
      day: dayOfWeek || 'Not Specified',
      dateFrom: caseData.incidentDate || todayDate,
      dateTo: caseData.incidentDate || todayDate,
      timePeriod: '',
      timeFrom: caseData.incidentTime || '',
      timeTo: caseData.incidentTime || ''
    },

    informationReceived: {
      date: todayDate,
      time: nowTime
    },

    generalDiary: {
      entryNumber: 'GD-014',
      time: nowTime
    },

    informationType: 'Written',

    placeOfOccurrence: {
      directionDistanceFromPS: '1.2 Km East from Police Station',
      beatNumber: 'Beat No. 2',
      address: caseData.incidentDescription?.includes('near') ? caseData.incidentDescription.split('near')[1]?.slice(0, 80) : 'Jurisdictional station limits',
      outsidePSName: '',
      outsideDistrict: ''
    },

    complainant: {
      name: caseData.complainant || '',
      fatherOrHusbandName: caseData.fatherHusbandName || '',
      dob: '',
      nationality: 'Indian',
      passportNumber: '',
      passportIssueDate: '',
      passportIssuePlace: '',
      occupation: '',
      address: caseData.complainantAddress || ''
    },

    accusedDetails: accusedItems.length > 0 ? accusedItems : ['Unknown accused person(s)'],

    delayReason: 'Nil / Reported promptly without delay.',

    propertyDetails: propertyItems,

    totalPropertyValue: '',

    inquestOrUnnaturalDeathCaseNo: '',

    firContents: caseData.incidentDescription || '',

    actionTaken: {
      details: 'Investigation taken up under Section 175 BNSS.',
      investigatingOfficer: officer?.name || caseData.officerName || 'Duty Officer',
      officerRank: officer?.role || caseData.officerRole || 'Sub-Inspector of Police',
      officerNumber: officer?.badgeNumber || 'SI-4402'
    },

    dispatchToCourt: {
      date: todayDate,
      time: '10:00'
    },

    version: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: officer?.name || 'Authorized Police Officer',
    isVerifiedByOfficer: true,
    ...additionalOverrides
  };

  return initialData;
}
