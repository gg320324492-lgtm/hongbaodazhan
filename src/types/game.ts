// 游戏相关类型定义

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  shield: boolean;
  shieldTime: number;
  weaponType: WeaponType;
  score: number;
}

export enum WeaponType {
  LASER = 'laser',
  SHOTGUN = 'shotgun',
  MISSILE = 'missile',
  WAVE = 'wave',
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  damage: number;
  ownerId: string;
  weaponType: WeaponType;
  lifetime: number;
  maxLifetime: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  lifetime: number;
  maxLifetime: number;
}

export enum PowerUpType {
  HEALTH = 'health',
  WEAPON_UPGRADE = 'weapon_upgrade',
  SPEED_BOOST = 'speed_boost',
  SHIELD = 'shield',
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
  size: number;
}

export interface GameState {
  players: Map<string, Player>;
  bullets: Bullet[];
  powerUps: PowerUp[];
  particles: Particle[];
  gameTime: number;
  gameStatus: GameStatus;
  winner: string | null;
}

export enum GameStatus {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  ENDED = 'ended',
}

export interface GameConfig {
  width: number;
  height: number;
  playerSpeed: number;
  bulletSpeed: number;
  maxHealth: number;
  gameDuration: number;
  powerUpSpawnRate: number;
}
