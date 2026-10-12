export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DocumentClassificationType =
  | 'FIR'
  | 'Victim Statements'
  | 'Witness Statements'
  | 'Evidence Records'
  | 'Forensic Reports'
  | 'Court Orders'
  | 'Investigation Notes'
  | 'Complaint'
  | 'Witness Statement'
  | 'Medical Report'
  | 'Evidence Record'
  | 'Seizure Record'
  | 'Investigation Note'
  | 'Police Report'
  | 'Unknown / Other';

export type EntityRole =
  | 'Complainant'
  | 'Victim'
  | 'Suspect / Accused'
  | 'Witness'
  | 'Police Personnel'
  | 'Medical Personnel'
  | 'Organization'
  | 'Role unclear';

export interface KeyFact {
  id: string;
  label: string;
  fact: string;
  category: 'Incident' | 'Location' | 'Date' | 'Time' | 'Reported Loss' | 'Injuries' | 'Sequence' | 'Other';
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedPerson {
  id: string;
  name: string;
  role: EntityRole;
  address?: string;
  contactDetails?: string;
  description?: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedVehicle {
  id: string;
  registrationNumber: string;
  makeModelColor?: string;
  associatedPersonOrAction?: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedLocation {
  id: string;
  name: string;
  address?: string;
  significance: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedProperty {
  id: string;
  item: string;
  description?: string;
  reportedValue?: string;
  serialOrImei?: string;
  status: 'Reported Stolen' | 'Damaged' | 'Seized' | 'Mentioned';
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface PotentialEvidenceReference {
  id: string;
  evidenceReference: string;
  category: 'Digital' | 'Physical / Biological' | 'Documentary' | 'Weapon' | 'Financial';
  whyRelevant: string;
  whereMentioned: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface PotentialInvestigativeLead {
  id: string;
  lead: string;
  reasonForRelevance: string;
  supportingDocumentInfo: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface DocTimelineEvent {
  id: string;
  date: string;
  time: string; // e.g. "10:15 PM" or "Time not specified"
  event: string;
  sourcePage: string | number;
  sourceSnippet: string;
  confidence: ConfidenceLevel;
}

export interface VerificationInconsistency {
  id: string;
  type: 'Conflicting Times' | 'Conflicting Dates' | 'Inconsistent Locations' | 'Different Name Spellings' | 'Discrepant Amounts' | 'Contradictory Statement';
  description: string;
  sourcePages: string[];
  sourceSnippet: string;
  recommendation: string;
  status: 'Unresolved' | 'Verified' | 'Dismissed';
}

export interface MissingInformationItem {
  id: string;
  item: string;
  category: string;
  whyImportant: string;
  potentialSource: string;
}

export interface LegalContextProvision {
  id: string;
  section: string;
  act: string;
  reasonRelevant: string;
  supportingFacts: string[];
  confidence: ConfidenceLevel;
}

export interface EvidenceLegalMapping {
  id: string;
  evidenceItem: string;
  potentialRelevance: string;
  supportsReviewOf: string;
  sourcePage: string;
}

export interface CaseRelationship {
  id: string;
  source: string;
  target: string;
  relation: string;
  type: 'person-person' | 'person-vehicle' | 'person-property' | 'location-evidence' | 'incident-person';
}

export interface InvestigationChecklistItem {
  id: string;
  task: string;
  reason: string;
  completed: boolean;
  sourcePage?: string;
}

export interface ExtractedOCRPage {
  pageNumber: number;
  pageTitle: string;
  text: string;
  confidence: ConfidenceLevel;
  hasSignature: boolean;
  signatureNotes?: string;
  lowConfidenceNotes?: string;
}

export interface CaseDocumentIntelligenceResult {
  documentId: string;
  caseId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount: number;
  pagesProcessed: string;
  analyzedAt: string;
  detectedDocumentType: {
    type: DocumentClassificationType;
    confidence: ConfidenceLevel;
    rationale: string;
  };
  caseSummary: {
    whatHappened: string;
    whereHappened: string;
    whenHappened: string;
    personsMentioned: string;
    allegedActions: string;
    propertyInvolved: string;
    reportedInjuriesDamage: string;
    sequenceSummary: string;
  };
  keyFacts: KeyFact[];
  persons: ExtractedPerson[];
  vehicles: ExtractedVehicle[];
  locations: ExtractedLocation[];
  property: ExtractedProperty[];
  evidenceReferences: PotentialEvidenceReference[];
  potentialLeads: PotentialInvestigativeLead[];
  timeline: DocTimelineEvent[];
  inconsistencies: VerificationInconsistency[];
  missingInformation: MissingInformationItem[];
  legalContext: LegalContextProvision[];
  evidenceToLegalMapping: EvidenceLegalMapping[];
  relationshipMap: CaseRelationship[];
  investigationChecklist: InvestigationChecklistItem[];
  ocrPages: ExtractedOCRPage[];
  overallConfidence: ConfidenceLevel;
  warnings: string[];
}

export interface DocumentVersionRecord {
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  timestamp: string;
  updatedBy: string;
  userRole: string;
  changeDescription: string;
  previousIntegrityHash?: string;
  newIntegrityHash: string;
  fileSize?: number;
  fileName?: string;
}

export type DocumentVersionItem = DocumentVersionRecord;

export type AnalysisStatus = 'Analyzed' | 'Pending Analysis' | 'Processing' | 'Failed';

export interface CaseDocumentVaultItem {
  id: string;
  caseId: string;
  fileName: string;
  documentType: DocumentClassificationType;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploaderRole: string;
  uploadedAt: string;
  lastUpdated: string;
  currentVersion: string; // e.g. "v1.0"
  sha256Hash: string;
  integrityStatus: 'Verified' | 'Integrity Check Failed' | 'Pending Verification';
  lastIntegrityCheckAt?: string;
  analysisStatus: AnalysisStatus;
  intelligenceResult?: CaseDocumentIntelligenceResult;
  versionHistory: DocumentVersionRecord[];
  extractedEntitiesCount?: {
    persons: number;
    evidence: number;
    leads: number;
    timeline: number;
  };
  notes?: string;
  tags?: string[];
}

export interface CrossDocumentComparisonResult {
  caseId: string;
  comparedDocuments: Array<{
    documentId: string;
    fileName: string;
    documentType: string;
  }>;
  analyzedAt: string;
  commonFacts: Array<{
    id: string;
    fact: string;
    supportedByDocs: string[];
    confidence: ConfidenceLevel;
  }>;
  newInformationPerDoc: Array<{
    documentName: string;
    uniqueFacts: string[];
  }>;
  inconsistencies: Array<{
    id: string;
    topic: string;
    description: string;
    documentA: { name: string; statement: string; page?: string };
    documentB: { name: string; statement: string; page?: string };
    officerGuidance: string;
  }>;
  combinedEvidenceReferences: Array<{
    id: string;
    evidence: string;
    category: string;
    sourceDocs: string[];
    whyRelevant: string;
  }>;
  potentialLeads: Array<{
    id: string;
    lead: string;
    relevance: string;
    sourceDocuments: string[];
    confidence: ConfidenceLevel;
  }>;
  missingInformation: Array<{
    id: string;
    item: string;
    whyImportant: string;
    suggestedInquiry: string;
  }>;
  crossTimeline: Array<{
    id: string;
    timestamp: string;
    event: string;
    sourceDoc: string;
    sourcePage?: string;
  }>;
  summarySynthesis: string;
}

export interface SmartSearchResultItem {
  documentId: string;
  caseId: string;
  fileName: string;
  documentType: DocumentClassificationType;
  uploadedAt: string;
  matchedField: string;
  highlightedSnippet: string;
  sourcePage?: string | number;
  relevanceScore: number;
  matchedEntities: string[];
  sha256Hash: string;
  integrityStatus: 'Verified' | 'Integrity Check Failed' | 'Pending Verification';
}

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  actionType: string;
  actionLabel: string;
  caseId?: string;
  documentId?: string;
  documentName?: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  metadata?: Record<string, any>;
}

// Case Relationship Graph Models
export type RelationshipNodeType =
  | 'Case'
  | 'Victim'
  | 'Suspect'
  | 'Witness'
  | 'Evidence'
  | 'CCTV'
  | 'Vehicle'
  | 'Phone'
  | 'Location'
  | 'Forensic Report'
  | 'Investigation Report'
  | 'Court Document'
  | 'Legal Sections';

export interface RelationshipNode {
  id: string;
  label: string;
  type: RelationshipNodeType;
  sourceDoc?: string;
  confidence: ConfidenceLevel;
  facts?: string[];
  details?: string;
  x?: number;
  y?: number;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  sourceDocument: string;
  confidence: ConfidenceLevel;
  inferred: boolean;
}

export interface CaseRelationshipGraph {
  caseId: string;
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  lastUpdated: string;
}

// Chain of Custody Models
export type CustodyActionType =
  | 'CREATED'
  | 'UPLOADED'
  | 'VIEWED'
  | 'TRANSFERRED'
  | 'RECEIVED'
  | 'ANALYZED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'ARCHIVED';

export interface ChainOfCustodyEvent {
  id: string;
  evidenceId: string;
  caseId: string;
  fromUser: string;
  fromRole: string;
  toUser?: string;
  toRole?: string;
  action: CustodyActionType;
  timestamp: string;
  notes: string;
  integrityHash: string;
  status: 'Completed' | 'Pending Acceptance' | 'Rejected';
}

// Document Completeness Models
export interface DocumentCompletenessItem {
  id: string;
  category: DocumentClassificationType | string;
  label: string;
  mandatory: boolean;
  status: 'Available' | 'Missing';
  statutoryBasis: string;
  notes: string;
  matchedDocumentId?: string;
}

export interface CaseCompletenessResult {
  caseId: string;
  crimeType: string;
  completenessPercentage: number;
  requiredDocuments: DocumentCompletenessItem[];
  isComplete: boolean;
  pendingReviewCount: number;
}

// Smart Case Summary Model
export interface SmartCaseSummary {
  caseId: string;
  summary: string;
  crimeType: string;
  victim: string;
  suspect: string;
  evidenceCount: number;
  witnessCount: number;
  forensicCount: number;
  legalSectionsCount: number;
  latestUpdate: string;
  pendingDocuments: number;
  lastGenerated: string;
  sourcesUsed: string[];
  confidence: ConfidenceLevel;
}

// Duplicate Detection Result Model
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isExact: boolean;
  similarityPercentage: number;
  matchedDocument?: {
    id: string;
    caseId: string;
    fileName: string;
    uploadedAt: string;
    sha256Hash: string;
  };
  reason: string;
}

// Case Timeline Item Model
export interface CaseTimelineItem {
  id: string;
  caseId: string;
  event: string;
  date: string;
  time?: string;
  sourceDocument: string;
  sourcePage?: string | number;
  category: string;
  confidence: ConfidenceLevel;
  conflict?: boolean;
  conflictNotes?: string;
}

// Intelligent Document Ingestion Analysis Result Model
export interface ExtractedMetadata {
  caseId?: string;
  firNumber?: string;
  persons?: Array<{ name: string; role: string }>;
  dates?: string[];
  times?: string[];
  locations?: string[];
  incidentType?: string;
  vehicles?: string[];
  phones?: string[];
  evidenceRefs?: string[];
  legalSections?: string[];
}

export interface DocumentIngestionResult {
  success: boolean;
  sha256Hash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedTextSnippet: string;
  detectedType: DocumentClassificationType;
  suggestedCaseId: string;
  confidence: ConfidenceLevel;
  matchingReason: string;
  duplicateResult: DuplicateCheckResult;
  metadata: ExtractedMetadata;
}

// Timeline & Contradiction Types
export interface TimelineEvent {
  id: string;
  timestamp: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  sourceDoc: string;
  sourcePage?: string | number;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  isContradiction?: boolean;
  contradictionDetails?: string;
}

export interface ContradictionItem {
  id: string;
  topic: string;
  documentA: string;
  statementA: string;
  documentB: string;
  statementB: string;
  contradictionType: 'Direct' | 'Timeline' | 'Alibi' | 'Identity';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  resolutionNote?: string;
}

// Relationship Graph Types
export interface EntityNode {
  id: string;
  name: string;
  type: string;
  role?: string;
  confidence?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  documentSource?: string;
  isSuspicious?: boolean;
  suspicionReason?: string;
}

export interface RelationshipGraphData {
  nodes: EntityNode[];
  edges: RelationshipEdge[];
}

// Case RAG Search Types
export interface SearchCitation {
  documentId?: string;
  documentName: string;
  caseId: string;
  pageNumber?: number | string;
  chunkIndex?: number;
  excerpt: string;
  confidence?: number;
}

export interface CaseSearchResponse {
  success: boolean;
  query: string;
  directAnswer: string;
  citations: SearchCitation[];
  matchingDocuments?: Array<{
    id: string;
    fileName: string;
    caseId: string;
    documentType: string;
    sha256Hash?: string;
    fileSize?: number;
  }>;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  error?: string;
}

// Case Completeness Types
export interface ChecklistItem {
  id: string;
  title: string;
  category: DocumentClassificationType;
  isRequired: boolean;
  status: 'UPLOADED_VERIFIED' | 'MISSING' | 'ATTENTION_REQUIRED';
  description: string;
  notes?: string;
  documentId?: string;
}

export interface CaseCompletenessReport {
  caseId: string;
  crimeType: string;
  completenessScore: number;
  checklist: ChecklistItem[];
  missingDocuments: string[];
  attentionItems: string[];
}

// Official Tamil Nadu Police FIR Data Model (Section 173 BNSS / Integrated Investigation Form-I)
export interface OfficialFIRData {
  caseId: string;
  district: string;
  policeStation: string;
  year: string;
  firNumber: string;
  firDate: string;

  acts: string[];
  sections: string[];

  occurrence: {
    day: string;
    dateFrom: string;
    dateTo: string;
    timePeriod: string;
    timeFrom: string;
    timeTo: string;
  };

  informationReceived: {
    date: string;
    time: string;
  };

  generalDiary: {
    entryNumber: string;
    time: string;
  };

  informationType: string;

  placeOfOccurrence: {
    directionDistanceFromPS: string;
    beatNumber: string;
    address: string;
    outsidePSName: string;
    outsideDistrict: string;
  };

  complainant: {
    name: string;
    fatherOrHusbandName: string;
    dob: string;
    nationality: string;
    passportNumber: string;
    passportIssueDate: string;
    passportIssuePlace: string;
    occupation: string;
    address: string;
  };

  accusedDetails: string[];

  delayReason: string;

  propertyDetails: string[];

  totalPropertyValue: string;

  inquestOrUnnaturalDeathCaseNo: string;

  firContents: string;

  actionTaken: {
    details: string;
    investigatingOfficer: string;
    officerRank: string;
    officerNumber: string;
  };

  dispatchToCourt: {
    date: string;
    time: string;
  };

  version?: number;
  generatedAt?: string;
  generatedBy?: string;
  isVerifiedByOfficer?: boolean;
}


