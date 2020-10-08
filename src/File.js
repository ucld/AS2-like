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
