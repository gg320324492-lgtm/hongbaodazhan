// WebSocket连接Hook
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, getWebSocketUrl } from '../lib/websocket/client';
import type { WebSocketMessage, MessageType } from '../types/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);
  const handlersRef = useRef<Map<MessageType, ((message: WebSocketMessage) => void)[]>>(new Map());

  useEffect(() => {
    const url = getWebSocketUrl();
    const client = new WebSocketClient(url);
    clientRef.current = client;

    client.onError((err) => {
      setError(err.message);
      setIsConnected(false);
    });

    client.onClose(() => {
      setIsConnected(false);
    });

    return () => {
      client.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    
    try {
      setError(null);
      await clientRef.current.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败');
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (clientRef.current && clientRef.current.isConnected) {
      clientRef.current.send(message);
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }, []);

  const on = useCallback((type: MessageType, handler: (message: WebSocketMessage) => void) => {
    if (!clientRef.current) return;
    
    clientRef.current.on(type, handler);
    
    // 保存handler以便清理
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, []);
    }
    handlersRef.current.get(type)!.push(handler);
  }, []);

  const off = useCallback((type: MessageType, handler: (message: WebSocketMessage) => void) => {
    if (!clientRef.current) return;
    clientRef.current.off(type, handler);
  }, []);

  // 清理handlers
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        handlersRef.current.forEach((handlers, type) => {
          handlers.forEach(handler => {
            clientRef.current?.off(type, handler);
          });
        });
        handlersRef.current.clear();
      }
    };
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
    on,
    off,
  };
}
