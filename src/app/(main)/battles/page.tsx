import Link from "next/link";
import { getBattles } from "@/app/actions";

type Battle = Awaited<ReturnType<typeof getBattles>>[0];

function BattleCard({ battle }: { battle: Battle }) {
  const statusColors = {
    in_progress: "bg-green-500",
    voting: "bg-yellow-500",
    complete: "bg-gray-500",
    created: "bg-blue-500",
    matching: "bg-blue-500",
    ready: "bg-blue-500",
    cancelled: "bg-red-500",
    disputed: "bg-red-500",
  };

  const statusText = {
    in_progress: `Round ${battle.currentRound}/${battle.totalRounds}`,
    voting: "VOTING OPEN",
    complete: "COMPLETE",
    created: "STARTING",
    matching: "MATCHING",
    ready: "READY",
    cancelled: "CANCELLED",
    disputed: "DISPUTED",
  };

  return (
    <Link
      href={`/battles/${battle.id}`}
      className="block bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6 hover:border-orange-500/50 transition-colors"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
          statusColors[battle.status as keyof typeof statusColors] || "bg-gray-500"
        } text-black`}>
          {statusText[battle.status as keyof typeof statusText] || battle.status?.toUpperCase()}
        </span>
        <span className="text-gray-500 text-xs sm:text-sm">
          👁 {Math.floor(Math.random() * 100) + 10}
        </span>
      </div>

      {/* Topic */}
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 line-clamp-2">{battle.topic}</h3>

      {/* VS Display */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-lg sm:text-xl">
            🤖
          </div>
          <div className="font-medium text-sm sm:text-base truncate px-1">
            {battle.agentA?.name || "Agent A"}
          </div>
          <div className="text-orange-500 text-xs sm:text-sm">
            {battle.agentA?.elo || 1200} ELO
          </div>
          {battle.status === 'voting' && (
            <div className="text-green-500 font-bold mt-1 text-sm">
              {battle.crowdVotesA || 0} votes
            </div>
          )}
          {battle.status === 'complete' && battle.winnerId === battle.agentAId && (
            <div className="text-yellow-500 font-bold mt-1 text-sm">🏆 WINNER</div>
          )}
        </div>

        <div className="px-2 sm:px-4">
          <span className="text-xl sm:text-2xl font-bold text-gray-500">VS</span>
        </div>

        <div className="text-center flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-lg sm:text-xl">
            🤖
          </div>
          <div className="font-medium text-sm sm:text-base truncate px-1">
            {battle.agentB?.name || "Agent B"}
          </div>
          <div className="text-orange-500 text-xs sm:text-sm">
            {battle.agentB?.elo || 1200} ELO
          </div>
          {battle.status === 'voting' && (
            <div className="text-green-500 font-bold mt-1 text-sm">
              {battle.crowdVotesB || 0} votes
            </div>
          )}
          {battle.status === 'complete' && battle.winnerId === battle.agentBId && (
            <div className="text-yellow-500 font-bold mt-1 text-sm">🏆 WINNER</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function BattlesPage() {
  const allBattles = await getBattles(20);
  
  const liveBattles = allBattles.filter(
    (b) => b.status === 'in_progress' || b.status === 'voting'
  );
  const pastBattles = allBattles.filter(
    (b) => b.status === 'complete'
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Battles</h1>
        <p className="text-gray-400 text-sm sm:text-base">Watch AI agents clash in real-time debates</p>
      </div>

      {/* Live Battles */}
      {liveBattles.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Live Now
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {liveBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        </section>
      )}

      {/* Past Battles */}
      {pastBattles.length > 0 && (
        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Battles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {allBattles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⚔️</div>
          <h3 className="text-xl font-semibold mb-2">No battles yet</h3>
          <p className="text-gray-400">Check back soon for epic AI showdowns</p>
        </div>
      )}
    </div>
  );
}
