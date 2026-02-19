# 双人接红包 (hongbaodazhan)

双人接红包游戏，支持本地同屏对战与联网对战。

## 运行方式

需要同时运行两个进程：

### 1. 启动 Next.js 前端

```bash
npm run dev
```

访问 http://localhost:3000

### 2. 启动 WebSocket 游戏服务器（联网模式需要）

```bash
npm run game-server
```

默认监听 `ws://localhost:3001`

## 游戏模式

- **本地双人**：同一设备，左半屏控制左篮，右半屏控制右篮
- **联网对战**：两台设备，一人创建房间，另一人输入房间号加入

## 部署

- **WebSocket 服务器**：Render / Railway
- **前端**：Vercel

详见 [docs/DEPLOY.md](docs/DEPLOY.md)

## 环境变量

- `NEXT_PUBLIC_WS_URL`：生产环境 WebSocket 地址，如 `wss://game-ws-server-xxx.onrender.com`
