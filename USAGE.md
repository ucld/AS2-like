## Sprite

### Constructors

`new Sprite(String source, Number x, Number y, Number w, Number h)`

#### Clip

`new Clip(Number x, Number y, Number w, Number h)` or

`new Sprite('_clip_', Number x, Number y, Number w, Number h)`

#### AudioClip

`new AudioClip(String source)` or

`new Sprite(String source, 0, 0, 0, 0)`

### Functions
`.stop()`

`.play()`

`.nextFrame()`

`.gotoFrame(Number n)`

`.addFrame(Object frameSprites)`

`.addToFrame(Number frame, Object frameSprites)`

`.addAction(Function frameAction)`

`.addToAction(Number frame, Function frameAction)`

`.renderTo(Element canvas)`

`.onEnterFrame(Function callback)`

`.onMouseDown(Function callback)`

`.onMouseMove(Function callback)`

`.onMouseUp(Function callback)`

`.onClick(Function callback)`

`.onKeyDown(Function callback)`

`.onKeyPress(Function callback)`

`.onKeyUp(Function callback)`

### Properties

`._x (Number)`

`._y (Number)`

`._w (Number)`

`._h (Number)`

`._frame (Number)`

`._alpha (Number)` - From 0 - 1

`._volume (Number)` - AudioClip only, from 0 - 1

`._loop (Boolean)` - AudioClip only

`._paused (Boolean)`

`._parent (Sprite)`

`._root (Sprite)`

`._root.mouse._x (Number)`

`._root.mouse._y (Number)`

`._root.key (Object)`
