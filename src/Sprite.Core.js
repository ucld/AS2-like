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
