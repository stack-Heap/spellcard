const app = getApp()
let unit = ''
let moduleName = ''

Page({
  data: {
    type: ''
  },

  onLoad: function (options) {
    console.log(options)
    this.setData({
      type: options.type
    })
    unit = options.unit
    moduleName = options.module
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: `背${this.data.type}`
    })
  },
  startExercise: function (e) {
    console.log(e)
    let exerciseType = e.currentTarget.dataset.type
    wx.navigateTo({
      url: '../exercise/exercise?type=' + this.data.type + '&exerciseType=' + exerciseType + '&unit=' + unit + '&module=' + moduleName
    })
  }

})
