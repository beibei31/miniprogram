const mysql = require('mysql2/promise')
const config = require('./config')

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    return false
  }
}

module.exports = {
  async query(sql, params) {
    const [rows] = await pool.query(sql, params)
    return rows
  },
  
  // 获取连接（用于事务）
  async getConnection() {
    return await pool.getConnection()
  },

  // 测试连接
  testConnection,

  // 关闭连接池
  async close() {
    await pool.end()
    console.log('✅ 数据库连接池已关闭')
  }
} 