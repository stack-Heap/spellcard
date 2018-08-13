const app = getApp()
let pageOptions = null
let util = require('../../utils/util.js')
Page({
  data: {
    staticUrl: '',
    list: [],
    recordingAllPath: null,
    singleReadSrc: [],
    isRecording: false,
    isAllRecording: false,
    isRecordPlaying: false,
    isAllRecordPlaying: false
  },

  onLoad: function (options) {
    this.setData({
      staticUrl: app.globalData.staticUrl
    })
    console.log(options);
    pageOptions = options
    let dialog = app.globalData.bookConfig[app.globalData.book][pageOptions.module][pageOptions.unit]["情景对话"][pageOptions.idx]["dialog"]
    // dialog = dialog[Number(pageOptions.idx) + 1]
    console.log(dialog);
    let dialogShowArr = []
    let nameArr = []
    for (let i = 0; i < dialog.length; i++) {
      let element = dialog[i];
      // 用：区分人和内容
      if (element["单词"].indexOf(":") !== -1 || element["单词"].indexOf("：") !== -1) {
        console.log("这一句里面有中文或者英文：");
        let splitArr
        // 英文:
        if (element["单词"].indexOf(":") !== -1) {
          splitArr = element["单词"].split(":")
        }
        // 中文：
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
          name: splitArr[0],
          content: splitArr[1],
          dialogColor: 'dialog-color-' + colorIndex,
          audio: element["音频"],
          open: false,
          complete: false
        }
        dialogShowArr.push(dialogItem)
      } else {
        console.log("这一句里面没有中文或者英文：");
        let dialogItem = {
          name: "",
          content: element["单词"],
          audio: element["音频"],
          open: false,
          complete: false
        }
        dialogShowArr.push(dialogItem)
      }
    }
    this.setData({
      list: dialogShowArr
    })
  },
  onReady: function () {
    console.log(`页面初次渲染完成`);
    wx.setNavigationBarTitle({
      title: `情景对话`
    })
  },
  kindToggle: function (e) {
    let that = this
    let list = that.data.list
    let index = e.currentTarget.dataset.index
    for (let i = 0, len = list.length; i < len; ++i) {
      if (i == index) {
        list[i].open = !list[i].open
      } else {
        list[i].open = false
      }
    }
    that.setData({
      list: list
    });
  },
  // 全文朗读
  startRecordingAll: function (e) {
    console.log('正在录音')
    let that = this
    that.setData({
      isAllRecording: true
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
      let recordingAllPath = that.data.recordingAllPath
      recordingAllPath = res.tempFilePath
      console.log(`录音临时文件路径：${res.tempFilePath}`)
      console.log("录音停止")
      that.setData({
        recordingAllPath: recordingAllPath,
        isAllRecording: false
      })
    });
    recorderManager.start({
      format: 'mp3'
    });
  },
  // 停止全文朗读
  stopRecordingAll: function (e) {
    let recorderManager = wx.getRecorderManager()
    recorderManager.stop()
    console.log("松手录音过程结束")
    this.setData({
      isAllRecording: false
    })
  },
  // 重置按钮
  reset: function () {
    let globalAudioContext = app.globalData.globalAudioContext
    globalAudioContext.stop()
    let that = this
    wx.showModal({
      title: '提示',
      content: '确定要重置页面吗',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          let list = that.data.list
          for (let i = 0; i < list.length; i++) {
            const element = list[i];
            list[i].complete = false
          }
          that.setData({
            isRecording: false,
            isRecordPlaying: false,
            recordingAllPath: null,
            isAllRecordPlaying: false,
            list: list,
            singleReadSrc: []
          })
          console.log(that.data.singleReadSrc)
        } else if (res.cancel) {
          console.log('用户点击取消')
          return false
        }
      }
    })
  },
  // 我的录音
  playMyAudio: function (e) {
    // 全文朗读有数据
    if (this.data.recordingAllPath) {
      if (!this.data.isAllRecordPlaying) {
        let globalAudioContext = app.globalData.globalAudioContext
        globalAudioContext.offEnded()
        globalAudioContext.onEnded((res) => {
          // 播放音频失败的回调
          console.log(`播放结束`)
          this.setData({
            isAllRecordPlaying: false
          })
        })
        globalAudioContext.stop()
        globalAudioContext.src = this.data.recordingAllPath;  // 这里可以是录音的临时路径
        globalAudioContext.play()
        this.setData({
          isAllRecordPlaying: true
        })
      } else {
        let globalAudioContext = app.globalData.globalAudioContext
        globalAudioContext.stop()
        this.setData({
          isAllRecordPlaying: false
        })
      }
    } else {
      // 全文朗读没有数据，播放单句所有的听一听

      if (!this.data.isAllRecordPlaying) {
        let i = 0
        let list = JSON.parse(JSON.stringify(this.data.list))

        for (let k = 0; k < this.data.list.length; k++) {
          if (this.data.singleReadSrc[k]) {
            list[k].audio = this.data.singleReadSrc[k]
          }
        }
        this.setData({
          isAllRecordPlaying: true
        })
        this.playFuc(i, list)
      } else {
        let globalAudioContext = app.globalData.globalAudioContext
        globalAudioContext.stop()
        this.setData({
          isAllRecordPlaying: false
        })
      }
    }
  },
  // 单句听一听
  singleListen: function (e) {
    console.log(e)
    let audioPath = e.currentTarget.dataset.audiopath
    let globalAudioContext = app.globalData.globalAudioContext
    globalAudioContext.offEnded()
    globalAudioContext.onEnded((res) => {
      console.log(`播放结束`)
    })
    globalAudioContext.stop()
    globalAudioContext.src = audioPath;  // 这里可以是录音的临时路径
    globalAudioContext.play()
  },
  // 单句读一读
  singleRead: function (e) {
    console.log(e)
    // catchtap阻止组件事件冒泡
    let tempRecordingIndex = e.currentTarget.dataset.recordingIndex
    console.log(tempRecordingIndex)
    let that = this
    that.setData({
      isRecording: true
    })
    wx.showToast({
      title: '松手停止录音',
      icon: 'none',
      duration: 1000
    })
    let recorderManager = wx.getRecorderManager();
    recorderManager.onError(function () {
      // 录音失败的回调处理
      console.log(`录音过程发生错误`)
    });

    recorderManager.onStop(function (res) {
      // 停止录音之后，把录取到的音频放在res.tempFilePath
      let recordingAllPath = that.data.recordingAllPath
      console.log(`录音临时文件路径：${res.tempFilePath}`)
      console.log("录音停止")
      let singleReadSrc = that.data.singleReadSrc
      singleReadSrc[tempRecordingIndex] = res.tempFilePath
      that.setData({
        singleReadSrc: singleReadSrc,
        isRecording: false
      })
    });
    recorderManager.start({
      format: 'mp3'
    });

  },
  // 单句录音结束
  singleReadEnd: function (e) {
    let recorderManager = wx.getRecorderManager()
    let tempRecordingIndex = e.currentTarget.dataset.recordingIndex
    recorderManager.stop()
    console.log("松手录音过程结束")
    let list = this.data.list
    list[tempRecordingIndex].complete = true
    this.setData({
      isRecording: false,
      list: list
    })
  },
  // 单句我的录音
  singlePlay: function (e) {
    let singleReadSrc = this.data.singleReadSrc
    let playIndex = e.currentTarget.dataset.playIndex
    if (!singleReadSrc[playIndex]) {
      wx.showToast({
        title: '未录音',
        icon: 'none',
        duration: 1000
      })
      return false
    }
    let globalAudioContext = app.globalData.globalAudioContext
    if (!this.data.isRecordPlaying) {
      globalAudioContext.offEnded()
      globalAudioContext.onEnded((res) => {
        // 播放音频失败的回调
        console.log(`播放结束`)
        this.setData({
          isRecordPlaying: false
        })
      })
      globalAudioContext.stop()
      globalAudioContext.src = singleReadSrc[playIndex]
      globalAudioContext.play()
      this.setData({
        isRecordPlaying: true
      })
    } else {
      globalAudioContext.stop()
      this.setData({
        isRecordPlaying: false
      })
    }
  },
  playFuc: function (i, list) {
    if (i >= list.length) {
      return
    }
    console.log(list);
    let globalAudioContext = app.globalData.globalAudioContext
    globalAudioContext.offEnded()
    globalAudioContext.onEnded((res) => {
      // 播放音频失败的回调
      console.log(`播放结束`)
      console.log(i);
      if (i >= list.length - 1) {
        this.setData({
          isAllRecordPlaying: false
        })
        return
      }
      return this.playFuc(++i, list)
    })
    globalAudioContext.stop()
    globalAudioContext.src = list[i].audio
    globalAudioContext.play()
  },
  onHide: function () {
    console.log(`dialog隐藏`);
    
  },
  onUnload: function(){
    
  },
  onShow: function () {
    console.log(`dialog显示`);
  }
})
