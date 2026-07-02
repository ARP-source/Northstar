// Memory construction agent — transforms ingestion analysis into discrete Memory objects
import { v4 as uuidv4 } from 'uuid';
import { jsonCompletion, QWEN_PLUS } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/memory-construction';
import type { Memory, MemoryCategory } from '@/lib/types';
import type { IngestionResult } from '@/lib/agents/ingestion';

const VALID_CATEGORIES: MemoryCategory[] = [
  'NORTH_STAR', 'USER_NEED', 'NON_GOAL', 'ARCH_DECISION', 'MODULE_ROLE',
  'CODE_PATTERN', 'DEPENDENCY_POLICY', 'RISK', 'PIVOT', 'DEPRECATED_ASSUMPTION', 'OPEN_QUESTION',
];

interface RawMemory {
  category: string;
  statement: string;
  evidence: string;
  relatedFiles?: string[];
  relatedModules?: string[];
  confidenceScore?: number;
  importanceScore?: number;
}

interface MemoryConstructionResponse {
  memories: RawMemory[];
}

/**
 * Takes ingestion analysis and generates structured Memory objects ready for DB insertion.
 * Uses Qwen Plus for intelligent memory extraction.
 */
export async function constructMemories(
  repoId: string,
  ingestionResult: IngestionResult
): Promise<Memory[]> {
  console.log(`[memory-construction] Building memories for repo ${repoId}`);

  try {
    const userMessage = buildUserMessage(ingestionResult as any);

    const result = await jsonCompletion<MemoryConstructionResponse>(
      QWEN_PLUS,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_PLUS,
      { temperature: 0.2, maxTokens: 8192 }
    );

    const rawMemories = Array.isArray(result.memories) ? result.memories : [];

    if (rawMemories.length === 0) {
      console.warn(`[memory-construction] Qwen returned no memories, generating from ingestion data directly`);
      return generateFallbackMemories(repoId, ingestionResult);
    }

    const now = new Date().toISOString();

    const memories: Memory[] = rawMemories
      .filter(m => m.statement && m.statement.trim().length > 0)
      .map(raw => ({
        id: uuidv4(),
        repoId,
        category: validateCategory(raw.category),
        statement: raw.statement.trim(),
        evidence: (raw.evidence || '').trim(),
        relatedFiles: Array.isArray(raw.relatedFiles) ? raw.relatedFiles : [],
        relatedModules: Array.isArray(raw.relatedModules) ? raw.relatedModules : [],
        confidenceScore: clamp(raw.confidenceScore ?? 0.7, 0, 1),
        importanceScore: clamp(raw.importanceScore ?? 5, 1, 10),
        status: 'active' as const,
        supersedesMemoryId: null,
        createdAt: now,
        updatedAt: now,
      }));

    // Ensure at least one NORTH_STAR memory exists
    const hasNorthStar = memories.some(m => m.category === 'NORTH_STAR');
    if (!hasNorthStar && ingestionResult.northStar) {
      memories.unshift({
        id: uuidv4(),
        repoId,
        category: 'NORTH_STAR',
        statement: ingestionResult.northStar,
        evidence: 'Extracted from project README and package.json',
        relatedFiles: [],
        relatedModules: [],
        confidenceScore: 0.8,
        importanceScore: 10,
        status: 'active',
        supersedesMemoryId: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`[memory-construction] Generated ${memories.length} memories for repo ${repoId}:`, {
      byCategory: countByCategory(memories),
    });

    return memories;
  } catch (error) {
    console.error(`[memory-construction] Failed for repo ${repoId}:`, error);
    return generateFallbackMemories(repoId, ingestionResult);
  }
}

/**
 * Generates basic memories directly from ingestion data when Qwen is unavailable.
 */
function generateFallbackMemories(repoId: string, result: IngestionResult): Memory[] {
  const now = new Date().toISOString();
  const memories: Memory[] = [];

  // North star from mission
  if (result.northStar || result.mission) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: 'NORTH_STAR',
      statement: result.northStar || result.mission,
      evidence: 'Extracted from project README',
      relatedFiles: ['README.md'],
      relatedModules: [],
      confidenceScore: 0.7,
      importanceScore: 10,
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Architecture decision
  if (result.architecture?.summary) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: 'ARCH_DECISION',
      statement: `Architecture: ${result.architecture.pattern} — ${result.architecture.summary}`,
      evidence: 'Inferred from folder structure and code organization',
      relatedFiles: [],
      relatedModules: [],
      confidenceScore: 0.6,
      importanceScore: 8,
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Module roles
  for (const mod of result.modules.slice(0, 10)) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: 'MODULE_ROLE',
      statement: `Module "${mod.name}": ${mod.role}`,
      evidence: `Files: ${mod.files.join(', ')}`,
      relatedFiles: mod.files,
      relatedModules: [mod.name],
      confidenceScore: 0.6,
      importanceScore: 6,
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Invariants as memories
  for (const inv of result.invariants) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: validateCategory(inv.category),
      statement: inv.statement,
      evidence: inv.evidence,
      relatedFiles: [],
      relatedModules: [],
      confidenceScore: 0.65,
      importanceScore: clamp(inv.importance, 1, 10),
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Risks
  for (const risk of result.risks) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: 'RISK',
      statement: risk.description,
      evidence: `Area: ${risk.area}, Severity: ${risk.severity}`,
      relatedFiles: [],
      relatedModules: [risk.area],
      confidenceScore: 0.5,
      importanceScore: risk.severity === 'high' ? 8 : risk.severity === 'medium' ? 5 : 3,
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Dependency policies from stack
  if (result.stack?.key_dependencies?.length > 0) {
    memories.push({
      id: uuidv4(),
      repoId,
      category: 'DEPENDENCY_POLICY',
      statement: `Core stack: ${result.stack.framework} (${result.stack.language}), key deps: ${result.stack.key_dependencies.join(', ')}`,
      evidence: 'Extracted from package.json / project configuration',
      relatedFiles: ['package.json'],
      relatedModules: [],
      confidenceScore: 0.9,
      importanceScore: 7,
      status: 'active',
      supersedesMemoryId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`[memory-construction] Generated ${memories.length} fallback memories for repo ${repoId}`);
  return memories;
}

function validateCategory(raw: string): MemoryCategory {
  const upper = (raw || '').toUpperCase().replace(/[\s-]/g, '_');
  if (VALID_CATEGORIES.includes(upper as MemoryCategory)) {
    return upper as MemoryCategory;
  }
  return 'ARCH_DECISION';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function countByCategory(memories: Memory[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of memories) {
    counts[m.category] = (counts[m.category] || 0) + 1;
  }
  return counts;
}
