var c = id("canvas"), ctx = c.getContext("2d")

var highscore = getData("platformerBest")
if (highscore === null) saveData("platformerBest", highscore = 0)
else highscore = parseInt(highscore)

class GameObject {
  constructor(x, y, type) {
    this.lastX = this.x = x
    this.lastY = this.y = y
    this.type = type

    this.width = images[type].width
    this.height = images[type].height

    objects.push(this)

    if (type !== "player" && !viewingReplay)
      if (replay[tickNum.toString(36)])
        replay[tickNum.toString(36)][0].push([this instanceof Entity, x, y, type])
      else
        replay[tickNum.toString(36)] = [[[this instanceof Entity, x, y, type]], false]
  }

  rotation = 0
  lastRot = 0

  get index() { return objects.indexOf(this) }

  delete() {
    objects[this.index] = null
  }

  tick() {
    if (Math.max(this.x, this.lastX) + this.width < scroll) {
      this.delete()
      
      if (this.type.startsWith("platform") || this.type.startsWith("spike")) {
        score++

        if (score > highscore) saveData("platformerBest", highscore = score)
      }
    }

    this.lastX = this.x
    this.lastY = this.y
    this.lastRot = this.rotation

    if (inGame && this.type.startsWith("cloud")) this.x -= 2
  }

  draw() {
    var img = images[this.type].img,
        {x, y} = this, scrollPos = scroll
  
    if (doTick) {
      x = (x + this.lastX) * 0.5
      y = (y + this.lastY) * 0.5
      scrollPos = (scroll + lastScroll) * 0.5
    }
    
    x -= scrollPos

    if (settings.reversePlatformer.current) x = innerWidth - x - this.width

    // y = innerHeight - y - this.height
    
    if (player === this) {
      if (this.wowTime > 0) img = !inGame ? images.sad_player_wow.img : images.player_wow.img
      else if (!inGame) img = images.sad_player.img

      var deg = this.rotation

      if (doTick) deg = (deg + this.lastRot) * 0.5
      
      ctx.translate(x + this.width * 0.5, y + this.height * 0.5)
      ctx.rotate(deg * Math.PI / 180)
  
      ctx.drawImage(img, -this.width * 0.5, -this.height * 0.5, this.width, this.height)
  
      ctx.rotate(-deg * Math.PI / 180)
      ctx.translate(-x - this.width * 0.5, -y - this.height * 0.5)
    } else
      ctx.drawImage(img, x, y, this.width, this.height)

    document.getElementById("score").innerHTML = `Score: ${score}<br>Highscore: ${highscore}`

    // ctx.strokeStyle = "red"

    // var hitboxOffsets = images[this.type].hitboxInset || [0, 0, 0, 0]

    // ctx.strokeRect(this.x + hitboxOffsets[3] - scroll, this.y + hitboxOffsets[0], this.width - hitboxOffsets[3] - hitboxOffsets[1], this.height - hitboxOffsets[0] - hitboxOffsets[2])
  }
}

const jumpAudios = Array.from({length : 10}, () => new Audio("./sounds/jump.mp3"))
let jumpIndex = 0

class Entity extends GameObject {
  constructor(x, y, type) {
    super(x, y, type)

    entities.push(this)
  }

  yVel = 0
  gravity = 2.5
  canJump = true
  wowTime = 0

  collidesInDirection(moveX, moveY, useThinHitbox = false) {
    var {x, y, width, height} = this,
        trueX = x, trueY = y
    
    x += moveX
    y += moveY

    for (let i of objects) {
      if (!i?.type.startsWith("platform")) continue

      if (i.x < x + width && i.y < y + height && i.x + i.width > x && i.y + i.height > y + (useThinHitbox ? height : 0)) return true
    }

    return false
  }

  onGround() { return this.collidesInDirection(0, smallestMovement, true) }

  jump(force) {
    if (!force && (!this.canJump || !inGame || viewingReplay)) return
    
    jumpAudios[jumpIndex++].play()
    jumpIndex %= jumpAudios.length
    
    this.yVel = -30

    if (!viewingReplay)
      replay[tickNum.toString(36)] = [[], true]

    if (!this.onGround())
      this.canJump = false
  }

