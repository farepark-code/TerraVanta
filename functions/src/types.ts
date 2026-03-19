export type InputType = 'single_choice' | 'multi_choice' | 'numeric' | 'text' | 'file_upload';
export type ESGTier = 1 | 2 | 3 | 4;
export type ESGPillar = 'environment' | 'social' | 'governance' | 'economic';
export type RatingBand = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
export type ComplianceFlag = 'POJK_51_MANDATORY_GAP' | 'ISSB_S2_READINESS' | 'GRI_ALIGNMENT' | 'TCFD_READINESS' | string;

export interface ConsultantProfile {
  companyName: string;
  logoUrl?: string | null;
  brandColor?: string;
  tagline?: string;
  reportCredits: number;
}

export interface ClientProfile {
  id?: string;
  companyName: string;
  industry: string;
  companySize: string;
  tier: ESGTier;
  picName: string;
  picEmail: string;
  consultantId: string;
  status: 'invited' | 'in_progress' | 'completed';
  latestScore?: number;
  latestRating?: RatingBand;
  latestPillarScores?: Record<ESGPillar, number>;
  complianceFlags?: ComplianceFlag[];
  createdAt: any;
  updatedAt: any;
}

export interface QuestionnaireTemplate {
  id: string; // e.g. E1.1
  tier: ESGTier;
  pillar: ESGPillar;
  questionText: string;
  questionTextEN: string;
  inputType: InputType;
  options?: string[]; 
  weight: number; 
  complianceMapping: string[];
  isRequired: boolean;
  order: number;
}

export interface AssessmentResponse {
  questionId: string;
  value: any;
  isNA: boolean;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  answeredAt?: any;
  answeredBy?: string;
}

export interface Assessment {
  id?: string;
  clientId: string;
  consultantId: string;
  tier: ESGTier;
  status: 'draft' | 'submitted' | 'scored';
  responsesCount?: number;
  finalScore?: number;
  ratingBand?: RatingBand;
  pillarScores?: Record<ESGPillar, number>;
  complianceFlags?: ComplianceFlag[];
  startedAt?: any;
  submittedAt?: any;
  scoredAt?: any;
}
