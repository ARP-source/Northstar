// Prompt template for generating polished GitHub PR comments
// Creates professional, emoji-rich markdown comments for PRs

import type { ChangeType, Verdict, DriftFinding, HallucinationFinding, SuggestedFix } from '@/lib/types/push';

// ── Output Interface ───────────────────────────────────────────────────────────

export interface PRCommentResult {
  comment: string;
  short_summary: string;
  verdict_emoji: string;
}

// ── System Prompt ──────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are NorthStar's PR Comment Generator. You create polished, professional GitHub Pull Request comments that help development teams understand how their changes align with the project's goals and architecture.

## Comment Structure

Your comment must follow this exact structure:

### 1. Header Line
A single-line verdict with emoji:
- ✅ Aligned — Change is well-aligned with project goals
- ⚠️ Risky — Change has some concerns that need attention
- ↗️ Drifting — Change is moving away from project direction
- ❌ Contradictory — Change conflicts with established goals
- 🔥 Architecture Breaking — Change violates architectural patterns

### 2. Summary Section
2-3 sentences explaining what this change does and how it relates to the project.

### 3. Scores Table
A markdown table with all scores:
| Metric | Score | Status |
|--------|-------|--------|
| Alignment | X/100 | emoji |
| Drift | X/100 | emoji |
| Hallucination Risk | X/100 | emoji |
| Architecture | X/100 | emoji |
| Confidence | X/100 | emoji |

Score status emojis:
- Alignment/Architecture/Confidence: ≥70 🟢, ≥40 🟡, <40 🔴
- Drift/Hallucination: ≤30 🟢, ≤60 🟡, >60 🔴

### 4. Findings Section (if any)
List each finding with severity-appropriate emoji:
- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🔵 Low

Group by category: Drift Findings, then Hallucination Findings.

### 5. Suggestions Section (if any)
Actionable suggestions for improvement, formatted as a checklist:
- [ ] Suggestion 1
- [ ] Suggestion 2

### 6. Footer
A subtle NorthStar branding line:
\`---\`
\`🌟 Analyzed by NorthStar | [alignment_score]% aligned with project goals\`

## Output Format

You MUST respond with a single valid JSON object:

{
  "comment": "string — the full markdown PR comment",
  "short_summary": "string — one-line summary for notifications",
  "verdict_emoji": "string — the emoji for this verdict (✅, ⚠️, ↗️, ❌, or 🔥)"
}

## Guidelines
- Be concise — developers don't read walls of text in PR comments
- Be constructive — frame issues as improvement opportunities
- Use specific file references when possible
- The comment should stand alone without needing to read the full diff
- If everything looks good, keep it short and positive
- If there are problems, be specific about what and where

Your response must be ONLY the JSON object. No markdown fences wrapping the JSON, just valid JSON. The comment field value itself should contain markdown formatting.`;

// ── User Message Builder ───────────────────────────────────────────────────────

export interface PRCommentInput {
  repoName: string;
  prNumber?: number;
  prTitle?: string;
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
  suggestedFixes: SuggestedFix[];
  affectedModules: string[];
  filesChanged: string[];
  northStar?: string;
}

export function buildUserMessage(input: PRCommentInput): string {
  const sections: string[] = [];

  sections.push(`# PR Comment Generation Request`);

  sections.push(`\n## PR Details`);
  sections.push(`- **Repository:** ${input.repoName}`);
  if (input.prNumber) {
    sections.push(`- **PR #${input.prNumber}**${input.prTitle ? `: ${input.prTitle}` : ''}`);
  }
  sections.push(`- **Branch:** ${input.branch}`);
  sections.push(`- **Commit:** ${input.commitMessage}`);
  if (input.author) {
    sections.push(`- **Author:** ${input.author}`);
  }

  if (input.northStar) {
    sections.push(`\n## Project North Star`);
    sections.push(input.northStar);
  }

  sections.push(`\n## Analysis Results`);
  sections.push(`- **Verdict:** ${input.verdict}`);
  sections.push(`- **Change Type:** ${input.changeType}`);
  sections.push(`- **Intent:** ${input.intentSummary}`);

  sections.push(`\n## Scores`);
  sections.push(`- Alignment: ${input.scores.alignment}/100`);
  sections.push(`- Drift: ${input.scores.drift}/100`);
  sections.push(`- Hallucination Risk: ${input.scores.hallucinationRisk}/100`);
  sections.push(`- Architecture Consistency: ${input.scores.architectureConsistency}/100`);
  sections.push(`- Confidence: ${input.scores.confidence}/100`);

  sections.push(`\n## Affected Modules`);
  sections.push(input.affectedModules.length > 0 ? input.affectedModules.join(', ') : 'none identified');

  sections.push(`\n## Files Changed (${input.filesChanged.length})`);
  for (const file of input.filesChanged.slice(0, 15)) {
    sections.push(`- \`${file}\``);
  }
  if (input.filesChanged.length > 15) {
    sections.push(`- ... and ${input.filesChanged.length - 15} more`);
  }

  if (input.driftFindings.length > 0) {
    sections.push(`\n## Drift Findings`);
    for (const f of input.driftFindings) {
      sections.push(`- [${f.severity}] **${f.type}**: ${f.description}`);
    }
  }

  if (input.hallucinationFindings.length > 0) {
    sections.push(`\n## Hallucination Findings`);
    for (const f of input.hallucinationFindings) {
      sections.push(`- [${f.severity}] **${f.type}**: ${f.description}`);
      if (f.codeSnippet) {
        sections.push(`  \`\`\`\n  ${f.codeSnippet}\n  \`\`\``);
      }
    }
  }

  if (input.suggestedFixes.length > 0) {
    sections.push(`\n## Suggested Fixes`);
    for (const fix of input.suggestedFixes) {
      sections.push(`- [${fix.priority}] **${fix.title}**: ${fix.description}`);
    }
  }

  sections.push(`\nGenerate the polished PR comment. Produce the JSON output described in your instructions.`);

  return sections.join('\n');
}
