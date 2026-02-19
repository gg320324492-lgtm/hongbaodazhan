// 加入房间组件
'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RoomJoinProps {
  isConnecting: boolean;
  error: string | null;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export default function RoomJoin({ isConnecting, error, onJoinRoom, onBack }: RoomJoinProps) {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black">
      <div className="bg-black/80 border-2 border-pink-500 p-8 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(255,0,255,0.5)]">
        <h2 className="text-3xl font-bold font-mono text-pink-500 mb-6 text-center uppercase tracking-wider">
          Join Room
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Enter room ID"
            maxLength={8}
            disabled={isConnecting}
            className="text-center text-lg"
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500 p-3 text-red-400 font-mono text-sm">
              {error}
            </div>
          )}

          <Button
            variant="secondary"
            type="submit"
            disabled={!roomId.trim() || isConnecting}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Join Room'}
          </Button>
        </form>

        <div className="mt-6">
          <Button variant="secondary" onClick={onBack} className="w-full">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
