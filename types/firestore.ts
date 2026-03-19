export type UserRole =
  | 'super_admin'
  | 'consultant'
  | 'consultant_member'
  | 'client_user'

export type ESGTier = 1 | 2 | 3 | 4

export type ESGPillar =
  | 'environment'
  | 'social'
  | 'governance'
  | 'economic'

export type RatingBand =
  | 'AAA' | 'AA' | 'A'
  | 'BBB' | 'BB' | 'B' | 'CCC'

export type ComplianceFlag =
  | 'POJK_51_MANDATORY_GAP'
  | 'ISSB_S2_READINESS'
  | 'GRI_ALIGNMENT'
  | 'TCFD_READINESS'

export type InputType =
  | 'single_choice'
  | 'multi_choice'
  | 'numeric'
  | 'text'
  | 'file_upload'

export type AssessmentStatus =
  | 'draft'
  | 'submitted'
  | 'scored'

export interface ConsultantProfile {
  id: string
  email: string
  companyName: string
  logoUrl: string | null
  brandColor: string        // default: '#10B981'
  tagline?: string | null
  reportCredits: number     // default: 999999
  isSuperAdmin: boolean     // default: false
  billingBypass: boolean    // default: true (no billing)
  createdAt: Date
  updatedAt: Date
}

export interface ClientProfile {
  id: string
  consultantId: string
  companyName: string
  industry: string
  companySize: 'startup' | 'sme' | 'enterprise'
  tier: ESGTier
  picEmail: string
  picName: string
  latestScore: number | null
  latestRating: RatingBand | null
  latestPillarScores: Record<ESGPillar, number> | null
  complianceFlags: ComplianceFlag[]
  status: 'invited' | 'active' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface QuestionnaireTemplate {
  id: string
  tier: ESGTier
  pillar: ESGPillar
  questionText: string       // Bahasa Indonesia
  questionTextEN: string     // English
  inputType: InputType
  options?: string[]
  weight: number             // 0.1 - 1.0
  complianceMapping: ComplianceFlag[]
  isRequired: boolean
  order: number
}

export interface AssessmentResponse {
  questionId: string
  value: string | number | string[] | null
  evidenceUrl: string | null
  evidenceFileName: string | null
  isNA: boolean
  answeredAt: Date
  answeredBy: string         // uid
}

export interface Assessment {
  id: string
  clientId: string
  consultantId: string
  tier: ESGTier
  status: AssessmentStatus
  finalScore: number | null
  ratingBand: RatingBand | null
  pillarScores: Record<ESGPillar, number> | null
  complianceFlags: ComplianceFlag[]
  submittedAt: Date | null
  scoredAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  uid: string
  userRole: UserRole
  action: string
  resourceType: string
  resourceId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  isAdminAction: boolean
  targetConsultantId?: string
  timestamp: Date
}

export interface AdminProfile {
  id: string
  email: string
  displayName: string
  invitedBy: string | null
  invitedAt: Date
  isActive: boolean
}

export interface PlatformStats {
  totalConsultants: number
  totalClients: number
  totalAssessments: number
  totalReportsGenerated: number
  averageESGScore: number
  updatedAt: Date
}
