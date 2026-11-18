let canvas, ctx, board, width, height

let moveCalcWorker = new Worker("prediction/predict.js"),
    moveCalcTarget = 30_000,
    moveCalcResult, moveCalcTime

moveCalcWorker.postMessage({SET_TARGET : moveCalcTarget})

moveCalcWorker.onmessage = e => {
  if (!board || e.data.pieceID !== board.pieceID) return
  
  moveCalcResult = e.data.tree
  moveCalcTime = e.data.time

  board?.updatePreviewPieces()
}

function startGame() {
  board = new Board()

  // bag : "FILNPTUVWXYZ"

  moveCalcWorker.postMessage({STOP : true})
}

let tickTime, frameTime

function tick() {
  tickTime = performance.now()

  board?.tick()
}

function draw() {
  frameTime = performance.now()

  ctx.clearRect(0, 0, width, height)

  board?.draw()
}

function updateCanvas() {
  width = canvas.offsetWidth
  height = canvas.offsetHeight

  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio

  ctx.scale(devicePixelRatio, devicePixelRatio)
}

const fps = 60

onload = () => {
  canvas = document.getElementById("canvas")
  ctx = canvas.getContext("2d")

  startGame()

  updateCanvas()
  draw()

  onresize = () => {
    updateCanvas()
    draw()
  }

  onkeydown = e => {
    if (!e.metaKey && !e.repeat && board) {
      if (e.code === "KeyR")
        startGame()
      else if (e.code === "KeyB") {
        board.enableBot = !board.enableBot

        if (!board.enableBot)
          moveCalcWorker.postMessage({STOP : true})
      } else if (e.code === "KeyA") {
        if (!board.enableBot)
          board.useBot = board.enableBot = true
        else
          board.useBot = !board.useBot
      } else if (e.code === "KeyM") {
        if (board.enableBot)
          board.executeBestMove()
      } else
        board?.keydown(e.code)
    }
  }

  onkeyup = e => {
    if (!e.metaKey)
      board?.keyup(e.code)
  }

  setInterval(() => {
    tick()
    draw()
  }, 1000 / fps)
}
