const app = getApp()

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const unique = array => {
  return Array.from(new Set(array));
}

const shuffle = (arr) => {
  for (let i = 1; i < arr.length; i++) {
    const random = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[random]] = [arr[random], arr[i]];
  }
  return arr;
}

const removeByValue = (arr, val) => {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == val) {
      arr.splice(i, 1);
      break;
    }
  }
  return arr
}

// 更新单词本
const updateWords = (data, callback) => {
  wx.request({
    url: app.globalData.servicesUrl + '/updateWords',
    data: {
      uid: app.globalData.userId,
      words: data
    },
    method: 'POST',
    header: {
      'content-type': 'application/json'
    },
    complete: (res) => {
      callback(res)
    }
  })
}

// 查找单词本
const findWords = (callback) => {
  wx.request({
    url: app.globalData.servicesUrl + '/findwords',
    data: {
      uid: app.globalData.userId
    },
    method: 'POST',
    header: {
      'content-type': 'application/json'
    },
    complete: (res) => {
      callback(res)
    }
  })
}

const removeAudioListener =(audioContext)=>{
  if (audioContext.onEnded) {
    audioContext.offEnded()
  }
  // 是否存在全局播放的停止监听事件，有就取消
  if (audioContext.onStop) {
    audioContext.offStop()
  }
}


module.exports = {
  formatTime: formatTime,
  unique: unique,
  shuffle: shuffle,
  removeByValue: removeByValue,
  updateWords: updateWords,
  findWords: findWords,
  removeAudioListener: removeAudioListener
}
