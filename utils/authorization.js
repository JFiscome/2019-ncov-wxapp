const App = getApp()
const { authHttp } = require('./authHttp')

const refreashToken = (callback) => {
  App.globalData.userInfo = null
  App.globalData.token = null
  App.globalData.uid = null
  getUserInfo((result) => {
    return callback(result)
  })
}

const getUserInfo = (callback) => {
  let userInfo = App.globalData.userInfo
  let token = App.globalData.token
  let uid = App.globalData.uid
  let type = App.globalData.type
  if (!userInfo || JSON.stringify(userInfo) == '{}') {
    // 判断用户是否授权
    __getUserAuthorizationAndServerToken(result => {
      App.globalData.userInfo = result.userInfo
      App.globalData.token = result.token
      App.globalData.isManager = result.type == 1 ? 1 : 0
      App.globalData.userInfo.openid = result.openid
      App.globalData.type = result.type
      return callback({
        userInfo: result.userInfo,
        token: result.token,
        authorized: result.authorized,
        uid: result.uid,
        type: result.type
      })
    })
  } else {
    return callback({ userInfo, token: token, authorized: true, uid: uid, type: type})
  }
}

function __getUserAuthorizationAndServerToken(callback) {
  wx.promisify('getSetting')().then(setRes => {
    if (setRes.authSetting['scope.userInfo']) {
      wx.promisify('login')().then(codeRes => {
        wx.promisify('getUserInfo')().then(infoRes => {
          //获取token
          authHttp({
            url: '/user/login',
            method: 'POST',
            data: { encryptedData: infoRes.encryptedData, iv: infoRes.iv, code: codeRes.code }
          }).then(result => {
            
            //__compareNickNameAndPhoneStatus(result.token)

            return callback({
              userInfo: infoRes.userInfo,
              token: result.token,
              authorized: true,
              uid: result.uid,
              type: result.type,
              openid: result.openid
            })
          })
        })
      })
    } else {
      return callback({
        userInfo: {},
        token: '',
        authorized: false,
        uid: 0
      })
    }
  })
}

module.exports = { refreashToken, getUserInfo }