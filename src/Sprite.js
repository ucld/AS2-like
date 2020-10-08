function Sprite (src, x, y, w, h) {
  this._x = x
  this._y = y
  this._w = w
  this._h = h
  this._alpha = 1
  this._frame = 0
  this._frames = []
  this._actions = []
  this._children = []
  this._parent = null
  this._root = null
  this._origin = 0
  this._render = 'sprite'
  this._paused = false
  this._events = {
    enterFrame: null,
    mouse: {}
  }

  this.stop = function () {
    this._paused = true
    return this
  }

  this.play = function () {
    this._paused = false
    return this
  }

  this.nextFrame = function () {
    this._frame = (this._frame + 1) % this._frames.length
    return this
  }

  this.gotoFrame = function (n) {
    this._frame = n % this._frames.length
    return this
  }

  this.addToFrame = function (n, frameSprites) {
    for (const i in frameSprites) {
      frameSprites[i]._parent = this
    }
    if (n < 0 || n >= this._frames.length) {
      this._frames.push(frameSprites)
    } else {
      const arrFrame = Array.isArray(this._frames[n])
      const arrSprites = Array.isArray(frameSprites)
      if (arrFrame !== arrSprites || !(arrFrame || arrSprites)) {
        this._frames[n] = {
          ...this._frames[n],
          ...frameSprites
        }
      } else if (arrFrame) {
        this._frames[n] = [
          ...this._frames[n],
          ...frameSprites
        ]
      }
    }
    return this
  }

  this.addFrame = function (frameSprites) {
    for (const i in frameSprites) {
      frameSprites[i]._parent = this
    }
    this.addToFrame(this._frames.length, frameSprites)
    return this
  }

  this.addToAction = function (n, frameFunction) {
    if (n < 0 || n >= this._frames.length) {
      this._actions.push(frameFunction)
    } else {
      this._actions[n] = frameFunction
    }
  }

  this.addAction = function (frameFunction) {
    this.addToAction(this._frames.length, frameFunction)
    return this
  }

  this.renderTo = function (canvasElement, lastTime) {
    const canvas = new Canvas(canvasElement, this._w, this._h)
    canvas.renderSprite(this)
    return this
  }

  // Events
  this.onEnterFrame = function (frameFunction) {
    this._events.enterFrame = frameFunction
    return this
  }

  const supportedEvents = {
    mouse: [
      'MouseMove', 'MouseDown', 'MouseUp', 'Click'
    ],
    keybd: [
      'KeyDown', 'KeyUp', 'KeyPress'
    ]
  }
  for (const i in supportedEvents) {
    if (!this._events[i]) {
      this._events[i] = {}
    }
    for (const j in supportedEvents[i]) {
      this['on' + supportedEvents[i][j]] = function (eventCallback) {
        this._events[i][supportedEvents[i][j].toLowerCase()] = eventCallback
        return this
      }
    }
  }

  const ext = src.length >= 3 ? src.substr(-3) : ''
  const color = UTILS.isHex(src) || UTILS.isRGB(src)

  if (color) {
    const newShape = new NativeGFX('rect', 0, 0, w, h)
    newShape._parent = this
    newShape._color = src
    this.addFrame([newShape])
  } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
    const self = this
    this._loop = true
    this._volume = 1
    FILES.loadFile(src, AudioFile, function (audio) {
      self.addFrame([new NativeSFX(src)])
    })
  } else if (['jpg', 'jpeg', 'gif', 'png', 'bmp'].includes(ext)) {
    const self = this
    FILES.loadFile(src, Image, function (image) {
      const wCount = image.width / self._w
      const hCount = image.height / self._h
      const noFrames = wCount * hCount
      // Extract frames
      if (hCount % 1 === 0 && wCount % 1 === 0) {
        for (let i = 0, x = 0, y = 0; i < noFrames; i++) {
          x = i % wCount
          y = Math.floor(i / wCount)
          const newImage = new NativeIMG(
            src, 0, 0,
            self._w, self._h,
            x * self._w,
            y * self._h,
            self._w, self._h
          )
          newImage._parent = self
          self.addFrame({ _src: newImage })
        }
      } else {
        const newImage = new NativeIMG(
          src, 0, 0, self._w, self._h,
          0, 0, self._w, self._h
        )
        newImage._parent = self
        self.addFrame([newImage])
      }
    })
  } else if (src !== '_clip_') {
    console.error('Source Error: ' + src)
  }
}

function Clip (x, y, w, h) {
  Sprite.call(this, '_clip_', x, y, w, h)
}

function AudioClip (src) {
  Sprite.call(this, src, 0, 0, 0, 0)
}