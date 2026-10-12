export interface SampleCaseDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string;
  rawText: string;
  pages: number;
}

export const SAMPLE_CASE_DOCUMENTS: SampleCaseDocument[] = [
  {
    id: 'sample-fir-armed-burglary',
    title: 'FIR No. 204/2026 - Armed Burglary & Extortion',
    category: 'FIR / Cognizable Deposition',
    fileName: 'FIR_204_2026_Armed_Robbery_Extortion.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1420500,
    pages: 2,
    description: 'Police Station Central Kotwali FIR record detailing midnight interception, getaway vehicle registration, Axis Bank CCTV clue, and contradictory PCR dispatch timestamps.',
    rawText: `FIRST INFORMATION REPORT
(Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023)
State: Delhi | District: Central | Police Station: Kotwali
FIR No: 0204/2026 | Date: 14/09/2026 | Time of Registration: 23:45 hrs
Book No: VII | General Diary Reference No: 44-A

1. COMPLAINANT / INFORMANT PARTICULARS:
Name: Vikramaditya Roy, S/o Late Sh. B.K. Roy
Age: 38 Years | Nationality: Indian | Occupation: Merchant / Jeweller
Address: Flat 402, Shivalik Enclave, Barakhamba Road, New Delhi - 110001
Contact Mobile: +91 98101 44320 | Email: vroy.jewels@gmail.com

2. DETAILS OF ACCUSED / SUSPECTS:
Two unidentified male persons, aged approximately 25-30 years. 
Perpetrator #1: Height ~5'9", wearing dark navy hoodie, muffled face with black scarf, speaking accented Hindi. Brandished sharp metallic weapon (suspected curved kukri/knife).
Perpetrator #2: Height ~5'6", athletic build, wearing grey jacket, beige trousers. Carried heavy black duffle bag.

3. LOCUS DELICTI (SCENE OF CRIME):
Service Lane adjacent to Axis Bank ATM, Connaught Circus Outer Ring, Block M, New Delhi.
Distance from Police Station: 1.8 Kilometers East.

4. NARRATIVE FACTUAL DEPOSITION:
"On the night of 14th September 2026, I was returning from my commercial showroom located at Karol Bagh after closing inventory. At approximately 10:30 PM (22:30 hrs), I parked my motor vehicle near the Axis Bank ATM booth to withdraw cash. As I stepped out of the ATM vestibule, two men cornered me in the shadowed service lane.

Perpetrator #1 produced a curved dagger-like weapon, held it to my ribs, and uttered verbal threats stating: 'Chup chaap bag aur phone de, nahi toh yahi khatam kar denge' (Surrender your bag and phone quietly or we will finish you here). Perpetrator #2 forcibly snatched my leather briefcase containing cash sales amounting to ₹4,85,000 (Rupees Four Lakh Eighty Five Thousand Only) and my personal mobile handset, a Samsung Galaxy S22 Ultra (Black, 256GB, IMEI: 864920048192019).

Immediately upon snatching the property, both perpetrators sprinted across the boulevard and boarded a waiting silver-colored Maruti Suzuki Swift hatchback bearing registration plate number DL 3C AB 4921 which sped away towards Minto Bridge flyover."

[NOTE ON PCR DIAL 112 DISPATCH LOG]:
General Diary entry 44-B records that Emergency Call 112 was received from bystander phone at 11:15 PM (23:15 hrs) stating an altercation just concluded 5 minutes earlier. (Possible inconsistency of approximately 45 minutes between complainant narrative and PCR dispatch time requiring officer clarification).

5. EVIDENCE & CLUES RECORDED:
- Physical Scene: Axis Bank ATM entrance is equipped with two hemispherical dome CCTV cameras (Camera Axis-01 facing outer walkway and Camera Axis-02 facing street).
- Witness Mentioned: Mr. Rameshwar Singh (Tea Stall vendor, Stall #12, near M Block crossing) who witnessed the silver car accelerating away.
- Digital Property: Samsung Galaxy S22 Ultra IMEI 864920048192019; active Airtel SIM +91 98101 44320.
- Presumed escape corridor: Minto Bridge junction towards Kamla Market.

6. ACTION TAKEN & STATUTORY PROVISIONS:
Offences disclosing cognizable commission under Section 309(4) (Robbery with attempt to cause death/grievous hurt), Section 305 (Theft), Section 351(2) (Criminal Intimidation) of Bharatiya Nyaya Sanhita (BNS) 2023 read with Section 173 BNSS 2023.

Sd/-
(Vikramaditya Roy)
Deponent / Informant

Investigating Officer: SI Anand Prakash, P.S. Kotwali, Delhi Police
Badge No: D-4821`
  },
  {
    id: 'sample-complaint-cyber-fraud',
    title: 'Written Complaint - Cyber Siphoning & Fraud',
    category: 'Citizen Written Complaint',
    fileName: 'Complaint_Cyber_Fraud_Siphoning_Ananya_Sharma.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 890200,
    pages: 2,
    description: 'Complaint alleging unauthorized remote screen takeover, bank siphoning of ₹3,40,000, call spoofing (+91 98765 11029), and contradictory bank debit timestamps.',
    rawText: `TO THE STATION HOUSE OFFICER
Cyber Crime Police Station, North District, Civil Lines, Delhi - 110054

SUBJECT: Formal complaint regarding fraudulent digital siphoning of ₹3,40,000 via spoofed banking call and remote access application.

Respected Sir,
I, Smt. Ananya Sharma, aged 32 years, W/o Sh. Kunal Sharma, resident of H.No. 88, Banarsidas Estate, Timarpur, Delhi (Mobile: +91 98711 02934), wish to bring to your immediate notice a cyber fraud committed against my savings account on 12th September 2026.

1. SEQUENCE OF EVENTS:
At around 14:15 hrs on 12/09/2026, I received a phone call from mobile number +91 98765 11029. The caller introduced himself as 'Rahul Mehta, KYC Verification Officer, HDFC Bank Cards Division'. He stated that my debit card had been blocked due to pending re-KYC compliance under Reserve Bank of India directives.

Under the pretext of assisting me with online biometric validation, he instructed me to install an application named 'QuickSupport APK' from a link sent via SMS. He subsequently asked me to read out a 9-digit session code displayed on my phone screen.

2. FRAUDULENT TRANSACTIONS:
Within four minutes of sharing the code, my phone screen went dim. When I regained control, I discovered multiple unauthorized IMPS debits:
- Txn ID: IMPS/625514092182 - ₹1,00,000 transferred to Beneficiary 'S.K. Enterprises', A/c No. 9182746192, Bank of Baroda, Jamtara Branch.
- Txn ID: IMPS/625514092199 - ₹1,40,000 transferred to same account.
- Txn ID: IMPS/625514092210 - ₹1,00,000 transferred to UPI VPA 'fastpaymerchant@ybl'.
Total Amount Defrauded: ₹3,40,000 (Rupees Three Lakh Forty Thousand Only).

[TIMESTAMP DISCREPANCY RECORDED]:
Bank account statement shows transactions processed at 15:42 hrs, whereas the spoofed incoming call logs from the telecom operator reflect call duration between 14:15 hrs and 14:28 hrs. Officer verification required to ascertain why debits occurred over 70 minutes after the active phone conversation.

3. EVIDENCE SUBMITTED:
- PDF Bank Account Mini-Statement showing IMPS transaction reference IDs.
- Call detail screenshot of incoming call from +91 98765 11029.
- APK installation log file on my OnePlus 11 mobile phone.

4. REQUESTED INVESTIGATIVE LEADS:
- Freeze beneficiary account 9182746192 with Bank of Baroda under Section 106 BNSS 2023.
- Requisition IPDR and subscriber details for calling number +91 98765 11029 from telecom provider.
- Issue notice under Section 63 BSA 2023 to payment gateway for UPI merchant handle 'fastpaymerchant@ybl'.

Yours faithfully,
Sd/-
(Ananya Sharma)
Date: 13/09/2026`
  },
  {
    id: 'sample-mlc-injury-report',
    title: 'Medico-Legal Injury Report (MLC No. 892/2026)',
    category: 'Forensic / Medical MLC',
    fileName: 'MLC_892_2026_Civil_Hospital_Assault_Trauma.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 940000,
    pages: 1,
    description: 'Hospital casualty MLC document detailing blunt trauma, lacerations, clinical diagnosis, weapon type (iron rod), and doctor signature authentication.',
    rawText: `DEPARTMENT OF FORENSIC MEDICINE & CASUALTY
GOVERNMENT CIVIL HOSPITAL & TRAUMA CENTRE
MEDICO-LEGAL EXAMINATION REPORT (MLC)

MLC No: 892 / 2026 | Date of Examination: 10/09/2026 | Time: 21:10 hrs
Brought By: Constable Rakesh Kumar, Belt No. 642, P.S. Model Town
Police Reference: DD No. 22-A, dated 10/09/2026

1. INJURED PERSON PARTICULARS:
Name: Devendra Nath Pandey, S/o Late Shri Jagat Pandey
Age: 44 Years | Sex: Male | Caste/Religion: Hindu
Occupation: Auto-Rickshaw Driver | Residing: Jhuggi No. 412, Azadpur, Delhi
Identification Marks: 
(i) Old 2cm scar over right eyebrow.
(ii) Mole over left clavicle.

2. ALLEGED HISTORY OF ASSAULT:
Patient states he was assaulted near Azadpur Fruit Mandi Gate No. 3 at approximately 19:45 hrs on 10/09/2026 by 3 individuals following a parking dispute. Alleged weapon used: Heavy cylindrical iron pipe / rod.

3. CLINICAL EXAMINATION & INJURIES:
General Condition: Conscious, oriented to time and place. Pulse: 88/min, BP: 138/84 mmHg. Pupils bilateral equal and reacting to light. Smelled faintly of alcohol (Blood alcohol sample drawn and preserved for FSL toxicological testing).

Injury No. 1: Incised-looking lacerated wound measuring 4.5 cm x 0.8 cm x bone deep over left fronto-parietal region of scalp. Fresh active bleeding present. Margins irregular and contused.
Injury No. 2: Bluish-purple contusion measuring 12 cm x 3 cm over left scapular region of upper back, consistent with impact from a blunt cylindrical object (iron rod).
Injury No. 3: Abrasion measuring 2 cm x 1.5 cm over right dorsal forearm with surrounding subcutaneous edema.

4. OPINION REGARDING INJURIES:
- Nature of Injuries: Injury No. 1 is grievous subject to radiological X-Ray findings of skull; Injury No. 2 and 3 are simple in nature.
- Kind of Weapon: Blunt weapon of force (such as solid iron rod / lathi).
- Duration of Injuries: Fresh, within 2 to 4 hours prior to medical examination.

5. SAMPLES PRESERVED:
(a) Patient's torn, blood-stained cotton shirt sealed in tamper-evident forensic envelope #FSL-MLC-892-A.
(b) Blood sample for group and alcohol estimation.

Missing Information: Non-Contrast CT (NCCT) Brain scan report awaited from radiologist to confirm fracture of parietal bone.

Examined by:
Sd/- [Presence of medical officer signature verified]
Dr. S. K. Mahapatra, MBBS, MD (Forensic Medicine)
Casualty Medical Officer (CMO), Regn No. DMC-44912`
  }
];
