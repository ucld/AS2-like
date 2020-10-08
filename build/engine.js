"use strict"

function Files () {
  this.files = {}

  this.loadFile = function (src, Cons, callback) {
    if (!this.files[src]) {
      const self = this

      this.files[src] = {
        obj: new Cons(),
        loaded: false
      }

      this.files[src].obj.src = src

      this.files[src].obj.onload = function () {
        self.files[src].loaded = true
        callback(self.files[src].obj)
      }
    } else {
      callback(this.files[src].obj)
    }
  }

  this.getFile = function (src) {
    if (this.files[src] && this.files[src].loaded) {
      return this.files[src].obj
    } else {
      return null
    }
  }
}

function Utils () {
  function isColorForm (string, fn, ...regStrs) {
    const regex = [
      ...regStrs.map(i => new RegExp(i)), /./
    ].filter(i => i.test(string))[0]

    const values = string.match(regex).slice(1).map(i => fn(i))

    const isValid = values.length && values.every(i => i < 256)

    return isValid ? values : null
  }

  this.isRGB = function (string) {
    const n = '\\s*?([0-9]+)\\s*?'
    const rgbStr = `^rgb\\(${n},${n},${n}\\)$`
    const rgbaStr = `^rgba\\(${n},${n},${n},${n}\\)$`
    return isColorForm(string, i => +i, rgbStr, rgbaStr)
  }

  this.isHex = function (string) {
    const n1 = '([0-9A-Fa-f])'
    const n2 = '([0-9A-Fa-f]{2})'
    const hex8Str = `^#${n2}${n2}${n2}${n2}$`
    const hex6Str = `^#${n2}${n2}${n2}$`
    const hex3Str = `^#${n1}${n1}${n1}$`
    return isColorForm(string, i => i.length === 1
      ? parseInt(i + i, 16) : parseInt(i, 16)
    , hex8Str, hex6Str, hex3Str)
  }
}

const FILES = new Files()
const UTILS = new Utils()

function Events (target) {
  this.triggers = {}
  this.mouse = { x: 0, y: 0 }
  this.keybd = { down: {}, current: null }

  function clamp (n, mn, mx) {
    return n < mn ? mn : (n > mx ? mx : n)
  }
  // Handlers
  function handleMouseMove (e) {
    if (e.type.includes('touch')) {
      e.preventDefault()
      e = e.changedTouches[0]
    }
    let realW = target.offsetWidth
    let realH = target.offsetHeight
    let realX = target.offsetLeft
    let realY = target.offsetTop

    if (document.fullscreen) {
      if (target.offsetWidth > target.offsetHeight) {
        realY = 0
        realH = target.offsetHeight
        realW = target.width * (target.offsetHeight / target.height)
        realX = (target.offsetWidth - realW) / 2
      } else {
        realX = 0
        realW = target.offsetWidth
        realH = target.height * (target.offsetWidth / target.width)
        realY = (target.offsetHeight - realH) / 2
      }
    }

    const relX = clamp(
      Math.floor(
        (e.clientX - realX + window.scrollX) *
        target.width / realW
      ),
      0, target.width
    )

    const relY = clamp(
      Math.floor(
        (e.clientY - realY + window.scrollY) *
        target.height / realH
      ),
      0, target.height
    )

    this.mouse.x = relX
    this.mouse.y = relY
    this.triggers.mousemove = 1
  }

  function handleKeyEvent (e) {
    if (e.type === 'keydown') {
      this.keybd.down[e.key] = true
    } else if (e.type === 'keyup') {
      this.keybd.down[e.key] = false
    }
    this.keybd.active = true
    this.triggers[e.type] = e.key
  }

  // Event Listeners
  target.addEventListener('touchmove', handleMouseMove.bind(this))
  target.addEventListener('mousemove', handleMouseMove.bind(this))
  target.addEventListener('wheel', handleMouseMove.bind(this))
  document.addEventListener('keypress', handleKeyEvent.bind(this))
  document.addEventListener('keydown', handleKeyEvent.bind(this))
  document.addEventListener('keyup', handleKeyEvent.bind(this))

  // Fullscreen
  document.addEventListener('keydown', function (e) {
    const fsCommand = (
      this.keybd.down.Alt &&
      this.keybd.down.Enter
    )
    if (fsCommand && !document.fullscreen) {
      target.requestFullscreen()
    } else if (fsCommand && document.fullscreen) {
      document.exitFullscreen()
    }
  }.bind(this))

  // Event Triggers
  const supportedEvents = [
    'click', 'wheel', 'mouseup', 'mousedown',
    'keypress', 'keydown', 'keyup'
  ]
  const aliasEvents = {
    click: ['touchstart'],
    mousedown: ['touchstart'],
    mouseup: ['touchend']
  }
  for (const i in supportedEvents) {
    const eventName = supportedEvents[i]
    const eventHandler = function () {
      this.triggers[eventName] = 1
    }.bind(this)

    target.addEventListener(eventName, eventHandler)

    if (aliasEvents[eventName]) {
      for (const j in aliasEvents[eventName]) {
        target.addEventListener(
          aliasEvents[eventName][j], eventHandler
        )
      }
    }
  }

  // Trigger functions
  this.triggerSprite = function (sprite, x, y) {
    const mX = this.mouse.x
    const mY = this.mouse.y
    const mouseOver = (
      mX >= x && mX <= x + sprite._w &&
      mY >= y && mY <= y + sprite._h
    )
    if (mouseOver) {
      for (const i in sprite._events.mouse) {
        if (this.triggers[i]) {
          sprite._events.mouse[i].bind(sprite)(mX, mY)
        }
      }
    }
    if (this.keybd.active) {
      for (const i in sprite._events.keybd) {
        if (this.triggers[i]) {
          sprite._events.keybd[i].bind(sprite)(this.triggers[i])
        }
      }
    }
  }
  this.resetTriggers = function () {
    for (const i in this.triggers) {
      if (i !== 'active') {
        this.triggers[i] = 0
      }
    }
    this.keybd.active = false
  }
}

