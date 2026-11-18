const pops = Array(20).fill().map(() => new Audio("pop.wav"))

let index = 0

function pop(volume = 1) {
  pops[index].volume = volume
  pops[index].play()
  
  index = (index + 1) % pops.length
}

let mouseDown = false,
    mouseX = 0,
    mouseY = 0

onmousedown = e => {
  id("click-and-drag").classList.add("hide")
  
  mouseX = e.pageX
  mouseY = e.pageY
  mouseDown = true
  
  pop()

  ctx.beginPath()
  ctx.arc(mouseX, mouseY, 15, 0, 2 * Math.PI)

  ctx.strokeStyle = "#eef4"
  ctx.lineWidth = 4
  ctx.stroke()
}

onmouseup = e => {
  mouseX = e.pageX
  mouseY = e.pageY
  mouseDown = false
  
  pop(0.6)

  ctx.beginPath()
  ctx.arc(mouseX, mouseY, 10, 0, 2 * Math.PI)

  ctx.strokeStyle = "#eef4"
  ctx.lineWidth = 3
  ctx.stroke()
}

let lastDragEventTime = 0

onmousemove = e => {
  let time = performance.now()
  
  if (time - lastDragEventTime > 60 && mouseDown) {
    let distance = Math.hypot(e.pageX - mouseX, e.pageY - mouseY)
    pop(Math.min(0.8, distance / 20))

    lastDragEventTime = time
  }

  if (mouseDown) {
    ctx.beginPath()
    ctx.moveTo(mouseX, mouseY)
  }

  mouseX = e.pageX
  mouseY = e.pageY

  if (mouseDown) {
    ctx.lineTo(mouseX, mouseY)
  
    ctx.strokeStyle = "#eef3"
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

const canvas = id("canvas"),
      ctx = canvas.getContext("2d")

function fade() {
  ctx.fillStyle = "#1111"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
  
function resize(copy = true) {
  let data = copy && ctx.getImageData(0, 0, canvas.width, canvas.height)

  canvas.width = canvas.offsetWidth * devicePixelRatio
  canvas.height = canvas.offsetHeight * devicePixelRatio

  ctx.scale(devicePixelRatio, devicePixelRatio)

  ctx.fillStyle = "#111"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (copy)
    ctx.putImageData(data, 0, 0)
}

addEventListener("DOMContentLoaded", () => {
  resize(false)
  
  onresize = resize

  setInterval(fade, 1000 / 60)
})

onload = resize
