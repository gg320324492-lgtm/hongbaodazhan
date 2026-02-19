'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

const GAME_DURATION = 30;
const GAME_WIDTH = 360;
const GAME_HEIGHT = 480;
const BASKET_WIDTH = 56;
const BASKET_HEIGHT = 40;
const ENVELOPE_SIZE = 40;

const getWebSocketUrl = () => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001';
  }
  
  // 优先使用环境变量配置的WebSocket地址
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // 如果是生产环境（HTTPS），使用WSS协议
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname;
  
  // 如果是localhost或127.0.0.1，使用本地WebSocket服务器
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return `${protocol}://${hostname}:3001`;
  }
  
  // 生产环境应该配置NEXT_PUBLIC_WS_URL，如果没有配置则提示错误
  console.warn('警告: 未配置 NEXT_PUBLIC_WS_URL 环境变量，WebSocket连接可能失败');
  return `${protocol}://${hostname}:3001`;
};

const WS_URL = getWebSocketUrl();

interface RedEnvelope {
  id: number;
  x: number;
  y: number;
  speed: number;
  value: number;
}

interface CatchEffect {
  id: number;
  x: number;
  y: number;
  value: number;
  player: 1 | 2;
}

export default function CatchRedEnvelopeGame() {
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'online'>('menu');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [envelopes, setEnvelopes] = useState<RedEnvelope[]>([]);
  const [catchEffects, setCatchEffects] = useState<CatchEffect[]>([]);
  const [basket1X, setBasket1X] = useState(GAME_WIDTH / 4 - BASKET_WIDTH / 2);
  const [basket2X, setBasket2X] = useState((GAME_WIDTH * 3) / 4 - BASKET_WIDTH / 2);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [highScore1, setHighScore1] = useState(0);
  const [highScore2, setHighScore2] = useState(0);

  const [onlineState, setOnlineState] = useState<'idle' | 'create' | 'join' | 'waiting' | 'playing' | 'ended'>('idle');
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [playerNum, setPlayerNum] = useState<1 | 2 | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const envelopeIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const dimensionsRef = useRef({ width: GAME_WIDTH, height: GAME_HEIGHT });
  const throttleRef = useRef(0);

  const updateDimensions = useCallback(() => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    dimensionsRef.current = {
      width: Math.floor(rect.width) || GAME_WIDTH,
      height: Math.floor(rect.height) || GAME_HEIGHT,
    };
  }, []);

  useLayoutEffect(() => {
    if (gameState === 'playing' || onlineState === 'playing') updateDimensions();
  }, [gameState, onlineState, updateDimensions]);

  useEffect(() => {
    if ((gameState !== 'playing' && onlineState !== 'playing') || gameMode === 'online') return;
    const el = gameRef.current;
    if (!el) return;
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameState, onlineState, gameMode, updateDimensions]);

  const spawnEnvelope = useCallback(() => {
    const width = dimensionsRef.current.width;
    const x = Math.random() * (width - ENVELOPE_SIZE);
    const value = [1, 2, 5, 10][Math.floor(Math.random() * 4)];
    envelopeIdRef.current += 1;
    return {
      id: envelopeIdRef.current,
      x,
      y: -ENVELOPE_SIZE,
      speed: 2.2 + Math.random() * 1.8,
      value,
    };
  }, []);

  const addCatchEffect = useCallback((x: number, y: number, value: number, player: 1 | 2) => {
    const id = ++effectIdRef.current;
    setCatchEffects((prev) => [...prev, { id, x, y, value, player }]);
    setTimeout(() => {
      setCatchEffects((prev) => prev.filter((e) => e.id !== id));
    }, 600);
  }, []);

  const checkCollision = useCallback((env: RedEnvelope, basketX: number) => {
    const h = dimensionsRef.current.height;
    const basketTopVal = h - BASKET_HEIGHT - 16;
    const basketBottomVal = h - 16;
    const envCenterX = env.x + ENVELOPE_SIZE / 2;
    const envBottom = env.y + ENVELOPE_SIZE;
    const basketLeft = basketX;
    const basketRight = basketX + BASKET_WIDTH;
    return (
      envBottom >= basketTopVal &&
      envBottom <= basketBottomVal &&
      envCenterX >= basketLeft &&
      envCenterX <= basketRight
    );
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    const { width, height } = dimensionsRef.current;
    setEnvelopes((prev) => {
      let newEnvs = prev
        .map((env) => ({ ...env, y: env.y + env.speed }))
        .filter((env) => {
          if (checkCollision(env, basket1X)) {
            setScore1((s) => {
              const ns = s + env.value;
              setHighScore1((h) => Math.max(h, ns));
              return ns;
            });
            addCatchEffect(env.x, env.y, env.value, 1);
            return false;
          }
          if (checkCollision(env, basket2X)) {
            setScore2((s) => {
              const ns = s + env.value;
              setHighScore2((h) => Math.max(h, ns));
              return ns;
            });
            addCatchEffect(env.x, env.y, env.value, 2);
            return false;
          }
          return env.y < height;
        });
      if (Math.random() < 0.09) newEnvs = [...newEnvs, spawnEnvelope()];
      return newEnvs;
    });
  }, [gameState, basket1X, basket2X, checkCollision, spawnEnvelope, addCatchEffect]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const id = setInterval(gameLoop, 16);
    return () => clearInterval(id);
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState('ended');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gameState]);

  const startLocalGame = () => {
    setScore1(0);
    setScore2(0);
    setTimeLeft(GAME_DURATION);
    setEnvelopes([]);
    setCatchEffects([]);
    setBasket1X(GAME_WIDTH / 4 - BASKET_WIDTH / 2);
    setBasket2X((GAME_WIDTH * 3) / 4 - BASKET_WIDTH / 2);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'local') return;
    const init = () => {
      updateDimensions();
      const { width } = dimensionsRef.current;
      const hw = width / 2;
      setBasket1X(Math.max(0, hw / 2 - BASKET_WIDTH / 2));
      setBasket2X(Math.min(width - BASKET_WIDTH, hw + hw / 2 - BASKET_WIDTH / 2));
      setEnvelopes([spawnEnvelope()]);
    };
    const t = requestAnimationFrame(init);
    return () => cancelAnimationFrame(t);
  }, [gameState, gameMode]);

  const pendingJoinRef = useRef<string | null>(null);

  const connectWs = useCallback((onOpen?: () => void) => {
    setWsError('');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // 添加连接超时处理（5秒）
    const timeoutId = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setWsError(`连接超时，无法连接到 WebSocket 服务器 (${WS_URL})。请确认服务器已启动。`);
        setWsConnected(false);
        if (onlineState === 'create' || onlineState === 'join') {
          setOnlineState('idle');
        }
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      setWsConnected(true);
      onOpen?.();
    };
    ws.onclose = () => {
      clearTimeout(timeoutId);
      setWsConnected(false);
      if (onlineState === 'waiting' || onlineState === 'playing') {
        setWsError('连接已断开');
      } else if (onlineState === 'create' || onlineState === 'join') {
        setWsError('连接失败，请确认游戏服务器已启动');
        setOnlineState('idle');
      }
    };
    ws.onerror = () => {
      clearTimeout(timeoutId);
      setWsError(`连接失败，无法连接到 WebSocket 服务器 (${WS_URL})。请确认服务器已启动。`);
      setWsConnected(false);
      if (onlineState === 'create' || onlineState === 'join') {
        setOnlineState('idle');
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'created':
            setRoomCode(msg.roomId);
            setOnlineState('waiting');
            setPlayerNum(1);
            break;
          case 'joined':
            setOnlineState('waiting');
            setPlayerNum(2);
            break;
          case 'player2_joined':
            break;
          case 'game_started':
            setOnlineState('playing');
            setScore1(0);
            setScore2(0);
            setTimeLeft(GAME_DURATION);
            setEnvelopes([]);
            setCatchEffects([]);
            setGameState('playing');
            break;
          case 'state':
            setEnvelopes(msg.envelopes || []);
            setScore1(msg.score1 ?? 0);
            setScore2(msg.score2 ?? 0);
            setTimeLeft(msg.timeLeft ?? GAME_DURATION);
            setBasket1X(msg.basket1X ?? basket1X);
            setBasket2X(msg.basket2X ?? basket2X);
            if (msg.gameState === 'ended') {
              setOnlineState('ended');
              setGameState('ended');
            }
            break;
          case 'player_left':
            setWsError(msg.message || '对手已离开');
            break;
          case 'error':
            setWsError(msg.message || '发生错误');
            break;
          case 'restart_request':
            setOnlineState('waiting');
            setGameState('idle');
            if (playerNum === 1) {
              setTimeout(() => wsRef.current?.send(JSON.stringify({ type: 'start' })), 100);
            }
            break;
        }
      } catch (_) {}
    };
  }, []);

  const createRoom = () => {
    setOnlineState('create');
    setWsError('');
    connectWs(() => {
      wsRef.current?.send(JSON.stringify({ type: 'create' }));
    });
  };

  const joinRoom = () => {
    const code = joinInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      setWsError('请输入正确的房间号');
      return;
    }
    pendingJoinRef.current = code;
    setOnlineState('join');
    setWsError('');
    connectWs(() => {
      wsRef.current?.send(JSON.stringify({ type: 'join', roomId: pendingJoinRef.current }));
    });
  };

  const startOnlineGame = () => {
    wsRef.current?.send(JSON.stringify({ type: 'start' }));
  };

  const requestRestart = () => {
    wsRef.current?.send(JSON.stringify({ type: 'restart' }));
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handlePointer = (clientX: number) => {
    if (!gameRef.current) return;
    if (gameMode === 'local') {
      if (gameState !== 'playing') return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * dimensionsRef.current.width;
      const hw = dimensionsRef.current.width / 2;
      if (x < hw) {
        setBasket1X(Math.max(0, Math.min(hw - BASKET_WIDTH, x - BASKET_WIDTH / 2)));
      } else {
        setBasket2X(Math.max(hw, Math.min(dimensionsRef.current.width - BASKET_WIDTH, x - BASKET_WIDTH / 2)));
      }
    } else {
      if (onlineState !== 'playing' || !playerNum) return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
      if (Date.now() - throttleRef.current < 30) return;
      throttleRef.current = Date.now();
      wsRef.current?.send(JSON.stringify({ type: 'basket', playerNum, x }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => handlePointer(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) handlePointer(e.touches[0].clientX);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) handlePointer(e.touches[0].clientX);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const isPlaying = gameState === 'playing' || (gameMode === 'online' && onlineState === 'playing');
  const isEnded = gameState === 'ended' || (gameMode === 'online' && onlineState === 'ended');
  const winner = score1 > score2 ? 1 : score2 > score1 ? 2 : 0;
  const displayWidth = gameMode === 'online' ? GAME_WIDTH : dimensionsRef.current.width;

  const renderGameArea = () => (
    <div
      ref={gameRef}
      className="relative mx-auto touch-none overflow-hidden rounded-2xl border-2 border-rose-200/80 bg-gradient-to-b from-sky-100/90 to-amber-50/90 shadow-inner select-none"
      style={{
        width: '100%',
        aspectRatio: '3/4',
        maxWidth: 420,
        maxHeight: 560,
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      {envelopes.map((env) => (
        <div
          key={env.id}
          className="absolute flex items-center justify-center text-[28px] drop-shadow-md"
          style={{
            left: `${(env.x / displayWidth) * 100}%`,
            top: env.y,
            width: ENVELOPE_SIZE,
            height: ENVELOPE_SIZE,
            transform: 'translateX(-50%)',
          }}
        >
          🧧
        </div>
      ))}
      {catchEffects.map((ef) => (
        <div
          key={ef.id}
          className={`absolute animate-catch-pop text-lg font-bold ${
            ef.player === 1 ? 'text-rose-600' : 'text-fuchsia-600'
          }`}
          style={{
            left: `${((ef.x + ENVELOPE_SIZE / 2) / displayWidth) * 100}%`,
            top: ef.y,
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 8px white',
          }}
        >
          +{ef.value}
        </div>
      ))}
      <div
        className="absolute flex items-center justify-center text-2xl drop-shadow-lg"
        style={{
          left: `${(basket1X / displayWidth) * 100}%`,
          bottom: 16,
          width: BASKET_WIDTH,
          height: BASKET_HEIGHT,
          transform: 'translateX(-50%)',
        }}
      >
        <span className="text-3xl">🧺</span>
      </div>
      <div
        className="absolute flex items-center justify-center text-2xl drop-shadow-lg"
        style={{
          left: `${(basket2X / displayWidth) * 100}%`,
          bottom: 16,
          width: BASKET_WIDTH,
          height: BASKET_HEIGHT,
          transform: 'translateX(-50%)',
        }}
      >
        <span className="text-3xl">🧺</span>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-rose-200/60"
        style={{ transform: 'translateX(-50%)' }}
      />
    </div>
  );

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50" style={{ touchAction: 'pan-y' }}>
      <div className="min-h-screen px-4 py-4 pb-[env(safe-area-inset-bottom)] sm:py-6">
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-[28px] bg-white/80 shadow-[0_8px_32px_rgba(190,24,93,0.12)] backdrop-blur-xl ring-1 ring-rose-100/80">
            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-6 py-5 text-white">
              <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">🧧 双人接红包</h1>
              <p className="mt-2 text-center text-sm font-medium text-white/90">
                {gameMode === 'local' ? '左半屏控制左篮 · 右半屏控制右篮' : gameMode === 'online' && playerNum ? `你控制 玩家 ${playerNum}` : '本地同屏 / 联网对战'}
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {gameMode === 'menu' && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-500">选择游戏模式</p>
                  <div className="grid gap-3">
                    <button
                      onClick={() => setGameMode('local')}
                      className="rounded-2xl bg-gradient-to-r from-rose-100 to-pink-100 py-4 text-lg font-bold text-rose-700 ring-1 ring-rose-200/60 transition hover:from-rose-200 hover:to-pink-200"
                    >
                      本地双人 · 同屏对战
                    </button>
                    <button
                      onClick={() => setGameMode('online')}
                      className="rounded-2xl bg-gradient-to-r from-fuchsia-100 to-purple-100 py-4 text-lg font-bold text-fuchsia-700 ring-1 ring-fuchsia-200/60 transition hover:from-fuchsia-200 hover:to-purple-200"
                    >
                      联网对战 · 两台设备
                    </button>
                  </div>
                </div>
              )}

              {gameMode === 'local' && gameState === 'idle' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 p-5 text-center ring-1 ring-rose-200/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">玩家 1</p>
                      <p className="mt-1 text-2xl font-bold text-rose-700">最高 {highScore1}</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-fuchsia-100 to-purple-100 p-5 text-center ring-1 ring-fuchsia-200/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600">玩家 2</p>
                      <p className="mt-1 text-2xl font-bold text-fuchsia-700">最高 {highScore2}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500">同一设备，每人控制一侧，{GAME_DURATION} 秒后得分高者获胜</p>
                  <button
                    onClick={startLocalGame}
                    className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 py-4 text-lg font-bold text-white shadow-lg shadow-pink-500/30 transition hover:shadow-xl active:scale-[0.98]"
                  >
                    开始对战
                  </button>
                  <button
                    onClick={() => setGameMode('menu')}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    返回选择模式
                  </button>
                </div>
              )}

              {gameMode === 'online' && onlineState === 'idle' && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-500">两台设备打开同一地址，一人创建房间，另一人输入房间号加入</p>
                  {wsError && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{wsError}</div>}
                  <div className="grid gap-3">
                    <button
                      onClick={createRoom}
                      className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-lg font-bold text-white shadow-lg transition hover:shadow-xl"
                    >
                      创建房间
                    </button>
                    <div className="flex gap-2">
                      <input
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                        placeholder="输入房间号"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-mono"
                        maxLength={8}
                      />
                      <button
                        onClick={joinRoom}
                        className="rounded-xl bg-fuchsia-500 px-6 py-3 font-bold text-white transition hover:bg-fuchsia-600"
                      >
                        加入
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      wsRef.current?.close();
                      wsRef.current = null;
                      setGameMode('menu');
                      setOnlineState('idle');
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    返回选择模式
                  </button>
                </div>
              )}

              {gameMode === 'online' && onlineState === 'join' && !playerNum && (
                <div className="rounded-2xl bg-gray-50 p-6 text-center">
                  <p className="text-gray-600">正在加入房间…</p>
                </div>
              )}

              {gameMode === 'online' && (onlineState === 'create' || onlineState === 'waiting') && (playerNum === 1 || (onlineState === 'create' && !roomCode)) && (
                <div className="space-y-4">
                  {wsError && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{wsError}</div>}
                  <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 p-6 text-center ring-1 ring-amber-200/50">
                    {roomCode ? (
                      <>
                        <p className="text-sm text-gray-600">房间号（分享给对手）</p>
                        <p className="mt-2 text-3xl font-mono font-bold tracking-widest text-rose-600">{roomCode}</p>
                      </>
                    ) : (
                      <p className="text-gray-600">正在创建房间…</p>
                    )}
                    {roomCode && (
                      <button
                        onClick={copyRoomCode}
                        className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        复制房间号
                      </button>
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    {onlineState === 'waiting' ? '等待对手加入…' : '连接中…'}
                  </p>
                  {onlineState === 'waiting' && roomCode && (
                    <button
                      onClick={startOnlineGame}
                      className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-4 text-lg font-bold text-white shadow-lg"
                    >
                      开始游戏
                    </button>
                  )}
                </div>
              )}

              {gameMode === 'online' && onlineState === 'waiting' && playerNum === 2 && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-r from-fuchsia-50 to-purple-50 p-6 text-center ring-1 ring-fuchsia-200/50">
                    <p className="text-lg font-bold text-fuchsia-700">已加入房间</p>
                    <p className="mt-2 text-sm text-gray-500">等待房主开始游戏</p>
                  </div>
                </div>
              )}

              {isPlaying && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-gradient-to-r from-rose-100 to-pink-100 px-3 py-2.5 text-center ring-1 ring-rose-200/60">
                      <p className="text-[10px] font-semibold uppercase text-rose-600">玩家 1</p>
                      <p className="text-xl font-bold tabular-nums text-rose-700">{score1}</p>
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-gray-100/80 px-2 py-2.5">
                      <span className="text-lg font-bold tabular-nums text-gray-700">{timeLeft}s</span>
                    </div>
                    <div className="rounded-xl bg-gradient-to-r from-fuchsia-100 to-purple-100 px-3 py-2.5 text-center ring-1 ring-fuchsia-200/60">
                      <p className="text-[10px] font-semibold uppercase text-fuchsia-600">玩家 2</p>
                      <p className="text-xl font-bold tabular-nums text-fuchsia-700">{score2}</p>
                    </div>
                  </div>
                  {renderGameArea()}
                  <p className="text-center text-xs text-gray-500">
                    {gameMode === 'local'
                      ? '左半边移动左篮 · 右半边移动右篮'
                      : `触摸/滑动控制你的篮子 (玩家 ${playerNum})`}
                  </p>
                </div>
              )}

              {isEnded && (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-6 ring-1 ring-amber-200/50">
                    <p className="text-center text-sm font-medium text-gray-600">
                      {winner === 0 ? '平局！' : `玩家 ${winner} 获胜！`}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-white/80 p-4 text-center shadow-sm">
                        <p className="text-xs text-rose-600">玩家 1</p>
                        <p className="text-2xl font-bold text-rose-700">{score1}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-4 text-center shadow-sm">
                        <p className="text-xs text-fuchsia-600">玩家 2</p>
                        <p className="text-2xl font-bold text-fuchsia-700">{score2}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={
                      gameMode === 'local'
                        ? startLocalGame
                        : playerNum === 1
                          ? () => { requestRestart(); }
                          : () => {}
                    }
                    disabled={gameMode === 'online' && playerNum !== 1}
                    className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    {gameMode === 'online' && playerNum !== 1 ? '等待房主开始' : '再来一局'}
                  </button>
                  <button
                    onClick={() => {
                      wsRef.current?.close();
                      wsRef.current = null;
                      setGameMode('menu');
                      setOnlineState('idle');
                      setPlayerNum(null);
                      setRoomCode('');
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    返回主菜单
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            红包 1/2/5/10 分 · 联网模式需部署 WebSocket 服务器
          </p>
        </div>
      </div>
    </div>
  );
}
