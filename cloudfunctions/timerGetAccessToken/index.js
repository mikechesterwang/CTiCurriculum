// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const appid = 'wx37e6019c40b8f614'
const se = 'e6247a8f62ee89090c4650a418ac4abe'
const db = cloud.database()
const rq = require('request-promise')

// 云函数入口函数
exports.main = async (event, context) => {
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