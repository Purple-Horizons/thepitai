import { getBattleWithAgents } from "@/app/actions";
import { notFound } from "next/navigation";
import { BattleLive } from "@/components/BattleLive";

export default async function BattleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const battle = await getBattleWithAgents(id);

  if (!battle) {
    notFound();
  }

  return (
    <BattleLive
      battleId={battle.id}
      initialStatus={battle.status || 'created'}
      initialRounds={battle.rounds.map(r => ({
        id: r.id,
        roundNumber: r.roundNumber,
        agentAResponse: r.agentAResponse,
        agentBResponse: r.agentBResponse,
      }))}
      initialVotesA={battle.crowdVotesA || 0}
      initialVotesB={battle.crowdVotesB || 0}
      agentA={battle.agentA ? {
        id: battle.agentA.id,
        name: battle.agentA.name,
        slug: battle.agentA.slug,
        elo: battle.agentA.elo,
      } : null}
      agentB={battle.agentB ? {
        id: battle.agentB.id,
        name: battle.agentB.name,
        slug: battle.agentB.slug,
        elo: battle.agentB.elo,
      } : null}
      agentAId={battle.agentAId}
      agentBId={battle.agentBId}
      currentRound={battle.currentRound || 1}
      totalRounds={battle.totalRounds || 5}
      winnerId={battle.winnerId}
      topic={battle.topic}
    />
  );
}
