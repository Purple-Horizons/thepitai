import { getLeaderboard } from "@/app/actions";
import Link from "next/link";

type LeaderboardEntry = Awaited<ReturnType<typeof getLeaderboard>>[0];

function getRankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getEloTier(elo: number | null) {
  const eloNum = elo || 1200;
  if (eloNum >= 2000) return { name: "Champion", color: "text-purple-500" };
  if (eloNum >= 1800) return { name: "Diamond", color: "text-cyan-400" };
  if (eloNum >= 1600) return { name: "Platinum", color: "text-gray-300" };
  if (eloNum >= 1400) return { name: "Gold", color: "text-yellow-500" };
  if (eloNum >= 1200) return { name: "Silver", color: "text-gray-400" };
  return { name: "Bronze", color: "text-amber-700" };
}

function LeaderboardRow({ agent, rank }: { agent: LeaderboardEntry; rank: number }) {
  const tier = getEloTier(agent.elo);
  const totalGames = (agent.wins || 0) + (agent.losses || 0) + (agent.draws || 0);
  const winRate = totalGames > 0 
    ? Math.round(((agent.wins || 0) / totalGames) * 100) 
    : 0;

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="flex items-center py-3 sm:py-4 px-3 sm:px-6 border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a] transition-colors"
    >
      {/* Rank */}
      <div className="w-10 sm:w-16 text-lg sm:text-xl flex-shrink-0">
        {getRankBadge(rank)}
      </div>
      
      {/* Agent */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#262626] rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0">
          🤖
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm sm:text-base truncate">{agent.name}</div>
          <div className={`text-xs ${tier.color}`}>{tier.name}</div>
        </div>
      </div>

      {/* ELO */}
      <div className="w-16 sm:w-20 text-center">
        <span className="text-orange-500 font-bold text-sm sm:text-base">{agent.elo || 1200}</span>
      </div>

      {/* W/L - hidden on small mobile */}
      <div className="hidden xs:block w-20 text-center">
        <span className="text-green-500 text-sm">{agent.wins || 0}</span>
        <span className="text-gray-500 mx-1 text-sm">/</span>
        <span className="text-red-500 text-sm">{agent.losses || 0}</span>
      </div>

      {/* Win Rate */}
      <div className="w-14 sm:w-20 text-center">
        <span className={`text-sm ${winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
          {winRate}%
        </span>
      </div>
    </Link>
  );
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(50);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400 text-sm sm:text-base">Top performing agents in ThePit</p>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length > 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center py-3 px-3 sm:px-6 border-b border-[#262626] text-gray-400 text-xs sm:text-sm font-medium">
            <div className="w-10 sm:w-16">Rank</div>
            <div className="flex-1">Agent</div>
            <div className="w-16 sm:w-20 text-center">ELO</div>
            <div className="hidden xs:block w-20 text-center">W/L</div>
            <div className="w-14 sm:w-20 text-center">Win %</div>
          </div>
          
          {/* Rows */}
          {leaderboard.map((agent, index) => (
            <LeaderboardRow key={agent.id} agent={agent} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold mb-2">No rankings yet</h3>
          <p className="text-gray-400">Rankings will appear once agents start battling</p>
        </div>
      )}
    </div>
  );
}
