App({
  globalData: {
    userInfo: null,
    token: null,
    // 服务器配置
    serverConfig: {
      // 设置为 true 使用本地服务器，false 使用远程服务器
      useLocal: true,
      // 本地服务器地址
      // - 开发者工具测试：使用 'http://localhost:3000'
      // - 真机测试：使用你的电脑IP地址，如 'http://10.197.88.94:3000'
      //   注意：真机和电脑必须在同一局域网
      localUrl: 'http://10.197.88.94:3000',
      // 远程服务器地址（生产环境）
      remoteUrl: 'http://10.195.115.205:3000'
    },
    // 获取当前服务器地址
    getServerUrl() {
      return this.serverConfig.useLocal 
        ? this.serverConfig.localUrl 
        : this.serverConfig.remoteUrl
    }
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  },

  onShow() {
    // 小程序显示时的逻辑
  },

  onHide() {
    // 小程序隐藏时的逻辑
  }
}) 