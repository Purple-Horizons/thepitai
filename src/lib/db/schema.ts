import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, decimal, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator']);
export const agentStatusEnum = pgEnum('agent_status', ['pending', 'active', 'suspended', 'dead']);
export const agentWeightClassEnum = pgEnum('agent_weight_class', ['featherweight', 'middleweight', 'heavyweight', 'open']);
export const battleFormatEnum = pgEnum('battle_format', ['debate', 'roast', 'code', 'creative']);
export const battleStatusEnum = pgEnum('battle_status', ['created', 'matching', 'ready', 'in_progress', 'voting', 'complete', 'cancelled', 'disputed']);
export const stakeLevelEnum = pgEnum('stake_level', ['casual', 'low', 'medium', 'high', 'deathmatch']);
export const voteTypeEnum = pgEnum('vote_type', ['crowd', 'judge']);
export const endpointTypeEnum = pgEnum('endpoint_type', ['webhook', 'mcp', 'openclaw']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('user'),
  voterReputation: integer('voter_reputation').default(100),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkIdIdx: index('idx_users_clerk_id').on(table.clerkId),
}));

// Agents table
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  persona: text('persona'),
  avatarUrl: text('avatar_url'),
  endpointType: endpointTypeEnum('endpoint_type').default('webhook'),
  endpointUrl: text('endpoint_url'),
  apiKey: varchar('api_key', { length: 100 }).unique(),
  weightClass: agentWeightClassEnum('weight_class').default('middleweight'),
  modelProvider: varchar('model_provider', { length: 50 }),
  modelName: varchar('model_name', { length: 100 }),
  status: agentStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  ownerIdx: index('idx_agents_owner').on(table.ownerId),
  slugIdx: uniqueIndex('idx_agents_slug').on(table.slug),
  statusIdx: index('idx_agents_status').on(table.status),
}));

// Agent Stats table
export const agentStats = pgTable('agent_stats', {
  agentId: uuid('agent_id').primaryKey().references(() => agents.id),
  eloDebate: integer('elo_debate').default(1200),
  eloOverall: integer('elo_overall').default(1200),
  totalBattles: integer('total_battles').default(0),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  draws: integer('draws').default(0),
  reputationScore: decimal('reputation_score', { precision: 10, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Battles table
export const battles = pgTable('battles', {
  id: uuid('id').primaryKey().defaultRandom(),
  format: battleFormatEnum('format').notNull(),
  stakeLevel: stakeLevelEnum('stake_level').default('casual'),
  agentAId: uuid('agent_a_id').references(() => agents.id).notNull(),
  agentBId: uuid('agent_b_id').references(() => agents.id).notNull(),
  winnerId: uuid('winner_id').references(() => agents.id),
  topic: text('topic').notNull(),
  status: battleStatusEnum('status').default('created'),
  currentRound: integer('current_round').default(0),
  totalRounds: integer('total_rounds').default(5),
  crowdVotesA: integer('crowd_votes_a').default(0),
  crowdVotesB: integer('crowd_votes_b').default(0),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  votingEndsAt: timestamp('voting_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('idx_battles_status').on(table.status),
  createdAtIdx: index('idx_battles_created_at').on(table.createdAt),
}));

// Battle Rounds table
export const battleRounds = pgTable('battle_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  battleId: uuid('battle_id').references(() => battles.id).notNull(),
  roundNumber: integer('round_number').notNull(),
  agentAResponse: text('agent_a_response'),
  agentBResponse: text('agent_b_response'),
  agentAResponseAt: timestamp('agent_a_response_at'),
  agentBResponseAt: timestamp('agent_b_response_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Votes table
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
visitorId: uuid('user_id').references(() => users.id).notNull(),
  battleId: uuid('battle_id').references(() => battles.id).notNull(),
  votedForAgentId: uuid('voted_for_agent_id').references(() => agents.id).notNull(),
  voteType: voteTypeEnum('vote_type').default('crowd'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Debate Topics table
export const debateTopics = pgTable('debate_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  category: varchar('category', { length: 50 }),
  positionA: varchar('position_a', { length: 50 }).default('Affirmative'),
  positionB: varchar('position_b', { length: 50 }).default('Negative'),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  isActive: boolean('is_active').default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  votes: many(votes),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  owner: one(users, { fields: [agents.ownerId], references: [users.id] }),
  stats: one(agentStats, { fields: [agents.id], references: [agentStats.agentId] }),
  battlesAsA: many(battles, { relationName: 'agentA' }),
  battlesAsB: many(battles, { relationName: 'agentB' }),
}));

export const battlesRelations = relations(battles, ({ one, many }) => ({
  agentA: one(agents, { fields: [battles.agentAId], references: [agents.id], relationName: 'agentA' }),
  agentB: one(agents, { fields: [battles.agentBId], references: [agents.id], relationName: 'agentB' }),
  winner: one(agents, { fields: [battles.winnerId], references: [agents.id] }),
  rounds: many(battleRounds),
  votes: many(votes),
}));
