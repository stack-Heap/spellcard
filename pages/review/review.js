let util = require('../../utils/util.js')
const app = getApp()
let type = ''
let unit = ''
let moduleName = ''
let chooseItem = 0
let exerciseEndFlag = false
let clickNumber = 0
let userClickStr = ''
let startExerciseType = ''

Page({
  data: {
    staticUrl: '',
    exerciseType: '',
    wordList: '',
    currentNumber: 1,
    questionContent: '',
    answer: [],
    hasAnswerd: true,
    isPlaying: false,
    isExercising: true,
    isTrue: false,
    letterShow: [],
    clickWordArr: [],
    allEnd: false,
    trueAnswer: '',
    hasCollected: false
  },

  onLoad: function (options) {
    type = options.type
    unit = options.unit
    startExerciseType = options.exerciseType
    moduleName = options.module
    let number = options.number
    this.setData({
      exerciseType: options.exerciseType,
      staticUrl: app.globalData.staticUrl
    })
    let bookConfig = app.globalData.bookConfig
    let book = app.globalData.book
    let wordList = wx.getStorageSync("wordList")
    this.setData({
      wordList: wordList
    })
    util.findWords((res) => {
      if (!res) {
        console.log("error");
        return false
      }
      if (!res.data.flag) {
        console.log("error");
        return false
      }
      if (res.data.data) {
        let collectWordArr = res.data.data.words
        console.log(collectWordArr);
        let currentWord = wordList[number - 1]
        console.log(currentWord);
        for (let i = 0; i < collectWordArr.length; i++) {
          const element = collectWordArr[i];
          if (element["单词"] === currentWord["单词"]) {
            this.setData({
              hasCollected: true
            })
            break
          }
        }
      }
    })
    let userExerciseInfo = wx.getStorageSync("userExerciseInfo")
    if (options.exerciseType === '1' || options.exerciseType === '3') {
      let answer = userExerciseInfo[number - 1].answer
      let questionContent = userExerciseInfo[number - 1].questionContent
      this.setData({
        answer: answer,
        currentNumber: number,
        questionContent: questionContent
      })
    }
    if (options.exerciseType === '2' || options.exerciseType === '4') {
      let answer = userExerciseInfo[number - 1].answer
      let questionContent = userExerciseInfo[number - 1].questionContent
      let isTrue = userExerciseInfo[number - 1].isTrue
      let letterShow = userExerciseInfo[number - 1].letterShow
      let clickWordArr = userExerciseInfo[number - 1].clickWordArr
      let trueAnswer = userExerciseInfo[number - 1].trueAnswer
      this.setData({
        currentNumber: number,
        questionContent: questionContent,
        isTrue: isTrue,
        letterShow: letterShow,
        clickWordArr: clickWordArr,
        trueAnswer: trueAnswer
      })
    }
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: `背${type}`
    })
    if (this.data.exerciseType === '1' || this.data.exerciseType === '2') {
      this.playWordAudio()
    }
  },
  playWordAudio: function () {
    let globalAudioContext = app.globalData.globalAudioContext
    globalAudioContext.offEnded()
    globalAudioContext.onEnded((res) => {
      // 播放音频失败的回调
      console.log(`播放录音结束`)
      this.setData({
        isPlaying: false
      })
    })
    globalAudioContext.src = this.data.wordList[this.data.currentNumber - 1]["音频"]
    setTimeout(() => {
      globalAudioContext.play()
    }, 500);
    this.setData({
      isPlaying: true
    })
  },
  toggleCollect: function () {
    let word = this.data.wordList[this.data.currentNumber - 1]
    util.findWords((res) => {
      if (!res) {
        console.log(res)
        wx.showToast({
          title: '查询收藏数据出错',
          icon: 'none',
          duration: 1000
        })
        return
      }
      if (!res.data.flag) {
        console.log(res.data.message);
        wx.showToast({
          title: '查询收藏数据出错',
          icon: 'none',
          duration: 1000
        })
        return
      }
      // 收藏数据为空
      if (!res.data.data) {
        // 收藏
        if (!this.data.hasCollected) {
          let wordArr = [word]
          util.updateWords(wordArr, (result) => {
            console.log(result);
            if (result.data.flag) {
              wx.showToast({
                title: '收藏成功',
                icon: 'success',
                duration: 2000
              })
              this.setData({
                hasCollected: true
              })
            } else {
              wx.showToast({
                title: '收藏失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        }
      } else {
        // 有收藏收据
        console.log(res.data);
        let oldWordArr = res.data.data.words
        // 收藏
        if (!this.data.hasCollected) {
          oldWordArr.push(word)
          util.updateWords(oldWordArr, (result) => {
            console.log(result);
            if (result.data.flag) {
              wx.showToast({
                title: '收藏成功',
                icon: 'success',
                duration: 1000
              })
              this.setData({
                hasCollected: true
              })
            } else {
              wx.showToast({
                title: '收藏失败',
                icon: 'none',
                duration: 1000
              })
            }
          })
        } else {
          // 取消收藏
          for (let i = 0; i < oldWordArr.length; i++) {
            const element = oldWordArr[i];
            if (element["单词"] === this.data.wordList[this.data.currentNumber - 1]["单词"]) {
              oldWordArr.splice(i, 1)
              break
            }
          }
          util.updateWords(oldWordArr, (result) => {
            console.log(result);
            if (result.data.flag) {
              wx.showToast({
                title: '取消收藏成功',
                icon: 'success',
                duration: 1000
              })
              this.setData({
                hasCollected: false
              })
            } else {
              wx.showToast({
                title: '取消收藏失败',
                icon: 'none',
                duration: 1000
              })
            }
          })
        }
      }
    })

  },
  onHide: function () {
    console.log(`review隐藏`);
  },
  onShow: function () {
    console.log(`review显示`);
  }

})
