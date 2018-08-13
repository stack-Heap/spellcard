//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    staticUrl: "",
    unitName: "",
    moduleName: ""
  },

  onLoad: function (options) {
    console.log(options)
    let version = ''
    if (app.globalData.resourceVersion) {
      version = `?version=${app.globalData.resourceVersion}`
    }
    this.setData({
      unitName: options.unit,
      moduleName: options.module,
      staticUrl: app.globalData.staticUrl,
      version: version
    })
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: this.data.unitName
    })
  },
})