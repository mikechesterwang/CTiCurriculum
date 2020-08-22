// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('course')
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
}