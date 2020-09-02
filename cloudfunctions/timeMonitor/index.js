// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const MAX_LIMIT = 100

const SYSTEM_TIMER_CYCLE_MINS = 5

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  var leftDate = new Date()
  leftDate.setMinutes(leftDate.getMinutes())
  leftDate.setSeconds(0)
  var rightDate = new Date()
  rightDate.setMinutes(rightDate.getMinutes() + SYSTEM_TIMER_CYCLE_MINS)
  rightDate.setSeconds(0)
  var tasks = []

  const countResult = await db.collection('reminder')
    .where({
      time: _.and(_.gte(leftDate), _.lt(rightDate))
    }).count()
  
  const total = countResult.total
  const batchTimes = Math.ceil(total / 100)
  for(var i = 0; i < batchTimes; ++i){
    const promise = db.collection('reminder')
      .where({
        time: _.and(_.gte(leftDate), _.lt(rightDate))
      }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  var rtn = await Promise.all(tasks)
  if(rtn.length !== 0){
    var res =  (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg
      }
    })
    var tmp = []
    for(var i = 0; i < res.data.length; ++i){
      // 发送消息
      tmp.push(await db.collection('test').add({data: {msg: 'trigged', time: new Date(), reminder: res.data[i].time}}))
    }
    return await Promise.all(tmp)
  }else{
    return await db.collection('test')
      .add({
        data: {
          msg: 'triggerd, but no reminder',
          time: new Date()
        }
      })
  }
}