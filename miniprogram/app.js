//app.js
App({

  globalData: {
    // 用户设置
    timeArr: ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节', '10-11节'],
    timeRange: [['08:00', '09:50'], ['10:20', '12:10'], ['14:00', '15:50'], ['16:20', '18:10'], ['19:00', '20:50'], ['21:20', '22:10']],
    semesterMondays: [],
    presetCollegeName: '-1',
    settingRecordId: '',
    presetCollegeName: '-1',
    presetCollegeImgUrl: '',
    notificationOn: false,
    semesterMondays: [],
  },

  onLaunch: function () {
    
    var that = this

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }

    var that = this
    const db = wx.cloud.database()
    db.collection('setting')
      .get({
        success: res => {
          if(res.data.length === 0){ // 数据库中没有设置数据
            db.collection('setting')
              .add({
                data: {
                  semesterMondays: that.globalData.semesterMondays, 
                  notificationOn: that.globalData.notificationOn,
                  presetCollegeName: '-1'
                },
                success: res2 => {
                  that.globalData.settingRecordId = res2._id
                },
                fail: err2 => {
                  wx.lin.showToast({
                    icon: 'error',
                    title: '请检查网络',
                    duration: 1000,
                    complete: res => {
                      wx.navigateBack()
                    }
                  })
                  console.log('【数据库】[setting] 插入失败 ', err2)
                }
              })
          }else{ // 数据库中已有设置数据
            that.globalData.settingRecordId = res.data[0]._id,
            that.globalData.semesterMondays = res.data[0].semesterMondays,
            that.globalData.notificationOn = res.data[0].notificationOn,
            that.globalData.presetCollegeName = res.data[0].presetCollegeName

            if(res.data[0].presetCollegeName !== '-1'){
              db.collection('preset')
                .where({
                  name: res.data[0].presetCollegeName
                })
                .get({
                  success: res2 => {
                    if(res.data.length === 0){ // 没有此校名
                      that.globalData.presetCollegeName = '-1'
                    }else{ // 拉取学校配置
                      that.globalData.presetCollegeImgUrl = res2.data[0].imgUrl
                      that.globalData.timeArr = res2.data[0].timeArr
                      that.globalData.timeRange = res2.data[0].timeRange
                    }
                  },
                  fail: err =>{
                    wx.lin.showToast({
                      icon: 'warning',
                      title: '请检查网络',
                      duration: 1000
                    })
                    console.log('【数据库】[preset] 查询失败 ', err)
                  }
                })
            }
          }
          
        },
        fail: err => {
          wx.lin.showToast({
            icon: 'error',
            title: '请检查网络',
            duration: 1000,
            complete: res => {
              wx.navigateBack()
            }
          })
          console.log('【数据库】[setting] 查询失败 ', err)
        }
      })
  }
})
