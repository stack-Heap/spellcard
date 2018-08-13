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
    hasAnswerd: false,
    isPlaying: false,
    isExercising: false,
    isTrue: false,
    letterShow: [],
    clickWordArr: [],
    allEnd: false,
    trueAnswer: ''
  },

  onLoad: function (options) {
    this.setData({
      staticUrl: app.globalData.staticUrl
    })
    wx.removeStorageSync('userExerciseInfo')
    wx.removeStorageSync('startTime')
    wx.removeStorageSync('endTime')
    type = options.type
    unit = options.unit
    moduleName = options.module
    let bookConfig = app.globalData.bookConfig
    let book = app.globalData.book
    // 如果是章节复习
    if (unit === 'Review') {
      // review时将前面单元所有单词随机二十个出来
      // 遍历当前module下所有单元的词汇，形成一个新的词汇数组
      let unitInfo = bookConfig[book][moduleName]
      let wordArr = []
      console.log(unitInfo);
      for (let i in unitInfo) {
        console.log(i);
        if (i === 'Review') {
          continue
        }
        let wordItem = []
        if (type === '词汇') {
          wordItem = unitInfo[i]["主题词汇"]
        } else {
          wordItem = unitInfo[i]["单元词组"]
        }
        wordItem && (wordArr = wordArr.concat(wordItem))
      }
      console.log(wordArr);
      // 所用单元词汇总数组乱序选出前十个
      wordArr = util.shuffle(wordArr)
      wordArr = wordArr.splice(0, 10)
      console.log(wordArr);
      this.setData({
        wordList: wordArr
      })
    } else {
      let wordList = []
      if (type === '词汇') {
        wordList = bookConfig[book][moduleName][unit]["主题词汇"]
      } else {
        wordList = bookConfig[book][moduleName][unit]["单元词组"]
      }
      console.log(wordList);
      this.setData({
        wordList: wordList
      })
    }
    wx.removeStorageSync("wordList")
    wx.setStorageSync("wordList", this.data.wordList)
    startExerciseType = options.exerciseType
    this.setData({
      exerciseType: options.exerciseType
    })
    let wordList = this.data.wordList
    // 题型判断
    if (options.exerciseType === '1' || options.exerciseType === '3') {
      this.initQuestion1(wordList)
    } else if (options.exerciseType === '2' || options.exerciseType === '4') {
      this.initQuestion2(wordList)
    } else if (options.exerciseType === '5') {
      let exerciseType = (Math.floor(Math.random() * 4) + 1).toString()
      this.setData({
        exerciseType: exerciseType
      })
      if (exerciseType === '1' || exerciseType === '3') {
        this.initQuestion1(wordList)
      } else if (exerciseType === '2' || exerciseType === '4') {
        this.initQuestion2(wordList)
      }
    }

  },
  onReady: function () {
    console.log(`练习页面初次渲染完成`);
    let date = new Date()
    let startTime = util.formatTime(date)
    wx.setStorageSync('startTime', startTime)
    wx.setNavigationBarTitle({
      title: `背${type}`
    })
    if (this.data.exerciseType === '1' || this.data.exerciseType === '2') {
      this.playWordAudio()
    }
  },
  choose: function (e) {
    if (this.data.hasAnswerd) {
      return false
    }
    let chooseAnswer = e.currentTarget.dataset.choose
    let trueAnswer = this.data.wordList[this.data.currentNumber - 1]["单词"]
    chooseItem = e.currentTarget.dataset.idx
    this.setData({
      hasAnswerd: true
    })
    console.log(chooseAnswer + '-------------' + trueAnswer);
    if (chooseAnswer === trueAnswer) {
      console.log(`此题答题正确`);
      let answer = this.data.answer
      for (let i = 0; i < answer.length; i++) {
        let el = answer[i]
        if (el.word === trueAnswer) {
          el.color = "bg-color-true"
        }
      }
      this.setData({
        answer: answer
      })
      // 每次答完一道题，存取答题信息
      let userExerciseInfoItem = {
        number: this.data.currentNumber,
        exerciseType: this.data.exerciseType,
        result: true,
        answer: this.data.answer,
        questionContent: this.data.questionContent
      }
      console.log(`本题存入localstorage`);
      this.setLocalStorage(userExerciseInfoItem)

      chooseItem = 0
      // 题目全部答完后跳转到结果页面
      if (this.data.currentNumber === this.data.wordList.length) {
        this.setData({
          allEnd: true
        })
        // 跳转到结果页
        console.log(`题目全部答完`)
        let date = new Date()
        let endTime = util.formatTime(date)
        wx.setStorageSync('endTime', endTime)
        wx.redirectTo({
          url: '../result/result?type=' + type + '&unit=' + unit + '&moduleName=' + moduleName
        })
        return
      }
      setTimeout(() => {
        let currentNumber = this.data.currentNumber
        this.setData({
          currentNumber: currentNumber + 1
        })
        if (startExerciseType === '1') {
          this.initQuestion1(this.data.wordList)
          this.playWordAudio()
        }
        if (startExerciseType === '3') {
          this.initQuestion1(this.data.wordList)
        }
        if (startExerciseType === '5') {
          let exerciseType = (Math.floor(Math.random() * 4) + 1).toString()
          this.setData({
            exerciseType: exerciseType
          })
          if (exerciseType === '1') {
            this.initQuestion1(this.data.wordList)
            this.playWordAudio()
          } else if (exerciseType === '3') {
            this.initQuestion1(this.data.wordList)
          } else if (exerciseType === '2') {
            this.initQuestion2(this.data.wordList)
            this.playWordAudio()
          } else if (exerciseType === '4') {
            this.initQuestion2(this.data.wordList)
          }
        }
      }, 500)
    } else {
      console.log(`此题答题错误`);
      let answer = this.data.answer
      for (let i = 0; i < answer.length; i++) {
        let el = answer[i]
        if (el.word === trueAnswer) {
          el.color = "bg-color-true"
        }
      }
      answer[chooseItem].color = "bg-color-false"
      this.setData({
        answer: answer
      })
      // 每次答完一道题，存取答题信息
      let userExerciseInfoItem = {
        number: this.data.currentNumber,
        exerciseType: this.data.exerciseType,
        result: false,
        answer: this.data.answer,
        questionContent: this.data.questionContent
      }
      console.log(`本题存入localstorage`);
      this.setLocalStorage(userExerciseInfoItem)
      chooseItem = 0
      // 题目全部答完后跳转到结果页面
      if (this.data.currentNumber === this.data.wordList.length) {
        this.setData({
          allEnd: true
        })
        // 跳转到结果页
        console.log(`题目全部答完`)
        let date = new Date()
        let endTime = util.formatTime(date)
        wx.setStorageSync('endTime', endTime)
        wx.redirectTo({
          url: '../result/result?type=' + type + '&unit=' + unit + '&moduleName=' + moduleName
        })
        return
      }
      setTimeout(() => {
        let currentNumber = this.data.currentNumber
        this.setData({
          currentNumber: currentNumber + 1
        })
        if (startExerciseType === '1') {
          this.initQuestion1(this.data.wordList)
          this.playWordAudio()
        }
        if (startExerciseType === '3') {
          this.initQuestion1(this.data.wordList)
        }
        if (startExerciseType === '5') {
          let exerciseType = (Math.floor(Math.random() * 4) + 1).toString()
          this.setData({
            exerciseType: exerciseType
          })
          if (exerciseType === '1') {
            this.initQuestion1(this.data.wordList)
            this.playWordAudio()
          } else if (exerciseType === '3') {
            this.initQuestion1(this.data.wordList)
          } else if (exerciseType === '2') {
            this.initQuestion2(this.data.wordList)
            this.playWordAudio()
          } else if (exerciseType === '4') {
            this.initQuestion2(this.data.wordList)
          }
        }
      }, 1000);

    }

  },
  playWordAudio: function () {
    let globalAudioContext = app.globalData.globalAudioContext
    util.removeAudioListener(globalAudioContext)
    globalAudioContext.onEnded((res) => {
      // 播放音频失败的回调
      console.log(`播放录音结束`)
      this.setData({
        isPlaying: false
      })
    })
    globalAudioContext.stop()
    globalAudioContext.src = this.data.wordList[this.data.currentNumber - 1]["音频"]
    setTimeout(() => {
      globalAudioContext.play()
    }, 500);
    this.setData({
      isPlaying: true
    })
  },
  clickLetter: function (e) {
    if (this.data.hasAnswerd) {
      return
    }
    let word = this.data.wordList[this.data.currentNumber - 1]["单词"]
    let compressWord = word
    compressWord = compressWord.replace(/\ +/g, "");//去掉空格
    compressWord = compressWord.replace(/\-+/g, "");//去掉-

    clickNumber++
    let click = e.currentTarget.dataset.click
    console.log(`点击的字母是：${click}`);
    userClickStr += click

    let letterShow = this.data.letterShow
    if (letterShow[clickNumber - 1]["content"] === ' ' || letterShow[clickNumber - 1]["content"] === '-') {
      letterShow[clickNumber] = {
        "content": click,
        "class": ""
      }
      clickNumber++
    } else {
      letterShow[clickNumber - 1] = {
        "content": click,
        "class": ""
      }
    }
    this.setData({
      letterShow: letterShow,
      isExercising: true
    })


    if (userClickStr.length === compressWord.length) {
      if (userClickStr === compressWord) {
        console.log("此题答案正确");
        this.setData({
          hasAnswerd: true,
          isTrue: true,
        })
        let userExerciseInfoItem = {
          number: this.data.currentNumber,
          exerciseType: this.data.exerciseType,
          result: true,
          questionContent: this.data.questionContent,
          letterShow: this.data.letterShow,
          clickWordArr: this.data.clickWordArr,
          isTrue: this.data.isTrue,
          trueAnswer: this.data.wordList[this.data.currentNumber - 1]["单词"]
        }
        console.log(`本题存入localstorage`);
        this.setLocalStorage(userExerciseInfoItem)
        this.setData({
          letterShow: [],
          trueAnswer: this.data.wordList[this.data.currentNumber - 1]["单词"]
        })
        if (this.data.currentNumber === this.data.wordList.length) {
          this.setData({
            allEnd: true
          })
          // 跳转到结果页
          console.log(`题目全部答完`)
          let date = new Date()
          let endTime = util.formatTime(date)
          wx.setStorageSync('endTime', endTime)
          wx.redirectTo({
            url: '../result/result?type=' + type + '&unit=' + unit + '&moduleName=' + moduleName
          })
          return
        }
        setTimeout(() => {
          let currentNumber = this.data.currentNumber
          this.setData({
            currentNumber: currentNumber + 1
          })
          if (startExerciseType === '2') {
            this.initQuestion2(this.data.wordList)
            this.playWordAudio()
          }
          if (startExerciseType === '4') {
            this.initQuestion2(this.data.wordList)
          }
          if (startExerciseType === '5') {
            let exerciseType = (Math.floor(Math.random() * 4) + 1).toString()
            this.setData({
              exerciseType: exerciseType
            })
            if (exerciseType === '1') {
              this.initQuestion1(this.data.wordList)
              this.playWordAudio()
            } else if (exerciseType === '3') {
              this.initQuestion1(this.data.wordList)
            } else if (exerciseType === '2') {
              this.initQuestion2(this.data.wordList)
              this.playWordAudio()
            } else if (exerciseType === '4') {
              this.initQuestion2(this.data.wordList)
            }
          }
        }, 500);
      } else {
        console.log("此题答案错误");
        this.setData({
          hasAnswerd: true,
          isTrue: false,
        })
        let userExerciseInfoItem = {
          number: this.data.currentNumber,
          exerciseType: this.data.exerciseType,
          result: false,
          questionContent: this.data.questionContent,
          letterShow: this.data.letterShow,
          clickWordArr: this.data.clickWordArr,
          isTrue: this.data.isTrue,
          trueAnswer: this.data.wordList[this.data.currentNumber - 1]["单词"]
        }
        console.log(`本题存入localstorage`);
        this.setLocalStorage(userExerciseInfoItem)
        this.setData({
          letterShow: [],
          trueAnswer: this.data.wordList[this.data.currentNumber - 1]["单词"]
        })
        if (this.data.currentNumber === this.data.wordList.length) {
          this.setData({
            allEnd: true
          })
          // 跳转到结果页
          console.log(`题目全部答完`)
          let date = new Date()
          let endTime = util.formatTime(date)
          wx.setStorageSync('endTime', endTime)
          wx.redirectTo({
            url: '../result/result?type=' + type + '&unit=' + unit + '&moduleName=' + moduleName
          })
          return
        }
        setTimeout(() => {
          let currentNumber = this.data.currentNumber
          this.setData({
            currentNumber: currentNumber + 1
          })
          if (startExerciseType === '2') {
            this.initQuestion2(this.data.wordList)
            this.playWordAudio()
          }
          if (startExerciseType === '4') {
            this.initQuestion2(this.data.wordList)
          }
          if (startExerciseType === '5') {
            let exerciseType = (Math.floor(Math.random() * 4) + 1).toString()
            this.setData({
              exerciseType: exerciseType
            })
            if (exerciseType === '1') {
              this.initQuestion1(this.data.wordList)
              this.playWordAudio()
            } else if (exerciseType === '3') {
              this.initQuestion1(this.data.wordList)
            } else if (exerciseType === '2') {
              this.initQuestion2(this.data.wordList)
              this.playWordAudio()
            } else if (exerciseType === '4') {
              this.initQuestion2(this.data.wordList)
            }
          }
        }, 1000);
      }
    }



  },
  clearInput: function () {
    let letterShow = this.data.letterShow
    userClickStr = userClickStr.substring(0, clickNumber - 1)
    if (letterShow[clickNumber - 1]["content"] === ' ' || letterShow[clickNumber - 1]["content"] === '-') {
      letterShow[clickNumber - 2] = {
        "content": "",
        "class": "no-input"
      }
      clickNumber--
    } else {
      letterShow[clickNumber - 1] = {
        "content": "",
        "class": "no-input"
      }
    }
    clickNumber--
    this.setData({
      letterShow: letterShow
    })
    if (!clickNumber) {
      this.setData({
        isExercising: false
      })
    }
  },
  setLocalStorage: function (item) {
    try {
      var value = wx.getStorageSync('userExerciseInfo')
      if (value) {
        let userExerciseInfo = value
        userExerciseInfo.push(item)
        try {
          wx.setStorageSync('userExerciseInfo', userExerciseInfo)
        } catch (e) {
          console.log(e);
        }
      } else {
        let userExerciseInfo = []
        userExerciseInfo.push(item)
        try {
          wx.setStorageSync('userExerciseInfo', userExerciseInfo)
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e) {
      console.log(e);
    }
  },
  initQuestion1: function (wordList) {
    let questionContent = wordList[this.data.currentNumber - 1]["释义"]
    this.setData({
      questionContent: questionContent
    })
    let answerArr = wordList[this.data.currentNumber - 1]["答题项"]
    answerArr = util.shuffle(answerArr)
    let answer = []
    for (let i = 0; i < answerArr.length; i++) {
      let el = answerArr[i]
      let obj = {
        "word": el,
        "color": ""
      }
      answer.push(obj)
    }
    this.setData({
      answer: answer,
      hasAnswerd: false
    })
  },
  initQuestion2: function (wordList) {
    clickNumber = 0
    userClickStr = ''
    let questionContent = wordList[this.data.currentNumber - 1]["释义"]
    this.setData({
      questionContent: questionContent
    })
    let isTrue = this.data.isTrue
    let result = this.data.result
    this.setData({
      isTrue: false,
      hasAnswerd: false
    })
    let letterShow = []
    let word = wordList[this.data.currentNumber - 1]["单词"]
    console.log(word);
    let compressWord = word
    compressWord = compressWord.replace(/\ +/g, "");//去掉空格
    compressWord = compressWord.replace(/\-+/g, "");//去掉-
    console.log(compressWord);
    for (let i = 0; i < word.length; i++) {
      const el = word[i];
      let inputItem = {
        "content": "",
        "class": "no-input"
      }
      if (el === ' ' || el === '-') {
        inputItem = {
          "content": el,
          "class": "skip-input"
        }
      }
      letterShow.push(inputItem)
      this.setData({
        letterShow: letterShow
      })
    }
    // 数组去重，生成点击键盘区域20个单词字母
    let newArr = util.unique(compressWord)
    // 数组去重后结果
    console.log(newArr);
    let allLetter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    for (let i = 0; i < newArr.length; i++) {
      const el = newArr[i];
      // 删除26个字母中指定的字母
      allLetter = util.removeByValue(allLetter, el)
    }
    allLetter = util.shuffle(allLetter)
    let removeNum = allLetter.length - (20 - newArr.length)
    allLetter.splice(0, removeNum)
    let newAllLetter = allLetter.concat(newArr)
    newAllLetter = util.shuffle(newAllLetter)
    this.setData({
      clickWordArr: newAllLetter
    })
  },
  onHide: function () {
    console.log(`exercise隐藏`);
  },
  onShow: function () {
    console.log(`exercise显示`);
  }

})
