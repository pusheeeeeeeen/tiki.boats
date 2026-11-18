var c = id("canvas"), ctx = c.getContext("2d")

class Game {
  constructor(sizeX, sizeY) {
    this.sizeX = sizeX
    this.sizeY = sizeY

    this.createBoard()
    this.setupBank()
  }

  cameraX = 0
  cameraY = 0

  tiles = []

  cursorTiles = []
  cursorTileDirection = 1
  
  bank = Object.fromEntries(Object.keys(letterDistribution).map(x => [x, []]))

  remainingLetters = Object.assign({}, letterDistribution)
  
  squareSize = 30
  get borderWidth() { return this.squareSize / 25 }

  createBoard() {
    this.board = []

    for (let i = 0; i < this.sizeY; i++) {
      var row = []
      
      for (let j = 0; j < this.sizeX; j++)
        row.push(new BoardSquare(this, j, i))

      this.board.push(row)
    }
  }

  setupBank(letters = 21) {
    var allLetters = []
    
    for (let [letter, count] of Object.entries(this.remainingLetters))
      for (let i = 0; i < count; i++)
        allLetters.push(letter)
    
    for (let i = 0; i < letters; i++) {
      var letter = allLetters.splice(Math.trunc(Math.random() * allLetters.length), 1)[0]

      this.remainingLetters[letter]--

      this.bank[letter].push(new Tile(this, letter))
    }
  }

  validateBoard() {
    for (let i in this.board)
      for (let j in this.board[i]) {
        var tile = this.board[i][j].tile

        if (!tile) continue
        
        var x = parseInt(j), y = parseInt(i),
            neighbors = [
              this.board[y - 1][x],
              this.board[y][x + 1],
              this.board[y + 1][x],
              this.board[y][x - 1]
            ]

        if (!neighbors.find(x => x.tile)) return false

        var isVertical = false,
          isWordStart =
          (neighbors[2].tile && !neighbors[0].tile) ||
          (neighbors[1].tile && !neighbors[3].tile)

        if (!isWordStart) continue

        console.log(tile.letter)
      }

    return true
  }

  validateTiles(tiles) {
    return validateWord(tiles.map(x => x.letter.replace("wild", ".")).join(""))
  }

  validateWord(word) {
    return new RegExp("\n" + word + "\n").test(dictionary)
  }

  shiftDown = false
  optionDown = false
  keypress(key) {
    if (key === "ShiftLeft") this.shiftDown = true
    else if (key === "AltLeft") this.optionDown = true
    else if (key.startsWith("Key")) this.typeLetter(key.slice(3).toLowerCase())
    else if (key === "Space") this.cursorTiles.push(null)
    else if (key === "Backspace") this.delete()
    else if (key === "Comma") this.cursorTileDirection = 2
    else if (key === "Period") this.cursorTileDirection = 1
    else if (key === "Slash") this.cursorTileDirection = (this.cursorTileDirection + 2) % 4
    else if (key === "Escape") this.clearWord()
  }
  
  keyup(key) {
    if (key === "ShiftLeft") this.shiftDown = false
    else if (key === "AltLeft") this.optionDown = false
  }

  typeLetter(letter) {
    if (this.bank[letter].length)
      this.cursorTiles.push(this.bank[letter].pop())
    else if (this.bank.wild.length)
      this.cursorTiles.push(this.bank.wild.pop())
  }

  delete() {
    var tile = this.cursorTiles.pop()
    
    this.bank[tile.letter].push(tile)
  }

  clearWord() {
    while (this.cursorTiles.length) this.delete()
  }

  click() {
    if (this.cursorTiles.length) {
      this.cursorTiles.forEach((tile, i) => {
        if (tile && tile.boardX !== null) {
          var boardSquare = this.board[tile.boardY][tile.boardX]
          
          if (this.shiftDown)
            [boardSquare.tile, this.cursorTiles[i]] = [tile, boardSquare.tile]
          else if (!boardSquare.tile) {
            boardSquare.tile = tile
            this.cursorTiles[i] = null
          }
        }
      })

      if (this.optionDown) this.cursorTiles = this.cursorTiles.filter(Boolean)
      else {
        while (this.cursorTiles[0] === null) this.cursorTiles.shift()
        while (this.cursorTiles[this.cursorTiles.length - 1] === null) this.cursorTiles.pop()
      }
    }
  }

  coords(x, y) {
    var s = this.squareSize

    return [
      (x - this.cameraX) * (s + this.borderWidth) + (innerWidth - this.sizeX * s) * 0.5,
      (y - this.cameraY) * (s + this.borderWidth),
      s
    ]
  }

  inverseCoords(x, y, s = this.squareSize) {
    return [
      (x - (innerWidth - this.sizeX * s) * 0.5) / (s + this.borderWidth) + this.cameraX,
      y / (s + this.borderWidth) + this.cameraY
    ]
  }

