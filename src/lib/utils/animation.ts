// 动画工具函数

/**
 * 缓动函数 - Ease Out
 */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 缓动函数 - Ease In
 */
export function easeIn(t: number): number {
  return t * t * t;
}

/**
 * 缓动函数 - Ease In Out
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * 缓动函数 - Bounce Out
 */
export function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * 脉冲动画值
 */
export function pulse(t: number, frequency: number = 1): number {
  return (Math.sin(t * frequency * Math.PI * 2) + 1) / 2;
}

/**
 * 闪烁动画
 */
export function blink(t: number, frequency: number = 2): boolean {
  return Math.floor(t * frequency) % 2 === 0;
}
