// Push analysis pipeline orchestrator — coordinates the full analysis of a code push
import { v4 as uuidv4 } from 'uuid';
import { jsonCompletion, QWEN_PLUS } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT as DIFF_SYSTEM_PROMPT, buildUserMessage as buildDiffMessage } from '@/lib/agents/prompts/diff-analysis';
import { retrieveRelevantMemories } from '@/lib/agents/memory-retrieval';
import { detectDrift } from '@/lib/agents/drift-detection';
import { detectHallucinationRisk } from '@/lib/agents/hallucination-risk';
import { generateExplanation } from '@/lib/agents/explanation';
import type {
  Push,
  PushAnalysis,
  ChangeType,
  Verdict,
  DriftFinding,
  HallucinationFinding,
  SuggestedFix,
  Memory,
  MemoryWithRelevance,
} from '@/lib/types';

/** Result of the diff-analysis sub-step */
interface DiffAnalysisResult {
  intentSummary: string;
  changeType: ChangeType;
  affectedModules: string[];
  keyChanges: Array<{
    file: string;
    description: string;
    significance: 'low' | 'medium' | 'high';
  }>;
  architecturalImpact: string;
  newDependencies: string[];
  removedFunctionality: string[];
  potentialConcerns: string[];
}

const VALID_CHANGE_TYPES: ChangeType[] = ['additive', 'corrective', 'refactor', 'pivot', 'regression', 'hallucinated'];

const DEFAULT_DIFF_ANALYSIS: DiffAnalysisResult = {
  intentSummary: 'Unable to determine change intent',
  changeType: 'additive',
  affectedModules: [],
  keyChanges: [],
  architecturalImpact: 'unknown',
  newDependencies: [],
  removedFunctionality: [],
  potentialConcerns: [],
};

const DEFAULT_PUSH_ANALYSIS: PushAnalysis = {
  id: '',
  pushId: '',
  repoId: '',
  intentSummary: 'Analysis failed',
  changeType: 'additive',
  verdict: 'aligned',
  alignmentScore: 50,
  driftScore: 0,
  hallucinationRiskScore: 0,
  architectureConsistencyScore: 75,
  confidenceScore: 10,
  driftFindings: [],
  hallucinationFindings: [],
  recalledMemoryIds: [],
  explanation: 'Analysis could not be completed.',
  suggestedFixes: [],
  prComment: null,
  createdAt: new Date().toISOString(),
};

/**
 * Orchestrates the full push analysis pipeline:
 * 1. Understand diff intent (diff-analysis agent)
 * 2. Retrieve relevant memories
 * 3. Detect drift
 * 4. Detect hallucination risk
 * 5. Generate explanation
 * 6. Compute final scores & verdict
 * 7. Assemble PushAnalysis
 *
 * @param push - The push event data
 * @param repoId - The repository ID
 * @param allMemories - All memories for the repo (passed in to avoid DB dependency in agent layer)
 */
