// Repo type definitions for NorthStar

export interface Repo {
  id: string;
  githubUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  northStar: string | null;
  architectureSummary: string | null;
  alignmentScore: number;
  driftScore: number;
  hallucinationRiskScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
  lastAnalyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepoWithStats extends Repo {
  totalMemories: number;
  activeMemories: number;
  totalPushes: number;
  recentPushes: number;
}
