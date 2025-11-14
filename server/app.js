const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const router = require('./routes')
const config = require('./config')
const db = require('./db')

console.log('🚀 正在启动运动小程序后端服务...')
console.log('📊 配置信息:', {
  port: config.port,
  db: config.db.host + ':' + config.db.database
})

const app = new Koa()

// 中间件
app.use(cors())
app.use(bodyParser())

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('服务器错误:', error)
    ctx.status = 500
    ctx.body = { error: '服务器内部错误' }
  }
})

// 路由
app.use(router.routes())
app.use(router.allowedMethods())

// 启动服务器
async function startServer() {
  try {
    // 先测试数据库连接
    const dbConnected = await db.testConnection()
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止')
      process.exit(1)
    }

    // 启动HTTP服务器
    const PORT = config.port
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ 运动小程序后端服务运行在端口 ${PORT}`)
      console.log(`🌐 服务地址: http://localhost:${PORT}`)
      console.log(`🌐 外部地址: http://10.197.88.94:${PORT}`)
      console.log(`📊 数据库配置: ${config.db.host}:${config.db.database}`)
      console.log(`🛑 按 Ctrl+C 停止服务器`)
    })

    // 优雅退出处理
    process.on('SIGINT', async () => {
      console.log('\n🛑 正在停止服务器...')
      
      // 关闭HTTP服务器
      server.close(async () => {
        console.log('✅ HTTP服务器已停止')
        
        // 关闭数据库连接池
        try {
          await db.close()
        } catch (error) {
          console.error('❌ 关闭数据库连接失败:', error.message)
        }
        
        console.log('✅ 服务器已完全停止')
        process.exit(0)
      })
      
      // 如果5秒内没有正常关闭，强制退出
      setTimeout(() => {
        console.log('⚠️  强制退出...')
        process.exit(1)
      }, 5000)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 收到终止信号，正在停止服务器...')
      server.close(async () => {
        console.log('✅ HTTP服务器已停止')
        try {
          await db.close()
        } catch (error) {
          console.error('❌ 关闭数据库连接失败:', error.message)
        }
        process.exit(0)
      })
    })

  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()