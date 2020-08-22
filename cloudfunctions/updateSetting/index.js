// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  return await db.collection('setting')
    .doc(event._id)
    .update({
      data: {
        notificationOn: event.notificationOn,
        semesterMondays: event.semesterMondays,
        presetCollegeName: event.presetCollegeName
      }
    })
}