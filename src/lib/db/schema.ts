// Database schema for NorthStar - Drizzle ORM with PostgreSQL
// Note: For the MVP demo, we use a JSON-file-based data layer instead of PostgreSQL
// to eliminate the database dependency for hackathon judges. The schema is defined here
// for documentation and future migration to a real database.

import type { Memory, MemoryCategory, MemoryStatus } from '@/lib/types/memory';
import type { Push, PushAnalysis, FileChange, DriftFinding, HallucinationFinding, SuggestedFix, ChangeType, Verdict, PushType } from '@/lib/types/push';
import type { Repo } from '@/lib/types/repo';
import type { GovernanceRule, GovernanceRuleType } from '@/lib/types/governance';
import type { TimelineEvent, TimelineEventType } from '@/lib/types/timeline';

// Re-export types for convenience
export type { Memory, Push, PushAnalysis, Repo, GovernanceRule, TimelineEvent };
export type { MemoryCategory, MemoryStatus, FileChange, DriftFinding, HallucinationFinding };
export type { SuggestedFix, ChangeType, Verdict, PushType, GovernanceRuleType, TimelineEventType };
