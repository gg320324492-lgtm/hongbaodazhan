// 道具逻辑
import type { PowerUp, PowerUpType } from '../../types/game';
import { random } from '../utils/math';
import { PowerUpType as PowerUpTypeEnum } from '../../types/game';

export const POWERUP_CONFIG: Record<string, {
  lifetime: number;
  size: number;
  color: string;
  effect: string;
}> = {
  [PowerUpType.HEALTH]: {
    lifetime: 10000,
    size: 15,
    color: '#FF0000',
    effect: '恢复50HP',
  },
  [PowerUpType.WEAPON_UPGRADE]: {
    lifetime: 10000,
    size: 15,
    color: '#00F0FF',
    effect: '武器升级',
  },
  [PowerUpType.SPEED_BOOST]: {
    lifetime: 10000,
    size: 15,
    color: '#00FF41',
    effect: '速度提升',
  },
  [PowerUpType.SHIELD]: {
    lifetime: 10000,
    size: 15,
    color: '#FFD700',
    effect: '护盾',
  },
};

/**
 * 创建道具
 */
export function createPowerUp(
  id: string,
  x: number,
  y: number,
  type?: PowerUpType
): PowerUp {
  const types = Object.values(PowerUpTypeEnum);
  const powerUpType = type || (types[Math.floor(random(0, types.length))] as PowerUpType);
  const config = POWERUP_CONFIG[powerUpType];
  
  return {
    id,
    x,
    y,
    type: powerUpType,
    lifetime: config.lifetime,
    maxLifetime: config.lifetime,
  };
}

/**
 * 更新道具
 */
export function updatePowerUp(powerUp: PowerUp, deltaTime: number): void {
  powerUp.lifetime -= deltaTime;
}

/**
 * 检查道具是否过期
 */
export function isPowerUpExpired(powerUp: PowerUp): boolean {
  return powerUp.lifetime <= 0;
}
