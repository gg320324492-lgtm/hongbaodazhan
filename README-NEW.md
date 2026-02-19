# Cyber Battle - 赛博朋克风格双人弹幕射击PK游戏

## 项目概述

这是一个完全重构的赛博朋克风格双人弹幕射击PK游戏，采用现代化架构和模块化设计。

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **后端**: Node.js, WebSocket (ws)
- **样式**: Tailwind CSS 4
- **渲染**: HTML5 Canvas API

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局（赛博朋克主题）
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式（赛博朋克主题）
├── components/             # React组件
│   ├── game/              # 游戏相关组件
│   │   └── GameCanvas.tsx        # 游戏画布（Canvas渲染）
│   ├── ui/                # UI组件
│   │   ├── Button.tsx           # 按钮组件
│   │   ├── Input.tsx             # 输入框
│   │   └── HUD.tsx               # 游戏HUD
│   └── layout/            # 布局组件
│       ├── Menu.tsx              # 主菜单
│       ├── RoomCreate.tsx        # 创建房间
│       └── RoomJoin.tsx          # 加入房间
├── lib/                   # 工具库
│   ├── game/             # 游戏逻辑
│   │   ├── engine.ts            # 游戏引擎核心
│   │   ├── physics.ts            # 物理碰撞检测
│   │   ├── player.ts             # 玩家逻辑
│   │   ├── bullet.ts             # 子弹逻辑
│   │   └── powerup.ts            # 道具逻辑
│   ├── websocket/        # WebSocket相关
│   │   ├── client.ts            # WebSocket客户端封装
│   │   └── messages.ts          # 消息类型定义
│   ├── utils/             # 工具函数
│   │   ├── math.ts               # 数学工具
│   │   └── animation.ts          # 动画工具
│   └── sound/             # 音效系统
│       └── SoundManager.ts       # 音效管理器
├── hooks/                 # React Hooks
│   ├── useGame.ts                # 游戏状态管理
│   └── useWebSocket.ts           # WebSocket连接
└── types/                 # TypeScript类型定义
    ├── game.ts                   # 游戏相关类型
    └── websocket.ts              # WebSocket消息类型

server/
├── game-server.js         # 主服务器文件
├── game/                  # 游戏逻辑模块
│   ├── Room.js            # 房间管理类
│   └── GameEngine.js      # 服务器端游戏引擎
└── websocket/             # WebSocket处理
    └── handler.js         # 消息处理器
```

## 游戏特性

### 核心玩法
- **双人实时对战**: 两名玩家在赛博朋克风格的太空场景中对战
- **弹幕射击系统**: 多种武器类型（激光、散弹、导弹、能量波）
- **道具系统**: 能量球、武器升级、速度提升、护盾
- **技能系统**: 护盾、加速、多重射击

### UI设计
- **赛博朋克风格**: 霓虹蓝、霓虹粉、霓虹绿配色
- **未来感UI**: 全息投影风格、扫描线效果、霓虹发光
- **响应式设计**: 完美适配桌面和移动设备

## 运行方式

### 1. 安装依赖

```bash
npm install
```

### 2. 启动前端开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 启动WebSocket游戏服务器

```bash
npm run game-server
```

默认监听 `ws://localhost:3001`

## 游戏操作

### 桌面端
- **移动**: 鼠标移动
- **射击**: 空格键或鼠标点击
- **瞄准**: 鼠标位置

### 移动端
- **移动**: 触摸/滑动屏幕
- **射击**: 点击屏幕
- **瞄准**: 触摸位置

## 部署

### 前端部署（Vercel）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 导入GitHub仓库
3. 在 **Environment Variables** 中添加：
   - `NEXT_PUBLIC_WS_URL`: `wss://your-websocket-server-url`
4. 部署

### WebSocket服务器部署（Render/Railway）

1. 登录 [Render](https://render.com) 或 [Railway](https://railway.app)
2. 创建新的Web Service
3. 连接GitHub仓库
4. 设置启动命令: `node server/game-server.js`
5. 部署

## 环境变量

- `NEXT_PUBLIC_WS_URL`: 生产环境WebSocket地址（如 `wss://game-server.onrender.com`）
- `PORT`: WebSocket服务器端口（默认3001）

## 开发说明

### 添加新武器类型

1. 在 `src/types/game.ts` 中添加武器类型到 `WeaponType` 枚举
2. 在 `src/lib/game/bullet.ts` 的 `WEAPON_CONFIG` 中添加配置
3. 在 `src/components/game/GameCanvas.tsx` 中添加渲染逻辑

### 添加新道具类型

1. 在 `src/types/game.ts` 中添加道具类型到 `PowerUpType` 枚举
2. 在 `src/lib/game/powerup.ts` 的 `POWERUP_CONFIG` 中添加配置
3. 在 `src/lib/game/engine.ts` 的 `applyPowerUp` 方法中添加效果逻辑

## 性能优化

- Canvas渲染优化：使用 `requestAnimationFrame` 实现60fps流畅渲染
- 网络优化：WebSocket消息压缩和节流
- 移动端优化：触摸事件优化、性能监控

## 许可证

MIT License
