class Level {
  constructor(seed = null) {
    this.setSeed = seed !== null

    if (seed) {
      this.rawSeed = seed
      
      let [seedNum, startPos] = String(seed).split("@")

      this.seed = parseInt(seedNum)
      
      if (startPos)
        this.startPos = parseInt(startPos)
    } else
      this.rawSeed = this.seed = hashString(btoa(Math.random()))
    
    this.random = createRandomGenerator(this.seed)
    
    this.generatePlatforms()

    this.player = new Player(this, 0, this.platforms[0].y - 150)

    if (this.startPos) {
      this.generateToPlatform(this.startPos)
      this.moveToPlatform(this.startPos)
    }
  }

  score = 0

  get distance() {
    return Math.trunc((this.player.deathX ?? this.player.x) / 60)
  }

  gravity = 0.5
  
  height = 450
  
  platforms = []
  
  nextPlatformX = 10
  lastPlatformY = this.height / 2

  spikeChance = -0.2

  platformNum = 0

  generatePlatforms() {
    while (this.nextPlatformX - this.cameraPos < width)
      this.generateNextPlatform()
  }

  generateNextPlatform() {
    let y = this.lastPlatformY + (this.random() * 2 - 1) * 150

    y = clamp(y, 0, this.height - 60)

    let platform = new Platform(this, this.nextPlatformX, y, {
      size : this.platformNum === 0 ? "x" : null,
      num : ++this.platformNum
    })
    
    this.platforms.push(platform)

    this.lastPlatformY = y

    this.nextPlatformX += platform.w + 100 + this.random() * 350
  }

  generateToPlatform(num) {
    while (this.platformNum < num)
      this.generateNextPlatform()
  }

  moveToPlatform(num) {
    let platform = this.platforms.find(platform => platform.num === num)

    if (!platform) return

    this.player.x = platform.x - this.player.w
    this.player.y = platform.y - this.player.h - 10

    this.cameraPos = platform.x - width * 0.2
  }

  rectPlatformOverlap(x, y, w, h) {
    return this.platforms.find(platform => platform.overlapsRect(x, y, w, h))
  }

  jumps = 0

  jump() {
    this.player.jumpPressed = true
  }

  deathIntensity = 0

  fallDeathDelay = 20
  fallDeathDelayRemaining = 0

  deathMenuDelay = 30
  deathMenuDelayRemining = 0

  death(cause) {
    hidePauseButton()

    if (!this.setSeed)
      checkAchievementGroup("exactMeters")
    
    if (cause === "fall") {
      this.fallDeathDelayRemaining = this.fallDeathDelay

      game.stats.deathsByFall++
    } else {
      this.deathIntensity = 0.7

      this.deathMenuDelayRemaining = this.deathMenuDelay

      game.stats.deathsBySpike++
    }

    this.updateStats()

    if (!this.setSeed) {
      checkAchievementGroup("runCount")

      if (this.score > parseInt(localStorage.getItem("platformer2AllTimeHighscore")))
        localStorage.setItem("platformer2AllTimeHighscore", this.score)
    }
  }

  highscoreBeforeRun = game.stats.highscore
  bestDistBeforeRun = game.stats.bestDistance

  updateHighscore() {
    if (this.score > game.stats.highscore)
      game.stats.highscore = this.score
  }

  updateBestDistance() {
    if (this.distance > game.stats.bestDistance)
      game.stats.bestDistance = this.distance
  }

  updateStats() {
    if (!this.setSeed) {
      this.updateHighscore()
      this.updateBestDistance()
    }

    game.stats.totalJumps += this.jumps
    game.stats.totalDeaths++

    game.saveStats()
  }

  screenPos(x, y) {    
    return [this.screenPosX(x), this.screenPosY(y)]
  }

  screenPosX(x) {
    return x - this.cameraPos
  }
  screenPosY(y) {
    return y + (height - this.height) / 2 + this.yOffset
  }

  cameraPos = 0
  get cameraPadding() {
    return width / 4
  }

  doubleJumpEffect = null

  createDoubleJumpEffect(x, y, xVel, yVel, strength = 1) {
    let angle = Math.atan2(yVel, xVel) + Math.PI / 2,
        dx = Math.cos(angle) * 4,
        dy = Math.sin(angle) * 4
    
    this.doubleJumpEffect = {
      x1 : x - dx,
      y1 : y - dy,
      x2 : x + dx,
      y2 : y + dy,
      strength : strength,
      time : 0,
      dx,
      dy,
      xVel,
      yVel
    }
  }

  coins = []

  lastDistance = 0

