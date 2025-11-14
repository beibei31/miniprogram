const jwt = require('jsonwebtoken')
const config = require('../config')

module.exports = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      ctx.status = 401
      ctx.body = { error: '缺少认证token' }
      return
    }
    
    const decoded = jwt.verify(token, config.jwt.secret)
    ctx.state.user = decoded
    
    await next()
  } catch (error) {
    console.error('认证失败:', error)
    ctx.status = 401
    ctx.body = { error: '认证失败' }
  }
} 