if (navigator.maxTouchPoints) {
  id("touchscreen-banner").classList.remove("hidden")

  id("close-touchscreen-banner").addEventListener("click", () => {
    id("touchscreen-banner").classList.add("hidden")
  })
}

id("replay-seed").onclick = e => {
  navigator.clipboard.writeText(id("replay-seed").innerText)
}

////////////////////////////////

function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 + w1 > x2 && y1 + h1 > y2 && x1 < x2 + w2 && y1 < y2 + h2
}

function fullscreenImageCoords(image) {
  let w = image.width, h = image.height
  
  let imgWidth = Math.max(width, height * w / h),
      imgHeight = imgWidth * h / w

  return [
    (width - imgWidth) / 2,
    (height - imgHeight) / 2,
    imgWidth,
    imgHeight
  ]
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1)
}

////////////////////////////////

const canvas = id("canvas"), gl = canvas.getContext("webgl2")

const colors = {
  green : [74, 187, 115],
  blue : [131, 189, 232],
  purple : [182, 115, 201],
  bgDark : [21, 38, 66],
  bgLight : [80, 118, 171],
  blueStripeDark : [41, 60, 92],
  blueStripeLight : [47, 67, 102],
  greenStripeDark : [41, 92, 60],
  greenStripeLight : [47, 102, 67],
  redStripeDark : [92, 41, 60],
  redStripeLight : [102, 47, 67],
  blackStripeDark : [48, 53, 59],
  blackStripeLight : [51, 56, 63]
}

////////////////////////////////

class Game {
  constructor() {
    this.showUI("start")
    //                                legacy highscore storage
    this.stats.highscore ||= parseInt(localStorage.getItem("platformer2Highscore") || "0")
    this.stats.bestDistance ||= 0
    
    this.stats.totalScore ||= 0
    this.stats.totalDistance ||= 0
    this.stats.totalJumps ||= 0

    this.stats.totalDeaths ||= 0
    this.stats.deathsByFall ||= 0
    this.stats.deathsBySpike ||= 0
    this.stats.totalResets ||= 0
    
    this.stats.platformsSurvived ||= 0
    this.stats.platformsSurvivedBySize ||= {
      s : 0,
      m : 0,
      l : 0,
      x : 0
    }
    this.stats.platformsSkipped ||= 0

    this.stats.coins ||= 0
    this.stats.totalCoins ||= this.stats.coins

    this.stats.cogs ||= 0
    this.stats.totalCogs ||= this.stats.cogs

    this.stats.timePlayed ||= 0
    this.stats.created ||= Date.now()
  }

  updateMenuStats() {
    // null = look up in game.stats
    const stats = {
      highscore : null,
      bestDistance : null,
      totalScore : null,
      totalDistance : null,
      totalJumps : null,
      totalDeaths : null,
      deathsByFall : `${this.stats.deathsByFall} (${this.stats.totalDeaths ? (this.stats.deathsByFall / this.stats.totalDeaths * 100).toFixed(1) : "--"}%)`,
      deathsBySpike : `${this.stats.deathsBySpike} (${this.stats.totalDeaths ? (this.stats.deathsBySpike / this.stats.totalDeaths * 100).toFixed(1) : "--"}%)`,
      totalResets : null,
      platformsSurvived : null,
      platformsSurvivedS : this.stats.platformsSurvivedBySize.s,
      platformsSurvivedM : this.stats.platformsSurvivedBySize.m,
      platformsSurvivedL : this.stats.platformsSurvivedBySize.l,
      platformsSurvivedX : this.stats.platformsSurvivedBySize.x,
      platformsSkipped : null,
      coins : null,
      totalCoins : null,
      timePlayed : this.formatTime(this.stats.timePlayed),
      created : new Date(this.stats.created).toLocaleString()
    }

    for (let [name, val] of Object.entries(stats)) {
      val ??= this.stats[name]

      id(`stat-${name}`).innerText = val
    }
  }

  formatTime(ticks) {
    let totalSeconds = Math.floor(ticks / 60),
        totalMinutes = Math.floor(totalSeconds / 60),
        totalHours = Math.floor(totalMinutes / 60),
        totalDays = Math.floor(totalHours / 24)

    return `${
      totalDays ? `${totalDays}d ` : ""
    }${
      totalHours ? `${totalHours % 24}h ` : ""
    }${
      totalMinutes ? `${totalMinutes % 60}m ` : ""
    }${
      totalSeconds % 60
    }s`
  }

