// 服务器端游戏引擎（简化版，主要逻辑在客户端）
const DEFAULT_GAME_CONFIG = {
  width: 800,
  height: 600,
  playerSpeed: 3,
  bulletSpeed: 8,
  maxHealth: 100,
  gameDuration: 180000,
  powerUpSpawnRate: 0.001,
};

class GameEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.players = new Map();
    this.bullets = [];
    this.powerUps = [];
    this.particles = [];
    this.gameTime = 0;
    this.gameStatus = 'waiting';
    this.winner = null;
  }

  initialize() {
    this.gameStatus = 'waiting';
    this.gameTime = 0;
    this.winner = null;
    this.players.clear();
    this.bullets = [];
    this.powerUps = [];
    this.particles = [];
  }

  addPlayer(id, x, y) {
    this.players.set(id, {
      id,
      x,
      y,
      angle: 0,
      health: this.config.maxHealth,
      maxHealth: this.config.maxHealth,
      speed: this.config.playerSpeed,
      shield: false,
      shieldTime: 0,
      weaponType: 'laser',
      score: 0,
    });
  }

  removePlayer(id) {
    this.players.delete(id);
    this.bullets = this.bullets.filter(b => b.ownerId !== id);
  }

  startGame() {
    this.gameStatus = 'playing';
    this.gameTime = 0;
    this.winner = null;
  }

  update(deltaTime) {
    if (this.gameStatus !== 'playing') return;

    this.gameTime += deltaTime;

    if (this.gameTime >= this.config.gameDuration) {
      this.endGame();
      return;
    }

    // 更新子弹
    this.bullets.forEach(bullet => {
      bullet.x += bullet.vx * (deltaTime / 16);
      bullet.y += bullet.vy * (deltaTime / 16);
      bullet.lifetime -= deltaTime;
    });
    this.bullets = this.bullets.filter(b => b.lifetime > 0);

    // 碰撞检测
    this.checkCollisions();
  }

  checkCollisions() {
    const bulletsToRemove = [];

    this.bullets.forEach(bullet => {
      this.players.forEach(player => {
        if (player.id === bullet.ownerId) return;

        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 25) {
          if (!player.shield) {
            player.health -= bullet.damage;
            if (player.health <= 0) {
              const killer = this.players.get(bullet.ownerId);
              if (killer) killer.score += 100;
            }
          }
          bulletsToRemove.push(bullet.id);
        }
      });
    });

    this.bullets = this.bullets.filter(b => !bulletsToRemove.includes(b.id));
  }

  endGame() {
    this.gameStatus = 'ended';
    const players = Array.from(this.players.values());
    const sorted = players.sort((a, b) => b.score - a.score);
    this.winner = sorted[0]?.id || null;
  }

  getState() {
    // Map 无法 JSON 序列化，需转为普通对象
    return {
      players: Object.fromEntries(this.players.entries()),
      bullets: this.bullets,
      powerUps: this.powerUps,
      particles: this.particles,
      gameTime: this.gameTime,
      gameStatus: this.gameStatus,
      winner: this.winner,
    };
  }
}

module.exports = { GameEngine, DEFAULT_GAME_CONFIG };
