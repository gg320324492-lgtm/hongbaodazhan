// 游戏画布组件（Canvas渲染）
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GameState, Player, Bullet, PowerUp, Particle } from '../../types/game';
import { WEAPON_CONFIG } from '../../lib/game/bullet';
import { POWERUP_CONFIG } from '../../lib/game/powerup';

interface GameCanvasProps {
  width: number;
  height: number;
  gameState: GameState | null;
  localPlayerId: string | null;
  onPlayerMove?: (x: number, y: number, angle: number) => void;
  onPlayerShoot?: (angle: number, weaponType: string) => void;
}

export default function GameCanvas({
  width,
  height,
  gameState,
  localPlayerId,
  onPlayerMove,
  onPlayerShoot,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isShootingRef = useRef(false);
  const lastMoveTimeRef = useRef<number>(0);
  const MOVE_THROTTLE_MS = 50; // 每50ms最多发送一次移动消息

  // 渲染函数
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格背景（赛博朋克风格）
    drawGrid(ctx, width, height);

    // 绘制道具
    gameState.powerUps.forEach(powerUp => {
      drawPowerUp(ctx, powerUp);
    });

    // 绘制玩家
    gameState.players.forEach(player => {
      drawPlayer(ctx, player, player.id === localPlayerId);
    });

    // 绘制子弹
    gameState.bullets.forEach(bullet => {
      drawBullet(ctx, bullet);
    });

    // 绘制粒子效果
    gameState.particles.forEach(particle => {
      drawParticle(ctx, particle);
    });

    // 继续动画循环
    animationFrameRef.current = requestAnimationFrame(render);
  }, [gameState, width, height, localPlayerId]);

  // 绘制网格背景
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  // 绘制玩家
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean) => {
    const size = 20;
    
    // 绘制护盾
    if (player.shield) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, size + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 绘制玩家主体
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // 玩家颜色（本地玩家不同颜色）
    const color = isLocal ? '#00F0FF' : '#FF00FF';
    
    // 绘制玩家（三角形飞船）
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size / 2, -size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 发光效果
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.stroke();
    
    ctx.restore();

    // 绘制血量条
    const barWidth = 40;
    const barHeight = 4;
    const barX = player.x - barWidth / 2;
    const barY = player.y - size - 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00FF41' : healthPercent > 0.25 ? '#FFD700' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  };

  // 绘制子弹
  const drawBullet = (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
    const config = WEAPON_CONFIG[bullet.weaponType];
    
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);

    ctx.fillStyle = config.color;
    ctx.strokeStyle = config.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = config.color;
    
    ctx.beginPath();
    ctx.arc(0, 0, config.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  };

  // 绘制道具
  const drawPowerUp = (ctx: CanvasRenderingContext2D, powerUp: PowerUp) => {
    const config = POWERUP_CONFIG[powerUp.type];
    const alpha = powerUp.lifetime / powerUp.maxLifetime;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = config.color;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = config.color;
    
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, config.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  };

  // 绘制粒子
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = particle.lifetime / particle.maxLifetime;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // 处理鼠标/触摸移动
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current || !localPlayerId || !gameState) return;

    const now = Date.now();
    // 节流：限制移动消息发送频率
    if (now - lastMoveTimeRef.current < MOVE_THROTTLE_MS) {
      return;
    }
    lastMoveTimeRef.current = now;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const localPlayer = Array.from(gameState.players.values()).find(
      p => p.id === localPlayerId
    );
    
    // 如果本地玩家不存在，使用画布中心作为参考
    const baseX = localPlayer?.x ?? width / 2;
    const baseY = localPlayer?.y ?? height / 2;

    // 更新玩家角度
    const angle = Math.atan2(y - baseY, x - baseX);
    
    // 更新玩家位置（跟随鼠标，但有边界限制）
    const dx = x - baseX;
    const dy = y - baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50; // 最大跟随距离

    let newX = baseX;
    let newY = baseY;

    if (distance > maxDistance) {
      newX = baseX + (dx / distance) * maxDistance;
      newY = baseY + (dy / distance) * maxDistance;
    } else {
      newX = x;
      newY = y;
    }

    // 限制在画布内
    newX = Math.max(20, Math.min(width - 20, newX));
    newY = Math.max(20, Math.min(height - 20, newY));

    onPlayerMove?.(newX, newY, angle);
    lastMousePosRef.current = { x, y };
  }, [localPlayerId, gameState, width, height, onPlayerMove]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);

  // 处理射击
  const handleShoot = useCallback(() => {
    if (!localPlayerId || !gameState || !lastMousePosRef.current) return;

    const localPlayer = Array.from(gameState.players.values()).find(
      p => p.id === localPlayerId
    );
    if (!localPlayer) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = lastMousePosRef.current.x - rect.left;
    const y = lastMousePosRef.current.y - rect.top;
    const angle = Math.atan2(y - localPlayer.y, x - localPlayer.x);

    // 播放射击音效（使用Web Audio API生成简单音效）
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }

    onPlayerShoot?.(angle, localPlayer.weaponType);
  }, [localPlayerId, gameState, onPlayerShoot]);

  // 启动渲染循环
  useEffect(() => {
    if (gameState) {
      animationFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, render]);

  // 键盘和鼠标事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isShootingRef.current = true;
        handleShoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isShootingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleShoot]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
      onClick={handleShoot}
      style={{
        cursor: 'crosshair',
        touchAction: 'none',
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: '100vw',
        maxHeight: '100vh',
      }}
      className="w-full h-full"
    />
  );
}
