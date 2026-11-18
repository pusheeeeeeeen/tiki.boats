class NextPiece extends Piece {
  constructor(board, type, queuePos) {
    super(board, type, board.w + 1, queuePos)

    this.x += this.data.xOffset || 0
    this.y *= this.queueSlotHeight
  }

  queueSlotHeight = 3

  moveUp() {
    this.y -= this.queueSlotHeight
  }

  toPiece() {
    return new Piece(this.board, this.type)
  }
}

class HoldPiece extends Piece {
  constructor(board, type) {
    super(board, type, -5, 0)

    this.x += this.data.xOffset || 0
  }

  toPiece() {
    return new Piece(this.board, this.type)
  }

  disabledHoldColor = [150, 160, 170]

  draw() {
    if (!this.board.canHold)
      this.color = this.disabledHoldColor
    else
      this.color = null

    super.draw()
  }
}

class ShadowPiece extends Piece {
  constructor(piece) {
    super(piece.board, piece.type, piece.x)

    this.piece = piece

    this.updateY()
  }

  setX(x) {
    if (x === this.x) return

    this.x = x

    this.updateY()
  }

  updateY() {
    this.y = this.piece.y

    while (this.attemptMove(0, 1));
  }

  draw() {
    if (this.y === this.piece.y) return

    ctx.globalAlpha = this.board.shadowOpacity

    super.draw()

    ctx.globalAlpha = 1
  }
}

class PreviewPiece extends Piece {
  constructor(board, type, x, y, rot, heightIncrease, first) {
    super(board, type, x, y)

    this.setRotation(rot, false)

    this.first = first

    this.heightIncrease = heightIncrease
  }

  createTiles() {
    this.layout = this.data.layout.map(row => row.slice())
  }

  draw() {
    let {tileSize} = this.board,
        lineWidth = this.first ? 4 : 2

    ctx.strokeStyle = `rgb(${this.data.color.join()})`
    if (this.first)
      ctx.fillStyle = `rgba(${this.data.color.join()}, 0.3)`
    
    ctx.lineWidth = lineWidth

    ctx.globalAlpha = 0.5

    for (let y in this.layout)
      for (let x in this.layout[y]) {
        if (!this.layout[y][x]) continue

        let yPos = parseInt(y) + this.y

        let [screenX, screenY] = this.board.screenPos(parseInt(x) + this.x, yPos - this.heightIncrease[yPos + this.board.h])

        ctx.beginPath()
        ctx.rect(screenX + lineWidth / 2, screenY + lineWidth / 2, tileSize - lineWidth, tileSize - lineWidth)

        ctx.stroke()
        if (this.first) ctx.fill()
      }

    ctx.globalAlpha = 1
  }
}
