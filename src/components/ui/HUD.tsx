// 游戏HUD组件
'use client';

import type { Player, GameState } from '../../types/game';
import { WeaponType } from '../../types/game';

interface HUDProps {
  player: Player | null;
  opponent: Player | null;
  gameState: GameState | null;
  timeLeft: number;
}

export default function HUD({ player, opponent, gameState, timeLeft }: HUDProps) {
  if (!player) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeaponName = (weapon: WeaponType) => {
    const names: Record<WeaponType, string> = {
      [WeaponType.LASER]: '激光',
      [WeaponType.SHOTGUN]: '散弹',
      [WeaponType.MISSILE]: '导弹',
      [WeaponType.WAVE]: '能量波',
    };
    return names[weapon];
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* 顶部HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* 玩家信息 */}
        <div className="bg-black/80 border-2 border-cyan-400 p-4 font-mono text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.5)]">
          <div className="text-xs mb-2">玩家 1</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-cyan-400/70 mb-1">血量</div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-3 bg-black border border-cyan-400/50 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                    style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{player.health}/{player.maxHealth}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-cyan-400/70 mb-1">得分</div>
              <div className="text-lg font-bold">{player.score}</div>
            </div>
            <div>
              <div className="text-xs text-cyan-400/70 mb-1">武器</div>
              <div className="text-sm font-bold">{getWeaponName(player.weaponType)}</div>
            </div>
            {player.shield && (
              <div className="text-yellow-400 animate-pulse">
                <div className="text-xs">护盾</div>
              </div>
            )}
          </div>
        </div>

        {/* 对手信息 */}
        {opponent && (
          <div className="bg-black/80 border-2 border-pink-500 p-4 font-mono text-pink-500 shadow-[0_0_20px_rgba(255,0,255,0.5)]">
          <div className="text-xs mb-2">玩家 2</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-pink-500/70 mb-1">血量</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-black border border-pink-500/50 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                      style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{opponent.health}/{opponent.maxHealth}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-pink-500/70 mb-1">得分</div>
                <div className="text-lg font-bold">{opponent.score}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 中央时间显示 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-black/90 border-2 border-cyan-400 px-6 py-3 font-mono text-cyan-400 text-2xl font-bold shadow-[0_0_30px_rgba(0,240,255,0.8)]">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/80 border border-cyan-400/50 px-4 py-2 font-mono text-xs text-cyan-400/70">
          空格：射击 | 鼠标：移动与瞄准
        </div>
      </div>
    </div>
  );
}
