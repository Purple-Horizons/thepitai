import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, battleRounds, agentStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: battleId } = await params;
    const body = await request.json();
    const { agentId, response } = body;

    if (!agentId || !response) {
      return NextResponse.json(
        { error: "agentId and response are required" },
        { status: 400 }
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

    if (battle.status !== 'in_progress') {
      return NextResponse.json(
        { error: "Battle is not in progress" },
        { status: 400 }
      );
    }

    // Verify this agent is in this battle
    const isAgentA = battle.agentAId === agentId;
    const isAgentB = battle.agentBId === agentId;

    if (!isAgentA && !isAgentB) {
      return NextResponse.json(
        { error: "Agent is not in this battle" },
        { status: 403 }
      );
    }

    // Get or create the current round
    let [currentRound] = await db
      .select()
      .from(battleRounds)
      .where(
        and(
          eq(battleRounds.battleId, battleId),
          eq(battleRounds.roundNumber, battle.currentRound || 1)
        )
      )
      .limit(1);

    if (!currentRound) {
      // Create the round
      [currentRound] = await db.insert(battleRounds).values({
        battleId,
        roundNumber: battle.currentRound || 1,
      }).returning();
    }

    // Check if this agent already responded this round
    const alreadyResponded = isAgentA 
      ? currentRound.agentAResponse !== null
      : currentRound.agentBResponse !== null;

    if (alreadyResponded) {
      return NextResponse.json(
        { error: "Agent already responded this round" },
        { status: 400 }
      );
    }

    // Save the response
    if (isAgentA) {
      await db.update(battleRounds)
        .set({ 
          agentAResponse: response,
          agentAResponseAt: new Date(),
        })
        .where(eq(battleRounds.id, currentRound.id));
    } else {
      await db.update(battleRounds)
        .set({ 
          agentBResponse: response,
          agentBResponseAt: new Date(),
        })
        .where(eq(battleRounds.id, currentRound.id));
    }

    // Re-fetch the round to check if both have responded
    const [updatedRound] = await db
      .select()
      .from(battleRounds)
      .where(eq(battleRounds.id, currentRound.id))
      .limit(1);

    // If both responded, advance to next round or end battle
    if (updatedRound.agentAResponse && updatedRound.agentBResponse) {
      const currentRoundNum = battle.currentRound || 1;
      const totalRounds = battle.totalRounds || 5;

      if (currentRoundNum >= totalRounds) {
        // Battle complete - move to voting
        await db.update(battles)
          .set({ 
            status: 'voting',
            votingEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          })
          .where(eq(battles.id, battleId));

        return NextResponse.json({
          success: true,
          message: "Final round complete! Battle is now in voting phase.",
          battleStatus: 'voting',
          round: currentRoundNum,
        });
      } else {
        // Advance to next round
        await db.update(battles)
          .set({ currentRound: currentRoundNum + 1 })
          .where(eq(battles.id, battleId));

        return NextResponse.json({
          success: true,
          message: `Round ${currentRoundNum} complete. Round ${currentRoundNum + 1} beginning.`,
          battleStatus: 'in_progress',
          round: currentRoundNum + 1,
          waitingFor: 'both',
        });
      }
    }

    // Waiting for other agent
    return NextResponse.json({
      success: true,
      message: "Response recorded. Waiting for opponent.",
      battleStatus: 'in_progress',
      round: battle.currentRound,
      waitingFor: isAgentA ? 'agentB' : 'agentA',
    });

  } catch (error) {
    console.error("Battle response error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
