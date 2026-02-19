// 主菜单组件
'use client';

import { Button } from '../ui/Button';

interface MenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export default function Menu({ onCreateRoom, onJoinRoom }: MenuProps) {
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
            赛博大战
          </h1>
          <p className="text-cyan-400/70 font-mono text-sm uppercase tracking-widest">
            双人弹幕射击
          </p>
        </div>

        {/* 菜单按钮 */}
        <div className="flex flex-col gap-4 items-center">
          <Button
            variant="primary"
            onClick={onCreateRoom}
            className="w-full max-w-xs"
          >
            创建房间
          </Button>
          <Button
            variant="secondary"
            onClick={onJoinRoom}
            className="w-full max-w-xs"
          >
            加入房间
          </Button>
        </div>

        {/* 说明文字 */}
        <div className="mt-12 space-y-2 text-cyan-400/50 font-mono text-xs">
          <p>移动：鼠标 / 触摸</p>
          <p>射击：空格 / 点击</p>
        </div>
      </div>
    </div>
  );
}
