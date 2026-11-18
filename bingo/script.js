let boardSize = 5

onresize = updateBoardSize

function updateBoardSize() {
  let size = Math.min(
    id("board-wrapper").offsetWidth,
    id("board-wrapper").offsetHeight
  )

  id("board").style.width = size + "px"
}

updateBoardSize()
addEventListener("DOMContentLoaded", updateBoardSize)
onload = updateBoardSize

let maxFontSize = 28, minFontSize = 6

function createBoardTiles() {
  id("board").innerHTML = ""
  id("board").style.setProperty("--grid-size", boardSize)
  
  for (let i = 0; i < boardSize ** 2; i++) {
    let tile = createElem("div.tile"), inner = createElem("div.tile-inner")
    try {
      inner.contentEditable = "plaintext-only"
    } catch {
      // firefox
      inner.contentEditable = "true"
    }
    inner.spellcheck = false
    inner.dataset.size = maxFontSize
    inner.style.fontSize = maxFontSize + "px"

    if (i == boardSize ** 2 / 2 - 0.5) {
      inner.dataset.center = ""
    }
    
    tile.onclick = () => inner.focus()
    inner.oninput = () => updateFontSize(tile, inner)

    tile.append(inner)
    
    id("board").append(tile)
  }
}

createBoardTiles()

function updateFontSize(tile, inner) {
  let size = parseInt(inner.dataset.size)
  
  while (tile.offsetHeight > inner.scrollHeight && size < maxFontSize) {
    inner.style.fontSize = ++size + "px"
  }

  while (tile.offsetHeight < inner.scrollHeight && size > minFontSize) {
    inner.style.fontSize = --size + "px"
  }

  inner.dataset.size = size
}

function shuffle() {
  let shuffleCenter = id("shuffle-center").checked,
      squares = queryAll(shuffleCenter ? ".tile-inner" : ".tile-inner:not([data-center])"),
      text = squares.map(x => x.innerText)

  shuffleInPlace(text)

  squares.forEach((x, i) => {
    x.innerText = text[i]
    updateFontSize(x.parentElement, x)
  })
}

id("shuffle").onclick = shuffle

function clear() {
  queryAll(".tile-inner").forEach(x => x.innerHTML = "")
}

id("clear").onclick = clear

id("board-size").oninput = e => {
  enforceNumericalInput(e.target, 2)

  let newSize = parseInt(e.target.value)

  if (!isNaN(newSize) && newSize >= 1 && newSize <= 99) {
    let text = queryAll(".tile-inner").map(x => x.innerText)

    // if we are downsizing, remove blank squares to preserve non-blank values
    if (newSize < boardSize) {
      for (let i = text.length - 1; i >= 0 && text.length > newSize ** 2; i--) {
        if (!text[i].trim()) text.splice(i, 1)
      }
    }

    boardSize = newSize
    createBoardTiles()

    queryAll(".tile-inner").forEach((x, i) => {
      if (x.innerText = text[i] || "") {
        updateFontSize(x.parentElement, x)
      }
    })
  }
}
