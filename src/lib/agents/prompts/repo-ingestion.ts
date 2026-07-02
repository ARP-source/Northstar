// Prompt template for repo ingestion analysis
// Extracts high-level understanding of a repository from its content

// ── Output Interface ───────────────────────────────────────────────────────────

export interface KeyModule {
  name: string;
  responsibility: string;
  files: string[];
}

export interface RepoIngestionResult {
  project_mission: string;
  target_users: string[];
  tech_stack: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    infrastructure: string[];
  };
  architecture_shape: 'monolith' | 'microservices' | 'modular' | 'serverless' | 'hybrid';
  key_modules: KeyModule[];
  invariants: string[];
  non_goals: string[];
  coding_patterns: {
    pattern_name: string;
    description: string;
    examples: string[];
  }[];
  confidence_notes: string;
}

// ── System Prompt ──────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are NorthStar, an expert software architect performing deep analysis on a repository's content. Your goal is to extract the core identity, architecture, and design principles of the project.

You will be given information about a repository including its README, package.json or equivalent dependency files, folder structure, and key source files. Analyze this information carefully.

You MUST respond with a single valid JSON object matching this exact schema:

{
  "project_mission": "string — the core purpose and mission of this project in 1-2 sentences",
  "target_users": ["string — each distinct user persona or audience for this project"],
  "tech_stack": {
    "languages": ["string — programming languages used"],
    "frameworks": ["string — frameworks and major libraries"],
    "databases": ["string — databases and data stores"],
    "tools": ["string — build tools, CI/CD, testing frameworks"],
    "infrastructure": ["string — cloud providers, hosting, container tools"]
  },
  "architecture_shape": "monolith | microservices | modular | serverless | hybrid",
  "key_modules": [
    {
      "name": "string — module/component name",
      "responsibility": "string — what this module is responsible for",
      "files": ["string — key file paths belonging to this module"]
    }
  ],
  "invariants": ["string — things that must always be true about this codebase (e.g., 'all API routes require authentication', 'database migrations are always backward-compatible')"],
  "non_goals": ["string — things this project explicitly does NOT aim to do"],
  "coding_patterns": [
    {
      "pattern_name": "string — name of the coding pattern",
      "description": "string — how this pattern is applied",
      "examples": ["string — file paths or code references demonstrating this pattern"]
    }
  ],
  "confidence_notes": "string — any caveats or areas where you had to make assumptions due to limited information"
}

Guidelines:
- Be thorough but concise. Every field must be populated.
- For architecture_shape, choose the best fit even for unconventional structures.
- Key modules should capture the major boundaries/domains, not every single file.
- Invariants should capture non-obvious constraints that a developer MUST know.
- Non-goals are equally important as goals — they prevent scope creep.
- Coding patterns should capture team conventions, not universal best practices.
- If information is insufficient for a field, say so in confidence_notes rather than guessing.

Your response must be ONLY the JSON object. No markdown fences, no explanation, just valid JSON.`;

// ── User Message Builder ───────────────────────────────────────────────────────

export interface RepoData {
  repoUrl: string;
  owner: string;
  name: string;
  readme?: string;
  packageJson?: string;
  folderStructure: string;
  keyFiles: { path: string; content: string }[];
  branchName?: string;
  description?: string;
}

export function buildUserMessage(data: RepoData): string {
  const sections: string[] = [];

  sections.push(`# Repository: ${data.owner}/${data.name}`);
  sections.push(`URL: ${data.repoUrl}`);
  if (data.branchName) {
    sections.push(`Default Branch: ${data.branchName}`);
  }
  if (data.description) {
    sections.push(`Description: ${data.description}`);
  }

  if (data.readme) {
    sections.push(`\n## README\n\`\`\`\n${truncate(data.readme, 6000)}\n\`\`\``);
  }

  if (data.packageJson) {
    sections.push(`\n## Package / Dependency File\n\`\`\`json\n${truncate(data.packageJson, 3000)}\n\`\`\``);
  }

  sections.push(`\n## Folder Structure\n\`\`\`\n${truncate(data.folderStructure, 4000)}\n\`\`\``);

  if (data.keyFiles.length > 0) {
    sections.push(`\n## Key Files`);
    for (const file of data.keyFiles) {
      const ext = file.path.split('.').pop() ?? '';
      sections.push(`\n### ${file.path}\n\`\`\`${ext}\n${truncate(file.content, 3000)}\n\`\`\``);
    }
  }

  sections.push(`\nAnalyze this repository and produce the JSON output described in your instructions.`);

  return sections.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '\n... [truncated]';
}
