let util = require('../../utils/util.js')
const app = getApp()
Page({
  data: {
    staticUrl: '',
    isEditing: false,
    word: []
  },

  onLoad: function (options) {
    this.setData({
      staticUrl: app.globalData.staticUrl
    })
    util.findWords((res) => {
      if (!res) {
        console.log("error");
        wx.showToast({
          title: '出错，请重试！',
          icon: 'none',
          duration: 1600
        })
        return false
      }
      if (!res.data.flag) {
        console.log("error");
        wx.showToast({
          title: '出错，请重试！',
          icon: 'none',
          duration: 1600
        })
        return false
      }
      if (res.data.data) {
        this.setData({
          word: res.data.data.words
        })
      }
    })
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: `我的单词本`
    })
  },
  startEdit: function (e) {
    if (this.data.isEditing) {
      this.setData({
        isEditing: false
      })
    } else {
      this.setData({
        isEditing: true
      })
      wx.showToast({
        title: '点击减号删除词条',
        icon: 'none',
        duration: 1600
      })
    }
  },
  deleteWord: function (e) {
    let that = this
    let chooseOne = e.currentTarget.dataset.idx
    console.log(chooseOne);
    wx.showModal({
      title: '删除确认',
      content: `确定要删除第${chooseOne + 1}个单词吗`,
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          let word = that.data.word
          word.splice(chooseOne, 1)
          util.updateWords(word, (result) => {
            console.log(result);
            if (!result || !result.data.flag) {
              console.log("err");
              wx.showToast({
                title: '出错，请重试！',
                icon: 'none',
                duration: 1600
              })
              return
            } else {
              that.setData({
                word: word
              })
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  }


})
