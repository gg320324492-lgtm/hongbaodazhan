/**
 * WebSocket 双人接红包游戏服务器
 * 运行: node server/game-server.js
 * 默认端口: 3001
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || process.env.WS_PORT || 3001;
const GAME_WIDTH = 360;
const GAME_HEIGHT = 480;
const BASKET_WIDTH = 56;
const BASKET_HEIGHT = 40;
const ENVELOPE_SIZE = 40;
const GAME_DURATION = 30;
const BASKET_TOP = GAME_HEIGHT - BASKET_HEIGHT - 16;
const BASKET_BOTTOM = GAME_HEIGHT - 16;

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function spawnEnvelope() {
  const x = Math.random() * (GAME_WIDTH - ENVELOPE_SIZE);
  const value = [1, 2, 5, 10][Math.floor(Math.random() * 4)];
  return {
    id: Date.now() + Math.random(),
    x,
    y: -ENVELOPE_SIZE,
    speed: 2.2 + Math.random() * 1.8,
    value,
  };
}

function checkCollision(env, basketX) {
  const envCenterX = env.x + ENVELOPE_SIZE / 2;
  const envBottom = env.y + ENVELOPE_SIZE;
  const basketLeft = basketX;
  const basketRight = basketX + BASKET_WIDTH;
  return (
    envBottom >= BASKET_TOP &&
    envBottom <= BASKET_BOTTOM &&
    envCenterX >= basketLeft &&
    envCenterX <= basketRight
  );
}

const rooms = new Map();

function broadcastToRoom(roomId, data) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  room.player1?.send(msg);
  room.player2?.send(msg);
}

function runGameLoop(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.gameState !== 'playing') return;

  const halfWidth = GAME_WIDTH / 2;
  let { envelopes, score1, score2, basket1X, basket2X, timeLeft } = room;

  envelopes = envelopes
    .map((e) => ({ ...e, y: e.y + e.speed }))
    .filter((env) => {
      if (checkCollision(env, basket1X)) {
        room.score1 += env.value;
        return false;
      }
      if (checkCollision(env, basket2X)) {
        room.score2 += env.value;
        return false;
      }
      return env.y < GAME_HEIGHT;
    });

  if (Math.random() < 0.09) {
    envelopes.push(spawnEnvelope());
  }

  room.envelopes = envelopes;
  room.score1 = room.score1;
  room.score2 = room.score2;
  room.timeLeft -= 1 / 60;

  if (room.timeLeft <= 0) {
    room.timeLeft = 0;
    room.gameState = 'ended';
    room.gameLoopId = null;
  }

  broadcastToRoom(roomId, {
    type: 'state',
    envelopes: room.envelopes,
    score1: room.score1,
    score2: room.score2,
    timeLeft: Math.ceil(room.timeLeft),
    gameState: room.gameState,
    basket1X: room.basket1X,
    basket2X: room.basket2X,
  });

  if (room.gameState === 'playing') {
    room.gameLoopId = setTimeout(() => runGameLoop(roomId), 16);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
  console.log(`🎮 WebSocket 游戏服务器已启动: ws://localhost:${PORT}`);
});

wss.on('connection', (ws, req) => {
  ws.roomId = null;
  ws.playerNum = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type } = msg;

      if (type === 'create') {
        const roomId = generateRoomCode();
        rooms.set(roomId, {
          roomId,
          player1: ws,
          player2: null,
          gameState: 'waiting',
          envelopes: [],
          score1: 0,
          score2: 0,
          basket1X: GAME_WIDTH / 4 - BASKET_WIDTH / 2,
          basket2X: (GAME_WIDTH * 3) / 4 - BASKET_WIDTH / 2,
          timeLeft: GAME_DURATION,
          gameLoopId: null,
        });
        ws.roomId = roomId;
        ws.playerNum = 1;
        ws.send(JSON.stringify({ type: 'created', roomId, playerNum: 1 }));
        return;
      }

      if (type === 'join') {
        const { roomId } = msg;
        const room = rooms.get(roomId?.toUpperCase?.() || roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        if (room.player2) {
          ws.send(JSON.stringify({ type: 'error', message: '房间已满' }));
          return;
        }
        room.player2 = ws;
        ws.roomId = room.roomId;
        ws.playerNum = 2;
        ws.send(
          JSON.stringify({
            type: 'joined',
            roomId: room.roomId,
            playerNum: 2,
          })
        );
        broadcastToRoom(room.roomId, {
          type: 'player2_joined',
          message: '对手已加入，准备开始',
        });
        return;
      }

      if (type === 'start') {
        const room = rooms.get(ws.roomId);
        if (!room || ws.playerNum !== 1) return;
        if (room.gameState !== 'waiting') return;
        room.gameState = 'playing';
        room.envelopes = [spawnEnvelope()];
        room.score1 = 0;
        room.score2 = 0;
        room.timeLeft = GAME_DURATION;
        room.basket1X = GAME_WIDTH / 4 - BASKET_WIDTH / 2;
        room.basket2X = (GAME_WIDTH * 3) / 4 - BASKET_WIDTH / 2;
        runGameLoop(room.roomId);
        broadcastToRoom(room.roomId, {
          type: 'game_started',
          gameState: 'playing',
        });
        return;
      }

      if (type === 'basket') {
        const room = rooms.get(ws.roomId);
        if (!room || room.gameState !== 'playing') return;
        const { playerNum, x } = msg;
        if (playerNum === 1) {
          const max = GAME_WIDTH / 2 - BASKET_WIDTH;
          room.basket1X = Math.max(0, Math.min(max, x));
        } else if (playerNum === 2) {
          const min = GAME_WIDTH / 2;
          const max = GAME_WIDTH - BASKET_WIDTH;
          room.basket2X = Math.max(min, Math.min(max, x));
        }
        return;
      }

      if (type === 'restart') {
        const room = rooms.get(ws.roomId);
        if (!room || ws.playerNum !== 1) return;
        if (room.gameState !== 'ended') return;
        room.gameState = 'waiting';
        broadcastToRoom(room.roomId, {
          type: 'restart_request',
          message: '等待房主开始新局',
        });
        return;
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (ws.playerNum === 1) {
      room.player1 = null;
      if (room.player2) {
        room.player2.send(
          JSON.stringify({ type: 'player_left', message: '房主已离开' })
        );
      }
    } else {
      room.player2 = null;
      if (room.player1) {
        room.player1.send(
          JSON.stringify({ type: 'player_left', message: '对手已离开' })
        );
      }
    }

    if (!room.player1 && !room.player2) {
      if (room.gameLoopId) clearTimeout(room.gameLoopId);
      rooms.delete(roomId);
    }
  });
});
