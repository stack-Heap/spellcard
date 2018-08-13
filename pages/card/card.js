//index.js
//获取应用实例
const app = getApp()
let util = require('../../utils/util.js')
const pageColor = {
  "词汇朗读": "1",
  "词块朗读": "2",
  "句子朗读": "3",
  "情景对话": "4"
}

let pageOptions = null

Page({
  data: {
    staticUrl: "",
    unitName: "",
    moduleName: "",
    word: [],
    duration: 400,
    current: 0,
    currentPageColor: "",
    name: "",
    src: [],
    isRecording: false,
    isRecordPlaying: false,
    isDialogPlaying: false,
    dialogShowArr: []
  },

  onLoad: function (options) {
    let version = ''
    if (app.globalData.resourceVersion) {
      version = `?version=${app.globalData.resourceVersion}`
    }
    console.log(options)
    pageOptions = options
    let bookConfig = app.globalData.bookConfig
    let book = app.globalData.book
    let newWord = bookConfig[book][options.module][options.unit][options.exercise]
    let word
    try {
      word = JSON.parse(JSON.stringify(newWord))
    } catch (error) {
      console.log(error);
    }

    this.setData({
      word: word,
      version: version
    }, function () {
      console.log(`加载完成word`);
    })
    if (options.exercise !== '情景对话') {
      util.findWords((res) => {
        if (!res) {
          console.log("error");
          wx.showToast({
            title: '查询收藏出错',
            icon: 'none',
            duration: 1000
          })
          return false
        }
        if (!res.data.flag) {
          console.log("error");
          wx.showToast({
            title: '查询收藏出错',
            icon: 'none',
            duration: 1000
          })
          return false
        }
        if (res.data.data) {
          let collectWordArr = res.data.data.words
          console.log(collectWordArr);
          for (let i = 0; i < word.length; i++) {
            const element = word[i];
            for (let k = 0; k < collectWordArr.length; k++) {
              const el = collectWordArr[k];
              if (element["单词"] === el["单词"]) {
                element.hasCollected = true
                break
              } else {
                element.hasCollected = false
              }
            }
          }
          console.log(word);
          this.setData({
            word: word
          })
        }
      })
    }

    this.setData({
      staticUrl: app.globalData.staticUrl,
      unitName: options.unit,
      moduleName: options.module,
      name: options.name,
      currentPageColor: pageColor[options.name],
      src: []
    })
    if (options.exercise === '情景对话') {
      let word = this.data.word
      let newWord = []
      for (let j = 0; j < word.length; j++) {
        console.log(word[j]);
        let dialog = word[j]["dialog"]
        console.log(dialog);
        let dialogShowArr = []
        let nameArr = []

        for (let i = 0; i < dialog.length; i++) {
          let element = dialog[i];
          let firstChar = element["单词"].substr(0,1)
          // 不是斜体
          let charClass = false
          // 是斜体
          if (firstChar ==='('||firstChar==='（') {
            charClass = true
          }
          // 用：区分人和内容
          if (element["单词"].indexOf(":") !== -1 || element["单词"].indexOf("：") !== -1) {
            console.log("这一句里面有中文或者英文：");
            let splitArr;
            if (element["单词"].indexOf(":") !== -1) {
              splitArr = element["单词"].split(":")
            }
            if (element["单词"].indexOf("：") !== -1) {
              splitArr = element["单词"].split("：")
            }
            // 判断对话框名字处颜色
            let colorIndex
            if (nameArr.indexOf(splitArr[0]) === -1) {
              nameArr.push(splitArr[0])
              colorIndex = nameArr.indexOf(splitArr[0]) % 4
            } else {
              colorIndex = nameArr.indexOf(splitArr[0]) % 4
            }
            
            let dialogItem = {
              "name": splitArr[0],
              "content": splitArr[1],
              "class": charClass,
              "dialogColor": 'dialog-color-' + colorIndex,
              "audio": element["音频"]
            }
            dialogShowArr.push(dialogItem)
          } else {
            console.log("这一句里面没有中文或者英文：");
            let dialogItem = {
              "name": "", 
              "class": charClass,
              "content": element["单词"],
              "audio": element["音频"]
            }
            dialogShowArr.push(dialogItem)
          }
        }
        let newWordItem = {
          "dialog": dialogShowArr,
          "entireAudio": word[j].entireAudio
        }
        newWord.push(newWordItem)
      }
      this.setData({
        word: newWord
      })
    }
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: this.data.name
    })
  },
  changeItem: function (e) {
    if (this.data.isRecording) {
      return
    }
    this.setData({
      current: e.detail.current
    })
  },
  startRecording: function (e) {
    console.log(e)
    console.log('正在录音')
    let that = this
    that.setData({
      isRecording: true
    })
    wx.showToast({
      title: '松手停止录音',
      icon: 'none',
      duration: 2000
    })
    let recorderManager = wx.getRecorderManager();
    recorderManager.onError(function () {
      // 录音失败的回调处理
      console.log(`录音过程发生错误`)
    });
    recorderManager.onStop(function (res) {
      // 停止录音之后，把录取到的音频放在res.tempFilePath
      console.log(that.data.src);
      let src = that.data.src
      src[that.data.current] = res.tempFilePath
      that.setData({
        src: src,
        isRecording: false
      })
      console.log(`录音临时文件路径：${res.tempFilePath}`)
      console.log("录音停止")
    });
    recorderManager.start({
      format: 'mp3'  // 如果录制acc类型音频则改成aac
    });
  },
  playRecording: function (e) {
    // 全局播放器
    let globalAudioContext = app.globalData.globalAudioContext
    let that = this
    if (!that.data.src[that.data.current]) {
      wx.showToast({
        title: '当前没有录音',
        icon: 'none',
        duration: 1000
      })
      return
    }
    if (!that.data.isRecordPlaying) {
      globalAudioContext.offEnded()
      globalAudioContext.onEnded((res) => {
        // 播放音频失败的回调
        console.log(`录音播放结束`)
        that.setData({
          isRecordPlaying: false
        })
      })
      globalAudioContext.stop()
      globalAudioContext.src = that.data.src[that.data.current];  // 这里可以是录音的临时路径
      globalAudioContext.play()
      that.setData({
        isRecordPlaying: true
      })
    } else {
      globalAudioContext.stop()
      that.setData({
        isRecordPlaying: false
      })
    }

  },
  stopRecording: function (e) {
    let recorderManager = wx.getRecorderManager()
    recorderManager.stop()
    this.setData({
      isRecording: false
    })
    console.log("松手录音过程结束")
  },
  stopSwiper: function (e) {
    console.log("正在录音阻止swiper滑动")
  },
  playWordAudio: function (e) {
    console.log(e)
    let globalAudioContext = app.globalData.globalAudioContext
    // 播放新的音频前取消监听
    util.removeAudioListener(globalAudioContext)
    globalAudioContext.stop()
    globalAudioContext.src = this.data.word[this.data.current]["音频"]
    globalAudioContext.play()
  },
  listenDialog: function (e) {
    let entireAudio = this.data.word[this.data.current].entireAudio
    let isDialogPlaying = this.data.isDialogPlaying
    let globalAudioContext = app.globalData.globalAudioContext
    util.removeAudioListener(globalAudioContext)
    if (isDialogPlaying) {
      // 正在播放，点击停止
      globalAudioContext.stop()
      this.setData({
        isDialogPlaying: false
      })
    } else {
      // 未在播放，点击循环播放
      let i = 0
      console.log(i);
      this.setData({
        isDialogPlaying: true
      })
      let list = this.data.word[this.data.current].dialog
      util.removeAudioListener(globalAudioContext)
      this.playFuc(i, list)
    }

  },
  // 跳转到角色扮演页面
  dialogDetail: function () {
    wx.navigateTo({
      url: `../dialog/dialog?unit=${pageOptions.unit}&module=${pageOptions.module}&idx=${this.data.current}`
    })
  },
  playFuc: function (i, list) {
    if (i >= list.length) {
      return
    }
    console.log(list);
    let that = this
    let globalAudioContext = app.globalData.globalAudioContext
    globalAudioContext.offEnded()
    globalAudioContext.onEnded((res) => {
      // 播放音频失败的回调
      console.log(`录音播放结束`)
      console.log(i);
      if (i >= list.length - 1) {
        console.log(`全部播放完毕`);
        that.setData({
          isDialogPlaying: false
        })
        return false
      }
      return that.playFuc(++i, list)
    })
    globalAudioContext.stop()
    globalAudioContext.src = list[i].audio
    globalAudioContext.play()
  },
  toggleCollect: function () {
    let wordItem = this.data.word[this.data.current]
    console.log(wordItem);
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
        if (!wordItem.hasCollected) {
          let wordArr = [wordItem]
          util.updateWords(wordArr, (result) => {
            console.log(result);
            if (result.data.flag) {
              wx.showToast({
                title: '收藏成功',
                icon: 'success',
                duration: 2000
              })
              wordItem.hasCollected = true
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
        if (!wordItem.hasCollected) {
          oldWordArr.push(wordItem)
          util.updateWords(oldWordArr, (result) => {
            console.log(result);
            if (result.data.flag) {
              wx.showToast({
                title: '收藏成功',
                icon: 'success',
                duration: 1000
              })
              wordItem.hasCollected = true
              console.log(wordItem);
              let word = this.data.word
              word[this.data.current] = wordItem
              console.log(word);
              this.setData({
                word: word
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
            if (element["单词"] === wordItem["单词"]) {
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
              wordItem.hasCollected = false
              console.log(wordItem);
              let word = this.data.word
              word[this.data.current] = wordItem
              console.log(word);
              this.setData({
                word: word
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
  bindanimationfinish: function (e) {
  },
  onHide: function () {
    console.log(`card页面隐藏`);
  },
  onShow: function () {
    console.log(`card页面显示`);
  }
})