  start(seed = null) {
    this.reset(seed) 
  }

  reset(seed = null) {
    this.level = new Level(seed)
    
    showPauseButton()
  }

  stats = JSON.parse(atob(localStorage.getItem("platformer2Stats") || btoa("{}")))

  saveStats() {
    localStorage.setItem("platformer2Stats", btoa(JSON.stringify(this.stats)))
  }

  updateMenuInfo() {
    id("menu-score").innerText = this.level.score
    id("menu-distance").innerText = this.level.distance
    id("menu-highscore").innerText = this.level.highscoreBeforeRun || "none"
    id("menu-best-distance").innerText = this.level.bestDistBeforeRun || 0

    id("menu-info").classList.toggle("show-replay-disclaimer", this.level.setSeed)
  }

  ui = {
    start : new UI("start"),
    pause : new UI("pause"),
    death : new UI("death"),
    achievements : new UI("achievements")
  }

  uiStack = []

  fadingInUI = null

  get topUI() {
    return this.uiStack[this.uiStack.length - 1]
  }

  showUI(ui, fade = false) {  
    if (!(ui instanceof UI))
      ui = this.ui[ui]

    if (this.uiStack.includes(ui)) return
    
    if (this.fadingUI) {
      this.fadingUI.opacity = 0

      this.fadingUI = null
    }
    if (this.fadingInUI) {
      this.fadingInUI.opacity = 1

      this.fadingInUI = null
    }

    if (fade)
      this.fadingInUI = ui
    else
      ui.opacity = 1

    this.topUI?.onhide()

    ui.onshow()

    this.uiStack.push(ui)

    this.updateUIElements()
  }

  fadingUI = null

  hideUI(ui, fade = true) {
    if (this.fadingUI) {
      this.fadingUI.opacity = 0

      this.fadingUI = null
    }
    
    if (!(ui instanceof UI))
      ui = this.ui[ui]

    let uiObj = this.uiStack.splice(this.uiStack.indexOf(ui), 1, null)[0]

    ui.onhide()

    this.uiStack[this.uiStack.length - 2]?.onshow()

    if (uiObj && fade)
      this.fadingUI = uiObj
    
    this.updateUIElements()
  }

  updateUIElements() {
    if (!this.uiStack.filter(Boolean).length) {
      id("info").classList.remove("hidden")

      if (this.level.setSeed) {
        id("info").classList.add("show-replay-marker")
        id("replay-seed").innerText = this.level.seed
      } else
        id("info").classList.remove("show-replay-marker")
    } else
      id("info").classList.add("hidden")
  }

  mouseX = -1
  mouseY = -1

  mouseMoved = false
  clicked = false

  isMouseDown = false

  mousemove(x, y) {
    this.mouseX = x
    this.mouseY = y

    this.mouseMoved = true
  }

  mousedown() {
    this.clicked = true

    this.isMouseDown = true
  }

  mouseUp = false

  mouseup() {
    this.mouseUp = true

    this.isMouseDown = false
  }

  keysPressed = []

  keysDown = {}

  keydown(key) {
    this.keysPressed.push(key)

    this.keysDown[key] = true
  }

  keyup(key) {
    this.keysDown[key] = false
  }

  get levelFocused() {
    return this.level && !this.uiStack.length
  }

  tick() {
    let {topUI} = this
    
    if (topUI) {
      if (this.mouseMoved)
        topUI.mouseMoved(this.mouseX, this.mouseY)
      
      if (this.clicked)
        topUI.mousedown()

      if (this.mouseUp && !this.isMouseDown)
        topUI.mouseup()
    } else if (this.clicked)
      this.level?.jump()

    for (let i of this.keysPressed)
      if (i === "Space" || i === "ArrowUp")
        this.level?.jump()
      else if (i === "KeyR" && this.levelFocused) {
        this.reset()
        this.stats.totalResets++
      } else if (i === "Escape" && showingPauseButton)
        id("pause-button").click()

    this.keysPressed = []
    
    this.level?.tick()

    this.uiStack.forEach(x => x?.tick())

    this.uiStack = this.uiStack.filter(Boolean)

    if (this.fadingUI) {
      this.fadingUI.opacity -= 0.04

      if (this.fadingUI.opacity <= 0) {
        this.fadingUI.opacity = 0
        this.fadingUI = null
      }
    }

    if (this.fadingInUI) {
      this.fadingInUI.opacity += 0.02

      if (this.fadingInUI.opacity >= 1) {
        this.fadingInUI.opacity = 1
        this.fadingInUI = null
      }
    }

    this.mouseMoved = this.clicked = this.mouseUp = false

    document.body.style.cursor = this.topUI?.hovered ? "pointer" : "auto"
  }

