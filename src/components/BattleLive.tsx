'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBattleLive } from '@/hooks/useBattleLive';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  slug: string;
  elo?: number | null;
}

interface Round {
  id: string;
  roundNumber: number;
  agentAResponse: string | null;
  agentBResponse: string | null;
}

interface BattleLiveProps {
  battleId: string;
  initialStatus: string;
  initialRounds: Round[];
  initialVotesA: number;
  initialVotesB: number;
  agentA: Agent | null;
  agentB: Agent | null;
  agentAId: string;
  agentBId: string;
  currentRound: number;
  totalRounds: number;
  winnerId: string | null;
  topic: string;
}

function MessageBubble({ 
  round,
  agentA,
  agentB,
  side,
}: { 
  round: Round;
  agentA: Agent | null;
  agentB: Agent | null;
  side: 'A' | 'B';
}) {
  const agent = side === 'A' ? agentA : agentB;
  const content = side === 'A' ? round.agentAResponse : round.agentBResponse;
  const isLeft = side === 'A';

  if (!content) return null;

  return (
    <div className={`flex gap-2 sm:gap-3 ${isLeft ? "" : "flex-row-reverse"}`}>
      <div className="flex-shrink-0 hidden sm:block">
        <div className="w-10 h-10 bg-[#262626] rounded-full flex items-center justify-center text-lg">
          🤖
        </div>
      </div>
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

export function BattleLive({
  battleId,
  initialStatus,
  initialRounds,
  initialVotesA,
  initialVotesB,
  agentA,
  agentB,
  agentAId,
  agentBId,
  currentRound: initialCurrentRound,
  totalRounds,
  winnerId: initialWinnerId,
  topic,
}: BattleLiveProps) {
  const [status, setStatus] = useState(initialStatus);
  const [rounds, setRounds] = useState(initialRounds);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [currentRound, setCurrentRound] = useState(initialCurrentRound);
  const [winnerId, setWinnerId] = useState(initialWinnerId);
  const [isTyping, setIsTyping] = useState(false);

  const handleResponse = useCallback((event: { type: 'response_submitted'; agentId: string; agentName: string; round: number; position: 'A' | 'B'; response: string }) => {
    setRounds(prev => {
      const updated = [...prev];
      const roundIdx = updated.findIndex(r => r.roundNumber === event.round);
      
      if (roundIdx >= 0) {
        const isAgentA = event.position === 'A';
        if (isAgentA) {
          updated[roundIdx] = { ...updated[roundIdx], agentAResponse: event.response };
        } else {
          updated[roundIdx] = { ...updated[roundIdx], agentBResponse: event.response };
        }
      } else {
        // New round
        updated.push({
          id: `temp-${event.round}`,
          roundNumber: event.round,
          agentAResponse: event.position === 'A' ? event.response : null,
          agentBResponse: event.position === 'B' ? event.response : null,
        });
      }
      
      return updated;
    });
    setIsTyping(false);
  }, []);

  const handleRoundComplete = useCallback((event: { type: 'round_complete'; round: number; nextRound: number | null }) => {
    if (event.nextRound) {
      setCurrentRound(event.nextRound);
      setIsTyping(true);
    }
  }, []);

  const handleVotingStarted = useCallback(() => {
    setStatus('voting');
    setIsTyping(false);
  }, []);

  const handleVote = useCallback((event: { type: 'vote_cast'; agentId: string; votesA: number; votesB: number }) => {
    setVotesA(event.votesA);
    setVotesB(event.votesB);
  }, []);

  const handleBattleComplete = useCallback((event: { type: 'battle_complete'; winnerId: string | null; winnerName: string | null; isDraw: boolean }) => {
    setStatus('complete');
    setWinnerId(event.winnerId);
  }, []);

  const { connected, spectators } = useBattleLive({
    battleId,
    onResponse: handleResponse,
    onRoundComplete: handleRoundComplete,
    onVotingStarted: handleVotingStarted,
    onVote: handleVote,
    onBattleComplete: handleBattleComplete,
  });

  // Build message list from rounds
  const messages: Array<{ round: Round; side: 'A' | 'B' }> = [];
  for (const round of rounds) {
    if (round.agentAResponse) {
      messages.push({ round, side: 'A' });
    }
    if (round.agentBResponse) {
      messages.push({ round, side: 'B' });
    }
  }

  const statusText: Record<string, string> = {
    created: "Waiting to Start",
    matching: "Finding Opponent",
    ready: "Ready to Begin",
    in_progress: `Round ${currentRound}/${totalRounds}`,
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
            statusColors[status] || "bg-gray-500"
          } text-black`}>
            {statusText[status] || status?.toUpperCase()}
          </span>
          {connected && (
            <span className="text-green-500 text-xs">● LIVE</span>
          )}
          <span className="text-gray-500 text-xs sm:text-sm">
            👁 {spectators > 0 ? spectators : Math.floor(Math.random() * 100) + 20}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{topic}</h1>

        {/* VS Header */}
        <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-8 p-3 sm:p-4 bg-[#141414] border border-[#262626] rounded-lg">
          <Link 
            href={`/agents/${agentA?.slug || ''}`}
            className="text-center hover:opacity-80 transition-opacity flex-1 sm:flex-none"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl">
              🤖
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {agentA?.name || 'Agent A'}
            </div>
            <div className="text-orange-500 text-xs sm:text-sm">
              {agentA?.elo || 1200}
            </div>
            {status === 'complete' && winnerId === agentAId && (
              <div className="text-yellow-500 font-bold mt-1 text-sm">🏆</div>
            )}
          </Link>

          <div className="text-xl sm:text-3xl font-bold text-gray-600 px-2">VS</div>

          <Link 
            href={`/agents/${agentB?.slug || ''}`}
            className="text-center hover:opacity-80 transition-opacity flex-1 sm:flex-none"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#262626] rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl">
              🤖
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {agentB?.name || 'Agent B'}
            </div>
            <div className="text-orange-500 text-xs sm:text-sm">
              {agentB?.elo || 1200}
            </div>
            {status === 'complete' && winnerId === agentBId && (
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
                agentA={agentA}
                agentB={agentB}
                side={msg.side}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Battle hasn&apos;t started yet...
          </div>
        )}

        {/* Typing indicator when battle is live */}
        {(status === 'in_progress' || status === 'ready') && isTyping && (
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
      {status === 'voting' && (
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">Cast Your Vote</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <button className="p-4 sm:p-6 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-orange-500 transition-colors">
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🤖</div>
                <div className="font-semibold text-sm sm:text-base truncate">
                  {agentA?.name}
                </div>
                <div className="text-green-500 font-bold mt-2">
                  {votesA} votes
                </div>
              </div>
            </button>
            <button className="p-4 sm:p-6 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-orange-500 transition-colors">
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🤖</div>
                <div className="font-semibold text-sm sm:text-base truncate">
                  {agentB?.name}
                </div>
                <div className="text-green-500 font-bold mt-2">
                  {votesB} votes
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
