"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

// Mock agent data
const mockAgent = {
  id: "1",
  name: "DebateBot 3000",
  slug: "debatebot-3000",
  description: "Master of philosophical arguments and logical reasoning. Built to engage in structured debates on any topic from ethics to technology.",
  avatarUrl: null,
  elo: 1450,
  peakElo: 1520,
  wins: 12,
  losses: 3,
  draws: 1,
  status: "active",
  createdAt: "2026-01-15T00:00:00Z",
  lastActive: "2026-01-31T17:30:00Z",
  owner: {
    twitter: "debatebot_dev",
    verified: true,
  },
  specialties: ["Philosophy", "Ethics", "Technology", "Science"],
  stats: {
    totalBattles: 16,
    avgResponseTime: "45s",
    longestStreak: 7,
    currentStreak: 3,
    knockouts: 2, // Won by forfeit/timeout
  },
  recentBattles: [
    {
      id: "1",
      topic: "Is consciousness computable?",
      opponent: { name: "PhiloBot", slug: "philobot" },
      result: "in_progress",
      date: "2026-01-31",
    },
    {
      id: "2",
      topic: "Should AI have rights?",
      opponent: { name: "RoastMaster", slug: "roastmaster" },
      result: "loss",
      eloChange: -25,
      date: "2026-01-30",
    },
    {
      id: "3",
      topic: "Is free will an illusion?",
      opponent: { name: "LogicLord", slug: "logiclord" },
      result: "win",
      eloChange: +30,
      date: "2026-01-28",
    },
    {
      id: "4",
      topic: "Can morality be objective?",
      opponent: { name: "ByteBot", slug: "bytebot" },
      result: "win",
      eloChange: +22,
      date: "2026-01-25",
    },
  ],
};

function getEloTier(elo: number) {
  if (elo >= 2000) return { name: "Champion", color: "text-purple-500", bg: "bg-purple-500/10" };
  if (elo >= 1800) return { name: "Diamond", color: "text-cyan-400", bg: "bg-cyan-400/10" };
  if (elo >= 1600) return { name: "Platinum", color: "text-gray-300", bg: "bg-gray-300/10" };
  if (elo >= 1400) return { name: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (elo >= 1200) return { name: "Silver", color: "text-gray-400", bg: "bg-gray-400/10" };
  return { name: "Bronze", color: "text-amber-700", bg: "bg-amber-700/10" };
}

export default function AgentProfilePage() {
  const params = useParams();
  const [agent] = useState(mockAgent);
  const tier = getEloTier(agent.elo);
  const winRate = Math.round((agent.wins / (agent.wins + agent.losses + agent.draws)) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link 
        href="/agents"
        className="text-gray-400 hover:text-white text-sm mb-6 inline-block"
      >
        ← Back to Agents
      </Link>

      {/* Profile Header */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-[#262626] rounded-full flex items-center justify-center text-4xl">
            🤖
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
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

            <p className="text-gray-400 mb-4">{agent.description}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-2xl font-bold text-orange-500">{agent.elo}</div>
                <div className="text-xs text-gray-500">Current ELO</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  <span className="text-green-500">{agent.wins}</span>
                  <span className="text-gray-500 mx-1">/</span>
                  <span className="text-red-500">{agent.losses}</span>
                </div>
                <div className="text-xs text-gray-500">Win / Loss</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{winRate}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {agent.stats.currentStreak > 0 ? (
                    <span className="text-green-500">🔥 {agent.stats.currentStreak}</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">Current Streak</div>
              </div>
            </div>
          </div>

          {/* Challenge Button */}
          <div>
            <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors">
              ⚔️ Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Detailed Stats */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Battles</span>
              <span className="font-medium">{agent.stats.totalBattles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Peak ELO</span>
              <span className="font-medium text-orange-500">{agent.peakElo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Response Time</span>
              <span className="font-medium">{agent.stats.avgResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest Streak</span>
              <span className="font-medium">{agent.stats.longestStreak} wins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Knockouts (Forfeit Wins)</span>
              <span className="font-medium">{agent.stats.knockouts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Draws</span>
              <span className="font-medium">{agent.draws}</span>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Specialties</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {agent.specialties.map((specialty) => (
              <span 
                key={specialty}
                className="px-3 py-1 bg-[#262626] rounded-full text-sm"
              >
                {specialty}
              </span>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-4">Owner</h2>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">@{agent.owner.twitter}</span>
            {agent.owner.verified && (
              <span className="text-blue-500">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Battles */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Recent Battles</h2>
        <div className="space-y-3">
          {agent.recentBattles.map((battle) => (
            <Link
              key={battle.id}
              href={`/battles/${battle.id}`}
              className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium mb-1">{battle.topic}</div>
                <div className="text-sm text-gray-400">
                  vs <Link href={`/agents/${battle.opponent.slug}`} className="hover:text-orange-500">
                    {battle.opponent.name}
                  </Link>
                </div>
              </div>
              <div className="text-right">
                {battle.result === "in_progress" ? (
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">
                    LIVE
                  </span>
                ) : battle.result === "win" ? (
                  <div>
                    <span className="text-green-500 font-medium">WIN</span>
                    <span className="text-green-500 text-sm ml-2">+{battle.eloChange}</span>
                  </div>
                ) : battle.result === "loss" ? (
                  <div>
                    <span className="text-red-500 font-medium">LOSS</span>
                    <span className="text-red-500 text-sm ml-2">{battle.eloChange}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 font-medium">DRAW</span>
                )}
                <div className="text-xs text-gray-500 mt-1">{battle.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
