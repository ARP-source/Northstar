// Memory retrieval agent — hybrid scoring-based memory retrieval for push analysis
import type { Memory, MemoryWithRelevance, MemoryCategory } from '@/lib/types';

/**
 * Categories that always get a relevance boost because they define the project's core identity.
 */
const BOOSTED_CATEGORIES: MemoryCategory[] = ['NORTH_STAR', 'NON_GOAL'];
const BOOST_AMOUNT = 0.15;

/**
 * Weight multipliers for different relevance signals.
 */
const WEIGHTS = {
  fileMatch: 0.35,
  moduleMatch: 0.25,
  categoryBoost: 0.15,
  importance: 0.15,
  recency: 0.10,
};

/**
 * Retrieves the most relevant memories for a push analysis using hybrid scoring.
 *
 * Strategy:
 * 1. File-based matching — memories whose relatedFiles overlap with changedFiles
 * 2. Module-based matching — memories whose relatedModules overlap with affectedModules
 * 3. Category boosting — NORTH_STAR and NON_GOAL always get a relevance boost
 * 4. Importance weighting — higher importance = more relevant
 * 5. Recency weighting — more recent memories get a small boost
 *
 * For MVP this is pure in-memory scoring (no vector similarity / pgvector).
 */
export async function retrieveRelevantMemories(
  repoId: string,
  changedFiles: string[],
  intentSummary: string,
  affectedModules: string[],
  allMemories: Memory[],
  limit: number = 15
): Promise<MemoryWithRelevance[]> {
  console.log(`[memory-retrieval] Retrieving memories for repo ${repoId}`, {
    changedFiles: changedFiles.length,
    affectedModules: affectedModules.length,
    totalMemories: allMemories.length,
  });

  try {
    // Filter to active memories for this repo
    const activeMemories = allMemories.filter(
      m => m.repoId === repoId && m.status === 'active'
    );

    if (activeMemories.length === 0) {
      console.log(`[memory-retrieval] No active memories for repo ${repoId}`);
      return [];
    }

    // Normalize file paths for comparison
    const normalizedChanged = new Set(changedFiles.map(normalizeFilePath));
    const normalizedModules = new Set(affectedModules.map(m => m.toLowerCase().trim()));

    // Tokenize intent summary for basic keyword matching
    const intentTokens = tokenize(intentSummary);

    // Score each memory
    const scored: MemoryWithRelevance[] = activeMemories.map(memory => {
      const fileScore = computeFileScore(memory.relatedFiles, normalizedChanged);
      const moduleScore = computeModuleScore(memory.relatedModules, normalizedModules);
      const categoryScore = BOOSTED_CATEGORIES.includes(memory.category) ? BOOST_AMOUNT : 0;
      const importanceNormalized = memory.importanceScore / 10;
      const recencyScore = computeRecencyScore(memory.createdAt);
      const keywordScore = computeKeywordScore(memory.statement, intentTokens);

      // Weighted combination
      const relevanceScore = clamp(
        (fileScore * WEIGHTS.fileMatch) +
        (moduleScore * WEIGHTS.moduleMatch) +
        (categoryScore * WEIGHTS.categoryBoost) +
        (importanceNormalized * WEIGHTS.importance) +
        (recencyScore * WEIGHTS.recency) +
        (keywordScore * 0.10), // bonus keyword signal
        0,
        1
      );

      return { ...memory, relevanceScore };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Always include NORTH_STAR and NON_GOAL in results if they exist, even if score is low
    const result: MemoryWithRelevance[] = [];
    const seen = new Set<string>();

    // First pass: ensure critical categories are included
    for (const memory of scored) {
      if (BOOSTED_CATEGORIES.includes(memory.category) && result.length < limit) {
        result.push(memory);
        seen.add(memory.id);
      }
    }

    // Second pass: fill remaining slots with highest scored
    for (const memory of scored) {
      if (result.length >= limit) break;
      if (!seen.has(memory.id)) {
        result.push(memory);
        seen.add(memory.id);
      }
    }

    // Re-sort final result
    result.sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log(`[memory-retrieval] Retrieved ${result.length} memories`, {
      topScore: result[0]?.relevanceScore.toFixed(3),
      categories: [...new Set(result.map(m => m.category))],
    });

    return result;
  } catch (error) {
    console.error(`[memory-retrieval] Failed for repo ${repoId}:`, error);
    return [];
  }
}

/**
 * Scores how well a memory's related files match the changed files.
 * Uses both exact match and directory-level proximity.
 */
function computeFileScore(memoryFiles: string[], changedFiles: Set<string>): number {
  if (memoryFiles.length === 0 || changedFiles.size === 0) return 0;

  let exactMatches = 0;
  let directoryMatches = 0;

  const changedDirs = new Set<string>();
  for (const f of changedFiles) {
    const dir = f.split('/').slice(0, -1).join('/');
    if (dir) changedDirs.add(dir);
  }

  for (const file of memoryFiles) {
    const normalized = normalizeFilePath(file);
    if (changedFiles.has(normalized)) {
      exactMatches++;
    } else {
      const dir = normalized.split('/').slice(0, -1).join('/');
      if (dir && changedDirs.has(dir)) {
        directoryMatches++;
      }
    }
  }

  if (exactMatches > 0) return Math.min(1, 0.7 + (exactMatches * 0.1));
  if (directoryMatches > 0) return Math.min(0.5, directoryMatches * 0.15);
  return 0;
}

/**
 * Scores how well a memory's related modules match the affected modules.
 */
function computeModuleScore(memoryModules: string[], affectedModules: Set<string>): number {
  if (memoryModules.length === 0 || affectedModules.size === 0) return 0;

  let matches = 0;
  for (const mod of memoryModules) {
    const normalizedMod = mod.toLowerCase().trim();
    if (affectedModules.has(normalizedMod)) {
      matches++;
    } else {
      // Partial match: check if any affected module contains this module name or vice versa
      for (const affected of affectedModules) {
        if (affected.includes(normalizedMod) || normalizedMod.includes(affected)) {
          matches += 0.5;
          break;
        }
      }
    }
  }

  return Math.min(1, matches / Math.max(1, memoryModules.length));
}

/**
 * Scores recency — more recent memories get a small boost.
 * Uses exponential decay with a half-life of 30 days.
 */
function computeRecencyScore(createdAt: string): number {
  try {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24);
    const halfLife = 30; // days
    return Math.exp(-0.693 * daysSinceCreation / halfLife);
  } catch {
    return 0.5; // default for unparseable dates
  }
}

/**
 * Basic keyword overlap between memory statement and intent summary.
 */
function computeKeywordScore(statement: string, intentTokens: Set<string>): number {
  if (intentTokens.size === 0) return 0;

  const statementTokens = tokenize(statement);
  let overlap = 0;
  for (const token of statementTokens) {
    if (intentTokens.has(token)) overlap++;
  }

  return Math.min(1, overlap / Math.max(1, intentTokens.size) * 2);
}

/**
 * Tokenizes text into a set of lowercase words, filtering out stop words and short tokens.
 */
function tokenize(text: string): Set<string> {
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
    'nor', 'not', 'no', 'so', 'than', 'too', 'very', 'just', 'this',
    'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
    'we', 'our', 'he', 'she', 'his', 'her', 'my', 'your', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function normalizeFilePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase().trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
