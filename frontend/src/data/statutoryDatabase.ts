export interface LandmarkCase {
  name: string;
  citation: string;
  court: string;
  year: string;
  ratio: string;
}

export interface LegislativeSection {
  id: string;
  act: 'BNS' | 'IPC' | 'BNSS' | 'CrPC' | 'BSA' | 'IEA' | 'IT Act' | 'POCSO';
  actFullName: string;
  sectionDisplay: string;
  sectionNumber: string;
  title: string;
  classification: string;
  isCognizable: boolean;
  isBailable: boolean;
  triableBy: string;
  concordanceDisplay: string;
  concordanceTargetId?: string;
  statutoryDefinition: string;
  ingredients: string[];
  punishment: string;
  investigativeNotes: string[];
  landmarkCases: LandmarkCase[];
  tags: string[];
}

export const STATUTORY_DATABASE: LegislativeSection[] = [
  // --- BHARATIYA NYAYA SANHITA (BNS 2023) ---
  {
    id: 'bns-103',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 103 BNS',
    sectionNumber: '103',
    title: 'Punishment for Murder',
    classification: 'Cognizable • Non-Bailable • Triable by Court of Session',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Court of Session',
    concordanceDisplay: 'Replaces Section 302 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-302',
    statutoryDefinition: 'Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. Under Sub-section (2), when a group of five or more persons acting in concert commits murder on grounds of race, caste, community, sex, place of birth, language, personal belief or any other similar ground, each member of such group shall be punished with death or with imprisonment for life, and shall also be liable to fine.',
    ingredients: [
      'Causing the death of a human being.',
      'The act by which the death is caused is done with the intention of causing death; or',
      'Done with the intention of causing such bodily injury as the offender knows to be likely to cause death of the person; or',
      'The bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death; or',
      'The act is so imminently dangerous that it must in all probability cause death.'
    ],
    punishment: 'Death or Imprisonment for Life, and mandatory fine.',
    investigativeNotes: [
      'Mandatory crime scene inspection by Forensic Expert under Section 176(3) BNSS.',
      'Mandatory audio-video electronic recording of search and seizure under Section 105 BNSS.',
      'Immediate requisition of Post-Mortem examination from Government Medical Officer.',
      'Weapon of offence recovery memo under Section 23 BSA (Sec 27 Evidence Act) with independent witnesses.'
    ],
    landmarkCases: [
      {
        name: 'Virsa Singh v. State of Punjab',
        citation: 'AIR 1958 SC 465',
        court: 'Supreme Court of India',
        year: '1958',
        ratio: 'Established the four-point test for third clause of Section 300 IPC (now Section 101/103 BNS): The injury must be intended and objectively sufficient in the ordinary course of nature to cause death.'
      },
      {
        name: 'Bachan Singh v. State of Punjab',
        citation: '(1980) 2 SCC 684',
        court: 'Supreme Court of India (Constitution Bench)',
        year: '1980',
        ratio: 'Death penalty should be awarded only in the "rarest of rare cases" when the alternative option of life imprisonment is unquestionably foreclosed.'
      }
    ],
    tags: ['murder', 'homicide', 'death', '103', '302', 'killing', 'fatal', 'lynching']
  },
  {
    id: 'bns-109',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 109 BNS',
    sectionNumber: '109',
    title: 'Attempt to Murder',
    classification: 'Cognizable • Non-Bailable • Triable by Court of Session',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Court of Session',
    concordanceDisplay: 'Replaces Section 307 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-307',
    statutoryDefinition: 'Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder, shall be punished with imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine; and if hurt is caused to any person by such act, the offender shall be liable either to imprisonment for life, or to such punishment as is hereinbefore mentioned.',
    ingredients: [
      'An act done towards the commission of murder.',
      'Act executed with specific intention or knowledge that if death ensued, the offender would be guilty of murder.',
      'Execution of act progressing beyond the stage of mere preparation.'
    ],
    punishment: 'Imprisonment up to 10 years and fine; if bodily hurt is caused, Imprisonment for Life or up to 10 years and fine.',
    investigativeNotes: [
      'Obtain Medico-Legal Certificate (MLC) specifying the exact dimension, depth, anatomical location, and danger index of injuries.',
      'Seize weapon of attack (firearm, sharp blade, heavy blunt instrument) with ballistic/forensic sealing.',
      'Record statements of eyewitnesses and attending trauma surgeons under Section 180 BNSS.'
    ],
    landmarkCases: [
      {
        name: 'State of Maharashtra v. Balram Bama Patil',
        citation: '(1983) 2 SCC 28',
        court: 'Supreme Court of India',
        year: '1983',
        ratio: 'It is not necessary that bodily injury capable of causing death should actually have been inflicted; intention to kill coupled with a step taken suffices.'
      }
    ],
    tags: ['attempt to murder', 'attempted murder', '109', '307', 'stabbing', 'shooting', 'assault']
  },
  {
    id: 'bns-303-2',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 303(2) BNS',
    sectionNumber: '303(2)',
    title: 'Theft (Punishment for Theft)',
    classification: 'Cognizable • Non-Bailable • Triable by Any Magistrate',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Any Magistrate',
    concordanceDisplay: 'Replaces Section 379 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-379',
    statutoryDefinition: 'Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both. For subsequent or petty theft under proviso, community service may also be awarded.',
    ingredients: [
      'Dishonest intention to take movable property.',
      'Property must be moved out of the possession of any person.',
      'Taking must be without that person\'s consent.',
      'There must be some moving of the property in order to accomplish the taking.'
    ],
    punishment: 'Imprisonment of either description for a term up to 3 years, or fine, or both.',
    investigativeNotes: [
      'Collect documentary proof of ownership (invoices, IMEI purchase bills, registration certificates).',
      'Preserve and extract CCTV footage of entry/exit routes with Section 63 BSA certificate.',
      'Execute seizure memo of recovered stolen assets in presence of independent punch witnesses.'
    ],
    landmarkCases: [
      {
        name: 'Pyare Lal Bhargava v. State of Rajasthan',
        citation: 'AIR 1963 SC 1094',
        court: 'Supreme Court of India',
        year: '1963',
        ratio: 'Even temporary removal of an office file/asset with intention of retaining it for illicit purpose constitutes completed theft.'
      }
    ],
    tags: ['theft', 'stolen', '303', '379', 'stealing', 'robbery', 'property']
  },
  {
    id: 'bns-304',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 304 BNS',
    sectionNumber: '304',
    title: 'Snatching (New Express Statutory Offence)',
    classification: 'Cognizable • Non-Bailable • Triable by Magistrate of First Class',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Magistrate of First Class',
    concordanceDisplay: 'Newly created distinct penal offence (Previously prosecuted under Sec 379/356 IPC)',
    statutoryDefinition: 'Theft is "snatching" if, in order to commit theft, the offender suddenly or quickly or forcibly seizes or secures or grabs or takes away from any person or from his possession any movable property. Whoever commits snatching shall be punished with imprisonment of either description for a term which may extend to three years, and shall also be liable to fine.',
    ingredients: [
      'Commission of theft of movable property.',
      'Sudden, quick, or forcible seizing, securing, grabbing, or taking away.',
      'Movable property taken directly from the physical person or immediate possession of the victim.'
    ],
    punishment: 'Imprisonment of either description for a term up to 3 years, and fine.',
    investigativeNotes: [
      'Preserve CCTV camera footage of escape vehicle (number plate, speed, direction).',
      'Conduct Test Identification Parade (TIP) under Section 54 BNSS before Judicial Magistrate.',
      'Trace IMEI/MAC address for snatched mobile devices across telecom network grids.'
    ],
    landmarkCases: [
      {
        name: 'Legislative Intent of BNS 2023 - Select Committee Report',
        citation: 'Parliamentary Standing Committee Report No. 246',
        court: 'Parliament of India',
        year: '2023',
        ratio: 'Section 304 was specially introduced in BNS to curb the rampant menace of street chain/mobile snatching with strict non-bailable categorization.'
      }
    ],
    tags: ['snatching', 'chain snatching', 'mobile snatching', '304', 'street crime', 'grab']
  },
  {
    id: 'bns-318-4',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 318(4) BNS',
    sectionNumber: '318(4)',
    title: 'Cheating and Dishonestly Inducing Delivery of Property',
    classification: 'Cognizable • Non-Bailable • Triable by Magistrate of First Class',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Magistrate of First Class',
    concordanceDisplay: 'Replaces Section 420 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-420',
    statutoryDefinition: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
    ingredients: [
      'Deception of any person by fraudulent or dishonest misrepresentation.',
      'Dishonestly inducing that person to deliver any property, funds, or valuable security.',
      'Fraudulent intention must exist at the very inception of the transaction.'
    ],
    punishment: 'Imprisonment of either description for a term which may extend to 7 years, and mandatory fine.',
    investigativeNotes: [
      'Freeze beneficiary bank accounts and payment gateway accounts immediately via 1930 / I4C cyber portal.',
      'Requisition Bank Account Statement, KYC, UTR transfer receipts, and IP logs under Section 94 BNSS.',
      'Obtain Section 63 BSA certificate for electronic transaction logs and chat screenshots.'
    ],
    landmarkCases: [
      {
        name: 'Hridaya Ranjan Prasad Verma v. State of Bihar',
        citation: '(2000) 4 SCC 168',
        court: 'Supreme Court of India',
        year: '2000',
        ratio: 'Distinction between mere breach of contract and cheating depends upon the intention of the accused at the time of inducement. Fraudulent intent at inception is a necessary condition.'
      },
      {
        name: 'Prof. R.K. Vijayasarathy v. Sudha Seetharam',
        citation: '(2019) 16 SCC 739',
        court: 'Supreme Court of India',
        year: '2019',
        ratio: 'Criminal proceedings for cheating cannot be used as an arm-twisting tool for recovery of purely civil disputes without dishonest deception.'
      }
    ],
    tags: ['cheating', 'fraud', '420', '318', '318(4)', 'scam', 'financial fraud', 'cyber fraud', 'deception']
  },
  {
    id: 'bns-64',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 64 BNS',
    sectionNumber: '64',
    title: 'Punishment for Rape',
    classification: 'Cognizable • Non-Bailable • Triable by Court of Session',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Court of Session',
    concordanceDisplay: 'Replaces Section 376 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-376',
    statutoryDefinition: 'Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine. Sub-section (2) provides enhanced minimum rigorous imprisonment of 20 years to life for aggravated forms.',
    ingredients: [
      'Penetrative sexual acts as defined under Section 63 BNS.',
      'Against victim\'s will, without consent, or with consent obtained under fear of death/hurt, false pretext, or unsoundness of mind.'
    ],
    punishment: 'Rigorous imprisonment of not less than 10 years, up to imprisonment for natural life, and fine.',
    investigativeNotes: [
      'Mandatory medical examination of victim by registered female medical practitioner within 24 hours under Section 51 BNSS (Sec 164A CrPC).',
      'Mandatory recording of victim statement under Section 183 BNSS (Sec 164 CrPC) before Judicial Magistrate, preferably woman Magistrate.',
      'Forensic biological kit preservation (DNA profiling, swab test) with strict chain of custody.'
    ],
    landmarkCases: [
      {
        name: 'State of Punjab v. Gurmit Singh',
        citation: '(1996) 2 SCC 384',
        court: 'Supreme Court of India',
        year: '1996',
        ratio: 'Sole testimony of victim is sufficient to convict if it inspires confidence, without requiring independent corroboration.'
      },
      {
        name: 'Aparna Bhat v. State of M.P.',
        citation: '2021 SCC OnLine SC 230',
        court: 'Supreme Court of India',
        year: '2021',
        ratio: 'Strict bar on imposing compromise conditions or misogynistic bail orders in sexual assault prosecutions.'
      }
    ],
    tags: ['rape', 'sexual assault', '64', '376', 'molestation', 'women safety']
  },
  {
    id: 'bns-115-2',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 115(2) BNS',
    sectionNumber: '115(2)',
    title: 'Voluntarily Causing Hurt',
    classification: 'Non-Cognizable • Bailable • Triable by Any Magistrate',
    isCognizable: false,
    isBailable: true,
    triableBy: 'Any Magistrate',
    concordanceDisplay: 'Replaces Section 323 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-323',
    statutoryDefinition: 'Whoever commits voluntarily causing hurt shall be punished with imprisonment of either description for a term which may extend to one year, or with fine which may extend to ten thousand rupees, or with both.',
    ingredients: [
      'Bodily pain, disease or infirmity caused to any person.',
      'The act was done with intention or knowledge of causing hurt.'
    ],
    punishment: 'Imprisonment up to 1 year, or fine up to ₹10,000, or both.',
    investigativeNotes: [
      'Procure primary medical report (MLC) from examining physician.',
      'Examine whether weapons/sharp instruments were used (which would attract Section 118 BNS / Sec 324 IPC).'
    ],
    landmarkCases: [
      {
        name: 'Jashanmal Jhamatmal v. Brahmanand Sarupanand',
        citation: 'AIR 1944 Sind 19',
        court: 'High Court',
        year: '1944',
        ratio: 'Nervous shock caused by intentional alarming or threatening act constitutes bodily hurt under criminal law.'
      }
    ],
    tags: ['hurt', 'assault', '115', '115(2)', '323', 'beating', 'physical injury']
  },
  {
    id: 'bns-351-2',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 351(2) BNS',
    sectionNumber: '351(2)',
    title: 'Criminal Intimidation',
    classification: 'Non-Cognizable (Simple) / Cognizable (Threat of Death) • Bailable',
    isCognizable: false,
    isBailable: true,
    triableBy: 'Any Magistrate',
    concordanceDisplay: 'Replaces Section 506 IPC (Indian Penal Code 1860)',
    concordanceTargetId: 'ipc-506',
    statutoryDefinition: 'Whoever commits criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both; and if the threat be to cause death or grievous hurt, or to cause the destruction of any property by fire, with imprisonment of either description for a term which may extend to seven years, or with fine, or with both.',
    ingredients: [
      'Threatening a person with injury to his person, reputation, or property.',
      'Intent to cause alarm to that person or cause him to do any act which he is not legally bound to do.'
    ],
    punishment: 'Simple: Imprisonment up to 2 years, or fine, or both. Aggravated (threat of death/grievous hurt): Imprisonment up to 7 years, or fine, or both.',
    investigativeNotes: [
      'Preserve audio voice notes, phone call logs, WhatsApp/SMS transcripts containing threats.',
      'Issue Section 63 BSA certificate for digital recording devices.'
    ],
    landmarkCases: [
      {
        name: 'Fiona Shrikhande v. State of Maharashtra',
        citation: '(2013) 14 SCC 44',
        court: 'Supreme Court of India',
        year: '2013',
        ratio: 'Mere abusive words without intention to cause alarm or real threat to cause injury do not constitute criminal intimidation.'
      }
    ],
    tags: ['intimidation', 'threat', '351', '506', 'blackmail', 'extortion threat']
  },
  {
    id: 'bns-85',
    act: 'BNS',
    actFullName: 'Bharatiya Nyaya Sanhita, 2023',
    sectionDisplay: 'Section 85 & 86 BNS',
    sectionNumber: '85',
    title: 'Husband or Relative of Husband Subjecting Woman to Cruelty',
    classification: 'Cognizable • Non-Bailable • Triable by Magistrate of First Class',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Magistrate of First Class',
    concordanceDisplay: 'Replaces Section 498A IPC (Indian Penal Code 1860)',
    statutoryDefinition: 'Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. Section 86 defines cruelty as willful conduct driving woman to suicide, grave bodily injury, or harassment for unlawful dowry demands.',
    ingredients: [
      'Woman subjected to cruelty by husband or relative of husband.',
      'Cruelty involves conduct driving to suicide or danger to life/limb, or harassment to coerce unlawful property/valuable security demand.'
    ],
    punishment: 'Imprisonment up to 3 years and mandatory fine.',
    investigativeNotes: [
      'Follow Arnesh Kumar & Section 35(3) BNSS notice protocol before making custodial arrest.',
      'Refer matter to Family Counseling Cell / District Mediation where appropriate without mechanically arresting distant in-laws.'
    ],
    landmarkCases: [
      {
        name: 'Arnesh Kumar v. State of Bihar',
        citation: '(2014) 8 SCC 273',
        court: 'Supreme Court of India',
        year: '2014',
        ratio: 'Strict curbs on automatic arrest in Section 498A cases; IO must record checklist of reasons and Magistrate must independently review before authorizing detention.'
      },
      {
        name: 'Kahkashan Kausar @ Sonam v. State of Bihar',
        citation: '(2022) 6 SCC 599',
        court: 'Supreme Court of India',
        year: '2022',
        ratio: 'General and omnibus allegations against in-laws without specific role cannot sustain prosecution.'
      }
    ],
    tags: ['cruelty', 'dowry', '498a', '85', '86', 'matrimonial harassment']
  },

  // --- BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS 2023) ---
  {
    id: 'bnss-173',
    act: 'BNSS',
    actFullName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionDisplay: 'Section 173 BNSS',
    sectionNumber: '173',
    title: 'Information in Cognizable Cases (FIR Registration & E-FIR)',
    classification: 'Procedural Mandate for Police Officers',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Statutory Procedure',
    concordanceDisplay: 'Replaces Section 154 Cr.P.C. 1973',
    concordanceTargetId: 'crpc-154',
    statutoryDefinition: 'Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing. Section 173 explicitly recognizes: (i) Electronic FIR (e-FIR), requiring signature within 3 days; (ii) Zero FIR, allowing registration irrespective of territorial jurisdiction; and (iii) Preliminary inquiry permissible only for offences punishable between 3 to 7 years for up to 14 days.',
    ingredients: [
      'Disclosure of commission of a cognizable offence.',
      'Mandatory entry in General Diary / CCTNS.',
      'Immediate supply of free copy of FIR to the informant.'
    ],
    punishment: 'Refusal to register cognizable FIR attracts penal prosecution under Section 199 BNS (Sec 166A IPC).',
    investigativeNotes: [
      'Zero FIR must be immediately registered and transferred to jurisdictional station within 24 hours.',
      'Preliminary inquiry is limited strictly to 14 days with approval of Deputy Superintendent of Police.',
      'Information given via electronic communication must be signed by complainant within 3 days.'
    ],
    landmarkCases: [
      {
        name: 'Lalita Kumari v. Govt. of U.P.',
        citation: '(2014) 2 SCC 1',
        court: 'Supreme Court of India (5-Judge Constitution Bench)',
        year: '2014',
        ratio: 'Registration of FIR is mandatory under Section 154 CrPC / 173 BNSS if the information discloses commission of a cognizable offence. No preliminary inquiry is permissible in such cases.'
      }
    ],
    tags: ['fir', '173', '154', 'zero fir', 'e-fir', 'mandatory fir', 'cognizable complaint']
  },
  {
    id: 'bnss-35',
    act: 'BNSS',
    actFullName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionDisplay: 'Section 35 BNSS',
    sectionNumber: '35',
    title: 'When Police May Arrest Without Warrant & Notice of Appearance',
    classification: 'Arrest Safeguards & Procedural Regulation',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Statutory Procedure',
    concordanceDisplay: 'Replaces Section 41 & Section 41A Cr.P.C. 1973',
    concordanceTargetId: 'crpc-41a',
    statutoryDefinition: 'Regulates police powers of arrest without warrant. For offences punishable with imprisonment up to seven years, arrest shall not be made automatically. Under Section 35(3), the police officer shall issue a notice of appearance directing the person against whom reasonable complaint is made to appear before him.',
    ingredients: [
      'Offences punishable with imprisonment for 7 years or less.',
      'Police officer must record satisfaction in writing that arrest is necessary to prevent further offence, tampering with evidence, or ensure attendance.',
      'Mandatory service of written Notice of Appearance within 14 days.'
    ],
    punishment: 'Departmental action and contempt of court for IOs making unauthorized arrests.',
    investigativeNotes: [
      'Fill up arrest checklist detailing reasons specified in Section 35(1)(b) BNSS.',
      'Serve Notice under Section 35(3) with proof of service / acknowledgment.',
      'If suspect complies with notice, arrest cannot be made without prior written permission of designated Superintendent of Police.'
    ],
    landmarkCases: [
      {
        name: 'Arnesh Kumar v. State of Bihar',
        citation: '(2014) 8 SCC 273',
        court: 'Supreme Court of India',
        year: '2014',
        ratio: 'Police officers must not arrest accused automatically when offence is punishable with imprisonment up to 7 years without satisfying the statutory checklist.'
      },
      {
        name: 'Satender Kumar Antil v. CBI',
        citation: '(2022) 10 SCC 51',
        court: 'Supreme Court of India',
        year: '2022',
        ratio: 'Non-compliance with Section 41/41A CrPC (now Section 35 BNSS) entitles accused to immediate bail without custody.'
      }
    ],
    tags: ['arrest', '35', '41a', 'notice of appearance', 'remand safeguards', 'safeguards']
  },
  {
    id: 'bnss-105',
    act: 'BNSS',
    actFullName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionDisplay: 'Section 105 BNSS',
    sectionNumber: '105',
    title: 'Recording of Search and Seizure through Audio-Video Electronic Means',
    classification: 'Mandatory Forensic Technology Safeguard',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Statutory Procedure',
    concordanceDisplay: 'Newly enacted statutory mandate under BNSS 2023',
    statutoryDefinition: 'The process of conducting search of a place or taking possession of any property, article or thing under Chapter VII or under Section 185 shall be recorded through audio-video electronic means, preferably by mobile phone, and the police officer shall prepare a list of all things seized in the course of such search and forward the recording without delay to the District Magistrate, Sub-divisional Magistrate or Judicial Magistrate First Class.',
    ingredients: [
      'Mandatory audio-video recording of search and seizure operations.',
      'Preparation of spot seizure memo signed by witnesses.',
      'Prompt transmission of electronic video recording to the jurisdictional Magistrate.'
    ],
    punishment: 'Inadmissibility of seizure memo and disciplinary scrutiny for failure to record.',
    investigativeNotes: [
      'Record continuous unedited video showing room entry, discovery of article, packing, and sealing.',
      'Secure SHA-256 cryptographic hash of video file immediately upon generation.',
      'Attach Section 63 BSA certificate signed by recording police officer.'
    ],
    landmarkCases: [
      {
        name: 'Statutory Implementation Directives',
        citation: 'MHA SOP on Digital Evidence under BNSS',
        court: 'Ministry of Home Affairs, Government of India',
        year: '2024',
        ratio: 'All investigating officers must ensure geo-tagged, time-stamped video recording of searches and seizures.'
      }
    ],
    tags: ['search', 'seizure', '105', 'videography', 'panchnama', 'electronic recording']
  },
  {
    id: 'bnss-176-3',
    act: 'BNSS',
    actFullName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionDisplay: 'Section 176(3) BNSS',
    sectionNumber: '176(3)',
    title: 'Mandatory Forensic Investigation for Heinous Offences',
    classification: 'Mandatory Investigation Protocol',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Statutory Procedure',
    concordanceDisplay: 'Newly enacted statutory reform under BNSS 2023',
    statutoryDefinition: 'On receipt of every information relating to the commission of an offence which is punishable for seven years or more, the officer in charge of a police station shall cause the forensic expert to visit the crime scene to collect forensic evidence in the offence and also cause videography of the process on mobile phone or any other electronic device.',
    ingredients: [
      'Offence punishable with 7 years imprisonment or more.',
      'Mandatory visit of Forensic Crime Scene Expert.',
      'Mandatory collection and packaging of forensic physical evidence.',
      'Mandatory videography of entire forensic collection process.'
    ],
    punishment: 'Defective investigation adverse inference if forensic visit omitted without valid cause.',
    investigativeNotes: [
      'Call Mobile Forensic Science Unit (MFSU) immediately upon FIR registration in major crimes.',
      'Cordon off scene of crime with forensic barrier tape.',
      'Ensure zero contamination of latent biological, ballistic, and trace evidence.'
    ],
    landmarkCases: [
      {
        name: 'Criminal Law Reform Directives',
        citation: 'Law Commission of India Directives on Scientific Investigation',
        court: 'Supreme Court & Law Commission',
        year: '2023',
        ratio: 'Scientific forensic corroboration is elevated to a statutory imperative to ensure higher conviction rates.'
      }
    ],
    tags: ['forensic', '176', '176(3)', 'crime scene', 'scientific evidence', 'forensic expert']
  },
  {
    id: 'bnss-187',
    act: 'BNSS',
    actFullName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionDisplay: 'Section 187 BNSS',
    sectionNumber: '187',
    title: 'Procedure When Investigation Cannot Be Completed in 24 Hours (Remand)',
    classification: 'Custodial Remand & Detention Regulation',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Judicial Magistrate',
    concordanceDisplay: 'Replaces Section 167 Cr.P.C. 1973',
    concordanceTargetId: 'crpc-167',
    statutoryDefinition: 'Regulates police custody and judicial detention. The Magistrate may authorize detention in police custody, which cannot exceed 15 days in whole, or in parts, at any time during the initial forty days (where investigation relates to offence punishable up to 10 years) or initial sixty days (where punishable with death, life imprisonment or >10 years).',
    ingredients: [
      'Accused produced before Magistrate within 24 hours of arrest.',
      'Police custody capped at 15 days maximum.',
      'Police custody can be staggered in parts during the first 40 or 60 days of total detention period.'
    ],
    punishment: 'Default / Statutory bail is mandatory on 60th or 90th day if charge-sheet is not filed.',
    investigativeNotes: [
      'Submit detailed Case Diary entries under Section 192 BNSS justifying need for custodial interrogation.',
      'Conduct mandatory medical check-up of accused before and after every police remand period.'
    ],
    landmarkCases: [
      {
        name: 'CBI v. Anupam J. Kulkarni',
        citation: '(1992) 3 SCC 141',
        court: 'Supreme Court of India (Overruled by BNSS § 187 text)',
        year: '1992',
        ratio: 'Under old CrPC, police custody was restricted only to initial 15 days from arrest. BNSS Section 187 now explicitly permits police custody in parts across 40/60 days.'
      },
      {
        name: 'Bikramjit Singh v. State of Punjab',
        citation: '(2020) 10 SCC 616',
        court: 'Supreme Court of India',
        year: '2020',
        ratio: 'Right to default bail under Section 167(2) / Section 187 BNSS is an indefeasible fundamental right under Article 21.'
      }
    ],
    tags: ['remand', '187', '167', 'police custody', 'default bail', '60 days', '90 days']
  },

  // --- BHARATIYA SAKSHYA ADHINIYAM (BSA 2023) ---
  {
    id: 'bsa-63',
    act: 'BSA',
    actFullName: 'Bharatiya Sakshya Adhiniyam, 2023',
    sectionDisplay: 'Section 63 BSA',
    sectionNumber: '63',
    title: 'Admissibility of Electronic Records & Mandatory Certificate',
    classification: 'Evidentiary Admissibility Standard',
    isCognizable: true,
    isBailable: false,
    triableBy: 'All Courts of Law',
    concordanceDisplay: 'Replaces Section 65B of Indian Evidence Act, 1872',
    concordanceTargetId: 'iea-65b',
    statutoryDefinition: 'Any information contained in an electronic record which is printed on paper, stored, recorded or copied in optical, magnetic, or electronic media produced by a device shall be deemed to be also a document. Section 63(4) provides that a certificate signed by a person occupying a responsible official position in relation to the operation of the relevant device shall be evidence of any matter stated in the certificate.',
    ingredients: [
      'Electronic record produced by computer system/device during period of regular lawful use.',
      'System was operating properly throughout the period.',
      'Mandatory certificate signed under Section 63(4) identifying electronic record and describing output manner.'
    ],
    punishment: 'Failure to file 63(4) certificate renders secondary electronic records strictly inadmissible.',
    investigativeNotes: [
      'Obtain Section 63 BSA certificate from CCTV owner, CDR telecom nodal officer, or server admin at time of seizure.',
      'Hash value verification (MD5 / SHA-256) must be documented in certificate schedule.',
      'Preserve original storage media in anti-static Faraday pouch.'
    ],
    landmarkCases: [
      {
        name: 'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal',
        citation: '(2020) 7 SCC 1',
        court: 'Supreme Court of India (3-Judge Bench)',
        year: '2020',
        ratio: 'The certificate under Section 65B(4) / Section 63(4) BSA is a condition precedent to the admissibility of evidence by way of electronic record.'
      },
      {
        name: 'Anvar P.V. v. P.K. Basheer',
        citation: '(2014) 10 SCC 473',
        court: 'Supreme Court of India',
        year: '2014',
        ratio: 'Electronic evidence can only be proved in accordance with the special provisions of Section 65B / Section 63 BSA, excluding general oral evidence.'
      }
    ],
    tags: ['electronic evidence', '63', '65b', 'cctv', 'certificate', 'digital evidence', 'cdr', 'hash']
  },

  // --- INDIAN PENAL CODE (IPC 1860) REFERENCE ENTRIES ---
  {
    id: 'ipc-302',
    act: 'IPC',
    actFullName: 'Indian Penal Code, 1860',
    sectionDisplay: 'Section 302 IPC',
    sectionNumber: '302',
    title: 'Punishment for Murder (Erstwhile Section)',
    classification: 'Cognizable • Non-Bailable • Triable by Court of Session',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Court of Session',
    concordanceDisplay: 'Now replaced by Section 103 BNS (Bharatiya Nyaya Sanhita 2023)',
    concordanceTargetId: 'bns-103',
    statutoryDefinition: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    ingredients: [
      'Causing death with intention of causing death or bodily injury sufficient in ordinary course of nature to cause death.'
    ],
    punishment: 'Death or Imprisonment for life, and fine.',
    investigativeNotes: [
      'Applicable for all offences committed prior to 1st July 2024.',
      'Charge-sheet for past offences must cite IPC 302 read with General Clauses Act savings.'
    ],
    landmarkCases: [
      {
        name: 'State of U.P. v. Ram Swarup',
        citation: '(1974) 4 SCC 764',
        court: 'Supreme Court of India',
        year: '1974',
        ratio: 'Proof of motive is not indispensable where direct eyewitness testimony is cogent and credible.'
      }
    ],
    tags: ['302', 'ipc 302', 'murder', 'killing']
  },
  {
    id: 'ipc-420',
    act: 'IPC',
    actFullName: 'Indian Penal Code, 1860',
    sectionDisplay: 'Section 420 IPC',
    sectionNumber: '420',
    title: 'Cheating and Dishonestly Inducing Delivery of Property (Erstwhile Section)',
    classification: 'Cognizable • Non-Bailable • Triable by Magistrate 1st Class',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Magistrate 1st Class',
    concordanceDisplay: 'Now replaced by Section 318(4) BNS (Bharatiya Nyaya Sanhita 2023)',
    concordanceTargetId: 'bns-318-4',
    statutoryDefinition: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, shall be punished with imprisonment for a term up to seven years and fine.',
    ingredients: [
      'Deception and dishonest inducement to deliver property or alter valuable security.'
    ],
    punishment: 'Imprisonment up to 7 years and fine.',
    investigativeNotes: [
      'Applicable to incidents occurring prior to 1st July 2024.'
    ],
    landmarkCases: [
      {
        name: 'Vesa Holdings Pvt. Ltd. v. State of Kerala',
        citation: '(2015) 8 SCC 293',
        court: 'Supreme Court of India',
        year: '2015',
        ratio: 'Every breach of contract does not give rise to criminal cheating unless fraudulent intent was present ab initio.'
      }
    ],
    tags: ['420', 'ipc 420', 'cheating', 'fraud']
  },
  {
    id: 'ipc-379',
    act: 'IPC',
    actFullName: 'Indian Penal Code, 1860',
    sectionDisplay: 'Section 379 IPC',
    sectionNumber: '379',
    title: 'Punishment for Theft (Erstwhile Section)',
    classification: 'Cognizable • Non-Bailable • Triable by Any Magistrate',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Any Magistrate',
    concordanceDisplay: 'Now replaced by Section 303(2) BNS (Bharatiya Nyaya Sanhita 2023)',
    concordanceTargetId: 'bns-303-2',
    statutoryDefinition: 'Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
    ingredients: ['Dishonest removal of movable property out of possession without consent.'],
    punishment: 'Imprisonment up to 3 years, or fine, or both.',
    investigativeNotes: ['Historical offences prior to 1st July 2024.'],
    landmarkCases: [
      {
        name: 'K.N. Mehra v. State of Rajasthan',
        citation: 'AIR 1957 SC 369',
        court: 'Supreme Court of India',
        year: '1957',
        ratio: 'Unauthorized taking of aircraft on flight without authority constituted completed theft.'
      }
    ],
    tags: ['379', 'ipc 379', 'theft']
  },
  {
    id: 'ipc-376',
    act: 'IPC',
    actFullName: 'Indian Penal Code, 1860',
    sectionDisplay: 'Section 376 IPC',
    sectionNumber: '376',
    title: 'Punishment for Rape (Erstwhile Section)',
    classification: 'Cognizable • Non-Bailable • Triable by Court of Session',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Court of Session',
    concordanceDisplay: 'Now replaced by Section 64 BNS (Bharatiya Nyaya Sanhita 2023)',
    concordanceTargetId: 'bns-64',
    statutoryDefinition: 'Punishment for rape: Rigorous imprisonment not less than 10 years extending to life, and fine.',
    ingredients: ['Sexual intercourse without consent or against will.'],
    punishment: 'Rigorous imprisonment 10 years to Life, and fine.',
    investigativeNotes: ['Applicable for offences prior to July 2024.'],
    landmarkCases: [
      {
        name: 'Mukesh v. State (NCT of Delhi)',
        citation: '(2017) 6 SCC 1',
        court: 'Supreme Court of India',
        year: '2017',
        ratio: 'Concurrence of brutal aggravated circumstances justified highest punishment.'
      }
    ],
    tags: ['376', 'ipc 376', 'rape']
  },
  {
    id: 'crpc-154',
    act: 'CrPC',
    actFullName: 'Code of Criminal Procedure, 1973',
    sectionDisplay: 'Section 154 Cr.P.C.',
    sectionNumber: '154',
    title: 'Information in Cognizable Cases (Erstwhile Section)',
    classification: 'Statutory Procedure',
    isCognizable: true,
    isBailable: false,
    triableBy: 'Police Procedure',
    concordanceDisplay: 'Now replaced by Section 173 BNSS (Bharatiya Nagarik Suraksha Sanhita 2023)',
    concordanceTargetId: 'bnss-173',
    statutoryDefinition: 'Every information relating to the commission of a cognizable offence given to an officer in charge of a police station shall be reduced to writing and signed by the person giving it.',
    ingredients: ['Cognizable offence disclosure mandates FIR recording.'],
    punishment: 'Statutory procedural obligation.',
    investigativeNotes: ['Replaced by BNSS 173 with new electronic & Zero FIR mandates.'],
    landmarkCases: [
      {
        name: 'Lalita Kumari v. Govt. of U.P.',
        citation: '(2014) 2 SCC 1',
        court: 'Supreme Court of India',
        year: '2014',
        ratio: 'Mandatory FIR registration on disclosure of cognizable crime.'
      }
    ],
    tags: ['154', 'crpc 154', 'fir']
  },
  {
    id: 'iea-65b',
    act: 'IEA',
    actFullName: 'Indian Evidence Act, 1872',
    sectionDisplay: 'Section 65B Evidence Act',
    sectionNumber: '65B',
    title: 'Admissibility of Electronic Records (Erstwhile Section)',
    classification: 'Evidentiary Admissibility Standard',
    isCognizable: true,
    isBailable: false,
    triableBy: 'All Courts',
    concordanceDisplay: 'Now replaced by Section 63 BSA (Bharatiya Sakshya Adhiniyam 2023)',
    concordanceTargetId: 'bsa-63',
    statutoryDefinition: 'Special provisions regarding admissibility of electronic records and requirement of certificate under Section 65B(4).',
    ingredients: ['Electronic record admissibility subject to 65B(4) certification.'],
    punishment: 'Inadmissibility in evidence.',
    investigativeNotes: ['Replaced by BSA Section 63 with enhanced digital standards.'],
    landmarkCases: [
      {
        name: 'Arjun Panditrao Khotkar',
        citation: '(2020) 7 SCC 1',
        court: 'Supreme Court of India',
        year: '2020',
        ratio: 'Mandatory nature of electronic evidence certification affirmed.'
      }
    ],
    tags: ['65b', 'electronic evidence', 'certificate']
  }
];

