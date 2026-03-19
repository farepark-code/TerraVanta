import { RatingBand, ESGPillar, ComplianceFlag } from './firestore';

export interface ScoringResult {
  finalScore: number
  ratingBand: RatingBand
  pillarScores: Record<ESGPillar, number>
  complianceFlags: ComplianceFlag[]
  scoredAt: Date
}

export interface PillarCalculation {
  pillar: ESGPillar
  weightedSum: number
  totalWeight: number
  score: number
  answeredCount: number
  naCount: number
  skippedCount: number
}
