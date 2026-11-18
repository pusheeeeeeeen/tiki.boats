const canvas = id("canvas"), ctx = canvas.getContext("2d")

const colors = {
  boardDark : "#487ab0",
  boardMid : "#82b5d1",
  boardLight : "#e6d2c8",
  promotionTile : "#f8e8dc",
  promotionTileHover : "#fff2ea",
  promotionBorder : "#b5afaa"
}

let board

function tick() {
  board?.tick()
}

function draw() {
  ctx.clearRect(0, 0, width, height)
  
  board?.draw()
}

let width, height

const canvasWrapper = query("main")

function updateCanvas() {
  width = canvasWrapper.offsetWidth
  height = canvasWrapper.offsetHeight
  
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio

  ctx.scale(devicePixelRatio, devicePixelRatio)
}

function frame() {
  tick()
  draw()

  requestAnimationFrame(frame)
}

const pieceImages = ["bb", "bk", "bn", "bp", "bq", "br", "wb", "wk", "wn", "wp", "wq", "wr"]

let images = {}

for (let i of pieceImages) {
  let img = new Image()

  img.src = `pieces/${i}.png`
  img.onload = itemLoaded

  images[i] = img
}

onload = itemLoaded

let itemsLoaded = 0, itemsToLoad = pieceImages.length + 1

function itemLoaded() {
  if (++itemsLoaded === itemsToLoad) {
    updateCanvas()

    board = new Board()
  
    frame()
    
    onresize = () => {
      updateCanvas()
  
      draw()
    }

    canvas.onmousemove = e => {
      board?.mousemove(event.offsetX, event.offsetY)
    }

    canvas.onmousedown = e => {
      board?.mousemove(event.offsetX, event.offsetY)

      board?.mousedown()
    }

    onmouseup = () => {
      board?.mouseup()
    }
  }
}
