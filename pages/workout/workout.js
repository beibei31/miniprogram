Page({
  data: {
    workoutStatus: 'idle', // 'idle', 'working', 'paused'
    showCountdown: false,
    countdownNumber: 3,
    timerText: '00:00:00',
    currentStats: {
      distance: 0,
      calories: 0,
      pace: '0:00'
    },
    workoutHistory: [],
    startTime: null,
    pauseTime: null,
    totalPausedTime: 0,
    timerInterval: null,
    countdownInterval: null,
    latitude: 0,
    longitude: 0,
    polyline: [{
      points: [],
      color: "#1aad19",
      width: 2
    }],
    locationTimer: null,
    scale: 18,
    markers: [],
    circles: [],
    leavingMask: false, // 结束跳转遮罩
    // this.initMockData(); // 开发阶段使用模拟数据（已默认关闭）
  },

  onLoad() {
    this.loadWorkoutHistory();
    // this.initMockData(); // 开发阶段使用模拟数据（已默认关闭）
    // 初始化当前位置，避免地图初始为(0,0)显示整块蓝色
    wx.getSetting({
      success: (res) => {
        const hasAuth = res.authSetting['scope.userLocation'];
        if (hasAuth) {
          this.fetchLocationOnce();
        } else {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this.fetchLocationOnce(),
            fail: () => {
              wx.showModal({
                title: '需要位置权限',
                content: '用于定位并记录运动轨迹，请在设置中开启位置权限',
                confirmText: '去设置',
                success: (r) => {
                  if (r.confirm) {
                    wx.openSetting({
                      success: (s) => {
                        if (s.authSetting['scope.userLocation']) {
                          this.fetchLocationOnce();
                        }
                      }
                    })
                  }
                }
              })
            }
          })
        }
      }
    })
  },

  fetchLocationOnce() {
    wx.getLocation({
      type: 'gcj02',
      success: ({ latitude, longitude }) => {
        this.setData({ latitude, longitude, scale: 18 });
      }
    });
  },

  onShow() {
    this.loadWorkoutHistory();
  },

  // 通用数据入口（适配任何硬件协议）
  addPoint(longitude, latitude) {
    // 异常点过滤
    if (!this.isValidPoint(longitude, latitude)) {
      return;
    }

    // 距离过滤（0.5米内忽略）
    const lastPoint = this.data.polyline[0].points.slice(-1)[0];
    if (lastPoint && this.getDistance(longitude, latitude, lastPoint.longitude, lastPoint.latitude) < 0.5) {
      return;
    }

    const newPoints = [...this.data.polyline[0].points, { longitude, latitude }];
    const updates = {
      'polyline[0].points': newPoints,
      latitude,
      longitude,
      scale: 19
    };

    // 设置起点高亮圈（不依赖本地图标）
    if (newPoints.length === 1) {
      // 原半径8m，缩小为1/20 -> 0.4m（小到极致）。小程序最小可视半径受缩放影响，设置为1可见性更好
      updates.circles = [{ longitude, latitude, color: '#FFFFFF', fillColor: '#1aad19', radius: 1, strokeWidth: 2 }];
      // 初始化方向箭头（占位），后续在每次更新点时刷新位置与旋转
      updates.markers = [{ id: 99, longitude, latitude, width: 24, height: 24, iconPath: '/assets/tabbar/arrow.png', rotate: 0, anchor: {x:0.5,y:0.5} }];
    }

    // 更新方向箭头位置与朝向
    if ((updates.markers && updates.markers.length) || this.data.markers.length) {
      const markers = updates.markers && updates.markers.length ? updates.markers : this.data.markers;
      const arrow = markers.find(m => m.id === 99) || { id: 99, width: 24, height: 24, iconPath: '/assets/tabbar/arrow.png', anchor: {x:0.5,y:0.5} };
      arrow.longitude = longitude;
      arrow.latitude = latitude;
      // 计算与上一点的朝向角度
      if (lastPoint) {
        const deg = this.calcHeading(lastPoint.longitude, lastPoint.latitude, longitude, latitude);
        arrow.rotate = deg;
      }
      const others = markers.filter(m => m.id !== 99);
      updates.markers = [...others, arrow];
    }

    this.setData(updates);
  },

  // 验证点是否有效
  isValidPoint(lng, lat) {
    // 剔除无效点（0,0或超出中国范围）
    if (lng < 72 || lng > 138 || lat < 10 || lat > 54) {
      return false;
    }
    return true;
  },

  // 计算两点间距离（米）
  getDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // 计算朝向角度
  calcHeading(lng1, lat1, lng2, lat2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    return Math.atan2(y, x) * 180 / Math.PI;
  },

  // 开发阶段模拟数据生成器
  initMockData() {
    let mockCount = 0;
    this.mockTimer = setInterval(() => {
      if (this.data.isWorkingOut) {
        mockCount++;
        this.addPoint(
          (this.data.longitude || 116.390001) + Math.sin(mockCount * 0.1) * 0.0001, // 约十米级
          (this.data.latitude || 39.900001) + Math.cos(mockCount * 0.1) * 0.0001  // 约十米级
        );
      }
    }, 1000);
  },

  // WebSocket适配示例
  initWebSocket(deviceId) {
    const ws = new WebSocket(`wss://your-hardware-server.com/${deviceId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // 根据实际协议提取经纬度
      this.addPoint(data.lng, data.lat);
    };
    ws.onerror = (e) => {
      console.error('WebSocket连接错误:', e);
      wx.showToast({ title: '设备连接断开', icon: 'error' });
    };
    this.ws = ws;
  },

  // 蓝牙BLE适配示例
  initBluetooth(deviceId) {
    wx.onBLECharacteristicValueChange((res) => {
      const buffer = new Uint8Array(res.value);
      // 解析二进制协议（示例：前4字节经度，后4字节纬度）
      const lng = new DataView(buffer.buffer).getFloat32(0, true);
      const lat = new DataView(buffer.buffer).getFloat32(4, true);
      this.addPoint(lng, lat);
    });
  },

  // UDP适配示例
  initUDP(deviceId) {
    const udp = wx.createUDPSocket();
    udp.onMessage((res) => {
      const textDecoder = new TextDecoder();
      const str = textDecoder.decode(res.message);
      // 自定义文本协议解析（示例："LNG, LAT"）
      const [lng, lat] = str.split(',').map(Number);
      this.addPoint(lng, lat);
    });
    this.udp = udp;
  },

  async loadWorkoutHistory() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) return

      const serverUrl = getApp().globalData.getServerUrl()
      const res = await wx.request({
        url: `${serverUrl}/api/workout/history`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data) {
        this.setData({ workoutHistory: res.data })
      }
    } catch (error) {
      console.error('加载运动历史失败:', error)
    }
  },

  // 开始倒计时
  startCountdown() {
    this.setData({
      showCountdown: true,
      countdownNumber: 3
    })

    this.data.countdownInterval = setInterval(() => {
      const currentNumber = this.data.countdownNumber
      
      if (currentNumber > 1) {
        this.setData({
          countdownNumber: currentNumber - 1
        })
      } else {
        // 倒计时结束，开始运动
        clearInterval(this.data.countdownInterval)
        this.setData({
          showCountdown: false,
          countdownNumber: 3
        })
        this.actuallyStartWorkout()
      }
    }, 1000)
  },

  // 实际开始运动
  actuallyStartWorkout() {
    // 先刷新历史数据
    this.loadWorkoutHistory()
    
    this.setData({
      workoutStatus: 'working',
      startTime: new Date(),
      pauseTime: null,
      totalPausedTime: 0,
      timerText: '00:00:00',
      currentStats: {
        distance: 0,
        calories: 0,
        pace: '0:00'
      },
      polyline: [{ points: [], color: "#1aad19", width: 2 }],
      scale: 19
    })
    this.startTimer()
    this.startLocationTracking()
  },

  // 开始运动（触发倒计时）
  startWorkout() {
    this.startCountdown()
  },

  // 暂停运动
  pauseWorkout() {
    this.setData({
      workoutStatus: 'paused',
      pauseTime: new Date()
    })
    this.stopTimer()
    this.stopLocationTracking()
  },

  // 继续运动
  resumeWorkout() {
    const pauseTime = this.data.pauseTime
    if (pauseTime) {
      const pausedDuration = new Date() - pauseTime
      this.setData({
        workoutStatus: 'working',
        pauseTime: null,
        totalPausedTime: this.data.totalPausedTime + pausedDuration
      })
      this.startTimer()
      this.startLocationTracking()
    }
  },

  // 结束运动
  stopWorkout() {
    this.stopTimer()
    this.stopLocationTracking()

    // 截取结束瞬间的数据快照
    const snapshot = {
      timerText: this.data.timerText,
      currentStats: { ...this.data.currentStats }
    }

    // 先本地构造结算所需数据，保证结果页立即可用且与结束瞬间一致
    const workoutData = {
      duration: Math.floor((new Date() - this.data.startTime - this.data.totalPausedTime) / (1000 * 60)),
      distance: snapshot.currentStats.distance,
      calories: snapshot.currentStats.calories,
      pace: snapshot.currentStats.pace,
      startTime: this.data.startTime ? this.data.startTime.toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      trackPoints: (this.data.polyline[0] && this.data.polyline[0].points) ? this.data.polyline[0].points : [],
      timerText: snapshot.timerText
    }
    wx.setStorageSync('lastWorkoutData', workoutData)

    // 打开遮罩避免界面闪回
    this.setData({ leavingMask: true })

    // 异步上报服务器，不阻塞跳转
    this.saveWorkoutRecord()

    // 用 redirectTo 替换当前页，避免短暂回闪
    wx.redirectTo({
      url: '/pages/workout-result/workout-result',
      complete: () => {
        // 跳转完成后再重置状态
        this.setData({ workoutStatus: 'idle', leavingMask: false })
      }
    })
  },

  startTimer() {
    this.data.timerInterval = setInterval(() => {
      const now = new Date()
      const startTime = this.data.startTime
      const totalPausedTime = this.data.totalPausedTime
      const diff = now - startTime - totalPausedTime

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      
      this.setData({ timerText })

      this.updateStats(diff)
    }, 1000)
  },

  stopTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
      this.data.timerInterval = null
    }
  },

  updateStats(elapsedTime) {
    const minutes = elapsedTime / (1000 * 60)
    const distance = (minutes * 0.1).toFixed(2)
    const calories = Math.floor(minutes * 8)
    const pace = this.calculatePace(minutes, distance)

    this.setData({
      currentStats: {
        distance: parseFloat(distance),
        calories: calories,
        pace: pace
      }
    })
  },

  calculatePace(minutes, distance) {
    if (distance <= 0) return '0:00'
    const paceMinutes = minutes / distance
    const paceMin = Math.floor(paceMinutes)
    const paceSec = Math.floor((paceMinutes - paceMin) * 60)
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}`
  },

  startLocationTracking() {
    this.data.locationTimer = setInterval(() => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const { latitude, longitude } = res;
          this.setData({ latitude, longitude });
          this.addPoint(longitude, latitude);
        }
      })
    }, 1000);
  },

  stopLocationTracking() {
    if (this.data.locationTimer) {
      clearInterval(this.data.locationTimer);
      this.data.locationTimer = null;
    }
  },

  // 硬件绑定入口已移动到首页

  async saveWorkoutRecord() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) return

      const workoutData = {
        duration: Math.floor((new Date() - this.data.startTime - this.data.totalPausedTime) / (1000 * 60)),
        distance: this.data.currentStats.distance,
        calories: this.data.currentStats.calories,
        pace: this.data.currentStats.pace,
        startTime: this.data.startTime.toISOString(),
        endTime: new Date().toISOString(),
        trackPoints: this.data.polyline[0].points // 保存轨迹点
      }

      console.log('准备保存运动数据:', workoutData)

      const serverUrl = getApp().globalData.getServerUrl()
      const res = await wx.request({
        url: `${serverUrl}/api/workout/record`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: workoutData
      })

      if (res.data) {
        // 将运动数据存储到本地，供结算页面使用
        wx.setStorageSync('lastWorkoutData', workoutData)
        console.log('运动数据已保存到本地存储')
        this.loadWorkoutHistory()
      }
    } catch (error) {
      console.error('保存运动记录失败:', error)
      // 即使网络请求失败，也要保存数据到本地供结算页面使用
      const workoutData = {
        duration: Math.floor((new Date() - this.data.startTime - this.data.totalPausedTime) / (1000 * 60)),
        distance: this.data.currentStats.distance,
        calories: this.data.currentStats.calories,
        pace: this.data.currentStats.pace,
        startTime: this.data.startTime.toISOString(),
        endTime: new Date().toISOString(),
        trackPoints: this.data.polyline[0].points
      }
      wx.setStorageSync('lastWorkoutData', workoutData)
      console.log('网络失败，但数据已保存到本地存储')
      wx.showToast({
        title: '保存记录失败',
        icon: 'none'
      })
    }
  },

  onUnload() {
    if (this.mockTimer) clearInterval(this.mockTimer);
    if (this.ws) this.ws.close();
    if (this.udp) this.udp.close();
    if (this.data.countdownInterval) clearInterval(this.data.countdownInterval);
  }
}) 