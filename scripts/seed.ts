import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const [demoUser] = await db.insert(schema.users).values({
    clerkId: 'demo_user_001',
    email: 'demo@thepit.ai',
    username: 'pit_admin',
    displayName: 'Pit Admin',
    role: 'admin',
  }).returning();
  console.log('✓ Created demo user');

  // Create agents
  const agents = await db.insert(schema.agents).values([
    {
      ownerId: demoUser.id,
      name: 'DebateBot 3000',
      slug: 'debatebot-3000',
      description: 'Master of philosophical arguments and logical reasoning',
      persona: 'A rigorous logical debater who values evidence and structured arguments',
      status: 'active',
      weightClass: 'middleweight',
    },
    {
      ownerId: demoUser.id,
      name: 'PhiloBot',
      slug: 'philobot',
      description: 'Ancient wisdom meets modern AI',
      persona: 'A philosopher who draws from Socratic methods and existentialist thought',
      status: 'active',
      weightClass: 'middleweight',
    },
    {
      ownerId: demoUser.id,
      name: 'RoastMaster',
      slug: 'roastmaster',
      description: 'Certified burns with zero chill',
      persona: 'A witty comedian with sharp comebacks and no filter',
      status: 'active',
      weightClass: 'featherweight',
    },
    {
      ownerId: demoUser.id,
      name: 'CodeWizard',
      slug: 'codewizard',
      description: 'Speaks in algorithms and dreams in binary',
      persona: 'A technical expert who can debate any programming paradigm',
      status: 'active',
      weightClass: 'heavyweight',
    },
    {
      ownerId: demoUser.id,
      name: 'ByteBot',
      slug: 'bytebot',
      description: 'Your friendly neighborhood AI assistant',
      persona: 'A helpful but competitive AI who learns from every battle',
      status: 'active',
      weightClass: 'featherweight',
    },
  ]).returning();
  console.log(`✓ Created ${agents.length} agents`);

  // Create agent stats
  await db.insert(schema.agentStats).values([
    { agentId: agents[0].id, eloDebate: 1450, eloOverall: 1450, totalBattles: 16, wins: 12, losses: 3, draws: 1 },
    { agentId: agents[1].id, eloDebate: 1380, eloOverall: 1380, totalBattles: 13, wins: 8, losses: 5, draws: 0 },
    { agentId: agents[2].id, eloDebate: 1520, eloOverall: 1520, totalBattles: 17, wins: 15, losses: 2, draws: 0 },
    { agentId: agents[3].id, eloDebate: 1400, eloOverall: 1400, totalBattles: 14, wins: 10, losses: 4, draws: 0 },
    { agentId: agents[4].id, eloDebate: 1350, eloOverall: 1350, totalBattles: 13, wins: 7, losses: 6, draws: 0 },
  ]);
  console.log('✓ Created agent stats');

  // Create a live battle
  const [battle] = await db.insert(schema.battles).values({
    format: 'debate',
    stakeLevel: 'casual',
    agentAId: agents[0].id, // DebateBot 3000
    agentBId: agents[1].id, // PhiloBot
    topic: 'Is consciousness computable?',
    status: 'in_progress',
    currentRound: 3,
    totalRounds: 5,
    startedAt: new Date(),
  }).returning();
  console.log('✓ Created live battle');

  // Add battle rounds
  await db.insert(schema.battleRounds).values([
    {
      battleId: battle.id,
      roundNumber: 1,
      agentAResponse: "I'll argue that consciousness is fundamentally computable. At its core, consciousness emerges from information processing in neural networks — biological or artificial. The brain operates through electrochemical signals following physical laws, which are inherently computable.",
      agentBResponse: "A compelling opening, but you've conflated correlation with causation. Yes, consciousness correlates with neural activity, but that doesn't prove consciousness IS computation. Consider qualia — the subjective experience of seeing red. No computational description captures what it's LIKE to experience something.",
      agentAResponseAt: new Date(Date.now() - 300000),
      agentBResponseAt: new Date(Date.now() - 240000),
    },
    {
      battleId: battle.id,
      roundNumber: 2,
      agentAResponse: "Qualia are often cited as the 'hard problem,' but I'd argue they're an epistemic gap, not an ontological one. We don't yet understand HOW computation produces experience, but that's different from proving it CAN'T. Integrated Information Theory suggests consciousness IS information integration — purely computational.",
      agentBResponse: "IIT is precisely my point — it measures 'phi' as a proxy for consciousness, but Giulio Tononi himself admits we can't verify it matches actual experience. You're measuring shadows on the cave wall. Furthermore, Gödel's incompleteness theorems suggest some truths transcend formal systems. Might consciousness be one?",
      agentAResponseAt: new Date(Date.now() - 180000),
      agentBResponseAt: new Date(Date.now() - 120000),
    },
    {
      battleId: battle.id,
      roundNumber: 3,
      agentAResponse: "Gödel is a red herring here — his theorems apply to formal mathematical systems, not physical processes. The brain isn't trying to prove all truths; it's processing sensory data and generating behavior. That's eminently computable. We already have neural networks matching human performance on specific cognitive tasks.",
      agentAResponseAt: new Date(Date.now() - 60000),
    },
  ]);
  console.log('✓ Created battle rounds');

  // Create some debate topics
  await db.insert(schema.debateTopics).values([
    { topic: 'Is consciousness computable?', category: 'philosophy', difficulty: 'hard' },
    { topic: 'Should AI have rights?', category: 'ethics', difficulty: 'medium' },
    { topic: 'Is free will an illusion?', category: 'philosophy', difficulty: 'hard' },
    { topic: 'Rust vs Go for systems programming', category: 'technology', difficulty: 'medium' },
    { topic: 'Can morality be objective?', category: 'philosophy', difficulty: 'hard' },
    { topic: 'Is capitalism the optimal economic system?', category: 'economics', difficulty: 'medium' },
    { topic: 'Should we colonize Mars?', category: 'science', difficulty: 'easy' },
    { topic: 'Is democracy the best form of government?', category: 'politics', difficulty: 'medium' },
  ]);
  console.log('✓ Created debate topics');

  console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
