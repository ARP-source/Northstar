// Hallucination risk detection agent — identifies AI-hallucinated code patterns
import { jsonCompletion, QWEN_PLUS } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/hallucination-risk';
import type { HallucinationFinding, MemoryWithRelevance } from '@/lib/types';

export interface HallucinationResult {
  hallucinationRiskScore: number;
  findings: HallucinationFinding[];
  explanation: string;
}

const DEFAULT_HALLUCINATION_RESULT: HallucinationResult = {
  hallucinationRiskScore: 10,
  findings: [],
  explanation: 'Unable to perform hallucination analysis.',
};

interface RawHallucinationResponse {
  hallucinationRiskScore?: number;
  findings?: Array<{
    type?: string;
    severity?: string;
    description?: string;
    evidence?: string;
    affectedFiles?: string[];
    codeSnippet?: string;
  }>;
  explanation?: string;
}

const VALID_HALLUCINATION_TYPES = [
  'phantom_import', 'disconnected_abstraction', 'duplicate_logic',
  'placeholder_as_complete', 'inconsistent_naming', 'unexplained_stack_change',
] as const;

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Detects hallucination risk in code changes by analyzing diff content
 * against known project patterns and conventions.
 */
export async function detectHallucinationRisk(
  diffContent: string,
  changedFiles: string[],
  relevantMemories: MemoryWithRelevance[]
): Promise<HallucinationResult> {
  console.log(`[hallucination-risk] Analyzing ${changedFiles.length} files for hallucination risk`);

  // Skip analysis for very small diffs
  if (diffContent.trim().length < 50) {
    console.log(`[hallucination-risk] Diff too small to analyze — returning clean result`);
    return {
      hallucinationRiskScore: 5,
      findings: [],
      explanation: 'Diff is too small for meaningful hallucination analysis.',
    };
  }

  try {
    const memoriesForPrompt = relevantMemories.map(m => ({
      category: m.category,
      statement: m.statement,
      relatedFiles: m.relatedFiles,
    }));

    const userMessage = buildUserMessage({
      diffContent,
      changedFiles,
      memories: memoriesForPrompt,
    });

    const raw = await jsonCompletion<RawHallucinationResponse>(
      QWEN_PLUS,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_PLUS,
      { temperature: 0.15, maxTokens: 4096 }
    );

    const result = validateHallucinationResult(raw);

    console.log(`[hallucination-risk] Completed:`, {
      riskScore: result.hallucinationRiskScore,
      findings: result.findings.length,
    });

    return result;
  } catch (error) {
    console.error(`[hallucination-risk] Failed:`, error);
    return { ...DEFAULT_HALLUCINATION_RESULT };
  }
}

/**
 * Validates and normalizes the raw Qwen response.
 */
function validateHallucinationResult(raw: RawHallucinationResponse): HallucinationResult {
  const findings: HallucinationFinding[] = Array.isArray(raw.findings)
    ? raw.findings
        .filter(f => f.description && f.description.trim().length > 0)
        .map(f => ({
          type: validateEnum(f.type, VALID_HALLUCINATION_TYPES, 'disconnected_abstraction') as HallucinationFinding['type'],
          severity: validateEnum(f.severity, VALID_SEVERITIES, 'medium') as HallucinationFinding['severity'],
          description: f.description!.trim(),
          evidence: (f.evidence || '').trim(),
          affectedFiles: Array.isArray(f.affectedFiles) ? f.affectedFiles : [],
          codeSnippet: f.codeSnippet || undefined,
        }))
    : [];

  // If we have findings, ensure the score reflects them
  let score = clampScore(raw.hallucinationRiskScore ?? 10);
  if (findings.length > 0 && score < 20) {
    const minScore = findings.reduce((min, f) => {
      const severityMin = { low: 15, medium: 30, high: 50, critical: 70 }[f.severity];
      return Math.max(min, severityMin);
    }, 0);
    score = Math.max(score, minScore);
  }

  return {
    hallucinationRiskScore: score,
    findings,
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
