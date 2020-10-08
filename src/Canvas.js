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
