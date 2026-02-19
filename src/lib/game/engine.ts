// 游戏引擎核心
import type { GameState, GameConfig, Player, Bullet, PowerUp, Particle } from '../../types/game';
import { WeaponType, PowerUpType, GameStatus } from '../../types/game';
import { createPlayer, updatePlayerPosition, updatePlayerAngle, damagePlayer, updateShield } from './player';
import { updateBullet, isBulletExpired, isBulletOutOfBounds } from './bullet';
import { updatePowerUp, isPowerUpExpired } from './powerup';
import { circleCollision } from './physics';
import { random } from '../utils/math';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  playerSpeed: 3,
  bulletSpeed: 8,
  maxHealth: 100,
  gameDuration: 180000, // 3分钟
  powerUpSpawnRate: 0.001, // 每帧生成概率
};

export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private lastTime: number = 0;
  private frameId: number | null = null;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.state = {
      players: new Map(),
      bullets: [],
      powerUps: [],
      particles: [],
      gameTime: 0,
      gameStatus: GameStatus.WAITING,
      winner: null,
    };
  }

  /**
   * 初始化游戏
   */
  initialize(): void {
    this.state.gameStatus = GameStatus.WAITING;
    this.state.gameTime = 0;
    this.state.winner = null;
    this.state.players.clear();
    this.state.bullets = [];
    this.state.powerUps = [];
    this.state.particles = [];
  }

  /**
   * 添加玩家
   */
  addPlayer(id: string, x: number, y: number): void {
    const player = createPlayer(id, x, y, {
      maxHealth: this.config.maxHealth,
      speed: this.config.playerSpeed,
      size: 20,
    });
    this.state.players.set(id, player);
  }

  /**
   * 移除玩家
   */
  removePlayer(id: string): void {
    this.state.players.delete(id);
    // 移除该玩家的所有子弹
    this.state.bullets = this.state.bullets.filter(b => b.ownerId !== id);
  }

  /**
   * 开始游戏
   */
  startGame(): void {
    this.state.gameStatus = GameStatus.PLAYING;
    this.state.gameTime = 0;
    this.state.winner = null;
  }

  /**
   * 更新游戏状态
   */
  update(deltaTime: number): void {
    if (this.state.gameStatus !== GameStatus.PLAYING) {
      return;
    }

    this.state.gameTime += deltaTime;

    // 检查游戏是否结束
    if (this.state.gameTime >= this.config.gameDuration) {
      this.endGame();
      return;
    }

    // 更新玩家
    this.state.players.forEach(player => {
      updateShield(player, deltaTime);
    });

    // 更新子弹
    this.state.bullets.forEach(bullet => {
      updateBullet(bullet, deltaTime);
    });
    this.state.bullets = this.state.bullets.filter(
      bullet => !isBulletExpired(bullet) && 
      !isBulletOutOfBounds(bullet, {
        minX: 0,
        minY: 0,
        maxX: this.config.width,
        maxY: this.config.height,
      })
    );

    // 更新道具
    this.state.powerUps.forEach(powerUp => {
      updatePowerUp(powerUp, deltaTime);
    });
    this.state.powerUps = this.state.powerUps.filter(
      powerUp => !isPowerUpExpired(powerUp)
    );

    // 碰撞检测：子弹 vs 玩家
    this.checkBulletPlayerCollisions();

    // 碰撞检测：玩家 vs 道具
    this.checkPlayerPowerUpCollisions();

    // 随机生成道具
    if (Math.random() < this.config.powerUpSpawnRate) {
      this.spawnRandomPowerUp();
    }

    // 检查胜利条件
    this.checkWinCondition();
  }

  /**
   * 检查子弹与玩家的碰撞
   */
  private checkBulletPlayerCollisions(): void {
    const bulletsToRemove: string[] = [];

    this.state.bullets.forEach(bullet => {
      this.state.players.forEach(player => {
        // 不检测子弹与发射者的碰撞
        if (player.id === bullet.ownerId) {
          return;
        }

        const playerRadius = 20;
        const bulletRadius = 4;

        if (circleCollision(
          player.x,
          player.y,
          playerRadius,
          bullet.x,
          bullet.y,
          bulletRadius
        )) {
          // 玩家受到伤害
          const isDead = damagePlayer(player, bullet.damage);
          bulletsToRemove.push(bullet.id);

          // 创建伤害粒子效果
          this.createDamageParticles(bullet.x, bullet.y);

          if (isDead) {
            // 玩家死亡，给击杀者加分
            const killer = this.state.players.get(bullet.ownerId);
            if (killer) {
              killer.score += 100;
            }
          }
        }
      });
    });

    this.state.bullets = this.state.bullets.filter(
      b => !bulletsToRemove.includes(b.id)
    );
  }

  /**
   * 检查玩家与道具的碰撞
   */
  private checkPlayerPowerUpCollisions(): void {
    const powerUpsToRemove: string[] = [];

    this.state.powerUps.forEach(powerUp => {
      this.state.players.forEach(player => {
        const playerRadius = 20;
        const powerUpRadius = 15;

        if (circleCollision(
          player.x,
          player.y,
          playerRadius,
          powerUp.x,
          powerUp.y,
          powerUpRadius
        )) {
          this.applyPowerUp(player, powerUp.type);
          powerUpsToRemove.push(powerUp.id);
        }
      });
    });

    this.state.powerUps = this.state.powerUps.filter(
      p => !powerUpsToRemove.includes(p.id)
    );
  }

  /**
   * 应用道具效果
   */
  private applyPowerUp(player: Player, type: PowerUpType): void {
    switch (type) {
      case PowerUpType.HEALTH:
        player.health = Math.min(player.maxHealth, player.health + 50);
        break;
      case PowerUpType.WEAPON_UPGRADE:
        // 循环升级武器
        const weapons = Object.values(WeaponType);
        const currentIndex = weapons.indexOf(player.weaponType);
        player.weaponType = weapons[(currentIndex + 1) % weapons.length];
        break;
      case PowerUpType.SPEED_BOOST:
        player.speed *= 1.5;
        setTimeout(() => {
          player.speed /= 1.5;
        }, 10000);
        break;
      case PowerUpType.SHIELD:
        player.shield = true;
        player.shieldTime = 5000;
        break;
    }
  }

  /**
   * 生成随机道具
   */
  private spawnRandomPowerUp(): void {
    const x = random(50, this.config.width - 50);
    const y = random(50, this.config.height - 50);
    const id = `powerup_${Date.now()}_${Math.random()}`;
    
    // 随机选择道具类型
    const types = [PowerUpType.HEALTH, PowerUpType.WEAPON_UPGRADE, PowerUpType.SPEED_BOOST, PowerUpType.SHIELD];
    const type = types[Math.floor(random(0, types.length))];
    
    this.state.powerUps.push({
      id,
      x,
      y,
      type,
      lifetime: 10000,
      maxLifetime: 10000,
    });
  }

  /**
   * 创建伤害粒子效果
   */
  private createDamageParticles(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      this.state.particles.push({
        id: `particle_${Date.now()}_${i}`,
        x,
        y,
        vx: random(-2, 2),
        vy: random(-2, 2),
        lifetime: 500,
        maxLifetime: 500,
        color: '#FF0000',
        size: random(2, 5),
      });
    }
  }

  /**
   * 检查胜利条件
   */
  private checkWinCondition(): void {
    // 游戏刚开始时（时间很短），不检查胜利条件
    if (this.state.gameTime < 1000) {
      return;
    }

    const alivePlayers = Array.from(this.state.players.values()).filter(
      p => p.health > 0
    );

    // 至少需要2个玩家才开始检查
    if (this.state.players.size < 2) {
      return;
    }

    if (alivePlayers.length === 1) {
      this.state.winner = alivePlayers[0].id;
      this.endGame();
    } else if (alivePlayers.length === 0) {
      // 平局
      this.endGame();
    }
  }

  /**
   * 结束游戏
   */
  endGame(): void {
    this.state.gameStatus = GameStatus.ENDED;
    
    // 确定 winner（如果时间到了，选择分数最高的）
    if (!this.state.winner) {
      const players = Array.from(this.state.players.values());
      const sorted = players.sort((a, b) => b.score - a.score);
      this.state.winner = sorted[0]?.id || null;
    }
  }

  /**
   * 获取游戏状态
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * 获取配置
   */
  getConfig(): GameConfig {
    return { ...this.config };
  }
}
