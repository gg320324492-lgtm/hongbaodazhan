'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGame } from '../../hooks/useGame';
import { MessageType } from '../../types/websocket';
import { GameEngine, DEFAULT_GAME_CONFIG } from '../../lib/game/engine';
import Menu from '../layout/Menu';
import RoomCreate from '../layout/RoomCreate';
import RoomJoin from '../layout/RoomJoin';
import GameCanvas from '../game/GameCanvas';
import HUD from '../ui/HUD';

type AppState = 'menu' | 'create' | 'join' | 'waiting' | 'playing' | 'ended';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [gameEngine] = useState(() => new GameEngine(DEFAULT_GAME_CONFIG));
  const [gameTimeLeft, setGameTimeLeft] = useState(180);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const { isConnected, error, connect, disconnect, send, on } = useWebSocket();
  const { gameState, localPlayerId, updateGameState, setLocalPlayer, setRoom, resetGame } = useGame();

  useEffect(() => {
    if (!isConnected) return;

    const handleRoomCreated = (message: any) => {
      if (message.type === MessageType.ROOM_CREATED) {
        setRoomId(message.roomId);
        setLocalPlayer(message.playerId);
        setRoom(message.roomId);
        setOpponentJoined(false);
        setAppState('waiting');
      }
    };

    const handleRoomJoined = (message: any) => {
      if (message.type === MessageType.ROOM_JOINED) {
        setRoomId(message.roomId);
        setLocalPlayer(message.playerId);
        setRoom(message.roomId);
        setOpponentJoined(true);
        setAppState('waiting');
      }
    };

    const handlePlayerJoined = (message: any) => {
      if (message.type === MessageType.PLAYER_JOINED) {
        setOpponentJoined(true);
      }
    };

    const handleGameStarted = (message: any) => {
      if (message.type === MessageType.GAME_STARTED) {
        // 使用服务器发送的游戏状态，而不是自己创建
        if (message.gameState) {
          updateGameState(message.gameState);
        }
        gameEngine.initialize();
        if (localPlayerId) {
          gameEngine.addPlayer(localPlayerId, 100, 300);
        }
        // 从服务器状态中获取对手ID
        if (message.gameState?.players) {
          const players = message.gameState.players instanceof Map 
            ? message.gameState.players 
            : new Map(Object.entries(message.gameState.players));
          players.forEach((player: any, id: string) => {
            if (id !== localPlayerId) {
              gameEngine.addPlayer(id, player.x || 700, player.y || 300);
            }
          });
        }
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

    return () => {};
  }, [isConnected, on, localPlayerId, gameEngine, updateGameState, setLocalPlayer, setRoom]);

  useEffect(() => {
    if (appState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;
      gameEngine.update(deltaTime);
      const state = gameEngine.getState();
      updateGameState(state);
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

  const handleCreateRoom = useCallback(async () => {
    if (!isConnected) await connect();
    setAppState('create');
    send({ type: MessageType.CREATE_ROOM });
  }, [isConnected, connect, send]);

  const handleJoinRoom = useCallback(async (roomId: string) => {
    if (!isConnected) await connect();
    send({ type: MessageType.JOIN_ROOM, roomId });
  }, [isConnected, connect, send]);

  const handleStartGame = useCallback(() => {
    send({ type: MessageType.GAME_START });
  }, [send]);

  const handlePlayerMove = useCallback((x: number, y: number, angle: number) => {
    if (appState !== 'playing' || !localPlayerId) return;
    send({ type: MessageType.PLAYER_MOVE, x, y, angle });
  }, [appState, localPlayerId, send]);

  const handlePlayerShoot = useCallback((angle: number, weaponType: string) => {
    if (appState !== 'playing' || !localPlayerId) return;
    send({ type: MessageType.PLAYER_SHOOT, angle, weaponType });
  }, [appState, localPlayerId, send]);

  const handleBackToMenu = useCallback(() => {
    disconnect();
    resetGame();
    setRoomId(null);
    setOpponentJoined(false);
    setAppState('menu');
  }, [disconnect, resetGame]);

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
            <p className="text-pink-500 font-mono animate-pulse">
              {opponentJoined ? '对手已加入，点击下方开始游戏' : '等待对手加入…'}
            </p>
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
