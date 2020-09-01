// miniprogram/pages/setting/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mode: 0,
    // page variables
    frameClass1: 'font',
    frameClass2: 'back',
    // setting content
    settingRecordId: '',
    presetCollegeName: '-1',
    presetCollegeImgUrl: '',
    notificationOn: false,
    semesterMondays: [],
    
    // pull setting variables
    pullSettingMaskShow: false,
    presetList: [],
    pullSettingViewX: 0,
    timeoutId: undefined,
    originX: 0,
    cardWidthRpx: 500,
    cardGapRpx: 50,
    blankPx: 500,
    pressed: false,
    reponsed: true,
    lastX: 0,
    lastK: 0,
    direction: -1
  },

  catchIgnore: function(){
    //ignore
    return
  },

  saveAll: function(){
    // check validity
    var weekDelta = 24 * 60 * 60 * 1000
    if(this.data.semesterMondays.length > 0){
      var ok = true
      var last = new Date(this.data.semesterMondays[0] + ' 00:00').getTime()
      for(var i = 1; i < this.data.semesterMondays.length && ok; ++i){
        var current = new Date(this.data.semesterMondays[i] + ' 00:00').getTime()
        var delta = current - last
        if((delta / weekDelta) % 7 !== 0){ // 相距不为7天
          ok = false
        }
        if(delta <= 0){ // 日期前后顺序不正确
          ok = false
        }
        last = current
      } 
      if( ! ok){
        wx.lin.showToast({
          icon: 'error',
          title: '时间前后不正确或周一间天数相差不为7的倍数',
          duration: 3000
        })
        return
      }
    }
    
    this.updateSetting()
  },

  updateSetting(){
    var that = this
    wx.lin.showToast({
      icon: 'loading',
      title: '保存中'
    })
    wx.cloud.callFunction({
      name: 'updateSetting',
      data: {
        _id: that.data.settingRecordId,
        notificationOn: that.data.notificationOn,
        semesterMondays: that.data.semesterMondays,
        presetCollegeName: that.data.presetCollegeName
      },
      success: res => {
        wx.lin.hideToast()
        wx.lin.showToast({
          icon: 'success',
          title: '保存成功',
          duration: 1000
        })
      },
      fail: err =>{
        console.log('【云函数】[updateSetting] 调用失败 ', err)
        wx.lin.hideToast()
        wx.lin.showToast({
          icon: 'warning',
          title: '请检查网络',
          duration: 1000
        })
      }
    })
  },

  switchMode: function(){
    var that = this
    if(this.data.mode === 0){
      that.setData({
        frameClass1: 'back'
      })
      setTimeout(() => {
        that.setData({
          mode: 1,
          frameClass2: 'front'
        })
      }, 500)
      
    }else{
      that.setData({
        frameClass2: 'back'
      })
      setTimeout(() => {
        that.setData({
          mode: 0,
          frameClass1: 'front'
        })
      }, 500)
    }
 
  },

  onMondaysChange: function(e){
    var tmp = 'semesterMondays[' + e.currentTarget.dataset.index + ']'
    this.setData({
      [tmp]: e.detail.value
    })
  },

  getSetting: function(e){
    var that = this
    var obj = this.data.presetList[e.currentTarget.dataset.index]
    this.setData({
      presetCollegeName: obj.name,
      presetCollegeImgUrl: obj.imgUrl,
      semesterMondays: obj.semesterMondays,
      pullSettingMaskShow: false
    }, () => {
      that.updateSetting()
      app.globalData.timeArr = obj.timeArr
      app.globalData.timeRange = obj.timeRange
      app.globalData.presetCollegeName = obj.name
      app.globalData.presetCollegeImgUrl = obj.imgUrl
      app.globalData.semesterMondays = obj.semesterMondays
    })
  },

  onCardSlideStart: function(e){
    this.data.pressed = true
    this.data.reponsed = false
    this.data.lastX = e.changedTouches[0].pageX
  },

  onCardSlideEnd: function(e){
    this.data.pressed = false
    this.data.direction = e.changedTouches[0].pageX - this.data.lastX > 0 ? -1 : 1
  },

  onCardChange: function(e){
    if(this.data.pressed)
      return
    if(this.data.timeoutId !== undefined){
      clearTimeout(this.data.timeoutId)
    }
    this.data.timeoutId = setTimeout(() => {
      this.onCardStop(e)
    },100)
  },

  saturate: function(num, left, right){
    return num < left ? left : (num > right ? right : num)
  },

  onCardStop(e){
    if(this.data.reponsed)
      return
    var x = e.detail.x
    var w = wx.getSystemInfoSync().windowWidth
    var d = (this.data.cardWidthRpx + 2 * this.data.cardGapRpx) / 750 * w
    var o = this.data.blankPx
    var k = Math.floor((-1 * x + w / 2 - o) / d)
    k = this.saturate(k, 0, this.data.presetList.length - 1)
    if(k === this.data.lastK){
      k += this.data.direction
      k = this.saturate(k, 0, this.data.presetList.length - 1)
    }
    this.setData({
      pullSettingViewX: this.data.originX - d * k
    })
    this.data.reponsed = true
    this.data.lastK = k
  },
  
  pullSetting: function(){
    var that = this
    const db = wx.cloud.database()
    var o = this.data.blankPx
    var w = wx.getSystemInfoSync().windowWidth
    var d = (this.data.cardGapRpx * 2 + this.data.cardWidthRpx) / 750 * w
    db.collection('preset')
      .get({
        success: res => {
          console.log(res.data)
          that.setData({
            presetList: res.data,
            presetViewWidthRpx: res.data.length * 600 + 2 * o * 750 / w,
            pullSettingMaskShow: true,
            pullSettingViewX: (w - d) / 2  - o, // 第一张卡片居中显示
            originX: (w - d) / 2  - o
          })
        },
        fail: err => {
          wx.lin.showToast({
            icon: 'warning',
            title: '请检查网络',
            duration: 1000
          })
          console.log('【数据库】[preset] 查询失败 ', err)
        }
      })
  },

  closePullSettingMask: function(){
    this.setData({
      pullSettingMaskShow: false
    })
  },

  formatTimeDigit: function(num){
    return num < 10 ? ('0' + num) : num
  },

  advancedAdd: function(){
    if(this.data.semesterMondays.length === 0){
      var date = new Date()
      this.setData({
        semesterMondays: [date.getFullYear() + '-' + this.formatTimeDigit(date.getMonth() + 1) + '-' + this.formatTimeDigit(date.getDate())]
      })
      return
    }
    var date = new Date(this.data.semesterMondays[this.data.semesterMondays.length - 1])
    date.setDate(date.getDate() + 7)
    var tmpList = this.data.semesterMondays
    tmpList.push(date.getFullYear() + '-' + this.formatTimeDigit(date.getMonth() + 1) + '-' + this.formatTimeDigit(date.getDate()))
    this.setData({
      semesterMondays: tmpList
    })
  },

  advancedDelteLast: function(){
    if(this.data.semesterMondays.length === 0)
      return
    var tmpList = this.data.semesterMondays
    tmpList.splice(this.data.semesterMondays.length - 1, 1)
    this.setData({
      semesterMondays: tmpList
    })
  },

  onLoad: function(e){
    this.setData({
      settingRecordId: app.globalData.settingRecordId,
      semesterMondays: app.globalData.semesterMondays,
      notificationOn: app.globalData.notificationOn,
      presetCollegeName: app.globalData.presetCollegeName,
      presetCollegeImgUrl: app.globalData.presetCollegeImgUrl
    })
  },

  onEnableNotificationChange: function(e){
    this.setData({
      notificationOn: e.detail.value
    })
    console.log((e.detail.value ? '开启' : '关闭') + '微信推送提醒')
  }
})