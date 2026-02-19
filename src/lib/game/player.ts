// 玩家逻辑
import type { Player, WeaponType } from '../../types/game';
import { clampToBounds } from './physics';

export const DEFAULT_PLAYER_CONFIG = {
  maxHealth: 100,
  speed: 3,
  size: 20,
};

/**
 * 创建新玩家
 */
export function createPlayer(
  id: string,
  x: number,
  y: number,
  config = DEFAULT_PLAYER_CONFIG
): Player {
  return {
    id,
    x,
    y,
    angle: 0,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    speed: config.speed,
    shield: false,
    shieldTime: 0,
    weaponType: WeaponType.LASER,
    score: 0,
  };
}

/**
 * 更新玩家位置
 */
export function updatePlayerPosition(
  player: Player,
  deltaX: number,
  deltaY: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): void {
  const newX = player.x + deltaX * player.speed;
  const newY = player.y + deltaY * player.speed;
  
  const clamped = clampToBounds(
    newX,
    newY,
    bounds.minX,
    bounds.minY,
    bounds.maxX,
    bounds.maxY
  );
  
  player.x = clamped.x;
  player.y = clamped.y;
}

/**
 * 更新玩家角度（朝向鼠标/触摸点）
 */
export function updatePlayerAngle(player: Player, targetX: number, targetY: number): void {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  player.angle = Math.atan2(dy, dx);
}

/**
 * 玩家受到伤害
 */
export function damagePlayer(player: Player, damage: number): boolean {
  if (player.shield) {
    return false; // 护盾保护
  }
  
  player.health = Math.max(0, player.health - damage);
  return player.health <= 0;
}

/**
 * 恢复玩家血量
 */
export function healPlayer(player: Player, amount: number): void {
  player.health = Math.min(player.maxHealth, player.health + amount);
}

/**
 * 激活护盾
 */
export function activateShield(player: Player, duration: number): void {
  player.shield = true;
  player.shieldTime = duration;
}

/**
 * 更新护盾状态
 */
export function updateShield(player: Player, deltaTime: number): void {
  if (player.shield) {
    player.shieldTime -= deltaTime;
    if (player.shieldTime <= 0) {
      player.shield = false;
      player.shieldTime = 0;
    }
  }
}

/**
 * 切换武器
 */
export function changeWeapon(player: Player, weaponType: WeaponType): void {
  player.weaponType = weaponType;
}

/**
 * 增加分数
 */
export function addScore(player: Player, points: number): void {
  player.score += points;
}
