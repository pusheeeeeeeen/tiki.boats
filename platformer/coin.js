function attemptPurchase(cost, confirmMsg = null) {
  if (game.stats.coins >= cost && (!confirmMsg || confirm(confirmMsg))) {
    game.stats.coins -= cost

    game.saveStats()

    return true
  } else return false
}

function costHTML(cost) {
  return `
    <span class = "cost">
      <img src = "./assets/images/coin-icon.png">
      ${cost}
    </span>
  `
}

class Coin extends Collectible {
  constructor(platform, x, y, maxY) {
    super("coin", platform, x, y, maxY)
  }

  pickupEffectColor = [1, 0.8, 0, 1]

  updateStats() {
    game.stats.coins++
    game.stats.totalCoins++

    checkAchievementGroup("coins")
  }
}
