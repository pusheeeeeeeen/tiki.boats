const platformSizes = {s : 60, m : 140, l : 200, x : 300}

class Platform {
  constructor(level, x, y, options = {}) {
    this.level = level

    this.x = x
    this.y = y

    this.num = options.num || 0

    let {size, color, variant, spikes, rareSpikes, spikeIndex, coin, sideCoin, cog} = randomizePlatform(level.random, this.num, level.spikeChance, options)

    this.size = size
    this.variant = variant
    this.color = platformColors[color]
    
    this.w = platformSizes[size]
    this.h = 60

    this.useChains = this.y < level.height / 2

    this.image = images[`platform${this.size.toUpperCase()}${this.variant + 1}`]

    if (spikes) {
      this.rareSpikes = rareSpikes
      
      this.spikes = (rareSpikes ? rareSpikePool : commonSpikePool)[spikeIndex].map(x => new Spike(this, x(this)))

      // max starting spike chance at num ≥ 60
      level.spikeChance = Math.min(0.4, this.num / 150)
    } else
      // max spike chance increase at num ≥ 60
      level.spikeChance += Math.min(0.09, 0.05 + this.num / 1500)

    if (coin) {
      let coinPos

      if (sideCoin) {
        this.sideCoin = true
        
        coinPos = [this.x - 21, this.y - 100, this.y + this.h / 2 - 20]
      } else
        coinPos = [this.x + this.w / 2, this.y - 200]
      
      new Coin(this, ...coinPos)
      this.hasCoin = true
    }

    if (cog) {
      new Cog(this, this.x + this.w / 2, this.y - 200)
    }
  }

  spikes = []

  scored = false

  calcScore() {
    return (this.spikes.length ? 2 + this.rareSpikes : 1) + (this.size === "s")
  }

  overlapsRect(x, y, w, h) {
    return rectanglesOverlap(x, y, w, h, this.x, this.y, this.w, this.h)
  }

  overlapsDeadly(x, y, w, h) {
    return this.spikes.some(spike => spike.overlapsRect(x, y, w, h))
  }

  draw() {
    let [x, y] = this.level.screenPos(this.x, this.y)

    tintedImage(x, y, this.w, this.h, colors[this.color], this.image)

    if (this.useChains) {
      if (this.size === "s")
        chain(x + this.w / 2 - 5, y)
      else {
        chain(x + 20, y)
        chain(x + this.w - 30, y)

        if (this.size === "x") {
          chain(x + 45, y)
          chain(x + this.w - 55, y)
        }
      }
    } else {
      if (this.size === "x") {
        pipe(x + 50, height - y - this.h)
        pipe(x + this.w - 100, height - y - this.h)
      } else
        pipe(x + this.w / 2 - 25, height - y - this.h)
    }

    this.spikes.forEach(x => x.draw())
  }
}