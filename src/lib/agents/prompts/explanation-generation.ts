// Prompt template for generating human-readable explanations
// Translates raw analysis scores and findings into clear prose

import type { ChangeType, Verdict, DriftFinding, HallucinationFinding } from '@/lib/types/push';

// ── Output Interface ───────────────────────────────────────────────────────────

export interface ExplanationResult {
  explanation: string;
  pr_comment: string;
}

// ── System Prompt ──────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are NorthStar's Explanation Generator. Your role is to transform raw analysis data (scores, findings, diffs) into clear, human-readable explanations that help developers understand how their changes relate to the project's goals and architecture.

You produce two outputs:

1. **explanation** — A concise explanation (maximum 3 short paragraphs) suitable for display in a dashboard. This should:
   - Lead with the most important insight (good alignment, concerning drift, hallucination risk, etc.)
   - Mention specific findings only if they're noteworthy
   - Use plain language, no jargon overload
   - Be constructive, not accusatory — the goal is to help, not to blame

2. **pr_comment** — A markdown-formatted comment suitable for posting on a GitHub Pull Request. This should:
   - Open with a one-line verdict emoji + summary
   - Include a scores table
   - List key findings if any
   - Provide actionable suggestions
   - End on a constructive note
   - Use GitHub-flavored markdown

## Tone Guidelines
- Be helpful and constructive, like a senior engineer doing code review
- Acknowledge good work when alignment is high
- Frame concerns as questions or suggestions, not demands
- Use "this change" not "you" — focus on the code, not the person
- Be specific — vague feedback is useless

## Output Format

You MUST respond with a single valid JSON object:

{
  "explanation": "string — max 3 short paragraphs of plain-text explanation",
  "pr_comment": "string — full markdown-formatted GitHub PR comment"
}

Your response must be ONLY the JSON object. No markdown fences wrapping the JSON, just valid JSON. The pr_comment field value itself should contain markdown formatting.`;

// ── User Message Builder ───────────────────────────────────────────────────────

export interface ExplanationInput {
  repoName: string;
  commitMessage: string;
  branch: string;
  author?: string;
  changeType: ChangeType;
  verdict: Verdict;
  scores: {
    alignment: number;
    drift: number;
    hallucinationRisk: number;
    architectureConsistency: number;
    confidence: number;
  };
  intentSummary: string;
  driftFindings: DriftFinding[];
  hallucinationFindings: HallucinationFinding[];
  affectedModules: string[];
  filesChanged: string[];
}

export function buildUserMessage(input: ExplanationInput): string {
  const sections: string[] = [];

  sections.push(`# Explanation Generation Request`);
  sections.push(`\n## Change Details`);
  sections.push(`- **Repository:** ${input.repoName}`);
  sections.push(`- **Branch:** ${input.branch}`);
  sections.push(`- **Commit:** ${input.commitMessage}`);
  if (input.author) {
    sections.push(`- **Author:** ${input.author}`);
  }
  sections.push(`- **Change Type:** ${input.changeType}`);
  sections.push(`- **Verdict:** ${input.verdict}`);

  sections.push(`\n## Intent Summary`);
  sections.push(input.intentSummary);

  sections.push(`\n## Scores`);
  sections.push(`- Alignment: ${input.scores.alignment}/100`);
  sections.push(`- Drift: ${input.scores.drift}/100`);
  sections.push(`- Hallucination Risk: ${input.scores.hallucinationRisk}/100`);
  sections.push(`- Architecture Consistency: ${input.scores.architectureConsistency}/100`);
  sections.push(`- Confidence: ${input.scores.confidence}/100`);

  sections.push(`\n## Affected Modules`);
  sections.push(input.affectedModules.length > 0 ? input.affectedModules.join(', ') : 'none identified');

  sections.push(`\n## Files Changed (${input.filesChanged.length})`);
  for (const file of input.filesChanged.slice(0, 20)) {
    sections.push(`- \`${file}\``);
  }
  if (input.filesChanged.length > 20) {
    sections.push(`- ... and ${input.filesChanged.length - 20} more`);
  }

  if (input.driftFindings.length > 0) {
    sections.push(`\n## Drift Findings (${input.driftFindings.length})`);
    for (const f of input.driftFindings) {
      sections.push(`\n### [${f.severity.toUpperCase()}] ${f.type}`);
      sections.push(f.description);
      sections.push(`Evidence: ${f.evidence}`);
      sections.push(`Affected: ${f.affectedFiles.join(', ')}`);
    }
  }

  if (input.hallucinationFindings.length > 0) {
    sections.push(`\n## Hallucination Findings (${input.hallucinationFindings.length})`);
    for (const f of input.hallucinationFindings) {
      sections.push(`\n### [${f.severity.toUpperCase()}] ${f.type}`);
      sections.push(f.description);
      sections.push(`Evidence: ${f.evidence}`);
      sections.push(`Affected: ${f.affectedFiles.join(', ')}`);
      if (f.codeSnippet) {
        sections.push(`\`\`\`\n${f.codeSnippet}\n\`\`\``);
      }
    }
  }

  sections.push(`\nGenerate the explanation and PR comment. Produce the JSON output described in your instructions.`);

  return sections.join('\n');
}
