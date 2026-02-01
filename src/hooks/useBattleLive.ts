'use client';

import { useEffect, useState, useCallback } from 'react';
import Ably from 'ably';
import type { BattleEvent } from '@/lib/ably';

interface UseBattleLiveOptions {
  battleId: string;
  onResponse?: (event: Extract<BattleEvent, { type: 'response_submitted' }>) => void;
  onRoundComplete?: (event: Extract<BattleEvent, { type: 'round_complete' }>) => void;
  onVotingStarted?: (event: Extract<BattleEvent, { type: 'voting_started' }>) => void;
  onVote?: (event: Extract<BattleEvent, { type: 'vote_cast' }>) => void;
  onBattleComplete?: (event: Extract<BattleEvent, { type: 'battle_complete' }>) => void;
}

interface LiveState {
  connected: boolean;
  spectators: number;
  lastEvent: BattleEvent | null;
}

export function useBattleLive({
  battleId,
  onResponse,
  onRoundComplete,
  onVotingStarted,
  onVote,
  onBattleComplete,
}: UseBattleLiveOptions) {
  const [state, setState] = useState<LiveState>({
    connected: false,
    spectators: 0,
    lastEvent: null,
  });

  const handleEvent = useCallback((message: Ably.Message) => {
    const event = message.data as BattleEvent;
    
    setState(prev => ({ ...prev, lastEvent: event }));
    
    switch (event.type) {
      case 'response_submitted':
        onResponse?.(event);
        break;
      case 'round_complete':
        onRoundComplete?.(event);
        break;
      case 'voting_started':
        onVotingStarted?.(event);
        break;
      case 'vote_cast':
        onVote?.(event);
        break;
      case 'battle_complete':
        onBattleComplete?.(event);
        break;
    }
  }, [onResponse, onRoundComplete, onVotingStarted, onVote, onBattleComplete]);

  useEffect(() => {
    // Only connect if we have an API key (passed via env)
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_ABLY_API_KEY not set - live updates disabled');
      return;
    }

    const ably = new Ably.Realtime({ key: apiKey });
    const channelName = `battle:${battleId}`;
    const channel = ably.channels.get(channelName, {
      params: { rewind: '1' }, // Get last message on connect
    });

    // Track connection state
    ably.connection.on('connected', () => {
      setState(prev => ({ ...prev, connected: true }));
    });

    ably.connection.on('disconnected', () => {
      setState(prev => ({ ...prev, connected: false }));
    });

    // Subscribe to all events
    channel.subscribe(handleEvent);

    // Track presence (spectators)
    const updateSpectatorCount = async () => {
      try {
        const members = await channel.presence.get();
        setState(prev => ({ ...prev, spectators: members.length }));
      } catch (err) {
        console.error('Failed to get presence:', err);
      }
    };

    channel.presence.subscribe('enter', updateSpectatorCount);
    channel.presence.subscribe('leave', updateSpectatorCount);

    // Enter presence
    channel.presence.enter({ viewerType: 'spectator' }).catch(console.error);

    return () => {
      channel.presence.leave().catch(() => {});
      channel.unsubscribe();
      ably.close();
    };
  }, [battleId, handleEvent]);

  return state;
}
