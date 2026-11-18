class Cog extends Collectible {
  constructor(platform, x, y, maxY) {
    super("cog", platform, x, y, maxY)
  }

  pickupEffectColor = [0.3607843137254902, 0.24705882352941178, 0.18823529411764706, 1]

  updateStats() {
    game.stats.cogs++
    game.stats.totalCogs++
  }
}

