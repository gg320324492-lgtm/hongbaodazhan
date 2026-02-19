/**
 * WebSocket 双人弹幕射击游戏服务器
 * 运行: node server/game-server.js
 * 默认端口: 3001
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const WebSocketHandler = require('./websocket/handler');

const PORT = process.env.PORT || process.env.WS_PORT || 3001;
const rooms = new Map();

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      rooms: rooms.size,
      timestamp: Date.now(),
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// 创建WebSocket服务器
const wss = new WebSocketServer({ server });

// 创建消息处理器
const handler = new WebSocketHandler(rooms);

// 游戏循环（每16ms更新一次，约60fps）
let lastUpdate = Date.now();
setInterval(() => {
  const now = Date.now();
  const deltaTime = now - lastUpdate;
  lastUpdate = now;

  rooms.forEach(room => {
    if (room.gameState === 'playing') {
      const gameState = room.update(deltaTime);
      if (gameState) {
        // 定期广播游戏状态
        room.broadcast({
          type: 'game_state',
          gameState: room.getGameState(),
        });
      }
    }
  });
}, 16);

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  ws.playerId = playerId;
  ws.roomId = null;

  console.log(`[${new Date().toISOString()}] Player connected: ${playerId}`);

  ws.on('message', (data) => {
    handler.handleMessage(ws, data, playerId);
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Player disconnected: ${playerId}`);
    handler.handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] WebSocket error:`, error);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🎮 Cyber Battle WebSocket Server started on port ${PORT}`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
