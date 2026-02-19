// WebSocket客户端封装
import type { WebSocketMessage, MessageType } from '../../types/websocket';

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type WebSocketErrorHandler = (error: Error) => void;
export type WebSocketCloseHandler = () => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<MessageType, WebSocketEventHandler[]> = new Map();
  private errorHandlers: WebSocketErrorHandler[] = [];
  private closeHandlers: WebSocketCloseHandler[] = [];
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * 连接到WebSocket服务器
   */
  connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      
      try {
        this.ws = new WebSocket(this.url);

        const connectTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('连接超时'));
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => handler(new Error('WebSocket连接错误')));
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.closeHandlers.forEach(handler => handler());
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect().catch(() => {
                // 重连失败，已在onerror中处理
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 注册消息处理器
   */
  on(type: MessageType, handler: WebSocketEventHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * 移除消息处理器
   */
  off(type: MessageType, handler: WebSocketEventHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 注册错误处理器
   */
  onError(handler: WebSocketErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * 注册关闭处理器
   */
  onClose(handler: WebSocketCloseHandler): void {
    this.closeHandlers.push(handler);
  }

  /**
   * 获取连接状态
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }
}

/**
 * 获取WebSocket URL
 */
export function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001';
  }
  
  // 优先使用环境变量配置的WebSocket地址
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // 如果是生产环境（HTTPS），使用WSS协议
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname;
  
  // 如果是localhost或127.0.0.1，使用本地WebSocket服务器
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return `${protocol}://${hostname}:3001`;
  }
  
  // 生产环境应该配置NEXT_PUBLIC_WS_URL
  console.warn('警告: 未配置 NEXT_PUBLIC_WS_URL 环境变量，WebSocket连接可能失败');
  return `${protocol}://${hostname}:3001`;
}