  formatLetter(letter) {
    return letter === "wild" ? "🐒" : letter.toUpperCase()
  }

  draw() {
    ctx.lineWidth = this.borderWidth
    
    for (let i of this.board)
      for (let j of i)
        j.draw()

    var highestCount = Math.max(...Object.values(this.bank).map(x => x.length)),
        bankColumns = Object.keys(this.bank).length

    ctx.fillStyle = "#888a8c"
    var bankHeight = height - this.squareSize - highestCount * this.squareSize * 0.25 - 20
    ctx.fillRect(0, bankHeight, width, bankHeight)

    ctx.fillStyle = "#686a6c"
    ctx.fillRect(0, bankHeight, width, 2)

    var x, y
    
    for (let [letter, tiles] of Object.entries(this.bank)) {
      x = width / (bankColumns + 3) * (Object.keys(this.bank).indexOf(letter) + 1)
      y = bankHeight + tiles.length * this.squareSize * 0.25 + 8

      if (tiles.length)
        for (let i in tiles)
          tiles[i].draw("bank", x + (tiles.length - 1 - i) * this.squareSize * 0.1, y - i * this.squareSize * 0.25)
      else {
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        ctx.fillStyle = "#b8babc"
        ctx.fillText(this.formatLetter(letter), x + this.squareSize * 0.5, y + this.squareSize * 0.75 - tiles.length * this.squareSize * 0.25)
      }
    }

    x = width / (bankColumns + 3) * (bankColumns + 1)
    y = bankHeight + 8

    ctx.strokeStyle = "red"
    ctx.strokeRect(x, y, this.squareSize, this.squareSize)

    var mousePos = this.inverseCoords(mouseX, mouseY),
          wordDirection = [
            [ 0, -1],
            [ 1,  0],
            [ 0,  1],
            [-1,  0]
          ][this.cursorTileDirection]

    for (let i in this.cursorTiles) {
      var x = mousePos[0] + wordDirection[0] * parseInt(i),
          y = mousePos[1] + wordDirection[1] * parseInt(i)
      
      if (this.cursorTiles[i]) this.cursorTiles[i].draw("cursor", x, y)
      else {
        var screenX, screenY, s

        if (x >= 0 && y >= 0 && x < this.sizeX && y < this.sizeY)
          [screenX, screenY, s] = this.coords(Math.floor(x) + 0.35, Math.floor(y) + 0.35)
        else
          [screenX, screenY, s] = this.coords(x + 0.25, y + 0.25)

        ctx.strokeStyle = "#b8babc"
        ctx.strokeRect(screenX, screenY, s * 0.5, s * 0.5)
      }
    }
  }
}

class BoardSquare {
  constructor(board, x, y) {
    this.board = board
    
    this.x = x
    this.y = y
  }

  tile = null

  coords() { return this.board.coords(this.x, this.y) }

  draw() {
    var [x, y, s] = this.coords()

    ctx.fillStyle = "#d8dadc"
    ctx.strokeStyle = "#b8babc"
    
    ctx.strokeRect(x, y, s, s)
    ctx.fillRect(x, y, s, s)

    this.tile?.draw("placed", this.x, this.y)
  }
}

var GAME = new Game(30, 20)

function draw() {
  ctx.fillStyle = "#888a8c"
  ctx.fillRect(0, 0, c.width, c.height)

  if (!dictionaryLoaded) {
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom"

    ctx.font = "20px Arial"
    ctx.fillText("Loading Dictionary…", width * 0.5, height * 0.5)
  } else
    GAME?.draw()
}

var width, height
function updateFullscreen() {
  width = $("main").offsetWidth
  height = $("main").offsetHeight

  c.style.width = width + "px"
  c.style.height = height + "px"

  c.width = ~~(width * devicePixelRatio)
  c.height = ~~(height * devicePixelRatio)

  ctx.scale(devicePixelRatio, devicePixelRatio)

  ctx.imageSmoothingEnabled = false
}

onload = () => {
  updateFullscreen()
  frame()
}

onresize = () => {
  updateFullscreen()
  draw()
}

function frame() {
  requestAnimationFrame(frame)
  
  draw()
}

var dictionary, dictionaryLoaded = false, dictFile = new XMLHttpRequest()
dictFile.open("GET", "./dictionary.txt", true)

dictFile.onreadystatechange = () => {
  if (dictFile.readyState === 4) {
    dictionary = "\n" + dictFile.responseText + "\n"

    dictionaryLoaded = true
  }
}
dictFile.send()

onkeydown = event => {
  if (!event.metaKey && !event.repeat) GAME?.keypress(event.code)
}
onkeyup = event => {
  if (!event.metaKey) GAME?.keyup(event.code)
}

var mouseX = 0, mouseY = 0
c.onmousemove = event => {
  mouseX = event.offsetX
  mouseY = event.offsetY
}

c.onclick = () => { GAME?.click() }
