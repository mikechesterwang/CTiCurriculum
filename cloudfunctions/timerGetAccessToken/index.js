// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const rq = require('request-promise')

// 云函数入口函数
exports.main = async (event, context) => {

  const db = cloud.database()
  const se = (await (db.collection('backend').doc('SECRET').get())).data.value
  const appid = (await (db.collection('backend').doc('APPID').get())).data.value

  try{
    var rtn = await rq({
      method: 'GET',
      uri: "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + se
    })
    rtn = JSON.parse(rtn)
    var update = await db.collection('backend').doc('ACCESS_TOKEN').update({
      data: {
        token: rtn.access_token
      }
    })
  }catch(e){
    console.error(e)
  }
}