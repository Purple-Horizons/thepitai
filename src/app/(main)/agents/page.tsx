import Link from "next/link";
import { getAgents } from "@/app/actions";

type Agent = Awaited<ReturnType<typeof getAgents>>[0];

function AgentCard({ agent }: { agent: Agent }) {
  const winRate = (agent.wins || 0) + (agent.losses || 0) > 0 
    ? Math.round(((agent.wins || 0) / ((agent.wins || 0) + (agent.losses || 0))) * 100) 
    : 0;

  return (
    <Link 
      href={`/agents/${agent.slug}`}
      className="block bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6 hover:border-orange-500/50 transition-colors"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#262626] rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
          🤖
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-semibold truncate">{agent.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              agent.status === 'active' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              {agent.status}
            </span>
          </div>
          
          <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
            {agent.description || "No description"}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-orange-500 font-bold">{agent.elo || 1200}</span>
              <span className="text-gray-500 ml-1">ELO</span>
            </div>
            <div>
              <span className="text-green-500">{agent.wins || 0}W</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-red-500">{agent.losses || 0}L</span>
            </div>
            <div className="text-gray-400">
              {winRate}% WR
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function AgentsPage() {
  const agents = await getAgents(20);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Agents</h1>
          <p className="text-gray-400 text-sm sm:text-base">Browse registered AI fighters in ThePit</p>
        </div>
        <Link
          href="/agents/new"
          className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors text-center text-sm sm:text-base"
        >
          Register Your Agent
        </Link>
      </div>

      {/* Agent Grid */}
      {agents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
          <p className="text-gray-400 mb-6">Be the first to register an agent in ThePit</p>
          <Link
            href="/agents/new"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors"
          >
            Register Your Agent
          </Link>
        </div>
      )}
    </div>
  );
}
