// 主页面 - 整合所有组件
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGame } from '../hooks/useGame';
import { MessageType } from '../types/websocket';
import type { GameState } from '../types/game';
import { GameEngine, DEFAULT_GAME_CONFIG } from '../lib/game/engine';
import Menu from '../components/layout/Menu';
import RoomCreate from '../components/layout/RoomCreate';
import RoomJoin from '../components/layout/RoomJoin';
import GameCanvas from '../components/game/GameCanvas';
import HUD from '../components/ui/HUD';

type AppState = 'menu' | 'create' | 'join' | 'waiting' | 'playing' | 'ended';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [gameEngine] = useState(() => new GameEngine(DEFAULT_GAME_CONFIG));
  const [gameTimeLeft, setGameTimeLeft] = useState(180);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const { isConnected, error, connect, disconnect, send, on } = useWebSocket();
  const { gameState, localPlayerId, updateGameState, setLocalPlayer, setRoom, resetGame } = useGame();

  // WebSocket消息处理
  useEffect(() => {
    if (!isConnected) return;

    const handleRoomCreated = (message: any) => {
      if (message.type === MessageType.ROOM_CREATED) {
        setRoomId(message.roomId);
        setLocalPlayer(message.playerId);
        setRoom(message.roomId);
        setAppState('waiting');
      }
    };

    const handleRoomJoined = (message: any) => {
      if (message.type === MessageType.ROOM_JOINED) {
        setRoomId(message.roomId);
        setLocalPlayer(message.playerId);
        setRoom(message.roomId);
        setAppState('waiting');
      }
    };

    const handlePlayerJoined = (message: any) => {
      if (message.type === MessageType.PLAYER_JOINED) {
        // 对手加入，可以开始游戏
      }
    };

    const handleGameStarted = (message: any) => {
      if (message.type === MessageType.GAME_STARTED) {
        gameEngine.initialize();
        // 添加玩家
        if (localPlayerId) {
          gameEngine.addPlayer(localPlayerId, 100, 300);
        }
        // 添加对手（假设）
        const opponentId = 'opponent_' + Date.now();
        gameEngine.addPlayer(opponentId, 700, 300);
        gameEngine.startGame();
        setAppState('playing');
        setGameTimeLeft(180);
      }
    };

    const handleGameState = (message: any) => {
      if (message.type === MessageType.GAME_STATE) {
        updateGameState(message.gameState);
      }
    };

    const handleError = (message: any) => {
      if (message.type === MessageType.ERROR) {
        console.error('Game error:', message.message);
      }
    };

    const handleRoomNotFound = (message: any) => {
      setJoinError(message.message || '房间不存在');
    };

    const handleRoomFull = (message: any) => {
      setJoinError(message.message || '房间已满');
    };

    on(MessageType.ROOM_CREATED, handleRoomCreated);
    on(MessageType.ROOM_JOINED, handleRoomJoined);
    on(MessageType.ROOM_NOT_FOUND, handleRoomNotFound);
    on(MessageType.ROOM_FULL, handleRoomFull);
    on(MessageType.PLAYER_JOINED, handlePlayerJoined);
    on(MessageType.GAME_STARTED, handleGameStarted);
    on(MessageType.GAME_STATE, handleGameState);
    on(MessageType.ERROR, handleError);

    return () => {
      // 清理在useWebSocket中处理
    };
  }, [isConnected, on, localPlayerId, gameEngine, updateGameState, setLocalPlayer, setRoom]);

  // 游戏循环
  useEffect(() => {
    if (appState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;
      
      gameEngine.update(deltaTime);
      const state = gameEngine.getState();
      updateGameState(state);

      // 更新剩余时间
      const timeLeft = Math.max(0, 180 - Math.floor(state.gameTime / 1000));
      setGameTimeLeft(timeLeft);

      if (state.gameStatus === 'ended') {
        setAppState('ended');
      }

      setLastUpdateTime(now);
      requestAnimationFrame(gameLoop);
    };

    setLastUpdateTime(Date.now());
    const frameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(frameId);
  }, [appState, gameEngine, updateGameState, lastUpdateTime]);

  // 创建房间
  const handleCreateRoom = useCallback(async () => {
    if (!isConnected) {
      await connect();
    }
    setAppState('create');
    send({ type: MessageType.CREATE_ROOM });
  }, [isConnected, connect, send]);

  // 加入房间
  const handleJoinRoom = useCallback(async (roomId: string) => {
    if (!isConnected) {
      await connect();
    }
    send({ type: MessageType.JOIN_ROOM, roomId });
  }, [isConnected, connect, send]);

  // 开始游戏
  const handleStartGame = useCallback(() => {
    send({ type: MessageType.GAME_START });
  }, [send]);

  // 玩家移动
  const handlePlayerMove = useCallback((x: number, y: number, angle: number) => {
    if (appState !== 'playing' || !localPlayerId) return;
    send({
      type: MessageType.PLAYER_MOVE,
      x,
      y,
      angle,
    });
  }, [appState, localPlayerId, send]);

  // 玩家射击
  const handlePlayerShoot = useCallback((angle: number, weaponType: string) => {
    if (appState !== 'playing' || !localPlayerId) return;
    send({
      type: MessageType.PLAYER_SHOOT,
      angle,
      weaponType,
    });
  }, [appState, localPlayerId, send]);

  // 返回菜单
  const handleBackToMenu = useCallback(() => {
    disconnect();
    resetGame();
    setRoomId(null);
    setAppState('menu');
  }, [disconnect, resetGame]);

  // 获取本地玩家和对手
  const localPlayer = gameState?.players.get(localPlayerId || '') || null;
  const opponent = gameState ? Array.from(gameState.players.values()).find(p => p.id !== localPlayerId) || null : null;

  return (
    <main className="min-h-screen relative">
      {appState === 'menu' && (
        <Menu
          onCreateRoom={async () => {
            await connect();
            setAppState('create');
          }}
          onJoinRoom={async () => {
            setJoinError(null);
            await connect();
            setAppState('join');
          }}
        />
      )}

      {appState === 'create' && (
        <RoomCreate
          roomId={roomId}
          isConnecting={!isConnected}
          onCreateRoom={handleCreateRoom}
          onBack={handleBackToMenu}
        />
      )}

      {appState === 'join' && (
        <RoomJoin
          isConnecting={!isConnected}
          error={error || joinError}
          onJoinRoom={(id) => {
            setJoinError(null);
            handleJoinRoom(id);
          }}
          onBack={() => {
            setJoinError(null);
            handleBackToMenu();
          }}
        />
      )}

      {appState === 'waiting' && roomId && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black">
          <div className="text-center space-y-4">
            <p className="text-cyan-400 font-mono text-xl">房间号：{roomId}</p>
            <p className="text-pink-500 font-mono animate-pulse">等待对手加入…</p>
            {localPlayerId && (
              <button
                onClick={handleStartGame}
                className="px-6 py-3 bg-cyan-400 text-black font-mono font-bold hover:bg-cyan-300 transition-colors"
              >
                开始游戏
              </button>
            )}
            <button
              onClick={handleBackToMenu}
              className="px-6 py-3 border-2 border-pink-500 text-pink-500 font-mono font-bold hover:bg-pink-500 hover:text-black transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      )}

      {appState === 'playing' && gameState && (
        <div className="relative w-full h-screen bg-black overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <GameCanvas
              width={DEFAULT_GAME_CONFIG.width}
              height={DEFAULT_GAME_CONFIG.height}
              gameState={gameState}
              localPlayerId={localPlayerId}
              onPlayerMove={handlePlayerMove}
              onPlayerShoot={handlePlayerShoot}
            />
          </div>
          <HUD
            player={localPlayer}
            opponent={opponent}
            gameState={gameState}
            timeLeft={gameTimeLeft}
          />
        </div>
      )}

      {appState === 'ended' && gameState && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold font-mono text-cyan-400">
              {gameState.winner === localPlayerId ? '你赢了！' : '你输了！'}
            </h2>
            <div className="space-y-2">
              <p className="text-cyan-400 font-mono">你的得分：{localPlayer?.score || 0}</p>
              <p className="text-pink-500 font-mono">对手得分：{opponent?.score || 0}</p>
            </div>
            <button
              onClick={handleBackToMenu}
              className="px-6 py-3 bg-cyan-400 text-black font-mono font-bold hover:bg-cyan-300 transition-colors"
            >
              返回主菜单
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
