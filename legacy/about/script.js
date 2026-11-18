var c = id("canvas"), ctx = c.getContext("2d")

var fonts = ["AbrilFatface", "Abyssinica", "Anton", "Kanit", "Lobster", "NotoSansMono", "PermanentMarker", "Righteous", "RubikDirt", "Smokum"],
    loadedFonts = []

for (let i of fonts) {
  let fontFace = new FontFace(i, `url(./assets/${i}.ttf)`)

  fontFace.load().then(() => {
    loadedFonts.push(i)
    document.fonts.add(fontFace)
  })
}

function updateFullscreen() {
  var targetW = id("canvas-container").offsetWidth, targetH = id("canvas-container").offsetHeight, scale = devicePixelRatio

  c.style.width = targetW + "px"
  c.style.height = targetH + "px"

  c.width = ~~(targetW * scale)
  c.height = ~~(targetH * scale)

  ctx.scale(scale, scale)
}

var tikis = []

function addTikis() {
  if (tikis.length < 30) {
    var count = Math.trunc(Math.random() * 8) + 2
    for (let i = 0; i < count; i++) {
      var x = Math.random() * innerWidth, y = Math.random() * innerHeight,
          font = loadedFonts[Math.trunc(Math.random() * loadedFonts.length)],
          fontSize = Math.random() * 200 + 40,
          hue = Math.random() * 255
  
      tikis.push({x, y, font, fontSize, hue, lifespan : 0, maxLifespan : Math.trunc(Math.random() * 100) + 100, text : Math.random() < 0.5 ? "TIKI" : "tiki"})
    }
  }

  setTimeout(addTikis, Math.random() * 500 + 250)
}

function draw() {
  ctx.fillStyle = "#202224"
  ctx.fillRect(0, 0, c.width, c.height)

  ctx.shadowColor = "black"
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 8

  ctx.textBaseline = "middle"
  ctx.textAlign = "center"

  for (let i = 0; i < tikis.length; i++) {
    var tiki = tikis[i]
    
    tiki.lifespan++

    if (tiki.lifespan >= tiki.maxLifespan) {
      tikis.splice(i, 1)
      i--

      continue
    }

    ctx.fillStyle = `hsl(${tiki.hue}, 100%, 50%)`
    
    var fontSize = Math.sin(tiki.lifespan / tiki.maxLifespan * Math.PI) * tiki.fontSize
    
    ctx.font = `${fontSize}px ${tiki.font}`
    
    ctx.fillText(tiki.text, tiki.x, tiki.y)
  }
}

updateFullscreen()
onresize = () => {
  updateFullscreen()
  draw()
}

setInterval(draw, 1000 / 30)
addTikis()

var canvasText = id("canvas-text")
canvasText.style.transition = "letter-spacing 4s ease-out, opacity 2s ease-out"
canvasText.style.letterSpacing = "0"
canvasText.style.opacity = "1"
