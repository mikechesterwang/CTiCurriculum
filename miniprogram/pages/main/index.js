// miniprogram/pages/main/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // constant
    DEFAULT_ZINDEX: 1,
    TOPPPEST_ZINDEX: 999,

    // variables
    calendarHeightRpx: 830,
    calendarWidthRpx: 100,
    calendarHeightPx: 0,
    timeBoundLeft: '08:00',
    timeBoundRight: '22:30',
    week: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    editPopupShow: false,
    editCoursePopupShow: false,
    // weekday picker
    weekdayArr: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    timeArr: ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节', '10-11节'],
    timeDetailArr: [['08:00', '09:50'], ['10:20', '12:10'], ['14:00', '15:50'], ['16:20', '18:10'], ['19:00', '20:50'], ['21:20', '10:10']],
    // course object variables
    index: 0,
    courseName: '',
    courseNote: '',
    startTime: '08:00',
    endTime: '09:50',
    pattern: '单双周',
    courseId: '',
    weekdayIndex: 0,
    // mode
    mode: 0,
    courseList: [],
    
    // calendar variabls
    timeLeft: 0,
    timeRight: 0,
    lineArr: [],

    // css variables
    addChoiceTopClass: 'add-choice-top-close',
    addButtonClass: 'add-choice-button-close',
    addChoiceClose: true,

    // move course variables
    movingOn: false,
    viLeft: 0,
    hiTop: 0,
    lastX: 0,
    lastY: 0,
    indication: '',
    fiveMinSlotPx: 0,
    oneDaySlotPx: '',
    numOneDaySlot: 0,
    numFiveMinSlot: 0,
    indicatorColor: 'red',

  },

  initData: function(){
    var lArr = this.data.timeBoundLeft.split(':')
    var rArr = this.data.timeBoundRight.split(':')
    this.data.timeLeft = Number(lArr[0]) * 60 + Number(lArr[1])
    this.data.timeRight = Number(rArr[0]) * 60 + Number(rArr[1])
    var tmpList = []
    for(var i = 0; i * 120 < this.data.timeRight - this.data.timeLeft; ++i){
      tmpList.push(i * 120 / (this.data.timeRight - this.data.timeLeft) * this.data.calendarHeightRpx)
    }
    this.setData({
      lineArr: tmpList
    })
    this.data.calendarHeightPx = this.data.calendarHeightRpx / 750 * wx.getSystemInfoSync().windowWidth
    this.data.fiveMinSlotPx = this.data.calendarHeightPx * 5 / (this.data.timeRight - this.data.timeLeft)
    this.data.oneDaySlotPx = this.data.calendarWidthRpx / 750 * wx.getSystemInfoSync().windowWidth
    console.log(this.data.oneDaySlotPx)
    console.log(this.data.fiveMinSlotPx)
  },

  saveCourse: function(){
    var that = this
  
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
      wx.lin.showToast({
        icon: 'warning',
        title: '请输入课程名',
        duration: 700
      })
      return
    }
    if(data.endTime <= data.startTime){
      wx.lin.showToast({
        icon: 'warning',
        title: '时间格式有误',
        duration: 700
      })
      return
    }

    const db = wx.cloud.database()
    if(mode === 0){ // 添加
      wx.lin.showToast({
        icon: 'loading',
        title: '保存中'
      })
      db.collection('course')
      .add({
        data: data,
        success: res => {
          // 更新视图
          data._id = res._id
          that.getPosition(data)
          var tmpList = that.data.courseList
          tmpList.push(data)
          that.setData({
            courseList: tmpList
          })
          // 碰撞检测
          that.collisionShift(tmpList.length - 1)
          // 关闭编辑弹窗
          that.setData({
            editPopupShow: false,
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
      data._id = this.data.courseId
      this.updateCourse(this.data.index, data)
    }

    this.setData({
      editCoursePopupShow: false,
      editPopupShow: false
    })
  },

  updateCourse: function(index, obj){
    var tmp = 'courseList[' + index + ']'
    this.getPosition(obj)
    this.setData({
      [tmp]: obj
    })
    this.collisionShift(index)
    wx.lin.showToast({
      icon: 'loading',
      title: '更新中'
    })
    wx.cloud.callFunction({
      name: 'updateCourse',
      data: obj,
      success: res => {
        wx.lin.hideToast()
        wx.lin.showToast({
          icon: 'success',
          title: '更新成功',
          duration: 1000
        })
        console.log('更新成功')
        console.log(obj)
      },
      fail: err => {
        wx.lin.hideToast()
        wx.lin.showToast({
          icon: 'warning',
          title: '请检查网络',
          duration: 1000
        })
        console.log('【云函数】[updateCourse] 调用失败 ', err)
      }
    })
  },

  bindSetting: function(){
    wx.navigateTo({
      url: '/pages/setting/index',
    })
  },

  bindAdd: function(){
    this.setData({
      addChoiceTopClass: this.data.addChoiceClose ? 'add-choice-top' :'add-choice-top-back',
      addButtonClass: this.data.addChoiceClose ? 'add-choice-button' : 'add-choice-button-close'
    })
    this.data.addChoiceClose = !this.data.addChoiceClose
  },

  deleteCourse: function(){
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定删除吗?',
      success: res => {
        if(res.confirm){
          wx.cloud.callFunction({
            name: 'deleteCourse',
            data: {
              _id: that.data.courseList[that.data.index]._id
            },
            success: res => {
              var tmpList = that.data.courseList
              tmpList.splice(that.data.index, 1)
              that.setData({
                courseList: tmpList,
                editPopupShow: false,
                editCoursePopupShow: false
              })
              wx.lin.showToast({
                icon: 'success',
                title: '删除成功',
                duration: 700
              })
            },
            fail: err => {
              wx.lin.showToast({
                icon: 'warning',
                title: '请检查网络',
                duration: 1000
              })
              console.log('【云函数】[deleteCourse] 调用失败 ', err)
            }
          })
        }
      }
    })
  },

  onCurriculumLongTap: function(e){
    console.log(e)
    console.log('-----------------')
  },

  mins2str: function(mins){
    var hrs = Math.floor(mins / 60)
    var mins = mins - hrs * 60
    return (hrs < 10 ? ('0' + hrs) : hrs) + ':' + (mins < 10 ? ('0' + mins) : mins)
  },

  num2week: function(num){
    if(num === 0)
      return '周一'
    if(num === 1)
      return '周二'
    if(num === 2)
      return '周三'
    if(num === 3)
      return '周四'
    if(num === 4)
      return '周五'
    if(num === 5)
      return '周六'
    else
      return '周日'
  },

  saturate: function(num, left, right){
    return num < left ? left : (num > right ? right : num)
  },

  moveCourseStart: function(e){
    var obj = this.data.courseList[e.currentTarget.dataset.index]
    this.data.lastX = e.changedTouches[0].pageX
    this.data.lastY = e.changedTouches[0].pageY
    this.data.numOneDaySlot = Math.floor(obj.x / this.data.oneDaySlotPx)
    this.data.numFiveMinSlot = Math.floor(obj.y / this.data.fiveMinSlotPx)
    var tmp = "courseList[" + e.currentTarget.dataset.index + '].zIndex'
    this.setData({
      movingOn: true,
      [tmp]: this.data.TOPPPEST_ZINDEX,
      viLeft: obj.x,
      hiTop: obj.y,
      indication: this.num2week(obj.weekday) + obj.startTime,
      indicatorColor: obj.pattern === '单双周' ? '#415F96' : obj.pattern === '单周' ? '#7F9648' : '#E39B8F'
    })
  },

  movingCourse: function(e){
    var currentX = e.changedTouches[0].pageX
    var currentY = e.changedTouches[0].pageY
    this.data.numOneDaySlot = Math.floor((this.data.viLeft + (currentX - this.data.lastX)) / this.data.oneDaySlotPx)
    this.data.numFiveMinSlot = Math.floor((this.data.hiTop + (currentY - this.data.lastY)) / this.data.fiveMinSlotPx)
    // saturation 
    this.data.numOneDaySlot = this.saturate(this.data.numOneDaySlot, 0, 6)
    this.data.numFiveMinSlot = this.saturate(this.data.numFiveMinSlot, 0, Math.floor((this.data.timeRight - this.data.timeLeft) / 5))
    //END OF ~ saturation
    this.setData({
      viLeft: this.data.viLeft + (currentX - this.data.lastX),
      hiTop: this.data.hiTop + (currentY - this.data.lastY),
      indication: this.num2week(this.data.numOneDaySlot) + this.mins2str(this.data.numFiveMinSlot * 5 + this.data.timeLeft)
    })
    this.data.lastX = currentX
    this.data.lastY = currentY
  },

  moveCourseStop: function(e){
    var index = e.currentTarget.dataset.index
    var obj = this.data.courseList[index]
    var fixedX = 'courseList[' + index + '].x'
    var fixedY = 'courseList[' + index + '].y'

    if(!this.data.movingOn){
      setTimeout(() => {
        this.setData({
          [fixedX]: obj.x,
          [fixedY]: obj.y
        })
      }, 1000)
      return
    }
      
    var tl = obj.startTime.split(':')
    var tr = obj.endTime.split(':')
    var deltaT = Number(tr[0] * 60) + Number(tr[1]) - Number(tl[0] * 60) - Number(tl[1])

    // obj.x = this.data.numOneDaySlot * this.data.oneDaySlotPx
    // obj.y = (this.data.numFiveMinSlot * 5) / (this.data.timeRight - this.data.timeLeft) * this.data.calendarHeightPx
    obj.startTime = this.mins2str(this.data.numFiveMinSlot * 5 + this.data.timeLeft)
    obj.endTime = this.mins2str(this.data.numFiveMinSlot * 5 + this.data.timeLeft + deltaT)
    obj.weekday = this.data.numOneDaySlot
    obj.zIndex = this.data.DEFAULT_ZINDEX

    this.updateCourse(index, obj)
    this.setData({
      movingOn: false,
    })
    this.moveToPosition(index, this.data.numFiveMinSlot, this.data.numOneDaySlot)
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

  onTimeSelectChange: function(e){
    this.setData({
      startTime: this.data.timeDetailArr[e.detail.value][0],
      endTime: this.data.timeDetailArr[e.detail.value][1]
    })
  },
  
  onPatternPickerChange: function(e){
    this.data.pattern = e.detail.value
  },

  editCourse: function(e){
    var obj = this.data.courseList[e.currentTarget.dataset.index]
    this.setData({
      editPopupShow: true,
      mode: 1,
      courseId: obj._id,
      courseName: obj.name,
      courseNote: obj.note,
      startTime: obj.startTime,
      endTime: obj.endTime,
      pattern: obj.pattern,
      weekdayIndex: obj.weekday,
      index: e.currentTarget.dataset.index
    })
  },

  addCourse: function(){
    this.setData({
      editCoursePopupShow: true,
      mode: 0,
      courseName: '',
      courseNote: '',
      startTime: '08:00',
      endTime: '09:50',
      pattern: '单双周',
      weekdayIndex: 0
    })
    this.bindAdd()
  },

  addEvent: function(){
    this.setData({
      editPopupShow: true,
      mode: 0,
      courseName: '',
      courseNote: '',
      startTime: '08:00',
      endTime: '09:50',
      pattern: '单双周',
      weekdayIndex: 0
    })
    this.bindAdd()
  },

  collisionShift: function(index){
    var obj = this.data.courseList[index]
    var x = obj.x
    var z = obj.zIndex
    // detect collision
    var noCollision = false
    var cnt = 0
    while(! noCollision){
      noCollision = true
      if(cnt ++ > 1000) // 死循环检测
        break
      for(var i = 0; i < this.data.courseList.length; ++i){
        var tmp = this.data.courseList[i]
        if(tmp.weekday !== obj.weekday)
          continue
        if(tmp.zIndex !== z)
          continue
        if(tmp.endTime < obj.startTime || tmp.startTime > obj.endTime)
          continue
        if(tmp.name === obj.name)
          continue
        noCollision = false
        z += 1
        x += 3
      }
    }
    var fixedX = 'courseList[' + index +'].x'
    var fixedZIndex = 'courseList[' + index + '].zIndex'
    this.setData({
      [fixedX]: x,
      [fixedZIndex]: z
    })
  },

  moveToPosition(index, numFiveMinSlot, numOneDaySlot){    
    var that = this
    var fixedX = 'courseList[' + index +'].x'
    var fixedY = 'courseList[' + index + '].y'
    this.setData({
      [fixedX]: numOneDaySlot * this.data.oneDaySlotPx,
      [fixedY]: (numFiveMinSlot * 5) / (this.data.timeRight - this.data.timeLeft) * this.data.calendarHeightPx,
    }, () => {
      that.collisionShift(index)
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
    e.height = (tr - tl) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeightRpx
    e.y = (tl - that.data.timeLeft) / (that.data.timeRight - that.data.timeLeft) * that.data.calendarHeightPx
    e.x = e.weekday * that.data.oneDaySlotPx
    e.zIndex = this.data.DEFAULT_ZINDEX
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
          }
          console.log(res.data)
          that.setData({
            courseList: res.data
          })
          for(var i = 0; i < res.data.length; ++i){
            that.collisionShift(i)
          }
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
})