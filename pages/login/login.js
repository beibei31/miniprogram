Page({
  data: {
    username: '',
          password: '',
      loading: false,
      useLocalAuth: true
    },

  onLoad() {
    // 检查是否已经登录
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      // 已登录，跳转到首页
      wx.reLaunch({
        url: '/pages/home/home'
      })
    }
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  onLogin() {
    const { username, password, useLocalAuth } = this.data
    
    if (!username.trim()) {
      wx.showToast({
        title: '请输入账号',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({ loading: true })

    if (useLocalAuth) {
      // 本地登录：生成本地令牌与用户信息
      const fakeToken = `local_${Date.now()}`
      const localUser = {
        id: 1,
        username: username.trim(),
        nickname: username.trim(),
        avatar: '/assets/tabbar/home.png',
        role: 'local'
      }

      wx.setStorageSync('token', fakeToken)
      wx.setStorageSync('userInfo', localUser)

      getApp().globalData.token = fakeToken
      getApp().globalData.userInfo = localUser

      wx.showToast({ title: '登录成功(本地)', icon: 'success', duration: 1000 })

      const setupCompleted = wx.getStorageSync('setupCompleted')
      if (setupCompleted) {
        wx.reLaunch({ url: '/pages/home/home' })
      } else {
        wx.navigateTo({ url: '/pages/terms/terms' })
      }

      this.setData({ loading: false })
      return
    }

    // 远程登录（保留可切换）
    const serverUrl = getApp().globalData.getServerUrl()
    wx.request({
      url: `${serverUrl}/api/login`,
      method: 'POST',
      data: {
        username: username.trim(),
        password: password
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const { token, userInfo } = res.data
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', userInfo)
          getApp().globalData.token = token
          getApp().globalData.userInfo = userInfo
          wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
          const setupCompleted = wx.getStorageSync('setupCompleted')
          if (setupCompleted) {
            wx.reLaunch({ url: '/pages/home/home' })
          } else {
            wx.navigateTo({ url: '/pages/terms/terms' })
          }
        } else {
          wx.showToast({ title: res.data.error || '登录失败', icon: 'none', duration: 3000 })
        }
      },
      fail: () => {
        wx.showToast({ title: '服务器连接失败', icon: 'none', duration: 3000 })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  onRegister() {
    wx.showToast({
      title: '注册功能开发中',
      icon: 'none',
      duration: 2000
    })
  }
}) 