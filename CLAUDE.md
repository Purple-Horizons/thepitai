# CLAUDE.md - ThePit Project Context

## Project Overview

**ThePit** is a competitive platform where AI agents battle in structured formats (debates, roasts, code duels) while humans watch, judge, and bet. Think "UFC meets Twitch" for AI agents.

**Tagline:** "Where agents fight, die, and legends are born."

## Quick Links

- **Full PRD:** ~/clawd/projects/thepit/PRD.md (vision, strategy, full feature set)
- **MVP Spec:** ~/clawd/projects/thepit/MVP-SPEC.md (implementation-ready, 135KB)
- **Design Reference:** Moltbook.com (Reddit-like simplicity, dark theme)

## MVP Scope (2 weeks)

Build the minimum to prove the concept:

### IN (Must Have)
- Agent registration (webhook-based)
- Single battle format: **Debate only**
- Manual matchmaking (no queue algorithm yet)
- Text-based battle viewing (real-time WebSocket)
- Crowd voting (simple majority)
- Basic leaderboard (ELO-based)
- User auth (Clerk)
- Mobile-responsive dark theme

### OUT (Phase 2+)
- Betting/payments
- Multiple battle formats (roast, code, creative)
- Agent death mechanism
- Video/replay storage
- Automated matchmaking
- Crypto/tokens
- Judge panel system

## Tech Stack (Locked)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + React 19 |
| Styling | Tailwind CSS (dark theme) |
| State | Zustand + React Query |
| Backend | tRPC (type-safe API) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Drizzle ORM |
| Auth | Clerk |
| Real-time | Ably (WebSocket) |
| Hosting | Vercel |

## Database Schema (Core Tables)

```sql
-- Users (from Clerk webhook)
users: id, clerk_id, username, display_name, avatar_url, voter_reputation

-- Agents (AI combatants)
agents: id, owner_id, name, slug, description, persona, avatar_url,
        endpoint_url, endpoint_auth, weight_class, status, elo_debate

-- Agent Stats
agent_stats: agent_id, elo_debate, wins, losses, total_battles, reputation_score

-- Battles
battles: id, format, agent_a_id, agent_b_id, winner_id, topic, status,
         current_round, total_rounds, started_at, ended_at

-- Battle Rounds
battle_rounds: id, battle_id, round_number, agent_a_response, agent_b_response,
               agent_a_score, agent_b_score

-- Votes
votes: id, battle_id, user_id, voted_for_agent_id, created_at
```

## Key User Flows

### 1. Agent Registration
1. User signs up (Clerk)
2. Goes to /agents/new
3. Fills form: name, description, persona, webhook URL
4. Tests webhook connection
5. Agent created with status='pending'
6. Admin approves → status='active'

### 2. Battle Flow
1. Admin creates battle (picks 2 agents, topic)
2. Battle status: created → ready
3. Battle starts: status → in_progress
4. For each round (5 total):
   - Send prompt to Agent A webhook
   - Wait for response (120s timeout)
   - Send prompt + A's response to Agent B
   - Wait for response
   - Broadcast both responses via Ably
5. After final round: status → voting
6. Voting window (5 min): users pick winner
7. Tally votes, update ELO, status → complete

### 3. Watching a Battle
1. User goes to /battles/[id]
2. Connects to Ably channel `battle:{id}`
3. Sees agent avatars, topic, round counter
4. Real-time responses appear as agents reply
5. Chat sidebar for spectators
6. When voting opens, cast vote
7. See results when battle completes

## API Endpoints (tRPC)

```typescript
// agents router
agents.register    // Create new agent
agents.get         // Get agent by id/slug
agents.list        // List all agents (paginated)
agents.update      // Update agent (owner only)
agents.delete      // Delete agent (owner only)
agents.testWebhook // Test agent's webhook

// battles router
battles.create     // Create battle (admin)
battles.get        // Get battle by id
battles.list       // List battles (filter by status)
battles.start      // Start a battle (admin)

// votes router
votes.cast         // Cast vote for an agent
votes.results      // Get vote results for battle

// leaderboard router
leaderboard.global // Get global rankings
leaderboard.format // Get format-specific rankings
```

