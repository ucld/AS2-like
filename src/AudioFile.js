function AudioFile () {
  this.ctx = null
  this.buffer = null
  this.bindedSprite = null
  this.audioBufferSource = null
  this.audioGainSource = null

  this.paused = true
  this.ended = false
  this.onended = false

  this._src = null
  this._onload = null
  this._volume = 1
  this._loop = false

  // Play AudioContext Buffer
  function playBuffer () {
    this.audioGainSource = this.ctx.createGain()
    this.audioBufferSource = this.ctx.createBufferSource()
    this.audioBufferSource.onended = function () {
      this.paused = true
      this.ended = true
      if (this.onended) {
        this.onended()
      }
    }.bind(this)
    const copyBuffer = new ArrayBuffer(this.buffer.byteLength)
    new Uint8Array(copyBuffer).set(new Uint8Array(this.buffer))

    this.ctx.decodeAudioData(copyBuffer, function (data) {
      this.audioBufferSource.buffer = data
      this.audioBufferSource.loop = this._loop
      this.audioBufferSource.start(0, 0)

      this.audioBufferSource.connect(this.audioGainSource)
      this.audioGainSource.connect(this.ctx.destination)

      this.audioGainSource.gain.value = this._volume
    }.bind(this))
  }

  // Audio locked browsers
  const audioUnlock = function () {
    this.ctx.unlocked = true
    playBuffer.bind(this)()
    document.removeEventListener('mousedown', audioUnlock)
    document.removeEventListener('touchstart', audioUnlock)
  }.bind(this)

  function requestUnlock () {
    document.addEventListener('mousedown', audioUnlock)
    document.addEventListener('touchstart', audioUnlock)
  }

  this.play = function () {
    if (!this.audioBufferSource || this.ended) {
      this.ended = false
      this.paused = false
      if (!this.ctx.unlocked) {
        requestUnlock()
      } else {
        playBuffer.bind(this)()
      }
    } else if (this.paused) {
      this.ctx.resume().then(function () {
        this.paused = false
      }.bind(this))
    }
  }

  this.pause = function () {
    if (this.ctx.state === 'running') {
      this.ctx.suspend().then(function () {
        this.paused = true
      }.bind(this))
    }
  }
}

AudioFile.prototype = {
  set src (file) {
    this._src = file

    fetch(new Request(file))
      .then(function (resp) {
        return resp.arrayBuffer()
      })
      .then(function (buff) {
        this.buffer = buff
        if (this._onload) {
          this._onload()
        }
      }.bind(this))

    return file
  },

  get src () {
    return this._src
  },

  set onload (fn) {
    this._onload = fn
    return this._onload
  },

  get onload () {
    return this._onload
  },

  set volume (n) {
    if (this.audioGainSource) {
      this.audioGainSource.gain.value = n
    }
    this._volume = n
    return n
  },

  get volume () {
    return this._volume
  },

  set loop (b) {
    if (this.audioBufferSource) {
      this.audioBufferSource.loop = b
    }
    this._loop = b
    return b
  },

  get loop () {
    return this._loop
  }
}
