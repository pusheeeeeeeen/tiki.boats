const c = id("canvas"), ctx = c.getContext("2d")

function radians(degrees) { return degrees / 180 * Math.PI }

ctx.roundRect ||= (x, y, w, h, radius) => {
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arc(x + w - radius, y + radius, radius, radians(270), radians(0))
  ctx.lineTo(x + w, y + h - radius)
  ctx.arc(x + w - radius, y + h - radius, radius, radians(0), radians(90))
  ctx.lineTo(x + radius, y + h)
  ctx.arc(x + radius, y + h - radius, radius, radians(90), radians(180))
  ctx.lineTo(x, y + radius)
  ctx.arc(x + radius, y + radius, radius, radians(180), radians(270))
}

// function text(text, x, y, lineHeight, bottomAlign = false) {
//   var lines = text.split("\na\"")

//   ctx.textBaseline = bottomAlign ? "bottom" : "top"

//   for (let i in lines)
//     ctx.fillText(lines[i], x, bottomAlign ? y - lineHeight * i : y + lineHeight * i)
// }

const sides = 6

const dieColors = {
  white : "ab6c3c",
  black : "00040a",
  red : "de574e",
  yellow : "f0b73c",
  green : "569141",
  blue : "58add1"
}

var board
function createBoard(type, lessRandom = false, save = null) { board = new variants[type]({lessRandom}) }

function tick() {
  board?.tick()
}

function draw() {
  ctx.clearRect(0, 0, width, height)
  
  board?.draw()
}

const wrapper = id("canvas-wrapper")

var width = 0, height = 0
function updateFullscreen() {
  width = wrapper.offsetWidth
  height = wrapper.offsetHeight

  c.style.width = width + "px"
  c.style.height = height + "px"

  c.width = Math.trunc(width * devicePixelRatio)
  c.height = Math.trunc(height * devicePixelRatio)

  ctx.scale(devicePixelRatio, devicePixelRatio)

  board?.updateSize()
}

onload = () => {
  updateFullscreen()

  setInterval(() => {
    tick()
    draw()
  }, 1000 / 60)

  onresize = () => {
    updateFullscreen()
    draw()
  }

  c.onmousedown = event => {
    board.click(event.offsetX, event.offsetY)
  }

  tick()
  draw()
}

//////////////////////////

const gameTypeSelect = id("game-type"),
      trueRandomCheckbox = id("less-random"),
      variantDisplay = {
        Default : "Default",
        "Four-player" : "FourPlayer",
        "Classic four-player" : "ClassicFourPlayer",
        Duel : "Minimal",
        "Questionably large" : "Massive",
        "Questionably large four-player" : "MassiveFourPlayer",
        Empty : "None"
      }

for (let i of Object.keys(variantDisplay))
  gameTypeSelect.addEnd(elem("option").html(i))

function generateBoard(save = null) {
  createBoard(variantDisplay[gameTypeSelect.value], trueRandomCheckbox.checked, save)
}

trueRandomCheckbox.oninput = gameTypeSelect.oninput = generateBoard

function startGame(save = null) {
  generateBoard(save)
  
  id("game-selection").addClass("hidden")
}

generateBoard()

id("start").onclick = startGame

var saveInputShown = false

id("load-game").onclick = () => {
  saveInputShown = true
  
  id("load-save-wrapper").classList.remove("hidden")
}

id("load-save-wrapper").onclick = () => {
  if (event.target !== id("load-save-wrapper") && event.target !== id("cancel-load-save"))
    return

  saveInputShown = false
  id("load-save-wrapper").classList.add("hidden")
}

id("load-save").onclick = () => {
  var save = id("load-save-input").value

  startGame(JSON.parse(save))

  saveInputShown = false
  id("load-save-wrapper").classList.add("hidden")
}