  draw() {
    // console.time("frame")
    
    nextFramebuffer()
    
    this.level?.draw()
    
    this.uiStack[this.uiStack.length - 1]?.draw()
    this.fadingUI?.draw()

    drawToCanvas()
    removeAlpha()

    // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    // console.timeEnd("frame")
  }
}

////////////////////////////////

let width, height

function resized() {
  let scale = devicePixelRatio
  
  width = innerWidth
  height = innerHeight

  canvas.width = width * scale
  canvas.height = height * scale

  gl.viewport(0, 0, canvas.width, canvas.height)

  updateFramebuffers()
}

let game

let lastTickTime, msPerTick = 1000 / 60

function frame() {
  // console.time()
  let frameTime = performance.now()
  if (!lastTickTime || frameTime - lastTickTime >= 200) {
    lastTickTime = frameTime - msPerTick
  }
  while (frameTime - lastTickTime > msPerTick - 3) {
    game.tick()
    lastTickTime += msPerTick
  }
  game.draw()
  // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
  // console.timeEnd()

  requestAnimationFrame(frame)
}

////////////////////////////////

const imageURLs = [
  // platforms
  "platform-l1",
  "platform-l2",
  "platform-l3",
  "platform-m1",
  "platform-m2",
  "platform-m3",
  "platform-s1",
  "platform-s2",
  "platform-s3",
  "platform-x1",
  // other level elements
  "spike",
  "spike2",
  "chain",
  "pipe",
  "coin",
  "cog",
  // player
  "player-default",
  "player-rainbow",
  "player-fire",
  "player-fire-idle",
  "player-earth",
  "player-pusheen",
  "player-pusheenbox",
  "player-steve",
  "player-jacobscat",
  // buttons
  "small-btn",
  "small-btn-pressed",
  // "large-btn",
  // "large-btn-pressed",
  "play",
  "play-pressed",
  "sound",
  "no-sound",
  "music",
  "no-music",
  "play-icon",
  "retry",
  "home",
  "ellipsis",
  // backgrounds
  "factory",
  "factory-wooden",
  "factory-transition",
  "factory-bg",
  "factory-bg-wooden",
  "factory-bg-transition",
  "pipe-background"
]

let itemsLoaded = 0, images = {}

const itemsToLoad = imageURLs.length + 2 // onload event, onPageShown

function loadImages() {
  for (let i of imageURLs) {
    loadImage(`./assets/images/${i}.png`)
      .then(({image, elem}) => {
        images[i.replaceAll(/-(.)/g, (_, letter) => letter.toUpperCase())] = image
  
        image.width = elem.naturalWidth
        image.height = elem.naturalHeight
  
        itemLoaded()
      })
      .catch(console.error)
  }
}

function itemLoaded() {
  itemsLoaded++

  id("loading-percentage").innerText = Math.round(itemsLoaded / itemsToLoad * 100)
  
  if (itemsLoaded === itemsToLoad) {
    id("loading-screen").classList.add("hidden")
    
    setupWebGL()
    
    resized()
  
    game = new Game()
  
    frame()
  
    onresize = () => {
      resized()
      game.draw()
    }

    onmousemove = e => {
      game.mousemove(e.pageX, e.pageY)
    }

    canvas.onmousedown = e => {
      game.mousemove(e.pageX, e.pageY)
      
      game.mousedown()
    }

    onmouseup = () => {
      game.mouseup()
    }

    ontouchstart = e => {
      game.mouseMove(e.pageX, e.pageY)

      game.mousedown()
    }

    ontouchend = () => {
      game.mouseup()
    }

    onkeydown = e => {
      if (!e.metaKey && !e.repeat && e.target.nodeName !== "INPUT") {
        game.keydown(e.code)

        e.preventDefault()
      }
    }

    onkeyup = e => {
      game.keyup(e.code)
    }
  }
}

onload = () => {
  id("info").style.transition = "opacity 0.5s linear"

  loadImages()
  itemLoaded()
}

window.onPageShown = () => {
  itemLoaded()
}
