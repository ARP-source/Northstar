// NorthStar Data Layer
// JSON-file-based data store for MVP demo
// This eliminates the PostgreSQL dependency for hackathon judges
// while maintaining the same interface a real DB would use.

import { promises as fs } from 'fs';
import path from 'path';
import type { Memory } from '@/lib/types/memory';
import type { Push, PushAnalysis } from '@/lib/types/push';
import type { Repo } from '@/lib/types/repo';
import type { GovernanceRule } from '@/lib/types/governance';
import type { TimelineEvent } from '@/lib/types/timeline';

interface Database {
  repos: Repo[];
  memories: Memory[];
  pushes: Push[];
  pushAnalyses: PushAnalysis[];
  governanceRules: GovernanceRule[];
  timelineEvents: TimelineEvent[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultDb: Database = {
  repos: [],
  memories: [],
  pushes: [],
  pushAnalyses: [],
  governanceRules: [],
  timelineEvents: [],
};

let cachedDb: Database | null = null;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function loadDb(): Promise<Database> {
  if (cachedDb) return cachedDb;
  
  try {
    await ensureDataDir();
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    cachedDb = JSON.parse(raw) as Database;
    return cachedDb;
  } catch {
    cachedDb = { ...defaultDb };
    return cachedDb;
  }
}

async function saveDb(db: Database): Promise<void> {
  await ensureDataDir();
  cachedDb = db;
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// ============ REPO OPERATIONS ============

export async function getRepos(): Promise<Repo[]> {
  const db = await loadDb();
  return db.repos;
}

export async function getRepo(id: string): Promise<Repo | null> {
  const db = await loadDb();
  return db.repos.find(r => r.id === id) || null;
}

export async function createRepo(repo: Repo): Promise<Repo> {
  const db = await loadDb();
  db.repos.push(repo);
  await saveDb(db);
  return repo;
}

export async function updateRepo(id: string, updates: Partial<Repo>): Promise<Repo | null> {
  const db = await loadDb();
  const idx = db.repos.findIndex(r => r.id === id);
  if (idx === -1) return null;
  db.repos[idx] = { ...db.repos[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveDb(db);
  return db.repos[idx];
}

// ============ MEMORY OPERATIONS ============

export async function getMemories(repoId: string, filters?: { category?: string; status?: string }): Promise<Memory[]> {
  const db = await loadDb();
  let memories = db.memories.filter(m => m.repoId === repoId);
  if (filters?.category) {
    memories = memories.filter(m => m.category === filters.category);
  }
  if (filters?.status) {
    memories = memories.filter(m => m.status === filters.status);
  }
  return memories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getMemory(id: string): Promise<Memory | null> {
  const db = await loadDb();
  return db.memories.find(m => m.id === id) || null;
}

export async function createMemory(memory: Memory): Promise<Memory> {
  const db = await loadDb();
  db.memories.push(memory);
  await saveDb(db);
  return memory;
}

export async function createMemories(memories: Memory[]): Promise<Memory[]> {
  const db = await loadDb();
  db.memories.push(...memories);
  await saveDb(db);
  return memories;
}

export async function updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
  const db = await loadDb();
  const idx = db.memories.findIndex(m => m.id === id);
  if (idx === -1) return null;
  db.memories[idx] = { ...db.memories[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveDb(db);
  return db.memories[idx];
}

export async function archiveMemories(ids: string[]): Promise<void> {
  const db = await loadDb();
  for (const id of ids) {
    const idx = db.memories.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.memories[idx].status = 'archived';
      db.memories[idx].updatedAt = new Date().toISOString();
    }
  }
  await saveDb(db);
}

// ============ PUSH OPERATIONS ============

export async function getPushes(repoId: string): Promise<Push[]> {
  const db = await loadDb();
  return db.pushes
    .filter(p => p.repoId === repoId)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

export async function getPush(id: string): Promise<Push | null> {
  const db = await loadDb();
  return db.pushes.find(p => p.id === id) || null;
}

export async function createPush(push: Push): Promise<Push> {
  const db = await loadDb();
  db.pushes.push(push);
  await saveDb(db);
  return push;
}

// ============ PUSH ANALYSIS OPERATIONS ============

export async function getAnalysis(pushId: string): Promise<PushAnalysis | null> {
  const db = await loadDb();
  return db.pushAnalyses.find(a => a.pushId === pushId) || null;
}

export async function getAnalyses(repoId: string): Promise<PushAnalysis[]> {
  const db = await loadDb();
  return db.pushAnalyses
    .filter(a => a.repoId === repoId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createAnalysis(analysis: PushAnalysis): Promise<PushAnalysis> {
  const db = await loadDb();
  db.pushAnalyses.push(analysis);
  await saveDb(db);
  return analysis;
}

// ============ GOVERNANCE OPERATIONS ============

export async function getGovernanceRules(repoId: string): Promise<GovernanceRule[]> {
  const db = await loadDb();
  return db.governanceRules
    .filter(r => r.repoId === repoId)
    .sort((a, b) => b.priority - a.priority);
}

export async function upsertGovernanceRules(repoId: string, rules: GovernanceRule[]): Promise<GovernanceRule[]> {
  const db = await loadDb();
  // Remove old rules for this repo
  db.governanceRules = db.governanceRules.filter(r => r.repoId !== repoId);
  // Add new rules
  db.governanceRules.push(...rules);
  await saveDb(db);
  return rules;
}

// ============ TIMELINE OPERATIONS ============

export async function getTimelineEvents(repoId: string): Promise<TimelineEvent[]> {
  const db = await loadDb();
  return db.timelineEvents
    .filter(e => e.repoId === repoId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTimelineEvent(event: TimelineEvent): Promise<TimelineEvent> {
  const db = await loadDb();
  db.timelineEvents.push(event);
  await saveDb(db);
  return event;
}

// ============ UTILITY ============

export async function resetDatabase(): Promise<void> {
  cachedDb = { ...defaultDb };
  await saveDb(cachedDb);
}

export async function importDatabase(data: Database): Promise<void> {
  cachedDb = data;
  await saveDb(data);
}

export async function exportDatabase(): Promise<Database> {
  return loadDb();
}

// Force reload from disk (useful after external modifications)
export async function reloadDatabase(): Promise<void> {
  cachedDb = null;
  await loadDb();
}
