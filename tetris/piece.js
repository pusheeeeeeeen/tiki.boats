class Piece {
  constructor(board, type, x = null, y = null) {
    this.board = board

    this.type = type
    this.data = pieces[type]

    this.w = this.data.layout[0].length
    this.h = this.data.layout.length

    this.x = x ?? Math.floor(board.w / 2) - 2 + (this.data.xOffset || 0)
    this.y = y ?? -2 - this.lowestTile()

    this.createTiles()
  }

  forEach(callback) {
    for (let i of this.layout)
      for (let j of i)
        if (j) callback(j)
  }

  createTiles() {
    this.layout = []

    this.data.layout.forEach((rowData, y) => {
      let row = this.layout[y] = []

      rowData.forEach((isTile, x) => {
        row[x] = isTile ? new Tile(this, x, y) : null
      })
    })
  }

  lowestTile(x = null) {
    if (x === null)
      return Math.max(...Array.from({length : this.w}, (_, i) => this.lowestTile(i)))
    else
      return (this.layout || this.data.layout).findLastIndex(row => row[x])
  }

  rotation = 0

  setRotation(rot, updateTileCoords = true) {
    if (rot === this.rotation) return

    this.rotate(rot - this.rotation, updateTileCoords)
  }

  rotate(angle, updateTileCoords = true) {
    angle %= 4
    if (angle < 0) angle += 4

    this.rotation = (this.rotation + angle) % 4

    if (angle === 1)
      this.layout = Array.from({length : this.layout.length}, (_, i) => this.layout.slice().reverse().map(x => x[i]))
    else if (angle === 3)
      this.layout = Array.from({length : this.layout.length}, (_, i) => this.layout.map(x => x[this.h - i - 1]))
    else if (angle === 2)
      this.layout.reverse().forEach(x => x.reverse())

    if (updateTileCoords)
      this.updateTileCoords()
  }

  attemptRotate(angle, applyKickTable = true) {
    let {rotation} = this

    this.rotate(angle)

    if (!this.overlapsBoard()) return true

    if (!applyKickTable) {
      this.rotate(-angle)
      return false
    }

    let kickType = [null, "cw", "oneEighty", "ccw"][angle < 0 ? angle % 4 + 4 : angle % 4],
        kickTable = (this.type in kickTables[this.board.kickTable] && kickTables[this.board.kickTable][this.type][kickType])
          || kickTables[this.board.kickTable].default[kickType]

    if (kickTable)
      for (let i of kickTable[rotation])
        if (this.attemptMove(...i))
          return true

    this.rotate(-angle)
    return false
  }

  updateTileCoords() {
    this.layout.forEach((row, y) => row.forEach((tile, x) => {
      if (!tile) return

      tile.x = x
      tile.y = y
    }))
  }

  place(x = this.x, y = this.y) {
    this.forEach(x => x.detach())
  }

  overlapsBoard() {
    for (let i of this.layout)
      for (let j of i)
        if (j && (!this.board.inBoard(j.boardX, j.boardY) || this.board.getTile(j.boardX, j.boardY).tile))
          return true

    return false
  }

  canMove(xMove, yMove) {
    this.x += xMove
    this.y += yMove

    let canMove = !this.overlapsBoard()

    this.x -= xMove
    this.y -= yMove

    return canMove
  }

  attemptMove(xMove, yMove) {
    this.x += xMove
    this.y += yMove

    if (this.overlapsBoard()) {
      this.x -= xMove
      this.y -= yMove

      return false
    }

    return true
  }

  fall() {
    return this.attemptMove(0, 1)
  }

  color = null

  draw() {
    this.forEach(x => x.draw())
  }
}

class Tile {
  constructor(piece, x, y) {
    if (piece instanceof Piece)
      this.piece = piece

    this.board = piece.board
    this.data = piece.data

    this.x = x
    this.y = y
  }

  detach(addToBoard = true) {
    this.x += this.piece.x
    this.y += this.piece.y

    this.piece = null

    if (addToBoard)
      this.board.getTile(this.x, this.y).tile = this
  }

  get boardX() { return this.x + (this.piece?.x || 0) }
  get boardY() { return this.y + (this.piece?.y || 0) }

  draw() {
    let [x, y] = this.board.screenPos(this.boardX, this.boardY),
        {tileSize} = this.board,
        drawHighlight = !this.board.getTile(this.boardX, this.boardY - 1)?.tile && (
          !this.piece || !this.y || !this.piece.layout[this.y - 1][this.x]
        ),
        highlight = drawHighlight ? 0.15 : 0

    ctx.fillStyle = `rgb(${(this.piece?.color || this.data.color).join()})`
    ctx.fillRect(x, y - tileSize * highlight, tileSize, tileSize * (highlight + 1))

    let lockPercentage = board.fallingPieceLockTimes[board.currentFallingPieceLockTimeIndex] / board.lockTime

    if (this.piece && this.board.fallingPiece === this.piece && lockPercentage) {
      ctx.fillStyle = lockPercentage > 0.5
        ? `rgba(0, 0, 0, ${(lockPercentage - 0.5) / 3})`
        : `rgba(255, 255, 255, ${(0.5 - lockPercentage) / 4})`

      ctx.fillRect(x, y - tileSize * highlight, tileSize, tileSize * (highlight + 1))
    }

    if (drawHighlight) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
      ctx.fillRect(x, y, tileSize, -tileSize * highlight)
    }
  }
}
