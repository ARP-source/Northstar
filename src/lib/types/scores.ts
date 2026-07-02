// Score type definitions for NorthStar

export interface Scores {
  alignmentScore: number;       // 0-100
  driftScore: number;           // 0-100
  hallucinationRiskScore: number; // 0-100
  architectureConsistencyScore: number; // 0-100
  confidenceScore: number;      // 0-100
}

export interface ScoreBreakdown {
  score: number;
  label: string;
  description: string;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  impact: number; // positive or negative
  description: string;
  evidence?: string;
}

export const SCORE_CONFIG: Record<keyof Scores, { label: string; description: string; color: (score: number) => string; invertedScale?: boolean }> = {
  alignmentScore: {
    label: 'Alignment',
    description: 'How well recent changes map to the project\'s stated goals and architecture',
    color: (s) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400',
  },
  driftScore: {
    label: 'Drift',
    description: 'How much the codebase is moving away from its original intent',
    color: (s) => s <= 30 ? 'text-emerald-400' : s <= 60 ? 'text-amber-400' : 'text-red-400',
    invertedScale: true,
  },
  hallucinationRiskScore: {
    label: 'Hallucination Risk',
    description: 'Likelihood that recent changes contain AI-hallucinated or disconnected code',
    color: (s) => s <= 20 ? 'text-emerald-400' : s <= 50 ? 'text-amber-400' : 'text-red-400',
    invertedScale: true,
  },
  architectureConsistencyScore: {
    label: 'Architecture',
    description: 'How consistently the codebase follows its established architectural patterns',
    color: (s) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400',
  },
  confidenceScore: {
    label: 'Confidence',
    description: 'How confident the system is in its analysis based on available evidence',
    color: (s) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-zinc-400',
  },
};
