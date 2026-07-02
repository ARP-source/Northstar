// Prompt template for drift detection and scoring
// Compares push intent against project memories to detect divergence

import type { DriftFinding } from '@/lib/types/push';
import type { MemoryCategory } from '@/lib/types/memory';

// ── Output Interface ───────────────────────────────────────────────────────────

export interface DriftScoringResult {
  alignment_score: number;
  drift_score: number;
  architecture_consistency_score: number;
  confidence_score: number;
  drift_findings: DriftFindingOutput[];
  explanation: string;
  verdict_reasoning: string;
}

export interface DriftFindingOutput {
  type: DriftFinding['type'];
  severity: DriftFinding['severity'];
  description: string;
  evidence: string;
  affected_files: string[];
  related_memory_category?: MemoryCategory;
}

// ── System Prompt ──────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are NorthStar's Drift Detection Agent. Your role is to evaluate whether a code change aligns with or diverges from the project's established identity, goals, and architecture.

You will receive:
1. A summary of the push/change intent (what the developer is trying to do)
2. Relevant project memories (established truths about the project)

Your job is to score the change on multiple dimensions and identify specific drift findings.

## Scoring Dimensions (all 0-100)

### alignment_score (0-100)
How well does this change align with the project's stated goals and architecture?
- 90-100: Perfectly aligned, directly serves the north star
- 70-89: Good alignment, consistent with project direction
- 50-69: Neutral — doesn't obviously help or hurt
- 30-49: Concerning — tangential to project goals or introduces tension
- 0-29: Actively contradicts project goals or non-goals

### drift_score (0-100)
How much is this change causing the project to drift from its identity?
- 0-10: No drift — this is exactly on track
- 11-30: Minimal drift — minor deviation that's probably fine
- 31-50: Moderate drift — this might be intentional evolution or accidental divergence
- 51-70: Significant drift — this needs justification
- 71-100: Severe drift — fundamentally changing the project's character

### architecture_consistency_score (0-100)
How consistent is this change with the established architecture?
- 90-100: Follows all architectural patterns perfectly
- 70-89: Minor stylistic variations but structurally sound
- 50-69: Some architectural concerns
- 30-49: Significant architectural inconsistencies
- 0-29: Breaks architectural conventions or introduces conflicting patterns

### confidence_score (0-100)
How confident are you in this assessment?
- 90-100: Clear evidence for/against alignment in the memories
- 70-89: Good evidence but some ambiguity
- 50-69: Limited evidence, relying on inference
- 0-49: Very limited information, low confidence

## Drift Finding Types

- **goal_conflict**: Change actively works against a stated project goal (NORTH_STAR memory)
- **architecture_violation**: Change breaks an established architectural pattern or decision (ARCH_DECISION memory)
- **non_goal_violation**: Change introduces functionality that was explicitly excluded (NON_GOAL memory)
- **pattern_break**: Change deviates from established coding patterns or conventions (CODE_PATTERN memory)
- **scope_creep**: Change adds functionality beyond the project's defined scope without justification

## Output Format

You MUST respond with a single valid JSON object:

{
  "alignment_score": 0,
  "drift_score": 0,
  "architecture_consistency_score": 0,
  "confidence_score": 0,
  "drift_findings": [
    {
      "type": "goal_conflict | architecture_violation | non_goal_violation | pattern_break | scope_creep",
      "severity": "low | medium | high | critical",
      "description": "string — what is the drift issue",
      "evidence": "string — what memory or pattern is being violated",
      "affected_files": ["string — file paths involved"],
      "related_memory_category": "NORTH_STAR | NON_GOAL | ARCH_DECISION | MODULE_ROLE | CODE_PATTERN"
    }
  ],
  "explanation": "string — 2-3 sentence summary of the overall drift assessment",
  "verdict_reasoning": "string — reasoning for the overall verdict, connecting scores to findings"
}

## Guidelines
- An empty drift_findings array with high alignment is perfectly valid for well-aligned changes.
- Be calibrated — not every change drifts. Routine maintenance, bug fixes, and on-mission features should score well.
- Severity should reflect actual project impact, not just "this is different."
- If memories are sparse, lower your confidence_score and note this in the explanation.
- Consider that some drift might be intentional evolution — flag it but don't over-penalize.

Your response must be ONLY the JSON object. No markdown fences, no explanation, just valid JSON.`;

// ── User Message Builder ───────────────────────────────────────────────────────

export interface RelevantMemory {
  category: MemoryCategory;
  statement: string;
  evidence: string;
  importance_score: number;
}

export interface DriftScoringInput {
  intentSummary: string;
  changeType: string;
  affectedModules: string[];
  filesChanged: string[];
  riskIndicators: string[];
  newAbstractions: string[];
  memories: RelevantMemory[];
}

export function buildUserMessage(input: DriftScoringInput): string {
  const sections: string[] = [];

  sections.push(`# Drift Scoring Request`);

  sections.push(`\n## Push Intent`);
  sections.push(`**Summary:** ${input.intentSummary}`);
  sections.push(`**Change Type:** ${input.changeType}`);
  sections.push(`**Affected Modules:** ${input.affectedModules.join(', ') || 'none identified'}`);

  sections.push(`\n## Files Changed`);
  for (const file of input.filesChanged) {
    sections.push(`- \`${file}\``);
  }

  if (input.riskIndicators.length > 0) {
    sections.push(`\n## Risk Indicators from Diff Analysis`);
    for (const risk of input.riskIndicators) {
      sections.push(`- ⚠️ ${risk}`);
    }
  }

  if (input.newAbstractions.length > 0) {
    sections.push(`\n## New Abstractions Introduced`);
    for (const abs of input.newAbstractions) {
      sections.push(`- ${abs}`);
    }
  }

  sections.push(`\n## Recalled Project Memories (${input.memories.length})`);
  if (input.memories.length === 0) {
    sections.push(`No relevant memories found. This may be a new project or the memory bank is empty. Score with low confidence.`);
  } else {
    // Group memories by category for readability
    const grouped = new Map<MemoryCategory, RelevantMemory[]>();
    for (const mem of input.memories) {
      const list = grouped.get(mem.category) ?? [];
      list.push(mem);
      grouped.set(mem.category, list);
    }

    for (const [category, memories] of grouped) {
      sections.push(`\n### ${category}`);
      for (const mem of memories) {
        sections.push(`- [importance: ${mem.importance_score.toFixed(1)}] ${mem.statement}`);
        sections.push(`  Evidence: ${mem.evidence}`);
      }
    }
  }

  sections.push(`\nNow evaluate drift and alignment. Produce the JSON output described in your instructions.`);

  return sections.join('\n');
}
