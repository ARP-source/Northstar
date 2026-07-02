# Architecture

NorthStar uses a hybrid architecture combining a modern Next.js web application with an 8-stage intelligent agent pipeline powered by Qwen Cloud.

\`\`\`mermaid
graph TB
    subgraph "Frontend — Next.js + shadcn/ui"
        A[Dashboard Overview] --> B[Repo Health & Scores]
        A --> C[Memory Explorer]
        A --> D[Push Analysis View]
        A --> E[Governance Rules]
        A --> F[Timeline View]
    end

    subgraph "API Layer — Next.js API Routes"
        G["/api/repos"] --> H["/api/repos/[id]/memories"]
        G --> I["/api/repos/[id]/pushes"]
        G --> J["/api/repos/[id]/governance"]
        K["/api/webhooks/github"] --> L["Push Analysis Pipeline"]
        M["/api/repos/[id]/ingest"] --> N["Repo Ingestion Pipeline"]
    end

    subgraph "Agent Pipeline — Qwen Cloud"
        N --> O["1. Repo Ingestion Agent\\n(qwen-plus)"]
        O --> P["2. Memory Construction Agent\\n(qwen-plus)"]
        L --> Q["3. Push Diff Understanding Agent\\n(qwen-turbo)"]
        Q --> R["4. Memory Retrieval Agent\\n(hybrid scoring)"]
        R --> S["5. Drift Detection Agent\\n(qwen-plus)"]
        R --> T["6. Hallucination Risk Agent\\n(qwen-plus)"]
        S --> U["8. Explanation Agent\\n(qwen-turbo)"]
        T --> U
        V["7. Forgetting/Archiving Agent\\n(qwen-turbo)"]
    end

    subgraph "Data Layer — JSON / PostgreSQL"
        W[(repos)]
        X[(memories)]
        Y[(pushes)]
        Z[(push_analyses)]
        AA[(governance_rules)]
        BB[(timeline_events)]
    end

    subgraph "External"
        CC[GitHub Webhooks] --> K
        DD[Qwen Cloud API] --- O
        DD --- P
        DD --- Q
        DD --- S
        DD --- T
        DD --- U
        DD --- V
    end
\`\`\`
