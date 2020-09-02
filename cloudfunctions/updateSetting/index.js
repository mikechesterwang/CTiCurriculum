// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const SYSTEM_TIMER_CYCLE_MINS = 5

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const transaction = await db.startTransaction()
  try{
    
    // 获取先前的设置
    var m = (await transaction.collection('setting').doc(event._id).get()).data
    
    // 更新设置
    await db.collection('setting')
    .doc(event._id)
    .update({
      data: {
        notificationOn: event.notificationOn,
        semesterMondays: event.semesterMondays,
        presetCollegeName: event.presetCollegeName,
        advanceMins: event.advanceMins
      }
    })

    var semesterPlanChanged = m.semesterMondays.length !== event.semesterMondays.length
    for(var i = 0, j = 0; i < m.semesterMondays.length && (!semesterPlanChanged); ++i, ++j){
      if(m.semesterMondays[i] !== event.semesterMondays[j])
        semesterPlanChanged = true
    }

    // 提醒已被打开，学期计划发生改变 || 先前关闭了提醒，提醒被重新打开
    if((event.notificationOn && semesterPlanChanged) ||((! m.notificationOn) && event.notificationOn)){
      // 删除先前的reminder
      await transaction.collection('reminder')
        .where({
          _openid: event._openid
        })
        .remove()

      // 获取用户设置
      var semesterMondays = event.semesterMondays
      var advanceMins = event.advanceMins + SYSTEM_TIMER_CYCLE_MINS

      // 获取用户所有课程
      var courses = (await transaction.collection('course').where({_openid: event._openid}).get()).data
      for(var j = 0; j < courses.length; ++j){
        var courseItem = courses[j]
        var now = new Date()
        var odd = courseItem.pattern === '单周'
        for(var i = 0; i < semesterMondays.length; ++i){
          if(courseItem.pattern !== '单双周' &&  (odd ^ ((i & 1) === 0)) ){ // 单双周判断
            continue
          }
          // 构造提醒时间
          var date = new Date(semesterMondays[i] + ' ' + courseItem.startTime)
          date.setMinutes(date.getMinutes() - advanceMins)
          date.setHours(date.getHours() - 8) // UTC + 8 -> UTC + 0
          date.setDate(date.getDate() + Number(courseItem.weekday)) // 周一 -> 周x
          // 若提醒时间已过，不加入数据库
          if(date - now < 0){
            continue
          }
          // 加入数据库
          await transaction.collection('reminder')
            .add({
              data: {
                courseId: courseItem._id,
                _openid: event._openid,
                time: date,
                data: {
                  title: '上课提醒',
                  content: courseItem.name + ' ' + courseItem.note
                }
              }
            })
        }
      }
    }else if(m.notificationOn && (! event.notificationOn)){ // 关闭提醒，删除所有reminder
      await transaction.collection('reminder')
        .where({
          _openid: event._openid
        })
        .remove()
    }

    // 提交事务
    await transaction.commit()
    return {
      success: true
    }

  }catch(err){
    transaction.rollback()
    console.error(err)
    return {
      success: false
    }
  }
}