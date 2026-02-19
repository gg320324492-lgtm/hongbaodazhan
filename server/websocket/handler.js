// WebSocket消息处理器
const Room = require('../game/Room');

class WebSocketHandler {
  constructor(rooms) {
    this.rooms = rooms;
  }

  handleMessage(ws, message, playerId) {
    try {
      const msg = JSON.parse(message.toString());
      
      switch (msg.type) {
        case 'create_room':
          this.handleCreateRoom(ws, playerId);
          break;
        case 'join_room':
          this.handleJoinRoom(ws, msg.roomId, playerId);
          break;
        case 'game_start':
          this.handleGameStart(ws, playerId);
          break;
        case 'player_move':
          this.handlePlayerMove(ws, msg, playerId);
          break;
        case 'player_shoot':
          this.handlePlayerShoot(ws, msg, playerId);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.warn('Unknown message type:', msg.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  }

  handleCreateRoom(ws, playerId) {
    const roomId = this.generateRoomCode();
    const room = new Room(roomId);
    const playerNum = room.addPlayer(ws, playerId);
    
    if (playerNum) {
      ws.roomId = roomId;
      ws.playerId = playerId;
      this.rooms.set(roomId, room);
      
      ws.send(JSON.stringify({
        type: 'room_created',
        roomId,
        playerId,
      }));
    }
  }

  handleJoinRoom(ws, roomId, playerId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      ws.send(JSON.stringify({
        type: 'room_not_found',
        message: 'Room not found',
      }));
      return;
    }

    if (room.isFull()) {
      ws.send(JSON.stringify({
        type: 'room_full',
        message: 'Room is full',
      }));
      return;
    }

    const playerNum = room.addPlayer(ws, playerId);
    if (playerNum) {
      ws.roomId = roomId;
      ws.playerId = playerId;
      
      ws.send(JSON.stringify({
        type: 'room_joined',
        roomId,
        playerId,
      }));

      // 通知另一个玩家
      room.broadcast({
        type: 'player_joined',
        playerId,
      }, playerId);
    }
  }

  handleGameStart(ws, playerId) {
    const room = this.rooms.get(ws.roomId);
    if (!room || !room.isFull()) return;

    // 房间满员后，房主或加入者均可发起开始
    const player = room.getPlayer(playerId);
    if (!player) return;

    if (room.startGame()) {
      // 发送游戏开始消息和初始游戏状态
      const gameState = room.getGameState();
      room.broadcast({
        type: 'game_started',
        gameState: gameState,
      });
    }
  }

  handlePlayerMove(ws, msg, playerId) {
    const room = this.rooms.get(ws.roomId);
    if (!room || room.gameState !== 'playing') return;

    // 更新玩家位置（使用引擎的 Map，getState 返回的是普通对象）
    const player = room.gameEngine.players.get(playerId);
    if (player) {
      player.x = msg.x;
      player.y = msg.y;
      player.angle = msg.angle;
    }

    // 广播给对手
    const opponent = room.getOpponent(playerId);
    if (opponent) {
      opponent.ws.send(JSON.stringify({
        type: 'game_state',
        gameState: room.getGameState(),
      }));
    }
  }

  handlePlayerShoot(ws, msg, playerId) {
    const room = this.rooms.get(ws.roomId);
    if (!room || room.gameState !== 'playing') return;

    const player = room.gameEngine.players.get(playerId);
    if (!player) return;

    // 创建子弹（直接操作引擎的 bullets）
    const bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: player.x,
      y: player.y,
      vx: Math.cos(msg.angle) * 8,
      vy: Math.sin(msg.angle) * 8,
      angle: msg.angle,
      speed: 8,
      damage: 10,
      ownerId: playerId,
      weaponType: msg.weaponType || 'laser',
      lifetime: 2000,
      maxLifetime: 2000,
    };

    room.gameEngine.bullets.push(bullet);

    // 广播子弹
    room.broadcast({
      type: 'game_state',
      gameState: room.getGameState(),
    });
  }

  handleDisconnect(ws) {
    if (!ws.roomId) return;

    const room = this.rooms.get(ws.roomId);
    if (!room) return;

    room.removePlayer(ws.playerId);

    // 通知另一个玩家
    room.broadcast({
      type: 'player_left',
      message: 'Opponent disconnected',
    });

    // 如果房间为空，删除房间
    if (room.isEmpty()) {
      this.rooms.delete(ws.roomId);
    }
  }

  generateRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}

module.exports = WebSocketHandler;
