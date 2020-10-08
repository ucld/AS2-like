
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
