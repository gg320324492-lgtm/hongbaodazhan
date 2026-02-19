// WebSocket消息类型定义

export enum MessageType {
  // 房间相关
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_FULL = 'room_full',
  ROOM_NOT_FOUND = 'room_not_found',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  
  // 游戏相关
  GAME_START = 'game_start',
  GAME_STARTED = 'game_started',
  GAME_STATE = 'game_state',
  GAME_ENDED = 'game_ended',
  GAME_RESTART = 'game_restart',
  
  // 玩家操作
  PLAYER_MOVE = 'player_move',
  PLAYER_SHOOT = 'player_shoot',
  PLAYER_SKILL = 'player_skill',
  
  // 错误
  ERROR = 'error',
  
  // 心跳
  PING = 'ping',
  PONG = 'pong',
}

export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

export interface CreateRoomMessage extends BaseMessage {
  type: MessageType.CREATE_ROOM;
}

export interface JoinRoomMessage extends BaseMessage {
  type: MessageType.JOIN_ROOM;
  roomId: string;
}

export interface RoomCreatedMessage extends BaseMessage {
  type: MessageType.ROOM_CREATED;
  roomId: string;
  playerId: string;
}

export interface RoomJoinedMessage extends BaseMessage {
  type: MessageType.ROOM_JOINED;
  roomId: string;
  playerId: string;
}

export interface PlayerJoinedMessage extends BaseMessage {
  type: MessageType.PLAYER_JOINED;
  playerId: string;
}

export interface GameStartMessage extends BaseMessage {
  type: MessageType.GAME_START;
}

export interface GameStartedMessage extends BaseMessage {
  type: MessageType.GAME_STARTED;
}

export interface GameStateMessage extends BaseMessage {
  type: MessageType.GAME_STATE;
  gameState: any; // 将在game.ts中定义具体类型
}

export interface PlayerMoveMessage extends BaseMessage {
  type: MessageType.PLAYER_MOVE;
  x: number;
  y: number;
  angle: number;
}

export interface PlayerShootMessage extends BaseMessage {
  type: MessageType.PLAYER_SHOOT;
  angle: number;
  weaponType: string;
}

export interface PlayerSkillMessage extends BaseMessage {
  type: MessageType.PLAYER_SKILL;
  skillId: number;
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  message: string;
}

export type WebSocketMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | RoomCreatedMessage
  | RoomJoinedMessage
  | PlayerJoinedMessage
  | GameStartMessage
  | GameStartedMessage
  | GameStateMessage
  | PlayerMoveMessage
  | PlayerShootMessage
  | PlayerSkillMessage
  | ErrorMessage;
