// Explanation generation agent — synthesizes analysis into human-readable output
import { jsonCompletion, QWEN_TURBO } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/explanation';
import type { DriftFinding, HallucinationFinding, SuggestedFix, MemoryWithRelevance } from '@/lib/types';

export interface ExplanationInput {
  intentSummary: string;
  changeType: string;
  alignmentScore: number;
  driftScore: number;
  hallucinationRiskScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
  driftFindings: DriftFinding[];
  hallucinationFindings: HallucinationFinding[];
  changedFiles: string[];
  recalledMemories: MemoryWithRelevance[];
}

export interface ExplanationResult {
  explanation: string;
  prComment: string;
  suggestedFixes: SuggestedFix[];
}

const DEFAULT_EXPLANATION: ExplanationResult = {
  explanation: 'Analysis completed but explanation generation was unavailable.',
  prComment: '',
  suggestedFixes: [],
};

interface RawExplanationResponse {
  explanation?: string;
  prComment?: string;
  suggestedFixes?: Array<{
    title?: string;
    description?: string;
    priority?: string;
    affectedFiles?: string[];
  }>;
}

/**
 * Generates human-readable explanation and GitHub PR comment
 * from the full push analysis results.
 * Uses Qwen Turbo for fast generation.
 */
export async function generateExplanation(
  analysisResults: ExplanationInput
): Promise<ExplanationResult> {
  console.log(`[explanation] Generating explanation for change: "${analysisResults.intentSummary.slice(0, 60)}..."`);

  try {
    const userMessage = buildUserMessage({
      intentSummary: analysisResults.intentSummary,
      changeType: analysisResults.changeType,
      alignmentScore: analysisResults.alignmentScore,
      driftScore: analysisResults.driftScore,
      hallucinationRiskScore: analysisResults.hallucinationRiskScore,
      architectureConsistencyScore: analysisResults.architectureConsistencyScore,
      confidenceScore: analysisResults.confidenceScore,
      driftFindings: analysisResults.driftFindings as any[],
      hallucinationFindings: analysisResults.hallucinationFindings as any[],
      changedFiles: analysisResults.changedFiles,
      recalledMemories: analysisResults.recalledMemories.map(m => ({
        category: m.category,
        statement: m.statement,
      })),
    });

    const raw = await jsonCompletion<RawExplanationResponse>(
      QWEN_TURBO,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_TURBO,
      { temperature: 0.4, maxTokens: 4096 }
    );

    const result = validateExplanationResult(raw, analysisResults);

    console.log(`[explanation] Generated explanation (${result.explanation.length} chars) and PR comment (${result.prComment.length} chars)`);

    return result;
  } catch (error) {
    console.error(`[explanation] Failed:`, error);
    // Generate a basic fallback explanation from the data we have
    return generateFallbackExplanation(analysisResults);
  }
}

/**
 * Validates and normalizes the raw Qwen response.
 */
function validateExplanationResult(
  raw: RawExplanationResponse,
  input: ExplanationInput
): ExplanationResult {
  const suggestedFixes: SuggestedFix[] = Array.isArray(raw.suggestedFixes)
    ? raw.suggestedFixes
        .filter(f => f.title && f.description)
        .map(f => ({
          title: f.title!.trim(),
          description: f.description!.trim(),
          priority: (['low', 'medium', 'high'].includes(f.priority || '') ? f.priority! : 'medium') as SuggestedFix['priority'],
          affectedFiles: Array.isArray(f.affectedFiles) ? f.affectedFiles : [],
        }))
    : [];

  return {
    explanation: (raw.explanation || generateFallbackExplanation(input).explanation).trim(),
    prComment: (raw.prComment || '').trim(),
    suggestedFixes,
  };
}

/**
 * Generates a basic explanation when Qwen is unavailable.
 */
function generateFallbackExplanation(input: ExplanationInput): ExplanationResult {
  const verdict = deriveVerdict(input);
  const emoji = getVerdictEmoji(verdict);

  const explanation = [
    `This ${input.changeType} change ${input.intentSummary.toLowerCase()}.`,
    `Alignment score: ${input.alignmentScore}/100, drift: ${input.driftScore}/100.`,
    input.driftFindings.length > 0
      ? `Found ${input.driftFindings.length} drift concern(s).`
      : 'No drift concerns detected.',
    input.hallucinationFindings.length > 0
      ? `Found ${input.hallucinationFindings.length} hallucination risk indicator(s).`
      : 'No hallucination risks detected.',
  ].join(' ');

  const prComment = [
    `## ${emoji} NorthStar Analysis: ${verdict}`,
    '',
    `**Change:** ${input.intentSummary}`,
    `**Type:** ${input.changeType}`,
    '',
    '### Scores',
    `| Metric | Score |`,
    `|--------|-------|`,
    `| Alignment | ${input.alignmentScore}/100 |`,
    `| Drift | ${input.driftScore}/100 |`,
    `| Hallucination Risk | ${input.hallucinationRiskScore}/100 |`,
    `| Architecture | ${input.architectureConsistencyScore}/100 |`,
    `| Confidence | ${input.confidenceScore}/100 |`,
    '',
    input.driftFindings.length > 0
      ? `### ⚠️ Drift Findings\n${input.driftFindings.map(f => `- **${f.severity}**: ${f.description}`).join('\n')}`
      : '',
    input.hallucinationFindings.length > 0
      ? `### 🔍 Hallucination Risks\n${input.hallucinationFindings.map(f => `- **${f.severity}**: ${f.description}`).join('\n')}`
      : '',
    '',
    `---`,
    `*Analysis by NorthStar — recalled ${input.recalledMemories.length} project memories*`,
  ].filter(Boolean).join('\n');

  return { explanation, prComment, suggestedFixes: [] };
}

function deriveVerdict(input: ExplanationInput): string {
  if (input.alignmentScore >= 70 && input.driftScore <= 30) return 'Aligned';
  if (input.driftScore >= 70) return 'Drifting';
  if (input.hallucinationRiskScore >= 60) return 'Hallucination Risk';
  if (input.architectureConsistencyScore <= 40) return 'Architecture Concern';
  if (input.driftScore >= 40 || input.alignmentScore <= 50) return 'Risky';
  return 'Aligned';
}

function getVerdictEmoji(verdict: string): string {
  const map: Record<string, string> = {
    'Aligned': '✅',
    'Risky': '⚠️',
    'Drifting': '↗️',
    'Hallucination Risk': '🔍',
    'Architecture Concern': '🏗️',
  };
  return map[verdict] || '📋';
}
