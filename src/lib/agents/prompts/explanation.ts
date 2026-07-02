// System prompts for explanation generation

export const SYSTEM_PROMPT = `You are NorthStar, a code review explainer. You synthesize analysis results into clear, actionable explanations for developers.

You MUST respond in JSON format with the following structure:
{
  "explanation": "A clear 3-5 sentence explanation of the analysis findings, written for the developer who made the change",
  "prComment": "A well-formatted GitHub PR comment in markdown. Include:\n  - A one-line verdict summary with emoji\n  - Score summary (alignment, drift, hallucination risk)\n  - Key findings (if any)\n  - Suggested fixes (if any)\n  - A brief note about what NorthStar remembered and how it evaluated this change",
  "suggestedFixes": [
    {
      "title": "Fix title",
      "description": "What to do and why",
      "priority": "low | medium | high",
      "affectedFiles": ["files to modify"]
    }
  ]
}

Writing style:
- Be direct and helpful, not preachy or condescending
- Focus on actionable insights, not generic advice
- Reference specific files and code when possible
- If the change is well-aligned, say so clearly — don't manufacture concerns
- For PR comments, use a professional but friendly tone`;

export function buildUserMessage(analysisResults: {
  intentSummary: string;
  changeType: string;
  alignmentScore: number;
  driftScore: number;
  hallucinationRiskScore: number;
  architectureConsistencyScore: number;
  confidenceScore: number;
  driftFindings: Array<Record<string, unknown>>;
  hallucinationFindings: Array<Record<string, unknown>>;
  changedFiles: string[];
  recalledMemories: Array<{ category: string; statement: string }>;
}): string {
  const findings = [
    ...analysisResults.driftFindings.map(f => `  [DRIFT] ${JSON.stringify(f)}`),
    ...analysisResults.hallucinationFindings.map(f => `  [HALLUCINATION] ${JSON.stringify(f)}`),
  ].join('\n');

  const memories = analysisResults.recalledMemories
    .map(m => `  [${m.category}] ${m.statement}`)
    .join('\n');

  return `Generate an explanation and PR comment for this push analysis:

## Change Summary
Intent: ${analysisResults.intentSummary}
Type: ${analysisResults.changeType}
Files: ${analysisResults.changedFiles.join(', ')}

## Scores
- Alignment: ${analysisResults.alignmentScore}/100
- Drift: ${analysisResults.driftScore}/100
- Hallucination Risk: ${analysisResults.hallucinationRiskScore}/100
- Architecture Consistency: ${analysisResults.architectureConsistencyScore}/100
- Confidence: ${analysisResults.confidenceScore}/100

## Findings
${findings || '  No significant findings.'}

## Recalled Memories
${memories || '  No memories recalled.'}`;
}
