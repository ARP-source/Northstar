// Memory type definitions for NorthStar

export const MEMORY_CATEGORIES = [
  'NORTH_STAR',
  'USER_NEED',
  'NON_GOAL',
  'ARCH_DECISION',
  'MODULE_ROLE',
  'CODE_PATTERN',
  'DEPENDENCY_POLICY',
  'RISK',
  'PIVOT',
  'DEPRECATED_ASSUMPTION',
  'OPEN_QUESTION',
] as const;

export type MemoryCategory = typeof MEMORY_CATEGORIES[number];

export type MemoryStatus = 'active' | 'archived';

export interface Memory {
  id: string;
  repoId: string;
  category: MemoryCategory;
  statement: string;
  evidence: string;
  relatedFiles: string[];
  relatedModules: string[];
  confidenceScore: number;
  importanceScore: number;
  status: MemoryStatus;
  supersedesMemoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryWithRelevance extends Memory {
  relevanceScore: number;
}

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  NORTH_STAR: 'North Star',
  USER_NEED: 'User Need',
  NON_GOAL: 'Non-Goal',
  ARCH_DECISION: 'Architecture Decision',
  MODULE_ROLE: 'Module Role',
  CODE_PATTERN: 'Code Pattern',
  DEPENDENCY_POLICY: 'Dependency Policy',
  RISK: 'Risk',
  PIVOT: 'Pivot',
  DEPRECATED_ASSUMPTION: 'Deprecated Assumption',
  OPEN_QUESTION: 'Open Question',
};

export const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  NORTH_STAR: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  USER_NEED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  NON_GOAL: 'text-red-400 bg-red-400/10 border-red-400/20',
  ARCH_DECISION: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  MODULE_ROLE: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  CODE_PATTERN: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  DEPENDENCY_POLICY: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  RISK: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  PIVOT: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  DEPRECATED_ASSUMPTION: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  OPEN_QUESTION: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};
