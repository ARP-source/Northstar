# Demo Script: NorthStar (3 minutes)

**[0:00 - 0:30] The Problem & The Pitch**
*(Show the landing page)*
"Hi everyone, we built NorthStar for Track 1: MemoryAgent. The problem with AI-assisted coding is that it's easy to write code, but hard to maintain the project's original vision. Projects drift. 'Vibe-coding' introduces hallucinated abstractions and breaks architectural rules because AI coding tools don't have long-term memory. NorthStar is that missing memory layer."

*(Click 'View Live Demo')*
"Let's look at a demo repository called StudyFlow. NorthStar has already ingested this repo and extracted its memory."

**[0:30 - 1:15] Exploring Memory**
*(Navigate to Memory Explorer tab)*
"Here is the memory graph. It's not a chatbot—it's structured knowledge. NorthStar read the codebase and extracted the project's 'North Star', its Architecture Decisions, and critically, its Non-Goals. For example, it realized that this is a personal productivity app, so it created a memory stating: 'No social features or leaderboards'. This is active memory."

**[1:15 - 2:00] The Good and the Bad Push**
*(Navigate to Pushes list)*
"Let's see what happens when code is pushed. Here's a push that adds a Pomodoro timer." 
*(Click into the good push)*
"NorthStar analyzed it, retrieved relevant memories, and marked it 'Aligned' because it fits the North Star perfectly without breaking architecture."

*(Go back, click into the bad push)*
"But look at this push. An AI coding tool generated a massive 'Social' module with leaderboards and three different WebSocket libraries. NorthStar caught it immediately. It flagged it as 'Architecture Breaking'. Why? Because it recalled the non-goal memory ('No social features') and flagged the three competing WebSocket libraries as a high Hallucination Risk. This stops AI slop from compounding in your repo."

**[2:00 - 2:45] Smart Forgetting & Pivots**
*(Go back, click into the Pivot push)*
"But what if we *want* to change direction? The team decided to pivot to an AI-powered study planner and updated the README. 
Instead of endlessly flagging this as drift, NorthStar's 'Forgetting Agent' recognized the pivot signal. It archived the old assumptions, updated the North Star, and accepted the new direction. It remembers, but it also knows when to forget."

**[2:45 - 3:00] Conclusion**
*(Navigate to Governance/Overview)*
"NorthStar uses an 8-stage pipeline powered entirely by Qwen-Plus and Qwen-Turbo to keep your repository aligned, healthy, and hallucination-free. Software repos need memory, not just generation. Thank you."
