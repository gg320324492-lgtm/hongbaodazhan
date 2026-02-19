// 子弹逻辑
import type { Bullet } from '../../types/game';
import { WeaponType } from '../../types/game';
import { angle, distance } from '../utils/math';

export const WEAPON_CONFIG: Record<WeaponType, {
  speed: number;
  damage: number;
  lifetime: number;
  size: number;
  color: string;
}> = {
  [WeaponType.LASER]: {
    speed: 8,
    damage: 10,
    lifetime: 2000,
    size: 4,
    color: '#00F0FF',
  },
  [WeaponType.SHOTGUN]: {
    speed: 6,
    damage: 15,
    lifetime: 1500,
    size: 6,
    color: '#FF00FF',
  },
  [WeaponType.MISSILE]: {
    speed: 5,
    damage: 25,
    lifetime: 3000,
    size: 8,
    color: '#00FF41',
  },
  [WeaponType.WAVE]: {
    speed: 4,
    damage: 20,
    lifetime: 2500,
    size: 10,
    color: '#FFD700',
  },
};

/**
 * 创建子弹
 */
export function createBullet(
  id: string,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  ownerId: string,
  weaponType: WeaponType = WeaponType.LASER
): Bullet {
  const config = WEAPON_CONFIG[weaponType];
  const bulletAngle = angle(x, y, targetX, targetY);
  
  return {
    id,
    x,
    y,
    vx: Math.cos(bulletAngle) * config.speed,
    vy: Math.sin(bulletAngle) * config.speed,
    angle: bulletAngle,
    speed: config.speed,
    damage: config.damage,
    ownerId,
    weaponType,
    lifetime: config.lifetime,
    maxLifetime: config.lifetime,
  };
}

/**
 * 创建散弹（多个子弹）
 */
export function createShotgunBullets(
  idPrefix: string,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  ownerId: string,
  count: number = 5
): Bullet[] {
  const bullets: Bullet[] = [];
  const baseAngle = angle(x, y, targetX, targetY);
  const spread = Math.PI / 6; // 30度扩散
  
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * (spread / (count - 1));
    const bulletAngle = baseAngle + offset;
    const config = WEAPON_CONFIG[WeaponType.SHOTGUN];
    
    bullets.push({
      id: `${idPrefix}_${i}`,
      x,
      y,
      vx: Math.cos(bulletAngle) * config.speed,
      vy: Math.sin(bulletAngle) * config.speed,
      angle: bulletAngle,
      speed: config.speed,
      damage: config.damage,
      ownerId,
      weaponType: WeaponType.SHOTGUN,
      lifetime: config.lifetime,
      maxLifetime: config.lifetime,
    });
  }
  
  return bullets;
}

/**
 * 更新子弹位置
 */
export function updateBullet(bullet: Bullet, deltaTime: number): void {
  bullet.x += bullet.vx * (deltaTime / 16);
  bullet.y += bullet.vy * (deltaTime / 16);
  bullet.lifetime -= deltaTime;
}

/**
 * 检查子弹是否过期
 */
export function isBulletExpired(bullet: Bullet): boolean {
  return bullet.lifetime <= 0;
}

/**
 * 检查子弹是否超出边界
 */
export function isBulletOutOfBounds(
  bullet: Bullet,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  return (
    bullet.x < bounds.minX ||
    bullet.x > bounds.maxX ||
    bullet.y < bounds.minY ||
    bullet.y > bounds.maxY
  );
}
