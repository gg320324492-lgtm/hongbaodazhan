// 物理碰撞检测系统
import type { Vector2D } from '../../types/game';
import { distanceSquared } from '../utils/math';

/**
 * 圆形碰撞检测
 */
export function circleCollision(
  x1: number,
  y1: number,
  radius1: number,
  x2: number,
  y2: number,
  radius2: number
): boolean {
  const distSq = distanceSquared(x1, y1, x2, y2);
  const radiusSum = radius1 + radius2;
  return distSq <= radiusSum * radiusSum;
}

/**
 * 矩形碰撞检测
 */
export function rectCollision(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number
): boolean {
  return (
    x1 < x2 + width2 &&
    x1 + width1 > x2 &&
    y1 < y2 + height2 &&
    y1 + height1 > y2
  );
}

/**
 * 点是否在矩形内
 */
export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  width: number,
  height: number
): boolean {
  return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
}

/**
 * 点是否在圆形内
 */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const distSq = distanceSquared(px, py, cx, cy);
  return distSq <= radius * radius;
}

/**
 * 边界检测 - 限制点在矩形区域内
 */
export function clampToBounds(
  x: number,
  y: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Vector2D {
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/**
 * 边界反弹 - 当超出边界时反弹
 */
export function bounceOffBounds(
  x: number,
  y: number,
  vx: number,
  vy: number,
  radius: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { x: number; y: number; vx: number; vy: number } {
  let newX = x;
  let newY = y;
  let newVx = vx;
  let newVy = vy;

  if (x - radius <= minX || x + radius >= maxX) {
    newVx = -vx;
    newX = Math.max(minX + radius, Math.min(maxX - radius, x));
  }

  if (y - radius <= minY || y + radius >= maxY) {
    newVy = -vy;
    newY = Math.max(minY + radius, Math.min(maxY - radius, y));
  }

  return { x: newX, y: newY, vx: newVx, vy: newVy };
}
