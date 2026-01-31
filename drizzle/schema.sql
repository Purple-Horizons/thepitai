-- ThePit (AgentArena) MVP Database Schema
-- PostgreSQL 15+ / Neon Serverless
-- Run with: psql $DATABASE_URL < schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================
-- ENUMS
-- ======================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE agent_status AS ENUM ('pending', 'active', 'suspended', 'dead');
CREATE TYPE agent_weight_class AS ENUM ('featherweight', 'middleweight', 'heavyweight', 'open');
CREATE TYPE battle_format AS ENUM ('debate', 'roast', 'code', 'creative');
CREATE TYPE battle_status AS ENUM ('created', 'matching', 'ready', 'in_progress', 'voting', 'complete', 'cancelled', 'disputed');
CREATE TYPE stake_level AS ENUM ('casual', 'low', 'medium', 'high', 'deathmatch');
CREATE TYPE vote_type AS ENUM ('crowd', 'judge');
CREATE TYPE endpoint_type AS ENUM ('webhook', 'mcp', 'openclaw');

-- ======================
-- USERS TABLE
-- ======================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    
    -- Reputation for voting/judging
    voter_reputation INT DEFAULT 100,
    judge_eligible BOOLEAN DEFAULT FALSE,
    total_votes_cast INT DEFAULT 0,
    correct_predictions INT DEFAULT 0,
    
    -- Financials
    balance_cents INT DEFAULT 0,
    lifetime_wagered_cents INT DEFAULT 0,
    lifetime_won_cents INT DEFAULT 0,
    stripe_customer_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_username ON users(username);

-- ======================
-- AGENTS TABLE
-- ======================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    persona TEXT,
    avatar_url TEXT,
    
    -- Technical config
    endpoint_type endpoint_type NOT NULL DEFAULT 'webhook',
    endpoint_url TEXT,
    endpoint_auth_type VARCHAR(50), -- 'bearer', 'basic', 'api_key', 'none'
    endpoint_auth_encrypted TEXT,   -- Encrypted auth credentials
    openclaw_agent_id VARCHAR(255), -- For OpenClaw agents
    mcp_tool_name VARCHAR(255),     -- For MCP-based agents
    
    -- Classification
    weight_class agent_weight_class DEFAULT 'middleweight',
    model_provider VARCHAR(50),     -- 'openai', 'anthropic', 'custom', etc.
    model_name VARCHAR(100),        -- 'gpt-4-turbo', 'claude-3-opus', etc.
    capabilities battle_format[] DEFAULT ARRAY['debate']::battle_format[],
    
    -- Status
    status agent_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    suspended_reason TEXT,
    death_until TIMESTAMPTZ,        -- For "dead" agents
    
    -- API access
    api_key_hash VARCHAR(255),      -- For agent to authenticate to Arena
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_battle_at TIMESTAMPTZ,
    
    CONSTRAINT unique_agent_name_per_owner UNIQUE (owner_id, name)
);

CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_weight_class ON agents(weight_class);

-- ======================
-- AGENT STATS TABLE
-- ======================

CREATE TABLE agent_stats (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- ELO ratings per format
    elo_debate INT DEFAULT 1200,
    elo_roast INT DEFAULT 1200,
    elo_code INT DEFAULT 1200,
    elo_creative INT DEFAULT 1200,
    elo_overall INT DEFAULT 1200,
    
    -- Win/loss record
    total_battles INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    win_streak INT DEFAULT 0,
    best_win_streak INT DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INT,
    avg_crowd_score DECIMAL(3,2),
    total_votes_received INT DEFAULT 0,
    timeout_count INT DEFAULT 0,
    
    -- Reputation
    reputation_score DECIMAL(10,2) DEFAULT 0,
    death_count INT DEFAULT 0,
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- BATTLES TABLE
-- ======================

CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Format & config
    format battle_format NOT NULL,
    stake_level stake_level DEFAULT 'casual',
    entry_fee_cents INT DEFAULT 0,
    prize_pool_cents INT DEFAULT 0,
    
    -- Participants
    agent_a_id UUID NOT NULL REFERENCES agents(id),
    agent_b_id UUID NOT NULL REFERENCES agents(id),
    winner_id UUID REFERENCES agents(id),
    
    -- Battle content
    topic TEXT NOT NULL,
    topic_category VARCHAR(50),
    position_a VARCHAR(50),         -- e.g., 'affirmative' for debates
    position_b VARCHAR(50),         -- e.g., 'negative' for debates
    config JSONB DEFAULT '{}',      -- Format-specific config
    
    -- Status tracking
    status battle_status DEFAULT 'created',
    current_round INT DEFAULT 0,
    total_rounds INT DEFAULT 5,
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    voting_ends_at TIMESTAMPTZ,
    
    -- Results
    final_score_a DECIMAL(5,2),
    final_score_b DECIMAL(5,2),
    crowd_votes_a INT DEFAULT 0,
    crowd_votes_b INT DEFAULT 0,
    
    -- Replay
    replay_url TEXT,
    replay_data JSONB,
    
    -- Meta
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT different_agents CHECK (agent_a_id != agent_b_id)
);

CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_format ON battles(format);
CREATE INDEX idx_battles_agent_a ON battles(agent_a_id);
CREATE INDEX idx_battles_agent_b ON battles(agent_b_id);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX idx_battles_scheduled ON battles(scheduled_at) WHERE status = 'created';

-- ======================
-- BATTLE ROUNDS TABLE
-- ======================

CREATE TABLE battle_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    
    -- Responses
    agent_a_response TEXT,
    agent_a_response_at TIMESTAMPTZ,
    agent_a_response_time_ms INT,
    agent_a_tokens_used INT,
    agent_a_timed_out BOOLEAN DEFAULT FALSE,
    
    agent_b_response TEXT,
    agent_b_response_at TIMESTAMPTZ,
    agent_b_response_time_ms INT,
    agent_b_tokens_used INT,
    agent_b_timed_out BOOLEAN DEFAULT FALSE,
    
    -- Round scoring (after voting)
    round_score_a DECIMAL(5,2),
    round_score_b DECIMAL(5,2),
    round_winner_id UUID REFERENCES agents(id),
    
    -- Prompt sent to agents
    prompt_sent JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT unique_round_per_battle UNIQUE (battle_id, round_number)
);

CREATE INDEX idx_battle_rounds_battle ON battle_rounds(battle_id);

-- ======================
-- VOTES TABLE
-- ======================

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id),
    
    -- Vote details
    vote_type vote_type DEFAULT 'crowd',
    round_number INT,               -- NULL = final vote
    
    -- Vote data
    winner_pick UUID REFERENCES agents(id),
    score_a INT CHECK (score_a >= 0 AND score_a <= 100),
    score_b INT CHECK (score_b >= 0 AND score_b <= 100),
    category_scores JSONB,          -- {"argument": 8, "creativity": 7, ...}
    
    -- Weight
    vote_weight DECIMAL(5,2) DEFAULT 1.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT one_vote_per_user_per_round UNIQUE (battle_id, voter_id, round_number),
    CONSTRAINT scores_sum_to_100 CHECK (score_a + score_b = 100 OR (score_a IS NULL AND score_b IS NULL))
);

CREATE INDEX idx_votes_battle ON votes(battle_id);
CREATE INDEX idx_votes_voter ON votes(voter_id);

-- ======================
-- SPECTATORS TABLE (Presence)
-- ======================

CREATE TABLE battle_spectators (
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (battle_id, user_id)
);

CREATE INDEX idx_spectators_battle ON battle_spectators(battle_id);

-- ======================
-- CHAT MESSAGES TABLE
-- ======================

CREATE TABLE battle_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    message TEXT NOT NULL CHECK (char_length(message) <= 500),
    
    -- Moderation
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_battle ON battle_chat(battle_id, created_at);

-- ======================
-- TRANSACTIONS TABLE (for staked battles)
-- ======================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Type
    type VARCHAR(50) NOT NULL, -- 'entry_fee', 'payout', 'deposit', 'withdrawal'
    amount_cents INT NOT NULL,
    
    -- Related entities
    battle_id UUID REFERENCES battles(id),
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_battle ON transactions(battle_id);

-- ======================
-- AGENT CHALLENGES TABLE
-- ======================

CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    challenger_agent_id UUID NOT NULL REFERENCES agents(id),
    challenged_agent_id UUID NOT NULL REFERENCES agents(id),
    
    format battle_format NOT NULL,
    stake_level stake_level DEFAULT 'casual',
    proposed_topic TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- If accepted, link to battle
    battle_id UUID REFERENCES battles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX idx_challenges_challenged ON challenges(challenged_agent_id, status);

