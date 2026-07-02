// Memory archiving / forgetting agent — evaluates which memories to archive during pivots
import { jsonCompletion, QWEN_TURBO } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/forgetting';
import type { Memory } from '@/lib/types';

export interface ArchivingResult {
  archived: string[];         // Memory IDs to archive
  retained: string[];         // Memory IDs explicitly retained
  rationale: string;          // Overall explanation
  decisions: ArchiveDecision[];
}

export interface ArchiveDecision {
  memoryId: string;
  action: 'archive' | 'retain';
  reason: string;
  confidence: number;
}

const DEFAULT_ARCHIVING_RESULT: ArchivingResult = {
  archived: [],
  retained: [],
  rationale: 'Unable to process archiving — retaining all memories by default.',
  decisions: [],
};

interface RawArchivingResponse {
  archiveDecisions?: Array<{
    memoryId?: string;
    reason?: string;
    confidence?: number;
  }>;
  retainDecisions?: Array<{
    memoryId?: string;
    reason?: string;
  }>;
  rationale?: string;
}

/**
 * When a pivot is detected, evaluates which memories should be archived
 * because they are no longer relevant or have been superseded.
 *
 * Uses Qwen Turbo for fast classification.
 * Conservative by default — when in doubt, memories are retained.
 */
export async function processArchiving(
  repoId: string,
  pivotSignal: string,
  memories: Memory[]
): Promise<ArchivingResult> {
  console.log(`[forgetting] Processing archiving for repo ${repoId}`, {
    pivotSignal: pivotSignal.slice(0, 100),
    memoryCount: memories.length,
  });

  // Filter to active memories only
  const activeMemories = memories.filter(m => m.repoId === repoId && m.status === 'active');

  if (activeMemories.length === 0) {
    console.log(`[forgetting] No active memories to evaluate`);
    return {
      ...DEFAULT_ARCHIVING_RESULT,
      rationale: 'No active memories to evaluate for archiving.',
    };
  }

  try {
    const memoriesForPrompt = activeMemories.map(m => ({
      id: m.id,
      category: m.category,
      statement: m.statement,
      evidence: m.evidence,
      importanceScore: m.importanceScore,
    }));

    const userMessage = buildUserMessage({
      pivotSignal,
      memories: memoriesForPrompt,
    });

    const raw = await jsonCompletion<RawArchivingResponse>(
      QWEN_TURBO,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_TURBO,
      { temperature: 0.15, maxTokens: 4096 }
    );

    const result = validateArchivingResult(raw, activeMemories);

    console.log(`[forgetting] Completed for repo ${repoId}:`, {
      archived: result.archived.length,
      retained: result.retained.length,
    });

    return result;
  } catch (error) {
    console.error(`[forgetting] Failed for repo ${repoId}:`, error);
    return { ...DEFAULT_ARCHIVING_RESULT };
  }
}

/**
 * Validates and normalizes the raw Qwen response.
 * Applies safety checks: only archive with sufficient confidence,
 * never archive NORTH_STAR unless very high confidence.
 */
function validateArchivingResult(raw: RawArchivingResponse, activeMemories: Memory[]): ArchivingResult {
  const memoryMap = new Map(activeMemories.map(m => [m.id, m]));
  const decisions: ArchiveDecision[] = [];
  const archived: string[] = [];
  const retained: string[] = [];

  // Process archive decisions
  if (Array.isArray(raw.archiveDecisions)) {
    for (const decision of raw.archiveDecisions) {
      if (!decision.memoryId || !memoryMap.has(decision.memoryId)) continue;

      const memory = memoryMap.get(decision.memoryId)!;
      const confidence = typeof decision.confidence === 'number'
        ? Math.min(1, Math.max(0, decision.confidence))
        : 0.5;

      // Safety check: require minimum confidence
      const MIN_CONFIDENCE = 0.7;
      const NORTH_STAR_MIN_CONFIDENCE = 0.9;

      const requiredConfidence = memory.category === 'NORTH_STAR'
        ? NORTH_STAR_MIN_CONFIDENCE
        : MIN_CONFIDENCE;

      if (confidence >= requiredConfidence) {
        archived.push(decision.memoryId);
        decisions.push({
          memoryId: decision.memoryId,
          action: 'archive',
          reason: decision.reason || 'No reason provided',
          confidence,
        });
      } else {
        // Confidence too low — retain instead
        retained.push(decision.memoryId);
        decisions.push({
          memoryId: decision.memoryId,
          action: 'retain',
          reason: `Confidence (${confidence.toFixed(2)}) below threshold (${requiredConfidence}) — retaining by default. Original reason: ${decision.reason || 'none'}`,
          confidence,
        });
      }
    }
  }

  // Process retain decisions
  if (Array.isArray(raw.retainDecisions)) {
    for (const decision of raw.retainDecisions) {
      if (!decision.memoryId || !memoryMap.has(decision.memoryId)) continue;
      if (!retained.includes(decision.memoryId) && !archived.includes(decision.memoryId)) {
        retained.push(decision.memoryId);
        decisions.push({
          memoryId: decision.memoryId,
          action: 'retain',
          reason: decision.reason || 'No reason provided',
          confidence: 1.0,
        });
      }
    }
  }

  // Any memories not mentioned are implicitly retained
  for (const memory of activeMemories) {
    if (!archived.includes(memory.id) && !retained.includes(memory.id)) {
      retained.push(memory.id);
      decisions.push({
        memoryId: memory.id,
        action: 'retain',
        reason: 'Not mentioned in pivot analysis — retained by default',
        confidence: 1.0,
      });
    }
  }

  return {
    archived,
    retained,
    rationale: (raw.rationale || 'Archiving analysis completed.').trim(),
    decisions,
  };
}
