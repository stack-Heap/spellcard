//app.js
const bookConfig = require("/utils/config.js")

App({
  onLaunch: function () {
    // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)
    let that = this
    let servicesUrl = that.globalData.servicesUrl
    that.globalData.bookConfig = bookConfig
    // 全局播放器
    that.globalData.globalAudioContext = wx.createInnerAudioContext()
    // 登录
    wx.login({
      success: res => {
        wx.getUserInfo({
          success: function (result) {
            // 发送 res.code 到后台换取 openId: null,, sessionKey, unionId
            wx.request({
              url: servicesUrl + '/login',
              data: {
                code: res.code,
                data: result
              },
              method: 'POST',
              header: {
                'content-type': 'application/json'
              },
              success: function (rs) {
                console.log(`小程序请求后台登陆返回结果：`);
                console.log(rs);
                if (!rs) {
                  console.log("err");
                  that.globalData.purchaseResult = 'unknow'
                  wx.showToast({
                    title: '超时！请重试',
                    icon: 'none',
                    duration: 2000
                  })
                  return
                }
                if (!rs.data.flag) {
                  console.log(rs.data.message);
                  that.globalData.purchaseResult = 'unknow'
                  wx.showToast({
                    title: '超时！请重试',
                    icon: 'none',
                    duration: 2000
                  })
                  return
                }
                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                that.globalData.userId = rs.data.data.uid
                that.globalData.openId = rs.data.data.encryptedData.openId
                if (that.userInfoReadyCallback) {
                  // 回调传递参数
                  console.log(`回调传递参数`);
                  that.userInfoReadyCallback(rs.data.data.uid)
                }
              },
              fail: function (rs) {
                console.log(rs);
                that.globalData.purchaseResult = 'unknow'
                wx.showToast({
                  title: '超时！请重试',
                  icon: 'none',
                  duration: 2000
                })
              },
            })
          },
          fail: function (result) {
            //这里的逻辑判断可能有人会好奇，为啥要有的加冒号，通过测试发现，开发工具上微信推送的消息是不带冒号的。而实际使用环境中微信推送的是带冒号的，所以就都写了。
            if (result.errMsg == 'getUserInfo:fail scope unauthorized' || result.errMsg == 'getUserInfo:fail auth deny' || result.errMsg == 'getUserInfo:fail:scope unauthorized' || result.errMsg == 'getUserInfo:fail:auth deny') {
              wx.navigateTo({
                url: '/pages/auth/auth?code=' + res.code
              })
            } else {
              console.log(result);
              that.globalData.purchaseResult = 'unknow'
              wx.showToast({
                title: '超时！请重试',
                icon: 'none',
                duration: 2000
              })
            }
          }
        })
      },
      fail: res => {
        console.log(res)
        that.globalData.purchaseResult = 'unknow'
        wx.showToast({
          title: '超时！请重试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  globalData: {
    // 书本价格,1分钱
    total_fee: 600,
    globalAudioContext: null,
    userInfo: null,
    bookConfig: null,
    book: '',
    userId: null,
    openId: null,
    purchaseResult: 'unknow',
    resourceVersion: null,
    servicesUrl: 'https://sj.tes-sys.com/spellcard_services',
    staticUrl: 'https://sj.tes-sys.com/web_resources/spell_card'
  }
})