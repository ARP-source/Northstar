// Push and analysis type definitions for NorthStar

export type PushType = 'push' | 'pull_request';

export type ChangeType = 
  | 'additive' 
  | 'corrective' 
  | 'refactor' 
  | 'pivot' 
  | 'regression' 
  | 'hallucinated';

export type Verdict = 
  | 'aligned' 
  | 'risky' 
  | 'drifting' 
  | 'contradictory' 
  | 'architecture_breaking';

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface Push {
  id: string;
  repoId: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  branch: string;
  filesChanged: FileChange[];
  diffContent: string;
  pushType: PushType;
  prNumber: number | null;
  receivedAt: string;
}

export interface DriftFinding {
  type: 'goal_conflict' | 'architecture_violation' | 'non_goal_violation' | 'pattern_break' | 'scope_creep';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  relatedMemoryId?: string;
  affectedFiles: string[];
}

export interface HallucinationFinding {
  type: 'phantom_import' | 'disconnected_abstraction' | 'duplicate_logic' | 'placeholder_as_complete' | 'inconsistent_naming' | 'unexplained_stack_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  affectedFiles: string[];
  codeSnippet?: string;
}

export interface SuggestedFix {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  affectedFiles: string[];
}

export interface PushAnalysis {
  id: string;
  pushId: string;
  repoId: string;
  intentSummary: string;
  changeType: ChangeType;
  verdict: Verdict;
  alignmentScore: number;
  driftScore: number;
  hallucinationRiskScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
  driftFindings: DriftFinding[];
  hallucinationFindings: HallucinationFinding[];
  recalledMemoryIds: string[];
  explanation: string;
  suggestedFixes: SuggestedFix[];
  prComment: string | null;
  createdAt: string;
}

export interface PushWithAnalysis extends Push {
  analysis: PushAnalysis | null;
}

export const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; icon: string }> = {
  aligned: { label: 'Aligned', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: '✓' },
  risky: { label: 'Risky', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: '⚠' },
  drifting: { label: 'Drifting', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: '↗' },
  contradictory: { label: 'Contradictory', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: '✕' },
  architecture_breaking: { label: 'Architecture Breaking', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: '🔥' },
};

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  additive: 'Feature Addition',
  corrective: 'Bug Fix',
  refactor: 'Refactor',
  pivot: 'Pivot',
  regression: 'Regression',
  hallucinated: 'Hallucinated',
};