  collidesWithObject(name, deleteCollidedObject) {
    var {x, y, width, height} = this
    
    for (let i of objects) {
      if (!i?.type.startsWith(name)) continue

      var hitboxOffsets = i.hitboxInset || [0, 0, 0, 0]

      if (i.x + hitboxOffsets[3] < x + width && i.y + hitboxOffsets[0] < y + height && i.x + i.width - hitboxOffsets[1] > x && i.y + i.height - hitboxOffsets[2] > y) {
        if (deleteCollidedObject) i.delete()
        
        return true
      }
    }

    return false
  }

  tick() {
    super.tick()

    if (this.wowTime > 0) this.wowTime--

    if (!inGame) return
    
    if (this.onGround()) {
      if (Math.round(this.rotation) % 90 !== 0) {
        this.rotation = Math.round(this.rotation)

        var oldRot = this.rotation
        
        if (this.rotation % 90 >= 45) this.rotation += 16
        else this.rotation -= 16

        this.rotation = clamp(this.rotation, Math.floor(oldRot / 90) * 90, Math.ceil(oldRot / 90) * 90)
      }

      this.yVel = clamp(this.yVel + this.gravity, null, 0)

      this.canJump = true
    } else {
      this.yVel += this.gravity
      this.rotation += this.gravity * 4
    }

    if (this.yVel >= 0 || !this.collidesInDirection(this.yVel, 0))
      this.y += this.yVel
    else this.yVel = 0
    
    if (this.yVel >= 0)
      while (this.collidesInDirection(0, 0, this.wowTime === 0)) this.y -= smallestMovement

    if (this === player && this.collidesWithObject("spike")) return inGame = false

    if (this === player && this.collidesWithObject("berries", true)) this.wowTime = 200
  }
}

var objects = [], entities, player, scroll, lastScroll, score,
    scrollSpeed, smallestMovement = 1, scrollIncrease = 0,
    nextCloudPos,
    inGame = false, showStartScreen = true,
    viewingReplay,
    replay, tickNum

function start() {
  objects = []
  entities = []
  lastScroll = scroll = 0
  score = 0
  nextCloudPos = innerWidth
  inGame = true
  showStartScreen = false
  viewingReplay = false
  scrollSpeed = 14

  replay = {}
  tickNum = 0

  platNum = 0
  nextPlatX = 300
  lastPlatY = innerHeight * 0.5
  
  player = new Entity(200, 0, "player")
}

function platform(x, y) {
  var platformImg = "platform"
  if (Math.random() > 0.05) platformImg += randInt(1, 4)
  else platformImg += randInt(4, 7)
  
  new GameObject(x, y, platformImg)

  if (Math.random() < Math.min(0.4, score / 100) && platNum) {
    var spikeType = "spike" + randInt(1, 3),
        spikePlacement = [
          x,
          x + images.platform1.width - images[spikeType].width,
          images.platform1.width / 2 + x - images[spikeType].width / 2,
        ][Math.floor(Math.random() * 2.2)]
    
    new GameObject(spikePlacement, y - images[spikeType].height + 6, spikeType)
  }
  
  platNum++
}

var nextPlatX, lastPlatY, platNum
function tick() {
  lastScroll = scroll

  scrollSpeed += scrollIncrease

  for (let i of objects) i?.tick()
  objects = objects.filter(Boolean)
  
  if (!inGame) {
    song.pause()
    
    return
  }

  if (viewingReplay) {
    var replayFrame = viewingReplay[tickNum]
    if (replayFrame) {
      if (replayFrame.jump) player.jump(true)
      if (replayFrame.objects.length)
        for (let i of replayFrame.objects)
          new i.constr(...i.params)
    }
  } else {
    if (nextCloudPos <= innerWidth + scroll) {
      new GameObject(nextCloudPos, Math.random() * 150, "cloud" + randInt(1, 3))
  
      nextCloudPos += Math.random() * 600
    }
  
    while (innerWidth + scroll > nextPlatX) {
      lastPlatY = clamp(lastPlatY + Math.random() * 300 - 150, innerHeight * 0.5 - 200, innerHeight * 0.5 + 200)
  
      platform(nextPlatX, lastPlatY)
  
      if (platNum % 10 === 0)
        new Entity(nextPlatX + (images.platform1.width - images.berries.width) * 0.5, lastPlatY - images.berries.height - 200, "berries")
  
      if (Math.random() < 0.1)
        platform(nextPlatX, lastPlatY + (lastPlatY > innerHeight * 0.5 ? -200 : 200))
  
      nextPlatX += Math.trunc(Math.random() * 100) + 400
    }
  }

  if (!player.collidesInDirection(scrollSpeed, 0)) {
    scroll += scrollSpeed
    
    player.x += scrollSpeed
  }

  if (player.y > innerHeight) inGame = false

  tickNum++
}

