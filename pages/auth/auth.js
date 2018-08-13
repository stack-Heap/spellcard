// pages/auth/auth.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    code: ''
  },
  bindGetUserInfo: function (result) {
    console.log(result);
    if (result.detail.encryptedData) {
      let that = this
      wx.request({
        url: app.globalData.servicesUrl + '/login',
        data: {
          code: that.data.code,
          data: result.detail
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
            wx.showToast({
              title: '网络连接错误，请重试！',
              icon: 'none',
              duration: 2000
            })
            return
          }
          if (!rs.data.flag) {
            console.log(rs.data.message);
            wx.showToast({
              title: '网络连接错误，请重试！',
              icon: 'none',
              duration: 2000
            })
            return
          }
          // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
          // 所以此处加入 callback 以防止这种情况
          app.globalData.userId = rs.data.data.uid
          app.globalData.openId = rs.data.data.encryptedData.openId
          if (app.userInfoReadyCallback) {
            // 回调传递参数
            console.log(`回调传递参数`);
            app.userInfoReadyCallback(rs.data.data.uid)
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
        },
      })
    } else{
      wx.showModal({
        title: '提示',
        content: '您取消了授权，可能会造成使用受限',
        showCancel: false,
        success:()=>{
          wx.navigateBack({
            delta: 1
          });
        }
      })
      return false
    }
    wx.navigateBack({
      delta: 1
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      code: options.code
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})