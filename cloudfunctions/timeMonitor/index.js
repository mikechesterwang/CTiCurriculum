// 云函数入口文件
const cloud = require('wx-server-sdk')
const sendMsg = require('message.js')
const message = require('./message')

cloud.init()

const MAX_LIMIT = 100
const SYSTEM_TIMER_CYCLE_MINS = 5


// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  var token = (await db.collection('backend').doc('ACCESS_TOKEN').get()).data.token
  
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
    for(var i = 0; i < res.data.length; ++i){
      // 发送消息
      var date = new Date(res.data[i].time)
      date.setHours(date.getHours() + 8) // UTC + 0 -> UTC + 8
      var format = date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 ' 
        + (date.getHours() < 10 ? '0' : '') + date.getHours()
        + ':' 
        + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
      
        await message.sendMsg(token, {
          touser: res.data[i]._openid,
          page: '/pages/main/index',
          data: {
            date8: {
              value: format
            },
            thing9: {
              value: res.data[i].data.content
            }
          },
          templateId: '7KK1M6ELN3yTc408GfW8J2CDuL8GS7uz6LsToA38KMI'
        })
    }
    return {
      success: true
    }
  }else{
    console.log('triggered, but no reminder')
    return 'no reminder'
  }
}