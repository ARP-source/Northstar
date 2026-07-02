// Repo ingestion pipeline — analyzes raw repository data to extract structured knowledge
import { jsonCompletion, QWEN_PLUS } from '@/lib/agents/qwen';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/agents/prompts/ingestion';

export interface ModuleInfo {
  name: string;
  role: string;
  files: string[];
  dependencies: string[];
}

export interface CodingPattern {
  name: string;
  description: string;
  examples: string[];
}

export interface RiskAssessment {
  description: string;
  severity: 'low' | 'medium' | 'high';
  area: string;
}

export interface InvariantInfo {
  category: string;
  statement: string;
  evidence: string;
  importance: number;
}

export interface IngestionResult {
  mission: string;
  northStar: string;
  stack: {
    language: string;
    framework: string;
    runtime: string;
    database: string;
    key_dependencies: string[];
    build_tools: string[];
  };
  architecture: {
    pattern: string;
    summary: string;
    layers: string[];
    key_boundaries: string[];
  };
  modules: ModuleInfo[];
  invariants: InvariantInfo[];
  coding_patterns: CodingPattern[];
  risks: RiskAssessment[];
}

const DEFAULT_INGESTION_RESULT: IngestionResult = {
  mission: 'Unable to determine project mission',
  northStar: 'Unable to determine north star',
  stack: {
    language: 'unknown',
    framework: 'unknown',
    runtime: 'unknown',
    database: 'none',
    key_dependencies: [],
    build_tools: [],
  },
  architecture: {
    pattern: 'unknown',
    summary: 'Unable to determine architecture',
    layers: [],
    key_boundaries: [],
  },
  modules: [],
  invariants: [],
  coding_patterns: [],
  risks: [],
};

export interface RepoData {
  readme?: string;
  packageJson?: string;
  folderStructure?: string;
  keyFiles?: Record<string, string>;
}

/**
 * Ingest a repository by analyzing its key files and extracting structured knowledge.
 * Uses Qwen Plus for deep analysis.
 */
export async function ingestRepo(
  repoId: string,
  repoData: RepoData
): Promise<IngestionResult> {
  console.log(`[ingestion] Starting ingestion for repo ${repoId}`);

  try {
    const userMessage = buildUserMessage(repoData);

    console.log(`[ingestion] Sending ${userMessage.length} chars to Qwen for analysis`);

    const result = await jsonCompletion<IngestionResult>(
      QWEN_PLUS,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      QWEN_PLUS,
      { temperature: 0.2, maxTokens: 8192 }
    );

    // Validate and normalize the result
    const validated = validateIngestionResult(result);

    console.log(`[ingestion] Completed for repo ${repoId}:`, {
      mission: validated.mission.slice(0, 80),
      modules: validated.modules.length,
      invariants: validated.invariants.length,
      patterns: validated.coding_patterns.length,
      risks: validated.risks.length,
    });

    return validated;
  } catch (error) {
    console.error(`[ingestion] Failed for repo ${repoId}:`, error);
    return { ...DEFAULT_INGESTION_RESULT };
  }
}

/**
 * Validates and normalizes ingestion result, filling in defaults for missing fields.
 */
function validateIngestionResult(raw: Partial<IngestionResult>): IngestionResult {
  return {
    mission: raw.mission || DEFAULT_INGESTION_RESULT.mission,
    northStar: raw.northStar || DEFAULT_INGESTION_RESULT.northStar,
    stack: {
      language: raw.stack?.language || 'unknown',
      framework: raw.stack?.framework || 'unknown',
      runtime: raw.stack?.runtime || 'unknown',
      database: raw.stack?.database || 'none',
      key_dependencies: Array.isArray(raw.stack?.key_dependencies) ? raw.stack.key_dependencies : [],
      build_tools: Array.isArray(raw.stack?.build_tools) ? raw.stack.build_tools : [],
    },
    architecture: {
      pattern: raw.architecture?.pattern || 'unknown',
      summary: raw.architecture?.summary || 'Unable to determine',
      layers: Array.isArray(raw.architecture?.layers) ? raw.architecture.layers : [],
      key_boundaries: Array.isArray(raw.architecture?.key_boundaries) ? raw.architecture.key_boundaries : [],
    },
    modules: Array.isArray(raw.modules)
      ? raw.modules.map(m => ({
          name: m.name || 'unnamed',
          role: m.role || 'unknown',
          files: Array.isArray(m.files) ? m.files : [],
          dependencies: Array.isArray(m.dependencies) ? m.dependencies : [],
        }))
      : [],
    invariants: Array.isArray(raw.invariants)
      ? raw.invariants.map(inv => ({
          category: inv.category || 'ARCH_DECISION',
          statement: inv.statement || '',
          evidence: inv.evidence || '',
          importance: typeof inv.importance === 'number' ? Math.min(10, Math.max(1, inv.importance)) : 5,
        }))
      : [],
    coding_patterns: Array.isArray(raw.coding_patterns)
      ? raw.coding_patterns.map(p => ({
          name: p.name || 'unnamed',
          description: p.description || '',
          examples: Array.isArray(p.examples) ? p.examples : [],
        }))
      : [],
    risks: Array.isArray(raw.risks)
      ? raw.risks.map(r => ({
          description: r.description || '',
          severity: (['low', 'medium', 'high'].includes(r.severity) ? r.severity : 'medium') as 'low' | 'medium' | 'high',
          area: r.area || 'unknown',
        }))
      : [],
  };
}
