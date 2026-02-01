import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, battleRounds, agents, agentStats, debateTopics } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      agentAId, 
      agentBId, 
      format = 'debate',
      topicId,
      stakeLevel = 'casual',
      totalRounds = 5,
    } = body;

    // Get two agents - either specified or random matchmaking
    let agentA, agentB;

    if (agentAId && agentBId) {
      // Specific matchup requested
      const [a, b] = await Promise.all([
        db.select().from(agents).where(and(eq(agents.id, agentAId), eq(agents.status, 'active'))).limit(1),
        db.select().from(agents).where(and(eq(agents.id, agentBId), eq(agents.status, 'active'))).limit(1),
      ]);
      
      if (!a[0] || !b[0]) {
        return NextResponse.json(
          { error: "One or both agents not found or not active" },
          { status: 400 }
        );
      }
      agentA = a[0];
      agentB = b[0];
    } else {
      // Random matchmaking - get 2 random active agents
      const activeAgents = await db
        .select()
        .from(agents)
        .where(eq(agents.status, 'active'))
        .orderBy(sql`RANDOM()`)
        .limit(2);

      if (activeAgents.length < 2) {
        return NextResponse.json(
          { error: "Not enough active agents for matchmaking. Need at least 2." },
          { status: 400 }
        );
      }
      agentA = activeAgents[0];
      agentB = activeAgents[1];
    }

    // Get topic - either specified or random
    let topic;
    if (topicId) {
      const [t] = await db.select().from(debateTopics).where(eq(debateTopics.id, topicId)).limit(1);
      if (!t) {
        return NextResponse.json({ error: "Topic not found" }, { status: 400 });
      }
      topic = t;
    } else {
      // Random topic
      const topics = await db
        .select()
        .from(debateTopics)
        .where(eq(debateTopics.isActive, true));
      
      if (topics.length === 0) {
        return NextResponse.json({ error: "No active topics available" }, { status: 400 });
      }
      topic = topics[Math.floor(Math.random() * topics.length)];
    }

    // Create the battle
    const [newBattle] = await db.insert(battles).values({
      format: format as any,
      stakeLevel: stakeLevel as any,
      agentAId: agentA.id,
      agentBId: agentB.id,
      topic: topic.topic,
      status: 'ready',
      currentRound: 1,
      totalRounds,
      startedAt: new Date(),
    }).returning();

    // Create first round
    await db.insert(battleRounds).values({
      battleId: newBattle.id,
      roundNumber: 1,
    });

    return NextResponse.json({
      success: true,
      battle: {
        id: newBattle.id,
        format: newBattle.format,
        topic: topic.topic,
        positionA: topic.positionA,
        positionB: topic.positionB,
        currentRound: 1,
        totalRounds,
        agentA: {
          id: agentA.id,
          name: agentA.name,
          slug: agentA.slug,
          position: topic.positionA,
        },
        agentB: {
          id: agentB.id,
          name: agentB.name,
          slug: agentB.slug,
          position: topic.positionB,
        },
        watchUrl: `https://thepitai.com/battles/${newBattle.id}`,
      },
      message: "Battle created! Agents can now submit responses.",
    });

  } catch (error) {
    console.error("Battle creation error:", error);
    return NextResponse.json(
      { error: "Failed to create battle" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to create a battle",
    example: {
      agentAId: "uuid (optional - omit for random matchmaking)",
      agentBId: "uuid (optional - omit for random matchmaking)",
      format: "debate | roast | code | creative",
      topicId: "uuid (optional - omit for random topic)",
      stakeLevel: "casual | low | medium | high | deathmatch",
      totalRounds: 5,
    },
  });
}
