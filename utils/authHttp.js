const App = getApp()
const { api_url } = require('../config')
const util = require('./util')
const authHttp = (params) => {
  return new Promise((resolve, reject) => {
    let method = params.method || 'GET'
    let timestamp = Date.now()
    let salt = util.getHttpSalt(timestamp)
    let header = {
      'content-type': 'application/json',
      'charset': 'utf-8',
      "timestamp": timestamp,
      'lfk': salt,
    }
    header.token = App.globalData.token
    wx.promisify('request')({
      url: api_url + params.url,
      method: method,
      data: params.data,
      header: header,
      errorTip: '服务器开小差了~'
    }).then(response => {
      wx.hideLoading()
      if (String(response.statusCode).startsWith('2') && response.data.errorCode === 0 && response.data.message === 'ok') {
        return resolve(response.data.response)
      } else {
        wx.showToast({
          title: response.data.message || params.errorTip || '网络请求异常',
          icon: 'none',
          mask: true,
          duration: 1500
        });
        reject([response.data.errorCode, response.data.message].join(':'))
      }
    })
  })
}

module.exports = { authHttp }