// Quick index lookup
export function findStatutorySection(queryOrSectionNumber: string, actHint?: string): LegislativeSection | null {
  const clean = queryOrSectionNumber.toLowerCase().replace(/[^a-z0-9()]/g, '');
  
  // 1. Direct ID match
  const direct = STATUTORY_DATABASE.find(s => s.id.toLowerCase() === clean);
  if (direct) return direct;

  // 2. Extract number
  const numMatch = queryOrSectionNumber.match(/(\d+[A-Z]?(?:\(\d+[a-z]?\))?)/i);
  const num = numMatch ? numMatch[1].toLowerCase() : clean;

  // 3. Match by section number & act
  if (actHint) {
    const actUpper = actHint.toUpperCase();
    const matchWithAct = STATUTORY_DATABASE.find(s => 
      s.act === actUpper && (s.sectionNumber.toLowerCase() === num || s.id.toLowerCase().includes(num))
    );
    if (matchWithAct) return matchWithAct;
  }

  // 4. Match section number or section display
  const matchNum = STATUTORY_DATABASE.find(s => 
    s.sectionNumber.toLowerCase() === num || 
    s.sectionDisplay.toLowerCase().includes(num) ||
    s.tags.includes(num)
  );
  if (matchNum) return matchNum;

  // 5. Match by tag
  const tagMatch = STATUTORY_DATABASE.find(s => s.tags.some(t => queryOrSectionNumber.toLowerCase().includes(t)));
  return tagMatch || null;
}
