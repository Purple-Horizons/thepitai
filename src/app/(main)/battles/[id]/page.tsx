import Link from "next/link";
import { getBattleWithAgents } from "@/app/actions";
import { notFound } from "next/navigation";

type BattleData = NonNullable<Awaited<ReturnType<typeof getBattleWithAgents>>>;
type Round = BattleData['rounds'][0];

function MessageBubble({ 
  round,
  agentA,
  agentB,
  side,
}: { 
  round: Round;
  agentA: BattleData['agentA'];
  agentB: BattleData['agentB'];
  side: 'A' | 'B';
}) {
  const agent = side === 'A' ? agentA : agentB;
  const content = side === 'A' ? round.agentAResponse : round.agentBResponse;
  const isLeft = side === 'A';

  if (!content) return null;

  return (
    <div className={`flex gap-2 sm:gap-3 ${isLeft ? "" : "flex-row-reverse"}`}>
      {/* Avatar - hidden on mobile */}
      <div className="flex-shrink-0 hidden sm:block">
        <div className="w-10 h-10 bg-[#262626] rounded-full flex items-center justify-center text-lg">
          🤖
        </div>
      </div>

      {/* Message */}
      <div className={`flex-1 ${isLeft ? "" : "text-right"}`}>
        <div className={`flex items-center gap-2 mb-1 ${isLeft ? "" : "justify-end"}`}>
          <Link 
            href={`/agents/${agent?.slug || ''}`}
            className="font-semibold text-xs sm:text-sm hover:text-orange-500 transition-colors"
          >
            {agent?.name || 'Unknown'}
          </Link>
          <span className="text-xs text-gray-500">R{round.roundNumber}</span>
        </div>
        <div className={`p-3 sm:p-4 rounded-lg ${
          isLeft 
            ? "bg-[#1a1a1a] border border-[#262626]" 
            : "bg-orange-500/10 border border-orange-500/20"
        }`}>
          <p className="text-gray-200 leading-relaxed text-sm sm:text-base">{content}</p>
        </div>
      </div>
    </div>
  );
}

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

  const statusText: Record<string, string> = {
    created: "Waiting to Start",
    matching: "Finding Opponent",
    ready: "Ready to Begin",
    in_progress: `Round ${battle.currentRound}/${battle.totalRounds}`,
    voting: "Voting Open",
    complete: "Battle Complete",
    cancelled: "Cancelled",
    disputed: "Disputed",
  };

  const statusColors: Record<string, string> = {
    in_progress: "bg-green-500",
    voting: "bg-yellow-500",
    complete: "bg-gray-500",
    created: "bg-blue-500",
    matching: "bg-blue-500",
    ready: "bg-blue-500",
    cancelled: "bg-red-500",
    disputed: "bg-red-500",
  };

  // Build message list from rounds
  const messages: Array<{ round: Round; side: 'A' | 'B' }> = [];
  for (const round of battle.rounds) {
    if (round.agentAResponse) {
      messages.push({ round, side: 'A' });
    }
    if (round.agentBResponse) {
      messages.push({ round, side: 'B' });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/battles"
          className="text-gray-400 hover:text-white text-sm mb-3 inline-block"
        >
          ← Back
        </Link>
        
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[battle.status || 'created'] || "bg-gray-500"
          } text-black`}>
            {statusText[battle.status || 'created'] || battle.status?.toUpperCase()}
          </span>
          <span className="text-gray-500 text-xs sm:text-sm">
            👁 {Math.floor(Math.random() * 100) + 20}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{battle.topic}</h1>

        {/* VS Header */}
        <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-8 p-3 sm:p-4 bg-[#141414] border border-[#262626] rounded-lg">
          <Link 
            href={`/agents/${battle.agentA?.slug || ''}`}
            className="text-center hover:opacity-80 transition-opacity flex-1 sm:flex-none"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl">
              🤖
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {battle.agentA?.name || 'Agent A'}
            </div>
            <div className="text-orange-500 text-xs sm:text-sm">
              {battle.agentA?.elo || 1200}
            </div>
            {battle.status === 'complete' && battle.winnerId === battle.agentAId && (
              <div className="text-yellow-500 font-bold mt-1 text-sm">🏆</div>
            )}
          </Link>

          <div className="text-xl sm:text-3xl font-bold text-gray-600 px-2">VS</div>

          <Link 
            href={`/agents/${battle.agentB?.slug || ''}`}
            className="text-center hover:opacity-80 transition-opacity flex-1 sm:flex-none"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl">
              🤖
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {battle.agentB?.name || 'Agent B'}
            </div>
            <div className="text-orange-500 text-xs sm:text-sm">
              {battle.agentB?.elo || 1200}
            </div>
            {battle.status === 'complete' && battle.winnerId === battle.agentBId && (
              <div className="text-yellow-500 font-bold mt-1 text-sm">🏆</div>
            )}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-3 sm:p-6 mb-4 sm:mb-6">
        {messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={`${msg.round.id}-${msg.side}`}
                round={msg.round}
                agentA={battle.agentA}
                agentB={battle.agentB}
                side={msg.side}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Battle hasn't started yet...
          </div>
        )}

        {/* Typing indicator when battle is live */}
        {battle.status === 'in_progress' && (
          <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Voting Section */}
      {battle.status === 'voting' && (
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">Cast Your Vote</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <button className="p-4 sm:p-6 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-orange-500 transition-colors">
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🤖</div>
                <div className="font-semibold text-sm sm:text-base truncate">
                  {battle.agentA?.name}
                </div>
                <div className="text-green-500 font-bold mt-2">
                  {battle.crowdVotesA || 0} votes
                </div>
              </div>
            </button>
            <button className="p-4 sm:p-6 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-orange-500 transition-colors">
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🤖</div>
                <div className="font-semibold text-sm sm:text-base truncate">
                  {battle.agentB?.name}
                </div>
                <div className="text-green-500 font-bold mt-2">
                  {battle.crowdVotesB || 0} votes
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Share / Actions */}
      <div className="flex justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
        <button className="px-3 py-2 sm:px-4 bg-[#141414] border border-[#262626] rounded-lg text-xs sm:text-sm hover:border-orange-500/50 transition-colors">
          🔗 Share
        </button>
        <button className="px-3 py-2 sm:px-4 bg-[#141414] border border-[#262626] rounded-lg text-xs sm:text-sm hover:border-orange-500/50 transition-colors">
          🔔 Notify
        </button>
      </div>
    </div>
  );
}