  lastPlatformSkipped = false

  tick() {
    if (this.deathIntensity > 0)
      this.deathIntensity -= 0.01
    
    if (game.uiStack.length && game.topUI?.type !== "death") return
    
    if (this.fallDeathDelayRemaining !== 0) {
      if (--this.fallDeathDelayRemaining <= 0) {
        if (this.screenPosY(this.player.y) < height)
          this.fallDeathDelayRemaining = -1
        else {
          if (sfx)
            fallDeathSound.play()
          
          this.deathIntensity = 0.7
          this.deathMenuDelayRemaining = this.deathMenuDelay
  
          this.fallDeathDelayRemaining = 0
        }
      }
    }

    if (this.deathMenuDelayRemaining > 0) {
      if (--this.deathMenuDelayRemaining <= 0)
        game.showUI("death", true)
    }

    if (this.player.alive) {
      game.stats.timePlayed++
      
      let prevScore = this.score
      
      this.platforms.forEach(platform => {
        if (!platform.scored && platform.x + platform.w < this.player.x) {
          this.score += platform.calcScore()

          platform.scored = true

          if (!this.setSeed) {
            if (platform.landedOn) {
              game.stats.platformsSurvived++
              game.stats.platformsSurvivedBySize[platform.size]++

              if (this.lastPlatformSkipped) {
                game.stats.platformsSkipped++
                
                checkAchievementGroup("skipPlatforms")
              }

              this.lastPlatformSkipped = false

              game.saveStats()

              checkAchievementGroup("survivePlatforms")
            } else
              this.lastPlatformSkipped = true
  
            if (platform.coinCollected && !platform.landedOn && !platform.sideCoin)
              achieve("midairCoin")
          }
        }
      })

      if (!this.setSeed) {
        if (this.score > prevScore) {
          game.stats.totalScore += this.score - prevScore
  
          checkAchievementGroup("minScore")
          checkAchievementGroup("scoreInDist")
          
          this.updateHighscore()
        }
  
        if (this.distance > this.lastDistance) {
          game.stats.totalDistance += this.distance - this.lastDistance
  
          checkAchievementGroup("totalDist")
          
          this.updateBestDistance()
          
          this.lastDistance = this.distance
        }
      }

      for (let i of this.coins)
        if (rectanglesOverlap(this.player.x, this.player.y, this.player.w, this.player.h, i.x, i.y, i.w, i.h))
          i.collect()
    }

    this.coins.forEach(x => x.tick())
    
    this.platforms = this.platforms.filter(platform => platform.x + platform.w >= this.cameraPos)

    let targetCameraPos = this.player.x - this.cameraPadding

    if (targetCameraPos > this.cameraPos)
      this.cameraPos = Math.min(targetCameraPos, this.cameraPos + (targetCameraPos - this.cameraPos) * 0.1 + 0.01)
    
    this.generatePlatforms()

    this.coins = this.coins.filter(coin => coin.x + coin.w >= 0 && (!coin.collected || coin.opacity > 0))

    this.player.tick()

    if (this.doubleJumpEffect) {
      let effect = this.doubleJumpEffect

      effect.time++

      effect.strength -= 0.05

      if (effect.strength <= 0)
        this.doubleJumpEffect = null
      else {
        let dx = effect.dx * effect.strength,
            dy = effect.dy * effect.strength
        
        effect.x1 -= dx
        effect.y1 -= dy
        
        effect.x2 += dx
        effect.y2 += dy
      }
    }

    this.yOffset = clamp((height - this.height) / 2, 0, 80)

    id("score").innerText = this.score
    id("distance").innerText = this.distance
  }

  draw() {
    rectangle(0, 0, width, height, colors.bgLight, colors.bgLight, colors.bgDark, colors.bgDark)
    
    background(
      images.factoryWooden,
      images.factoryTransition,
      images.factory,
      images.factoryBgWooden,
      images.factoryBgTransition,
      images.factoryBg,
      0.5,
      0.3,
      this.cameraPos / 10_000,
      this.cameraPos / 20_000,
      2,
      1
    )
    
    this.platforms.forEach(x => x.draw())

    this.coins.forEach(x => x.draw())

    let {doubleJumpEffect : doubleJump} = this

    if (doubleJump)
      doubleJumpEffect(
        ...this.screenPos(doubleJump.x1, doubleJump.y1),
        ...this.screenPos(doubleJump.x2, doubleJump.y2),
        doubleJump.strength
      )

    this.player.draw()
    
    if (this.deathIntensity > 0)
      deathEffect(this.deathIntensity)
  }
}
