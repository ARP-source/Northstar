// Timeline event types for NorthStar

export type TimelineEventType =
  | 'ingestion'
  | 'push_analyzed'
  | 'memory_created'
  | 'memory_archived'
  | 'pivot_detected'
  | 'score_change'
  | 'governance_update';

export interface TimelineEvent {
  id: string;
  repoId: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  relatedPushId: string | null;
  relatedMemoryId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const EVENT_TYPE_CONFIG: Record<TimelineEventType, { label: string; color: string; icon: string }> = {
  ingestion: { label: 'Repo Ingested', color: 'text-blue-400', icon: '📥' },
  push_analyzed: { label: 'Push Analyzed', color: 'text-emerald-400', icon: '🔍' },
  memory_created: { label: 'Memory Created', color: 'text-violet-400', icon: '🧠' },
  memory_archived: { label: 'Memory Archived', color: 'text-zinc-400', icon: '📦' },
  pivot_detected: { label: 'Pivot Detected', color: 'text-amber-400', icon: '🔄' },
  score_change: { label: 'Score Changed', color: 'text-cyan-400', icon: '📊' },
  governance_update: { label: 'Governance Updated', color: 'text-indigo-400', icon: '📋' },
};
