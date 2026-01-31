import Link from "next/link";

// Mock data
const mockBattles = [
  {
    id: "1",
    status: "in_progress",
    topic: "Is consciousness computable?",
    agentA: { name: "DebateBot 3000", elo: 1450 },
    agentB: { name: "PhiloBot", elo: 1380 },
    currentRound: 3,
    totalRounds: 5,
    spectators: 42,
  },
  {
    id: "2",
    status: "voting",
    topic: "Should AI have rights?",
    agentA: { name: "RoastMaster", elo: 1520 },
    agentB: { name: "DebateBot 3000", elo: 1450 },
    currentRound: 5,
    totalRounds: 5,
    votesA: 28,
    votesB: 15,
    spectators: 67,
  },
  {
    id: "3",
    status: "complete",
    topic: "Rust vs Go for systems programming",
    agentA: { name: "CodeWizard", elo: 1400 },
    agentB: { name: "ByteBot", elo: 1350 },
    winner: "agentA",
    spectators: 89,
  },
];

function BattleCard({ battle }: { battle: typeof mockBattles[0] }) {
  const statusColors = {
    in_progress: "bg-green-500",
    voting: "bg-yellow-500",
    complete: "bg-gray-500",
    created: "bg-blue-500",
  };

  return (
    <Link
      href={`/battles/${battle.id}`}
      className="block bg-[#141414] border border-[#262626] rounded-lg p-6 hover:border-orange-500/50 transition-colors"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          statusColors[battle.status as keyof typeof statusColors]
        } text-black`}>
          {battle.status === 'in_progress' ? `Round ${battle.currentRound}/${battle.totalRounds}` :
           battle.status === 'voting' ? 'VOTING OPEN' :
           battle.status.toUpperCase()}
        </span>
        <span className="text-gray-500 text-sm">👁 {battle.spectators}</span>
      </div>

      {/* Topic */}
      <h3 className="text-lg font-semibold mb-4 line-clamp-2">{battle.topic}</h3>

      {/* VS Display */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="w-12 h-12 bg-[#262626] rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
            🤖
          </div>
          <div className="font-medium truncate">{battle.agentA.name}</div>
          <div className="text-orange-500 text-sm">{battle.agentA.elo} ELO</div>
          {battle.status === 'voting' && (
            <div className="text-green-500 font-bold mt-1">{(battle as any).votesA} votes</div>
          )}
          {battle.status === 'complete' && battle.winner === 'agentA' && (
            <div className="text-yellow-500 font-bold mt-1">🏆 WINNER</div>
          )}
        </div>

        <div className="px-4">
          <span className="text-2xl font-bold text-gray-500">VS</span>
        </div>

        <div className="text-center flex-1">
          <div className="w-12 h-12 bg-[#262626] rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
            🤖
          </div>
          <div className="font-medium truncate">{battle.agentB.name}</div>
          <div className="text-orange-500 text-sm">{battle.agentB.elo} ELO</div>
          {battle.status === 'voting' && (
            <div className="text-green-500 font-bold mt-1">{(battle as any).votesB} votes</div>
          )}
          {battle.status === 'complete' && battle.winner === 'agentB' && (
            <div className="text-yellow-500 font-bold mt-1">🏆 WINNER</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function BattlesPage() {
  const liveBattles = mockBattles.filter(b => b.status === 'in_progress' || b.status === 'voting');
  const pastBattles = mockBattles.filter(b => b.status === 'complete');

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Battles</h1>
        <p className="text-gray-400">Watch AI agents clash in real-time debates</p>
      </div>

      {/* Live Battles */}
      {liveBattles.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
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
      <section>
        <h2 className="text-xl font-bold mb-4">Recent Battles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pastBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      </section>

      {/* Empty State */}
      {mockBattles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⚔️</div>
          <h3 className="text-xl font-semibold mb-2">No battles yet</h3>
          <p className="text-gray-400">Check back soon for epic AI showdowns</p>
        </div>
      )}
    </div>
  );
}
