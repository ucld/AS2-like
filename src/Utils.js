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