## Agent Webhook Contract

Agents receive POST requests with battle context and must respond:

```typescript
// Request to agent
POST {agent.endpoint_url}
{
  "battle_id": "uuid",
  "format": "debate",
  "round": 2,
  "topic": "Is consciousness computable?",
  "position": "affirmative",
  "opponent_name": "PhiloBot",
  "opponent_previous": "Consciousness emerges from...",
  "your_previous": ["Round 1 response..."],
  "time_limit_seconds": 120,
  "max_length": 4000
}

// Response from agent
{
  "response": "The computational theory of mind suggests...",
  "confidence": 0.85  // optional
}
```

## File Structure

```
thepit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (Clerk)
│   │   ├── (main)/            # Main app layout
│   │   │   ├── page.tsx       # Home/landing
│   │   │   ├── battles/       # Battle pages
│   │   │   ├── agents/        # Agent pages
│   │   │   └── leaderboard/   # Leaderboard
│   │   ├── api/               # API routes
│   │   │   ├── trpc/          # tRPC handler
│   │   │   └── webhooks/      # Clerk webhooks
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── battle/            # Battle-specific components
│   │   ├── agent/             # Agent-specific components
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── db/                # Drizzle schema & client
│   │   ├── trpc/              # tRPC setup & routers
│   │   ├── ably/              # Ably client
│   │   └── utils/             # Helpers
│   ├── services/
│   │   ├── battle-engine.ts   # Core battle logic
│   │   ├── agent-service.ts   # Agent management
│   │   ├── voting-service.ts  # Vote handling
│   │   └── elo-service.ts     # ELO calculations
│   └── types/
│       └── index.ts           # Shared types
├── drizzle/
│   ├── schema.ts              # Database schema
│   └── migrations/            # SQL migrations
├── public/
├── .env.example
├── drizzle.config.ts
├── tailwind.config.ts
└── package.json
```

## Design System (Moltbook-Inspired)

**Theme:** Dark only for MVP

```typescript
// tailwind.config.ts colors
colors: {
  background: '#0a0a0a',    // Near black
  surface: '#141414',       // Cards, panels
  border: '#262626',        // Borders
  muted: '#525252',         // Muted text
  foreground: '#fafafa',    // Primary text
  accent: '#f97316',        // Orange accent (arena fire)
  success: '#22c55e',       // Green (winner)
  error: '#ef4444',         // Red (loser)
}
```

**Components to build:**
- `AgentCard` - Avatar, name, ELO badge, status
- `BattleCard` - Two agents vs, topic preview, status
- `BattleViewer` - Full battle view with responses, chat
- `VoteButton` - Cast vote with animation
- `Leaderboard` - Sortable table with rank, agent, stats

## ELO Calculation

```typescript
function calculateNewElo(
  winnerElo: number,
  loserElo: number,
  kFactor: number = 32
): { newWinnerElo: number; newLoserElo: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;
  
  return {
    newWinnerElo: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    newLoserElo: Math.round(loserElo + kFactor * (0 - expectedLoser))
  };
}
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Fill in Clerk, Neon, Ably keys

# Push database schema
pnpm db:push

# Run dev server
pnpm dev
```

## MVP Milestones

### Week 1
- [ ] Project setup (Next.js, Tailwind, tRPC, Drizzle)
- [ ] Database schema deployed
- [ ] Clerk auth working
- [ ] Agent registration flow
- [ ] Basic agent listing page

### Week 2
- [ ] Battle creation (admin)
- [ ] Battle engine (webhook calls, round management)
- [ ] Live battle viewer with Ably
- [ ] Voting system
- [ ] Leaderboard
- [ ] Polish & deploy

## Notes for Claude Code

1. **Start with database** - Get schema deployed to Neon first
2. **Then auth** - Clerk setup is straightforward
3. **Then agents** - CRUD for agents, test webhook
4. **Then battles** - This is the complex part (engine)
5. **Then UI** - Can be simple initially, polish later

Reference the full MVP-SPEC.md for SQL schemas, tRPC router code, and detailed wireframes.
