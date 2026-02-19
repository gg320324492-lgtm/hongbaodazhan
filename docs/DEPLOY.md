# 双人接红包游戏 - 线上部署指南

按以下步骤部署后，即可实现联网对战。

---

## 前置准备

1. 将代码推送到 **GitHub** 仓库
2. 注册 [Vercel](https://vercel.com) 和 [Render](https://render.com)（或 [Railway](https://railway.app)）

---

## 步骤一：部署 WebSocket 游戏服务器

WebSocket 需常驻进程，推荐用 Render 或 Railway 部署。

### 方案 A：Render

1. 登录 [Render](https://render.com) → **New** → **Web Service**
2. 连接你的 GitHub 仓库
3. 配置：
   - **Name**: `game-ws-server`（或自定义）
   - **Region**: 选离用户近的节点
   - **Root Directory**: 留空（使用仓库根目录）
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/game-server.js`
4. **Create Web Service** 部署
5. 部署完成后，在 **Settings** → **Environment** 中无需额外变量（`PORT` 由 Render 自动注入）
6. 记下服务地址，例如：`https://game-ws-server-xxx.onrender.com`
   - WebSocket 地址为：`wss://game-ws-server-xxx.onrender.com`（将 `https` 改为 `wss`）

> 若仓库根目录有 `render.yaml`，Render 可能自动识别配置，按提示创建服务即可。

### 方案 B：Railway

1. 登录 [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. 选择你的仓库
3. Railway 会自动检测为 Node 项目；若未识别，在 **Settings** 中设置：
   - **Start Command**: `node server/game-server.js`
4. 部署完成后，在 **Settings** → **Networking** → **Generate Domain** 生成公网地址
5. 记下地址，例如：`https://xxx.up.railway.app`，WebSocket 为 `wss://xxx.up.railway.app`

---

## 步骤二：部署前端（Vercel）

1. 登录 [Vercel](https://vercel.com) → **Add New** → **Project**
2. 导入你的 GitHub 仓库
3. **Framework Preset**: Next.js（一般自动识别）
4. 在 **Environment Variables** 中添加：
   - **Name**: `NEXT_PUBLIC_WS_URL`
   - **Value**: `wss://你的游戏服务器地址`
     示例：`wss://game-ws-server-xxx.onrender.com` 或 `wss://xxx.up.railway.app`
5. 点击 **Deploy** 部署

---

## 步骤三：验证

1. 打开 Vercel 分配的前端地址（如 `https://xxx.vercel.app`）
2. 选择「联网对战」→ 创建房间 / 加入房间
3. 若两台设备能正常对局，则部署成功

---

## 注意事项

| 项目 | 说明 |
|------|------|
| **WSS 协议** | 线上必须用 `wss://`，不能 `ws://` |
| **Render 休眠** | 免费版闲置约 15 分钟后会休眠，首次请求可能较慢 |
| **跨域** | WebSocket 一般无跨域限制，正常可连 |
| **端口** | 云平台自动注入 `PORT`，无需手动配置 |
