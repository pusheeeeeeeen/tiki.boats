class Tile {
  constructor(board, x, y) {
    this.board = board
    
    this.x = x
    this.y = y * 2 + (board.boardSize - x) - board.size

    this.rawY = y

    this.color = ["boardDark", "boardMid", "boardLight"][this.y % 3]

    let piece = board.setup[this.y][this.x]
    this.piece = piece ? new Piece(board, piece, this.x, this.y) : null
  }

  pointInside(x, y) {
    return ctx.isPointInPath(this.path, x * devicePixelRatio, y * devicePixelRatio)
  }

  tick() {
    this.path = hexagon(this.board, this.x, this.y)

    this.piece?.tick()
  }

  canMoveTo = false

  draw() {
    ctx.fillStyle = colors[this.color]
    
    ctx.fill(this.path)

    if (this.canMoveTo) {
      ctx.beginPath()

      if (this.piece) {
        ctx.arc(...this.board.screenPos(this.x, this.y), this.board.hexSize * 0.45, 0, 2 * Math.PI)

        ctx.strokeStyle = "#0002"
        ctx.lineWidth = this.board.hexSize * 0.1
        ctx.stroke()
      } else {
        ctx.arc(...this.board.screenPos(this.x, this.y), this.board.hexSize * 0.15, 0, 2 * Math.PI)
  
        ctx.fillStyle = "#0002"
        ctx.fill()
      }
    }

    if (this === this.board.selectedTile) {
      ctx.fillStyle = "#ff05"
      ctx.fill(this.path)
    }
  }
}
