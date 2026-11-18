const canvas = id("canvas")
let ctx = canvas.getContext("2d")

let puzzle

function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.src = src

    img.onload = () => {
      resolve(img)
    }
    img.onerror = reject
  })
}

async function loadPuzzle(src, w, h) {
  puzzle = new Puzzle(
    await loadImage(src),
    w, h,
    randomConnections(w, h)
  )

  console.log(`Puzzle loaded! ${src}`)
}

function randomConnections(w, h) {
  return {
    x : randomConnectionArray(w - 1, h),
    y : randomConnectionArray(w, h - 1)
  }
}

function randomConnectionArray(w, h) {
  return Array(h).fill().map(
    () => Array(w).fill().map(
      x => Math.trunc(Math.random() * 4)
    )
  )
}

function draw() {
  puzzle?.draw()

  ctx.font = "12px Menlo"
  ctx.fillStyle = "#fff4"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"

  let frameDuration = previousFrames.reduce((acc, x) => acc + x.duration, 0) / previousFrames.length

  ctx.fillText(`FPS: ${previousFrames.length}/${fps}; ms/f: ${frameDuration.toFixed(1)}/${(1000 / fps).toFixed(1)}`, 5, 5)
}

let previousFrames = []

let width, height, scale

function frame() {
  let frameStart = performance.now()
  
  width = canvas.offsetWidth
  height = canvas.offsetHeight
  scale = devicePixelRatio
  
  canvas.width = width * scale
  canvas.height = height * scale

  ctx.scale(scale, scale)

  draw()

  let frameEnd = performance.now()

  previousFrames.push({
    time : frameStart,
    duration : frameEnd - frameStart
  })

  while (previousFrames[0].time + 1000 < frameStart)
    previousFrames.shift()
}

const fps = 60

setInterval(frame, 1000 / fps)

onmousemove = e => {
  puzzle?.mouseMoved(e.pageX, e.pageY)
}
onmousedown = e => {
  puzzle?.mouseDown(e.pageX, e.pageY)
}
onmouseup = e => {
  puzzle?.mouseUp(e.pageX, e.pageY)
}

onkeydown = e => {
  if (!e.metaKey && !e.repeat)
    puzzle?.keyDown(e.code)
}
onkeyup = e => {
  puzzle?.keyUp(e.code)
}

onwheel = e => {
  puzzle?.scroll(e.deltaX, e.deltaY)
}

onload = () => {
  loadPuzzle("images/oedipus.png", 5, 5)
}
