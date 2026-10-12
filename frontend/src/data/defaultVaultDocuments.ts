import { CaseDocumentVaultItem } from '../types/documentIntelligence';

export const DEFAULT_VAULT_DOCUMENTS: CaseDocumentVaultItem[] = [
  {
    id: 'DOC-125-FIR',
    caseId: 'LAW-2026-00125',
    fileName: 'LAW-2026-00125-Registered-FIR.pdf',
    documentType: 'FIR',
    fileSize: 421888,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Investigating Officer',
    uploadedAt: '2026-08-20T19:35:00.000Z',
    lastUpdated: '2026-08-20T19:35:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T09:15:20.000Z',
    analysisStatus: 'Analyzed',
    tags: ['FIR', 'Snatching', 'Connaught Place', 'Section 304 BNS'],
    notes: 'Official CCTNS registered First Information Report signed by informant Aarav Malhotra and IO.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 4,
      leads: 3,
      timeline: 4
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T19:35:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Initial registration and upload of certified digital FIR record from CCTNS.',
        newIntegrityHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        fileSize: 421888,
        fileName: 'LAW-2026-00125-Registered-FIR.pdf'
      }
    ]
  },
  {
    id: 'DOC-125-VIC',
    caseId: 'LAW-2026-00125',
    fileName: 'Victim_Statement_Aarav_Malhotra_Sec180BNSS.pdf',
    documentType: 'Victim Statements',
    fileSize: 250880,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Investigating Officer',
    uploadedAt: '2026-08-20T20:15:00.000Z',
    lastUpdated: '2026-08-20T20:15:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-20T21:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Victim Statement', 'Section 180 BNSS', 'Aarav Malhotra', 'Gold Chain'],
    notes: 'Detailed examination of victim Aarav Malhotra recorded under Section 180 BNSS 2023 with specific vehicle identifiers.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 3,
      leads: 2,
      timeline: 3
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T20:15:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Initial deposition of injured complainant transcribed and certified.',
        newIntegrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fileSize: 250880,
        fileName: 'Victim_Statement_Aarav_Malhotra_Sec180BNSS.pdf'
      }
    ]
  },
  {
    id: 'DOC-125-WIT',
    caseId: 'LAW-2026-00125',
    fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh.pdf',
    documentType: 'Witness Statements',
    fileSize: 184320,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Investigating Officer',
    uploadedAt: '2026-08-20T22:15:00.000Z',
    lastUpdated: '2026-08-21T10:00:00.000Z',
    currentVersion: 'v1.1',
    sha256Hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T10:05:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Witness', 'Sec 180 BNSS', 'Tea Stall', 'Motorcycle Exhaust'],
    notes: 'Recorded under Section 180 BNSS 2023. Key eyewitness Ramesh observed getaway trajectory towards Barakhamba Road.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 2,
      leads: 3,
      timeline: 2
    },
    versionHistory: [
      {
        versionNumber: 'v1.1',
        timestamp: '2026-08-21T10:00:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Added corroborative sketch map of getaway route towards Tolstoy Marg intersection.',
        previousIntegrityHash: 'f45ab8321098bcda456ef1209384756281903482710394857261524356473829',
        newIntegrityHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        fileSize: 184320,
        fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh.pdf'
      },
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T22:15:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Initial handwritten witness transcription.',
        newIntegrityHash: 'f45ab8321098bcda456ef1209384756281903482710394857261524356473829',
        fileSize: 172032,
        fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh_raw.pdf'
      }
    ]
  },
  {
    id: 'DOC-125-EVD',
    caseId: 'LAW-2026-00125',
    fileName: 'Traffic_ICCC_CCTV_Frame_Extract_ITO.pdf',
    documentType: 'Evidence Records',
    fileSize: 891200,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Investigating Officer',
    uploadedAt: '2026-08-21T14:30:00.000Z',
    lastUpdated: '2026-08-21T14:30:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T16:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['CCTV', 'Section 63 BSA Certificate', 'ICCC Traffic', 'Pulsar 220'],
    notes: 'Surveillance frames preserved with Section 63 BSA hash timestamp certificate confirming black Pulsar motorcycle.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 4,
      leads: 3,
      timeline: 3
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-21T14:30:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Preserved forensic CCTV footage extraction with hash digest verification.',
        newIntegrityHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        fileSize: 891200,
        fileName: 'Traffic_ICCC_CCTV_Frame_Extract_ITO.pdf'
      }
    ]
  },
  {
    id: 'DOC-125-MED',
    caseId: 'LAW-2026-00125',
    fileName: 'RML_Hospital_Medico_Legal_Certificate_8492.pdf',
    documentType: 'Forensic Reports',
    fileSize: 312320,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Investigating Officer',
    uploadedAt: '2026-08-21T11:00:00.000Z',
    lastUpdated: '2026-08-21T11:00:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T11:45:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['MLC', 'RML Hospital', 'Forearm Contusion', 'Section 115 BNS'],
    notes: 'Dr. Neha Verma CMO, Dr. RML Hospital examined victim Aarav Malhotra. Diagnosed blunt contusion 4x2 cm with abrasion.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 3,
      leads: 1,
      timeline: 1
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-21T11:00:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Investigating Officer',
        changeDescription: 'Initial scan and SHA-256 seal of hospital emergency triage medico-legal certificate.',
        newIntegrityHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        fileSize: 312320,
        fileName: 'RML_Hospital_Medico_Legal_Certificate_8492.pdf'
      }
    ]
  },
  {
    id: 'DOC-125-CRT',
    caseId: 'LAW-2026-00125',
    fileName: 'Metropolitan_Magistrate_Search_Warrant_Order.pdf',
    documentType: 'Court Orders',
    fileSize: 286720,
    mimeType: 'application/pdf',
    uploadedBy: 'Sub-Inspector Neha Gupta',
    uploaderRole: 'Legal Officer',
    uploadedAt: '2026-08-22T10:30:00.000Z',
    lastUpdated: '2026-08-22T10:30:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-22T11:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Court Order', 'Patiala House Courts', 'Search Warrant', 'Sec 94 BNSS'],
    notes: 'Issued by Ld. Metropolitan Magistrate, Patiala House Courts authorizing search of premises in Trilokpuri under Section 94 BNSS 2023.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 2,
      leads: 2,
      timeline: 1
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-22T10:30:00.000Z',
        updatedBy: 'Sub-Inspector Neha Gupta',
        userRole: 'Legal Officer',
        changeDescription: 'Certified judicial warrant scan received from Patiala House Court Registry.',
        newIntegrityHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        fileSize: 286720,
        fileName: 'Metropolitan_Magistrate_Search_Warrant_Order.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-FIR',
    caseId: 'FIR-2026-088',
    fileName: 'FIR-2026-088-Registered.pdf',
    documentType: 'FIR',
    fileSize: 421888,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-20T19:35:00.000Z',
    lastUpdated: '2026-08-20T19:35:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T09:15:20.000Z',
    analysisStatus: 'Analyzed',
    tags: ['FIR', 'Snatching', 'Connaught Place', 'Section 304 BNS'],
    notes: 'Official CCTNS registered first information report signed by informant.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 4,
      leads: 3,
      timeline: 4
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T19:35:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Initial registration and upload of certified FIR PDF copy from CCTNS.',
        newIntegrityHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        fileSize: 421888,
        fileName: 'FIR-2026-088-Registered.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-CMP',
    caseId: 'FIR-2026-088',
    fileName: 'Aarav_Malhotra_Handwritten_Complaint.pdf',
    documentType: 'Complaint',
    fileSize: 250880,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-20T19:20:00.000Z',
    lastUpdated: '2026-08-20T19:20:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-20T21:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Handwritten', 'Complainant Statement', 'Gold Chain', 'iPhone 14 Pro'],
    notes: 'Written and signed by victim at Connaught Place Police Station duty officer desk.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 3,
      leads: 2,
      timeline: 3
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T19:20:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Initial scan of original signed complaint letter.',
        newIntegrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fileSize: 250880,
        fileName: 'Aarav_Malhotra_Handwritten_Complaint.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-STM',
    caseId: 'FIR-2026-088',
    fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh.pdf',
    documentType: 'Witness Statement',
    fileSize: 184320,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-20T22:15:00.000Z',
    lastUpdated: '2026-08-21T10:00:00.000Z',
    currentVersion: 'v1.1',
    sha256Hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T10:05:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Witness', 'Sec 180 BNSS', 'Tea Stall', 'Motorcycle Exhaust'],
    notes: 'Recorded under Section 180 BNSS 2023. Key eyewitness Ramesh observed getaway trajectory.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 2,
      leads: 3,
      timeline: 2
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T22:15:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Initial typed transcription of Section 180 BNSS statement.',
        newIntegrityHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        fileSize: 180224,
        fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh_v1.0.pdf'
      },
      {
        versionNumber: 'v1.1',
        timestamp: '2026-08-21T10:00:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Corrected stall landmark relative to Metro Pillar 142 and verified witness mobile number (+91 98711 54321).',
        previousIntegrityHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        newIntegrityHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        fileSize: 184320,
        fileName: 'Eyewitness_Statement_Shopkeeper_Ramesh.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-MLC',
    caseId: 'FIR-2026-088',
    fileName: 'RML_Hospital_Medico_Legal_Certificate_8492.pdf',
    documentType: 'Medical Report',
    fileSize: 327680,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-20T23:10:00.000Z',
    lastUpdated: '2026-08-20T23:10:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T08:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['MLC', 'RML Hospital', 'Forearm Contusion', 'Blunt Trauma'],
    notes: 'Certified by Emergency Medical Officer Dr. K. Verma. Confirms physical assault injury.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 2,
      leads: 1,
      timeline: 1
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T23:10:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Hospital certified MLC scan with medical officer stamp.',
        newIntegrityHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
        fileSize: 327680,
        fileName: 'RML_Hospital_Medico_Legal_Certificate_8492.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-SZR',
    caseId: 'FIR-2026-088',
    fileName: 'Seizure_Memo_Broken_Strap_RoadDebris.pdf',
    documentType: 'Seizure Record',
    fileSize: 199680,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-20T21:40:00.000Z',
    lastUpdated: '2026-08-20T21:40:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T12:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Seizure Memo', 'Panchnama', 'Sec 105 BNSS', 'Physical Evidence'],
    notes: 'Physical recovery of broken watch strap link and tire skid residue from scene of crime.',
    extractedEntitiesCount: {
      persons: 3,
      evidence: 3,
      leads: 2,
      timeline: 2
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-20T21:40:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'Panchnama seizure memo signed by 2 independent witnesses.',
        newIntegrityHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        fileSize: 199680,
        fileName: 'Seizure_Memo_Broken_Strap_RoadDebris.pdf'
      }
    ]
  },
  {
    id: 'DOC-088-CCTV',
    caseId: 'FIR-2026-088',
    fileName: 'Traffic_ICCC_CCTV_Frame_Extract_ITO.pdf',
    documentType: 'Evidence Record',
    fileSize: 593920,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Rajesh Sharma',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-21T12:30:00.000Z',
    lastUpdated: '2026-08-21T12:30:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-21T14:00:00.000Z',
    analysisStatus: 'Pending Analysis',
    tags: ['CCTV', 'Electronic Record', 'Sec 63 BSA', 'Getaway Motorcycle'],
    notes: 'Surveillance frames extracted from Delhi Traffic Police ICCC junction camera Cam-09.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 2,
      leads: 2,
      timeline: 1
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-21T12:30:00.000Z',
        updatedBy: 'Inspector Rajesh Sharma',
        userRole: 'Sub-Inspector',
        changeDescription: 'High-resolution still frame extraction with Section 63 BSA Certificate.',
        newIntegrityHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        fileSize: 593920,
        fileName: 'Traffic_ICCC_CCTV_Frame_Extract_ITO.pdf'
      }
    ]
  },
  {
    id: 'DOC-042-FIR',
    caseId: 'FIR-2026-042',
    fileName: 'FIR-2026-042-Draft.pdf',
    documentType: 'FIR',
    fileSize: 397312,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Sunita Rao',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-14T14:15:00.000Z',
    lastUpdated: '2026-08-14T14:15:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '8a6e34f71a0670d8a5775ff72d06152a514d48a1c97c1efbb6ec13689ad5d1d6',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-14T15:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['FIR', 'Forgery', 'Saket', 'Section 318 BNS'],
    notes: 'Commercial cheque fraud case at SBI Saket branch.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 3,
      leads: 2,
      timeline: 3
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-14T14:15:00.000Z',
        updatedBy: 'Inspector Sunita Rao',
        userRole: 'Sub-Inspector',
        changeDescription: 'Initial draft registration under Sections 318(4) & 336 BNS 2023.',
        newIntegrityHash: '8a6e34f71a0670d8a5775ff72d06152a514d48a1c97c1efbb6ec13689ad5d1d6',
        fileSize: 397312,
        fileName: 'FIR-2026-042-Draft.pdf'
      }
    ]
  },
  {
    id: 'DOC-042-BNK',
    caseId: 'FIR-2026-042',
    fileName: 'SBI_Branch_Incident_Report_Cheque004921.pdf',
    documentType: 'Police Report',
    fileSize: 296960,
    mimeType: 'application/pdf',
    uploadedBy: 'Inspector Sunita Rao',
    uploaderRole: 'Sub-Inspector',
    uploadedAt: '2026-08-14T16:20:00.000Z',
    lastUpdated: '2026-08-14T16:20:00.000Z',
    currentVersion: 'v1.0',
    sha256Hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    integrityStatus: 'Verified',
    lastIntegrityCheckAt: '2026-08-15T09:00:00.000Z',
    analysisStatus: 'Analyzed',
    tags: ['Bank Report', 'SBI', 'Cheque #004921', '₹14,50,000'],
    notes: 'Detailed incident report compiled by SBI Saket Branch Chief Manager.',
    extractedEntitiesCount: {
      persons: 2,
      evidence: 2,
      leads: 2,
      timeline: 2
    },
    versionHistory: [
      {
        versionNumber: 'v1.0',
        timestamp: '2026-08-14T16:20:00.000Z',
        updatedBy: 'Inspector Sunita Rao',
        userRole: 'Sub-Inspector',
        changeDescription: 'Bank incident report signed and certified by Branch Manager.',
        newIntegrityHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        fileSize: 296960,
        fileName: 'SBI_Branch_Incident_Report_Cheque004921.pdf'
      }
    ]
  }
];
