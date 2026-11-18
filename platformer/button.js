class Button {
  constructor(ui, x, y, image, tint, overlay = null, center = true, options = {}) {
    this.ui = ui
    
    this._x = x
    this._y = y

    this._image = image
    this._overlay = overlay
    this.tint = tint

    this.w = images[this.image].width * 2
    this.h = images[this.image].height * 2

    this.center = center

    this.drawIf = options.drawIf || (() => true)
  }

  isInside(x, y) {
    return this.show && x >= this.x && y >= this.y && x <= this.x + this.w && y <= this.y + this.h
  }

  hovering = false

  lightness = 0
  hoverLightness = 0.2
  lightnessSpeed = 0.02

  tick() {
    if (this.hovering && this.lightness < this.hoverLightness)
      this.lightness = Math.min(this.lightness + this.lightnessSpeed, this.hoverLightness)
    else if (!this.hovering && this.lightness > 0)
      this.lightness = Math.max(this.lightness - this.lightnessSpeed, 0)

    this.x = typeof this._x === "function" ? this._x() : this._x
    this.y = typeof this._y === "function" ? this._y() : this._y

    if (this.center) {
      this.x -= this.w / 2
      this.y -= this.h / 2
    }

    this.show = this.drawIf(this)
  }

  get image() {
    return typeof this._image === "function" ? this._image(this) : this._image
  }

  get overlay() {
    return this._overlay && (typeof this._overlay === "function" ? this._overlay(this) : this._overlay)
  }

  draw() {
    if (!this.show) return
    
    let {x, y, w, h} = this

    tintedImage(x, y, w, h, this.tint, images[this.image], {
      lightness : this.lightness,
      opacity : this.ui.opacity
    })

    let overlay = images[this.overlay]

    if (overlay) {
      let ow = overlay.width * 2,
          oh = overlay.height * 2
      
      image(x + (w - ow) / 2, y + (h - oh) / 2, ow, oh, overlay, {
        lightness : this.lightness,
        opacity : this.ui.opacity
      })
    }
  }
}
