const App = getApp()
const {
  api_url
} = require('../config')
const util = require('./util')
const Auth = require('./authorization')
const http = (params, showLoading = false) => {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({
        title: "加载中..."
      })
    }
    let method = params.method || 'GET'
    let timestamp = Date.now()
    let salt = util.getHttpSalt(timestamp)
    let header = {
      'content-type': 'application/json',
      'charset': 'utf-8',
      "timestamp": timestamp,
      'lfk': salt,
    }
    header.token = App.globalData.token || ''
    wx.promisify('request')({
      url: api_url + params.url,
      method: method,
      data: params.data,
      header: header,
      errorTip: '服务器开小差了~'
    }).then(response => {
      if (showLoading) {
        setTimeout(() => {
          wx.hideLoading()
        }, 600)
      }
      if (String(response.statusCode).startsWith('2') && response.data.errorCode === 0 && response.data.message === 'ok') {
        return resolve(response.data.response)
      } else {
        switch (parseInt(response.data.errorCode)) {
          case 403001:
            // 没有授权
            Auth.getUserInfo((result) => {
              if (!result.authorized) {
                wx.navigateTo({
                  url: '/pages/me/login'
                })
              } else {
                wx.showToast({
                  title: '网络开小差了，请重试',
                  icon: 'none'
                })
              }
            })
            break;
          case 403002:
            // 用户token过期
            Auth.refreashToken((result) => {
              wx.showToast({
                title: '网络开小差了，请重试',
                icon: 'none'
              })
            })
            break;
          case 403004:
            // 没有绑定手机号
            wx.navigateTo({
              url: '/pages/login/login'
            })
            break;
          default:
            wx.showToast({
              title: response.data.message || params.errorTip || '网络请求异常',
              icon: 'none',
              mask: true,
              duration: 1500
            });
            reject([response.data.errorCode, response.data.message].join(':'))
            break;
        }
      }
    })
  })
}

module.exports = {
  http
}