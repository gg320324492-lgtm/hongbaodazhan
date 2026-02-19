// 主菜单组件
'use client';

import { Button } from '../ui/Button';

interface MenuProps {
  onLocalGame: () => void;
  onOnlineGame: () => void;
}

export default function Menu({ onLocalGame, onOnlineGame }: MenuProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      {/* 背景动画效果 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1),transparent_50%)] animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* 标题 */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 animate-pulse">
            CYBER BATTLE
          </h1>
          <p className="text-cyan-400/70 font-mono text-sm uppercase tracking-widest">
            Dual Player Shooter
          </p>
        </div>

        {/* 菜单按钮 */}
        <div className="flex flex-col gap-4 items-center">
          <Button
            variant="primary"
            onClick={onLocalGame}
            className="w-full max-w-xs"
          >
            Local Battle
          </Button>
          <Button
            variant="secondary"
            onClick={onOnlineGame}
            className="w-full max-w-xs"
          >
            Online Battle
          </Button>
        </div>

        {/* 说明文字 */}
        <div className="mt-12 space-y-2 text-cyan-400/50 font-mono text-xs">
          <p>Move: Mouse / Touch</p>
          <p>Shoot: Space / Click</p>
        </div>
      </div>
    </div>
  );
}
