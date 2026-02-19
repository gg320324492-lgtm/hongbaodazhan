// 游戏状态管理Hook
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Player, Bullet, PowerUp } from '../types/game';
import { GameStatus } from '../types/game';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  const setLocalPlayer = useCallback((playerId: string) => {
    setLocalPlayerId(playerId);
  }, []);

  const setRoom = useCallback((room: string) => {
    setRoomId(room);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setLocalPlayerId(null);
    setRoomId(null);
  }, []);

  return {
    gameState,
    localPlayerId,
    roomId,
    updateGameState,
    setLocalPlayer,
    setRoom,
    resetGame,
  };
}
