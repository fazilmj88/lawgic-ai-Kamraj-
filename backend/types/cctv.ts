export type CctvConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNREADABLE';
export type CctvReviewStatus = 'PENDING' | 'VERIFIED' | 'EDITED' | 'REJECTED';

export interface CctvTimelineEvent {
  id: string;
  timestamp: string; // e.g. "00:01:12"
  seconds: number;
  observation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceFrame: string;
  category: 'person_movement' | 'vehicle_movement' | 'object_interaction' | 'critical_incident' | 'general';
  reviewStatus: CctvReviewStatus;
  officerNotes?: string;
  editedObservation?: string;
}

export interface CctvPerson {
  id: string; // "Person 1", "Person 2"
  label: string;
  firstSeen: string;
  firstSeenSeconds: number;
  lastSeen: string;
  lastSeenSeconds: number;
  clothing: string;
  appearanceNotes: string;
  carriedObjects: string[];
  directionOfMovement: string;
  interactions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reviewStatus: CctvReviewStatus;
  officerNotes?: string;
}

export interface CctvVehicle {
  id: string;
  vehicleType: 'Motorcycle' | 'Car' | 'Auto-rickshaw' | 'Van' | 'Truck' | 'Bicycle' | 'Other';
  visibleColor: string;
  firstSeen: string;
  firstSeenSeconds: number;
  lastSeen: string;
  lastSeenSeconds: number;
  direction: string;
  distinguishingFeatures: string;
  numberPlateText: string;
  plateConfidence: CctvConfidence;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reviewStatus: CctvReviewStatus;
  officerNotes?: string;
}

export interface CctvObject {
  id: string;
  objectName: string;
  timestamp: string;
  seconds: number;
  personAssociation?: string;
  visualDescription: string;
  evidentiaryCategory: 'Potential Weapon' | 'Stolen Property' | 'Personal Effect' | 'Tool / Implement' | 'Wearable';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceFrame: string;
  reviewStatus: CctvReviewStatus;
  officerNotes?: string;
}

export interface CctvVisibleText {
  id: string;
  text: string;
  timestamp: string;
  seconds: number;
  locationInFrame: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceFrame: string;
  reviewStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface CctvKeyFrame {
  id: string;
  timestamp: string;
  seconds: number;
  thumbnailUrl: string; // data URL or relative path
  observation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  associatedEntities: string[];
}

export interface CctvPotentialEvidence {
  id: string;
  observation: string;
  timestamp: string;
  seconds: number;
  evidentiarySignificance: string;
  legalProvisionsRelevant: string[];
}

export interface CctvAnalysisData {
  summary: string;
  events: CctvTimelineEvent[];
  persons: CctvPerson[];
  vehicles: CctvVehicle[];
  objects: CctvObject[];
  visibleText: CctvVisibleText[];
  keyFrames: CctvKeyFrame[];
  potentialEvidence: CctvPotentialEvidence[];
  limitations: string[];
  analyzedAt: string;
  modelUsed: string;
  videoDuration: number;
}

export interface CctvOfficerReview {
  status: 'PENDING_REVIEW' | 'PARTIALLY_REVIEWED' | 'VERIFIED_BY_OFFICER';
  reviewedBy: string;
  reviewedAt?: string;
  reviewerRole: string;
  officerVerdict: string;
  verifiedItemIds: string[];
  rejectedItemIds: string[];
  editedNotes: Record<string, string>;
}

export interface CctvCustodyEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  details: string;
  hash: string;
}

export interface CctvEvidenceItem {
  id: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  videoDuration: number;
  formattedDuration: string;
  sha256Hash: string;
  uploadedBy: string;
  uploaderRole: string;
  uploadedAt: string;
  processingStatus: 'Uploaded' | 'Processing' | 'Analysis Complete' | 'Analysis Failed';
  analysisStatus: 'Pending Analysis' | 'Analyzing' | 'Analysis Complete' | 'Analysis Failed';
  videoUrl?: string;
  streamUrl?: string;
  metadata?: {
    fps?: number;
    width?: number;
    height?: number;
    codec?: string;
    bitrate?: string;
    hasAudio?: boolean;
    ffmpegUsed?: boolean;
  };
  analysis?: CctvAnalysisData;
  officerReview?: CctvOfficerReview;
  chainOfCustody?: CctvCustodyEntry[];
}
