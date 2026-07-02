// Drift detection agent — compares code changes against project memories to detect drift
import { jsonCompletion, QWEN_PLUS } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/drift-detection';
import type { DriftFinding, ChangeType, MemoryWithRelevance } from '@/lib/types';

export interface DriftResult {
  alignmentScore: number;
  driftScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
  driftFindings: DriftFinding[];
  explanation: string;
}

const DEFAULT_DRIFT_RESULT: DriftResult = {
  alignmentScore: 75,
  driftScore: 10,
  architectureConsistencyScore: 80,
  confidenceScore: 30,
  driftFindings: [],
  explanation: 'Unable to perform drift analysis — insufficient context.',
};

interface RawDriftResponse {
  alignmentScore?: number;
  driftScore?: number;
  architectureConsistencyScore?: number;
  confidenceScore?: number;
  driftFindings?: Array<{
    type?: string;
    severity?: string;
    description?: string;
    evidence?: string;
    relatedMemoryId?: string;
    affectedFiles?: string[];
  }>;
  explanation?: string;
}

const VALID_DRIFT_TYPES = ['goal_conflict', 'architecture_violation', 'non_goal_violation', 'pattern_break', 'scope_creep'] as const;
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Detects drift by comparing code change intent against project memories.
 * Uses Qwen Plus for accurate analysis.
 */
export async function detectDrift(
  intentSummary: string,
  changeType: ChangeType,
  changedFiles: string[],
  relevantMemories: MemoryWithRelevance[]
): Promise<DriftResult> {
  console.log(`[drift-detection] Analyzing drift for ${changedFiles.length} changed files against ${relevantMemories.length} memories`);

  // If no memories to compare against, return low-confidence neutral result
  if (relevantMemories.length === 0) {
    console.log(`[drift-detection] No memories available — returning default scores`);
    return {
      ...DEFAULT_DRIFT_RESULT,
      explanation: 'No project memories available for drift comparison. Scores reflect baseline assumptions.',
    };
  }

  try {
    const memoriesForPrompt = relevantMemories.map(m => ({
      id: m.id,
      category: m.category,
      statement: m.statement,
      evidence: m.evidence,
      importanceScore: m.importanceScore,
    }));

    const userMessage = buildUserMessage({
      intentSummary,
      changeType,
      changedFiles,
      memories: memoriesForPrompt,
    });

    const raw = await jsonCompletion<RawDriftResponse>(
      QWEN_PLUS,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_PLUS,
      { temperature: 0.2, maxTokens: 4096 }
    );

    const result = validateDriftResult(raw);

    console.log(`[drift-detection] Completed:`, {
      alignment: result.alignmentScore,
      drift: result.driftScore,
      architecture: result.architectureConsistencyScore,
      findings: result.driftFindings.length,
    });

    return result;
  } catch (error) {
    console.error(`[drift-detection] Failed:`, error);
    return { ...DEFAULT_DRIFT_RESULT };
  }
}

/**
 * Validates and normalizes the raw Qwen response into a typed DriftResult.
 */
function validateDriftResult(raw: RawDriftResponse): DriftResult {
  const findings: DriftFinding[] = Array.isArray(raw.driftFindings)
    ? raw.driftFindings
        .filter(f => f.description && f.description.trim().length > 0)
        .map(f => ({
          type: validateEnum(f.type, VALID_DRIFT_TYPES, 'scope_creep') as DriftFinding['type'],
          severity: validateEnum(f.severity, VALID_SEVERITIES, 'medium') as DriftFinding['severity'],
          description: f.description!.trim(),
          evidence: (f.evidence || '').trim(),
          relatedMemoryId: f.relatedMemoryId || undefined,
          affectedFiles: Array.isArray(f.affectedFiles) ? f.affectedFiles : [],
        }))
    : [];

  return {
    alignmentScore: clampScore(raw.alignmentScore ?? 75),
    driftScore: clampScore(raw.driftScore ?? 10),
    architectureConsistencyScore: clampScore(raw.architectureConsistencyScore ?? 80),
    confidenceScore: clampScore(raw.confidenceScore ?? 50),
    driftFindings: findings,
    explanation: (raw.explanation || 'No explanation provided.').trim(),
  };
}

function validateEnum<T extends string>(
  value: string | undefined,
  valid: readonly T[],
  fallback: T
): T {
  if (value && (valid as readonly string[]).includes(value)) return value as T;
  return fallback;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
