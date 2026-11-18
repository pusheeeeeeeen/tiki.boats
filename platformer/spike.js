class Spike {
  constructor(platform, x) {
    this.platform = platform
    this.level = platform.level
    
    let variant = this.level.random() < 0.4
    
    this.img = variant ? images.spike2 : images.spike

    this.w = this.img.width * 2
    this.h = this.img.height * 2

    this._x = x - this.w / 2
  }

  get x() {
    return this.platform.x + this._x
  }
  get y() {
    return this.platform.y - this.h
  }

  overlapsRect(x, y, w, h) {
    return rectanglesOverlap(x, y, w, h, this.x + this.w * 0.25, this.y + this.h * 0.3, this.w / 2, this.h / 2)
  }

  draw() {
    image(...this.level.screenPos(this.x, this.y), this.w, this.h, this.img)

    // rectangle(...this.level.screenPos(this.x + this.w * 0.25, this.y + this.h * 0.3), this.w / 2, this.h / 2, [255, 0, 0])
  }
}
