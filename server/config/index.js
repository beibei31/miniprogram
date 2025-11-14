require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3000,
  
  db: {
    // 数据库配置
    // 方式1：使用环境变量（推荐，用于连接远程数据库服务器）
    // 在 .env 文件中设置：DB_HOST=10.195.115.205 DB_USER=root DB_PASSWORD=xxx DB_NAME=sport_miniprogram
    // 方式2：使用默认值（本地数据库）
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'sport_miniprogram'
  },
  
  wx: {
    appid: process.env.WX_APPID || 'your_wechat_appid',
    secret: process.env.WX_SECRET || 'your_wechat_secret'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key'
  }
} 