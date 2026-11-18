const c = id("canvas"), ctx = c.getContext("2d")

function tick() {
  
}

function draw() {
  
}

var width = 0, height = 0
function updateFullscreen() {
  width = $("main").offsetWidth
  height = $("main").offsetHeight

  c.style.width = width + "px"
  c.style.height = height + "px"

  c.width = Math.trunc(width * devicePixelRatio)
  c.height = Math.trunc(height * devicePixelRatio)

  ctx.scale(devicePixelRatio, devicePixelRatio)
}

onload = updateFullscreen

onresize = () => {
  updateFullscreen()
  draw()
}

setInterval(() => {
  draw()
  tick()
}, 1000 / 30)
