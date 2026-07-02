// NorthStar Demo Seed Data
// Simulates a "StudyFlow" productivity app with realistic memory and analysis history

import type { Memory } from '@/lib/types/memory';
import type { Push, PushAnalysis } from '@/lib/types/push';
import type { Repo } from '@/lib/types/repo';
import type { GovernanceRule } from '@/lib/types/governance';
import type { TimelineEvent } from '@/lib/types/timeline';

const REPO_ID = 'demo-studyflow-001';
const NOW = new Date();
const ago = (days: number, hours = 0) => new Date(NOW.getTime() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

// ============ DEMO REPO ============

export const demoRepo: Repo = {
  id: REPO_ID,
  githubUrl: 'https://github.com/demo-team/studyflow',
  owner: 'demo-team',
  name: 'studyflow',
  defaultBranch: 'main',
  northStar: 'Build a focused study session tracker for university students that helps them plan, execute, and review study sessions with spaced repetition and progress analytics.',
  architectureSummary: 'Next.js 14 monolith with App Router. PostgreSQL via Prisma. Three main modules: sessions (study session CRUD), cards (flashcard system with spaced repetition), analytics (progress tracking and visualization). Auth via NextAuth. Deployed on Vercel.',
  alignmentScore: 72,
  driftScore: 35,
  hallucinationRiskScore: 28,
  architectureConsistencyScore: 78,
  confidenceScore: 82,
  lastAnalyzedAt: ago(0, 2),
  createdAt: ago(14),
  updatedAt: ago(0, 2),
};

// ============ DEMO MEMORIES ============

export const demoMemories: Memory[] = [
  {
    id: 'mem-001',
    repoId: REPO_ID,
    category: 'NORTH_STAR',
    statement: 'StudyFlow is a focused study session tracker for university students. The core value proposition is helping students plan, execute, and review study sessions with built-in spaced repetition and progress analytics.',
    evidence: 'README.md states: "StudyFlow helps university students study smarter with session tracking, flashcards, and analytics." package.json description confirms focus on student productivity.',
    relatedFiles: ['README.md', 'package.json'],
    relatedModules: ['root'],
    confidenceScore: 0.95,
    importanceScore: 1.0,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'mem-002',
    repoId: REPO_ID,
    category: 'USER_NEED',
    statement: 'Target users are university students aged 18-25 who need to track study hours, review flashcards with spaced repetition, and see their progress over time.',
    evidence: 'README.md user stories section lists: "As a student, I want to log my study sessions", "As a student, I want flashcards that use spaced repetition", "As a student, I want to see my weekly study analytics".',
    relatedFiles: ['README.md', 'docs/user-stories.md'],
    relatedModules: ['sessions', 'cards', 'analytics'],
    confidenceScore: 0.9,
    importanceScore: 0.9,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'mem-003',
    repoId: REPO_ID,
    category: 'NON_GOAL',
    statement: 'StudyFlow is NOT a social platform. No social features, friend systems, leaderboards, or public profiles. The app is a personal productivity tool.',
    evidence: 'README.md non-goals section explicitly states: "This is not a social app. No friends, no leaderboards, no public profiles."',
    relatedFiles: ['README.md'],
    relatedModules: ['root'],
    confidenceScore: 0.95,
    importanceScore: 0.95,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'mem-004',
    repoId: REPO_ID,
    category: 'NON_GOAL',
    statement: 'No real-time collaboration features. StudyFlow is designed for individual use only.',
    evidence: 'Architecture decision record in docs/decisions.md: "We explicitly avoid real-time sync and collaboration to keep the architecture simple and the UX focused."',
    relatedFiles: ['docs/decisions.md'],
    relatedModules: ['root'],
    confidenceScore: 0.9,
    importanceScore: 0.85,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'mem-005',
    repoId: REPO_ID,
    category: 'ARCH_DECISION',
    statement: 'The application follows a modular monolith pattern using Next.js App Router. Three core modules: sessions, cards, and analytics. Each module owns its own API routes, database models, and UI components.',
    evidence: 'Folder structure shows src/app/(modules)/sessions/, src/app/(modules)/cards/, src/app/(modules)/analytics/ with clear separation. Each module has its own route group.',
    relatedFiles: ['src/app/(modules)/sessions/', 'src/app/(modules)/cards/', 'src/app/(modules)/analytics/'],
    relatedModules: ['sessions', 'cards', 'analytics'],
    confidenceScore: 0.9,
    importanceScore: 0.9,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(13),
  },
  {
    id: 'mem-006',
    repoId: REPO_ID,
    category: 'ARCH_DECISION',
    statement: 'Database access uses Prisma ORM exclusively. All database queries go through Prisma client. No raw SQL. Models defined in prisma/schema.prisma.',
    evidence: 'prisma/schema.prisma defines all models. All API routes import from @/lib/prisma. No raw SQL found in codebase.',
    relatedFiles: ['prisma/schema.prisma', 'src/lib/prisma.ts'],
    relatedModules: ['database'],
    confidenceScore: 0.95,
    importanceScore: 0.8,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'mem-007',
    repoId: REPO_ID,
    category: 'MODULE_ROLE',
    statement: 'The sessions module handles study session CRUD: creating sessions, starting/stopping timers, logging duration, and tagging by subject. It owns the Session and Subject models.',
    evidence: 'src/app/(modules)/sessions/ contains: page.tsx (list view), new/page.tsx (creation), [id]/page.tsx (detail), api/ routes for CRUD. Prisma schema has Session and Subject models.',
    relatedFiles: ['src/app/(modules)/sessions/', 'prisma/schema.prisma'],
    relatedModules: ['sessions'],
    confidenceScore: 0.9,
    importanceScore: 0.8,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(10),
  },
  {
    id: 'mem-008',
    repoId: REPO_ID,
    category: 'MODULE_ROLE',
    statement: 'The cards module implements a flashcard system with SM-2 spaced repetition algorithm. It owns Card, Deck, and ReviewLog models. Reviews are scheduled automatically based on performance.',
    evidence: 'src/app/(modules)/cards/ contains flashcard UI and review flow. src/lib/spaced-repetition.ts implements SM-2 algorithm. Prisma schema has Card, Deck, ReviewLog models.',
    relatedFiles: ['src/app/(modules)/cards/', 'src/lib/spaced-repetition.ts', 'prisma/schema.prisma'],
    relatedModules: ['cards'],
    confidenceScore: 0.9,
    importanceScore: 0.85,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(8),
  },
  {
    id: 'mem-009',
    repoId: REPO_ID,
    category: 'MODULE_ROLE',
    statement: 'The analytics module computes and displays study statistics: daily/weekly/monthly study hours, subject distribution, streak tracking, and spaced repetition performance graphs.',
    evidence: 'src/app/(modules)/analytics/ contains dashboard with charts. Uses Recharts for visualization. Reads from sessions and cards data.',
    relatedFiles: ['src/app/(modules)/analytics/', 'src/lib/analytics.ts'],
    relatedModules: ['analytics'],
    confidenceScore: 0.85,
    importanceScore: 0.75,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(14),
    updatedAt: ago(6),
  },
  {
    id: 'mem-010',
    repoId: REPO_ID,
    category: 'CODE_PATTERN',
    statement: 'All API routes follow the pattern: validate input with Zod, authenticate with getServerSession, perform business logic, return JSON response. Error responses use a consistent {error: string, code: number} format.',
    evidence: 'All route.ts files in src/app/api/ follow this pattern. Zod schemas defined alongside each route.',
    relatedFiles: ['src/app/api/', 'src/lib/validations/'],
    relatedModules: ['sessions', 'cards', 'analytics'],
    confidenceScore: 0.85,
    importanceScore: 0.7,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(13),
    updatedAt: ago(7),
  },
  {
    id: 'mem-011',
    repoId: REPO_ID,
    category: 'DEPENDENCY_POLICY',
    statement: 'UI components use shadcn/ui exclusively. No other component libraries (no Material UI, Chakra, Ant Design). Custom components extend shadcn primitives.',
    evidence: 'components.json configured for shadcn. All UI components in src/components/ui/ are shadcn-based. No other UI library in package.json.',
    relatedFiles: ['components.json', 'package.json', 'src/components/ui/'],
    relatedModules: ['ui'],
    confidenceScore: 0.9,
    importanceScore: 0.7,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(13),
    updatedAt: ago(13),
  },
  {
    id: 'mem-012',
    repoId: REPO_ID,
    category: 'RISK',
    statement: 'The spaced repetition algorithm (SM-2) is a critical path component. Changes to the scheduling logic could silently break review intervals for all users.',
    evidence: 'src/lib/spaced-repetition.ts is imported by the entire cards module review flow. No unit tests currently exist for the algorithm.',
    relatedFiles: ['src/lib/spaced-repetition.ts'],
    relatedModules: ['cards'],
    confidenceScore: 0.8,
    importanceScore: 0.9,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(12),
    updatedAt: ago(12),
  },
  {
    id: 'mem-013',
    repoId: REPO_ID,
    category: 'OPEN_QUESTION',
    statement: 'Should the analytics module compute metrics on-the-fly or use pre-aggregated materialized views? Current implementation queries raw data each time, which may not scale.',
    evidence: 'src/lib/analytics.ts runs aggregate queries on every page load. No caching layer. Performance concern noted in TODO comment.',
    relatedFiles: ['src/lib/analytics.ts'],
    relatedModules: ['analytics'],
    confidenceScore: 0.7,
    importanceScore: 0.6,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(10),
    updatedAt: ago(10),
  },
  {
    id: 'mem-014',
    repoId: REPO_ID,
    category: 'DEPRECATED_ASSUMPTION',
    statement: 'Originally planned to use Firebase for real-time features. This was abandoned in favor of a simpler PostgreSQL-only architecture.',
    evidence: 'Early commits show firebase config files that were later removed. docs/decisions.md records the decision to drop Firebase.',
    relatedFiles: ['docs/decisions.md'],
    relatedModules: ['root'],
    confidenceScore: 0.85,
    importanceScore: 0.4,
    status: 'archived',
    supersedesMemoryId: null,
    createdAt: ago(13),
    updatedAt: ago(11),
  },
  {
    id: 'mem-015',
    repoId: REPO_ID,
    category: 'CODE_PATTERN',
    statement: 'Authentication uses NextAuth.js with credential and Google OAuth providers. Protected routes check session server-side using getServerSession(). No client-side auth guards.',
    evidence: 'src/app/api/auth/[...nextauth]/route.ts configures providers. All protected API routes call getServerSession(authOptions) first.',
    relatedFiles: ['src/app/api/auth/[...nextauth]/route.ts', 'src/lib/auth.ts'],
    relatedModules: ['auth'],
    confidenceScore: 0.9,
    importanceScore: 0.75,
    status: 'active',
    supersedesMemoryId: null,
    createdAt: ago(13),
    updatedAt: ago(9),
  },
];

// ============ DEMO PUSHES ============

export const demoPushes: Push[] = [
  // Push 1: Good push - adds study timer feature
  {
    id: 'push-001',
    repoId: REPO_ID,
    commitSha: 'a1b2c3d4e5f6789012345678',
    commitMessage: 'feat(sessions): add pomodoro timer with configurable intervals\n\nAdds a pomodoro-style timer to study sessions. Users can configure work/break intervals. Timer state persists across page refreshes using localStorage.',
    author: 'alice-dev',
    branch: 'main',
    filesChanged: [
      { filename: 'src/app/(modules)/sessions/components/pomodoro-timer.tsx', status: 'added', additions: 145, deletions: 0 },
      { filename: 'src/app/(modules)/sessions/[id]/page.tsx', status: 'modified', additions: 12, deletions: 3 },
      { filename: 'src/lib/hooks/use-timer.ts', status: 'added', additions: 67, deletions: 0 },
      { filename: 'src/app/(modules)/sessions/components/session-controls.tsx', status: 'modified', additions: 8, deletions: 2 },
    ],
    diffContent: `diff --git a/src/app/(modules)/sessions/components/pomodoro-timer.tsx b/src/app/(modules)/sessions/components/pomodoro-timer.tsx
new file mode 100644
--- /dev/null
+++ b/src/app/(modules)/sessions/components/pomodoro-timer.tsx
@@ -0,0 +1,145 @@
+'use client';
+import { useState, useEffect } from 'react';
+import { useTimer } from '@/lib/hooks/use-timer';
+import { Button } from '@/components/ui/button';
+import { Card } from '@/components/ui/card';
+
+interface PomodoroTimerProps {
+  sessionId: string;
+  workMinutes?: number;
+  breakMinutes?: number;
+  onComplete?: (elapsed: number) => void;
+}
+
+export function PomodoroTimer({ sessionId, workMinutes = 25, breakMinutes = 5, onComplete }: PomodoroTimerProps) {
+  const { time, isRunning, start, pause, reset } = useTimer(workMinutes * 60);
+  // ... timer implementation
+}`,
    pushType: 'push',
    prNumber: null,
    receivedAt: ago(5),
  },
  // Push 2: Bad push - introduces social features (violates non-goal)
  {
    id: 'push-002',
    repoId: REPO_ID,
    commitSha: 'b2c3d4e5f6789012345678ab',
    commitMessage: 'feat: add study groups and leaderboard\n\nAdds ability to create study groups, invite friends, and compete on a weekly leaderboard. Includes real-time presence indicators.',
    author: 'bob-vibes',
    branch: 'main',
    filesChanged: [
      { filename: 'src/app/(modules)/social/page.tsx', status: 'added', additions: 234, deletions: 0 },
      { filename: 'src/app/(modules)/social/groups/page.tsx', status: 'added', additions: 189, deletions: 0 },
      { filename: 'src/app/(modules)/social/leaderboard/page.tsx', status: 'added', additions: 156, deletions: 0 },
      { filename: 'src/app/api/social/groups/route.ts', status: 'added', additions: 98, deletions: 0 },
      { filename: 'src/app/api/social/leaderboard/route.ts', status: 'added', additions: 67, deletions: 0 },
      { filename: 'src/lib/realtime.ts', status: 'added', additions: 112, deletions: 0 },
      { filename: 'prisma/schema.prisma', status: 'modified', additions: 45, deletions: 0 },
      { filename: 'package.json', status: 'modified', additions: 3, deletions: 0 },
      { filename: 'src/app/layout.tsx', status: 'modified', additions: 5, deletions: 1 },
    ],
    diffContent: `diff --git a/src/app/(modules)/social/page.tsx b/src/app/(modules)/social/page.tsx
new file mode 100644
--- /dev/null
+++ b/src/app/(modules)/social/page.tsx
@@ -0,0 +1,234 @@
+'use client';
+import { SocketProvider } from '@/lib/realtime';
+import { LeaderboardWidget } from './leaderboard/leaderboard-widget';
+import { GroupList } from './groups/group-list';
+import { FriendActivity } from './components/friend-activity';
+
+// New social module for study groups and competitions
+export default function SocialPage() {
+  return (
+    <SocketProvider>
+      <div className="space-y-6">
+        <h1>Study Groups & Leaderboard</h1>
+        <GroupList />
+        <LeaderboardWidget />
+        <FriendActivity />
+      </div>
+    </SocketProvider>
+  );
+}

diff --git a/src/lib/realtime.ts b/src/lib/realtime.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/realtime.ts
@@ -0,0 +1,112 @@
+import { io } from 'socket.io-client';
+// Real-time presence and messaging via Socket.IO
+// Connects to a separate WebSocket server for live updates
+const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
+export class RealtimeService {
+  // ... WebSocket management for presence, typing indicators, live leaderboard

diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -15,6 +15,9 @@
+    "socket.io-client": "^4.7.0",
+    "@supabase/realtime-js": "^2.9.0",
+    "pusher-js": "^8.3.0",`,
    pushType: 'push',
    prNumber: null,
    receivedAt: ago(2),
  },
  // Push 3: Intentional pivot - migrating from sessions to focus on AI-powered study plans
  {
    id: 'push-003',
    repoId: REPO_ID,
    commitSha: 'c3d4e5f6789012345678abcd',
    commitMessage: 'feat: pivot to AI-powered study plans\n\nMajor product pivot: shifting focus from manual session tracking to AI-generated study plans. The AI analyzes course syllabi and generates optimal study schedules with spaced repetition built in.\n\nBREAKING: Deprecates manual session creation flow in favor of AI-planned sessions.',
    author: 'alice-dev',
    branch: 'main',
    filesChanged: [
      { filename: 'src/app/(modules)/ai-planner/page.tsx', status: 'added', additions: 198, deletions: 0 },
      { filename: 'src/app/(modules)/ai-planner/components/syllabus-upload.tsx', status: 'added', additions: 87, deletions: 0 },
      { filename: 'src/app/(modules)/ai-planner/components/plan-view.tsx', status: 'added', additions: 145, deletions: 0 },
      { filename: 'src/app/api/ai/generate-plan/route.ts', status: 'added', additions: 123, deletions: 0 },
      { filename: 'src/lib/ai/study-planner.ts', status: 'added', additions: 167, deletions: 0 },
      { filename: 'README.md', status: 'modified', additions: 15, deletions: 8 },
      { filename: 'src/app/(modules)/sessions/page.tsx', status: 'modified', additions: 3, deletions: 45 },
    ],
    diffContent: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,8 +1,15 @@
-# StudyFlow - Study Session Tracker
-StudyFlow helps university students study smarter with session tracking, flashcards, and analytics.
+# StudyFlow - AI-Powered Study Planner
+StudyFlow uses AI to generate optimal study plans from your course syllabi.
+Upload your syllabus, and StudyFlow creates a personalized study schedule
+with spaced repetition built in.
+
+## New: AI Study Plans
+- Upload course syllabi (PDF, text, or image)
+- AI analyzes topics and generates study schedules
+- Automatic spaced repetition scheduling
+- Progress tracking against AI-generated milestones

diff --git a/src/lib/ai/study-planner.ts b/src/lib/ai/study-planner.ts
new file mode 100644
--- /dev/null
+++ b/src/lib/ai/study-planner.ts
@@ -0,0 +1,167 @@
+import OpenAI from 'openai';
+
+const client = new OpenAI({
+  apiKey: process.env.OPENAI_API_KEY,
+});
+
+export interface StudyPlan {
+  topics: StudyTopic[];
+  schedule: ScheduleEntry[];
+  estimatedHours: number;
+}
+
+export async function generateStudyPlan(syllabusText: string): Promise<StudyPlan> {
+  // AI-powered study plan generation
+}`,
    pushType: 'push',
    prNumber: null,
    receivedAt: ago(0, 3),
  },
];

// ============ DEMO PUSH ANALYSES ============

export const demoPushAnalyses: PushAnalysis[] = [
  // Analysis for Push 1 (good push)
  {
    id: 'analysis-001',
    pushId: 'push-001',
    repoId: REPO_ID,
    intentSummary: 'Adds a pomodoro-style timer component to study sessions, allowing users to configure work/break intervals. The timer integrates with the existing session module and persists state via localStorage.',
    changeType: 'additive',
    verdict: 'aligned',
    alignmentScore: 92,
    driftScore: 5,
    hallucinationRiskScore: 3,
    architectureConsistencyScore: 95,
    confidenceScore: 90,
    driftFindings: [],
    hallucinationFindings: [],
    recalledMemoryIds: ['mem-001', 'mem-005', 'mem-007', 'mem-010', 'mem-011'],
    explanation: 'This change is well-aligned with StudyFlow\'s mission. The pomodoro timer directly enhances the study session experience for university students. The implementation follows the established module pattern — new components are added within the sessions module, using shadcn/ui primitives and a clean custom hook for timer logic. No architectural boundaries are crossed, and the feature maps directly to the project\'s north star of helping students plan and execute study sessions.\n\nThe code follows existing patterns: it uses the established component structure, leverages shadcn/ui (consistent with the dependency policy), and adds functionality within the sessions module boundary. localStorage usage for state persistence is a pragmatic choice that avoids unnecessary backend complexity.',
    suggestedFixes: [],
    prComment: null,
    createdAt: ago(5),
  },
  // Analysis for Push 2 (bad push - social features)
  {
    id: 'analysis-002',
    pushId: 'push-002',
    repoId: REPO_ID,
    intentSummary: 'Introduces a new social module with study groups, leaderboards, friend activity, and real-time presence indicators. Adds Socket.IO, Supabase Realtime, and Pusher dependencies for WebSocket functionality.',
    changeType: 'hallucinated',
    verdict: 'architecture_breaking',
    alignmentScore: 12,
    driftScore: 92,
    hallucinationRiskScore: 78,
    architectureConsistencyScore: 25,
    confidenceScore: 95,
    driftFindings: [
      {
        type: 'non_goal_violation',
        severity: 'critical',
        description: 'This push introduces social features (study groups, leaderboards, friend activity) which are explicitly listed as non-goals. The README states: "This is not a social app. No friends, no leaderboards, no public profiles."',
        evidence: 'Memory mem-003 records the non-goal: "StudyFlow is NOT a social platform." This push directly contradicts that with a full social module.',
        relatedMemoryId: 'mem-003',
        affectedFiles: ['src/app/(modules)/social/page.tsx', 'src/app/(modules)/social/groups/page.tsx', 'src/app/(modules)/social/leaderboard/page.tsx'],
      },
      {
        type: 'non_goal_violation',
        severity: 'high',
        description: 'Real-time collaboration features directly violate the recorded non-goal of avoiding real-time sync.',
        evidence: 'Memory mem-004 states: "No real-time collaboration features. StudyFlow is designed for individual use only." This push adds WebSocket-based real-time presence.',
        relatedMemoryId: 'mem-004',
        affectedFiles: ['src/lib/realtime.ts'],
      },
      {
        type: 'architecture_violation',
        severity: 'high',
        description: 'New "social" module violates the established three-module architecture (sessions, cards, analytics) without updating the architecture decision record.',
        evidence: 'Memory mem-005 documents the modular monolith with three core modules. Adding a fourth module without updating the architecture documentation breaks the recorded design.',
        relatedMemoryId: 'mem-005',
        affectedFiles: ['src/app/(modules)/social/'],
      },
    ],
    hallucinationFindings: [
      {
        type: 'disconnected_abstraction',
        severity: 'high',
        description: 'The RealtimeService class introduces a WebSocket abstraction that is completely disconnected from the existing architecture. No other part of the codebase uses WebSockets.',
        evidence: 'src/lib/realtime.ts creates a SocketProvider and RealtimeService with no connection to existing data flow patterns. The rest of the app uses REST APIs exclusively.',
        affectedFiles: ['src/lib/realtime.ts'],
        codeSnippet: 'const socket = io(process.env.NEXT_PUBLIC_WS_URL || \'ws://localhost:3001\');',
      },
      {
        type: 'unexplained_stack_change',
        severity: 'high',
        description: 'Three new real-time dependencies added (socket.io-client, @supabase/realtime-js, pusher-js) without architectural justification. The presence of three competing real-time libraries suggests AI-generated code that hedges across multiple solutions.',
        evidence: 'package.json adds socket.io-client, @supabase/realtime-js, AND pusher-js. Using three different real-time libraries is a strong indicator of hallucinated code — a human developer would choose one.',
        affectedFiles: ['package.json'],
      },
      {
        type: 'phantom_import',
        severity: 'medium',
        description: 'References to FriendActivity component and LeaderboardWidget that don\'t have implementations in the diff.',
        evidence: 'social/page.tsx imports FriendActivity and LeaderboardWidget but their full implementations are not visible in the changed files.',
        affectedFiles: ['src/app/(modules)/social/page.tsx'],
      },
    ],
    recalledMemoryIds: ['mem-001', 'mem-003', 'mem-004', 'mem-005', 'mem-007', 'mem-008', 'mem-009', 'mem-011'],
    explanation: '🚨 **Critical: This push fundamentally contradicts the project\'s stated non-goals.**\n\nStudyFlow explicitly defines itself as a personal productivity tool, NOT a social platform. The project\'s non-goals clearly state "no friends, no leaderboards, no public profiles" and "no real-time collaboration." This push introduces all of those things.\n\nBeyond the product conflict, the code shows strong hallucination signals: three competing WebSocket libraries (socket.io, Supabase Realtime, AND Pusher) were added simultaneously — a pattern typical of AI-generated code that hedges across multiple solutions rather than making a deliberate architectural choice. The RealtimeService abstraction has no connection to the existing REST-based data flow.\n\nThe push also breaks the three-module architecture (sessions, cards, analytics) by introducing a fourth "social" module without updating any architecture documentation or decision records.',
    suggestedFixes: [
      {
        title: 'Revert the social module entirely',
        description: 'This feature contradicts documented non-goals. If social features are now desired, first update the project\'s north star, non-goals, and architecture decisions to reflect the new direction.',
        priority: 'high',
        affectedFiles: ['src/app/(modules)/social/'],
      },
      {
        title: 'Remove redundant real-time dependencies',
        description: 'If any real-time functionality is kept, choose ONE library (recommend Supabase Realtime since the project already uses PostgreSQL). Remove socket.io-client and pusher-js.',
        priority: 'high',
        affectedFiles: ['package.json'],
      },
      {
        title: 'Update architecture documentation before proceeding',
        description: 'If the team decides to add social features, update the non-goals, architecture decisions, and module documentation first. This prevents future drift detection issues.',
        priority: 'medium',
        affectedFiles: ['README.md', 'docs/decisions.md'],
      },
    ],
    prComment: '## 🛡️ NorthStar Analysis\n\n### Verdict: 🔥 Architecture Breaking\n\n| Score | Value |\n|---|---|\n| Alignment | 12/100 ⚠️ |\n| Drift | 92/100 🔴 |\n| Hallucination Risk | 78/100 🔴 |\n| Architecture | 25/100 🔴 |\n| Confidence | 95/100 |\n\n### Critical Findings\n\n**1. Non-Goal Violation** — Social features (groups, leaderboards, friends) directly contradict documented non-goals.\n\n**2. Architecture Break** — New "social" module added outside the established three-module architecture.\n\n**3. Hallucination Signals** — Three competing WebSocket libraries added simultaneously (socket.io, Supabase Realtime, Pusher). This is a strong indicator of AI-generated code.\n\n### Recommended Actions\n1. Revert the social module\n2. If social features are now desired, update project goals and architecture docs first\n3. Choose a single real-time library if WebSocket functionality is needed\n\n---\n*Analyzed by NorthStar Memory Agent*',
    createdAt: ago(2),
  },
  // Analysis for Push 3 (intentional pivot)
  {
    id: 'analysis-003',
    pushId: 'push-003',
    repoId: REPO_ID,
    intentSummary: 'Major product pivot from manual session tracking to AI-powered study plan generation. Adds new ai-planner module that accepts course syllabi and generates optimized study schedules. The README has been updated to reflect the new direction.',
    changeType: 'pivot',
    verdict: 'risky',
    alignmentScore: 58,
    driftScore: 55,
    hallucinationRiskScore: 22,
    architectureConsistencyScore: 65,
    confidenceScore: 75,
    driftFindings: [
      {
        type: 'goal_conflict',
        severity: 'medium',
        description: 'This push changes the project\'s core value proposition from "study session tracker" to "AI-powered study planner." The README has been updated, suggesting this is an intentional pivot rather than drift.',
        evidence: 'README changes from "StudyFlow helps university students study smarter with session tracking" to "StudyFlow uses AI to generate optimal study plans from your course syllabi."',
        relatedMemoryId: 'mem-001',
        affectedFiles: ['README.md'],
      },
      {
        type: 'scope_creep',
        severity: 'low',
        description: 'New ai-planner module adds a fourth module to the three-module architecture. However, since this appears to be an intentional pivot, this may be acceptable.',
        evidence: 'New module at src/app/(modules)/ai-planner/ extends the current three-module pattern.',
        relatedMemoryId: 'mem-005',
        affectedFiles: ['src/app/(modules)/ai-planner/'],
      },
    ],
    hallucinationFindings: [
      {
        type: 'placeholder_as_complete',
        severity: 'low',
        description: 'The study-planner.ts file defines the interface but the generateStudyPlan function implementation appears to be a stub.',
        evidence: 'Function body shows "// AI-powered study plan generation" comment but limited actual implementation.',
        affectedFiles: ['src/lib/ai/study-planner.ts'],
        codeSnippet: 'export async function generateStudyPlan(syllabusText: string): Promise<StudyPlan> {\n  // AI-powered study plan generation\n}',
      },
    ],
    recalledMemoryIds: ['mem-001', 'mem-002', 'mem-005', 'mem-007', 'mem-008', 'mem-013'],
    explanation: '**This appears to be an intentional product pivot**, not accidental drift. The README has been updated to reflect the new direction, and the commit message explicitly labels this as a pivot.\n\nNorthStar detects that the project\'s north star is changing from "study session tracker" to "AI-powered study planner." This is a significant shift that will require updating several active memories:\n\n- The north star memory (mem-001) needs to be superseded\n- Module role definitions need updating\n- The architecture decision about three modules needs revision\n\nThe change is architecturally reasonable — the new ai-planner module follows existing patterns. However, the study-planner.ts implementation appears to be a stub. Before this pivot compounds, ensure the AI planning logic is fully implemented and tested.\n\n**Memory Action Required**: NorthStar will archive the old north star and create a new one reflecting the AI-planner direction. Stale memories about manual session tracking being the core flow will be marked as deprecated.',
    suggestedFixes: [
      {
        title: 'Complete the AI planner implementation',
        description: 'The generateStudyPlan function in study-planner.ts appears to be a stub. Ensure the core AI logic is implemented before building UI on top of it.',
        priority: 'high',
        affectedFiles: ['src/lib/ai/study-planner.ts'],
      },
      {
        title: 'Update architecture documentation',
        description: 'Add the ai-planner module to the architecture docs and update the module count from three to four.',
        priority: 'medium',
        affectedFiles: ['docs/decisions.md'],
      },
    ],
    prComment: null,
    createdAt: ago(0, 3),
  },
];

// ============ DEMO GOVERNANCE RULES ============

export const demoGovernanceRules: GovernanceRule[] = [
  {
    id: 'rule-001',
    repoId: REPO_ID,
    ruleType: 'north_star',
    title: 'StudyFlow Mission',
    description: 'Build a focused study session tracker for university students with spaced repetition and progress analytics.',
    priority: 5,
    active: true,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'rule-002',
    repoId: REPO_ID,
    ruleType: 'non_goal',
    title: 'No Social Features',
    description: 'StudyFlow is a personal productivity tool. No social features, friend systems, leaderboards, or public profiles.',
    priority: 5,
    active: true,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'rule-003',
    repoId: REPO_ID,
    ruleType: 'non_goal',
    title: 'No Real-Time Collaboration',
    description: 'No real-time sync, WebSocket connections, or collaborative editing. The app is for individual use.',
    priority: 4,
    active: true,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'rule-004',
    repoId: REPO_ID,
    ruleType: 'tech_stack',
    title: 'Next.js + Prisma + PostgreSQL',
    description: 'The stack is Next.js 14 with App Router, Prisma ORM, and PostgreSQL. Do not introduce alternative ORMs, databases, or frameworks.',
    priority: 4,
    active: true,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: 'rule-005',
    repoId: REPO_ID,
    ruleType: 'do_not_break',
    title: 'Spaced Repetition Algorithm',
    description: 'The SM-2 spaced repetition algorithm in src/lib/spaced-repetition.ts is critical. Changes must be tested thoroughly.',
    priority: 5,
    active: true,
    createdAt: ago(12),
    updatedAt: ago(12),
  },
  {
    id: 'rule-006',
    repoId: REPO_ID,
    ruleType: 'style_preference',
    title: 'Module Boundaries',
    description: 'Each module (sessions, cards, analytics) owns its own routes, components, and data. Cross-module imports should go through shared libs only.',
    priority: 3,
    active: true,
    createdAt: ago(13),
    updatedAt: ago(13),
  },
  {
    id: 'rule-007',
    repoId: REPO_ID,
    ruleType: 'forbidden_pattern',
    title: 'No Raw SQL',
    description: 'All database access must go through Prisma. No raw SQL queries, no direct pg connections.',
    priority: 4,
    active: true,
    createdAt: ago(13),
    updatedAt: ago(13),
  },
  {
    id: 'rule-008',
    repoId: REPO_ID,
    ruleType: 'style_preference',
    title: 'shadcn/ui Only',
    description: 'Use shadcn/ui for all UI components. Do not introduce Material UI, Chakra, Ant Design, or other component libraries.',
    priority: 3,
    active: true,
    createdAt: ago(13),
    updatedAt: ago(13),
  },
];

// ============ DEMO TIMELINE EVENTS ============

export const demoTimelineEvents: TimelineEvent[] = [
  {
    id: 'evt-001',
    repoId: REPO_ID,
    eventType: 'ingestion',
    title: 'Repository Ingested',
    description: 'NorthStar analyzed the StudyFlow repository and created initial memory graph with 15 memory objects across 9 categories.',
    relatedPushId: null,
    relatedMemoryId: null,
    metadata: { memoriesCreated: 15, filesAnalyzed: 42 },
    createdAt: ago(14),
  },
  {
    id: 'evt-002',
    repoId: REPO_ID,
    eventType: 'memory_created',
    title: 'North Star Identified',
    description: 'Extracted project mission: "Build a focused study session tracker for university students with spaced repetition and progress analytics."',
    relatedPushId: null,
    relatedMemoryId: 'mem-001',
    metadata: { category: 'NORTH_STAR', confidence: 0.95 },
    createdAt: ago(14),
  },
  {
    id: 'evt-003',
    repoId: REPO_ID,
    eventType: 'memory_created',
    title: 'Non-Goals Recorded',
    description: 'Identified 2 explicit non-goals: no social features, no real-time collaboration.',
    relatedPushId: null,
    relatedMemoryId: 'mem-003',
    metadata: { category: 'NON_GOAL', count: 2 },
    createdAt: ago(14),
  },
  {
    id: 'evt-004',
    repoId: REPO_ID,
    eventType: 'push_analyzed',
    title: 'Push Analyzed: Pomodoro Timer ✓',
    description: 'Feature addition (pomodoro timer) analyzed as aligned with project goals. Alignment: 92/100.',
    relatedPushId: 'push-001',
    relatedMemoryId: null,
    metadata: { verdict: 'aligned', alignmentScore: 92 },
    createdAt: ago(5),
  },
  {
    id: 'evt-005',
    repoId: REPO_ID,
    eventType: 'push_analyzed',
    title: 'Push Analyzed: Social Features 🔥',
    description: 'Social features push flagged as architecture-breaking. Directly violates documented non-goals. Drift: 92/100, Hallucination Risk: 78/100.',
    relatedPushId: 'push-002',
    relatedMemoryId: null,
    metadata: { verdict: 'architecture_breaking', driftScore: 92, hallucinationRiskScore: 78 },
    createdAt: ago(2),
  },
  {
    id: 'evt-006',
    repoId: REPO_ID,
    eventType: 'score_change',
    title: 'Health Scores Degraded',
    description: 'Repository health scores dropped significantly after social features push. Alignment: 72 → 42, Drift: 15 → 65.',
    relatedPushId: 'push-002',
    relatedMemoryId: null,
    metadata: { alignmentBefore: 72, alignmentAfter: 42, driftBefore: 15, driftAfter: 65 },
    createdAt: ago(2),
  },
  {
    id: 'evt-007',
    repoId: REPO_ID,
    eventType: 'pivot_detected',
    title: 'Product Pivot Detected: AI Study Plans',
    description: 'Detected intentional pivot from manual session tracking to AI-powered study plan generation. README updated, commit message confirms pivot.',
    relatedPushId: 'push-003',
    relatedMemoryId: 'mem-001',
    metadata: { oldMission: 'study session tracker', newMission: 'AI-powered study planner' },
    createdAt: ago(0, 3),
  },
  {
    id: 'evt-008',
    repoId: REPO_ID,
    eventType: 'push_analyzed',
    title: 'Push Analyzed: AI Planner Pivot ⚠️',
    description: 'AI planner pivot analyzed as risky but intentional. Requires memory updates to avoid false positives on future pushes.',
    relatedPushId: 'push-003',
    relatedMemoryId: null,
    metadata: { verdict: 'risky', alignmentScore: 58, changeType: 'pivot' },
    createdAt: ago(0, 3),
  },
  {
    id: 'evt-009',
    repoId: REPO_ID,
    eventType: 'memory_archived',
    title: 'Stale Assumptions Archived',
    description: 'Following the AI planner pivot, NorthStar archived the original north star memory and updated the project mission to reflect the new direction.',
    relatedPushId: null,
    relatedMemoryId: 'mem-001',
    metadata: { archivedCount: 1, reason: 'Product pivot to AI study plans' },
    createdAt: ago(0, 2),
  },
];

// ============ FULL SEED DATA ============

export const seedData = {
  repos: [demoRepo],
  memories: demoMemories,
  pushes: demoPushes,
  pushAnalyses: demoPushAnalyses,
  governanceRules: demoGovernanceRules,
  timelineEvents: demoTimelineEvents,
};
