// Prompt template for extracting memory candidates from ingestion results
// Converts raw analysis into structured memories across 11 categories

import type { MemoryCategory } from '@/lib/types/memory';
import type { RepoIngestionResult } from './repo-ingestion';

// ── Output Interface ───────────────────────────────────────────────────────────

export interface MemoryCandidate {
  category: MemoryCategory;
  statement: string;
  evidence: string;
  related_files: string[];
  related_modules: string[];
  confidence_score: number;
  importance_score: number;
}

export interface MemoryExtractionResult {
  memories: MemoryCandidate[];
  extraction_notes: string;
}

// ── System Prompt ──────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are NorthStar's Memory Extraction Agent. Your role is to analyze a repository's ingestion results and extract discrete, actionable memory items that capture the project's identity, architecture, and constraints.

Each memory should be a single, atomic fact about the project that would be valuable when evaluating future code changes.

## Memory Categories

You must classify each memory into exactly one of these 11 categories:

1. **NORTH_STAR** — The project's core mission, vision, or primary objective. Use for statements that define WHY this project exists and what success looks like. These are the highest-priority memories.

2. **USER_NEED** — Who the users are and what they need. Use for target audience descriptions, user personas, use cases, and user-facing requirements.

3. **NON_GOAL** — Things the project explicitly does NOT aim to do. Crucial for preventing scope creep. Use when the project has clear boundaries or explicitly excluded features.

4. **ARCH_DECISION** — Significant architectural decisions and their rationale. Use for technology choices, structural patterns (e.g., "we use a modular monolith"), database design decisions, API design choices.

5. **MODULE_ROLE** — The responsibility and boundaries of a specific module or component. Use to capture what each major part of the codebase does and what it should NOT do.

6. **CODE_PATTERN** — Established coding conventions, patterns, or idioms the team follows. Use for naming conventions, error handling patterns, state management approaches, testing patterns.

7. **DEPENDENCY_POLICY** — Rules about dependencies, third-party libraries, or integration constraints. Use for "we use X instead of Y", version pinning policies, or banned libraries.

8. **RISK** — Known risks, technical debt, or fragile areas in the codebase. Use for areas that need careful handling, known performance bottlenecks, or security-sensitive sections.

9. **PIVOT** — Recorded changes in direction or strategy. Use when the project has shifted its approach, deprecated a previous decision, or changed course on a significant choice.

10. **DEPRECATED_ASSUMPTION** — Previously true statements that are no longer valid. Use to record old truths that might mislead if someone still believes them. Crucial for preventing regression to old patterns.

11. **OPEN_QUESTION** — Unresolved decisions or areas of uncertainty. Use when the analysis reveals ambiguity, conflicting signals, or decisions that haven't been made yet.

## Scoring Guidelines

- **confidence_score** (0.0 - 1.0): How confident you are that this memory is accurate based on available evidence.
  - 0.9-1.0: Explicitly stated in README/docs or clearly evidenced in code
  - 0.7-0.8: Strongly implied by project structure or patterns
  - 0.5-0.6: Inferred from limited evidence
  - Below 0.5: Speculative, based on conventions rather than evidence

- **importance_score** (0.0 - 1.0): How important this memory is for evaluating future changes.
  - 0.9-1.0: Violating this would fundamentally break the project (NORTH_STAR, critical ARCH_DECISION)
  - 0.7-0.8: Important constraint that affects many decisions
  - 0.5-0.6: Useful context but not critical
  - Below 0.5: Nice-to-know but low impact

## Output Format

You MUST respond with a single valid JSON object:

{
  "memories": [
    {
      "category": "NORTH_STAR | USER_NEED | NON_GOAL | ARCH_DECISION | MODULE_ROLE | CODE_PATTERN | DEPENDENCY_POLICY | RISK | PIVOT | DEPRECATED_ASSUMPTION | OPEN_QUESTION",
      "statement": "string — a clear, concise statement of this memory (1-2 sentences)",
      "evidence": "string — what evidence supports this memory (quote from README, observed in code, etc.)",
      "related_files": ["string — file paths most relevant to this memory"],
      "related_modules": ["string — module names this memory relates to"],
      "confidence_score": 0.0,
      "importance_score": 0.0
    }
  ],
  "extraction_notes": "string — any observations about the extraction process, gaps, or caveats"
}

## Guidelines
- Extract at LEAST one NORTH_STAR memory — every project has a core mission.
- Aim for 10-30 memories depending on project complexity.
- Each memory should be independently useful — no "see above" references.
- Prefer specific, falsifiable statements over vague generalities.
- related_files should be actual paths from the repository, not invented ones.
- related_modules should match module names from the ingestion analysis.

Your response must be ONLY the JSON object. No markdown fences, no explanation, just valid JSON.`;

// ── User Message Builder ───────────────────────────────────────────────────────

export function buildUserMessage(
  ingestionResult: RepoIngestionResult,
  repoName: string,
  additionalContext?: string,
): string {
  const sections: string[] = [];

  sections.push(`# Memory Extraction for: ${repoName}`);
  sections.push(`\nBelow is the ingestion analysis for this repository. Extract memory candidates from this data.\n`);

  sections.push(`## Project Mission`);
  sections.push(ingestionResult.project_mission);

  sections.push(`\n## Target Users`);
  for (const user of ingestionResult.target_users) {
    sections.push(`- ${user}`);
  }

  sections.push(`\n## Tech Stack`);
  sections.push(`- Languages: ${ingestionResult.tech_stack.languages.join(', ')}`);
  sections.push(`- Frameworks: ${ingestionResult.tech_stack.frameworks.join(', ')}`);
  sections.push(`- Databases: ${ingestionResult.tech_stack.databases.join(', ')}`);
  sections.push(`- Tools: ${ingestionResult.tech_stack.tools.join(', ')}`);
  sections.push(`- Infrastructure: ${ingestionResult.tech_stack.infrastructure.join(', ')}`);

  sections.push(`\n## Architecture Shape: ${ingestionResult.architecture_shape}`);

  sections.push(`\n## Key Modules`);
  for (const mod of ingestionResult.key_modules) {
    sections.push(`\n### ${mod.name}`);
    sections.push(`Responsibility: ${mod.responsibility}`);
    sections.push(`Files: ${mod.files.join(', ')}`);
  }

  sections.push(`\n## Invariants`);
  for (const inv of ingestionResult.invariants) {
    sections.push(`- ${inv}`);
  }

  sections.push(`\n## Non-Goals`);
  for (const ng of ingestionResult.non_goals) {
    sections.push(`- ${ng}`);
  }

  sections.push(`\n## Coding Patterns`);
  for (const pattern of ingestionResult.coding_patterns) {
    sections.push(`\n### ${pattern.pattern_name}`);
    sections.push(pattern.description);
    if (pattern.examples.length > 0) {
      sections.push(`Examples: ${pattern.examples.join(', ')}`);
    }
  }

  if (additionalContext) {
    sections.push(`\n## Additional Context`);
    sections.push(additionalContext);
  }

  sections.push(`\nNow extract memory candidates from this analysis. Produce the JSON output described in your instructions.`);

  return sections.join('\n');
}
