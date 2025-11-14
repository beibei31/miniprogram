const Router = require('koa-router')
const authController = require('../controllers/auth')
const workoutController = require('../controllers/workout')
const authMiddleware = require('../middleware/auth')

const router = new Router()

// 根路径 - 显示服务器信息
router.get('/', async (ctx) => {
  ctx.body = {
    message: '运动小程序后端服务',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      login: 'POST /api/login',
      workout: {
        history: 'GET /api/workout/history',
        record: 'POST /api/workout/record'
      },
      stats: {
        today: 'GET /api/stats/today'
      }
    }
  }
})

// 登录相关（不需要认证）
router.post('/api/login', authController.login)

// 测试接口
router.get('/api/test', async (ctx) => {
  ctx.body = { message: '服务器运行正常！' }
})

// 运动相关接口（需要认证）
router.get('/api/workout/history', authMiddleware, workoutController.history)
router.post('/api/workout/record', authMiddleware, workoutController.record)
router.get('/api/stats/today', authMiddleware, workoutController.todayStats)

module.exports = router 