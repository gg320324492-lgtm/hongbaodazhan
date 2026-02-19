// 房间管理类
const { GameEngine, DEFAULT_GAME_CONFIG } = require('./GameEngine');

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.player1 = null;
    this.player2 = null;
    this.gameEngine = new GameEngine(DEFAULT_GAME_CONFIG);
    this.gameState = 'waiting'; // waiting, playing, ended
    this.createdAt = Date.now();
  }

  addPlayer(ws, playerId) {
    if (!this.player1) {
      this.player1 = { ws, playerId };
      return 1;
    } else if (!this.player2) {
      this.player2 = { ws, playerId };
      return 2;
    }
    return null;
  }

  removePlayer(playerId) {
    if (this.player1 && this.player1.playerId === playerId) {
      this.player1 = null;
    } else if (this.player2 && this.player2.playerId === playerId) {
      this.player2 = null;
    }
  }

  isFull() {
    return this.player1 !== null && this.player2 !== null;
  }

  isEmpty() {
    return this.player1 === null && this.player2 === null;
  }

  getPlayer(playerId) {
    if (this.player1 && this.player1.playerId === playerId) return this.player1;
    if (this.player2 && this.player2.playerId === playerId) return this.player2;
    return null;
  }

  getOpponent(playerId) {
    if (this.player1 && this.player1.playerId === playerId) return this.player2;
    if (this.player2 && this.player2.playerId === playerId) return this.player1;
    return null;
  }

  broadcast(message, excludePlayerId = null) {
    const msg = JSON.stringify(message);
    if (this.player1 && this.player1.playerId !== excludePlayerId) {
      this.player1.ws.send(msg);
    }
    if (this.player2 && this.player2.playerId !== excludePlayerId) {
      this.player2.ws.send(msg);
    }
  }

  startGame() {
    if (this.gameState !== 'waiting' || !this.isFull()) {
      return false;
    }

    this.gameState = 'playing';
    this.gameEngine.initialize();
    
    // 添加玩家到游戏引擎
    this.gameEngine.addPlayer(this.player1.playerId, 100, 300);
    this.gameEngine.addPlayer(this.player2.playerId, 700, 300);
    
    this.gameEngine.startGame();
    return true;
  }

  update(deltaTime) {
    if (this.gameState === 'playing') {
      this.gameEngine.update(deltaTime);
      const state = this.gameEngine.getState();
      
      if (state.gameStatus === 'ended') {
        this.gameState = 'ended';
      }
      
      return state;
    }
    return null;
  }

  getGameState() {
    return this.gameEngine.getState();
  }
}

module.exports = Room;
