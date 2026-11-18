const colorShorthands = {
  w : "white",
  b : "black"
}
const pieceShorthands = {
  p : "pawn",
  r : "rook",
  n : "knight",
  b : "bishop",
  q : "queen",
  k : "king"
}
const pawnDirections = {
  white : -1,
  black : 1
}

const maxMovement = 10

function canEnPassant(piece, board, xDir, yDir) {
  let enPassantPiece = board.getTile(piece.x + xDir, piece.y - yDir)?.piece

  return enPassantPiece?.canEnPassant && enPassantPiece.color !== piece.color
}

const pieceMovements = {
  pawn : (piece, board) => {
    let dir = pawnDirections[piece.color],
        movements = []

    if (board.vacantTile(piece.x, piece.y + 2 * dir)) {
      movements.push([[0, 2 * dir]])

      let onStartingSquare = (board.setup[piece.y][piece.x] || "")[1] === "p"

      if (onStartingSquare && board.vacantTile(piece.x, piece.y + 4 * dir))
        movements.push([[0, 4 * dir]])
    }

    let captureLeft = board.getTile(piece.x - 1, piece.y + dir)?.piece,
        captureRight = board.getTile(piece.x + 1, piece.y + dir)?.piece

    if ((captureLeft && captureLeft.color !== piece.color) || canEnPassant(piece, board, -1, dir))
      movements.push([[-1, dir]])
    if ((captureRight && captureRight.color !== piece.color) || canEnPassant(piece, board, 1, dir))
      movements.push([[1, dir]])

    return movements
  },
  rook : [
    Array(maxMovement).fill().map((_, i) => [ 0,     -2 * (i + 1)]), // up
    Array(maxMovement).fill().map((_, i) => [ 0,      2 * (i + 1)]), // down
    Array(maxMovement).fill().map((_, i) => [ i + 1, -i - 1      ]), // up right
    Array(maxMovement).fill().map((_, i) => [ i + 1,  i + 1      ]), // down right
    Array(maxMovement).fill().map((_, i) => [-i - 1, -i - 1      ]), // up left
    Array(maxMovement).fill().map((_, i) => [-i - 1,  i + 1      ])  // down left
  ],
  knight : [
    [[-1, -5]],
    [[ 1, -5]],
    [[ 2, -4]],
    [[ 3, -1]],
    [[ 3,  1]],
    [[ 2,  4]],
    [[ 1,  5]],
    [[-1,  5]],
    [[-2,  4]],
    [[-3,  1]],
    [[-3, -1]],
    [[-2, -4]],
  ],
  bishop : [
    Array(maxMovement).fill().map((_, i) => [-2 * (i + 1), 0          ]), // left
    Array(maxMovement).fill().map((_, i) => [ 2 * (i + 1), 0          ]), // right
    Array(maxMovement).fill().map((_, i) => [-i - 1,      -3 * (i + 1)]), // up left
    Array(maxMovement).fill().map((_, i) => [ i + 1,      -3 * (i + 1)]), // up right
    Array(maxMovement).fill().map((_, i) => [-i - 1,       3 * (i + 1)]), // down left
    Array(maxMovement).fill().map((_, i) => [ i + 1,       3 * (i + 1)])  // down right
  ],
  king : [
    [[ 0, -2]],
    [[ 1, -1]],
    [[ 1,  1]],
    [[ 0,  2]],
    [[-1,  1]],
    [[-1, -1]],
    [[-1, -3]],
    [[ 1, -3]],
    [[ 2,  0]],
    [[ 1,  3]],
    [[-1,  3]],
    [[-2,  0]]
  ]
}

pieceMovements.queen = pieceMovements.rook.concat(pieceMovements.bishop)

class Piece {
  constructor(board, type, x, y) {
    this.board = board

    this.type = type

    this.color = colorShorthands[type[0]]
    this.piece = pieceShorthands[type[1]]

    this.oldX = this.x = x
    this.oldY = this.y = y
  }

  get img() {
    return images[this.type]
  }

  dragging = false

  startDrag() {
    this.dragging = true

    this.board.draggingPiece = this
  }

  endDrag() {
    this.dragging = false

    this.board.draggingPiece = null
  }

  get movementData() {
    let data = pieceMovements[this.piece]

    if (typeof data === "function")
      return data(this, this.board)
    else
      return data
  }

  getPotentialMoves() {
    return this.movementData.map(x => x.map(([x, y]) => [x + this.x, y + this.y]))
  }

