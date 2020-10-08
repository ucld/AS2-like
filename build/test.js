window.onload = function () {
  const sound = new AudioClip('assets/sound.mp3')

  a = new Clip(0, 0, 320, 320)
    .addFrame([
      new Sprite('rgb(128,128,128)', 0, 0, 320, 320),
      new Sprite('assets/image.jpg', 0, 0, 3877, 2482),
      new Sprite('rgb(255,0,0)', 0, 0, 32, 32),
      { _x: 0, _y: 0 },
      // Sub-Bounce
      new Sprite('rgba(255,255,0, 128)', 128, 64, 64, 64)
        .addToFrame(0, {
          bounce2: new Sprite('assets/animated.png', 16, 4, 128, 128)
            .onClick(
              function () {
                //alert('Clicked 2!')
                sound._loop = !sound._loop
                sound.play()
              }
            ),
          speed: { _x: 2, _y: 2 }
        })
        // Sub-Bounce action
        .addAction(
          function({ bounce2, speed }) {
            bounce2._x += speed._x
            bounce2._y += speed._y
            if(bounce2._x <= 0 || bounce2._x >= this._w) {
              speed._x = -speed._x
            }
            if(bounce2._y <= 0 || bounce2._y >= this._h) {
              speed._y = -speed._y
            }
          }
        ),
      { _x: 4, _y: 4 },
      sound
    ])
    // Main action
    .addAction(
      function (bg, image, red, d, bounce, speed) {
        red._x = this._root.mouse._x
        red._y = this._root.mouse._y
        bounce._x += speed._x
        bounce._y += speed._y
        if (bounce._x <= 0 || bounce._x + bounce._w >= this._w) {
          speed._x = -speed._x
        }
        if (bounce._y <= 0 || bounce._y + bounce._h >= this._h) {
          speed._y = -speed._y
        }
        if(image._x === d._x && image._y === d._y) {
          d._x = -Math.floor(Math.random() * (image._w - 320))
          d._y = -Math.floor(Math.random() * (image._h - 320))
        } else {
          image._x += (image._x < d._x) - (image._x > d._x)
          image._y += (image._y < d._y) - (image._y > d._y)
        }
      }
    )
    .renderTo(document.querySelector('#c'))
}