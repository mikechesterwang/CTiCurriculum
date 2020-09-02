const rp = require('request-promise')
const sendMsg = async(token, param) => {
  return await rp({
    json: true,
    method: 'POST',
    uri: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + token,
    body: {
      touser: param.touser,
      template_id: param.templateId,
      page: param.page,
      data: param.data
    }
  }).then(res => {return true})
  .catch(err => { console.error(err); return false;})
}

module.exports = {
  sendMsg: sendMsg
}