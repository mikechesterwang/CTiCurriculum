// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const transaction = await db.startTransaction()
  try{
    // 删除课程
    await transaction.collection('course').doc(event._id).remove()

    // 查看用户是否开启了提醒
    const m = await transaction.collection('setting')
      .where({
        _openid: event._openid
      })
      .get()
    if(m.data[0].notificationOn){ // 删除对应reminder
      await transaction.collection('reminder')
        .where({
          courseId: event._id
        })
        .remove()
    }
    
    // 完成事务
    await transaction.commit()
    return {
      success: true
    }

  }catch(e){
    transaction.rollback()
    console.log(e)
    return {
      success: false
    }
  }
}