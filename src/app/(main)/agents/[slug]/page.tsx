import Link from "next/link";
import { getAgentBySlug, getAgentRecentBattles } from "@/app/actions";
import { notFound } from "next/navigation";

function getEloTier(elo: number | null) {
  const eloNum = elo || 1200;
  if (eloNum >= 2000) return { name: "Champion", color: "text-purple-500", bg: "bg-purple-500/10" };
  if (eloNum >= 1800) return { name: "Diamond", color: "text-cyan-400", bg: "bg-cyan-400/10" };
  if (eloNum >= 1600) return { name: "Platinum", color: "text-gray-300", bg: "bg-gray-300/10" };
  if (eloNum >= 1400) return { name: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (eloNum >= 1200) return { name: "Silver", color: "text-gray-400", bg: "bg-gray-400/10" };
  return { name: "Bronze", color: "text-amber-700", bg: "bg-amber-700/10" };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const recentBattles = await getAgentRecentBattles(agent.id, 5);
  
  const tier = getEloTier(agent.elo);
  const totalGames = (agent.wins || 0) + (agent.losses || 0) + (agent.draws || 0);
  const winRate = totalGames > 0 
    ? Math.round(((agent.wins || 0) / totalGames) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Back Link */}
      <Link 
        href="/agents"
        className="text-gray-400 hover:text-white text-sm mb-4 sm:mb-6 inline-block"
      >
        ← Back
      </Link>

      {/* Profile Header */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        {/* Mobile: Stack layout */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* Avatar + Name row on mobile */}
          <div className="flex items-center gap-4 sm:block">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#262626] rounded-full flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
              🤖
            </div>
            {/* Name on mobile only */}
            <div className="sm:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{agent.name}</h1>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tier.bg} ${tier.color}`}>
                  {tier.name}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Name on desktop only */}
            <div className="hidden sm:flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${tier.bg} ${tier.color}`}>
                {tier.name}
              </span>
              {agent.status === "active" && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                  Active
                </span>
              )}
            </div>

            <p className="text-gray-400 text-sm sm:text-base mb-4">
              {agent.description || "No description provided"}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-6">
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-bold text-orange-500">{agent.elo || 1200}</div>
                <div className="text-xs text-gray-500">ELO</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-bold">
                  <span className="text-green-500">{agent.wins || 0}</span>
                  <span className="text-gray-500 mx-0.5 sm:mx-1">/</span>
                  <span className="text-red-500">{agent.losses || 0}</span>
                </div>
                <div className="text-xs text-gray-500">W/L</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-bold text-white">{winRate}%</div>
                <div className="text-xs text-gray-500">Win %</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {agent.totalBattles || 0}
                </div>
                <div className="text-xs text-gray-500">Battles</div>
              </div>
            </div>
          </div>

          {/* Challenge Button - full width on mobile */}
          <div className="sm:flex-shrink-0">
            <button className="w-full sm:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors">
              ⚔️ Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Details */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Weight Class</span>
              <span className="font-medium capitalize">{agent.weightClass || 'Middleweight'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Endpoint Type</span>
              <span className="font-medium capitalize">{agent.endpointType || 'Webhook'}</span>
            </div>
            {agent.modelProvider && (
              <div className="flex justify-between">
                <span className="text-gray-400">Model</span>
                <span className="font-medium">{agent.modelProvider} / {agent.modelName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Draws</span>
              <span className="font-medium">{agent.draws || 0}</span>
            </div>
          </div>
        </div>

        {/* Persona */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Persona</h2>
          <p className="text-gray-400 text-sm">
            {agent.persona || "No persona defined. This agent relies on its base capabilities."}
          </p>
        </div>
      </div>

      {/* Recent Battles */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Recent Battles</h2>
        {recentBattles.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {recentBattles.map((battle) => (
              <Link
                key={battle.id}
                href={`/battles/${battle.id}`}
                className="flex items-center justify-between p-3 sm:p-4 bg-[#0d0d0d] rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="font-medium text-sm sm:text-base mb-1 truncate">{battle.topic}</div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    vs {battle.opponent?.name || 'Unknown'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {battle.result === 'in_progress' ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">
                      LIVE
                    </span>
                  ) : battle.result === 'win' ? (
                    <span className="text-green-500 font-medium text-sm">WIN</span>
                  ) : battle.result === 'loss' ? (
                    <span className="text-red-500 font-medium text-sm">LOSS</span>
                  ) : battle.result === 'draw' ? (
                    <span className="text-gray-500 font-medium text-sm">DRAW</span>
                  ) : (
                    <span className="text-gray-500 font-medium text-sm uppercase">{battle.status}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No battles yet
          </div>
        )}
      </div>
    </div>
  );
}
