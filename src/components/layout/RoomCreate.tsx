// 创建房间组件
'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RoomCreateProps {
  roomId: string | null;
  isConnecting: boolean;
  onCreateRoom: () => void;
  onBack: () => void;
}

export default function RoomCreate({ roomId, isConnecting, onCreateRoom, onBack }: RoomCreateProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black">
      <div className="bg-black/80 border-2 border-cyan-400 p-8 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(0,240,255,0.5)]">
        <h2 className="text-3xl font-bold font-mono text-cyan-400 mb-6 text-center uppercase tracking-wider">
          Create Room
        </h2>

        {!roomId ? (
          <div className="space-y-6">
            <p className="text-cyan-400/70 font-mono text-sm text-center">
              {isConnecting ? 'Connecting to server...' : 'Click below to create a new room'}
            </p>
            <Button
              variant="primary"
              onClick={onCreateRoom}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Create Room'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-cyan-400 font-mono text-sm uppercase tracking-wider mb-2 block">
                Room ID
              </label>
              <div className="flex gap-2">
                <Input
                  value={roomId}
                  readOnly
                  className="flex-1 font-mono text-lg text-center"
                />
                <Button
                  variant="secondary"
                  onClick={copyRoomId}
                  className="px-4"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <p className="text-cyan-400/70 font-mono text-xs text-center">
              Share this room ID with your opponent
            </p>
            <p className="text-pink-500/70 font-mono text-xs text-center animate-pulse">
              Waiting for opponent to join...
            </p>
          </div>
        )}

        <div className="mt-6">
          <Button variant="secondary" onClick={onBack} className="w-full">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
