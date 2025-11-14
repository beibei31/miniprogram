Page({
  data: {
    userInfo: {},
    todayStats: {
      duration: 0,
      calories: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadTodayStats()
    this.loadUserProfile()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadTodayStats()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  loadUserProfile() {
    const profile = wx.getStorageSync('userProfile')
    const health = wx.getStorageSync('userHealth')
    const goals = wx.getStorageSync('userGoals')
    
    if (profile || health || goals) {
      this.setData({
        userProfile: profile,
        userHealth: health,
        userGoals: goals
      })
    }
  },

  async loadTodayStats() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) return

      const serverUrl = getApp().globalData.getServerUrl()
      const res = await wx.request({
        url: `${serverUrl}/api/stats/today`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data) {
        this.setData({ todayStats: res.data })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  goToMusic() {
    wx.switchTab({
      url: '/pages/music/music'
    })
  },

  goToWorkout() {
    wx.switchTab({
      url: '/pages/workout/workout'
    })
  },

  onScanDevice() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        const deviceId = res.result;
        wx.setStorageSync('deviceId', deviceId);
        wx.showToast({ title: '绑定成功：' + deviceId, icon: 'success' });
      },
      fail: () => wx.showToast({ title: '扫码失败', icon: 'none' })
    });
  },

  onInputDevice() {
    wx.showModal({
      title: '输入设备号',
      editable: true,
      placeholderText: '请输入设备号',
      success: (res) => {
        if (res.confirm && res.content) {
          const deviceId = res.content;
          wx.setStorageSync('deviceId', deviceId);
          wx.showToast({ title: '绑定成功：' + deviceId, icon: 'success' });
        }
      }
    });
  }
}) 