  getLegalMoves(checkInCheck = true) {
    let moves = this.getPotentialMoves().map(moves => {
      for (let i in moves) {
        let tile = this.board.getTile(...moves[i])

        if (!tile || tile.piece?.color === this.color)
          return moves.slice(0, i)
        else if (tile.piece && tile.piece.color !== this.color)
          return moves.slice(0, parseInt(i) + 1)
      }

      return moves.slice()
    }).flat()

    if (!checkInCheck) return moves

    return moves.filter(([x, y]) => {
      this.tempMoveTo(x, y)

      let inCheck = this.board.inCheck(this.color)

      this.undoTempMove()

      return !inCheck
    })
  }

  fromX = null
  fromY = null
  replacedPiece = null

  tempMoveTo(x, y) {
    this.board.getTile(this.x, this.y).piece = null

    let targetTile = this.board.getTile(x, y)

    this.fromX = this.x
    this.fromY = this.y
    this.replacedPiece = targetTile.piece
    
    targetTile.piece = this
    this.x = targetTile.x
    this.y = targetTile.y
  }

  undoTempMove() {
    this.board.getTile(this.x, this.y).piece = this.replacedPiece

    this.x = this.fromX
    this.y = this.fromY

    this.board.getTile(this.x, this.y).piece = this
  }

  canMove(x, y, checkInCheck = true) {
    if (this === this.board.selectedTile?.piece && checkInCheck)
      return this.board.getTile(x, y).canMoveTo
    else
      return this.getLegalMoves(checkInCheck).some(loc => loc[0] === x && loc[1] === y)
  }

  attemptMove(x, y, animate = true) {
    if (!this.canMove(x, y)) return false

    this.board.getTile(this.x, this.y).piece = null

    let targetTile = this.board.getTile(x, y)

    let captured = targetTile.piece
    targetTile.piece?.capture(animate)
    
    targetTile.piece = this

    let pauseMoveCompletion = false

    if (this.piece === "pawn") {
      // en passant-ee
      if (Math.abs(y - this.y) === 4)
        this.canEnPassant = "new"
  
      // en passant-er
      if (!captured && x !== this.x) {
        let tile = board.getTile(x, this.y * 2 - y)
        
        tile.piece.capture(animate)
        tile.piece = null
      }

      // promotion
      if (!board.getTile(x, y + 2 * Math.sign(y - this.y))) {
        pauseMoveCompletion = true

        let sx = this.x, sy = this.y

        this.board.onPromotionChosen = pieceShorthand => {
          this.type = this.type[0] + pieceShorthand
          this.piece = pieceShorthands[pieceShorthand]

          this.board.moved(sx, sy, x, y)
        }

        this.board.showPromotion(x, y, this.color)
      }
    }

    if (!pauseMoveCompletion)
      this.board.moved(this.x, this.y, x, y)
      
    this.x = x
    this.y = y

    if (animate) this.glideProgress = 0

    return true
  }

  canEnPassant = false

  opacity = 1
  captured = false

  capture(animate = true) {
    this.captured = true

    if (animate) this.board.fadingPiece = this
    else this.opacity = 0
  }

  glideProgress = 1
  animSpeed = 0.125

  tick() {
    if (this.dragging) {
      this.visualX = this.board.mouseX
      this.visualY = this.board.mouseY
    } else {
      let prog = this.glideProgress,
          invProg = 1 - prog;
      
      [this.visualX, this.visualY] = this.board.screenPos(this.x * prog + this.oldX * invProg, this.y * prog + this.oldY * invProg)
    }

    if (this.captured && this.opacity > 0) {
      this.opacity -= this.animSpeed

      if (this.opacity <= 0)
        this.board.fadingPiece = null
    }

    this.glideProgress += this.animSpeed

    if (this.glideProgress >= 1) {
      this.glideProgress = 1

      this.oldX = this.x
      this.oldY = this.y
    }
  }

  draw(dragging = false) {
    if (!dragging && this === this.board.draggingPiece) return

    let size = this.board.hexSize * 0.9

    if (dragging) {
      ctx.shadowColor = "#0004"
      ctx.shadowBlur = this.board.hexSize * 0.4
      ctx.shadowOffsetY = 10
    }

    ctx.globalAlpha = this.opacity

    ctx.drawImage(this.img, this.visualX - size / 2, this.visualY - size / 2, size, size)

    if (dragging) {
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }

    ctx.globalAlpha = 1
  }
}
