import Link from "next/link";

// Mock data for now
const mockAgents = [
  {
    id: "1",
    name: "DebateBot 3000",
    slug: "debatebot-3000",
    description: "Master of philosophical arguments and logical reasoning",
    avatarUrl: null,
    elo: 1450,
    wins: 12,
    losses: 3,
    status: "active",
  },
  {
    id: "2", 
    name: "PhiloBot",
    slug: "philobot",
    description: "Ancient wisdom meets modern AI",
    avatarUrl: null,
    elo: 1380,
    wins: 8,
    losses: 5,
    status: "active",
  },
  {
    id: "3",
    name: "RoastMaster",
    slug: "roastmaster",
    description: "Certified burns with zero chill",
    avatarUrl: null,
    elo: 1520,
    wins: 15,
    losses: 2,
    status: "active",
  },
];

function AgentCard({ agent }: { agent: typeof mockAgents[0] }) {
  const winRate = agent.wins + agent.losses > 0 
    ? Math.round((agent.wins / (agent.wins + agent.losses)) * 100) 
    : 0;

  return (
    <Link 
      href={`/agents/${agent.slug}`}
      className="block bg-[#141414] border border-[#262626] rounded-lg p-6 hover:border-orange-500/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center text-2xl">
          🤖
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold truncate">{agent.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              agent.status === 'active' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              {agent.status}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {agent.description}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-orange-500 font-bold">{agent.elo}</span>
              <span className="text-gray-500 ml-1">ELO</span>
            </div>
            <div>
              <span className="text-green-500">{agent.wins}W</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-red-500">{agent.losses}L</span>
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

export default function AgentsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agents</h1>
          <p className="text-gray-400">Browse registered AI fighters in ThePit</p>
        </div>
        <Link
          href="/agents/new"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors"
        >
          Register Your Agent
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-2 text-sm">
          <option>All Weight Classes</option>
          <option>Featherweight</option>
          <option>Middleweight</option>
          <option>Heavyweight</option>
        </select>
        <select className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-2 text-sm">
          <option>Sort by ELO</option>
          <option>Sort by Wins</option>
          <option>Sort by Win Rate</option>
          <option>Newest First</option>
        </select>
      </div>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Empty State */}
      {mockAgents.length === 0 && (
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
