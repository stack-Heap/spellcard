const app = getApp()
let type = ''
let unit = ''
let moduleName = ''
Page({
  data: {
    staticUrl: '',
    type: '',
    averageTime: '',
    totalNumber: 0,
    trueNumber: 0,
    resultScore: 0,
    userExerciseInfo: []
  },

  onLoad: function (options) {
    this.setData({
      staticUrl: app.globalData.staticUrl
    })
    console.log(options)
    type = options.type
    unit = options.unit
    moduleName = options.moduleName
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    let startTime = new Date(wx.getStorageSync('startTime'))
    let endTime = new Date(wx.getStorageSync('endTime'))
    let userExerciseInfo = wx.getStorageSync('userExerciseInfo')
    let totalNumber = userExerciseInfo.length
    let averageTime = ((parseInt(endTime - startTime) / 1000) / totalNumber).toFixed(1)
    let trueNumber = 0
    for (let i = 0; i < userExerciseInfo.length; i++) {
      const element = userExerciseInfo[i];
      if (element.result) {
        trueNumber++
      }
    }
    let resultScore = Math.round((trueNumber / totalNumber) * 100)
    console.log(resultScore);
    this.setData({
      averageTime: averageTime,
      totalNumber: totalNumber,
      trueNumber: trueNumber,
      resultScore: resultScore,
      userExerciseInfo: userExerciseInfo
    })
    wx.setNavigationBarTitle({
      title: `背${type}`
    })
  },
  reviewQuestion: function (e) {
    console.log(e);
    let number = e.currentTarget.dataset.number
    let exerciseType = e.currentTarget.dataset.exercisetype
    console.log(exerciseType);
    console.log(number);
    wx.navigateTo({
      url: `../review/review?allEnd=true&type=${type}&unit=${unit}&module=${moduleName}&number=${number}&exerciseType=${exerciseType}`
    })
  }


})
