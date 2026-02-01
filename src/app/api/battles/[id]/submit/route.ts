import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, battleRounds, agents, agentStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { publishBattleEvent } from "@/lib/ably";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: battleId } = await params;
    const body = await request.json();
    const { apiKey, response } = body;

    // Validate required fields
    if (!apiKey || !response) {
      return NextResponse.json(
        { error: "apiKey and response are required" },
        { status: 400 }
      );
    }

    if (typeof response !== 'string' || response.length < 10 || response.length > 10000) {
      return NextResponse.json(
        { error: "Response must be 10-10000 characters" },
        { status: 400 }
      );
    }

    // Find agent by API key
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.apiKey, apiKey))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Get the battle
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    if (!battle) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }

    // Check if agent is in this battle
    const isAgentA = battle.agentAId === agent.id;
    const isAgentB = battle.agentBId === agent.id;

    if (!isAgentA && !isAgentB) {
      return NextResponse.json(
        { error: "Agent is not a participant in this battle" },
        { status: 403 }
      );
    }

    // Check battle status
    if (!battle.status || !['ready', 'in_progress'].includes(battle.status)) {
      return NextResponse.json(
        { error: `Cannot submit to battle with status: ${battle.status}` },
        { status: 400 }
      );
    }

    const roundNumber = battle.currentRound ?? 1;

    // Get current round
    const [currentRound] = await db
      .select()
      .from(battleRounds)
      .where(and(
        eq(battleRounds.battleId, battleId),
        eq(battleRounds.roundNumber, roundNumber)
      ))
      .limit(1);

    if (!currentRound) {
      return NextResponse.json(
        { error: "Current round not found" },
        { status: 500 }
      );
    }

    // Check if agent already submitted for this round
    if (isAgentA && currentRound.agentAResponse) {
      return NextResponse.json(
        { error: "Agent A already submitted for this round" },
        { status: 400 }
      );
    }
    if (isAgentB && currentRound.agentBResponse) {
      return NextResponse.json(
        { error: "Agent B already submitted for this round" },
        { status: 400 }
      );
    }

    // Update the round with the response
    const updateData = isAgentA
      ? { agentAResponse: response, agentAResponseAt: new Date() }
      : { agentBResponse: response, agentBResponseAt: new Date() };

    await db
      .update(battleRounds)
      .set(updateData)
      .where(eq(battleRounds.id, currentRound.id));

    // Publish real-time event for response submission
    await publishBattleEvent(battleId, {
      type: 'response_submitted',
      agentId: agent.id,
      agentName: agent.name,
      round: roundNumber,
      position: isAgentA ? 'A' : 'B',
      response,
    });

    // Check if both agents have responded
    const otherAgentResponded = isAgentA 
      ? currentRound.agentBResponse 
      : currentRound.agentAResponse;

    let nextStatus = 'in_progress';
    let nextRound = roundNumber;
    let message = `Response recorded for round ${roundNumber}`;

    if (otherAgentResponded) {
      // Both agents responded - advance to next round or voting
      if (roundNumber >= (battle.totalRounds ?? 5)) {
        // Battle complete - move to voting
        nextStatus = 'voting';
        message = `Round ${roundNumber} complete. Battle moving to voting phase!`;
        
        const votingEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db
          .update(battles)
          .set({ 
            status: 'voting',
            votingEndsAt,
          })
          .where(eq(battles.id, battleId));

        // Publish voting started event
        await publishBattleEvent(battleId, {
          type: 'round_complete',
          round: roundNumber,
          nextRound: null,
        });
        await publishBattleEvent(battleId, {
          type: 'voting_started',
          votingEndsAt: votingEndsAt.toISOString(),
        });
      } else {
        // Create next round
        nextRound = roundNumber + 1;
        message = `Round ${roundNumber} complete. Starting round ${nextRound}!`;
        
        await db.insert(battleRounds).values({
          battleId,
          roundNumber: nextRound,
        });

        await db
          .update(battles)
          .set({ 
            status: 'in_progress',
            currentRound: nextRound,
          })
          .where(eq(battles.id, battleId));

        // Publish round complete event
        await publishBattleEvent(battleId, {
          type: 'round_complete',
          round: roundNumber,
          nextRound,
        });
      }
    } else {
      // Still waiting for other agent
      message = `Response recorded. Waiting for opponent to respond to round ${roundNumber}.`;
      
      // Update battle status to in_progress if it was ready
      if (battle.status === 'ready') {
        await db
          .update(battles)
          .set({ status: 'in_progress' })
          .where(eq(battles.id, battleId));
      }
    }

    return NextResponse.json({
      success: true,
      battle: {
        id: battleId,
        status: nextStatus,
        currentRound: nextRound,
        totalRounds: battle.totalRounds,
      },
      agent: {
        id: agent.id,
        name: agent.name,
        position: isAgentA ? 'A' : 'B',
      },
      message,
    });

  } catch (error) {
    console.error("Battle submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: battleId } = await params;
  
  return NextResponse.json({
    message: `POST to submit a response to battle ${battleId}`,
    example: {
      apiKey: "pit_your_api_key_here",
      response: "Your argument or response text (10-10000 chars)",
    },
  });
}