export async function analyzePush(
  push: Push,
  repoId: string,
  allMemories: Memory[]
): Promise<PushAnalysis> {
  const analysisId = uuidv4();
  const startTime = Date.now();

  console.log(`[push-analysis] Starting analysis ${analysisId} for push ${push.id} on repo ${repoId}`);

  // ── Step 1: Understand diff intent ─────────────────────────────────────
  let diffAnalysis: DiffAnalysisResult;
  try {
    console.log(`[push-analysis] Step 1: Analyzing diff intent`);
    diffAnalysis = await analyzeDiffIntent(push);
    console.log(`[push-analysis] Step 1 complete: ${diffAnalysis.changeType} — "${diffAnalysis.intentSummary.slice(0, 80)}"`);
  } catch (error) {
    console.error(`[push-analysis] Step 1 failed:`, error);
    diffAnalysis = {
      ...DEFAULT_DIFF_ANALYSIS,
      intentSummary: `Change: ${push.commitMessage}`,
      affectedModules: extractModulesFromFiles(push.filesChanged.map(f => f.filename)),
    };
  }

  const changedFiles = push.filesChanged.map(f => f.filename);

  // ── Step 2: Retrieve relevant memories ─────────────────────────────────
  let relevantMemories: MemoryWithRelevance[];
  try {
    console.log(`[push-analysis] Step 2: Retrieving relevant memories`);
    relevantMemories = await retrieveRelevantMemories(
      repoId,
      changedFiles,
      diffAnalysis.intentSummary,
      diffAnalysis.affectedModules,
      allMemories
    );
    console.log(`[push-analysis] Step 2 complete: ${relevantMemories.length} memories retrieved`);
  } catch (error) {
    console.error(`[push-analysis] Step 2 failed:`, error);
    relevantMemories = [];
  }

  // ── Steps 3 & 4: Drift detection + Hallucination risk (parallel) ──────
  let driftResult: Awaited<ReturnType<typeof detectDrift>>;
  let hallucinationResult: Awaited<ReturnType<typeof detectHallucinationRisk>>;

  try {
    console.log(`[push-analysis] Steps 3+4: Running drift detection and hallucination risk in parallel`);
    [driftResult, hallucinationResult] = await Promise.all([
      detectDrift(
        diffAnalysis.intentSummary,
        diffAnalysis.changeType,
        changedFiles,
        relevantMemories
      ).catch(error => {
        console.error(`[push-analysis] Step 3 (drift) failed:`, error);
        return {
          alignmentScore: 75,
          driftScore: 10,
          architectureConsistencyScore: 80,
          confidenceScore: 30,
          driftFindings: [] as DriftFinding[],
          explanation: 'Drift analysis unavailable.',
        };
      }),
      detectHallucinationRisk(
        push.diffContent,
        changedFiles,
        relevantMemories
      ).catch(error => {
        console.error(`[push-analysis] Step 4 (hallucination) failed:`, error);
        return {
          hallucinationRiskScore: 10,
          findings: [] as HallucinationFinding[],
          explanation: 'Hallucination analysis unavailable.',
        };
      }),
    ]);
    console.log(`[push-analysis] Steps 3+4 complete`);
  } catch (error) {
    console.error(`[push-analysis] Steps 3+4 failed entirely:`, error);
    driftResult = {
      alignmentScore: 75,
      driftScore: 10,
      architectureConsistencyScore: 80,
      confidenceScore: 30,
      driftFindings: [],
      explanation: 'Drift analysis unavailable.',
    };
    hallucinationResult = {
      hallucinationRiskScore: 10,
      findings: [],
      explanation: 'Hallucination analysis unavailable.',
    };
  }

  // ── Step 5: Compute final scores ───────────────────────────────────────
  const scores = computeFinalScores(driftResult, hallucinationResult, diffAnalysis, relevantMemories);

  // ── Step 6: Generate explanation ───────────────────────────────────────
  let explanationResult: Awaited<ReturnType<typeof generateExplanation>>;
  try {
    console.log(`[push-analysis] Step 5: Generating explanation`);
    explanationResult = await generateExplanation({
      intentSummary: diffAnalysis.intentSummary,
      changeType: diffAnalysis.changeType,
      alignmentScore: scores.alignmentScore,
      driftScore: scores.driftScore,
      hallucinationRiskScore: scores.hallucinationRiskScore,
      architectureConsistencyScore: scores.architectureConsistencyScore,
      confidenceScore: scores.confidenceScore,
      driftFindings: driftResult.driftFindings,
      hallucinationFindings: hallucinationResult.findings,
      changedFiles,
      recalledMemories: relevantMemories,
    });
    console.log(`[push-analysis] Step 5 complete`);
  } catch (error) {
    console.error(`[push-analysis] Step 5 failed:`, error);
    explanationResult = {
      explanation: driftResult.explanation || 'Analysis completed.',
      prComment: '',
      suggestedFixes: [],
    };
  }

  // ── Step 7: Compute verdict ────────────────────────────────────────────
  const verdict = computeVerdict(scores, driftResult.driftFindings, hallucinationResult.findings);

  // ── Assemble final result ──────────────────────────────────────────────
  const analysis: PushAnalysis = {
    id: analysisId,
    pushId: push.id,
    repoId,
    intentSummary: diffAnalysis.intentSummary,
    changeType: diffAnalysis.changeType,
    verdict,
    alignmentScore: scores.alignmentScore,
    driftScore: scores.driftScore,
    hallucinationRiskScore: scores.hallucinationRiskScore,
    architectureConsistencyScore: scores.architectureConsistencyScore,
    confidenceScore: scores.confidenceScore,
    driftFindings: driftResult.driftFindings,
    hallucinationFindings: hallucinationResult.findings,
    recalledMemoryIds: relevantMemories.map(m => m.id),
    explanation: explanationResult.explanation,
    suggestedFixes: explanationResult.suggestedFixes,
    prComment: explanationResult.prComment || null,
    createdAt: new Date().toISOString(),
  };

  const elapsed = Date.now() - startTime;
  console.log(`[push-analysis] Analysis ${analysisId} completed in ${elapsed}ms`, {
    verdict: analysis.verdict,
    alignment: analysis.alignmentScore,
    drift: analysis.driftScore,
    hallucination: analysis.hallucinationRiskScore,
    findings: analysis.driftFindings.length + analysis.hallucinationFindings.length,
    memoriesRecalled: analysis.recalledMemoryIds.length,
  });

  return analysis;
}

/**
 * Step 1: Analyze the diff to understand intent, change type, and affected modules.
 */
