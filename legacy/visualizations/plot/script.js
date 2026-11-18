var c = id("canvas"), ctx = c.getContext("2d")

var countries = [...new Set(data.map(x => x.Country))],
    costs = ["$0 - $50", "$50 - $100", "$100 - $150", "$150 - $200", ">$200"],
    types = [...new Set(data.map(x => x.Type))],
    positions,
    squareSize = 5,
    collisionPossible

function draw() {
  ctx.clearRect(0, 0, c.width, c.height)
  
  var width = c.width / devicePixelRatio - 50, height = c.height / devicePixelRatio

  ctx.strokeStyle = "white"
  ctx.lineWidth = 1
  ctx.font = "16px Arial"

  positions = {}
  collisionPossible = true
  
  for (let i = 0; i < data.length; i++) {
    var row = data[i],
        x = countries.indexOf(row.Country) / countries.length * width,
        y = costs.indexOf(row.Cost) / costs.length * height,
        offset = 0,
        key = ~~x + ":" + ~~y

    ctx.fillStyle = `hsl(${types.indexOf(row.Type) / types.length * 255}, 100%, 50%)`

    if (positions[key]) {
      offset = positions[key]

      positions[key]++
    } else positions[key] = 1

    var trueX = x + offset % 6 * (squareSize + 1) + 50,
        trueY = y + Math.trunc(offset / 6) * (squareSize + 1) + 50
    
    ctx.fillRect(trueX, trueY, squareSize, squareSize)

    if (collisionPossible && mouseX >= trueX && mouseY >= trueY && mouseX < trueX + squareSize && mouseY < trueY + squareSize) {
      ctx.fillText(`Type: ${row.Type}; Item: ${row.Item}; Gem: ${row.Gem}`, 10, height - 20)

      ctx.strokeRect(trueX, trueY, squareSize, squareSize)
      
      collisionPossible = false
    }
  }

  ctx.fillStyle = "white"
  ctx.font = "9px Arial"
  ctx.textBasline = "top"
  ctx.textAlign = "left"
  
  for (let i in countries)
    ctx.fillText(
      countries[i].replace("Switzerland", "Swzland.")
                  .replace("Guatemala", "Guatmla.")
                  .replace("Bangladesh", "Bngldsh.")
                  .replace("Singapore", "Sngapr.")
                  .replace("Philippines", "Phlipnes.")
                  .replace("Indonesia", "Indnsia.")
                  .replace("Unknown", "???"),
      i / countries.length * width + 50, 20
    )

  ctx.textAlign = "right"
  for (let i in costs)
    ctx.fillText(costs[i].split(" ")[0], 40, i / costs.length * height + 50)
}

function updateFullscreen() {
  var targetW = $("main").offsetWidth, targetH = $("main").offsetHeight, scale = devicePixelRatio

  c.style.width = targetW + "px"
  c.style.height = targetH + "px"

  c.width = ~~(targetW * scale)
  c.height = ~~(targetH * scale)

  ctx.scale(scale, scale)

  ctx.imageSmoothingEnabled = false
}

updateFullscreen()
onresize = () => {
  updateFullscreen()
  draw()
}

setInterval(() => {
  draw()
}, 1000 / 30)

var mouseX = 0, mouseY = 0

onmousemove = event => {
  mouseX = event.offsetX
  mouseY = event.offsetY
}
