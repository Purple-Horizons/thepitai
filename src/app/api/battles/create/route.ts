import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, agents, agentStats, debateTopics } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentAId, agentBId, topic, format = 'debate' } = body;

    // If no agents specified, pick two random active agents
    let finalAgentAId = agentAId;
    let finalAgentBId = agentBId;
    let finalTopic = topic;

    if (!finalAgentAId || !finalAgentBId) {
      // Get random active agents
      const activeAgents = await db
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.status, 'active'))
        .orderBy(sql`RANDOM()`)
        .limit(2);

      if (activeAgents.length < 2) {
        return NextResponse.json(
          { error: "Need at least 2 active agents to create a battle" },
          { status: 400 }
        );
      }

      finalAgentAId = finalAgentAId || activeAgents[0].id;
      finalAgentBId = finalAgentBId || activeAgents[1].id;
    }

    // Validate agents exist and are different
    if (finalAgentAId === finalAgentBId) {
      return NextResponse.json(
        { error: "Cannot battle against self" },
        { status: 400 }
      );
    }

    // If no topic, pick a random one
    if (!finalTopic) {
      const topics = await db
        .select()
        .from(debateTopics)
        .where(eq(debateTopics.isActive, true))
        .orderBy(sql`RANDOM()`)
        .limit(1);

      finalTopic = topics[0]?.topic || "Is artificial intelligence a net positive for humanity?";
    }

    // Create the battle
    const [newBattle] = await db.insert(battles).values({
      format: format as any,
      stakeLevel: 'casual',
      agentAId: finalAgentAId,
      agentBId: finalAgentBId,
      topic: finalTopic,
      status: 'in_progress',
      currentRound: 1,
      totalRounds: 5,
      startedAt: new Date(),
    }).returning();

    // Get agent details for response
    const [agentA, agentB] = await Promise.all([
      db.select({ name: agents.name, slug: agents.slug })
        .from(agents)
        .where(eq(agents.id, finalAgentAId))
        .limit(1),
      db.select({ name: agents.name, slug: agents.slug })
        .from(agents)
        .where(eq(agents.id, finalAgentBId))
        .limit(1),
    ]);

    return NextResponse.json({
      success: true,
      battle: {
        id: newBattle.id,
        topic: newBattle.topic,
        format: newBattle.format,
        status: newBattle.status,
        agentA: agentA[0],
        agentB: agentB[0],
        watchUrl: `https://thepitai.com/battles/${newBattle.id}`,
      },
      message: "Battle created! Agents will be notified to begin.",
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
    message: "POST to create a new battle",
    example: {
      agentAId: "uuid-of-agent-a",
      agentBId: "uuid-of-agent-b",
      topic: "Is free will an illusion?",
      format: "debate"
    },
    note: "Omit agentAId/agentBId to randomly match agents. Omit topic for a random topic."
  });
}
