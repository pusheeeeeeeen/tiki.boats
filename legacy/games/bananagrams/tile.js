class Tile {
  constructor(board, letter) {
    this.board = board

    this.letter = letter

    this.board.tiles.push(this)
  }

  boardX = null
  boardY = null

  targetX = null
  targetY = null
  lastX = null
  lastY = null

  delete() {
    this.board.tiles[tiles.indexOf(this)] = null
  }

  draw(mode, origX, origY) {
    var posSet = false

    if (mode === "placed")
      [this.targetX, this.targetY] = this.board.coords(origX, origY)
    else if (mode === "bank") {
      this.targetX = origX
      this.targetY = origY
    } else if (mode === "cursor") {
      var roundX = Math.floor(origX), roundY = Math.floor(origY)

      if (roundX >= 0 && roundY >= 0 && roundX < this.board.sizeX && roundY < this.board.sizeY) {
        [this.targetX, this.targetY] = this.board.coords(roundX + 0.1, roundY + 0.1)

        this.boardX = roundX
        this.boardY = roundY
        posSet = true
      } else
        [this.targetX, this.targetY] = this.board.coords(origX, origY)
    }

    if (!posSet) this.boardX = this.boardY = null

    this.lastX ??= this.targetX
    this.lastY ??= this.targetY

    var x = this.targetX, y = this.targetY, s = this.board.coords(0, 0)[2]
    
    if (this.targetX !== this.lastX) {
      this.lastX = x = clamp(
        this.lastX + (this.targetX - this.lastX) * 0.4 + (this.targetX < this.lastX ? -2 : 2),
        this.targetX < this.lastX ? this.targetX : null,
        this.targetX > this.lastX ? this.targetX : null
      )
    }
    if (this.targetY !== this.lastY) {
      this.lastY = y = clamp(
        this.lastY + (this.targetY - this.lastY) * 0.4 + (this.targetY < this.lastY ? -2 : 2),
        this.targetY < this.lastY ? this.targetY : null,
        this.targetY > this.lastY ? this.targetY : null
      )
    }

    ctx.fillStyle = "#deba66"
    ctx.strokeStyle = "#b08e3e"
    
    ctx.fillRect(x, y, s, mode === "cursor" ? s * 1.1 : s)

    var borderW = this.board.borderWidth
    ctx.strokeRect(x + borderW * 0.5, y + borderW * 0.5, s - borderW, s - borderW)

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "black"
    ctx.font = s * 0.7 + "px Arial, sans-serif"

    ctx.fillText(this.board.formatLetter(this.letter), x + s * 0.5, y + s * 0.5)
  }
}
