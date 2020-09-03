// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const SYSTEM_TIMER_CYCLE_MINS = 5

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const transaction = await db.startTransaction()
  try{
    // 添加课程
    var addCourse = await transaction.collection('course')
      .add({
        data: {
          _openid: event._openid,
          name: event.name,
          note: event.note,
          weekday: event.weekday,
          startTime: event.startTime,
          endTime: event.endTime,
          pattern: event.pattern
        }
      })
    // 检查是否需要通知
    var m = await transaction.collection('setting')
      .where({
        _openid: event._openid
      })
      .get()
    if(m.data[0].notificationOn){ // 用户开启了通知
      // 获取学期时间表
      var semesterMondays = m.data[0].semesterMondays
      var advanceMins = m.data[0].advanceMins + SYSTEM_TIMER_CYCLE_MINS
      var now = new Date()
      var odd = event.pattern === '单周'
      for(var i = 0; i < semesterMondays.length; ++i){
        if(event.pattern !== '单双周' &&  (odd ^ ((i & 1) === 0)) ){ // 单双周判断
          continue
        }
        // 构造提醒时间
        var date = new Date(semesterMondays[i] + ' ' + event.startTime)
        date.setMinutes(date.getMinutes() - advanceMins)
        date.setHours(date.getHours() - 8) // UTC + 8 -> UTC + 0
        date.setDate(date.getDate() + Number(event.weekday)) // 周一 -> 周x
        // 若提醒时间已过，不加入数据库
        if(date - now < 0){
          continue
        }
        // 加入数据库
        await transaction.collection('reminder')
          .add({
            data: {
              courseId: addCourse._id,
              _openid: event._openid,
              time: date,
              data: {
                time: event.startTime,
                content: event.name + ' ' + event.note
              }
            }
          })
      }
    }
    addCourse.success = true
    addCourse.m = m.data[0]
    await transaction.commit()
    return addCourse
  }catch(e){
    console.log(e)
    await transaction.rollback()
    return {
      success: false
    }
  }
}