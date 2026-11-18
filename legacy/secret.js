var secretsDiscovered = atob(localStorage.getItem("secrets") || "MA=="/* 0 */)

const secrets = window["\u0000secrets"]

secretsDiscovered = Object.fromEntries(
  parseInt(secretsDiscovered, 36).toString(2)
    .padStart(secrets.length, "0")
    .split("")
    .map((x, i) => [secrets[i], x === "1"])
)

var confettiCanvas, confCtx, currentWidth = innerWidth, doConfettiRain = false
function unlockSecret(name) {
  var doConfetti = !secretsDiscovered[name]
  
  secretsDiscovered[name] = true
  saveSecrets()

  if (!confettiCanvas) {
    confettiCanvas = elem("canvas").css({
      position : "fixed",
      top : 0,
      width : "100vw",
      height : "100vh",
      pointerEvents : "none",
      zIndex : 100000000
    })

    confCtx = confettiCanvas.getContext("2d")

    id("wrapper").addStart(confettiCanvas)

    updateConfettiCanvas()

    currentWidth = innerWidth
    
    onresize = () => {
      updateConfettiCanvas()

      var widthChange = innerWidth - currentWidth

      for (let i of confettiParticles)
        if (i.right) i.x += widthChange

      currentWidth = innerWidth

      if (confettiInterval) confettiFrame()
    }
  }

  if (doConfetti) confetti()

  if (Object.values(secretsDiscovered).every(x => x) && !doConfettiRain) {    
    doConfettiRain = true

    if (!doConfetti && !confettiInterval) confetti()

    setInterval(() => {
      if (randBool(innerWidth / 1000)) new ConfettiParticle(false, true)
    }, 100)
  }
}

function saveSecrets() {
  localStorage.setItem("secrets", btoa(
    parseInt(
      Object.values(secretsDiscovered).map(x => x ? "1" : "0").join(""),
      2
    ).toString(36)
  ))
}

function updateConfettiCanvas() {
  var width = innerWidth, height = innerHeight

  confettiCanvas.width = Math.trunc(width * devicePixelRatio)
  confettiCanvas.height = Math.trunc(height * devicePixelRatio)

  confCtx.scale(devicePixelRatio, devicePixelRatio)
}

class ConfettiParticle {
  constructor(right, isRain) {
    this.right = right

    if (isRain) {
      this.x = Math.random() * innerWidth
      this.y = -20

      this.xVel = this.yVel = 0

      this.xMult = this.yMult = 0
    } else {
      this.y = (Math.random() * 0.2 + 0.6) * innerHeight
  
      this.xVel = Math.random() * innerWidth / 13 + 5
      this.yVel = (Math.random() * -innerHeight / 20) + (Math.random() * -innerHeight / 20)
  
      this.xMult = Math.random() * 0.01 + 0.85
      this.yMult = Math.random() * 0.01 + 0.9
  
      if (right) {
        this.x = innerWidth + 20
  
        this.xVel *= -1
      } else this.x = -20
    }

    this.xOffsetVel = Math.random() * 4 - 2

    this.hue = Math.random() * 360
    this.timeAlive = Math.random() * 2 * Math.PI
    this.right = randBool()

    confettiParticles.push(this)
  }

  delete() { confettiParticles[confettiParticles.indexOf(this)] = null }

  draw() {
    this.x += this.xVel + this.xOffsetVel
    this.y += this.yVel

    this.xVel *= this.xMult
    this.yVel *= this.yMult

    this.y += 2

    this.timeAlive += 0.08

    var x = this.x + Math.sin(this.timeAlive) * 25,
        y = this.y + Math.sin(this.timeAlive * 2 + Math.PI * 0.5) * 3,
        w = 14, h = 8,
        rotation = Math.sin(this.timeAlive) * -0.3

    confCtx.translate(x + w * 0.5, y + h * 0.5)
    confCtx.rotate(rotation)

    confCtx.beginPath()
    
    confCtx.moveTo(-w * 0.5, -h * 0.5)
    confCtx.lineTo( 0,       -h * 0.3)
    confCtx.lineTo( w * 0.5, -h * 0.5)
    confCtx.lineTo( w * 0.5,  h * 0.3)
    confCtx.lineTo( 0,        h * 0.5)
    confCtx.lineTo(-w * 0.5,  h * 0.3)
    
    confCtx.closePath()

    confCtx.fillStyle = `hsl(${this.hue}, 100%, 50%)`
    confCtx.fill()

    confCtx.rotate(-rotation)
    confCtx.translate(-x - w * 0.5, -y - h * 0.5)

    if (this.y > innerHeight + 20) this.delete()
  }
}

function confettiFrame() {
  confCtx.clearRect(0, 0, innerWidth, innerHeight)
  
  for (let i of confettiParticles) i.draw()

  confettiParticles = confettiParticles.filter(Boolean)

  if (!confettiParticles.length && !doConfettiRain) {
    clearInterval(confettiInterval)

    confettiInterval = null
  }
}

var confettiParticles = [], confettiInterval = null
function confetti() {
  var count = clamp(innerWidth / 5, 50, 300) * (Math.random() * 0.3 + 0.85)
  
  for (let i = 0; i < count; i++)
    new ConfettiParticle(randBool(i / count))

  confettiInterval ||= setInterval(confettiFrame, 1000 / 60)
}
