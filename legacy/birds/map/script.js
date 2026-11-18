const c = id("canvas"), ctx = c.getContext("2d")

const mapWidth = 3300, mapHeight = 2550, mapSizeRatio = mapWidth / mapHeight

function draw() {
  updateFullscreen()
  
  ctx.clearRect(0, 0, width, height)

  var sizeX, sizeY
  
  if (width > height * mapSizeRatio) {
    sizeX = height * mapSizeRatio
    sizeY = height
  } else {
    sizeX = width
    sizeY = width * (1 / mapSizeRatio)
  }

  var top = (height - sizeY) * 0.5,
      left = (width - sizeX) * 0.5

  if (lowRes) ctx.globalAlpha = 0.6
  else ctx.globalAlpha = 1
  ctx.drawImage(img, left, top, sizeX, sizeY)
  
  for (let y in data)
    for (let x in data[y]) {
      var xPos = x / data[0].length * sizeX + left,
          yPos = y / data.length * sizeY + top,
          amount = data[y][x],
          isSample = amount !== 0

      if (!isSample) {
        for (let i of birdPoints)
          i.dist = Math.hypot(i.x - x, i.y - y)
        
        var sortedPoints = birdPoints.sort((a, b) => a.dist - b.dist),
            distA = sortedPoints[0].dist,
            distB = sortedPoints[1].dist,
            totalDist = distA + distB

        distA = 1 - distA / totalDist
        distB = 1 - distB / totalDist

        amount = sortedPoints[0].count * distA + sortedPoints[1].count * distB

        amount *= clampMin(-(sortedPoints[0].dist ** 1.5) / 100 + 1, 0)
      }

      amount /= highestCount

      ctx.globalAlpha = amount * 0.7
      ctx.fillStyle = `rgb(${amount * 255}, ${amount * 50}, ${255 - amount * 205})`

      ctx.fillRect(xPos, yPos, sizeX / data[0].length, sizeY / data.length)

      if (isSample) {
        ctx.lineWidth = 2
        ctx.strokeStyle = "white"
        ctx.globalAlpha = 0.7
        
        ctx.strokeRect(xPos + 1, yPos + 1, sizeX / data[0].length - 2, sizeY / data.length - 2)

        ctx.fillStyle = "white"
        ctx.font = "11px Menlo"
        ctx.textAlign = "center"
        ctx.fillText(data[y][x], xPos + sizeX / data[0].length * 0.5, yPos - 2)
      }
    }

  if (lowRes) {
    ctx.globalAlpha = 0.5
    
    ctx.fillStyle = "white"
    ctx.font = "bold 30px Arial"

    ctx.textAlign = "center"
    ctx.fillText("LOADING", width * 0.5, height * 0.5)
  }
}

var width = 0, height = 0
function updateFullscreen() {
  width = $("main").offsetWidth
  height = $("main").offsetHeight

  c.style.width = width + "px"
  c.style.height = height + "px"

  c.width = ~~(width * devicePixelRatio)
  c.height = ~~(height * devicePixelRatio)

  ctx.scale(devicePixelRatio, devicePixelRatio)
}

// updateFullscreen()

var itemsLoaded = 0, itemsToLoad = 2
function itemLoaded() {
  itemsLoaded++

  if (itemsLoaded === itemsToLoad) {
    onresize = () => {
      // updateFullscreen()
      draw()
    }
  
    draw()
  }
}

var img = new Image(), lowRes = true

img.onload = () => {
  itemLoaded()

  img.src = "./map.png"

  img.onload = () => {
    lowRes = false
    
    draw()
  }
}

img.src = "./map-lowres.png"
