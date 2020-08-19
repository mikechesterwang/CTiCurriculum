// miniprogram/pages/main/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    calendarHeighrRpx: 830,
    calendarWidthRpx: 100,
    timeBoundLeft: '08:00',
    timeBoundRight: '23:00',
    week: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    editPopupShow: false,
    courseName: '',
    courseNote: '',
    // weekday picker
    weekdayArr: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    weekdayIndex: 0,
    // time picker
    startTime: '08:00',
    endTime: '09:50',
    // pattern picker
    pattern: '单双周',
    // mode
    mode: 0,
    courseList: [],
    
    // calendar variabls
    timeLeft: 0,
    timeRight: 0
  },

  initData: function(){
    var lArr = this.data.timeBoundLeft.split(':')
    var rArr = this.data.timeBoundRight.split(':')
    this.data.timeLeft = Number(lArr[0]) * 60 + Number(lArr[1])
    this.data.timeRight = Number(rArr[0]) * 60 + Number(rArr[1])
  },

  saveCourse: function(){
    var that = this
    wx.lin.showToast({
      icon: 'loading',
      title: '保存中'
    })

    var data = {
      name: this.data.courseName,
      note: this.data.courseNote,
      weekday: this.data.weekdayIndex,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      pattern: this.data.pattern,
    }

    var mode = this.data.mode
  
    // check for validilty
    if(data.name === ''){
      wx.lin.hideToast()
      wx.lin.showToast({
        icon: 'warning',
        title: '请输入课程名',
        duration: 700
      })
      return
    }
    if(data.endTime <= data.startTime){
      wx.lin.hideToast()
      wx.lin.showToast({
        icon: 'warning',
        title: '时间格式有误',
        duration: 700
      })
      return
    }

    const db = wx.cloud.database()
    if(mode === 0){ // 添加
      db.collection('course')
      .add({
        data: data,
        success: res => {
          // 更新视图
          data._id = res._id
          var tmpList = that.data.courseList
          tmpList.push(data)
          that.setData({
            courseList: tmpList
          })
          // 关闭编辑弹窗
          that.setData({
            editPopupShow: false,
            courseName: '',
            courseNote: ''
          })
          wx.lin.hideToast()
          wx.lin.showToast({
            icon: 'success',
            title: '保存成功',
            duration: 1000
          })
        },
        fail: err => {
          console.log('【数据库】[course] 插入失败', err)
          wx.lin.hideToast()
          wx.lin.showToast({
            icon: 'error',
            title: '请检查网络',
            duration: 1000
          })
        }
      })
    }else{ // 编辑

    }
  },

  deleteCourse: function(){

  },

  onWeekdayPickerChange: function(e){
    this.setData({
      weekdayIndex: e.detail.value
    })
  },

  onCourseNameInput: function(e){
    this.data.courseName = e.detail.value
  },

  onCourseNoteInput: function(e){
    this.data.courseNote = e.detail.value
  },

  onStartTimeChange: function(e){
    this.setData({
      startTime: e.detail.value
    })
  },

  onEndTimeChange: function(e){
    this.setData({
      endTime: e.detail.value
    })
  },
  
  onPatternPickerChange: function(e){
    this.data.pattern = e.detail.value
  },

  editCourse: function(){
    this.setData({
      editPopupShow: true,
      mode: 1
    })
  },

  addCourse: function(){
    this.setData({
      editPopupShow: true,
      mode: 0
    })
  },

  clsoePopup: function(){
    this.setData({
      editPopupShow: false
    })
  },

  getPosition: function(e){
    var that = this
    var sArr = e.startTime.split(':')
    var eArr = e.endTime.split(':')
    var tl = Number(sArr[0]) * 60 + Number(sArr[1])
    var tr = Number(eArr[0]) * 60 + Number(eArr[1])
    e.height = (tr - tl) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeighrRpx
    e.top = (tl - that.data.timeLeft) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeighrRpx
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initData()
    var that = this
    const db = wx.cloud.database()
    db.collection('course')
      .get({
        success: res => {
          for(var i = 0; i < res.data.length; ++i){
            that.getPosition(res.data[i])
            // var sArr = res.data[i].startTime.split(':')
            // var eArr = res.data[i].endTime.split(':')
            // var tl = Number(sArr[0]) * 60 + Number(sArr[1])
            // var tr = Number(eArr[0]) * 60 + Number(eArr[1])
            // res.data[i].height = (tr - tl) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeighrRpx
            // res.data[i].top = (tl - that.data.timeLeft) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeighrRpx
          }
          console.log(res.data)
          that.setData({
            courseList: res.data
          })
        },
        fail: err =>{
          wx.lin.showToast({
            icon: 'error',
            title: '请检查网络连接'
          })
          console.log('【数据库】[course] 查询失败 ', err)
        }
      })
    
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})