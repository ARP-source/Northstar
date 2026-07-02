# Devpost Writeup: NorthStar

## Inspiration
Software repositories have a memory problem. When projects start, the original team has a crystal clear "North Star": they know the target users, the architectural constraints, and most importantly, the non-goals. But as the codebase grows—especially in the era of AI-generated code (vibe-coding)—that original intent is slowly lost. 

Every new push can slowly drift the repo away from its mission. Existing tools only review syntax, linting, and style. We realized that what AI-assisted software engineering really needs is **long-term memory**. A system that remembers what the project is *supposed to become*, and checks every change against that mission.

## What it does
NorthStar is a persistent memory agent for GitHub repositories.

Whenever a push or pull request happens, NorthStar:
1. Understands the intent behind the code changes.
2. Retrieves relevant structured memories (e.g., architectural decisions, non-goals, past pivots).
3. Compares the new change against the repo's remembered intent.
4. Detects **drift** (e.g., introducing features that were explicitly marked as non-goals).
5. Flags **hallucination risk** (e.g., AI-generated phantom dependencies or disconnected abstractions).
6. Explains its findings clearly and concisely, like a senior principal engineer.

## How we built it
We architected NorthStar around an 8-stage agent pipeline powered entirely by **Qwen Cloud**.

1. **Repo Ingestion Agent** (`qwen-plus`): Generates initial project understanding from the codebase.
2. **Memory Construction Agent** (`qwen-plus`): Structures that understanding into categorized memory objects (North Star, Non-Goals, Architecture Decisions).
3. **Push Diff Agent** (`qwen-turbo`): Rapidly analyzes the intent of incoming code diffs.
4. **Memory Retrieval Logic**: Scores and ranks memories based on affected files and module boundaries.
5. **Drift Detection Agent** (`qwen-plus`): Compares the diff intent against retrieved memories.
6. **Hallucination Risk Agent** (`qwen-plus`): Scans for AI-slop patterns (fake imports, duplicate logic).
7. **Forgetting Agent** (`qwen-turbo`): Archives stale assumptions when it detects an intentional product pivot.
8. **Explanation Agent** (`qwen-turbo`): Formats the output for humans and generates PR comments.

The frontend is a fast, beautiful Next.js 15 application using Tailwind CSS v4 and shadcn/ui. 

## Challenges we ran into
Getting an LLM to accurately distinguish between "accidental drift" and "an intentional product pivot" is very difficult. Initially, the system would aggressively flag any major architectural change as "drift." 

We solved this by introducing the concept of **"Forgetting"** (Agent 7). By giving the system explicit instructions to look for pivot signals (like README updates or explicit commit messages), it learns to archive stale memories and update its understanding, rather than blocking progress.

## Accomplishments that we're proud of
We are incredibly proud of the **UI and UX**. Most AI hackathon projects are simple chatbot wrappers. NorthStar feels like a real, polished developer tool. The dashboard immediately communicates the repository's health, and the memory explorer makes the agent's internal state completely transparent and inspectable.

We are also proud of the **Qwen Cloud integration**. By routing complex reasoning tasks to `qwen-plus` and simpler summarization/classification tasks to `qwen-turbo`, we achieved a fast, cost-effective pipeline that produces structured, reliable outputs.

## What we learned
We learned that giving an agent *too much* context can actually degrade its performance. When we tried feeding the entire memory graph into the drift detection agent, it hallucinated connections. Building a strict retrieval and ranking system before the LLM call was critical for accuracy. 

## What's next for NorthStar
1. **GitHub App Integration**: Moving from webhooks to a fully fledged GitHub App that can block PRs and post inline comments automatically.
2. **Vector Database Integration**: Adding `pgvector` and Qwen's `text-embedding-v3` to allow semantic search over thousands of memory objects for enterprise monorepos.
3. **IDE Plugin**: Bringing the memory graph directly into VS Code, so developers can see if their current edits violate the project's non-goals *before* they push.
