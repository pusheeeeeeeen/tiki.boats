class Entity {
  constructor(level, x, y, w, h, options = {}) {
    this.level = level
    
    this.x = x
    this.y = y
    
    this.w = w
    this.h = h

    this.xVel = options.xVel || 0
    this.yVel = options.yVel || 0
    
    this.gravityMult = options.gravityMult ?? 1
  }

  get gravity() {
    return this.gravityMult * this.level.gravity
  }

  overlaps(xMove, yMove) {
    return this.level.rectPlatformOverlap(this.x + xMove, this.y + yMove, this.w, this.h)
  }

  attemptMove(xMove, yMove) {
    if (this.xVel && !this._attemptMove(xMove, 0)) {
      this.nudge(Math.sign(this.xVel), 0)
      
      this.xVel = 0
    }

    if (this.yVel && !this._attemptMove(0, yMove)) {
      this.nudge(0, Math.sign(this.yVel))
      
      this.yVel = 0
    }
  }

  _attemptMove(xMove, yMove) {
    this.move(xMove, yMove)

    if (this.level.rectPlatformOverlap(this.x, this.y, this.w, this.h)) {
      this.move(-xMove, -yMove)

      return false
    }

    return true
  }

  move(xMove, yMove) {
    this.x += xMove
    this.y += yMove
  }

  smallestMovement = 0.5

  nudge(x, y) {
    while (this._attemptMove(x * this.smallestMovement, y * this.smallestMovement)) {}
  }

  tick() {
    this.yVel += this.gravity
    
    this.attemptMove(this.xVel, this.yVel)
  }

  draw() {
    rectangle(...this.level.screenPos(this.x, this.y), this.w, this.h, [255, 0, 0])
  }
}
