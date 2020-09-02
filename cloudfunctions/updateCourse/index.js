// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const SYSTEM_TIMER_CYCLE_MINS = 5

// 云函数入口函数
exports.main = async (event, context) => {
  const transaction = await db.startTransaction()
  try{
    // 获取先前的信息
    var m = await transaction.collection('course').doc(event._id).get()
    var isSameTime = (m.data.startTime === event.startTime) && (m.data.weekday === event.weekday) && (m.data.pattern === event.pattern)

    if(!isSameTime){ // 时间不一致，处理reminder
      // 拉取学期信息
      var setting = (await transaction.collection('setting')
        .where({
          _openid: event._openid
        })
        .get()).data[0]
      if(setting.notificationOn){ // 用户开启提醒，需要修改reminder

        // 删除原有reminder
        await transaction.collection('reminder')
          .where({
            courseId: event._id
          })
          .remove()

        // 添加新reminder
        var semesterMondays = setting.semesterMondays
        var advanceMins = setting.advanceMins + SYSTEM_TIMER_CYCLE_MINS
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
                courseId: event._id,
                _openid: event._openid,
                time: date,
                data: {
                  title: '上课提醒',
                  content: event.name + ' ' + event.note
                }
              }
            })
        }
      }
    }

    // 更新课程
    await transaction.collection('course')
      .doc(event._id)
      .update({
        data: {
          endTime: event.endTime,
          name: event.name,
          note: event.note,
          pattern: event.pattern,
          startTime: event.startTime,
          weekday: event.weekday
        }
      })
    
    // 提交事务
    await transaction.commit()
    return {
      success: true
    }

  }catch(e){
    console.error(e)
    transaction.rollback()
    return {
      success: false
    }
  }

}