function draw() {
  ctx.clearRect(0, 0, c.width, c.height)

  ctx.fillStyle = ctx.strokeStyle = "white"

  if (showStartScreen) {
    ctx.font = "24px 'Fredoka One', Arial"
    ctx.textAlign = "center"
    
    ctx.fillText(!loaded ? `Loading… ${Math.round(imagesLoaded / targetImages * 100)}%` : "Click anywhere to start", innerWidth * 0.5, innerHeight * 0.5)
  } else
    for (let i of objects) i.draw()
}

function updateFullscreen() {
  var targetW = $("main").offsetWidth, targetH = $("main").offsetHeight, scale = devicePixelRatio

  c.style.width = targetW + "px"
  c.style.height = targetH + "px"

  c.width = ~~(targetW * scale)
  c.height = ~~(targetH * scale)

  ctx.scale(scale, scale)
}

var targetImages = Object.keys(images).length, imagesLoaded = 0
for (let i of Object.keys(images)) {
  var img = elem("img")

  img.onload = onImageLoad
  img.src = `./images/${i}.png`

  images[i].img = img

  images[i].ratio = images[i].width / images[i].height
}

var doTick = true, loaded = false
function onImageLoad() {
  imagesLoaded++

  if (imagesLoaded === targetImages) {
    loaded = true
    
    onresize = () => {
      updateFullscreen()
      draw()
    }

    onclick = () => {
      if (!songPlaying) {
        songPlaying = true
        intro.play()

        if (inGame) player.jump()
        else start()
      }
    }
  }
}

setInterval(() => {
// function frame() {
  draw()

  if (loaded) {
    doTick = !doTick
    if (doTick) tick()
  }

  // requestAnimationFrame(frame)
// }
}, 1000 / 60)

function encodeReplay(obj) {
  var output = []

  for (let [frame, data] of Object.entries(obj)) {
    output.push(`${frame},${data[0].map(x => [+x[0], ...x.slice(1)]).toString()}${data[1] ? "," : ""}`)
  }

  return btoa(output.join(";"))
}

function decodeReplay(str) {
  var output = [], frames = atob(str).split(";")

  for (let i of frames) {
    var parts = i.split(","),
        frame = parseInt(parts.shift(), 36),
        jump = parts[parts.length - 1] === ""

    if (jump) parts.pop()

    var objects = []

    if (parts.length >= 4)
      for (let j = 0; j < parts.length; j += 4)
        objects.push({
          constr : parts[j] === "1" ? Entity : GameObject,
          params : [
            parseInt(parts[j + 1]), // x
            parseInt(parts[j + 2]), // y
            parts[j + 3]            // type
          ]
        })
      

    output[frame] = {objects, jump}
  }

  return output
}

function viewReplay(data) {
  start()

  viewingReplay = data
}

onload = updateFullscreen

updateFullscreen()

var song = new Howl({
  src : ["./sounds/song.wav"],
  volume : 0.7,
  loop : true
})
var introPlaying = true
var intro = new Howl({
  src : ["./sounds/song_intro.wav"],
  volume : 0.7,
  onend : () => {
    song.play()
    introPlaying = false
  }
})
onkeydown = event => {
  if (event.repeat || event.metaKey) return

  if (event.code === "Space" || event.code === "ArrowUp") {
    if (inGame) player.jump()
    else if (loaded) start()
  } else if (event.code === "KeyR" && !showStartScreen) {
    if (!introPlaying) {
      song.pause()
      song.play()
    }
    start()
  }
}

var songPlaying = false

requestAnimationFrame(frame)