async function analyzeDiffIntent(push: Push): Promise<DiffAnalysisResult> {
  const userMessage = buildDiffMessage({
    commitMessage: push.commitMessage,
    branch: push.branch,
    filesChanged: push.filesChanged.map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
    })),
    diffContent: push.diffContent,
  });

  const result = await jsonCompletion<Partial<DiffAnalysisResult>>(
    QWEN_PLUS,
    [
      { role: 'system', content: DIFF_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    QWEN_PLUS,
    { temperature: 0.2, maxTokens: 4096 }
  );

  return {
    intentSummary: result.intentSummary || `Change: ${push.commitMessage}`,
    changeType: VALID_CHANGE_TYPES.includes(result.changeType as ChangeType)
      ? (result.changeType as ChangeType)
      : 'additive',
    affectedModules: Array.isArray(result.affectedModules)
      ? result.affectedModules
      : extractModulesFromFiles(push.filesChanged.map(f => f.filename)),
    keyChanges: Array.isArray(result.keyChanges) ? result.keyChanges : [],
    architecturalImpact: result.architecturalImpact || 'unknown',
    newDependencies: Array.isArray(result.newDependencies) ? result.newDependencies : [],
    removedFunctionality: Array.isArray(result.removedFunctionality) ? result.removedFunctionality : [],
    potentialConcerns: Array.isArray(result.potentialConcerns) ? result.potentialConcerns : [],
  };
}

/**
 * Computes final scores by combining drift and hallucination results
 * with adjustments for change type and evidence strength.
 */
function computeFinalScores(
  drift: { alignmentScore: number; driftScore: number; architectureConsistencyScore: number; confidenceScore: number },
  hallucination: { hallucinationRiskScore: number },
  diffAnalysis: DiffAnalysisResult,
  memories: MemoryWithRelevance[]
): {
  alignmentScore: number;
  driftScore: number;
  hallucinationRiskScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
} {
  // Start with drift-provided scores
  let { alignmentScore, driftScore, architectureConsistencyScore, confidenceScore } = drift;
  let { hallucinationRiskScore } = hallucination;

  // Adjust confidence based on evidence strength
  const evidenceBonus = Math.min(20, memories.length * 2);
  confidenceScore = clamp(confidenceScore + evidenceBonus, 0, 100);

  // If change type is "pivot", lower alignment expectations
  if (diffAnalysis.changeType === 'pivot') {
    alignmentScore = Math.max(alignmentScore - 15, 0);
    driftScore = Math.min(driftScore + 10, 100);
  }

  // If change type is "hallucinated", boost hallucination score
  if (diffAnalysis.changeType === 'hallucinated') {
    hallucinationRiskScore = Math.max(hallucinationRiskScore, 60);
  }

  // Regression changes get architecture penalty
  if (diffAnalysis.changeType === 'regression') {
    architectureConsistencyScore = Math.max(architectureConsistencyScore - 10, 0);
  }

  return {
    alignmentScore: clamp(Math.round(alignmentScore), 0, 100),
    driftScore: clamp(Math.round(driftScore), 0, 100),
    hallucinationRiskScore: clamp(Math.round(hallucinationRiskScore), 0, 100),
    architectureConsistencyScore: clamp(Math.round(architectureConsistencyScore), 0, 100),
    confidenceScore: clamp(Math.round(confidenceScore), 0, 100),
  };
}

/**
 * Computes the overall verdict based on scores and findings.
 */
function computeVerdict(
  scores: {
    alignmentScore: number;
    driftScore: number;
    hallucinationRiskScore: number;
    architectureConsistencyScore: number;
  },
  driftFindings: DriftFinding[],
  hallucinationFindings: HallucinationFinding[]
): Verdict {
  const hasCriticalDrift = driftFindings.some(f => f.severity === 'critical');
  const hasCriticalHallucination = hallucinationFindings.some(f => f.severity === 'critical');
  const hasHighDrift = driftFindings.some(f => f.severity === 'high');
  const hasArchViolation = driftFindings.some(f => f.type === 'architecture_violation' && f.severity !== 'low');
  const hasNonGoalViolation = driftFindings.some(f => f.type === 'non_goal_violation');

  // Architecture-breaking: critical arch violations or very low arch score
  if (
    (hasArchViolation && hasCriticalDrift) ||
    scores.architectureConsistencyScore <= 25
  ) {
    return 'architecture_breaking';
  }

  // Contradictory: direct goal or non-goal conflict
  if (
    hasNonGoalViolation ||
    (hasCriticalDrift && driftFindings.some(f => f.type === 'goal_conflict'))
  ) {
    return 'contradictory';
  }

  // Drifting: significant drift detected
  if (
    scores.driftScore >= 60 ||
    hasHighDrift ||
    hasCriticalHallucination
  ) {
    return 'drifting';
  }

  // Risky: moderate concerns
  if (
    scores.driftScore >= 35 ||
    scores.hallucinationRiskScore >= 50 ||
    scores.alignmentScore <= 45 ||
    scores.architectureConsistencyScore <= 50 ||
    driftFindings.length >= 3
  ) {
    return 'risky';
  }

  // Aligned: everything looks good
  return 'aligned';
}

/**
 * Extracts module/directory names from file paths.
 */
function extractModulesFromFiles(files: string[]): string[] {
  const modules = new Set<string>();
  for (const file of files) {
    const parts = file.replace(/\\/g, '/').split('/');
    if (parts.length >= 2) {
      // Use first two directory levels as module identifier
      modules.add(parts[0]);
      if (parts.length >= 3) {
        modules.add(`${parts[0]}/${parts[1]}`);
      }
    }
  }
  return [...modules];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
