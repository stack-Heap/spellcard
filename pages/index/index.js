//index.js
//获取应用实例
const app = getApp()
const Dialog = require('../../zanui-weapp/dialog/dialog');

Page({
  data: {
    staticUrl: '',
    hasPurchased: false,
    unitStr: '',
    // 封面
    bookCover: '',
    list: []
  },
  kindToggle: function (e) {
    let that = this
    let id = e.currentTarget.id
    let list = that.data.list
    let lockedFlag = e.currentTarget.dataset.lockedFlag
    let index = e.currentTarget.dataset.index
    if (lockedFlag && index) {
      that.purchaseBook()
      return
    }
    for (let i = 0, len = list.length; i < len; ++i) {
      if (list[i].id == id) {
        list[i].open = !list[i].open
      } else {
        list[i].open = false
      }
    }
    that.setData({
      list: list
    });
  },
  onLoad: function (option) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    let that = this
    that.setData({
      staticUrl: app.globalData.staticUrl
    })
    // 获取二维码里参数书本号
    console.log(option);
    // let book = option.book || '1A'
    let book
    if (option.book) {
      // 扫码进入方式，将本次book号存入localstorage
      that.setBookId(option.book)
      book = option.book
    } else {
      // 从缓存中获得book
      book = that.getBookId() || '1A';
    }
    console.log(book);
    // 书本单元信息
    let unitStr = that.showUnitInfo(book)
    // 书本封面
    let bookCover = `${app.globalData.staticUrl}/book-cover/cover-${book}.jpg`
    that.setData({
      unitStr: unitStr,
      bookCover: bookCover
    })
    // 读取bookConfig获取书本module和unit信息，首页渲染数据
    let moduleUnitInfo = app.globalData.bookConfig
    app.globalData.book = book
    let list = []
    for (let i in moduleUnitInfo[book]) {
      let listItem = {
        id: i,
        open: false,
        pages: []
      }
      for (let j in moduleUnitInfo[book][i]) {
        listItem.pages.push(j)
      }
      list.push(listItem)
    }
    that.setData({
      list: list
    })
    if (app.globalData.userId) {
      that.judgePurchased(that, app.globalData.userId)
    } else {
      app.userInfoReadyCallback = result => {
        if (result) {
          let userId = result
          that.judgePurchased(that, userId)
        }
      }
    }
  },
  onReady: function () {
    console.log(`页面第一次渲染完成`);
  },
  navigateToWord: function (e) {
    wx.navigateTo({
      url: '/pages/word/word'
    })
  },
  purchaseBook: function () {
    let that = this
    wx.showModal({
      title: '解锁',
      content: '这是收费章节，点击确定支付解锁，限时3折',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          wx.request({
            url: app.globalData.servicesUrl + '/wechatpay', //仅为示例，并非真实的接口地址
            method: 'POST',
            data: {
              bookid: app.globalData.book,
              total_fee: app.globalData.total_fee,
              openid: app.globalData.openId,
              uid: app.globalData.userId
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success: function (res) {
              if (!res.data) {
                console.log(res);
                app.globalData.purchaseResult = 'unknow'
                wx.showToast({
                  title: '超时！请重试',
                  icon: 'none',
                  duration: 2000
                })
                return
              }
              if (!res.data.flag) {
                console.log(res.data.message);
                that.judgePurchased(that, app.globalData.userId)
                return
              }
              if (res.data.flag) {
                console.log(`订单号是：${res.data.data.order_id}`);
                let orderId = res.data.data.order_id
                app.globalData.purchaseResult = 'unknow'
                wx.requestPayment({
                  'timeStamp': res.data.data.timeStamp,
                  'nonceStr': res.data.data.nonceStr,
                  'package': res.data.data.package,
                  'signType': 'MD5',
                  'paySign': res.data.data.paySign,
                  'success': function (result1) {
                    wx.request({
                      url: app.globalData.servicesUrl + '/findOrderComplete', //仅为示例，并非真实的接口地址
                      data: {
                        order_id: orderId
                      },
                      method: 'POST',
                      header: {
                        'content-type': 'application/json' // 默认值
                      },
                      success: function (rs) {
                        if (!rs.data) {
                          console.log(rs.errMsg);
                          app.globalData.purchaseResult = 'unknow'
                          wx.showToast({
                            title: '超时！请重试',
                            icon: 'none',
                            duration: 2000
                          })
                          return
                        }
                        if (rs.data.flag) {
                          console.log(`----购买成功---`);
                          app.globalData.purchaseResult = true
                          that.setData({
                            hasPurchased: true
                          })
                        }
                      },
                      fail: function (rs) {
                        console.log(rs);
                        app.globalData.purchaseResult = 'unknow'
                        wx.showToast({
                          title: '超时！请重试',
                          icon: 'none',
                          duration: 2000
                        })
                      }
                    })
                  },
                  'fail': function (result1) {
                    wx.request({
                      url: app.globalData.servicesUrl + '/updateOrderFalse',
                      method: 'POST',
                      data: {
                        order_id: orderId
                      },
                      header: {
                        'content-type': 'application/json' // 默认值
                      },
                      success: function (res) {
                        console.log(res)
                      },
                      fail: function (res) {
                        console.log(res);
                      }
                    })
                  }
                })
              }
            },
            fail: function (res) {
              console.log(res);
              app.globalData.purchaseResult = 'unknow'
              wx.showToast({
                title: '超时！请重试',
                icon: 'none',
                duration: 2000
              })
            },
            complete: function () {

            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      },
      fail: function (res) {
        console.log(res)
      }
    })
  },
  onShow: function () {
    console.log(`show-----进入小程序`);
    console.log(app.globalData.purchaseResult);
    if (app.globalData.purchaseResult === 'unknow' && app.globalData.userId) {
      console.log(`再次发起请求判断是否购买`);
      // 不确定是否购买就再次请求是否购买
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      this.judgePurchased(this, app.globalData.userId)
    }
  },
  onHide: function () {

  },
  // 判断是否购买
  judgePurchased: function (that, userId) {
    wx.request({
      url: app.globalData.servicesUrl + '/findBooksRecordOne',
      method: 'POST',
      data: {
        uid: userId,
        bookid: app.globalData.book
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        console.log(`判断用户是否购买此书返回结果:`)
        console.log(res);
        if (!res.data) {
          console.log(res.errMsg);
          wx.showToast({
            title: '查询出错',
            icon: 'none',
            duration: 800
          })
          app.globalData.purchaseResult = 'unknow'
          return
        }
        if (!res.data.flag) {
          console.log(res.data.message);
          wx.showToast({
            title: '查询出错',
            icon: 'none',
            duration: 800
          })
          app.globalData.purchaseResult = 'unknow'
        } else {
          if (res.data.data) {
            console.log("该用户购买了此书");
            app.globalData.purchaseResult = true
            that.setData({
              hasPurchased: true
            })
          } else {
            console.log("该用户没有购买了此书");
            app.globalData.purchaseResult = false
          }
        }
      },
      fail: function (res) {
        app.globalData.purchaseResult = 'unknow'
        wx.showToast({
          title: '超时！请重试',
          icon: 'none',
          duration: 2000
        })
      },
      complete: function () {
        wx.hideLoading()
      }
    })
  },
  showUnitInfo: function (book) {
    // 获取第一个值
    let unitNumber = book.substring(0, 1)
    console.log(unitNumber);
    let unitValue = '一'
    if (unitNumber === '2') {
      unitValue = '二'
    }
    if (unitNumber === '3') {
      unitValue = '三'
    }
    if (unitNumber === '4') {
      unitValue = '四'
    }
    if (unitNumber === '5') {
      unitValue = '五'
    }
    if (unitNumber === '6') {
      unitValue = '六'
    }
    if (unitNumber === '7') {
      unitValue = '七'
    }
    if (unitNumber === '8') {
      unitValue = '八'
    }
    if (unitNumber === '9') {
      unitValue = '九'
    }
    // 获取第二个值
    let gradeNumber = book.substring(1, 2)
    let gradeValue = '一'
    if (gradeNumber === 'B') {
      gradeValue = '二'
    }
    return `${unitValue}年级第${gradeValue}学期`
  },
  setBookId: function (book) {
    try {
      wx.setStorageSync('book', book)
    } catch (e) {
      console.log(e);
    }
  },
  getBookId: function () {
    try {
      var value = wx.getStorageSync('book')
      if (value) {
        return value
      }
    } catch (e) {
      console.log(e);
      return null
    }
  },
  // 点击弹窗展示特色功能
  showFeatures: function () {
    Dialog({
      title: '特色功能',
      message: `*	读一读：词汇、词块和句子可以朗读、跟读并录音；情景对话可以角色扮演\r
*	背一背：每个单元包含词汇和词块的背默练习\r
*	测一测：每个Module增加词汇和词块的综合复习测试
`,
      selector: '#zan-dialog-test',
      buttons: [{
        text: '我知道啦',
        color: 'green',
        type: 'know'
      }]
    }).then((res) => {
      console.log(res);
    })
  }

})