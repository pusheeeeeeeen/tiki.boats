let collectibleSounds = {
  coin: new Howl({
    src: ["./assets/audio/coin.wav"],
    volume: soundVolume
  }),
  cog: new Howl({
    src: ["./assets/audio/cog.wav"],
    volume: soundVolume * 10
  })
}

class Collectible extends Entity {
  constructor(image, platform, x, y, maxY) {
    let img = images[image]

    super(platform.level, x - img.width / 8, y - img.height, img.width / 4, img.height * 2)

    this.platform = platform
    this.type = image
    this.img = img
    this.maxY = maxY

    this.level.coins.push(this)
  }

  collected = false

  visualOffset = 5

  updateStats() {}

  collect() {
    if (this.collected) return

    if (sfx) collectibleSounds[this.type].play()

    if (!this.level.setSeed) {
      this.updateStats()

      game.saveStats()
    }

    this.platform.coinCollected = true

    this.gravityMult = 0.3
    this.yVel = -5

    this.opacity = 1
    this.targetOpacity = 0

    this.collected = true
  }

  progress = 0

  opacity = 0
  targetOpacity = 1

  tick() {
    super.tick()

    if (this.y > this.maxY)
      this.y = this.maxY

    this.opacity = clamp(this.opacity + Math.sign(this.targetOpacity - this.opacity) * 0.02, 0, 1)

    if (!this.collected || this.progress >= 0.125)
      this.progress += 0.025

    if (this.progress >= 1)
      this.progress = 0

    if (this.collected) {
      this.effectTime += 0.02

      if (this.yVel >= 0) {
        this.yVel = 0
        this.gravityMult = 0
      }
    }
  }

  effectTime = 0
  pickupEffectColor = [1, 1, 1, 1]

  get offset() {
    return Math.sin(this.progress * Math.PI) ** 0.8
  }

  draw() {
    let {offset} = this

    if (this.collected) {
      let [x, y] = this.level.screenPos(this.x + this.w / 2, this.y + this.h / 2 - this.visualOffset)

      coinPickupEffect(x, y - offset, this.w, this.effectTime, this.pickupEffectColor)
    }

    coin(...this.level.screenPos(this.x, this.y - this.visualOffset), this.w, this.h, this.img, this.progress, offset, {opacity : this.opacity})
  }
}
