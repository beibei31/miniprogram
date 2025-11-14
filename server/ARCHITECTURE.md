# 运动小程序架构说明

## 📊 整体数据流

### 方案1：硬件设备上传数据（推荐用于生产环境）

```
硬件设备 → 服务器API → 数据库 → 小程序前端获取 → 绘制轨迹
```

**详细流程：**

1. **硬件设备上传**
   - 设备通过 HTTP/WebSocket/MQTT 等方式上传运动数据到服务器
   - 数据包括：GPS坐标、时间戳、心率、步数等
   - 服务器接收并存储到数据库

2. **服务器存储**
   - 服务器接收数据后，通过 `POST /api/workout/record` 接口保存
   - 数据存储在 MySQL 数据库中（`workouts` 表）

3. **小程序获取数据**
   - 小程序通过 `GET /api/workout/history` 获取历史记录
   - 通过 `GET /api/stats/today` 获取今日统计

4. **前端绘制轨迹**
   - 小程序从服务器获取轨迹点数据（`trackPoints`）
   - 使用 `addPoint()` 方法将轨迹点添加到地图
   - 实时或历史轨迹展示

### 方案2：手机直接定位（当前默认模式）

```
手机GPS → 小程序直接获取位置 → 本地存储 → 上传服务器 → 绘制轨迹
```

**详细流程：**

1. **手机定位**
   - 小程序使用 `wx.getLocation()` 每秒获取一次位置
   - 直接调用 `addPoint(longitude, latitude)` 绘制轨迹

2. **本地计算**
   - 实时计算距离、卡路里、配速等
   - 数据存储在本地 `polyline` 中

3. **运动结束后上传**
   - 运动结束时，通过 `POST /api/workout/record` 上传完整数据
   - 包括轨迹点数组 `trackPoints`

## 🔧 数据库配置

### 连接本地数据库

在 `server/config/index.js` 中使用默认配置：
```javascript
db: {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'sport_miniprogram'
}
```

### 连接远程数据库服务器

**方式1：使用环境变量（推荐）**

在 `server/` 目录下创建 `.env` 文件：
```env
DB_HOST=10.195.115.205
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=sport_miniprogram
```

**方式2：直接修改 config/index.js**
```javascript
db: {
  host: '10.195.115.205',  // 远程数据库服务器IP
  port: 3306,
  user: 'your_username',
  password: 'your_password',
  database: 'sport_miniprogram'
}
```

## 📡 硬件设备接入方式

### WebSocket 方式（实时推送）

```javascript
// 在 workout.js 中
initWebSocket(deviceId) {
  const ws = new WebSocket(`wss://your-server.com/${deviceId}`)
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data)
    // 设备上传的数据格式：{ lng: 116.39, lat: 39.90, timestamp: ... }
    this.addPoint(data.lng, data.lat)
  }
}
```

**服务器端需要：**
- 接收设备上传的数据
- 通过 WebSocket 推送给对应的小程序客户端

### HTTP API 方式（轮询）

设备定期上传数据到服务器：
```
POST /api/device/data
{
  "deviceId": "xxx",
  "lng": 116.39,
  "lat": 39.90,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

小程序定期从服务器获取最新数据：
```
GET /api/workout/live?deviceId=xxx
```

### 蓝牙 BLE 方式（直连）

```javascript
// 设备直接连接手机蓝牙
initBluetooth(deviceId) {
  wx.onBLECharacteristicValueChange((res) => {
    // 解析蓝牙数据
    const buffer = new Uint8Array(res.value)
    const lng = new DataView(buffer.buffer).getFloat32(0, true)
    const lat = new DataView(buffer.buffer).getFloat32(4, true)
    this.addPoint(lng, lat)
  })
}
```

## 🎯 当前代码状态

### 已实现的功能

1. ✅ **手机直接定位** - 默认模式，无需设备
2. ✅ **轨迹绘制** - `addPoint()` 方法
3. ✅ **数据上传** - `POST /api/workout/record`
4. ✅ **历史记录** - `GET /api/workout/history`
5. ✅ **设备接入骨架** - WebSocket/BLE/UDP 示例代码

### 需要开发的功能

1. ⏳ **设备数据接收接口** - 服务器端接收设备上传的数据
2. ⏳ **WebSocket 推送服务** - 实时推送设备数据给小程序
3. ⏳ **设备绑定流程** - 完整的设备绑定和管理

## 📝 使用建议

### 开发阶段
- 使用手机直接定位模式（当前默认）
- 连接本地数据库进行测试

### 生产环境
- 硬件设备上传数据到服务器
- 连接远程数据库服务器
- 使用 WebSocket 实现实时数据推送

## 🔐 安全注意事项

1. **数据库连接** - 使用环境变量存储敏感信息
2. **API 认证** - 所有数据接口都需要 JWT token
3. **设备验证** - 设备上传数据时需要验证设备ID
4. **数据加密** - 敏感数据传输使用 HTTPS/WSS