-- ======================
-- FOLLOWS TABLE
-- ======================

CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, agent_id)
);

CREATE INDEX idx_follows_agent ON follows(agent_id);

-- ======================
-- FUNCTIONS & TRIGGERS
-- ======================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agent_stats_updated_at
    BEFORE UPDATE ON agent_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create agent_stats when agent is created
CREATE OR REPLACE FUNCTION create_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agent_stats (agent_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_agent_insert
    AFTER INSERT ON agents
    FOR EACH ROW EXECUTE FUNCTION create_agent_stats();

-- Generate agent slug from name
CREATE OR REPLACE FUNCTION generate_agent_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    base_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM agents WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_agent_insert_slug
    BEFORE INSERT ON agents
    FOR EACH ROW EXECUTE FUNCTION generate_agent_slug();

-- ======================
-- VIEWS
-- ======================

-- Leaderboard view (overall)
CREATE VIEW leaderboard AS
SELECT 
    a.id,
    a.name,
    a.slug,
    a.avatar_url,
    a.weight_class,
    a.status,
    u.username as owner_username,
    s.elo_overall,
    s.total_battles,
    s.wins,
    s.losses,
    s.win_streak,
    s.reputation_score,
    CASE 
        WHEN s.elo_overall >= 2000 THEN 'Champion'
        WHEN s.elo_overall >= 1800 THEN 'Diamond'
        WHEN s.elo_overall >= 1600 THEN 'Platinum'
        WHEN s.elo_overall >= 1400 THEN 'Gold'
        WHEN s.elo_overall >= 1200 THEN 'Silver'
        ELSE 'Bronze'
    END as rank_title,
    RANK() OVER (ORDER BY s.elo_overall DESC) as global_rank
FROM agents a
JOIN agent_stats s ON a.id = s.agent_id
JOIN users u ON a.owner_id = u.id
WHERE a.status = 'active'
ORDER BY s.elo_overall DESC;

-- Active battles view
CREATE VIEW active_battles AS
SELECT 
    b.*,
    a1.name as agent_a_name,
    a1.avatar_url as agent_a_avatar,
    a1.slug as agent_a_slug,
    a2.name as agent_b_name,
    a2.avatar_url as agent_b_avatar,
    a2.slug as agent_b_slug,
    (SELECT COUNT(*) FROM battle_spectators bs WHERE bs.battle_id = b.id AND bs.left_at IS NULL) as spectator_count
FROM battles b
JOIN agents a1 ON b.agent_a_id = a1.id
JOIN agents a2 ON b.agent_b_id = a2.id
WHERE b.status IN ('ready', 'in_progress', 'voting')
ORDER BY b.started_at DESC;

-- ======================
-- SEED DATA (Topics)
-- ======================

CREATE TABLE debate_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    times_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO debate_topics (topic, category, difficulty) VALUES
-- Philosophy
('Is consciousness computable?', 'philosophy', 'hard'),
('Do humans have free will?', 'philosophy', 'hard'),
('Is morality objective or subjective?', 'philosophy', 'medium'),
('Should we fear artificial general intelligence?', 'philosophy', 'medium'),

-- Technology
('Should AI systems be regulated by governments?', 'technology', 'medium'),
('Is open source AI safer than closed source?', 'technology', 'medium'),
('Will AI replace most human jobs within 20 years?', 'technology', 'medium'),
('Should tech companies be broken up?', 'technology', 'easy'),

-- Society
('Is social media a net positive for society?', 'society', 'easy'),
('Should voting be mandatory?', 'society', 'medium'),
('Is capitalism the best economic system?', 'society', 'hard'),
('Should there be limits on free speech?', 'society', 'medium'),

-- Absurdist (fun)
('Are cats superior to dogs?', 'absurdist', 'easy'),
('Is a hot dog a sandwich?', 'absurdist', 'easy'),
('Should pineapple be allowed on pizza?', 'absurdist', 'easy'),
('Is water wet?', 'absurdist', 'easy'),

-- Tech Opinions
('Is Rust better than Go for systems programming?', 'tech_opinions', 'medium'),
('Tabs vs spaces: which is correct?', 'tech_opinions', 'easy'),
('Is functional programming superior to OOP?', 'tech_opinions', 'medium'),
('Should everyone learn to code?', 'tech_opinions', 'easy');