function Canvas (canvasElement, width, height) {
  const AudioContext = window.AudioContext || window.webkitAudioContext

  Object.assign(this, {
    ctx: canvasElement.getContext('2d'),
    evt: new Events(canvasElement),
    sfx: new AudioContext(),
    width: width,
    height: height,
    speed: 24
  })

  canvasElement.width = width
  canvasElement.height = height
  canvasElement.style.cssText = (
    'image-rendering: -moz-crisp-edges;' +
    'image-rendering: -webkit-crisp-edges;' +
    'image-rendering: pixelated;'
  )
  this.ctx.imageSmoothingEnabled = false

  this.getVP = new Array(2)
  this.setVP = function (a0, a1, b0, b1) {
    const cond0 = a0 < b0
    const cond1 = a0 >= b1 || a1 < b0
    const cond2 = a1 < b1

    this.getVP.length = 2

    if (cond1) {
      this.getVP.length = 0
    } else if (cond0 && cond2) {
      this.getVP[0] = b0
      this.getVP[1] = a1 - b0
    } else if (cond0 && !cond2) {
      this.getVP[0] = b0
      this.getVP[1] = b1 - b0
    } else if (!cond0 && cond2) {
      this.getVP[0] = a0
      this.getVP[1] = a1 - a0
    } else if (!cond0 && !cond2) {
      this.getVP[0] = a0
      this.getVP[1] = b1 - a0
    } else {
      this.getVP.length = 0
    }
  }

  this.clearFrame = function () {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  this.setAlpha = function (n) {
    this.ctx.globalAlpha = n
  }

  this.drawRect = function (color, x, y, w, h) {
    let newX, newW, newY, newH

    this.setVP(x, x + w, 0, this.width)
    if (this.getVP.length) {
      newX = this.getVP[0]
      newW = this.getVP[1]
    }

    this.setVP(y, y + h, 0, this.height)
    if (this.getVP.length) {
      newY = this.getVP[0]
      newH = this.getVP[1]
    }

    if (!isNaN(newX + newW + newY + newH)) {
      this.ctx.fillStyle = color
      this.ctx.fillRect(
        newX, newY,
        newW, newH
      )
    }
  }

  this.drawImage = function (src, x, y, w, h, sx, sy, sw, sh) {
    let newX, newW, newY, newH
    const image = FILES.getFile(src)

    this.setVP(x, x + w, 0, this.width)
    if (this.getVP.length) {
      newX = this.getVP[0]
      newW = this.getVP[1]
    }

    this.setVP(y, y + h, 0, this.height)
    if (this.getVP.length) {
      newY = this.getVP[0]
      newH = this.getVP[1]
    }

    if (image && !isNaN(newX + newW + newY + newH)) {
      this.ctx.drawImage(
        image,
        sx + (newX - x),
        sy + (newY - y),
        newW, newH,
        newX, newY,
        newW, newH
      )
    }
  }

  this.drawSprite = function (sprite, x, y, a, root, parent) {
    const currentFrame = sprite._frames[sprite._frame]
    const currentAction = sprite._actions[sprite._frame]

    // Debug
    sprite._children = currentFrame
    sprite._parent = parent
    sprite._root = root

    // Bottleneck loop
    this.setAlpha(sprite._alpha * a)
    for (const i in currentFrame) {
      const curr = currentFrame[i]
      if (curr._render === 'sprite') {
        this.drawSprite(
          curr,
          curr._x + x, curr._y + y,
          curr._alpha * a, root, parent
        )
      } else if (curr._render === 'rect') {
        this.drawRect(
          curr._string,
          curr._x + x,
          curr._y + y,
          curr._w, curr._h
        )
      } else if (curr._render === 'image') {
        this.drawImage(
          curr._src,
          curr._x + x,
          curr._y + y,
          curr._w, curr._h,
          curr._sx, curr._sy,
          curr._sw, curr._sh
        )
      } else if (curr._render === 'audio') {
        const audioFile = FILES.getFile(curr._src)
        audioFile.ctx = this.sfx

        // Inherit parent loop/volume/pause
        curr._loop = curr._parent._loop
        curr._volume = curr._parent._volume

        audioFile.loop = curr._parent._loop
        audioFile.volume = curr._parent._volume

        if (!audioFile.bindedSprite !== curr._parent) {
          audioFile.bindedSprite = curr._parent
          audioFile.onended = function () {
            curr._parent._paused = true
          }
        }

        if (audioFile.paused !== curr._parent._paused) {
          if (audioFile.paused) {
            audioFile.play()
          } else {
            audioFile.pause()
          }
          curr._paused = curr._parent._paused
        }
      }
    }

    // Execute events
    if (root && sprite !== root) {
      this.evt.triggerSprite(sprite, x, y)
    }

    if (sprite._events.enterFrame) {
      sprite._events.enterFrame.bind(sprite)()
    }

    // Execute action
    if (currentAction) {
      if (Array.isArray(currentFrame)) {
        currentAction.bind(sprite)(
          ...currentFrame
        )
      } else {
        currentAction.bind(sprite)({
          _children: currentFrame,
          ...currentFrame,
          _parent: parent,
          _root: root
        })
      }
    }

    if (!sprite._paused && sprite._frames.length > 0) {
      sprite.nextFrame()
    }
  }

  this.renderSprite = function (sprite) {
    if (sprite && !this.sprite) {
      sprite._root = sprite
      sprite.mouse = { _x: 0, _y: 0 }
      sprite.key = this.evt.keybd.down
      this.sprite = sprite
      this.lastTime = 0
    }

    // Throttle
    const lastTime = this.lastTime
    const interval = 1000 / this.speed
    const currentTime = performance.now()
    const difference = currentTime - lastTime

    if (difference > interval) {
      this.clearFrame()
      this.lastTime = currentTime - (difference % interval)
      this.sprite.mouse._x = this.evt.mouse.x
      this.sprite.mouse._y = this.evt.mouse.y
      this.drawSprite(this.sprite, 0, 0, 1, this.sprite)
      this.evt.resetTriggers()
    }

    requestAnimationFrame(this.renderSprite.bind(this))
  }
}

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

function NativeIMG (src, x, y, w, h, sx, sy, sw, sh) {
  this._x = x
  this._y = y
  this._w = w
  this._h = h
  this._sx = sx
  this._sy = sy
  this._sw = sw
  this._sh = sh
  this._src = src
  this._parent = null
  this._render = 'image'
}

function NativeSFX (src) {
  this._loop = false
  this._paused = false
  this._volume = 1
  this._src = src
  this._parent = null
  this._render = 'audio'
}

function NativeGFX (shape, x, y, w, h) {
  this._x = x
  this._y = y
  this._w = w
  this._h = h
  this._parent = null
  this._string = null
  this._shape = shape
  this._render = 'rect'
}

NativeGFX.prototype = {
  get _color () {
    const color = UTILS.isHex(this._string) || UTILS.isRGB(this._string)
    return color
  },

  set _color (src) {
    const color = UTILS.isHex(src) || UTILS.isRGB(src)

    if (this._parent) {
      this._parent._alpha = color.length > 3
        ? color[3] / 255 : 1
    }

    this._string = `rgb(${color.slice(0, 3)}`
  }
}

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
